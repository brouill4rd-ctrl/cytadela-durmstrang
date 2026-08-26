import express from 'express';
import db, { dbAbsenceRequestToFrontend, dbAbsenceRequestLessonToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getDeadlineDays() {
  try {
    const row = db.prepare(`SELECT value FROM school_config WHERE key = 'absenceExcuseDeadlineDays'`).get();
    return row ? parseInt(row.value, 10) : 7;
  } catch { return 7; }
}

function getRequestWithLessons(id) {
  const row = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(id);
  if (!row) return null;
  const lessonRows = db.prepare(`SELECT * FROM absence_request_lessons WHERE request_id = ?`).all(id);
  return dbAbsenceRequestToFrontend(row, lessonRows.map(dbAbsenceRequestLessonToFrontend));
}

// Link timetable entries that fall within the request date/time range
function findMatchingTimetableEntries(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const entries = db.prepare(`SELECT * FROM timetable_entries WHERE is_active = 1`).all();
  const matched = [];

  for (const e of entries) {
    // Build concrete dates for each day of week between start and end
    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    for (let d = 0; d < dayDiff; d++) {
      const checkDate = new Date(start);
      checkDate.setDate(checkDate.getDate() + d);
      // JS getDay(): 0=Sun,1=Mon,...6=Sat; timetable dayOfWeek: 1=Mon,...7=Sun
      const jsDay = checkDate.getDay();
      const tmDay = jsDay === 0 ? 7 : jsDay;
      if (e.day_of_week !== tmDay) continue;

      const dateStr = checkDate.toISOString().split('T')[0];
      const lessonStart = new Date(`${dateStr}T${e.start_time}:00`);
      const lessonEnd = new Date(`${dateStr}T${e.end_time}:00`);

      if (lessonEnd <= start || lessonStart >= end) continue;

      matched.push({ entry: e, date: dateStr });
    }
  }
  return matched;
}

// Sync absence_request_lessons: match with actual lessons if they exist now
function syncRequestLessons(requestId) {
  const arl = db.prepare(`SELECT * FROM absence_request_lessons WHERE request_id = ?`).all(requestId);
  for (const link of arl) {
    if (link.lesson_id) continue; // already linked
    if (!link.lesson_date || !link.subject_id) continue;
    // Try to find a lesson for this subject on this date
    const lesson = db.prepare(
      `SELECT id FROM lessons WHERE subject_id = ? AND date = ? AND status != 'archived' LIMIT 1`
    ).get(link.subject_id, link.lesson_date);
    if (lesson) {
      db.prepare(`UPDATE absence_request_lessons SET lesson_id = ? WHERE id = ?`).run(lesson.id, link.id);
      // Try to update lesson_participants excuse_status
      const req = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(requestId);
      if (req && (req.status === 'approved' || req.status === 'pending')) {
        const participant = db.prepare(
          `SELECT id FROM lesson_participants WHERE lesson_id = ? AND student_id = ? LIMIT 1`
        ).get(lesson.id, req.user_id);
        if (participant) {
          db.prepare(`UPDATE absence_request_lessons SET participant_id = ? WHERE id = ?`).run(participant.id, link.id);
          const excuseStatus = req.status === 'approved' ? 'approved' : 'pending';
          db.prepare(`UPDATE lesson_participants SET excuse_status = ?, excuse_request_id = ? WHERE id = ? AND is_present = 0`)
            .run(excuseStatus, requestId, participant.id);
        }
      }
    }
  }
}

// ===================== ROUTES =====================

// GET /api/absences — list requests
router.get('/', requireAuth, (req, res) => {
  try {
    const { user } = req;
    const { status, type, limit = 50 } = req.query;
    let query = `SELECT * FROM absence_requests WHERE 1=1`;
    const params = [];

    if (user.role === 'student') {
      query += ` AND user_id = ?`;
      params.push(user.id);
    } else if (user.role === 'professor') {
      // Professors see requests for their subject's lessons
      query += ` AND id IN (
        SELECT DISTINCT request_id FROM absence_request_lessons
        WHERE professor_id = ?
      )`;
      params.push(user.id);
    }
    // admin sees all

    if (status) { query += ` AND status = ?`; params.push(status); }
    if (type) { query += ` AND type = ?`; params.push(type); }
    query += ` ORDER BY submitted_at DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const rows = db.prepare(query).all(...params);
    const result = rows.map(r => {
      const lessons = db.prepare(`SELECT * FROM absence_request_lessons WHERE request_id = ?`).all(r.id);
      return dbAbsenceRequestToFrontend(r, lessons.map(dbAbsenceRequestLessonToFrontend));
    });
    res.json(result);
  } catch (err) {
    console.error('[absences GET /]', err);
    res.status(500).json({ error: 'Błąd pobierania wniosków.' });
  }
});

// GET /api/absences/queue — pending queue for admin/reviewer
router.get('/queue', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM absence_requests WHERE status = 'pending' ORDER BY submitted_at ASC`
    ).all();
    const result = rows.map(r => {
      const lessons = db.prepare(`SELECT * FROM absence_request_lessons WHERE request_id = ?`).all(r.id);
      return dbAbsenceRequestToFrontend(r, lessons.map(dbAbsenceRequestLessonToFrontend));
    });
    res.json(result);
  } catch (err) {
    console.error('[absences GET /queue]', err);
    res.status(500).json({ error: 'Błąd pobierania kolejki.' });
  }
});

// GET /api/absences/stats — attendance stats for current user
router.get('/stats', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const total = db.prepare(
      `SELECT COUNT(*) as c FROM lesson_participants WHERE student_id = ?`
    ).get(userId)?.c || 0;
    const present = db.prepare(
      `SELECT COUNT(*) as c FROM lesson_participants WHERE student_id = ? AND is_present = 1`
    ).get(userId)?.c || 0;
    const absent = total - present;
    const excused = db.prepare(
      `SELECT COUNT(*) as c FROM lesson_participants WHERE student_id = ? AND is_present = 0 AND excuse_status = 'approved'`
    ).get(userId)?.c || 0;
    const pending = db.prepare(
      `SELECT COUNT(*) as c FROM lesson_participants WHERE student_id = ? AND is_present = 0 AND excuse_status = 'pending'`
    ).get(userId)?.c || 0;
    const unexcused = db.prepare(
      `SELECT COUNT(*) as c FROM lesson_participants WHERE student_id = ? AND is_present = 0 AND (excuse_status IS NULL OR excuse_status = 'rejected')`
    ).get(userId)?.c || 0;
    res.json({ total, present, absent, excused, pending, unexcused });
  } catch (err) {
    res.status(500).json({ error: 'Błąd statystyk.' });
  }
});

// GET /api/absences/unexcused — unexcused absences for current user (from lesson_participants)
router.get('/unexcused', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT lp.*, l.subject_name, l.subject_id, l.date, l.topic, l.professor_name, l.professor_id
      FROM lesson_participants lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.student_id = ? AND lp.is_present = 0 AND (lp.excuse_status IS NULL OR lp.excuse_status = 'rejected')
      AND l.status = 'published'
      ORDER BY l.date DESC
    `).all(userId);
    res.json(rows.map(r => ({
      participantId: r.id,
      lessonId: r.lesson_id,
      subjectName: r.subject_name,
      subjectId: r.subject_id,
      date: r.date,
      topic: r.topic,
      professorName: r.professor_name,
      professorId: r.professor_id,
      excuseStatus: r.excuse_status || null,
      excuseRequestId: r.excuse_request_id || ''
    })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania nieobecności.' });
  }
});

// GET /api/absences/config
router.get('/config', requireAuth, (req, res) => {
  try {
    const deadlineDays = getDeadlineDays();
    res.json({ absenceExcuseDeadlineDays: deadlineDays });
  } catch (err) {
    res.status(500).json({ error: 'Błąd konfiguracji.' });
  }
});

// PUT /api/absences/config — admin only
router.put('/config', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { absenceExcuseDeadlineDays } = req.body;
    if (absenceExcuseDeadlineDays !== undefined) {
      db.prepare(`INSERT OR REPLACE INTO school_config (key, value) VALUES ('absenceExcuseDeadlineDays', ?)`)
        .run(String(parseInt(absenceExcuseDeadlineDays, 10)));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu konfiguracji.' });
  }
});

// GET /api/absences/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Wniosek nie istnieje.' });
    const { user } = req;
    if (user.role === 'student' && row.user_id !== user.id) {
      return res.status(403).json({ error: 'Brak dostępu.' });
    }
    res.json(getRequestWithLessons(req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wniosku.' });
  }
});

// POST /api/absences — create new request
router.post('/', requireAuth, (req, res) => {
  try {
    const { user } = req;
    const { type, startAt, endAt, reason, extraInfo, schoolYear } = req.body;

    if (!type || !startAt || !endAt || !reason?.trim()) {
      return res.status(400).json({ error: 'Wymagane pola: type, startAt, endAt, reason.' });
    }
    if (!['planned', 'post_factum'].includes(type)) {
      return res.status(400).json({ error: 'Nieprawidłowy typ wniosku.' });
    }

    // Post-factum deadline check
    if (type === 'post_factum') {
      const deadlineDays = getDeadlineDays();
      if (deadlineDays > 0) {
        const lessonDate = new Date(startAt);
        const daysDiff = (Date.now() - lessonDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > deadlineDays) {
          return res.status(400).json({ error: `Upłynął termin na usprawiedliwienie (${deadlineDays} dni).` });
        }
      }
    }

    // Check for duplicate on same participant (post_factum)
    const participantId = req.body.participantId || '';
    if (participantId) {
      const existing = db.prepare(
        `SELECT id FROM absence_request_lessons WHERE participant_id = ? AND request_id IN (
          SELECT id FROM absence_requests WHERE status IN ('pending','approved')
        )`
      ).get(participantId);
      if (existing) {
        return res.status(409).json({
          error: 'Wniosek dla tej nieobecności już istnieje.',
          existingRequestId: existing.request_id
        });
      }
    }

    const id = genId('abs');
    const now = new Date().toISOString();
    const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);

    db.prepare(`
      INSERT INTO absence_requests (id, user_id, user_name, house, class_year, type, start_at, end_at, reason, extra_info, status, submitted_at, school_year, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      id, user.id, userRow?.full_name || user.id,
      userRow?.house || '', userRow?.class_year || '',
      type, startAt, endAt, reason.trim(), extraInfo || '',
      now, schoolYear || '', now, now
    );

    // Create lesson links
    const lessonLinks = req.body.lessonLinks || [];

    if (type === 'planned' && lessonLinks.length === 0) {
      // Auto-detect from timetable
      const matched = findMatchingTimetableEntries(startAt, endAt);
      for (const { entry, date } of matched) {
        const linkId = genId('arl');
        db.prepare(`
          INSERT INTO absence_request_lessons (id, request_id, timetable_entry_id, subject_id, subject_name, professor_id, professor_name, lesson_date, lesson_start, lesson_end)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(linkId, id, entry.id, entry.subject_id || '', entry.subject_name,
          entry.professor_id || '', entry.professor_name,
          date, entry.start_time, entry.end_time);
      }
    } else {
      for (const link of lessonLinks) {
        const linkId = genId('arl');
        db.prepare(`
          INSERT INTO absence_request_lessons (id, request_id, lesson_id, timetable_entry_id, subject_id, subject_name, professor_id, professor_name, lesson_date, lesson_start, lesson_end, participant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(linkId, id, link.lessonId || '', link.timetableEntryId || '',
          link.subjectId || '', link.subjectName || '',
          link.professorId || '', link.professorName || '',
          link.lessonDate || '', link.lessonStart || '', link.lessonEnd || '',
          link.participantId || '');

        // Update lesson_participants if participant given
        if (link.participantId) {
          db.prepare(`UPDATE lesson_participants SET excuse_status = 'pending', excuse_request_id = ? WHERE id = ? AND is_present = 0`)
            .run(id, link.participantId);
        }
      }
    }

    // Audit log
    db.prepare(`INSERT INTO absence_audit_logs (id, request_id, actor_id, actor_name, actor_role, action, detail, created_at)
      VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?)`)
      .run(genId('aal'), id, user.id, userRow?.full_name || user.id, user.role, `Złożono wniosek typu ${type}`, now);

    res.status(201).json(getRequestWithLessons(id));
  } catch (err) {
    console.error('[absences POST /]', err);
    res.status(500).json({ error: 'Błąd tworzenia wniosku.' });
  }
});

// PUT /api/absences/:id — edit pending request (own)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Wniosek nie istnieje.' });
    if (row.user_id !== req.user.id) return res.status(403).json({ error: 'Brak dostępu.' });
    if (row.status !== 'pending') return res.status(400).json({ error: 'Można edytować tylko oczekujący wniosek.' });

    const { reason, extraInfo } = req.body;
    const now = new Date().toISOString();
    db.prepare(`UPDATE absence_requests SET reason = ?, extra_info = ?, updated_at = ? WHERE id = ?`)
      .run(reason?.trim() || row.reason, extraInfo ?? row.extra_info, now, row.id);

    const userRow = db.prepare(`SELECT full_name FROM users WHERE id = ?`).get(req.user.id);
    db.prepare(`INSERT INTO absence_audit_logs (id, request_id, actor_id, actor_name, actor_role, action, detail, created_at) VALUES (?, ?, ?, ?, ?, 'edited', '', ?)`)
      .run(genId('aal'), row.id, req.user.id, userRow?.full_name || req.user.id, req.user.role, now);

    res.json(getRequestWithLessons(row.id));
  } catch (err) {
    res.status(500).json({ error: 'Błąd edycji wniosku.' });
  }
});

// DELETE /api/absences/:id — cancel own pending request
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Wniosek nie istnieje.' });
    if (row.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Brak dostępu.' });
    if (row.status !== 'pending') return res.status(400).json({ error: 'Można anulować tylko oczekujący wniosek.' });

    const now = new Date().toISOString();
    db.prepare(`UPDATE absence_requests SET status = 'cancelled', updated_at = ? WHERE id = ?`).run(now, row.id);

    // Revert excuse_status on participants
    const links = db.prepare(`SELECT participant_id FROM absence_request_lessons WHERE request_id = ?`).all(row.id);
    for (const link of links) {
      if (link.participant_id) {
        db.prepare(`UPDATE lesson_participants SET excuse_status = NULL, excuse_request_id = '' WHERE id = ? AND excuse_request_id = ?`)
          .run(link.participant_id, row.id);
      }
    }

    const userRow = db.prepare(`SELECT full_name FROM users WHERE id = ?`).get(req.user.id);
    db.prepare(`INSERT INTO absence_audit_logs (id, request_id, actor_id, actor_name, actor_role, action, detail, created_at) VALUES (?, ?, ?, ?, ?, 'cancelled', '', ?)`)
      .run(genId('aal'), row.id, req.user.id, userRow?.full_name || req.user.id, req.user.role, now);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd anulowania wniosku.' });
  }
});

// POST /api/absences/:id/review — approve or reject (admin only)
router.post('/:id/review', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM absence_requests WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Wniosek nie istnieje.' });
    if (row.status !== 'pending') return res.status(400).json({ error: 'Wniosek nie oczekuje na rozpatrzenie.' });

    const { decision, reviewComment } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Nieprawidłowa decyzja. Użyj: approved | rejected.' });
    }

    const now = new Date().toISOString();
    const adminRow = db.prepare(`SELECT full_name FROM users WHERE id = ?`).get(req.user.id);
    const adminName = adminRow?.full_name || req.user.id;

    // Sync any newly appeared lessons before applying decision
    syncRequestLessons(row.id);

    db.prepare(`
      UPDATE absence_requests SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_by_name = ?, reviewed_at = ?, updated_at = ? WHERE id = ?
    `).run(decision, reviewComment || '', req.user.id, adminName, now, now, row.id);

    // Update lesson_participants excuse_status
    const excuseStatus = decision === 'approved' ? 'approved' : 'rejected';
    const links = db.prepare(`SELECT * FROM absence_request_lessons WHERE request_id = ?`).all(row.id);
    for (const link of links) {
      if (link.participant_id) {
        db.prepare(`UPDATE lesson_participants SET excuse_status = ? WHERE id = ? AND is_present = 0`)
          .run(excuseStatus, link.participant_id);
      } else if (link.lesson_id && row.user_id) {
        // Try to find participant
        const part = db.prepare(`SELECT id FROM lesson_participants WHERE lesson_id = ? AND student_id = ? LIMIT 1`)
          .get(link.lesson_id, row.user_id);
        if (part) {
          db.prepare(`UPDATE lesson_participants SET excuse_status = ?, excuse_request_id = ? WHERE id = ? AND is_present = 0`)
            .run(excuseStatus, row.id, part.id);
          db.prepare(`UPDATE absence_request_lessons SET participant_id = ? WHERE id = ?`).run(part.id, link.id);
        }
      }
    }

    db.prepare(`INSERT INTO absence_audit_logs (id, request_id, actor_id, actor_name, actor_role, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(genId('aal'), row.id, req.user.id, adminName, req.user.role, decision, reviewComment || '', now);

    // Also write to main audit_logs
    db.prepare(`INSERT INTO audit_logs (id, timestamp, admin, action, detail) VALUES (?, ?, ?, ?, ?)`)
      .run(genId('al'), now, adminName, `absence_${decision}`, `Wniosek ${row.id} ucznia ${row.user_name}: ${decision}`);

    res.json(getRequestWithLessons(row.id));
  } catch (err) {
    console.error('[absences POST /:id/review]', err);
    res.status(500).json({ error: 'Błąd rozpatrywania wniosku.' });
  }
});

// GET /api/absences/lesson/:lessonId/participants — lesson participants with excuse status (professor view)
router.get('/lesson/:lessonId/participants', requireAuth, (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = db.prepare(`SELECT * FROM lessons WHERE id = ?`).get(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lekcja nie istnieje.' });

    // Only allow professor who owns the lesson, or admin
    if (req.user.role === 'professor' && lesson.professor_id !== req.user.id) {
      return res.status(403).json({ error: 'Brak dostępu do tej lekcji.' });
    }

    const rows = db.prepare(`SELECT * FROM lesson_participants WHERE lesson_id = ?`).all(lessonId);
    const result = rows.map(r => {
      const base = {
        id: r.id,
        lessonId: r.lesson_id,
        studentId: r.student_id || '',
        studentName: r.student_name,
        house: r.house,
        isPresent: !!r.is_present,
        pointsAwarded: r.points_awarded || 0,
        comment: r.comment || '',
        role: r.role || 'student',
        excuseStatus: r.excuse_status || null,
        excuseRequestId: r.excuse_request_id || ''
      };

      // For admin: include request reason summary
      if (req.user.role === 'admin' && r.excuse_request_id) {
        const req2 = db.prepare(`SELECT status, review_comment, reviewed_by_name FROM absence_requests WHERE id = ?`).get(r.excuse_request_id);
        if (req2) {
          base.excuseReviewedByName = req2.reviewed_by_name || '';
          base.excuseReviewComment = req2.review_comment || '';
        }
      }
      return base;
    });

    // Attach planned absences notice (approved planned requests for this date)
    const plannedNotices = [];
    if (lesson.date) {
      const lessonDate = lesson.date.split('T')[0];
      const planned = db.prepare(`
        SELECT ar.*, arl.id as arl_id FROM absence_requests ar
        JOIN absence_request_lessons arl ON arl.request_id = ar.id
        WHERE ar.type = 'planned' AND ar.status = 'approved'
          AND arl.lesson_date = ? AND arl.subject_id = ?
      `).all(lessonDate, lesson.subject_id || '');
      planned.forEach(p => plannedNotices.push({ userId: p.user_id, userName: p.user_name, requestId: p.id, status: p.status }));
    }

    res.json({ participants: result, plannedAbsenceNotices: plannedNotices });
  } catch (err) {
    console.error('[absences lesson participants]', err);
    res.status(500).json({ error: 'Błąd pobierania uczestników.' });
  }
});

// GET /api/absences/timetable-preview — what timetable entries fall in date range
router.get('/timetable-preview', requireAuth, (req, res) => {
  try {
    const { startAt, endAt } = req.query;
    if (!startAt || !endAt) return res.status(400).json({ error: 'Wymagane: startAt, endAt.' });
    const matched = findMatchingTimetableEntries(startAt, endAt);
    res.json(matched.map(({ entry, date }) => ({
      timetableEntryId: entry.id,
      subjectId: entry.subject_id || '',
      subjectName: entry.subject_name,
      subjectIcon: entry.subject_icon || '📚',
      professorName: entry.professor_name,
      lessonDate: date,
      lessonStart: entry.start_time,
      lessonEnd: entry.end_time,
      classroom: entry.classroom
    })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd podglądu planu.' });
  }
});

export default router;
