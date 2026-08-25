import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { dbUserToFrontend, dbEmailToFrontend, dbAppToFrontend } from '../db.js';
import { requireAuth, requireRole, requireSelfOrRole } from '../middleware/auth.js';

const router = Router();

// GET /api/users — all users (zalogowani)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(rows.map(dbUserToFrontend));
});

// GET /api/users/:id — single user (zalogowani)
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json(dbUserToFrontend(row));
});

// PATCH /api/users/:id — update user profile
// Wymaga: zalogowany + (edytuje siebie LUB jest adminem)
// Uczniowie i profesorowie mogą edytować TYLKO swoje dozwolone pola
router.patch('/:id', requireAuth, requireSelfOrRole('admin'), (req, res) => {
  const fields = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

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
router.patch('/:id/approve', requireAuth, requireRole('admin'), (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });

  const user = dbUserToFrontend(row);
  const newTitle = user.role === 'professor'
    ? `Profesor • ${user.departmentName}`
    : user.house ? `Adept Zakonu ${user.house}` : 'Adept Nowicjusz';

  db.prepare('UPDATE users SET status = ?, title = ? WHERE id = ?').run('approved', newTitle, req.params.id);

  if (user.role === 'student') {
    db.prepare("INSERT OR IGNORE INTO character_prologues (user_id, stage, completed, accepted_at) VALUES (?, 'LETTER_PENDING', 0, datetime('now'))").run(req.params.id);
    db.prepare("UPDATE character_prologues SET accepted_at = COALESCE(accepted_at, datetime('now')), updated_at = datetime('now') WHERE user_id = ?").run(req.params.id);
  }

  // Approve matching application
  db.prepare("UPDATE pending_applications SET status = 'approved' WHERE user_id = ?").run(req.params.id);

  // Dispatch acceptance email
  const userEmail = user.email || `${user.username}@durmstrang.edu`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const emailId = `mail-accept-${Date.now()}`;

  db.prepare(`
    INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'acceptance', ?)
  `).run(
    emailId, userEmail, user.fullName,
    'dyrekcja@durmstrang.edu', 'Arcymistrzyni Valgerda Storm',
    user.role === 'professor'
      ? `[DURMSTRANG] Oficjalny Dekret Nominacji Profesorskiej: ${user.departmentName}`
      : '[DURMSTRANG] Oficjalny List Przyjęcia do Cytadeli Durmstrang!',
    dateStr,
    `Szanowny/a ${user.fullName},

Z radością informujemy, że Dyrekcja Cytadeli Durmstrang oraz Kolegium Mistrzów ZATWIERDZIŁY Twoje podanie!

${user.role === 'professor'
  ? `Zostałeś/aś oficjalnie mianowany/a Profesorem i Kierownikiem w: ${user.departmentName}. Otrzymujesz dostęp do Komnat Wykładowych, prawo oceniania prac adeptów oraz kaligrafowania edyktów Katedry.`
  : `Zostałeś/aś oficjalnie przyjęty/a w poczet adeptów Cytadeli Durmstrang. Twoja pieczęć została odblokowana. Możesz otworzyć wrota szkoły, złożyć przysięgę przed Kamieniem Przeznaczenia i rozpocząć studia nad magią północy.`}

Twoje konto (@${user.username}) jest już w pełni aktywne. Możesz zalogować się do Cytadeli przy użyciu wybranego hasła.

Podpisano Złotą Pieczęcią Paktu 1294,
Arcymistrzyni Valgerda Storm
Dyrektor Cytadeli Durmstrang`
  );

  // Audit log
  const adminName = req.user.fullName || 'Arcymistrzyni Valgerda Storm';
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, admin, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    now.toISOString(),
    adminName,
    `Zatwierdzono podanie (${user.role}): ${user.fullName}`,
    `Wysłano oficjalny list przyjęcia na adres: ${userEmail}`
  );

  const updatedUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  const acceptEmail = dbEmailToFrontend(db.prepare('SELECT * FROM emails WHERE id = ?').get(emailId));

  res.json({ user: updatedUser, email: acceptEmail });
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
  if (!newPassword) return res.status(400).json({ error: 'Podaj nowe hasło.' });
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.params.id);
  res.json({ success: true });
});

// GET /api/users/pending/applications — Wymaga: admin
router.get('/pending/applications', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM pending_applications ORDER BY date_submitted DESC').all();
  res.json(rows.map(dbAppToFrontend));
});

export default router;
