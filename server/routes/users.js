import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import db, { dbUserToFrontend, dbEmailToFrontend, dbAppToFrontend } from '../db.js';
import { requireAuth, requireRole, requireSelfOrRole } from '../middleware/auth.js';
import { EMAIL_TYPES, HOUSE_EMAIL_THEMES } from '../email/emailTemplates.js';
import {
  deliverTransactionalEmail,
  getUserEmailDeliveries,
  queueTransactionalEmail
} from '../email/transactionalEmailService.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const router = Router();

function toDirectoryUser(row) {
  const user = dbUserToFrontend(row);
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    house: user.house,
    title: user.title,
    avatar: user.avatar,
    departmentName: user.departmentName,
    classYear: user.classYear
  };
}

// GET /api/users — all users (zalogowani)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(rows.map(row => {
    if (req.user.role !== 'admin' && row.id !== req.user.id) return toDirectoryUser(row);
    return {
      ...dbUserToFrontend(row),
      ...(req.user.role === 'admin' ? { transactionalEmails: getUserEmailDeliveries(db, row.id) } : {})
    };
  }));
});

// GET /api/users/:id — single user (zalogowani)
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  if (req.user.role !== 'admin' && row.id !== req.user.id) return res.json(toDirectoryUser(row));
  res.json({
    ...dbUserToFrontend(row),
    ...(req.user.role === 'admin' ? { transactionalEmails: getUserEmailDeliveries(db, row.id) } : {})
  });
});

// PATCH /api/users/:id — update user profile
// Wymaga: zalogowany + (edytuje siebie LUB jest adminem)
// Uczniowie i profesorowie mogą edytować TYLKO swoje dozwolone pola
router.patch('/:id', requireAuth, requireSelfOrRole('admin'), (req, res) => {
  const fields = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (fields.house !== undefined && existing.role !== 'student') {
    return res.status(400).json({
      error: 'Zakon może zostać przypisany wyłącznie adeptowi. Kadra i Dyrekcja nie należą do Zakonów.'
    });
  }

  // Pola dozwolone per rola
  const STUDENT_FIELDS = [
    'name', 'surname', 'full_name', 'email', 'avatar',
    'gender', 'origin', 'wand', 'patronus', 'companion',
    'appearance', 'backstory'
  ];

  const PROFESSOR_FIELDS = [
    ...STUDENT_FIELDS,
    'office', 'specialization', 'signature_png'
  ];

  const ADMIN_FIELDS = [
    ...PROFESSOR_FIELDS,
    'house', 'title', 'level', 'xp', 'points', 'currency',
    'class_year'
  ];

  // Określ dozwolone pola na podstawie roli EDYTUJĄCEGO (req.user)
  let allowedFields;
  if (req.user.role === 'admin') {
    allowedFields = ADMIN_FIELDS;
  } else if (req.user.role === 'professor') {
    allowedFields = PROFESSOR_FIELDS;
  } else {
    allowedFields = STUDENT_FIELDS;
  }

  // Build dynamic SET clause
  const updates = [];
  const values = [];

  // camelCase → snake_case mappings
  if (fields.fullName !== undefined && fields.full_name === undefined) {
    fields.full_name = fields.fullName;
  }
  if (fields.signaturePng !== undefined && fields.signature_png === undefined) {
    fields.signature_png = fields.signaturePng;
  }
  // If name and surname are passed, auto-compute full_name if not explicitly set
  if (fields.name && fields.surname && !fields.full_name) {
    fields.full_name = `${fields.name.trim()} ${fields.surname.trim()}`;
  }

  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  // Handle JSON fields — tylko admin może modyfikować grades, inventory, taughtSubjectIds
  if (req.user.role === 'admin') {
    if (fields.grades !== undefined) { updates.push('grades = ?'); values.push(JSON.stringify(fields.grades)); }
    if (fields.inventory !== undefined) { updates.push('inventory = ?'); values.push(JSON.stringify(fields.inventory)); }
    if (fields.taughtSubjectIds !== undefined) { updates.push('taught_subject_ids = ?'); values.push(JSON.stringify(fields.taughtSubjectIds)); }
  }

  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(dbUserToFrontend(updated));
});

// PATCH /api/users/:id/approve — approve user + send acceptance email
// Wymaga: admin
router.patch('/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });

  const user = dbUserToFrontend(row);
  if (user.status === 'approved') {
    const archived = db.prepare(
      "SELECT * FROM emails WHERE delivery_id = ?"
    ).get(`txmail-${EMAIL_TYPES.ACCOUNT_APPROVED}-${user.id}`);
    return res.json({
      user: { ...user, transactionalEmails: getUserEmailDeliveries(db, user.id) },
      email: dbEmailToFrontend(archived),
      emailDelivery: getUserEmailDeliveries(db, user.id)[EMAIL_TYPES.ACCOUNT_APPROVED] || null,
      alreadyApproved: true
    });
  }
  if (user.status !== 'pending') {
    return res.status(409).json({ error: `Konto nie oczekuje na akceptację (status: ${user.status}).` });
  }
  if (user.role === 'student' && !HOUSE_EMAIL_THEMES[String(user.house || '').toLowerCase()]) {
    return res.status(422).json({ error: 'Nie można zatwierdzić adepta bez prawidłowego Zakonu z Rytuału Przydziału.' });
  }

  const newTitle = user.role === 'professor'
    ? `Profesor • ${user.departmentName}`
    : `Adept Zakonu ${HOUSE_EMAIL_THEMES[user.house].name}`;
  const now = new Date();
  const adminName = req.user.fullName || 'Rada Arcymistrzów';

  const approvePendingUser = db.transaction(() => {
    const update = db.prepare(
      "UPDATE users SET status = 'approved', title = ? WHERE id = ? AND status = 'pending'"
    ).run(newTitle, req.params.id);
    if (update.changes !== 1) throw new Error('Konto zostało już rozpatrzone przez inną operację.');

    if (user.role === 'student') {
      db.prepare("INSERT OR IGNORE INTO character_prologues (user_id, stage, completed, accepted_at) VALUES (?, 'LETTER_PENDING', 0, datetime('now'))").run(req.params.id);
      db.prepare("UPDATE character_prologues SET accepted_at = COALESCE(accepted_at, datetime('now')), updated_at = datetime('now') WHERE user_id = ?").run(req.params.id);
      queueTransactionalEmail(db, row, EMAIL_TYPES.ACCOUNT_APPROVED);
    }

    db.prepare("UPDATE pending_applications SET status = 'approved' WHERE user_id = ? AND status = 'pending'").run(req.params.id);

    // Professor: auto-approve pending subject applications and create assignments
    if (user.role === 'professor') {
      const pendingApps = db.prepare(
        `SELECT * FROM professor_subject_applications WHERE professor_id = ? AND status = 'pending'`
      ).all(req.params.id);

      const schoolYear = db.prepare("SELECT value FROM school_config WHERE key = 'school_year'").get()?.value || 'XIX Rok Szkolny (2026/2027)';

      for (const app of pendingApps) {
        db.prepare(`
          UPDATE professor_subject_applications
          SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).run(adminName, app.id);

        db.prepare(`
          INSERT OR IGNORE INTO teacher_subject_assignments (id, professor_id, subject_id, role, school_year, status, assigned_by)
          VALUES (?, ?, ?, 'primary', ?, 'active', ?)
        `).run(
          `tsa-${req.params.id}-${app.subject_id}`,
          req.params.id,
          app.subject_id,
          schoolYear,
          adminName
        );

        // Set as primary professor if subject has none
        const subject = db.prepare('SELECT professor_id FROM subjects WHERE id = ?').get(app.subject_id);
        if (subject && !subject.professor_id) {
          db.prepare('UPDATE subjects SET professor_id = ?, professor_name = ? WHERE id = ?')
            .run(req.params.id, user.fullName, app.subject_id);
        }
      }

      // Sync taught_subject_ids convenience column
      const assignedIds = db.prepare(
        `SELECT subject_id FROM teacher_subject_assignments WHERE professor_id = ? AND status = 'active'`
      ).all(req.params.id).map(r => r.subject_id);
      db.prepare('UPDATE users SET taught_subject_ids = ? WHERE id = ?')
        .run(JSON.stringify(assignedIds), req.params.id);
    }

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, admin, action, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${randomUUID()}`,
      now.toISOString(),
      adminName,
      `Zatwierdzono podanie (${user.role}): ${user.fullName}`,
      user.role === 'student'
        ? `Zakolejkowano oficjalny list przyjęcia na adres: ${user.email}`
        : 'Zatwierdzono nominację profesorską; list przyjęcia adepta nie ma zastosowania.'
    );
  });

  try {
    approvePendingUser();
  } catch (error) {
    if (String(error?.message || '').includes('już rozpatrzone')) {
      const current = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
      return res.json({
        user: { ...current, transactionalEmails: getUserEmailDeliveries(db, current.id) },
        emailDelivery: getUserEmailDeliveries(db, current.id)[EMAIL_TYPES.ACCOUNT_APPROVED] || null,
        alreadyApproved: current.status === 'approved'
      });
    }
    throw error;
  }

  const deliveryResult = user.role === 'student'
    ? await deliverTransactionalEmail({ database: db, userId: user.id, emailType: EMAIL_TYPES.ACCOUNT_APPROVED })
    : { delivery: null, sent: false, reason: 'not_applicable' };

  const updatedUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  const acceptEmail = deliveryResult.delivery
    ? dbEmailToFrontend(db.prepare('SELECT * FROM emails WHERE delivery_id = ?').get(deliveryResult.delivery.id))
    : null;

  res.json({
    user: { ...updatedUser, transactionalEmails: getUserEmailDeliveries(db, updatedUser.id) },
    email: acceptEmail,
    emailDelivery: deliveryResult.delivery
  });
});

// POST /api/users/:id/transactional-emails/:type/retry — bezpieczna ponowna próba tylko po błędzie
router.post('/:id/transactional-emails/:type/retry', requireAuth, requireRole('admin'), async (req, res) => {
  const type = req.params.type;
  if (!Object.values(EMAIL_TYPES).includes(type)) {
    return res.status(400).json({ error: 'Nieznany typ wiadomości transakcyjnej.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const existingDelivery = getUserEmailDeliveries(db, user.id)[type];
  if (!existingDelivery) {
    return res.status(404).json({ error: 'Nie znaleziono tej wiadomości w rejestrze dostarczeń.' });
  }

  const result = await deliverTransactionalEmail({
    database: db,
    userId: user.id,
    emailType: type,
    retry: true
  });
  if (result.reason === 'cooldown') {
    return res.status(429).json({ error: 'Ponowna próba jest chwilowo zablokowana. Odczekaj co najmniej minutę.', emailDelivery: result.delivery });
  }
  if (result.reason === 'not_failed') {
    return res.status(409).json({ error: 'Ponowna wysyłka jest dostępna wyłącznie dla wiadomości ze statusem błędu.', emailDelivery: result.delivery });
  }
  res.json({ emailDelivery: result.delivery });
});

// PATCH /api/users/:id/reject — Wymaga: admin
router.patch('/:id/reject', requireAuth, requireRole('admin'), (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });

  db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE pending_applications SET status = 'rejected' WHERE user_id = ?").run(req.params.id);

  const user = dbUserToFrontend(row);
  const adminName = req.user.fullName || 'Dyrekcja';

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, admin, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    new Date().toISOString(),
    adminName,
    `Odrzucono podanie: ${user.fullName}`,
    `Zgłoszenie @${user.username} zostało oddalone.`
  );

  res.json({ success: true });
});

// PATCH /api/users/:id/reset-password — Wymaga: admin
router.patch('/:id/reset-password', requireAuth, requireRole('admin'), (req, res) => {
  const { newPassword } = req.body;
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) return res.status(400).json({ error: passwordCheck.error });
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.params.id);
  res.json({ success: true });
});

// GET /api/users/pending/applications — Wymaga: admin
router.get('/pending/applications', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM pending_applications ORDER BY date_submitted DESC').all();
  res.json(rows.map(row => ({
    ...dbAppToFrontend(row),
    transactionalEmails: row.user_id ? getUserEmailDeliveries(db, row.user_id) : {}
  })));
});

// POST /api/users/applications — submit recruitment application (publiczny)
router.post('/applications', (req, res) => {
  const data = req.body;
  if (!data.name || !data.surname) {
    return res.status(400).json({ error: 'Imię i nazwisko są wymagane.' });
  }

  const appId = data.id || `app-${Date.now()}`;
  const userId = data.studentId || data.userId || null;

  db.prepare(`
    INSERT OR IGNORE INTO pending_applications
      (id, user_id, email, name, surname, role, origin, wand, patronus, companion, appearance, backstory, status, date_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', date('now'))
  `).run(
    appId,
    userId,
    data.email || '',
    data.name,
    data.surname,
    data.role || 'student',
    data.origin || '',
    data.wand || '',
    data.patronus || '',
    data.companion || '',
    data.appearance || '',
    data.backstory || ''
  );

  const created = db.prepare('SELECT * FROM pending_applications WHERE id = ?').get(appId);

  res.status(201).json(dbAppToFrontend(created));
});

export default router;
