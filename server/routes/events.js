import { Router } from 'express';
import db, { dbEventToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/events — List all calendar events
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM events ORDER BY rowid ASC').all();
    res.json(rows.map(dbEventToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wydarzeń: ' + err.message });
  }
});

// POST /api/events — Create new event (Admin only)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const ev = req.body;
    if (!ev.title || !ev.date) {
      return res.status(400).json({ error: 'Tytuł i data wydarzenia są wymagane.' });
    }

    const id = ev.id || `event-${Date.now()}`;
    db.prepare(`
      INSERT INTO events (id, title, date, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      ev.title.trim(),
      ev.date.trim(),
      ev.type || 'ceremony',
      ev.description || ''
    );

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.status(201).json(dbEventToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia wydarzenia: ' + err.message });
  }
});

// PUT /api/events/:id — Update event (Admin only)
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const ev = req.body;
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wydarzenia.' });
    }

    db.prepare(`
      UPDATE events
      SET title = ?, date = ?, type = ?, description = ?
      WHERE id = ?
    `).run(
      ev.title !== undefined ? ev.title.trim() : existing.title,
      ev.date !== undefined ? ev.date.trim() : existing.date,
      ev.type !== undefined ? ev.type : existing.type,
      ev.description !== undefined ? ev.description : existing.description,
      id
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(dbEventToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji wydarzenia: ' + err.message });
  }
});

// DELETE /api/events/:id — Delete event (Admin only)
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Wydarzenie usunięte z kalendarza.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania wydarzenia: ' + err.message });
  }
});

export default router;
