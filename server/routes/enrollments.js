import express from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const requireAdmin = requireRole('admin');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getConfig(key, fallback = '') {
  return db.prepare('SELECT value FROM school_config WHERE key = ?').get(key)?.value ?? fallback;
}

function setConfig(key, value) {
  const existing = db.prepare('SELECT key FROM school_config WHERE key = ?').get(key);
  if (existing) {
    db.prepare('UPDATE school_config SET value = ? WHERE key = ?').run(value, key);
  } else {
    db.prepare('INSERT INTO school_config (key, value) VALUES (?, ?)').run(key, value);
  }
}

// ── GET /api/enrollments/config  (public) ────────────────────────────────────
router.get('/config', (req, res) => {
  res.json({
    enrollmentOpen: getConfig('enrollment_open', '0') === '1',
    schoolYear: getConfig('school_year', 'XIX Rok Szkolny (2026/2027)'),
    enrollmentNote: getConfig('enrollment_note', '')
  });
});

// ── PUT /api/enrollments/config  (admin) ────────────────────────────────────
router.put('/config', requireAuth, requireAdmin, (req, res) => {
  const { enrollmentOpen, schoolYear, enrollmentNote } = req.body;
  if (enrollmentOpen !== undefined) setConfig('enrollment_open', enrollmentOpen ? '1' : '0');
  if (schoolYear !== undefined) setConfig('school_year', schoolYear);
  if (enrollmentNote !== undefined) setConfig('enrollment_note', enrollmentNote);
  res.json({ ok: true });
});

// ── GET /api/enrollments/stats  (public) ─────────────────────────────────────
router.get('/stats', (req, res) => {
  const studentsEnrolled = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'student' AND status = 'active'`).get().c;
  const studentsPending = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'student' AND status = 'pending'`).get().c;
  const professorsEnrolled = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role IN ('professor','admin') AND status = 'active'`).get().c;
  const professorsPending = db.prepare(`SELECT COUNT(*) as c FROM professor_subject_applications WHERE status = 'pending'`).get().c;
  res.json({ studentsEnrolled, studentsPending, professorsEnrolled, professorsPending });
});

// ── GET /api/enrollments/professors ─────────────────────────────────────────
router.get('/professors', requireAuth, (req, res) => {
  const profs = db.prepare(`
    SELECT id, name, surname, full_name, avatar, specialization, department_name, taught_subject_ids
    FROM users WHERE role IN ('professor','admin') AND status = 'active'
    ORDER BY surname
  `).all();

  const result = profs.map(p => {
    let subjectIds = [];
    try { subjectIds = JSON.parse(p.taught_subject_ids || '[]'); } catch {}
    const subjects = subjectIds.length
      ? db.prepare(`SELECT id, name, icon, class_year FROM subjects WHERE id IN (${subjectIds.map(() => '?').join(',')})`)
          .all(...subjectIds)
      : [];
    return { ...p, taught_subject_ids: subjectIds, subjects };
  });

  res.json(result);
});

// ── GET /api/enrollments/applications ────────────────────────────────────────
// Admin sees all; professor sees own
router.get('/applications', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = isAdmin
    ? db.prepare(`SELECT * FROM professor_subject_applications ORDER BY created_at DESC`).all()
    : db.prepare(`SELECT * FROM professor_subject_applications WHERE professor_id = ? ORDER BY created_at DESC`).all(req.user.id);
  res.json(rows);
});

// ── POST /api/enrollments/apply  (professor) ─────────────────────────────────
router.post('/apply', requireAuth, (req, res) => {
  if (!['professor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Tylko profesorowie mogą składać podania' });
  }

  const enrollmentOpen = getConfig('enrollment_open', '0') === '1';
  if (!enrollmentOpen && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Zapisy są obecnie zamknięte' });
  }

  const { subjectId, classYear, note } = req.body;
  if (!subjectId || !classYear) return res.status(400).json({ error: 'Brak wymaganych pól' });

  const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(subjectId);
  if (!subject) return res.status(404).json({ error: 'Nie znaleziono przedmiotu' });

  // Check for duplicate pending application
  const existing = db.prepare(`
    SELECT id FROM professor_subject_applications
    WHERE professor_id = ? AND subject_id = ? AND class_year = ? AND status = 'pending'
  `).get(req.user.id, subjectId, classYear);
  if (existing) return res.status(409).json({ error: 'Masz już oczekujące podanie na ten przedmiot i rocznik' });

  const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`
    INSERT INTO professor_subject_applications
      (id, professor_id, professor_name, professor_avatar, subject_id, subject_name, class_year, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    id,
    req.user.id,
    req.user.full_name,
    req.user.avatar || '',
    subject.id,
    subject.name,
    classYear,
    note || ''
  );

  res.json({ ok: true, id });
});

// ── POST /api/enrollments/applications/:id/review  (admin) ───────────────────
router.post('/applications/:id/review', requireAuth, requireAdmin, (req, res) => {
  const app = db.prepare('SELECT * FROM professor_subject_applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Podanie nie istnieje' });
  if (app.status !== 'pending') return res.status(409).json({ error: 'To podanie zostało już rozpatrzone' });

  const { decision, reviewComment } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Nieprawidłowa decyzja (approved/rejected)' });
  }

  db.prepare(`
    UPDATE professor_subject_applications
    SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(decision, reviewComment || '', req.user.full_name, app.id);

  // If approved: add subject to professor's taught_subject_ids (avoid duplicates)
  if (decision === 'approved') {
    const prof = db.prepare('SELECT taught_subject_ids FROM users WHERE id = ?').get(app.professor_id);
    let ids = [];
    try { ids = JSON.parse(prof?.taught_subject_ids || '[]'); } catch {}
    if (!ids.includes(app.subject_id)) {
      ids.push(app.subject_id);
      db.prepare('UPDATE users SET taught_subject_ids = ? WHERE id = ?')
        .run(JSON.stringify(ids), app.professor_id);
    }
  }

  res.json({ ok: true });
});

// ── DELETE /api/enrollments/applications/:id  (professor cancels own) ─────────
router.delete('/applications/:id', requireAuth, (req, res) => {
  const app = db.prepare('SELECT * FROM professor_subject_applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Podanie nie istnieje' });

  const isOwn = app.professor_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwn && !isAdmin) return res.status(403).json({ error: 'Brak uprawnień' });
  if (app.status !== 'pending') return res.status(409).json({ error: 'Nie można anulować rozpatrzonego podania' });

  db.prepare('DELETE FROM professor_subject_applications WHERE id = ?').run(app.id);
  res.json({ ok: true });
});

// ── DELETE /api/enrollments/professors/:profId/subjects/:subjectId  (admin) ───
router.delete('/professors/:profId/subjects/:subjectId', requireAuth, requireAdmin, (req, res) => {
  const prof = db.prepare('SELECT id, taught_subject_ids FROM users WHERE id = ?').get(req.params.profId);
  if (!prof) return res.status(404).json({ error: 'Nie znaleziono profesora' });

  let ids = [];
  try { ids = JSON.parse(prof.taught_subject_ids || '[]'); } catch {}
  ids = ids.filter(id => id !== req.params.subjectId);
  db.prepare('UPDATE users SET taught_subject_ids = ? WHERE id = ?').run(JSON.stringify(ids), prof.id);
  res.json({ ok: true });
});

export default router;
