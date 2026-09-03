import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import db, { dbUserToFrontend, dbEmailToFrontend, dbAppToFrontend } from '../db.js';
import { requireAuth, requireRole, requireSelfOrRole } from '../middleware/auth.js';
import { EMAIL_TYPES } from '../email/emailTemplates.js';
import {
  deliverTransactionalEmail,
  getUserEmailDeliveries
} from '../email/transactionalEmailService.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import {
  approveRecruitmentApplication,
  rejectRecruitmentApplication,
  RecruitmentReviewError
} from '../services/recruitmentReview.js';

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
    classYear: user.classYear,
    points: user.points,
    level: user.level
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
  let result;
  try {
    result = await approveRecruitmentApplication({
      userId: req.params.id,
      reviewerName: req.user.fullName || 'Rada Arcymistrzów'
    });
  } catch (error) {
    if (error instanceof RecruitmentReviewError) {
      if (error.code === 'not_found') return res.status(404).json({ error: 'User not found' });
      if (error.code === 'not_pending') return res.status(409).json({ error: error.message });
      if (error.code === 'invalid_house') return res.status(422).json({ error: error.message });
    }
    throw error;
  }

  const deliveries = getUserEmailDeliveries(db, result.user.id);

  if (result.outcome === 'already_approved') {
    const archived = db.prepare(
      "SELECT * FROM emails WHERE delivery_id = ?"
    ).get(`txmail-${EMAIL_TYPES.ACCOUNT_APPROVED}-${result.user.id}`);
    return res.json({
      user: { ...result.user, transactionalEmails: deliveries },
      email: dbEmailToFrontend(archived),
      emailDelivery: deliveries[EMAIL_TYPES.ACCOUNT_APPROVED] || null,
      alreadyApproved: true
    });
  }

  if (result.outcome === 'already_processed') {
    return res.json({
      user: { ...result.user, transactionalEmails: deliveries },
      emailDelivery: deliveries[EMAIL_TYPES.ACCOUNT_APPROVED] || null,
      alreadyApproved: result.user.status === 'approved'
    });
  }

  const acceptEmail = result.emailDeliveryId
    ? dbEmailToFrontend(db.prepare('SELECT * FROM emails WHERE delivery_id = ?').get(result.emailDeliveryId))
    : null;

  res.json({
    user: { ...result.user, transactionalEmails: deliveries },
    email: acceptEmail,
    emailDelivery: deliveries[EMAIL_TYPES.ACCOUNT_APPROVED] || null
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
  try {
    rejectRecruitmentApplication({
      userId: req.params.id,
      reviewerName: req.user.fullName || 'Dyrekcja'
    });
  } catch (error) {
    if (error instanceof RecruitmentReviewError && error.code === 'not_found') {
      return res.status(404).json({ error: 'User not found' });
    }
    throw error;
  }

  res.json({ success: true });
});

// PATCH /api/users/:id/reset-password — Wymaga: admin
router.patch('/:id/reset-password', requireAuth, requireRole('admin'), (req, res) => {
  const { newPassword } = req.body;
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) return res.status(400).json({ error: passwordCheck.error });
  const hashed = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password = ?, session_version = session_version + 1 WHERE id = ?').run(hashed, req.params.id);
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
  const name = String(data.name || '').trim();
  const surname = String(data.surname || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const role = data.role === 'professor' ? 'professor' : 'student';

  if (!name || !surname) {
    return res.status(400).json({ error: 'Imię i nazwisko są wymagane.' });
  }
  if (name.length > 80 || surname.length > 120) {
    return res.status(400).json({ error: 'Imię lub nazwisko jest zbyt długie.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
  }

  const appId = `app-${randomUUID()}`;

  db.prepare(`
    INSERT OR IGNORE INTO pending_applications
      (id, user_id, email, name, surname, role, origin, wand, patronus, companion, appearance, backstory, status, date_submitted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', date('now'))
  `).run(
    appId,
    null,
    email,
    name,
    surname,
    role,
    String(data.origin || '').trim().slice(0, 200),
    String(data.wand || '').trim().slice(0, 500),
    String(data.patronus || '').trim().slice(0, 200),
    String(data.companion || '').trim().slice(0, 200),
    String(data.appearance || '').trim().slice(0, 2000),
    String(data.backstory || '').trim().slice(0, 10000)
  );

  const created = db.prepare('SELECT * FROM pending_applications WHERE id = ?').get(appId);

  res.status(201).json(dbAppToFrontend(created));
});

export default router;
