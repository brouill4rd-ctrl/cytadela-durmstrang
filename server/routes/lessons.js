import express from 'express';
import db, {
  dbLessonToFrontend,
  dbMessageToFrontend,
  dbParticipantToFrontend,
  dbPointTxToFrontend,
  calculateHouseRankings,
  isProfessorOfSubject
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  awardPoints,
  deductPoints,
  correctTransaction,
  revokePointsForLesson,
  recalculateUserPoints
} from '../services/pointsService.js';

const router = express.Router();

// GET /api/lessons - Pobierz listę wszystkich dzienników (Tylko zalogowani)
router.get('/', requireAuth, (req, res) => {
  try {
    const { subject, classYear, professor, house, status, search, limit = 50 } = req.query;

    let query = `
      SELECT l.*, 
        (SELECT COUNT(*) FROM lesson_participants WHERE lesson_id = l.id) as real_participants_count,
        (SELECT COALESCE(SUM(points_awarded), 0) FROM lesson_participants WHERE lesson_id = l.id) as calculated_total_points
      FROM lessons l
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (subject) {
      query += ` AND (l.subject_id = ? OR l.subject_name LIKE ?)`;
      params.push(subject, `%${subject}%`);
    }

    if (classYear) {
      query += ` AND l.class_year = ?`;
      params.push(classYear);
    }

    if (professor) {
      query += ` AND (l.professor_id = ? OR l.professor_name LIKE ?)`;
      params.push(professor, `%${professor}%`);
    }

    if (search) {
      query += ` AND (l.topic LIKE ? OR l.description LIKE ? OR l.subject_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (house) {
      query += ` AND EXISTS (SELECT 1 FROM lesson_participants lp WHERE lp.lesson_id = l.id AND lp.house = ?)`;
      params.push(house.toLowerCase());
    }

    query += ` ORDER BY l.date DESC, l.created_at DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const rows = db.prepare(query).all(...params);

    const lessons = rows.map(r => {
      // Fetch participants for house distribution summary
      const participants = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(r.id);
      return dbLessonToFrontend(r, [], participants);
    });

    res.json(lessons);
  } catch (err) {
    console.error('[API /lessons] Błąd pobierania lekcji:', err);
    res.status(500).json({ error: 'Nie udało się pobrać listy dzienników.' });
  }
});

// GET /api/lessons/rankings/houses - Wylicz ranking Zakonów z księgi transakcji (Single Source of Truth)
router.get('/rankings/houses', (req, res) => {
  try {
    const period = req.query.period || 'overall'; // 'overall' | 'school_year' | 'monthly' | 'weekly'
    const rankings = calculateHouseRankings(period);
    res.json(rankings);
  } catch (err) {
    console.error('[API /lessons/rankings/houses] Błąd kalkulacji rankingu:', err);
    res.status(500).json({ error: 'Błąd kalkulacji rankingu Zakonów.' });
  }
});

// GET /api/lessons/ledger/transactions - Historia transakcji punktowych
router.get('/ledger/transactions', requireAuth, (req, res) => {
  try {
    const { house, studentId, lessonId, limit } = req.query;
    let query = 'SELECT * FROM point_transactions WHERE 1=1';
    const params = [];

    if (house) {
      query += ' AND house = ?';
      params.push(house.toLowerCase());
    }
    if (studentId) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }
    if (lessonId) {
      query += ' AND lesson_id = ?';
      params.push(lessonId);
    }

    query += ' ORDER BY created_at DESC';
    if (limit) {
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);
      query += ' LIMIT ?';
      params.push(parsedLimit);
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbPointTxToFrontend));
  } catch (err) {
    console.error('[API /lessons/ledger/transactions] Błąd pobierania księgi punktów:', err);
    res.status(500).json({ error: 'Nie udało się pobrać historii transakcji punktowych.' });
  }
});

// GET /api/lessons/audit-logs - Audyt modyfikacji punktów
router.get('/audit-logs', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM point_audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) {
    console.error('[API /lessons/audit-logs] Błąd audytu punktów:', err);
    res.status(500).json({ error: 'Błąd pobierania audytu punktów.' });
  }
});

// GET /api/lessons/stats/overview - Statystyki ogólne
router.get('/stats/overview', requireAuth, (req, res) => {
  try {
    const totalLessons = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE status = "published"').get().c;
    const totalDrafts = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE status = "draft"').get().c;
    const totalPointsAwarded = db.prepare('SELECT COALESCE(SUM(points), 0) as s FROM point_transactions WHERE is_revoked = 0').get().s;
    const totalTransactions = db.prepare('SELECT COUNT(*) as c FROM point_transactions WHERE is_revoked = 0').get().c;

    const housePoints = db.prepare(`
      SELECT house, SUM(points) as points 
      FROM point_transactions 
      WHERE is_revoked = 0 
      GROUP BY house
    `).all();

    res.json({
      totalLessons,
      totalDrafts,
      totalPointsAwarded,
      totalTransactions,
      housePoints
    });
  } catch (err) {
    console.error('[API /lessons/stats/overview] Błąd statystyk:', err);
    res.status(500).json({ error: 'Błąd pobierania statystyk.' });
  }
});

// GET /api/lessons/:id - Pobierz szczegóły pojedynczego dziennika (Tylko zalogowani)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Dziennik lekcyjny nie został odnaleziony.' });
    }

    const messages = db.prepare('SELECT * FROM lesson_messages WHERE lesson_id = ? ORDER BY order_index ASC, timestamp ASC').all(req.params.id);
    const participants = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ? ORDER BY house ASC, student_name ASC').all(req.params.id);

    res.json(dbLessonToFrontend(lesson, messages, participants));
  } catch (err) {
    console.error(`[API /lessons/${req.params.id}] Błąd pobierania szczegółów:`, err);
    res.status(500).json({ error: 'Nie udało się pobrać szczegółów lekcji.' });
  }
});

// POST /api/lessons - Utwórz nowy szkic dziennika (Profesor / Admin)
router.post('/', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const {
      id = `les-${Date.now()}`,
      subjectId = 'eliksiry',
      subjectName,
      classYear = 'Klasa I',
      topic = 'Nowa lekcja',
      description = '',
      professorId = '',
      professorName = '',
      professorAvatar = '',
      date = new Date().toISOString().split('T')[0],
      status = 'draft',
      discordThreadId = '',
      discordChannelId = '',
      discordGuildId = '',
      discordThreadUrl = '',
      participants = [],
      messages = []
    } = req.body;

    // Subject ownership check
    if (req.user.role === 'professor' && !isProfessorOfSubject(req.user.id, subjectId)) {
      return res.status(403).json({ error: 'Możesz tworzyć lekcje tylko dla przedmiotów, które prowadzisz.' });
    }

    // Resolve subject name from database
    const subjectRow = db.prepare('SELECT name FROM subjects WHERE id = ?').get(subjectId);
    const resolvedSubjectName = subjectName || subjectRow?.name || 'Przedmiot';

    const insertLesson = db.prepare(`
      INSERT INTO lessons (id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, professor_avatar, date, status, discord_thread_id, discord_channel_id, discord_guild_id, discord_thread_url, total_points, participants_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertLesson.run(
      id, subjectId, resolvedSubjectName, classYear, topic, description, professorId,
      professorName, professorAvatar, date, status, discordThreadId,
      discordChannelId, discordGuildId, discordThreadUrl, 0, participants.length
    );

    // Insert participants if any
    const insertParticipant = db.prepare(`
      INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of participants) {
      insertParticipant.run(
        p.id || `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        id,
        p.studentId || null,
        p.studentName || 'Adept',
        (p.house || 'ravnheim').toLowerCase(),
        p.isPresent !== undefined ? (p.isPresent ? 1 : 0) : 1,
        p.pointsAwarded || 0,
        p.comment || '',
        p.role || 'student'
      );
    }

    // Insert messages if any
    const insertMessage = db.prepare(`
      INSERT INTO lesson_messages (id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house, content, timestamp, order_index, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, reactions, attachments, is_edited, edit_history, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let idx = 1;
    for (const m of messages) {
      insertMessage.run(
        m.id || `msg-${Date.now()}-${idx}`,
        id,
        m.discordMessageId || `dmsg-${Date.now()}-${idx}`,
        m.discordUserId || '',
        m.authorName || 'Użytkownik',
        m.authorDisplayName || m.authorName || 'Użytkownik',
        m.authorAvatar || '',
        (m.authorHouse || '').toLowerCase(),
        m.content || '',
        m.timestamp || new Date().toLocaleString('pl-PL'),
        idx++,
        m.replyToId || '',
        m.replyToAuthor || '',
        m.replyToContent || '',
        m.isBot ? 1 : 0,
        m.isSystem ? 1 : 0,
        m.isCommand ? 1 : 0,
        JSON.stringify(m.commandData || {}),
        JSON.stringify(m.embeds || []),
        JSON.stringify(m.reactions || []),
        JSON.stringify(m.attachments || []),
        m.isEdited ? 1 : 0,
        JSON.stringify(m.editHistory || []),
        m.isDeleted ? 1 : 0
      );
    }

    const savedLesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    const savedMessages = db.prepare('SELECT * FROM lesson_messages WHERE lesson_id = ?').all(id);
    const savedParticipants = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(id);

    res.status(201).json(dbLessonToFrontend(savedLesson, savedMessages, savedParticipants));
  } catch (err) {
    console.error('[API POST /lessons] Błąd tworzenia dziennika:', err);
    res.status(500).json({ error: 'Nie udało się utworzyć dziennika lekcyjnego.' });
  }
});

// PUT /api/lessons/:id - Zaktualizuj szkic dziennika (Profesor / Admin)
router.put('/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Dziennik nie istnieje.' });
    }

    const {
      subjectId = existing.subject_id,
      subjectName = existing.subject_name,
      classYear = existing.class_year,
      topic = existing.topic,
      description = existing.description,
      professorId = existing.professor_id,
      professorName = existing.professor_name,
      date = existing.date,
      status = existing.status,
      participants = []
    } = req.body;

    // Calculate total points from participants list
    const totalPoints = participants.reduce((sum, p) => sum + (parseInt(p.pointsAwarded, 10) || 0), 0);

    db.prepare(`
      UPDATE lessons 
      SET subject_id = ?, subject_name = ?, class_year = ?, topic = ?, description = ?,
          professor_id = ?, professor_name = ?, date = ?, status = ?, total_points = ?,
          participants_count = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      subjectId, subjectName, classYear, topic, description,
      professorId, professorName, date, status, totalPoints,
      participants.length, id
    );

    // Refresh participants
    db.prepare('DELETE FROM lesson_participants WHERE lesson_id = ?').run(id);

    const insertParticipant = db.prepare(`
      INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of participants) {
      insertParticipant.run(
        p.id || `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        id,
        p.studentId || null,
        p.studentName || 'Adept',
        (p.house || 'ravnheim').toLowerCase(),
        p.isPresent ? 1 : 0,
        parseInt(p.pointsAwarded, 10) || 0,
        p.comment || '',
        p.role || 'student'
      );
    }

    const updated = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    const msgs = db.prepare('SELECT * FROM lesson_messages WHERE lesson_id = ? ORDER BY order_index ASC').all(id);
    const parts = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(id);

    res.json(dbLessonToFrontend(updated, msgs, parts));
  } catch (err) {
    console.error(`[API PUT /lessons/${req.params.id}] Błąd aktualizacji:`, err);
    res.status(500).json({ error: 'Nie udało się zapisać zmian w dzienniku.' });
  }
});

// POST /api/lessons/:id/publish - Oficjalna publikacja dziennika (Profesor / Admin)
router.post('/:id/publish', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const { id } = req.params;
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Dziennik nie istnieje.' });
    }

    const participants = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(id);

    // Begin SQLite Transaction for atomic ledger publication
    const publishTransaction = db.transaction(() => {
      // 1. Remove any previous transactions for this lesson (in case of re-publish)
      revokePointsForLesson(id);

      let totalCalculatedPoints = 0;

      // 2. Insert point transactions via central service
      for (const p of participants) {
        const pts = parseInt(p.points_awarded, 10) || 0;
        if (pts > 0 && p.is_present) {
          totalCalculatedPoints += pts;
          awardPoints({
            studentId: p.student_id || null,
            studentName: p.student_name,
            house: p.house,
            points: pts,
            source: `${lesson.subject_name} — ${lesson.topic}`,
            sourceType: 'LESSON',
            sourceId: id,
            lessonId: id,
            actorId: lesson.professor_id,
            actorName: lesson.professor_name,
            comment: p.comment || 'Udział i aktywność w lekcji',
            idempotencyKey: `lesson-${id}-${p.student_id || p.student_name}`
          });
        }
      }

      // 3. Update lesson status to 'published'
      db.prepare(`
        UPDATE lessons
        SET status = 'published', total_points = ?, published_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(totalCalculatedPoints, id);

      // 4. Record admin/system audit log
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, admin, action, detail)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `log-${Date.now()}`,
        new Date().toISOString(),
        lesson.professor_name,
        `Publikacja Dziennika: ${lesson.topic}`,
        `Przyznano łącznie +${totalCalculatedPoints} pkt dla Zakonów (${participants.length} uczestników).`
      );
    });

    publishTransaction();

    const updated = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    const msgs = db.prepare('SELECT * FROM lesson_messages WHERE lesson_id = ? ORDER BY order_index ASC').all(id);
    const parts = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(id);
    const updatedRankings = calculateHouseRankings('overall');

    res.json({
      success: true,
      message: `Dziennik „${lesson.topic}” został pomyślnie opublikowany! Punkty zasiliły ranking Zakonów.`,
      lesson: dbLessonToFrontend(updated, msgs, parts),
      rankings: updatedRankings
    });
  } catch (err) {
    console.error(`[API POST /lessons/${req.params.id}/publish] Błąd publikacji:`, err);
    res.status(500).json({ error: 'Błąd podczas publikacji dziennika i księgowania punktów.' });
  }
});

// POST /api/lessons/ledger/correct - Korekta wpisu punktowego z audytem (Admin)
router.post('/ledger/correct', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { transactionId, newPoints, reason, modifiedBy = 'Arcymistrz' } = req.body;

    if (!transactionId || newPoints === undefined || !reason) {
      return res.status(400).json({ error: 'Wymagane parametry: transactionId, newPoints, reason.' });
    }

    const result = correctTransaction(transactionId, newPoints, req.user.id, modifiedBy, reason);

    const updatedTx = db.prepare('SELECT * FROM point_transactions WHERE id = ?').get(transactionId);
    const rankings = calculateHouseRankings('overall');

    res.json({
      success: true,
      message: `Pomyślnie skorygowano punkty z ${result.prevPoints} na ${result.newPoints}. Zmiana została zaprotokołowana w audycie.`,
      transaction: dbPointTxToFrontend(updatedTx),
      rankings
    });
  } catch (err) {
    console.error('[API POST /lessons/ledger/correct] Błąd korekty punktów:', err);
    res.status(500).json({ error: 'Nie udało się wykonać korekty punktów.' });
  }
});

// POST /api/lessons/recalculate-rankings - Wymuszenie ponownego przeliczenia rankingów (Admin)
router.post('/recalculate-rankings', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const rankings = calculateHouseRankings('overall');
    res.json({
      success: true,
      message: 'Ranking Zakonów został pomyślnie zsynchronizowany i przeliczony z księgi transakcji.',
      rankings
    });
  } catch (err) {
    console.error('[API /recalculate-rankings] Błąd przeliczania:', err);
    res.status(500).json({ error: 'Błąd podczas przeliczania rankingu.' });
  }
});

// POST /api/lessons/points/award - Bezpośrednie przyznawanie punktów z gier i aktywności (zalogowani)
router.post('/points/award', requireAuth, (req, res) => {
  try {
    const { points, reason } = req.body;
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints <= 0) {
      return res.status(400).json({ error: 'Wymagana dodatnia liczba punktów.' });
    }
    if (numericPoints > 100) {
      return res.status(400).json({ error: 'Maksymalna wartość punktów per akcja wynosi 100.' });
    }

    // Ten endpoint obsługuje wyłącznie własne wyniki z gier. Operacje administracyjne
    // mają osobne trasy. Kadra zdobywa punkty osobiste bez przypisania do Zakonu.
    const house = req.user.role === 'student' ? req.user.house : null;

    const txId = awardPoints({
      studentId: req.user.id,
      studentName: req.user.fullName || req.user.username || 'Użytkownik',
      house,
      points: numericPoints,
      source: reason || 'Grywalizacja & Aktywność w Cytadeli',
      sourceType: 'ACTIVITY',
      actorId: req.user.id,
      actorName: req.user.fullName || 'System',
      comment: reason || 'Grywalizacja',
      idempotencyKey: req.body.idempotencyKey || ''
    });

    const rankings = house ? calculateHouseRankings('overall') : null;
    res.json({ success: true, txId, rankings });
  } catch (err) {
    console.error('[API POST /lessons/points/award] Error:', err);
    res.status(500).json({ error: 'Nie udało się zapisać punktów.' });
  }
});

// DELETE /api/lessons/:id - Usunięcie dziennika i wycofanie punktów (Admin)
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Dziennik nie istnieje.' });
    }

    const deleteTx = db.transaction(() => {
      // 1. Revoke ledger transactions and recalculate affected users
      revokePointsForLesson(id);

      // 2. Delete messages and participants
      db.prepare('DELETE FROM lesson_messages WHERE lesson_id = ?').run(id);
      db.prepare('DELETE FROM lesson_participants WHERE lesson_id = ?').run(id);

      // 3. Delete lesson record
      db.prepare('DELETE FROM lessons WHERE id = ?').run(id);

      // 4. Audit
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, admin, action, detail)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `log-${Date.now()}`,
        new Date().toISOString(),
        'Dyrekcja Cytadeli',
        `Usunięcie Dziennika ID: ${id}`,
        `Wycofano dziennik „${lesson.topic}” oraz anulowano wszystkie powiązane rekordy punktowe.`
      );
    });

    deleteTx();

    const rankings = calculateHouseRankings('overall');
    res.json({
      success: true,
      message: `Dziennik „${lesson.topic}” został bezpowrotnie usunięty z kronik, a punkty wycofane z rankingu.`,
      rankings
    });
  } catch (err) {
    console.error(`[API DELETE /lessons/${req.params.id}] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się usunąć dziennika.' });
  }
});

export default router;
