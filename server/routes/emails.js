import { Router } from 'express';
import db, { dbEmailToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/emails — pobierz emaile (zalogowani, filtrowane po swoich)
router.get('/', requireAuth, (req, res) => {
  // Filtruj emaile — użytkownik widzi tylko swoje (po to_email lub to_name)
  const userEmail = `${req.user.username}@durmstrang.edu`;
  const rows = db.prepare(
    'SELECT * FROM emails WHERE to_email = ? OR to_name = ? ORDER BY date DESC'
  ).all(userEmail, req.user.fullName);

  // Admin widzi wszystkie
  if (req.user.role === 'admin') {
    const allRows = db.prepare('SELECT * FROM emails ORDER BY date DESC').all();
    return res.json(allRows.map(dbEmailToFrontend));
  }

  res.json(rows.map(dbEmailToFrontend));
});

// POST /api/emails — send a new email (tylko admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const data = req.body;
  const emailId = `mail-${Date.now()}`;
  const now = new Date();
  const dateStr = data.date || (now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));

  db.prepare(`
    INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    emailId,
    data.toEmail, data.toName,
    data.from || 'kancelaria@durmstrang.edu',
    data.fromName || 'Kancelaria Cytadeli Durmstrang',
    data.subject, dateStr,
    data.type || 'info',
    data.body
  );

  const row = db.prepare('SELECT * FROM emails WHERE id = ?').get(emailId);
  res.status(201).json(dbEmailToFrontend(row));
});

// PATCH /api/emails/:id/read — mark as read (zalogowani)
router.patch('/:id/read', requireAuth, (req, res) => {
  const email = db.prepare('SELECT id, to_email, to_name FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Wiadomość nie istnieje.' });
  const userEmail = `${req.user.username}@durmstrang.edu`;
  if (req.user.role !== 'admin' && email.to_email !== userEmail && email.to_name !== req.user.fullName) {
    return res.status(403).json({ error: 'Nie możesz zmieniać stanu cudzej wiadomości.' });
  }
  db.prepare('UPDATE emails SET read = 1 WHERE id = ?').run(email.id);
  res.json({ success: true });
});

export default router;
