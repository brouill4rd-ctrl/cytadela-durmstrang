import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function genId() {
  return `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// GET /api/externist/my — student: moje wnioski
router.get('/my', requireAuth, (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT * FROM externist_applications
      WHERE student_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);
    res.json({ applications: apps });
  } catch (err) {
    console.error('[Externist] GET /my error:', err.message);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/externist/apply — student: złóż wniosek
router.post('/apply', requireAuth, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Tylko studenci mogą składać wnioski' });
  }

  const { subjectId, subjectName, motivation } = req.body;
  if (!subjectId || !subjectName) {
    return res.status(400).json({ error: 'Brakuje danych przedmiotu' });
  }

  // Sprawdź czy wniosek już istnieje (pending lub approved)
  const existing = db.prepare(`
    SELECT id FROM externist_applications
    WHERE student_id = ? AND subject_id = ? AND status IN ('pending', 'approved')
  `).get(req.user.id, subjectId);

  if (existing) {
    return res.status(409).json({ error: 'Masz już aktywny wniosek na ten przedmiot' });
  }

  const id = genId();
  const now = nowISO();

  db.prepare(`
    INSERT INTO externist_applications
      (id, student_id, student_name, house, subject_id, subject_name, motivation, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    id,
    req.user.id,
    req.user.name || req.user.username,
    req.user.house || '',
    subjectId,
    subjectName,
    motivation || '',
    now,
    now
  );

  const app = db.prepare('SELECT * FROM externist_applications WHERE id = ?').get(id);
  res.status(201).json({ application: app });
});

// GET /api/externist/pending — profesor/admin: oczekujące na moich przedmiotach
router.get('/pending', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    let apps;
    if (req.user.role === 'admin') {
      apps = db.prepare(`
        SELECT * FROM externist_applications
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `).all();
    } else {
      // Profesor widzi wnioski tylko na swoich przedmiotach
      const taughtRaw = req.user.taught_subject_ids;
      const taughtIds = taughtRaw ? JSON.parse(taughtRaw) : [];
      if (taughtIds.length === 0) return res.json({ applications: [] });

      const placeholders = taughtIds.map(() => '?').join(',');
      apps = db.prepare(`
        SELECT * FROM externist_applications
        WHERE status = 'pending' AND subject_id IN (${placeholders})
        ORDER BY created_at ASC
      `).all(...taughtIds);
    }
    res.json({ applications: apps });
  } catch (err) {
    console.error('[Externist] GET /pending error:', err.message);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/externist/all — admin: wszystkie wnioski
router.get('/all', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT * FROM externist_applications ORDER BY created_at DESC
    `).all();
    res.json({ applications: apps });
  } catch (err) {
    console.error('[Externist] GET /all error:', err.message);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/externist/:id/decide — profesor/admin: zatwierdź lub odrzuć
router.post('/:id/decide', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  const { id } = req.params;
  const { decision, requirementsType, requirementsNote, decisionNote } = req.body;

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Nieprawidłowa decyzja' });
  }

  const app = db.prepare('SELECT * FROM externist_applications WHERE id = ?').get(id);
  if (!app) return res.status(404).json({ error: 'Wniosek nie istnieje' });
  if (app.status !== 'pending') {
    return res.status(409).json({ error: 'Wniosek został już rozpatrzony' });
  }

  // Profesor może decydować tylko w swoich przedmiotach
  if (req.user.role === 'professor') {
    const taughtRaw = req.user.taught_subject_ids;
    const taughtIds = taughtRaw ? JSON.parse(taughtRaw) : [];
    if (!taughtIds.includes(app.subject_id)) {
      return res.status(403).json({ error: 'Nie jesteś profesorem tego przedmiotu' });
    }
  }

  const now = nowISO();
  db.prepare(`
    UPDATE externist_applications SET
      status = ?,
      professor_id = ?,
      professor_name = ?,
      requirements_type = ?,
      requirements_note = ?,
      decision_note = ?,
      decided_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    decision,
    req.user.id,
    req.user.name || req.user.username,
    requirementsType || '',
    requirementsNote || '',
    decisionNote || '',
    now,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM externist_applications WHERE id = ?').get(id);
  res.json({ application: updated });
});

// GET /api/externist/:id — szczegół wniosku
router.get('/:id', requireAuth, (req, res) => {
  try {
    const app = db.prepare('SELECT * FROM externist_applications WHERE id = ?').get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Wniosek nie istnieje' });

    // Student widzi tylko swój wniosek
    if (req.user.role === 'student' && app.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    res.json({ application: app });
  } catch (err) {
    console.error('[Externist] GET /:id error:', err.message);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
