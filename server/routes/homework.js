import { Router } from 'express';
import db, { dbHomeworkToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/homework — List submissions with filters
router.get('/', (req, res) => {
  try {
    const { studentId, subjectId, status } = req.query;
    let query = 'SELECT * FROM homework_submissions WHERE 1=1';
    const params = [];

    if (studentId) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }
    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY rowid DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbHomeworkToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania prac domowych: ' + err.message });
  }
});

// POST /api/homework — Submit new homework (Student)
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      subjectId,
      subjectName,
      lessonId = '',
      lessonTitle = '',
      content
    } = req.body;

    if (!subjectId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Przedmiot i treść wypracowania są wymagane.' });
    }

    const id = `hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const student = req.user;

    db.prepare(`
      INSERT INTO homework_submissions (
        id, student_id, student_name, house, subject_id, subject_name,
        lesson_id, lesson_title, content, status, submitted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now'))
    `).run(
      id,
      student.id,
      student.fullName,
      student.house || 'ravnheim',
      subjectId,
      subjectName || subjectId,
      lessonId,
      lessonTitle,
      content.trim()
    );

    const created = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(id);
    res.status(201).json({
      ok: true,
      message: 'Praca domowa została pomyślnie złożona na ręce Profesora Katedry.',
      submission: dbHomeworkToFrontend(created)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd składania pracy domowej: ' + err.message });
  }
});

// PATCH /api/homework/:id/grade — Grade homework submission (Professor or Admin)
router.patch('/:id/grade', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, pointsToAward = 15 } = req.body;

    if (req.user.role !== 'professor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko Profesorowie i Dyrekcja mogą oceniać zadania domowe.' });
    }

    const existing = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono zadania domowego.' });
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE homework_submissions
        SET status = 'graded', grade = ?, feedback = ?, graded_by = ?, graded_at = datetime('now')
        WHERE id = ?
      `).run(grade || 'Wybitny (W)', feedback || '', req.user.fullName, id);

      // Award points to house & student
      if (pointsToAward > 0 && existing.house) {
        db.prepare(`
          INSERT INTO point_transactions (id, student_id, student_name, house, points, source, date, comment, is_revoked, created_at)
          VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, 0, datetime('now'))
        `).run(
          `pt-hw-${Date.now()}`,
          existing.student_id,
          existing.student_name,
          existing.house,
          pointsToAward,
          `Zadanie domowe: ${existing.subject_name}`,
          `Ocena: ${grade || 'W'} od ${req.user.fullName}`
        );

        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsToAward, existing.student_id);
      }

      return db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(id);
    });

    const updated = tx();
    const rankings = calculateHouseRankings('overall');

    res.json({
      ok: true,
      message: `Praca została oceniona na: ${grade}. Przyznano +${pointsToAward} pkt dla Zakonu.`,
      submission: dbHomeworkToFrontend(updated),
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd oceniania pracy domowej: ' + err.message });
  }
});

// DELETE /api/homework/:id — Delete submission
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM homework_submissions WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Praca domowa usunięta.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania pracy domowej: ' + err.message });
  }
});

export default router;
