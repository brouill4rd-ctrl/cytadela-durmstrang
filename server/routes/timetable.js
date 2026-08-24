import express from 'express';
import db, { dbTimetableEntryToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const DAY_NAMES = {
  1: 'Poniedziałek',
  2: 'Wtorek',
  3: 'Środa',
  4: 'Czwartek',
  5: 'Piątek',
  6: 'Sobota',
  7: 'Niedziela'
};

// GET /api/timetable - Pobierz plan lekcji z opcjonalnymi filtrami
router.get('/', (req, res) => {
  try {
    const { day, classYear, professor, classroom, status, house, search } = req.query;

    let query = 'SELECT * FROM timetable_entries WHERE is_active = 1';
    const params = [];

    if (day !== undefined && day !== '' && day !== 'all') {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum)) {
        query += ' AND day_of_week = ?';
        params.push(dayNum);
      } else {
        query += ' AND day_name = ?';
        params.push(day);
      }
    }

    if (classYear && classYear !== 'all') {
      query += ' AND (class_year = ? OR class_year = "Wszyscy")';
      params.push(classYear);
    }

    if (professor && professor !== 'all') {
      query += ' AND (professor_id = ? OR professor_name LIKE ? OR substitute_professor_name LIKE ?)';
      params.push(professor, `%${professor}%`, `%${professor}%`);
    }

    if (classroom && classroom !== 'all') {
      query += ' AND classroom LIKE ?';
      params.push(`%${classroom}%`);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (house && house !== 'all') {
      query += ' AND (house_target = ? OR house_target = "all")';
      params.push(house);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (subject_name LIKE ? OR classroom LIKE ? OR professor_name LIKE ? OR topic LIKE ? OR notes LIKE ?)';
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY day_of_week ASC, start_time ASC, sort_order ASC';

    const rows = db.prepare(query).all(...params);
    const timetable = rows.map(dbTimetableEntryToFrontend);

    res.json(timetable);
  } catch (err) {
    console.error('[API /timetable] Błąd pobierania planu lekcji:', err);
    res.status(500).json({ error: 'Nie udało się pobrać planu lekcji.' });
  }
});

// GET /api/timetable/stats - Statystyki i przegląd grafiku
router.get('/stats', (req, res) => {
  try {
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM timetable_entries WHERE is_active = 1').get()?.count || 0;
    const substitutions = db.prepare('SELECT COUNT(*) as count FROM timetable_entries WHERE is_active = 1 AND status = "substitution"').get()?.count || 0;
    const cancellations = db.prepare('SELECT COUNT(*) as count FROM timetable_entries WHERE is_active = 1 AND status = "cancelled"').get()?.count || 0;
    const activeScheduled = db.prepare('SELECT COUNT(*) as count FROM timetable_entries WHERE is_active = 1 AND status = "scheduled"').get()?.count || 0;

    // Unikalne sale i profesorowie
    const uniqueClassrooms = db.prepare('SELECT COUNT(DISTINCT classroom) as count FROM timetable_entries WHERE is_active = 1').get()?.count || 0;
    const uniqueProfessors = db.prepare('SELECT COUNT(DISTINCT professor_name) as count FROM timetable_entries WHERE is_active = 1').get()?.count || 0;

    // Rozkład po dniach tygodnia
    const dayRows = db.prepare(`
      SELECT day_of_week, day_name, COUNT(*) as count 
      FROM timetable_entries 
      WHERE is_active = 1 
      GROUP BY day_of_week, day_name 
      ORDER BY day_of_week ASC
    `).all();

    res.json({
      totalEntries,
      substitutions,
      cancellations,
      activeScheduled,
      uniqueClassrooms,
      uniqueProfessors,
      byDay: dayRows
    });
  } catch (err) {
    console.error('[API /timetable/stats] Błąd pobierania statystyk planu:', err);
    res.status(500).json({ error: 'Nie udało się pobrać statystyk planu lekcji.' });
  }
});

// GET /api/timetable/:id - Szczegóły pojedynczej lekcji w planie
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu w planie lekcji.' });
    }
    res.json(dbTimetableEntryToFrontend(row));
  } catch (err) {
    console.error('[API /timetable/:id] Błąd pobierania wpisu:', err);
    res.status(500).json({ error: 'Nie udało się pobrać wpisu planu lekcji.' });
  }
});

// POST /api/timetable - Dodaj nowe zajęcia do planu (Tylko Dyrekcja / Admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const {
      subjectId = '',
      subjectName,
      subjectCode = '',
      subjectIcon = '📚',
      subjectCategory = 'Magia',
      dayOfWeek,
      dayName,
      startTime,
      endTime,
      classroom,
      professorId = '',
      professorName,
      professorAvatar = '',
      classYear = 'Klasa I',
      houseTarget = 'all',
      topic = '',
      notes = '',
      status = 'scheduled'
    } = req.body;

    if (!subjectName || !dayOfWeek || !startTime || !endTime || !classroom || !professorName) {
      return res.status(400).json({
        error: 'Wymagane pola: subjectName, dayOfWeek, startTime, endTime, classroom, professorName.'
      });
    }

    const dayNum = parseInt(dayOfWeek, 10);
    const resolvedDayName = dayName || DAY_NAMES[dayNum] || 'Poniedziałek';
    const id = req.body.id || `tt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const insert = db.prepare(`
      INSERT INTO timetable_entries (
        id, subject_id, subject_name, subject_code, subject_icon, subject_category,
        day_of_week, day_name, start_time, end_time, classroom,
        professor_id, professor_name, professor_avatar, class_year, house_target,
        topic, notes, status, is_active, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))
    `);

    insert.run(
      id, subjectId, subjectName, subjectCode, subjectIcon, subjectCategory,
      dayNum, resolvedDayName, startTime, endTime, classroom,
      professorId, professorName, professorAvatar, classYear, houseTarget,
      topic, notes, status
    );

    const createdRow = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(id);
    res.status(201).json(dbTimetableEntryToFrontend(createdRow));
  } catch (err) {
    console.error('[API POST /timetable] Błąd tworzenia zajęć:', err);
    res.status(500).json({ error: 'Nie udało się dodać zajęć do planu.' });
  }
});

// PUT /api/timetable/:id - Pełna edycja zajęć (Tylko Dyrekcja / Admin)
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu planu do edycji.' });
    }

    const {
      subjectId = existing.subject_id,
      subjectName = existing.subject_name,
      subjectCode = existing.subject_code,
      subjectIcon = existing.subject_icon,
      subjectCategory = existing.subject_category,
      dayOfWeek = existing.day_of_week,
      dayName = existing.day_name,
      startTime = existing.start_time,
      endTime = existing.end_time,
      classroom = existing.classroom,
      professorId = existing.professor_id,
      professorName = existing.professor_name,
      professorAvatar = existing.professor_avatar,
      classYear = existing.class_year,
      houseTarget = existing.house_target,
      topic = existing.topic,
      notes = existing.notes,
      status = existing.status,
      originalProfessorName = existing.original_professor_name,
      substituteProfessorId = existing.substitute_professor_id,
      substituteProfessorName = existing.substitute_professor_name,
      substitutionReason = existing.substitution_reason,
      cancellationReason = existing.cancellation_reason
    } = req.body;

    const dayNum = parseInt(dayOfWeek, 10);
    const resolvedDayName = dayName || DAY_NAMES[dayNum] || existing.day_name;

    const update = db.prepare(`
      UPDATE timetable_entries SET
        subject_id = ?, subject_name = ?, subject_code = ?, subject_icon = ?, subject_category = ?,
        day_of_week = ?, day_name = ?, start_time = ?, end_time = ?, classroom = ?,
        professor_id = ?, professor_name = ?, professor_avatar = ?, class_year = ?, house_target = ?,
        topic = ?, notes = ?, status = ?, original_professor_name = ?, substitute_professor_id = ?,
        substitute_professor_name = ?, substitution_reason = ?, cancellation_reason = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    update.run(
      subjectId, subjectName, subjectCode, subjectIcon, subjectCategory,
      dayNum, resolvedDayName, startTime, endTime, classroom,
      professorId, professorName, professorAvatar, classYear, houseTarget,
      topic, notes, status, originalProfessorName, substituteProfessorId,
      substituteProfessorName, substitutionReason, cancellationReason,
      req.params.id
    );

    const updatedRow = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    res.json(dbTimetableEntryToFrontend(updatedRow));
  } catch (err) {
    console.error('[API PUT /timetable/:id] Błąd edycji zajęć:', err);
    res.status(500).json({ error: 'Nie udało się zaktualizować wpisu w planie.' });
  }
});

// PATCH /api/timetable/:id/substitute - Ustaw zastępstwo (Tylko Dyrekcja / Admin)
router.patch('/:id/substitute', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu planu.' });
    }

    const {
      substituteProfessorId = '',
      substituteProfessorName,
      substitutionReason = '',
      classroom
    } = req.body;

    if (!substituteProfessorName) {
      return res.status(400).json({ error: 'Podaj nazwisko profesora zastępującego.' });
    }

    const origProf = existing.original_professor_name || existing.professor_name;
    const finalClassroom = classroom || existing.classroom;

    const update = db.prepare(`
      UPDATE timetable_entries SET
        status = 'substitution',
        original_professor_name = ?,
        substitute_professor_id = ?,
        substitute_professor_name = ?,
        substitution_reason = ?,
        classroom = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    update.run(origProf, substituteProfessorId, substituteProfessorName, substitutionReason, finalClassroom, req.params.id);

    const updatedRow = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    res.json(dbTimetableEntryToFrontend(updatedRow));
  } catch (err) {
    console.error('[API PATCH /timetable/:id/substitute] Błąd ustawiania zastępstwa:', err);
    res.status(500).json({ error: 'Nie udało się ustawić zastępstwa.' });
  }
});

// PATCH /api/timetable/:id/cancel - Odwołaj zajęcia (Dyrekcja lub Profesor prowadzący)
router.patch('/:id/cancel', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu planu.' });
    }

    const isDirector = req.user.role === 'admin';
    const isOwnerProfessor = req.user.role === 'professor' && (
      (existing.professor_id && existing.professor_id === req.user.id) ||
      (existing.professor_name && (
        (req.user.fullName && existing.professor_name.toLowerCase().includes(req.user.fullName.toLowerCase())) ||
        (req.user.username && existing.professor_name.toLowerCase().includes(req.user.username.toLowerCase()))
      ))
    );

    if (!isDirector && !isOwnerProfessor) {
      return res.status(403).json({
        error: 'Brak uprawnień. Tylko Dyrekcja lub profesor prowadzący dane zajęcia może je odwołać.'
      });
    }

    const { cancellationReason = 'Zajęcia odwołane decyzją Dyrekcji Cytadeli.' } = req.body;
    const origProf = existing.original_professor_name || existing.professor_name;

    const update = db.prepare(`
      UPDATE timetable_entries SET
        status = 'cancelled',
        original_professor_name = ?,
        cancellation_reason = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    update.run(origProf, cancellationReason, req.params.id);

    const updatedRow = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    res.json(dbTimetableEntryToFrontend(updatedRow));
  } catch (err) {
    console.error('[API PATCH /timetable/:id/cancel] Błąd odwoływania zajęć:', err);
    res.status(500).json({ error: 'Nie udało się odwołać zajęć.' });
  }
});

// PATCH /api/timetable/:id/restore - Przywróć zajęcia do planu (Dyrekcja lub Profesor prowadzący)
router.patch('/:id/restore', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu planu.' });
    }

    const isDirector = req.user.role === 'admin';
    const isOwnerProfessor = req.user.role === 'professor' && (
      (existing.professor_id && existing.professor_id === req.user.id) ||
      (existing.professor_name && (
        (req.user.fullName && existing.professor_name.toLowerCase().includes(req.user.fullName.toLowerCase())) ||
        (req.user.username && existing.professor_name.toLowerCase().includes(req.user.username.toLowerCase()))
      ))
    );

    if (!isDirector && !isOwnerProfessor) {
      return res.status(403).json({
        error: 'Brak uprawnień. Tylko Dyrekcja lub profesor prowadzący dane zajęcia może je przywrócić.'
      });
    }

    const update = db.prepare(`
      UPDATE timetable_entries SET
        status = 'scheduled',
        substitute_professor_id = '',
        substitute_professor_name = '',
        substitution_reason = '',
        cancellation_reason = '',
        updated_at = datetime('now')
      WHERE id = ?
    `);

    update.run(req.params.id);

    const updatedRow = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    res.json(dbTimetableEntryToFrontend(updatedRow));
  } catch (err) {
    console.error('[API PATCH /timetable/:id/restore] Błąd przywracania zajęć:', err);
    res.status(500).json({ error: 'Nie udało się przywrócić zajęć.' });
  }
});

// DELETE /api/timetable/:id - Usuń zajęcia z planu (Admin)
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono wpisu planu do usunięcia.' });
    }

    db.prepare('DELETE FROM timetable_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Wpis został usunięty z planu lekcji.' });
  } catch (err) {
    console.error('[API DELETE /timetable/:id] Błąd usuwania zajęć:', err);
    res.status(500).json({ error: 'Nie udało się usunąć wpisu z planu.' });
  }
});

export default router;
