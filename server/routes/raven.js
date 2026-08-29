import { Router } from 'express';
import db, { dbRavenMessageToFrontend } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/raven — List messages for current user (inbox + sent + broadcast)
router.get('/', requireAuth, (req, res) => {
  try {
    const user = req.user;
    const rows = db.prepare(`
      SELECT * FROM raven_messages
      WHERE recipient = 'Wszyscy Kadeci' OR recipient = ? OR sender_id = ? OR LOWER(recipient) = LOWER(?)
      ORDER BY rowid DESC
    `).all(user.fullName, user.id, user.username);
    res.json(rows.map(dbRavenMessageToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wiadomości kruczych: ' + err.message });
  }
});

// POST /api/raven — Send new raven message
router.post('/', requireAuth, (req, res) => {
  try {
    const { recipient, subject, body, tag = 'posłaniec' } = req.body;
    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Odbiorca, temat i treść listu są wymagane.' });
    }
    if (recipient.trim() === 'Wszyscy Kadeci' && req.user.role !== 'admin' && req.user.role !== 'professor') {
      return res.status(403).json({ error: 'Wiadomości do wszystkich kadetów może wysyłać wyłącznie kadra.' });
    }
    if (subject.trim().length > 160 || body.trim().length > 10000) {
      return res.status(400).json({ error: 'Temat lub treść wiadomości są zbyt długie.' });
    }

    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const sender = req.user;

    db.prepare(`
      INSERT INTO raven_messages (
        id, sender_id, sender_name, sender_role, sender_avatar,
        recipient, subject, body, read, starred, tag, date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, datetime('now'))
    `).run(
      id,
      sender.id,
      sender.fullName,
      sender.role === 'admin' ? 'Dyrekcja' : sender.role === 'professor' ? 'Profesor' : 'Adept',
      sender.avatar || '',
      recipient.trim(),
      subject.trim(),
      body.trim(),
      tag
    );

    const created = db.prepare('SELECT * FROM raven_messages WHERE id = ?').get(id);
    res.status(201).json({
      ok: true,
      message: `Pergamin z pieczęcią wysłany do: ${recipient}!`,
      messageData: dbRavenMessageToFrontend(created)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd wysyłania listu: ' + err.message });
  }
});

// PATCH /api/raven/:id/read — Mark message as read
router.patch('/:id/read', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const msg = db.prepare('SELECT * FROM raven_messages WHERE id = ?').get(id);
    if (!msg) return res.status(404).json({ error: 'Wiadomość nie istnieje.' });

    const isRecipient = msg.recipient === req.user.fullName || msg.recipient.toLowerCase() === req.user.username.toLowerCase();
    if (!isRecipient && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak dostępu do tej wiadomości.' });
    }

    db.prepare('UPDATE raven_messages SET read = 1 WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd oznaczania wiadomości: ' + err.message });
  }
});

// PATCH /api/raven/:id/star — Toggle star
router.patch('/:id/star', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const msg = db.prepare('SELECT * FROM raven_messages WHERE id = ?').get(id);
    if (!msg) return res.status(404).json({ error: 'Wiadomość nie istnieje.' });

    const isRecipient = msg.recipient === req.user.fullName || msg.recipient.toLowerCase() === req.user.username.toLowerCase();
    const isSender = msg.sender_id === req.user.id;
    if ((!isRecipient && !isSender) || msg.recipient === 'Wszyscy Kadeci') {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Brak dostępu do tej wiadomości.' });
    }
    if (!isRecipient && !isSender && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak dostępu do tej wiadomości.' });
    }

    db.prepare('UPDATE raven_messages SET starred = CASE WHEN starred = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji gwiazdki: ' + err.message });
  }
});

// DELETE /api/raven/:id — Delete message (sender or admin only)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const msg = db.prepare('SELECT * FROM raven_messages WHERE id = ?').get(id);
    if (!msg) return res.status(404).json({ error: 'Wiadomość nie istnieje.' });
    if (msg.sender_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Możesz usunąć tylko własne wiadomości.' });
    }
    db.prepare('DELETE FROM raven_messages WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Wiadomość usunięta.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania wiadomości: ' + err.message });
  }
});

export default router;
