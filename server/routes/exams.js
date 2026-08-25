import { Router } from 'express';
import db, {
  dbExamSessionToFrontend,
  dbExamToFrontend,
  dbExamSectionToFrontend,
  dbQuestionToFrontend,
  dbQuestionForStudentFrontend,
  dbExamAttemptToFrontend,
  dbAttemptAnswerToFrontend,
  dbExamGradingScaleToFrontend
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { discordBot } from '../discordBot.js';

const router = Router();

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function auditLog(actorId, actorName, actorRole, action, entityType, entityId, detail = '', metadata = {}) {
  db.prepare(`INSERT INTO exam_audit_log (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail, metadata) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    genId('eal'), nowISO(), actorId, actorName, actorRole, action, entityType, entityId, detail, JSON.stringify(metadata)
  );
}

function attemptEvent(attemptId, eventType, metadata = {}) {
  db.prepare('INSERT INTO exam_attempt_events (id, attempt_id, event_type, timestamp, metadata) VALUES (?,?,?,?,?)').run(
    genId('evt'), attemptId, eventType, nowISO(), JSON.stringify(metadata)
  );
}

// ==================== GRADING SCALES ====================

router.get('/scales', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM exam_grading_scales ORDER BY is_default DESC, name ASC').all();
  const scales = rows.map(r => {
    const entries = db.prepare('SELECT * FROM exam_grading_scale_entries WHERE scale_id = ? ORDER BY sort_order ASC').all(r.id);
    return dbExamGradingScaleToFrontend(r, entries);
  });
  res.json(scales);
});

router.post('/scales', requireAuth, requireRole('admin'), (req, res) => {
  const { name, entries } = req.body;
  if (!name) return res.status(400).json({ error: 'Podaj nazwę skali.' });
  const id = genId('scale');
  db.prepare('INSERT INTO exam_grading_scales (id, name, created_by) VALUES (?,?,?)').run(id, name, req.user.id);
  if (entries?.length) {
    const ins = db.prepare('INSERT INTO exam_grading_scale_entries (id, scale_id, name, abbreviation, min_percent, max_percent, is_passing, sort_order, color) VALUES (?,?,?,?,?,?,?,?,?)');
    entries.forEach((e, i) => ins.run(genId('gse'), id, e.name, e.abbreviation || '', e.minPercent, e.maxPercent, e.isPassing ? 1 : 0, i, e.color || ''));
  }
  auditLog(req.user.id, req.user.fullName, req.user.role, 'create_grading_scale', 'scale', id, name);
  const row = db.prepare('SELECT * FROM exam_grading_scales WHERE id = ?').get(id);
  const ents = db.prepare('SELECT * FROM exam_grading_scale_entries WHERE scale_id = ? ORDER BY sort_order ASC').all(id);
  res.status(201).json(dbExamGradingScaleToFrontend(row, ents));
});

router.put('/scales/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name, entries } = req.body;
  const existing = db.prepare('SELECT * FROM exam_grading_scales WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono skali.' });
  db.prepare('UPDATE exam_grading_scales SET name = ? WHERE id = ?').run(name || existing.name, req.params.id);
  if (entries) {
    db.prepare('DELETE FROM exam_grading_scale_entries WHERE scale_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT INTO exam_grading_scale_entries (id, scale_id, name, abbreviation, min_percent, max_percent, is_passing, sort_order, color) VALUES (?,?,?,?,?,?,?,?,?)');
    entries.forEach((e, i) => ins.run(e.id || genId('gse'), req.params.id, e.name, e.abbreviation || '', e.minPercent, e.maxPercent, e.isPassing ? 1 : 0, i, e.color || ''));
  }
  auditLog(req.user.id, req.user.fullName, req.user.role, 'update_grading_scale', 'scale', req.params.id, name || existing.name);
  const row = db.prepare('SELECT * FROM exam_grading_scales WHERE id = ?').get(req.params.id);
  const ents = db.prepare('SELECT * FROM exam_grading_scale_entries WHERE scale_id = ? ORDER BY sort_order ASC').all(req.params.id);
  res.json(dbExamGradingScaleToFrontend(row, ents));
});

router.delete('/scales/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exam_grading_scales WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono skali.' });
  if (existing.is_default) return res.status(400).json({ error: 'Nie można usunąć domyślnej skali.' });
  db.prepare('DELETE FROM exam_grading_scale_entries WHERE scale_id = ?').run(req.params.id);
  db.prepare('DELETE FROM exam_grading_scales WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== EXAM SESSIONS ====================

router.get('/sessions', requireAuth, (req, res) => {
  const { status, classYear } = req.query;
  let sql = 'SELECT * FROM exam_sessions';
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (classYear) { conditions.push("class_years LIKE ?"); params.push(`%${classYear}%`); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY start_date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(dbExamSessionToFrontend));
});

router.get('/sessions/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nie znaleziono sesji.' });
  const exams = db.prepare('SELECT * FROM exams WHERE session_id = ? ORDER BY access_start ASC').all(req.params.id);
  res.json({ session: dbExamSessionToFrontend(row), exams: exams.map(dbExamToFrontend) });
});

router.post('/sessions', requireAuth, requireRole('admin'), (req, res) => {
  const { name, schoolYear, description, startDate, endDate, classYears } = req.body;
  if (!name || !schoolYear || !startDate || !endDate) return res.status(400).json({ error: 'Wypełnij wymagane pola.' });
  const id = genId('esess');
  db.prepare('INSERT INTO exam_sessions (id, name, school_year, description, start_date, end_date, status, class_years, created_by) VALUES (?,?,?,?,?,?,?,?,?)').run(
    id, name, schoolYear, description || '', startDate, endDate, 'planned', JSON.stringify(classYears || []), req.user.id
  );
  auditLog(req.user.id, req.user.fullName, req.user.role, 'create_session', 'session', id, name);
  res.status(201).json(dbExamSessionToFrontend(db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id)));
});

router.put('/sessions/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono sesji.' });
  const { name, schoolYear, description, startDate, endDate, status, classYears } = req.body;
  db.prepare('UPDATE exam_sessions SET name=?, school_year=?, description=?, start_date=?, end_date=?, status=?, class_years=?, updated_at=? WHERE id=?').run(
    name || existing.name, schoolYear || existing.school_year, description ?? existing.description,
    startDate || existing.start_date, endDate || existing.end_date, status || existing.status,
    classYears ? JSON.stringify(classYears) : existing.class_years, nowISO(), req.params.id
  );
  auditLog(req.user.id, req.user.fullName, req.user.role, 'update_session', 'session', req.params.id, `Status: ${status || existing.status}`);
  res.json(dbExamSessionToFrontend(db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(req.params.id)));
});

router.delete('/sessions/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono sesji.' });
  const examCount = db.prepare('SELECT COUNT(*) as c FROM exams WHERE session_id = ?').get(req.params.id).c;
  if (examCount > 0) return res.status(400).json({ error: 'Sesja zawiera egzaminy. Usuń je najpierw lub zarchiwizuj sesję.' });
  db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== QUESTION BANK CATEGORIES ====================

router.get('/question-categories', requireAuth, (req, res) => {
  const { subjectId } = req.query;
  let rows;
  if (subjectId) {
    rows = db.prepare('SELECT * FROM question_bank_categories WHERE subject_id = ? ORDER BY sort_order ASC, name ASC').all(subjectId);
  } else {
    rows = db.prepare('SELECT * FROM question_bank_categories ORDER BY subject_id, sort_order ASC, name ASC').all();
  }
  res.json(rows.map(r => ({ id: r.id, subjectId: r.subject_id, name: r.name, parentId: r.parent_id, sortOrder: r.sort_order })));
});

router.post('/question-categories', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { subjectId, name, parentId } = req.body;
  if (!subjectId || !name) return res.status(400).json({ error: 'Podaj przedmiot i nazwę kategorii.' });
  const id = genId('qcat');
  db.prepare('INSERT INTO question_bank_categories (id, subject_id, name, parent_id) VALUES (?,?,?,?)').run(id, subjectId, name, parentId || '');
  res.status(201).json({ id, subjectId, name, parentId: parentId || '', sortOrder: 0 });
});

router.put('/question-categories/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { name, sortOrder } = req.body;
  db.prepare('UPDATE question_bank_categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?').run(name, sortOrder, req.params.id);
  res.json({ success: true });
});

router.delete('/question-categories/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  db.prepare('UPDATE questions SET category_id = ? WHERE category_id = ?').run('', req.params.id);
  db.prepare('DELETE FROM question_bank_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== QUESTION BANK ====================

router.get('/questions', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professor') return res.status(403).json({ error: 'Brak uprawnień.' });
  const { subjectId, categoryId, difficulty, type, search, tags, includeArchived } = req.query;
  let sql = 'SELECT * FROM questions';
  const params = [];
  const conditions = [];
  if (!includeArchived) { conditions.push('is_archived = 0'); }
  if (subjectId) { conditions.push('subject_id = ?'); params.push(subjectId); }
  if (categoryId) { conditions.push('category_id = ?'); params.push(categoryId); }
  if (difficulty) { conditions.push('difficulty = ?'); params.push(difficulty); }
  if (type) { conditions.push('type = ?'); params.push(type); }
  if (search) { conditions.push('content LIKE ?'); params.push(`%${search}%`); }
  if (tags) { conditions.push('tags LIKE ?'); params.push(`%${tags}%`); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  const questions = rows.map(r => {
    const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(r.id);
    return dbQuestionToFrontend(r, opts);
  });
  res.json(questions);
});

router.get('/questions/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'professor') return res.status(403).json({ error: 'Brak uprawnień.' });
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nie znaleziono pytania.' });
  const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(row.id);
  res.json(dbQuestionToFrontend(row, opts));
});

router.post('/questions', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { subjectId, categoryId, type, content, explanation, difficulty, tags, mediaUrl, mediaType, supplementaryMaterial, correctShortAnswers, fillGapsAnswers, options } = req.body;
  if (!subjectId || !type || !content) return res.status(400).json({ error: 'Wypełnij wymagane pola (przedmiot, typ, treść).' });
  const id = genId('q');
  db.prepare(`INSERT INTO questions (id, subject_id, category_id, type, content, explanation, difficulty, tags, media_url, media_type, supplementary_material, correct_short_answers, fill_gaps_answers, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, subjectId, categoryId || '', type, content, explanation || '', difficulty || 'medium',
    JSON.stringify(tags || []), mediaUrl || '', mediaType || '', supplementaryMaterial || '',
    JSON.stringify(correctShortAnswers || []), JSON.stringify(fillGapsAnswers || []), req.user.id
  );
  if (options?.length) {
    const ins = db.prepare('INSERT INTO question_options (id, question_id, content, is_correct, match_target, sort_order) VALUES (?,?,?,?,?,?)');
    options.forEach((o, i) => ins.run(genId('qo'), id, o.content, o.isCorrect ? 1 : 0, o.matchTarget || '', i));
  }
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(id);
  res.status(201).json(dbQuestionToFrontend(row, opts));
});

router.put('/questions/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono pytania.' });
  const inUse = db.prepare('SELECT eq.id FROM exam_questions eq JOIN exams e ON eq.exam_id = e.id WHERE eq.question_id = ? AND e.is_locked = 1').get(req.params.id);
  if (inUse) return res.status(400).json({ error: 'Pytanie jest używane w aktywnym egzaminie. Nie można edytować.' });
  const { categoryId, type, content, explanation, difficulty, tags, mediaUrl, mediaType, supplementaryMaterial, correctShortAnswers, fillGapsAnswers, options } = req.body;
  db.prepare(`UPDATE questions SET category_id=?, type=?, content=?, explanation=?, difficulty=?, tags=?, media_url=?, media_type=?, supplementary_material=?, correct_short_answers=?, fill_gaps_answers=?, updated_at=? WHERE id=?`).run(
    categoryId ?? existing.category_id, type || existing.type, content || existing.content,
    explanation ?? existing.explanation, difficulty || existing.difficulty,
    tags ? JSON.stringify(tags) : existing.tags, mediaUrl ?? existing.media_url,
    mediaType ?? existing.media_type, supplementaryMaterial ?? existing.supplementary_material,
    correctShortAnswers ? JSON.stringify(correctShortAnswers) : existing.correct_short_answers,
    fillGapsAnswers ? JSON.stringify(fillGapsAnswers) : existing.fill_gaps_answers,
    nowISO(), req.params.id
  );
  if (options) {
    db.prepare('DELETE FROM question_options WHERE question_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT INTO question_options (id, question_id, content, is_correct, match_target, sort_order) VALUES (?,?,?,?,?,?)');
    options.forEach((o, i) => ins.run(o.id || genId('qo'), req.params.id, o.content, o.isCorrect ? 1 : 0, o.matchTarget || '', i));
  }
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(req.params.id);
  res.json(dbQuestionToFrontend(row, opts));
});

router.delete('/questions/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  db.prepare('UPDATE questions SET is_archived = 1, updated_at = ? WHERE id = ?').run(nowISO(), req.params.id);
  res.json({ success: true });
});

// ==================== EXAMS CRUD ====================

router.get('/exams', requireAuth, (req, res) => {
  const { sessionId, subjectId, professorId, status, classYear } = req.query;
  let sql = 'SELECT * FROM exams';
  const params = [];
  const conditions = [];
  if (sessionId) { conditions.push('session_id = ?'); params.push(sessionId); }
  if (subjectId) { conditions.push('subject_id = ?'); params.push(subjectId); }
  if (professorId) { conditions.push('professor_id = ?'); params.push(professorId); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (classYear) { conditions.push('class_year = ?'); params.push(classYear); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY access_start ASC, created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(dbExamToFrontend));
});

router.get('/exams/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY sort_order ASC').all(row.id);
  const examQuestions = db.prepare('SELECT eq.*, q.type, q.content, q.difficulty, q.media_url, q.media_type, q.supplementary_material FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = ? ORDER BY eq.sort_order ASC').all(row.id);
  const questionsWithOpts = examQuestions.map(eq => {
    const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(eq.question_id);
    const rubric = db.prepare('SELECT * FROM exam_rubrics WHERE exam_question_id = ?').get(eq.id);
    let criteria = [];
    if (rubric) criteria = db.prepare('SELECT * FROM exam_rubric_criteria WHERE rubric_id = ? ORDER BY sort_order ASC').all(rubric.id);
    return {
      id: eq.id,
      examId: eq.exam_id,
      sectionId: eq.section_id,
      questionId: eq.question_id,
      points: eq.points,
      partialCredit: eq.partial_credit,
      sortOrder: eq.sort_order,
      question: dbQuestionToFrontend({ ...db.prepare('SELECT * FROM questions WHERE id = ?').get(eq.question_id) }, opts),
      rubric: rubric ? { id: rubric.id, title: rubric.title, criteria: criteria.map(c => ({ id: c.id, description: c.description, points: c.points, sortOrder: c.sort_order })) } : null
    };
  });
  res.json({
    exam: dbExamToFrontend(row),
    sections: sections.map(dbExamSectionToFrontend),
    questions: questionsWithOpts
  });
});

router.post('/exams', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const d = req.body;
  if (!d.sessionId || !d.subjectId || !d.title || !d.classYear) return res.status(400).json({ error: 'Wypełnij wymagane pola.' });
  const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(d.sessionId);
  if (!session) return res.status(404).json({ error: 'Nie znaleziono sesji egzaminacyjnej.' });
  const id = genId('exam');
  const subjectRow = db.prepare('SELECT name FROM subjects WHERE id = ?').get(d.subjectId);
  const subjectName = subjectRow?.name || d.subjectName || d.subjectId;
  db.prepare(`INSERT INTO exams (id, session_id, subject_id, subject_name, title, description, professor_id, professor_name, class_year, access_start, access_end, time_limit_minutes, end_policy, max_attempts, passing_threshold, navigation_mode, shuffle_questions, shuffle_options, use_random_pool, random_easy, random_medium, random_hard, random_very_hard, results_visibility, results_publish_date, show_answers_after, show_points_after, show_correct_answers, show_comments, instructions, grading_scale_id, status, template_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, d.sessionId, d.subjectId, subjectName, d.title, d.description || '',
    req.user.id, req.user.fullName, d.classYear,
    d.accessStart || '', d.accessEnd || '', d.timeLimitMinutes || 60, d.endPolicy || 'soft_limit',
    d.maxAttempts || 1, d.passingThreshold ?? 40, d.navigationMode || 'free',
    d.shuffleQuestions ? 1 : 0, d.shuffleOptions ? 1 : 0,
    d.useRandomPool ? 1 : 0, d.randomEasy || 0, d.randomMedium || 0, d.randomHard || 0, d.randomVeryHard || 0,
    d.resultsVisibility || 'after_approval', d.resultsPublishDate || '',
    d.showAnswersAfter ? 1 : 0, d.showPointsAfter !== false ? 1 : 0,
    d.showCorrectAnswers ? 1 : 0, d.showComments !== false ? 1 : 0,
    d.instructions || '', d.gradingScaleId || '', 'draft', d.templateId || ''
  );
  auditLog(req.user.id, req.user.fullName, req.user.role, 'create_exam', 'exam', id, d.title);
  res.status(201).json(dbExamToFrontend(db.prepare('SELECT * FROM exams WHERE id = ?').get(id)));
});

router.put('/exams/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const existing = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  if (existing.is_locked && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Egzamin jest zablokowany — uczniowie już rozpoczęli podejścia. Tylko administrator może dokonać korekty.' });
  }
  const d = req.body;
  db.prepare(`UPDATE exams SET title=?, description=?, access_start=?, access_end=?, time_limit_minutes=?, end_policy=?, max_attempts=?, passing_threshold=?, navigation_mode=?, shuffle_questions=?, shuffle_options=?, use_random_pool=?, random_easy=?, random_medium=?, random_hard=?, random_very_hard=?, results_visibility=?, results_publish_date=?, show_answers_after=?, show_points_after=?, show_correct_answers=?, show_comments=?, instructions=?, grading_scale_id=?, updated_at=? WHERE id=?`).run(
    d.title ?? existing.title, d.description ?? existing.description,
    d.accessStart ?? existing.access_start, d.accessEnd ?? existing.access_end,
    d.timeLimitMinutes ?? existing.time_limit_minutes, d.endPolicy ?? existing.end_policy,
    d.maxAttempts ?? existing.max_attempts, d.passingThreshold ?? existing.passing_threshold,
    d.navigationMode ?? existing.navigation_mode,
    d.shuffleQuestions !== undefined ? (d.shuffleQuestions ? 1 : 0) : existing.shuffle_questions,
    d.shuffleOptions !== undefined ? (d.shuffleOptions ? 1 : 0) : existing.shuffle_options,
    d.useRandomPool !== undefined ? (d.useRandomPool ? 1 : 0) : existing.use_random_pool,
    d.randomEasy ?? existing.random_easy, d.randomMedium ?? existing.random_medium,
    d.randomHard ?? existing.random_hard, d.randomVeryHard ?? existing.random_very_hard,
    d.resultsVisibility ?? existing.results_visibility, d.resultsPublishDate ?? existing.results_publish_date,
    d.showAnswersAfter !== undefined ? (d.showAnswersAfter ? 1 : 0) : existing.show_answers_after,
    d.showPointsAfter !== undefined ? (d.showPointsAfter ? 1 : 0) : existing.show_points_after,
    d.showCorrectAnswers !== undefined ? (d.showCorrectAnswers ? 1 : 0) : existing.show_correct_answers,
    d.showComments !== undefined ? (d.showComments ? 1 : 0) : existing.show_comments,
    d.instructions ?? existing.instructions, d.gradingScaleId ?? existing.grading_scale_id,
    nowISO(), req.params.id
  );
  auditLog(req.user.id, req.user.fullName, req.user.role, 'update_exam', 'exam', req.params.id, d.title || existing.title);
  res.json(dbExamToFrontend(db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id)));
});

function recalcExamTotals(examId) {
  const stats = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(points),0) as pts FROM exam_questions WHERE exam_id = ?').get(examId);
  db.prepare('UPDATE exams SET total_questions = ?, total_points = ?, updated_at = ? WHERE id = ?').run(stats.cnt, stats.pts, nowISO(), examId);
}

router.post('/exams/:id/publish', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  if (exam.total_questions === 0 && !exam.use_random_pool) return res.status(400).json({ error: 'Egzamin nie zawiera pytań.' });
  db.prepare('UPDATE exams SET status = ?, published_at = ?, version = version + 1, updated_at = ? WHERE id = ?').run('published', nowISO(), nowISO(), req.params.id);
  auditLog(req.user.id, req.user.fullName, req.user.role, 'publish_exam', 'exam', req.params.id, exam.title);
  
  // Asynchroniczne ogłoszenie na Discordzie
  discordBot.announceExamOpened(exam).catch(e => console.error('Discord announce error:', e.message));

  res.json(dbExamToFrontend(db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id)));
});

router.post('/exams/:id/close', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  db.prepare("UPDATE exams SET status = 'closed', updated_at = ? WHERE id = ?").run(nowISO(), req.params.id);
  auditLog(req.user.id, req.user.fullName, req.user.role, 'close_exam', 'exam', req.params.id, '');
  res.json(dbExamToFrontend(db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id)));
});

router.post('/exams/:id/duplicate', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const src = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const newId = genId('exam');
  const cols = 'session_id, subject_id, subject_name, title, description, professor_id, professor_name, class_year, access_start, access_end, time_limit_minutes, end_policy, max_attempts, passing_threshold, navigation_mode, shuffle_questions, shuffle_options, use_random_pool, random_easy, random_medium, random_hard, random_very_hard, results_visibility, results_publish_date, show_answers_after, show_points_after, show_correct_answers, show_comments, instructions, grading_scale_id, total_points, total_questions';
  db.prepare(`INSERT INTO exams (id, ${cols}, status, version, is_locked, created_at, updated_at) SELECT ?, ${cols}, 'draft', 1, 0, ?, ? FROM exams WHERE id = ?`).run(newId, nowISO(), nowISO(), req.params.id);
  db.prepare("UPDATE exams SET title = title || ' (kopia)' WHERE id = ?").run(newId);
  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ?').all(req.params.id);
  const sectionMap = {};
  sections.forEach(s => {
    const newSid = genId('esec');
    sectionMap[s.id] = newSid;
    db.prepare('INSERT INTO exam_sections (id, exam_id, title, description, instructions, max_points, sort_order) VALUES (?,?,?,?,?,?,?)').run(newSid, newId, s.title, s.description, s.instructions, s.max_points, s.sort_order);
  });
  const eqs = db.prepare('SELECT * FROM exam_questions WHERE exam_id = ?').all(req.params.id);
  eqs.forEach(eq => {
    const newEqId = genId('eq');
    db.prepare('INSERT INTO exam_questions (id, exam_id, section_id, question_id, points, partial_credit, sort_order) VALUES (?,?,?,?,?,?,?)').run(
      newEqId, newId, sectionMap[eq.section_id] || '', eq.question_id, eq.points, eq.partial_credit, eq.sort_order
    );
    const rubric = db.prepare('SELECT * FROM exam_rubrics WHERE exam_question_id = ?').get(eq.id);
    if (rubric) {
      const newRubId = genId('rub');
      db.prepare('INSERT INTO exam_rubrics (id, exam_question_id, title) VALUES (?,?,?)').run(newRubId, newEqId, rubric.title);
      const criteria = db.prepare('SELECT * FROM exam_rubric_criteria WHERE rubric_id = ?').all(rubric.id);
      criteria.forEach(c => {
        db.prepare('INSERT INTO exam_rubric_criteria (id, rubric_id, description, points, sort_order) VALUES (?,?,?,?,?)').run(genId('rc'), newRubId, c.description, c.points, c.sort_order);
      });
    }
  });
  res.status(201).json(dbExamToFrontend(db.prepare('SELECT * FROM exams WHERE id = ?').get(newId)));
});

router.post('/exams/:id/save-template', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const { name, description } = req.body;
  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY sort_order ASC').all(req.params.id);
  const config = { timeLimitMinutes: exam.time_limit_minutes, endPolicy: exam.end_policy, maxAttempts: exam.max_attempts, passingThreshold: exam.passing_threshold, navigationMode: exam.navigation_mode, shuffleQuestions: !!exam.shuffle_questions, shuffleOptions: !!exam.shuffle_options, resultsVisibility: exam.results_visibility, totalPoints: exam.total_points };
  const id = genId('tmpl');
  db.prepare('INSERT INTO exam_templates (id, name, subject_id, description, config, sections, created_by) VALUES (?,?,?,?,?,?,?)').run(
    id, name || `Szablon: ${exam.title}`, exam.subject_id, description || '', JSON.stringify(config),
    JSON.stringify(sections.map(s => ({ title: s.title, description: s.description, instructions: s.instructions, maxPoints: s.max_points }))),
    req.user.id
  );
  res.status(201).json({ id, name: name || `Szablon: ${exam.title}` });
});

// ==================== EXAM SECTIONS ====================

router.post('/exams/:id/sections', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { title, description, instructions, maxPoints } = req.body;
  if (!title) return res.status(400).json({ error: 'Podaj tytuł sekcji.' });
  const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM exam_sections WHERE exam_id = ?').get(req.params.id).m || 0;
  const id = genId('esec');
  db.prepare('INSERT INTO exam_sections (id, exam_id, title, description, instructions, max_points, sort_order) VALUES (?,?,?,?,?,?,?)').run(
    id, req.params.id, title, description || '', instructions || '', maxPoints || 0, maxSort + 1
  );
  res.status(201).json(dbExamSectionToFrontend(db.prepare('SELECT * FROM exam_sections WHERE id = ?').get(id)));
});

router.put('/sections/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { title, description, instructions, maxPoints, sortOrder } = req.body;
  db.prepare('UPDATE exam_sections SET title=COALESCE(?,title), description=COALESCE(?,description), instructions=COALESCE(?,instructions), max_points=COALESCE(?,max_points), sort_order=COALESCE(?,sort_order) WHERE id=?').run(
    title, description, instructions, maxPoints, sortOrder, req.params.id
  );
  res.json(dbExamSectionToFrontend(db.prepare('SELECT * FROM exam_sections WHERE id = ?').get(req.params.id)));
});

router.delete('/sections/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const sec = db.prepare('SELECT exam_id FROM exam_sections WHERE id = ?').get(req.params.id);
  db.prepare("UPDATE exam_questions SET section_id = '' WHERE section_id = ?").run(req.params.id);
  db.prepare('DELETE FROM exam_sections WHERE id = ?').run(req.params.id);
  if (sec) recalcExamTotals(sec.exam_id);
  res.json({ success: true });
});

// ==================== EXAM QUESTIONS (assigning to exam) ====================

router.post('/exams/:id/exam-questions', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  if (exam.is_locked && req.user.role !== 'admin') return res.status(400).json({ error: 'Egzamin zablokowany.' });
  const { questionId, sectionId, points, partialCredit } = req.body;
  if (!questionId) return res.status(400).json({ error: 'Podaj ID pytania.' });
  const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM exam_questions WHERE exam_id = ?').get(req.params.id).m || 0;
  const id = genId('eq');
  db.prepare('INSERT INTO exam_questions (id, exam_id, section_id, question_id, points, partial_credit, sort_order) VALUES (?,?,?,?,?,?,?)').run(
    id, req.params.id, sectionId || '', questionId, points || 1, partialCredit || 'none', maxSort + 1
  );
  recalcExamTotals(req.params.id);
  res.status(201).json({ id, examId: req.params.id, questionId, sectionId: sectionId || '', points: points || 1, partialCredit: partialCredit || 'none', sortOrder: maxSort + 1 });
});

router.post('/exams/:id/exam-questions/bulk', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const { questionIds, sectionId, defaultPoints } = req.body;
  if (!questionIds?.length) return res.status(400).json({ error: 'Podaj listę pytań.' });
  let maxSort = db.prepare('SELECT MAX(sort_order) as m FROM exam_questions WHERE exam_id = ?').get(req.params.id).m || 0;
  const ins = db.prepare('INSERT INTO exam_questions (id, exam_id, section_id, question_id, points, partial_credit, sort_order) VALUES (?,?,?,?,?,?,?)');
  const added = [];
  questionIds.forEach(qid => {
    maxSort++;
    const id = genId('eq');
    ins.run(id, req.params.id, sectionId || '', qid, defaultPoints || 1, 'none', maxSort);
    added.push(id);
  });
  recalcExamTotals(req.params.id);
  res.status(201).json({ added: added.length });
});

router.put('/exam-questions/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { points, partialCredit, sectionId, sortOrder } = req.body;
  db.prepare('UPDATE exam_questions SET points=COALESCE(?,points), partial_credit=COALESCE(?,partial_credit), section_id=COALESCE(?,section_id), sort_order=COALESCE(?,sort_order) WHERE id=?').run(
    points, partialCredit, sectionId, sortOrder, req.params.id
  );
  const eq = db.prepare('SELECT exam_id FROM exam_questions WHERE id = ?').get(req.params.id);
  if (eq) recalcExamTotals(eq.exam_id);
  res.json({ success: true });
});

router.delete('/exam-questions/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const eq = db.prepare('SELECT exam_id FROM exam_questions WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM exam_rubric_criteria WHERE rubric_id IN (SELECT id FROM exam_rubrics WHERE exam_question_id = ?)').run(req.params.id);
  db.prepare('DELETE FROM exam_rubrics WHERE exam_question_id = ?').run(req.params.id);
  db.prepare('DELETE FROM exam_questions WHERE id = ?').run(req.params.id);
  if (eq) recalcExamTotals(eq.exam_id);
  res.json({ success: true });
});

router.post('/exams/:id/exam-questions/reorder', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { order } = req.body;
  if (!order?.length) return res.status(400).json({ error: 'Pusta lista kolejności.' });
  const upd = db.prepare('UPDATE exam_questions SET sort_order = ? WHERE id = ?');
  order.forEach((id, idx) => upd.run(idx, id));
  res.json({ success: true });
});

// ==================== RUBRICS ====================

router.post('/exam-questions/:id/rubric', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { title, criteria } = req.body;
  let rubric = db.prepare('SELECT * FROM exam_rubrics WHERE exam_question_id = ?').get(req.params.id);
  if (rubric) {
    db.prepare('UPDATE exam_rubrics SET title = ? WHERE id = ?').run(title || '', rubric.id);
    db.prepare('DELETE FROM exam_rubric_criteria WHERE rubric_id = ?').run(rubric.id);
  } else {
    const id = genId('rub');
    db.prepare('INSERT INTO exam_rubrics (id, exam_question_id, title) VALUES (?,?,?)').run(id, req.params.id, title || '');
    rubric = { id };
  }
  if (criteria?.length) {
    const ins = db.prepare('INSERT INTO exam_rubric_criteria (id, rubric_id, description, points, sort_order) VALUES (?,?,?,?,?)');
    criteria.forEach((c, i) => ins.run(genId('rc'), rubric.id, c.description, c.points || 1, i));
  }
  const updatedCriteria = db.prepare('SELECT * FROM exam_rubric_criteria WHERE rubric_id = ? ORDER BY sort_order ASC').all(rubric.id);
  res.json({ id: rubric.id, title: title || '', criteria: updatedCriteria.map(c => ({ id: c.id, description: c.description, points: c.points, sortOrder: c.sort_order })) });
});

// ==================== TEMPLATES ====================

router.get('/templates', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const rows = db.prepare('SELECT * FROM exam_templates ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({
    id: r.id, name: r.name, subjectId: r.subject_id, description: r.description,
    config: (() => { try { return JSON.parse(r.config); } catch { return {}; } })(),
    sections: (() => { try { return JSON.parse(r.sections); } catch { return []; } })(),
    createdBy: r.created_by, createdAt: r.created_at
  })));
});

router.delete('/templates/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  db.prepare('DELETE FROM exam_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== STUDENT EXAM CENTER ====================

router.get('/student/center', requireAuth, (req, res) => {
  const user = req.user;
  const classYear = (() => {
    const u = db.prepare('SELECT class_year FROM users WHERE id = ?').get(user.id);
    return u?.class_year || '';
  })();

  const sessions = db.prepare("SELECT * FROM exam_sessions WHERE status != 'archived' ORDER BY start_date DESC").all();
  const now = nowISO();

  const result = sessions.map(sess => {
    const sessionData = dbExamSessionToFrontend(sess);
    const classYears = (() => { try { return JSON.parse(sess.class_years || '[]'); } catch { return []; } })();
    if (classYears.length > 0 && !classYears.some(cy => classYear.includes(cy))) {
      return null;
    }
    const exams = db.prepare("SELECT * FROM exams WHERE session_id = ? AND (class_year = ? OR class_year = '') AND status != 'draft' ORDER BY access_start ASC").all(sess.id, classYear);
    const examCards = exams.map(exam => {
      const attempt = db.prepare("SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? ORDER BY attempt_number DESC LIMIT 1").get(exam.id, user.id);
      const attemptsCount = db.prepare('SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND student_id = ?').get(exam.id, user.id).c;
      const exception = db.prepare('SELECT * FROM exam_exceptions WHERE exam_id = ? AND student_id = ?').get(exam.id, user.id);
      const effectiveAccessEnd = exception?.custom_access_end || exam.access_end;
      const effectiveMaxAttempts = (exam.max_attempts || 1) + (exception?.extra_attempts || 0);

      let studentStatus = 'locked';
      if (attempt?.status === 'approved' || attempt?.status === 'graded') {
        const isPublished = exam.results_visibility === 'immediate' || (exam.results_visibility === 'after_approval' && attempt.status === 'approved') || (exam.results_visibility === 'scheduled' && exam.results_publish_date && exam.results_publish_date <= now);
        studentStatus = isPublished ? 'graded' : 'awaiting_review';
      } else if (attempt?.status === 'submitted' || attempt?.status === 'auto_submitted' || attempt?.status === 'grading') {
        studentStatus = 'awaiting_review';
      } else if (attempt?.status === 'in_progress') {
        studentStatus = 'in_progress';
      } else if (exam.status === 'closed' && !attempt) {
        studentStatus = 'missed';
      } else if (exam.access_start && exam.access_start > now) {
        studentStatus = 'upcoming';
      } else if (exam.access_start && exam.access_start <= now && (!effectiveAccessEnd || effectiveAccessEnd >= now)) {
        studentStatus = attemptsCount < effectiveMaxAttempts ? 'available' : 'awaiting_review';
      } else if (effectiveAccessEnd && effectiveAccessEnd < now) {
        studentStatus = attempt ? 'awaiting_review' : 'missed';
      } else if (exam.status === 'published') {
        studentStatus = 'upcoming';
      }

      const examCard = dbExamToFrontend(exam);
      return {
        ...examCard,
        studentStatus,
        attemptId: attempt?.id || null,
        attemptStatus: attempt?.status || null,
        attemptsUsed: attemptsCount,
        maxAttempts: effectiveMaxAttempts,
        totalScore: attempt?.total_score || 0,
        maxScore: attempt?.max_score || 0,
        percentage: attempt?.percentage || 0,
        gradeName: attempt?.grade_name || '',
        isPassing: !!attempt?.is_passing
      };
    });
    return { session: sessionData, exams: examCards };
  }).filter(Boolean);

  res.json(result);
});

router.get('/student/exam/:id', requireAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY sort_order ASC').all(exam.id);
  const prof = db.prepare('SELECT full_name, avatar FROM users WHERE id = ?').get(exam.professor_id);
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? ORDER BY attempt_number DESC LIMIT 1").get(exam.id, req.user.id);
  const attemptsCount = db.prepare('SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND student_id = ?').get(exam.id, req.user.id).c;
  const exception = db.prepare('SELECT * FROM exam_exceptions WHERE exam_id = ? AND student_id = ?').get(exam.id, req.user.id);

  res.json({
    exam: dbExamToFrontend(exam),
    sections: sections.map(dbExamSectionToFrontend),
    professor: prof ? { name: prof.full_name, avatar: prof.avatar } : null,
    currentAttempt: attempt ? dbExamAttemptToFrontend(attempt) : null,
    attemptsUsed: attemptsCount,
    exception: exception ? { extraMinutes: exception.extra_minutes, customAccessEnd: exception.custom_access_end, extraAttempts: exception.extra_attempts } : null
  });
});

router.get('/student/history', requireAuth, (req, res) => {
  const attempts = db.prepare(`
    SELECT ea.*, e.title as exam_title, e.subject_name, e.subject_id, e.results_visibility, e.results_publish_date, es.name as session_name, es.school_year
    FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    JOIN exam_sessions es ON e.session_id = es.id
    WHERE ea.student_id = ?
    ORDER BY ea.started_at DESC
  `).all(req.user.id);
  const now = nowISO();
  res.json(attempts.map(a => {
    const isPublished = a.results_visibility === 'immediate' || (a.results_visibility === 'after_approval' && a.status === 'approved') || (a.results_visibility === 'scheduled' && a.results_publish_date && a.results_publish_date <= now);
    return {
      ...dbExamAttemptToFrontend(a),
      examTitle: a.exam_title,
      subjectName: a.subject_name,
      subjectId: a.subject_id,
      sessionName: a.session_name,
      schoolYear: a.school_year,
      resultsPublished: isPublished
    };
  }));
});

// ==================== EXAM TAKING ====================

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestionSet(exam) {
  if (exam.use_random_pool) {
    const pool = { easy: [], medium: [], hard: [], very_hard: [] };
    const allQs = db.prepare('SELECT eq.id, q.difficulty FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = ?').all(exam.id);
    allQs.forEach(q => {
      const d = q.difficulty || 'medium';
      if (pool[d]) pool[d].push(q.id);
      else pool.medium.push(q.id);
    });
    const picked = [];
    const pick = (arr, count) => shuffleArray(arr).slice(0, count);
    picked.push(...pick(pool.easy, exam.random_easy || 0));
    picked.push(...pick(pool.medium, exam.random_medium || 0));
    picked.push(...pick(pool.hard, exam.random_hard || 0));
    picked.push(...pick(pool.very_hard, exam.random_very_hard || 0));
    return picked;
  }
  return db.prepare('SELECT id FROM exam_questions WHERE exam_id = ? ORDER BY sort_order ASC').all(exam.id).map(r => r.id);
}

router.post('/attempts/start/:examId', requireAuth, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  if (exam.status !== 'published' && exam.status !== 'active') return res.status(400).json({ error: 'Egzamin nie jest dostępny.' });

  const now = nowISO();
  const exception = db.prepare('SELECT * FROM exam_exceptions WHERE exam_id = ? AND student_id = ?').get(exam.id, req.user.id);
  const effectiveAccessEnd = exception?.custom_access_end || exam.access_end;
  const effectiveMaxAttempts = (exam.max_attempts || 1) + (exception?.extra_attempts || 0);
  const extraMinutes = exception?.extra_minutes || 0;

  if (exam.access_start && exam.access_start > now) return res.status(400).json({ error: 'Egzamin jeszcze się nie rozpoczął.' });
  if (effectiveAccessEnd && effectiveAccessEnd < now) return res.status(400).json({ error: 'Okno dostępności egzaminu zostało zamknięte.' });

  const existing = db.prepare("SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'").get(exam.id, req.user.id);
  if (existing) {
    if (existing.time_expires_at < now) {
      autoSubmitAttempt(existing.id);
      return res.status(400).json({ error: 'Twoje poprzednie podejście wygasło i zostało automatycznie oddane.' });
    }
    return res.json({ attemptId: existing.id, resumed: true });
  }

  const attemptsCount = db.prepare('SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND student_id = ?').get(exam.id, req.user.id).c;
  if (attemptsCount >= effectiveMaxAttempts) return res.status(400).json({ error: 'Wykorzystano wszystkie podejścia.' });

  const questionSet = buildQuestionSet(exam);
  const questionOrder = exam.shuffle_questions ? shuffleArray(questionSet) : questionSet;
  const optionsOrder = {};
  if (exam.shuffle_options) {
    questionOrder.forEach(eqId => {
      const eq = db.prepare('SELECT question_id FROM exam_questions WHERE id = ?').get(eqId);
      if (eq) {
        const opts = db.prepare('SELECT id FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(eq.question_id);
        optionsOrder[eqId] = shuffleArray(opts.map(o => o.id));
      }
    });
  }

  const timeLimitMs = ((exam.time_limit_minutes || 60) + extraMinutes) * 60 * 1000;
  let expiresAt = new Date(Date.now() + timeLimitMs).toISOString().replace('T', ' ').slice(0, 19);
  if (exam.end_policy === 'hard_cutoff' && effectiveAccessEnd && effectiveAccessEnd < expiresAt) {
    expiresAt = effectiveAccessEnd;
  }

  const attemptId = genId('att');
  db.prepare(`INSERT INTO exam_attempts (id, exam_id, student_id, student_name, attempt_number, status, started_at, time_expires_at, question_set, question_order, options_order, max_score, navigation_mode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    attemptId, exam.id, req.user.id, req.user.fullName, attemptsCount + 1, 'in_progress', now, expiresAt,
    JSON.stringify(questionSet), JSON.stringify(questionOrder), JSON.stringify(optionsOrder),
    exam.total_points, exam.navigation_mode
  );

  questionOrder.forEach(eqId => {
    const eq = db.prepare('SELECT question_id, points FROM exam_questions WHERE id = ?').get(eqId);
    if (eq) {
      db.prepare('INSERT INTO attempt_answers (id, attempt_id, exam_question_id, question_id, max_score) VALUES (?,?,?,?,?)').run(
        genId('ans'), attemptId, eqId, eq.question_id, eq.points
      );
    }
  });

  if (!exam.is_locked) {
    db.prepare("UPDATE exams SET is_locked = 1, status = 'active', updated_at = ? WHERE id = ?").run(now, exam.id);
  }

  attemptEvent(attemptId, 'start');
  auditLog(req.user.id, req.user.fullName, req.user.role, 'start_attempt', 'attempt', attemptId, exam.title);

  res.status(201).json({ attemptId, resumed: false });
});

router.get('/attempts/:id', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  if (attempt.student_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Brak dostępu.' });
  }

  const now = nowISO();
  if (attempt.status === 'in_progress' && attempt.time_expires_at < now) {
    autoSubmitAttempt(attempt.id);
    const updated = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
    return res.json(buildAttemptResponse(updated, req.user));
  }

  res.json(buildAttemptResponse(attempt, req.user));
});

function buildAttemptResponse(attempt, user) {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt.exam_id);
  const questionOrder = (() => { try { return JSON.parse(attempt.question_order || '[]'); } catch { return []; } })();
  const optionsOrder = (() => { try { return JSON.parse(attempt.options_order || '{}'); } catch { return {}; } })();
  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY sort_order ASC').all(exam.id);
  const answers = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?').all(attempt.id);
  const answerMap = {};
  answers.forEach(a => { answerMap[a.exam_question_id] = dbAttemptAnswerToFrontend(a); });

  const isStudent = attempt.student_id === user.id;
  const questions = questionOrder.map(eqId => {
    const eq = db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(eqId);
    if (!eq) return null;
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(eq.question_id);
    if (!q) return null;
    const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(eq.question_id);
    const questionData = isStudent && attempt.status === 'in_progress'
      ? dbQuestionForStudentFrontend(q, opts, optionsOrder[eqId])
      : dbQuestionToFrontend(q, opts);
    return {
      examQuestionId: eqId,
      sectionId: eq.section_id,
      points: eq.points,
      partialCredit: eq.partial_credit,
      question: questionData,
      answer: answerMap[eqId] || null
    };
  }).filter(Boolean);

  return {
    attempt: dbExamAttemptToFrontend(attempt),
    exam: dbExamToFrontend(exam),
    sections: sections.map(dbExamSectionToFrontend),
    questions
  };
}

router.post('/attempts/:id/save', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  if (attempt.student_id !== req.user.id) return res.status(403).json({ error: 'To nie twoje podejście.' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Podejście zakończone.' });

  const now = nowISO();
  if (attempt.time_expires_at < now) {
    autoSubmitAttempt(attempt.id);
    return res.status(400).json({ error: 'Czas egzaminu upłynął. Odpowiedzi zostały automatycznie oddane.' });
  }

  const { examQuestionId, answerText, selectedOptions, matchingPairs, ordering, fillGaps } = req.body;
  if (!examQuestionId) return res.status(400).json({ error: 'Brak ID pytania.' });

  const answer = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ? AND exam_question_id = ?').get(attempt.id, examQuestionId);
  if (!answer) return res.status(404).json({ error: 'Nie znaleziono odpowiedzi.' });

  db.prepare('UPDATE attempt_answers SET answer_text=?, selected_options=?, matching_pairs=?, ordering=?, fill_gaps=?, updated_at=? WHERE id=?').run(
    answerText ?? answer.answer_text,
    selectedOptions ? JSON.stringify(selectedOptions) : answer.selected_options,
    matchingPairs ? JSON.stringify(matchingPairs) : answer.matching_pairs,
    ordering ? JSON.stringify(ordering) : answer.ordering,
    fillGaps ? JSON.stringify(fillGaps) : answer.fill_gaps,
    now, answer.id
  );

  db.prepare('INSERT OR REPLACE INTO attempt_answer_autosaves (id, attempt_id, exam_question_id, answer_data, saved_at) VALUES (?,?,?,?,?)').run(
    `as-${attempt.id}-${examQuestionId}`, attempt.id, examQuestionId,
    JSON.stringify({ answerText, selectedOptions, matchingPairs, ordering, fillGaps }), now
  );

  res.json({ saved: true, savedAt: now });
});

router.post('/attempts/:id/flag', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
  if (!attempt || attempt.student_id !== req.user.id) return res.status(403).json({ error: 'Brak dostępu.' });
  const { examQuestionId, flagged } = req.body;
  const flaggedQuestions = (() => { try { return JSON.parse(attempt.flagged_questions || '[]'); } catch { return []; } })();
  if (flagged && !flaggedQuestions.includes(examQuestionId)) flaggedQuestions.push(examQuestionId);
  else if (!flagged) {
    const idx = flaggedQuestions.indexOf(examQuestionId);
    if (idx !== -1) flaggedQuestions.splice(idx, 1);
  }
  db.prepare('UPDATE exam_attempts SET flagged_questions = ? WHERE id = ?').run(JSON.stringify(flaggedQuestions), attempt.id);
  res.json({ flaggedQuestions });
});

router.post('/attempts/:id/submit', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  if (attempt.student_id !== req.user.id) return res.status(403).json({ error: 'To nie twoje podejście.' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Podejście już oddane.' });

  submitAttempt(attempt.id, 'submitted');
  attemptEvent(attempt.id, 'submit');
  auditLog(req.user.id, req.user.fullName, req.user.role, 'submit_attempt', 'attempt', attempt.id, '');

  const updated = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attempt.id);
  res.json(dbExamAttemptToFrontend(updated));
});

function autoSubmitAttempt(attemptId) {
  submitAttempt(attemptId, 'auto_submitted');
  attemptEvent(attemptId, 'auto_submit');
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attemptId);
  if (attempt) auditLog('system', 'System', 'system', 'auto_submit_attempt', 'attempt', attemptId, '');
}

function submitAttempt(attemptId, status) {
  const now = nowISO();
  const answers = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?').all(attemptId);
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attemptId);
  if (!attempt) return;
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt.exam_id);

  let autoTotal = 0;
  let needsManual = false;

  answers.forEach(ans => {
    const eq = db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(ans.exam_question_id);
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(ans.question_id);
    if (!eq || !q) return;

    const gradeResult = autoGrade(q, ans, eq);
    if (gradeResult.canAutoGrade) {
      db.prepare('UPDATE attempt_answers SET is_auto_graded=1, auto_score=?, final_score=?, updated_at=? WHERE id=?').run(gradeResult.score, gradeResult.score, now, ans.id);
      autoTotal += gradeResult.score;
    } else {
      needsManual = true;
    }
  });

  const finalStatus = needsManual ? status : status;
  const maxScore = attempt.max_score || exam.total_points || 0;
  const percentage = maxScore > 0 ? (autoTotal / maxScore) * 100 : 0;

  db.prepare('UPDATE exam_attempts SET status=?, submitted_at=?, auto_score=?, total_score=?, percentage=?, updated_at=? WHERE id=?').run(
    finalStatus, now, autoTotal, autoTotal, Math.round(percentage * 100) / 100, now, attemptId
  );
}

function autoGrade(question, answer, examQuestion) {
  const maxPts = examQuestion.points;
  const partialCredit = examQuestion.partial_credit || 'none';

  switch (question.type) {
    case 'single_choice': {
      const selected = (() => { try { return JSON.parse(answer.selected_options || '[]'); } catch { return []; } })();
      const correct = db.prepare('SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1').all(question.id).map(r => r.id);
      if (selected.length === 1 && correct.includes(selected[0])) return { canAutoGrade: true, score: maxPts };
      return { canAutoGrade: true, score: 0 };
    }
    case 'multiple_choice': {
      const selected = (() => { try { return JSON.parse(answer.selected_options || '[]'); } catch { return []; } })();
      const correct = db.prepare('SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1').all(question.id).map(r => r.id);
      const allOptions = db.prepare('SELECT id FROM question_options WHERE question_id = ?').all(question.id).map(r => r.id);
      const correctSelected = selected.filter(s => correct.includes(s)).length;
      const wrongSelected = selected.filter(s => !correct.includes(s)).length;
      if (correctSelected === correct.length && wrongSelected === 0) return { canAutoGrade: true, score: maxPts };
      if (partialCredit === 'proportional' && correct.length > 0) {
        const score = Math.max(0, Math.round(maxPts * (correctSelected - wrongSelected) / correct.length));
        return { canAutoGrade: true, score };
      }
      return { canAutoGrade: true, score: 0 };
    }
    case 'true_false': {
      const selected = (() => { try { return JSON.parse(answer.selected_options || '[]'); } catch { return []; } })();
      const correct = db.prepare('SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1').get(question.id);
      if (selected.length === 1 && correct && selected[0] === correct.id) return { canAutoGrade: true, score: maxPts };
      return { canAutoGrade: true, score: 0 };
    }
    case 'short_answer': {
      const correctAnswers = (() => { try { return JSON.parse(question.correct_short_answers || '[]'); } catch { return []; } })();
      if (correctAnswers.length === 0) return { canAutoGrade: false, score: 0 };
      const studentAnswer = (answer.answer_text || '').trim().toLowerCase();
      const isCorrect = correctAnswers.some(ca => ca.trim().toLowerCase() === studentAnswer);
      return { canAutoGrade: true, score: isCorrect ? maxPts : 0 };
    }
    case 'matching': {
      const pairs = (() => { try { return JSON.parse(answer.matching_pairs || '{}'); } catch { return {}; } })();
      const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(question.id);
      let correct = 0;
      let total = 0;
      opts.forEach(o => {
        if (o.match_target) {
          total++;
          if (pairs[o.id] === o.match_target) correct++;
        }
      });
      if (total === 0) return { canAutoGrade: false, score: 0 };
      if (correct === total) return { canAutoGrade: true, score: maxPts };
      if (partialCredit === 'proportional') return { canAutoGrade: true, score: Math.round(maxPts * correct / total) };
      return { canAutoGrade: true, score: 0 };
    }
    case 'ordering': {
      const studentOrder = (() => { try { return JSON.parse(answer.ordering || '[]'); } catch { return []; } })();
      const correctOrder = db.prepare('SELECT id FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(question.id).map(r => r.id);
      if (JSON.stringify(studentOrder) === JSON.stringify(correctOrder)) return { canAutoGrade: true, score: maxPts };
      if (partialCredit === 'proportional' && correctOrder.length > 0) {
        let correct = 0;
        studentOrder.forEach((id, idx) => { if (correctOrder[idx] === id) correct++; });
        return { canAutoGrade: true, score: Math.round(maxPts * correct / correctOrder.length) };
      }
      return { canAutoGrade: true, score: 0 };
    }
    case 'fill_gaps': {
      const gaps = (() => { try { return JSON.parse(answer.fill_gaps || '[]'); } catch { return []; } })();
      const correctGaps = (() => { try { return JSON.parse(question.fill_gaps_answers || '[]'); } catch { return []; } })();
      if (correctGaps.length === 0) return { canAutoGrade: false, score: 0 };
      let correct = 0;
      correctGaps.forEach((cg, i) => {
        const student = (gaps[i] || '').trim().toLowerCase();
        const accepted = Array.isArray(cg) ? cg : [cg];
        if (accepted.some(a => a.trim().toLowerCase() === student)) correct++;
      });
      if (correct === correctGaps.length) return { canAutoGrade: true, score: maxPts };
      if (partialCredit === 'proportional') return { canAutoGrade: true, score: Math.round(maxPts * correct / correctGaps.length) };
      return { canAutoGrade: true, score: 0 };
    }
    case 'open_answer':
    case 'practical':
    case 'illustrated':
      return { canAutoGrade: false, score: 0 };
    default:
      return { canAutoGrade: false, score: 0 };
  }
}

// ==================== GRADING (professor) ====================

router.get('/grading/exam/:examId', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const attempts = db.prepare('SELECT * FROM exam_attempts WHERE exam_id = ? ORDER BY student_name ASC, attempt_number ASC').all(req.params.examId);
  const totalStudents = db.prepare("SELECT COUNT(DISTINCT student_id) as c FROM exam_attempts WHERE exam_id = ?").get(req.params.examId).c;
  const submitted = db.prepare("SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND status IN ('submitted','auto_submitted','grading','graded','approved')").get(req.params.examId).c;
  const graded = db.prepare("SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND status IN ('graded','approved')").get(req.params.examId).c;
  const approved = db.prepare("SELECT COUNT(*) as c FROM exam_attempts WHERE exam_id = ? AND status = 'approved'").get(req.params.examId).c;

  const attemptsData = attempts.map(a => {
    const needsManualCount = db.prepare("SELECT COUNT(*) as c FROM attempt_answers WHERE attempt_id = ? AND is_auto_graded = 0 AND manual_score IS NULL").get(a.id).c;
    return { ...dbExamAttemptToFrontend(a), needsManualGrading: needsManualCount };
  });

  res.json({
    exam: dbExamToFrontend(exam),
    attempts: attemptsData,
    stats: { totalStudents, submitted, graded, approved, toGrade: submitted - graded }
  });
});

router.get('/grading/attempt/:attemptId', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  res.json(buildAttemptResponse(attempt, req.user));
});

router.post('/grading/answer/:answerId', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const answer = db.prepare('SELECT * FROM attempt_answers WHERE id = ?').get(req.params.answerId);
  if (!answer) return res.status(404).json({ error: 'Nie znaleziono odpowiedzi.' });
  const { manualScore, professorComment, rubricScores } = req.body;
  if (manualScore === undefined || manualScore === null) return res.status(400).json({ error: 'Podaj liczbę punktów.' });
  if (manualScore < 0 || manualScore > answer.max_score) return res.status(400).json({ error: `Punkty muszą być między 0 a ${answer.max_score}.` });

  const finalScore = answer.is_auto_graded ? answer.auto_score : (manualScore ?? 0);
  db.prepare('UPDATE attempt_answers SET manual_score=?, final_score=?, professor_comment=?, rubric_scores=?, updated_at=? WHERE id=?').run(
    manualScore, answer.is_auto_graded ? answer.auto_score : manualScore,
    professorComment ?? answer.professor_comment,
    rubricScores ? JSON.stringify(rubricScores) : answer.rubric_scores,
    nowISO(), req.params.answerId
  );

  recalcAttemptScore(answer.attempt_id);
  auditLog(req.user.id, req.user.fullName, req.user.role, 'grade_answer', 'answer', req.params.answerId, `${manualScore}/${answer.max_score} pkt`);
  res.json({ success: true });
});

function recalcAttemptScore(attemptId) {
  const answers = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?').all(attemptId);
  let total = 0;
  let auto = 0;
  let manual = 0;
  answers.forEach(a => {
    if (a.is_auto_graded) { auto += a.auto_score; total += a.auto_score; }
    else if (a.manual_score !== null) { manual += a.manual_score; total += a.manual_score; }
  });
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(attemptId);
  const maxScore = attempt?.max_score || 0;
  const percentage = maxScore > 0 ? (total / maxScore) * 100 : 0;
  const roundedPct = Math.round(percentage * 100) / 100;

  let gradeName = '';
  let isPassing = 0;
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt?.exam_id);
  if (exam) {
    const scaleId = exam.grading_scale_id || 'scale-durmstrang-default';
    const entry = db.prepare('SELECT * FROM exam_grading_scale_entries WHERE scale_id = ? AND min_percent <= ? AND max_percent >= ? ORDER BY sort_order DESC LIMIT 1').get(scaleId, roundedPct, roundedPct);
    if (entry) {
      gradeName = entry.name;
      isPassing = entry.is_passing;
    }
  }

  db.prepare('UPDATE exam_attempts SET auto_score=?, manual_score=?, total_score=?, percentage=?, grade_name=?, is_passing=?, updated_at=? WHERE id=?').run(
    auto, manual, total, roundedPct, gradeName, isPassing, nowISO(), attemptId
  );
}

router.post('/grading/attempt/:attemptId/approve', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  const { professorComment, isFinal } = req.body;

  recalcAttemptScore(attempt.id);

  db.prepare("UPDATE exam_attempts SET status='approved', professor_comment=?, is_final=?, updated_at=? WHERE id=?").run(
    professorComment ?? attempt.professor_comment, isFinal !== undefined ? (isFinal ? 1 : 0) : 1, nowISO(), req.params.attemptId
  );

  auditLog(req.user.id, req.user.fullName, req.user.role, 'approve_result', 'attempt', req.params.attemptId,
    `Wynik: ${attempt.total_score}/${attempt.max_score} (${attempt.grade_name})`);

  res.json(dbExamAttemptToFrontend(db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.attemptId)));
});

router.post('/grading/exam/:examId/publish-all', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  db.prepare("UPDATE exam_attempts SET status = 'approved', is_final = 1, updated_at = ? WHERE exam_id = ? AND (status = 'graded' OR status = 'grading' OR status = 'submitted')").run(nowISO(), req.params.examId);
  auditLog(req.user.id, req.user.fullName, req.user.role, 'publish_all_results', 'exam', req.params.examId, '');
  
  if (exam) {
    discordBot.announceExamResultsPublished(exam).catch(e => console.error('Discord results announce error:', e.message));
  }

  res.json({ success: true });
});

// ==================== EXAM STATISTICS ====================

router.get('/statistics/exam/:examId', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.examId);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });

  const attempts = db.prepare("SELECT * FROM exam_attempts WHERE exam_id = ? AND status IN ('graded','approved')").all(req.params.examId);
  if (attempts.length === 0) return res.json({ exam: dbExamToFrontend(exam), stats: null });

  const scores = attempts.map(a => a.percentage);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
  const passed = attempts.filter(a => a.is_passing).length;

  const questionStats = [];
  const eqs = db.prepare('SELECT eq.id, eq.question_id, eq.points, q.content FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = ? ORDER BY eq.sort_order').all(req.params.examId);
  eqs.forEach(eq => {
    const answers = db.prepare('SELECT * FROM attempt_answers WHERE exam_question_id = ?').all(eq.id);
    const totalAnswered = answers.filter(a => a.final_score > 0 || a.auto_score > 0 || a.manual_score > 0).length;
    const fullMarks = answers.filter(a => (a.final_score || a.auto_score || 0) >= eq.points).length;
    questionStats.push({
      examQuestionId: eq.id,
      content: eq.content?.slice(0, 80),
      points: eq.points,
      correctRate: answers.length > 0 ? Math.round((fullMarks / answers.length) * 100) : 0,
      avgScore: answers.length > 0 ? Math.round(answers.reduce((s, a) => s + (a.final_score || a.auto_score || 0), 0) / answers.length * 10) / 10 : 0
    });
  });

  res.json({
    exam: dbExamToFrontend(exam),
    stats: {
      totalAttempts: attempts.length,
      average: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      passed,
      failed: attempts.length - passed,
      passRate: Math.round((passed / attempts.length) * 100)
    },
    questionStats
  });
});

// ==================== EXCEPTIONS ====================

router.post('/exceptions', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { examId, studentId, exceptionType, extraMinutes, customAccessEnd, extraAttempts, reason } = req.body;
  if (!examId || !studentId || !exceptionType) return res.status(400).json({ error: 'Wypełnij wymagane pola.' });
  const student = db.prepare('SELECT full_name FROM users WHERE id = ?').get(studentId);
  const id = genId('exc');
  db.prepare('INSERT INTO exam_exceptions (id, exam_id, student_id, student_name, exception_type, extra_minutes, custom_access_end, extra_attempts, reason, granted_by, granted_by_name) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
    id, examId, studentId, student?.full_name || '', exceptionType,
    extraMinutes || 0, customAccessEnd || '', extraAttempts || 0, reason || '',
    req.user.id, req.user.fullName
  );
  auditLog(req.user.id, req.user.fullName, req.user.role, 'create_exception', 'exception', id, `${exceptionType} dla ${student?.full_name}`);
  res.status(201).json({ id, success: true });
});

router.get('/exceptions/exam/:examId', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const rows = db.prepare('SELECT * FROM exam_exceptions WHERE exam_id = ?').all(req.params.examId);
  res.json(rows.map(r => ({
    id: r.id, examId: r.exam_id, studentId: r.student_id, studentName: r.student_name,
    exceptionType: r.exception_type, extraMinutes: r.extra_minutes, customAccessEnd: r.custom_access_end,
    extraAttempts: r.extra_attempts, reason: r.reason, grantedBy: r.granted_by, grantedByName: r.granted_by_name, grantedAt: r.granted_at
  })));
});

router.delete('/exceptions/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  db.prepare('DELETE FROM exam_exceptions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== TIME EXTENSIONS ====================

router.post('/attempts/:id/extend-time', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Podejście nie jest aktywne.' });
  const { extraMinutes } = req.body;
  if (!extraMinutes || extraMinutes <= 0) return res.status(400).json({ error: 'Podaj liczbę minut.' });
  const current = new Date(attempt.time_expires_at.replace(' ', 'T'));
  current.setMinutes(current.getMinutes() + extraMinutes);
  const newExpiry = current.toISOString().replace('T', ' ').slice(0, 19);
  db.prepare('UPDATE exam_attempts SET time_expires_at = ?, updated_at = ? WHERE id = ?').run(newExpiry, nowISO(), req.params.id);
  auditLog(req.user.id, req.user.fullName, req.user.role, 'extend_time', 'attempt', req.params.id, `+${extraMinutes} min`);
  res.json({ newExpiresAt: newExpiry });
});

router.post('/exams/:id/extend-time-all', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const { extraMinutes } = req.body;
  if (!extraMinutes) return res.status(400).json({ error: 'Podaj liczbę minut.' });
  const attempts = db.prepare("SELECT * FROM exam_attempts WHERE exam_id = ? AND status = 'in_progress'").all(req.params.id);
  attempts.forEach(a => {
    const current = new Date(a.time_expires_at.replace(' ', 'T'));
    current.setMinutes(current.getMinutes() + extraMinutes);
    db.prepare('UPDATE exam_attempts SET time_expires_at = ? WHERE id = ?').run(current.toISOString().replace('T', ' ').slice(0, 19), a.id);
  });
  auditLog(req.user.id, req.user.fullName, req.user.role, 'extend_time_all', 'exam', req.params.id, `+${extraMinutes} min dla ${attempts.length} podejść`);
  res.json({ extended: attempts.length });
});

// ==================== MONITORING ====================

router.get('/exams/:id/monitor', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Nie znaleziono egzaminu.' });
  const eligible = db.prepare("SELECT COUNT(*) as c FROM users WHERE class_year = ? AND role = 'student' AND status = 'approved'").get(exam.class_year).c;
  const attempts = db.prepare('SELECT id, student_id, student_name, status, started_at, time_expires_at, submitted_at FROM exam_attempts WHERE exam_id = ?').all(req.params.id);
  const inProgress = attempts.filter(a => a.status === 'in_progress').length;
  const submitted = attempts.filter(a => ['submitted', 'auto_submitted', 'grading', 'graded', 'approved'].includes(a.status)).length;
  const notStarted = eligible - attempts.length;
  const now = new Date();
  const students = attempts.map(a => {
    const remaining = a.status === 'in_progress' ? Math.max(0, Math.floor((new Date(a.time_expires_at.replace(' ', 'T')) - now) / 60000)) : 0;
    return { studentId: a.student_id, studentName: a.student_name, status: a.status, startedAt: a.started_at, submittedAt: a.submitted_at, remainingMinutes: remaining };
  });
  res.json({ exam: dbExamToFrontend(exam), eligible, started: attempts.length, inProgress, submitted, notStarted, students });
});

// ==================== AUDIT LOG ====================

router.get('/audit', requireAuth, requireRole('admin'), (req, res) => {
  const { entityType, entityId, limit: lim } = req.query;
  let sql = 'SELECT * FROM exam_audit_log';
  const params = [];
  const conditions = [];
  if (entityType) { conditions.push('entity_type = ?'); params.push(entityType); }
  if (entityId) { conditions.push('entity_id = ?'); params.push(entityId); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(parseInt(lim) || 200);
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({
    id: r.id, timestamp: r.timestamp, actorId: r.actor_id, actorName: r.actor_name, actorRole: r.actor_role,
    action: r.action, entityType: r.entity_type, entityId: r.entity_id, detail: r.detail,
    metadata: (() => { try { return JSON.parse(r.metadata || '{}'); } catch { return {}; } })()
  })));
});

// ==================== STUDENT RESULT VIEW ====================

router.get('/student/result/:attemptId', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM exam_attempts WHERE id = ?').get(req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Nie znaleziono podejścia.' });
  if (attempt.student_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Brak dostępu.' });
  }

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(attempt.exam_id);
  const now = nowISO();
  const isPublished = exam.results_visibility === 'immediate' ||
    (exam.results_visibility === 'after_approval' && attempt.status === 'approved') ||
    (exam.results_visibility === 'scheduled' && exam.results_publish_date && exam.results_publish_date <= now) ||
    (exam.results_visibility === 'all_at_once' && attempt.status === 'approved');

  if (!isPublished && attempt.student_id === req.user.id) {
    return res.json({ attempt: dbExamAttemptToFrontend(attempt), exam: dbExamToFrontend(exam), published: false, sections: [], answers: [] });
  }

  const sections = db.prepare('SELECT * FROM exam_sections WHERE exam_id = ? ORDER BY sort_order ASC').all(exam.id);
  const answers = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?').all(attempt.id);

  const detailedAnswers = exam.show_answers_after ? answers.map(a => {
    const eq = db.prepare('SELECT * FROM exam_questions WHERE id = ?').get(a.exam_question_id);
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(a.question_id);
    const opts = db.prepare('SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order ASC').all(a.question_id);
    return {
      ...dbAttemptAnswerToFrontend(a),
      question: exam.show_correct_answers ? dbQuestionToFrontend(q, opts) : dbQuestionForStudentFrontend(q, opts),
      sectionId: eq?.section_id,
      points: eq?.points
    };
  }) : [];

  const sectionScores = {};
  if (exam.show_points_after) {
    answers.forEach(a => {
      const eq = db.prepare('SELECT section_id FROM exam_questions WHERE id = ?').get(a.exam_question_id);
      const sid = eq?.section_id || '_nosection';
      if (!sectionScores[sid]) sectionScores[sid] = { earned: 0, max: 0 };
      sectionScores[sid].earned += (a.final_score || a.auto_score || 0);
      sectionScores[sid].max += a.max_score;
    });
  }

  res.json({
    attempt: dbExamAttemptToFrontend(attempt),
    exam: dbExamToFrontend(exam),
    published: true,
    sections: sections.map(s => ({ ...dbExamSectionToFrontend(s), score: sectionScores[s.id] || null })),
    answers: detailedAnswers
  });
});

export default router;
