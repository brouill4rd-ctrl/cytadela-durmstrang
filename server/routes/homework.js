import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, {
  dbHomeworkAssignmentToFrontend,
  dbHomeworkSubmissionToFrontend,
  dbHomeworkVersionToFrontend,
  dbHomeworkExceptionToFrontend,
  dbHomeworkTemplateToFrontend,
  dbHomeworkQuickCommentToFrontend,
  calculateHouseRankings,
  isProfessorOfSubject
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { awardPoints, correctTransaction } from '../services/pointsService.js';
import { credit as creditSkirniry } from '../services/skirnirService.js';
import { discordBot } from '../discordBot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'homework');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = Router();

// Runtime migration: add skirnir_awarded column if missing
try {
  const cols = db.pragma('table_info(homework_submissions)');
  if (!cols.find(c => c.name === 'skirnir_awarded')) {
    db.exec("ALTER TABLE homework_submissions ADD COLUMN skirnir_awarded INTEGER DEFAULT 0");
  }
} catch (_) {}

// Runtime migration: add homework_id column to grade_categories if missing
try {
  const catCols = db.pragma('table_info(grade_categories)');
  if (!catCols.find(c => c.name === 'homework_id')) {
    db.exec("ALTER TABLE grade_categories ADD COLUMN homework_id TEXT DEFAULT NULL");
  }
} catch (_) {}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function auditLog(actorId, actorName, actorRole, action, homeworkId = '', submissionId = '', detail = '', metadata = {}) {
  try {
    db.prepare(`
      INSERT INTO homework_audit_logs (id, homework_id, submission_id, actor_id, actor_name, actor_role, action, detail, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(genId('hal'), homeworkId, submissionId, actorId, actorName, actorRole, action, detail, JSON.stringify(metadata));
  } catch (err) {
    console.error('[Homework Audit Log Error]', err.message);
  }
}

function createNotification(recipientId, recipientName, subject, body, type = 'homework') {
  try {
    const emailId = genId('mail');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const recipientRow = db.prepare('SELECT username FROM users WHERE id = ?').get(recipientId);
    const userEmail = `${recipientRow ? recipientRow.username : recipientId}@durmstrang.edu`;

    db.prepare(`
      INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
      VALUES (?, ?, ?, 'kancelaria@durmstrang.edu', 'Katedra Nauczania Cytadeli', ?, ?, 0, ?, ?)
    `).run(emailId, userEmail, recipientName, subject, dateStr, type, body);
  } catch (err) {
    console.warn('[Notification Error]', err.message);
  }
}

function requireHomeworkOwner(resolveHomeworkId) {
  return (req, res, next) => {
    const homeworkId = resolveHomeworkId(req);
    const homework = homeworkId ? db.prepare('SELECT id, professor_id, subject_id FROM homework_assignments WHERE id = ?').get(homeworkId) : null;
    if (!homework) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });
    if (req.user.role !== 'admin' && homework.professor_id !== req.user.id) {
      return res.status(403).json({ error: 'Możesz zarządzać wyłącznie własnym zadaniem.' });
    }
    req.homeworkResource = homework;
    next();
  };
}

const homeworkFromParam = req => req.params.id;
const homeworkFromSubmission = req => db.prepare('SELECT homework_id FROM homework_submissions WHERE id = ?').get(req.params.subId)?.homework_id;

// Calculate grade label based on percentage
function computeGradeLabel(percentage) {
  if (percentage >= 90) return 'Wybitny (W)';
  if (percentage >= 75) return 'Powyżej Oczekiwań (PO)';
  if (percentage >= 50) return 'Zadowalający (Z)';
  if (percentage >= 35) return 'Nędzny (N)';
  if (percentage >= 20) return 'Okropny (O)';
  return 'Troll (T)';
}

// ==================== 1. LIST HOMEWORK ASSIGNMENTS ====================

// GET /api/homework — List assignments with filters & user-specific context
router.get('/', requireAuth, (req, res) => {
  try {
    const {
      subjectId,
      classYear,
      schoolYear,
      status,
      type,
      search,
      studentId: requestedStudentId
    } = req.query;
    const studentId = req.user.role === 'admin' || req.user.role === 'professor' ? requestedStudentId : req.user.id;

    let query = 'SELECT * FROM homework_assignments WHERE is_archived = 0';
    const params = [];
    if (req.user.role === 'professor') {
      query += ' AND professor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      const ownClassYear = db.prepare('SELECT class_year FROM users WHERE id = ?').get(req.user.id)?.class_year || '';
      query += " AND is_published = 1 AND (class_year = ? OR class_year = 'Wszystkie' OR class_year = '')";
      params.push(ownClassYear);
    }

    if (subjectId && subjectId !== 'all') {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (classYear && classYear !== 'all') {
      query += ' AND class_year = ?';
      params.push(classYear);
    }
    if (schoolYear && schoolYear !== 'all') {
      query += ' AND school_year = ?';
      params.push(schoolYear);
    }
    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }
    if (search && search.trim()) {
      query += ' AND (title LIKE ? OR description LIKE ? OR subject_name LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY due_date ASC, created_at DESC';
    const assignments = db.prepare(query).all(...params);

    const result = assignments.map(hw => {
      // Aggregate stats for professor/admin
      const subs = db.prepare('SELECT status, grade_score, is_late FROM homework_submissions WHERE homework_id = ?').all(hw.id);
      const totalSubs = subs.filter(s => s.status !== 'draft').length;
      const inReviewCount = subs.filter(s => ['submitted', 'resubmitted', 'late'].includes(s.status)).length;
      const gradedCount = subs.filter(s => s.status === 'graded').length;
      const returnedCount = subs.filter(s => s.status === 'returned_for_revision').length;
      
      // Count actual students in assigned class
      let assignedCount = 30;
      try {
        const classFilter = hw.class_year && hw.class_year !== 'Wszystkie' ? hw.class_year : null;
        const countQuery = classFilter
          ? "SELECT COUNT(*) as c FROM users WHERE role='student' AND class_year=?"
          : "SELECT COUNT(*) as c FROM users WHERE role='student'";
        assignedCount = classFilter
          ? db.prepare(countQuery).get(classFilter)?.c || 0
          : db.prepare(countQuery).get()?.c || 30;
      } catch (_) {}

      const stats = {
        totalSubmissions: totalSubs,
        inReviewCount,
        gradedCount,
        returnedCount,
        assignedCount
      };

      const mapped = dbHomeworkAssignmentToFrontend(hw, stats);

      // If a studentId is provided, attach their specific submission status
      if (studentId) {
        const studentSub = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
        const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
        mapped.mySubmission = studentSub ? dbHomeworkSubmissionToFrontend(studentSub, [], exc) : null;
        mapped.myException = exc ? dbHomeworkExceptionToFrontend(exc) : null;
      }

      return mapped;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania listy zadań: ' + err.message });
  }
});

// ==================== 2. STUDENT OVERVIEW & DASHBOARD ====================

// GET /api/homework/student/overview — Aggregated view for student center
router.get('/student/overview', requireAuth, (req, res) => {
  try {
    const student = req.user;
    const studentId = student.id;
    const classYear = student.classYear || 'Klasa II';

    // Get assignments for student's class (or all classes)
    const assignments = db.prepare(`
      SELECT * FROM homework_assignments 
      WHERE is_published = 1 AND is_archived = 0 AND (class_year = ? OR class_year = 'Wszystkie' OR class_year = '')
      ORDER BY due_date ASC
    `).all(classYear);

    const now = new Date();

    const toSubmit = [];
    const inReview = [];
    const recentlyGraded = [];
    const needsRevision = [];
    const upcoming = [];

    let totalPointsEarned = 0;
    let gradedScoreSum = 0;
    let gradedMaxSum = 0;

    for (const hw of assignments) {
      const sub = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
      const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
      const versions = sub ? db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(sub.id) : [];

      const hwItem = dbHomeworkAssignmentToFrontend(hw);
      hwItem.mySubmission = sub ? dbHomeworkSubmissionToFrontend(sub, versions, exc) : null;
      hwItem.myException = exc ? dbHomeworkExceptionToFrontend(exc) : null;

      const effectiveDueDate = exc?.custom_due_date ? new Date(exc.custom_due_date) : new Date(hw.due_date);
      const isPastDue = now > effectiveDueDate;

      if (!sub || sub.status === 'draft') {
        if (exc?.is_exempt) {
          // Exempt from homework
          hwItem.computedStatus = 'exempt';
        } else if (isPastDue) {
          hwItem.computedStatus = hw.is_optional ? 'optional_unsubmitted' : 'missing';
          toSubmit.push(hwItem);
        } else {
          hwItem.computedStatus = sub?.status === 'draft' ? 'draft' : 'to_submit';
          toSubmit.push(hwItem);
        }
      } else if (['submitted', 'resubmitted', 'late'].includes(sub.status)) {
        hwItem.computedStatus = 'in_review';
        inReview.push(hwItem);
      } else if (sub.status === 'returned_for_revision') {
        hwItem.computedStatus = 'returned_for_revision';
        needsRevision.push(hwItem);
      } else if (sub.status === 'graded') {
        hwItem.computedStatus = 'graded';
        recentlyGraded.push(hwItem);
        if (sub.grade_score !== null) {
          gradedScoreSum += sub.grade_score;
          gradedMaxSum += (sub.grade_max || 20);
        }
        totalPointsEarned += (sub.house_points_awarded || 0);
      }
    }

    // Sort recently graded descending by graded_at
    recentlyGraded.sort((a, b) => new Date(b.mySubmission?.gradedAt || 0) - new Date(a.mySubmission?.gradedAt || 0));

    const stats = {
      totalAssigned: assignments.length,
      toSubmitCount: toSubmit.length,
      inReviewCount: inReview.length,
      needsRevisionCount: needsRevision.length,
      gradedCount: recentlyGraded.length,
      averagePercentage: gradedMaxSum > 0 ? Math.round((gradedScoreSum / gradedMaxSum) * 100) : null,
      totalHousePointsEarned: totalPointsEarned
    };

    res.json({
      toSubmit,
      inReview,
      recentlyGraded,
      needsRevision,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania panelu prac domowych: ' + err.message });
  }
});

// ==================== 3. CALENDAR & ARCHIVE ====================

// GET /api/homework/calendar — Calendar events for deadlines
router.get('/calendar', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const assignments = db.prepare(`
      SELECT * FROM homework_assignments 
      WHERE is_published = 1 AND is_archived = 0
      ORDER BY due_date ASC
    `).all();

    const events = assignments.map(hw => {
      const sub = db.prepare('SELECT status, grade_score, submitted_at FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
      const exc = db.prepare('SELECT custom_due_date FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);

      const effectiveDueDate = exc?.custom_due_date || hw.due_date;

      return {
        id: hw.id,
        title: hw.title,
        subjectId: hw.subject_id,
        subjectName: hw.subject_name,
        classYear: hw.class_year,
        dueDate: effectiveDueDate,
        publishDate: hw.publish_date,
        maxPoints: hw.max_points,
        type: hw.type,
        status: sub ? sub.status : 'to_submit',
        gradeScore: sub ? sub.grade_score : null
      };
    });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania kalendarza prac domowych: ' + err.message });
  }
});

// GET /api/homework/archive — Historical archive of homework
router.get('/archive', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const isProfOrAdmin = req.user.role === 'professor' || req.user.role === 'admin';

    const assignments = db.prepare(`
      SELECT * FROM homework_assignments 
      ORDER BY school_year DESC, due_date DESC
    `).all();

    // Group by schoolYear -> classYear -> subjectName
    const archive = {};

    for (const hw of assignments) {
      const year = hw.school_year || 'XVII Rok Szkolny';
      const cYear = hw.class_year || 'Klasa II';
      const subj = hw.subject_name;

      if (!archive[year]) archive[year] = {};
      if (!archive[year][cYear]) archive[year][cYear] = {};
      if (!archive[year][cYear][subj]) archive[year][cYear][subj] = [];

      const sub = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(hw.id, studentId);
      const mapped = dbHomeworkAssignmentToFrontend(hw);
      mapped.mySubmission = sub ? dbHomeworkSubmissionToFrontend(sub) : null;

      archive[year][cYear][subj].push(mapped);
    }

    res.json(archive);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania archiwum prac domowych: ' + err.message });
  }
});

// ==================== 4. TEMPLATES & QUICK COMMENTS ====================

// GET /api/homework/templates — Templates library
router.get('/templates', requireAuth, (req, res) => {
  try {
    const rows = req.user.role === 'admin'
      ? db.prepare('SELECT * FROM homework_templates ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM homework_templates WHERE created_by = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(rows.map(dbHomeworkTemplateToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania szablonów: ' + err.message });
  }
});

// POST /api/homework/templates — Save a template
router.post('/templates', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    const { title, category, type, description, instructions, requirements, rubric, submissionTypes } = req.body;
    if (!title) return res.status(400).json({ error: 'Tytuł szablonu jest wymagany.' });

    const id = genId('tpl');
    db.prepare(`
      INSERT INTO homework_templates (id, title, category, type, description, instructions, requirements, rubric, submission_types, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      title,
      category || 'ogólny',
      type || 'homework',
      description || '',
      instructions || '',
      JSON.stringify(requirements || []),
      JSON.stringify(rubric || []),
      JSON.stringify(submissionTypes || ['text']),
      req.user.id
    );

    const created = db.prepare('SELECT * FROM homework_templates WHERE id = ?').get(id);
    res.status(201).json(dbHomeworkTemplateToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia szablonu: ' + err.message });
  }
});

// DELETE /api/homework/templates/:id — Delete template
router.delete('/templates/:id', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    const template = db.prepare('SELECT created_by FROM homework_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Nie znaleziono szablonu.' });
    if (req.user.role !== 'admin' && template.created_by !== req.user.id) return res.status(403).json({ error: 'Możesz usunąć wyłącznie własny szablon.' });
    db.prepare('DELETE FROM homework_templates WHERE id = ?').run(req.params.id);
    res.json({ ok: true, message: 'Szablon usunięty.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania szablonu: ' + err.message });
  }
});

// GET /api/homework/quick-comments — List quick comments
router.get('/quick-comments', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'professor') return res.status(403).json({ error: 'Brak uprawnień.' });
    const rows = req.user.role === 'admin'
      ? db.prepare('SELECT * FROM homework_quick_comments ORDER BY category ASC, id ASC').all()
      : db.prepare('SELECT * FROM homework_quick_comments WHERE professor_id = ? ORDER BY category ASC, id ASC').all(req.user.id);
    res.json(rows.map(dbHomeworkQuickCommentToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania komentarzy: ' + err.message });
  }
});

// POST /api/homework/quick-comments — Add quick comment
router.post('/quick-comments', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    const { category, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Treść komentarza jest wymagana.' });

    const id = genId('qc');
    db.prepare(`
      INSERT INTO homework_quick_comments (id, professor_id, category, text, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, req.user.id, category || 'ogólne', text.trim());

    const created = db.prepare('SELECT * FROM homework_quick_comments WHERE id = ?').get(id);
    res.status(201).json(dbHomeworkQuickCommentToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania komentarza: ' + err.message });
  }
});

// DELETE /api/homework/quick-comments/:id — Delete quick comment
router.delete('/quick-comments/:id', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    const comment = db.prepare('SELECT professor_id FROM homework_quick_comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Nie znaleziono komentarza.' });
    if (req.user.role !== 'admin' && comment.professor_id !== req.user.id) return res.status(403).json({ error: 'Możesz usunąć wyłącznie własny komentarz.' });
    db.prepare('DELETE FROM homework_quick_comments WHERE id = ?').run(req.params.id);
    res.json({ ok: true, message: 'Komentarz usunięty.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania komentarza: ' + err.message });
  }
});

// ==================== 5. ASSIGNMENT DETAILS & CRUD ====================

// GET /api/homework/:id — Get assignment details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania domowego.' });
    if (req.user.role === 'professor' && hw.professor_id !== req.user.id) return res.status(403).json({ error: 'Możesz przeglądać wyłącznie własne zadania.' });
    if (req.user.role !== 'admin' && req.user.role !== 'professor') {
      const ownClassYear = db.prepare('SELECT class_year FROM users WHERE id = ?').get(req.user.id)?.class_year || '';
      if (!hw.is_published || (hw.class_year && hw.class_year !== 'Wszystkie' && hw.class_year !== ownClassYear)) return res.status(403).json({ error: 'To zadanie nie jest dostępne dla Twojej klasy.' });
    }

    // Calculate aggregated stats
    const subs = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ?').all(id);
    const totalSubs = subs.filter(s => s.status !== 'draft').length;
    const inReviewCount = subs.filter(s => ['submitted', 'resubmitted', 'late'].includes(s.status)).length;
    const gradedCount = subs.filter(s => s.status === 'graded').length;
    const returnedCount = subs.filter(s => s.status === 'returned_for_revision').length;

    const stats = {
      totalSubmissions: totalSubs,
      inReviewCount,
      gradedCount,
      returnedCount,
      assignedCount: 30
    };

    const mapped = dbHomeworkAssignmentToFrontend(hw, stats);

    // If student, attach their specific submission + versions + exception
    const studentSub = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(id, req.user.id);
    const studentExc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(id, req.user.id);
    const versions = studentSub ? db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(studentSub.id) : [];

    mapped.mySubmission = studentSub ? dbHomeworkSubmissionToFrontend(studentSub, versions, studentExc) : null;
    mapped.myException = studentExc ? dbHomeworkExceptionToFrontend(studentExc) : null;

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zadania: ' + err.message });
  }
});

// POST /api/homework — Create new assignment (Professor/Admin)
router.post('/', requireAuth, requireRole('professor', 'admin'), (req, res) => {
  try {
    const {
      title,
      assignmentNumber = 1,
      type = 'homework',
      subjectId,
      subjectName,
      classYear = 'Klasa II',
      schoolYear = 'XVII Rok Szkolny',
      lessonId = '',
      lessonTitle = '',
      description = '',
      instructions = '',
      requirements = [],
      resources = [],
      submissionTypes = ['text'],
      publishDate,
      dueDate,
      allowLate = true,
      lateDueDate = '',
      latePenaltyPoints = 0,
      revisionAllowed = true,
      revisionDueDate = '',
      maxPoints = 20,
      gradingType = 'points',
      gradingScaleId = '',
      rubric = [],
      isOptional = false,
      isGroup = false,
      groupData = {}
    } = req.body;

    if (!title || !subjectId || !dueDate) {
      return res.status(400).json({ error: 'Tytuł, przedmiot oraz termin oddania są wymagane.' });
    }

    if (req.user.role === 'professor' && !isProfessorOfSubject(req.user.id, subjectId)) {
      return res.status(403).json({ error: 'Możesz tworzyć prace domowe tylko dla przedmiotów, które prowadzisz.' });
    }

    const id = genId('hw');
    const professor = req.user;

    db.prepare(`
      INSERT INTO homework_assignments (
        id, title, assignment_number, type, subject_id, subject_name, class_year, school_year,
        lesson_id, lesson_title, professor_id, professor_name, professor_avatar,
        description, instructions, requirements, resources, submission_types,
        publish_date, due_date, allow_late, late_due_date, late_penalty_points,
        revision_allowed, revision_due_date, max_points, grading_type, grading_scale_id, rubric,
        is_optional, is_group, group_data, is_published, is_archived, is_featured,
        created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    `).run(
      id,
      title.trim(),
      assignmentNumber,
      type,
      subjectId,
      subjectName || subjectId,
      classYear,
      schoolYear,
      lessonId,
      lessonTitle,
      professor.id,
      professor.fullName,
      professor.avatar || '',
      description,
      instructions,
      JSON.stringify(requirements),
      JSON.stringify(resources),
      JSON.stringify(submissionTypes),
      publishDate || nowISO(),
      dueDate,
      allowLate ? 1 : 0,
      lateDueDate,
      latePenaltyPoints,
      revisionAllowed ? 1 : 0,
      revisionDueDate,
      maxPoints,
      gradingType,
      gradingScaleId,
      JSON.stringify(rubric),
      isOptional ? 1 : 0,
      isGroup ? 1 : 0,
      JSON.stringify(groupData),
      1,
      0,
      0
    );

    auditLog(professor.id, professor.fullName, professor.role, 'create_homework', id, '', `Utworzono zadanie: ${title}`);

    // Auto-create grade category in the subject for this homework
    if (subjectId) {
      try {
        const existingCat = db.prepare("SELECT id FROM grade_categories WHERE subject_id = ? AND homework_id = ?").get(subjectId, id);
        if (!existingCat) {
          const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM grade_categories WHERE subject_id = ?').get(subjectId)?.m || 0;
          db.prepare(`
            INSERT INTO grade_categories (id, subject_id, name, weight, icon, sort_order, homework_id)
            VALUES (?, ?, ?, 1.0, '📝', ?, ?)
          `).run(`cat-hw-${id}`, subjectId, title.trim(), maxSort + 1, id);
        }
      } catch (_) {}
    }

    // Notify only students in the target class
    try {
      const isAllClasses = !classYear || classYear === 'Wszystkie' || classYear === '';
      const targetStudents = isAllClasses
        ? db.prepare("SELECT id, full_name FROM users WHERE role = 'student'").all()
        : db.prepare("SELECT id, full_name FROM users WHERE role = 'student' AND class_year = ?").all(classYear);

      targetStudents.forEach(st => {
        createNotification(
          st.id,
          st.full_name,
          `Nowa praca domowa: ${title} (${subjectName || subjectId})`,
          `Profesor ${professor.fullName} zadał nową pracę domową z przedmiotu ${subjectName || subjectId}: „${title}". Termin oddania: ${dueDate}.`,
          'homework'
        );
      });
    } catch (_) {}

    const created = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    const createdFrontend = dbHomeworkAssignmentToFrontend(created);

    // Asynchroniczne ogłoszenie na Discordzie
    discordBot.announceHomeworkCreated(createdFrontend).catch(e =>
      console.warn('[Discord] Błąd ogłoszenia pracy domowej:', e.message)
    );

    res.status(201).json({
      ok: true,
      message: 'Praca domowa została pomyślnie utworzona i opublikowana.',
      homework: createdFrontend
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia zadania domowego: ' + err.message });
  }
});

// PUT /api/homework/:id — Update assignment (Professor/Admin)
router.put('/:id', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });

    // Check if students have already submitted or drafted
    const activeSubsCount = db.prepare("SELECT COUNT(*) as count FROM homework_submissions WHERE homework_id = ? AND status != 'draft'").get(id).count;

    const {
      title,
      assignmentNumber,
      type,
      subjectId,
      subjectName,
      classYear,
      schoolYear,
      lessonId,
      lessonTitle,
      description,
      instructions,
      requirements,
      resources,
      submissionTypes,
      publishDate,
      dueDate,
      allowLate,
      lateDueDate,
      latePenaltyPoints,
      revisionAllowed,
      revisionDueDate,
      maxPoints,
      gradingType,
      gradingScaleId,
      rubric,
      isOptional,
      isGroup,
      groupData
    } = req.body;

    const nextSubjectId = subjectId || existing.subject_id;
    if (req.user.role === 'professor' && !isProfessorOfSubject(req.user.id, nextSubjectId)) {
      return res.status(403).json({ error: 'Nie możesz przenieść zadania do nieprowadzonego przedmiotu.' });
    }

    db.prepare(`
      UPDATE homework_assignments SET
        title = ?, assignment_number = ?, type = ?, subject_id = ?, subject_name = ?, class_year = ?, school_year = ?,
        lesson_id = ?, lesson_title = ?, description = ?, instructions = ?, requirements = ?, resources = ?,
        submission_types = ?, publish_date = ?, due_date = ?, allow_late = ?, late_due_date = ?,
        late_penalty_points = ?, revision_allowed = ?, revision_due_date = ?, max_points = ?,
        grading_type = ?, grading_scale_id = ?, rubric = ?, is_optional = ?, is_group = ?, group_data = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title || existing.title,
      assignmentNumber !== undefined ? assignmentNumber : existing.assignment_number,
      type || existing.type,
      subjectId || existing.subject_id,
      subjectName || existing.subject_name,
      classYear || existing.class_year,
      schoolYear || existing.school_year,
      lessonId !== undefined ? lessonId : existing.lesson_id,
      lessonTitle !== undefined ? lessonTitle : existing.lesson_title,
      description !== undefined ? description : existing.description,
      instructions !== undefined ? instructions : existing.instructions,
      requirements ? JSON.stringify(requirements) : existing.requirements,
      resources ? JSON.stringify(resources) : existing.resources,
      submissionTypes ? JSON.stringify(submissionTypes) : existing.submission_types,
      publishDate || existing.publish_date,
      dueDate || existing.due_date,
      allowLate !== undefined ? (allowLate ? 1 : 0) : existing.allow_late,
      lateDueDate !== undefined ? lateDueDate : existing.late_due_date,
      latePenaltyPoints !== undefined ? latePenaltyPoints : existing.late_penalty_points,
      revisionAllowed !== undefined ? (revisionAllowed ? 1 : 0) : existing.revision_allowed,
      revisionDueDate !== undefined ? revisionDueDate : existing.revision_due_date,
      maxPoints !== undefined ? maxPoints : existing.max_points,
      gradingType || existing.grading_type,
      gradingScaleId !== undefined ? gradingScaleId : existing.grading_scale_id,
      rubric ? JSON.stringify(rubric) : existing.rubric,
      isOptional !== undefined ? (isOptional ? 1 : 0) : existing.is_optional,
      isGroup !== undefined ? (isGroup ? 1 : 0) : existing.is_group,
      groupData ? JSON.stringify(groupData) : existing.group_data,
      id
    );

    auditLog(req.user.id, req.user.fullName, req.user.role, 'edit_homework', id, '', `Zaktualizowano zadanie: ${title || existing.title}`);

    const updated = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    res.json({
      ok: true,
      message: 'Zadanie domowe zostało zaktualizowane.',
      hasExistingSubmissions: activeSubsCount > 0,
      activeSubmissionsCount: activeSubsCount,
      homework: dbHomeworkAssignmentToFrontend(updated)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji zadania: ' + err.message });
  }
});

// DELETE /api/homework/:id — Delete or archive assignment (Professor/Admin)
router.delete('/:id', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });

    // Check ownership for professors
    if (req.user.role === 'professor' && hw.professor_id !== req.user.id) {
      return res.status(403).json({ error: 'Możesz usuwać tylko własne prace domowe.' });
    }

    const nonDraftSubs = db.prepare("SELECT COUNT(*) as count FROM homework_submissions WHERE homework_id = ? AND status != 'draft'").get(id).count;

    if (nonDraftSubs > 0 && force !== 'true') {
      // Archive instead of delete — preserve historical data
      db.prepare("UPDATE homework_assignments SET is_archived = 1, updated_at = datetime('now') WHERE id = ?").run(id);
      auditLog(req.user.id, req.user.fullName, req.user.role, 'archive_homework', id, '', `Zarchiwizowano zadanie (${nonDraftSubs} oddanych prac)`);
      return res.json({
        ok: true,
        archived: true,
        message: `Zadanie zostało zarchiwizowane (istnieje ${nonDraftSubs} oddanych prac). Dane historyczne zostały zachowane.`
      });
    }

    // Safe to delete — no real submissions
    db.prepare('DELETE FROM homework_submissions WHERE homework_id = ?').run(id);
    db.prepare('DELETE FROM homework_submission_versions WHERE homework_id = ?').run(id);
    db.prepare('DELETE FROM homework_exceptions WHERE homework_id = ?').run(id);
    db.prepare('DELETE FROM homework_assignments WHERE id = ?').run(id);
    auditLog(req.user.id, req.user.fullName, req.user.role, 'delete_homework', id, '', 'Usunięto zadanie domowe (brak oddanych prac)');
    res.json({ ok: true, archived: false, message: 'Praca domowa została trwale usunięta.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania zadania: ' + err.message });
  }
});

// POST /api/homework/:id/duplicate — Duplicate assignment (Professor/Admin)
router.post('/:id/duplicate', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie odnaleziono zadania do skopiowania.' });

    const newId = genId('hw');
    const newTitle = `${existing.title} (Kopia)`;

    db.prepare(`
      INSERT INTO homework_assignments (
        id, title, assignment_number, type, subject_id, subject_name, class_year, school_year,
        lesson_id, lesson_title, professor_id, professor_name, professor_avatar,
        description, instructions, requirements, resources, submission_types,
        publish_date, due_date, allow_late, late_due_date, late_penalty_points,
        revision_allowed, revision_due_date, max_points, grading_type, grading_scale_id, rubric,
        is_optional, is_group, group_data, is_published, is_archived, is_featured,
        created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    `).run(
      newId,
      newTitle,
      existing.assignment_number,
      existing.type,
      existing.subject_id,
      existing.subject_name,
      existing.class_year,
      existing.school_year,
      '',
      '',
      req.user.id,
      req.user.fullName,
      req.user.avatar || '',
      existing.description,
      existing.instructions,
      existing.requirements,
      existing.resources,
      existing.submission_types,
      nowISO(),
      existing.due_date,
      existing.allow_late,
      existing.late_due_date,
      existing.late_penalty_points,
      existing.revision_allowed,
      existing.revision_due_date,
      existing.max_points,
      existing.grading_type,
      existing.grading_scale_id,
      existing.rubric,
      existing.is_optional,
      existing.is_group,
      existing.group_data,
      1,
      0,
      0
    );

    auditLog(req.user.id, req.user.fullName, req.user.role, 'duplicate_homework', newId, '', `Zduplikowano zadanie z ${id}`);

    const duplicated = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(newId);
    res.status(201).json({
      ok: true,
      message: 'Praca domowa została zduplikowana.',
      homework: dbHomeworkAssignmentToFrontend(duplicated)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd duplikowania zadania: ' + err.message });
  }
});

// ==================== 6. SUBMISSIONS (STUDENT & PROFESSOR) ====================

// GET /api/homework/:id/submissions — List all submissions for an assignment (Professor/Admin)
router.get('/:id/submissions', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id } = req.params;
    const { status, house } = req.query;

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });

    // Fetch only students in the assigned class (or all if 'Wszystkie')
    const isAllClasses = !hw.class_year || hw.class_year === 'Wszystkie' || hw.class_year === '';
    const students = isAllClasses
      ? db.prepare("SELECT id, full_name, house, class_year FROM users WHERE role = 'student' ORDER BY house ASC, full_name ASC").all()
      : db.prepare("SELECT id, full_name, house, class_year FROM users WHERE role = 'student' AND class_year = ? ORDER BY house ASC, full_name ASC").all(hw.class_year);

    // Fetch active absences for cross-referencing
    let absenceMap = new Map();
    try {
      const now = new Date().toISOString().slice(0, 10);
      const activeAbsences = db.prepare(`
        SELECT user_id, date_from, date_to, status FROM absences
        WHERE status = 'approved' AND date_to >= ?
      `).all(now);
      for (const ab of activeAbsences) {
        if (!absenceMap.has(ab.user_id)) absenceMap.set(ab.user_id, []);
        absenceMap.get(ab.user_id).push(ab);
      }
    } catch (_) {}

    const submissions = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ?').all(id);
    const exceptions = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ?').all(id);

    const subMap = new Map(submissions.map(s => [s.student_id, s]));
    const excMap = new Map(exceptions.map(e => [e.student_id, e]));

    const now = new Date();

    const studentList = students.map(st => {
      const sub = subMap.get(st.id);
      const exc = excMap.get(st.id);
      const effectiveDueDate = exc?.custom_due_date ? new Date(exc.custom_due_date) : new Date(hw.due_date);
      const isPastDue = now > effectiveDueDate;

      let computedStatus = 'not_submitted';
      if (exc?.is_exempt) {
        computedStatus = 'exempt';
      } else if (sub) {
        computedStatus = sub.status;
      } else if (isPastDue) {
        computedStatus = hw.is_optional ? 'optional_unsubmitted' : 'missing';
      }

      const versions = sub ? db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(sub.id) : [];

      // Check active absences covering the due date
      const hwDueDate = (exc?.custom_due_date || hw.due_date || '').slice(0, 10);
      const studentAbsences = absenceMap.get(st.id) || [];
      const coveringAbsence = studentAbsences.find(ab => {
        if (!hwDueDate) return false;
        return ab.date_from <= hwDueDate && ab.date_to >= hwDueDate;
      });

      return {
        studentId: st.id,
        studentName: st.full_name,
        house: st.house || 'ravnheim',
        classYear: st.class_year,
        status: computedStatus,
        submission: sub ? dbHomeworkSubmissionToFrontend(sub, versions, exc) : null,
        exception: exc ? dbHomeworkExceptionToFrontend(exc) : null,
        activeAbsence: coveringAbsence ? {
          dateFrom: coveringAbsence.date_from,
          dateTo: coveringAbsence.date_to,
          status: coveringAbsence.status
        } : null
      };
    });

    // Apply filters
    let filtered = studentList;
    if (status && status !== 'all') {
      if (status === 'submitted') {
        filtered = filtered.filter(s => ['submitted', 'resubmitted', 'late'].includes(s.status));
      } else if (status === 'in_review') {
        filtered = filtered.filter(s => ['submitted', 'resubmitted', 'late'].includes(s.status));
      } else if (status === 'graded') {
        filtered = filtered.filter(s => s.status === 'graded');
      } else if (status === 'missing') {
        filtered = filtered.filter(s => ['missing', 'not_submitted'].includes(s.status));
      } else if (status === 'late') {
        filtered = filtered.filter(s => s.status === 'late' || (s.submission && s.submission.isLate));
      } else if (status === 'returned_for_revision') {
        filtered = filtered.filter(s => s.status === 'returned_for_revision');
      }
    }
    if (house && house !== 'all') {
      filtered = filtered.filter(s => s.house === house);
    }

    res.json({
      homework: dbHomeworkAssignmentToFrontend(hw),
      totalStudents: students.length,
      students: filtered
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania prac uczniów: ' + err.message });
  }
});

// GET /api/homework/submissions/:subId — View single submission
router.get('/submissions/:subId', requireAuth, (req, res) => {
  try {
    const { subId } = req.params;
    const sub = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    if (!sub) return res.status(404).json({ error: 'Nie odnaleziono zgłoszenia.' });

    // Strict Privacy Check: Students can only view their own submission
    if (req.user.role === 'student' && sub.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Brak uprawnień do przeglądania pracy innego adepta.' });
    }

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(sub.homework_id);
    if ((req.user.role === 'professor' && hw?.professor_id !== req.user.id) || (!hw && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Ta praca należy do innego profesora.' });
    }
    const versions = db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(subId);
    const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(sub.homework_id, sub.student_id);

    res.json({
      submission: dbHomeworkSubmissionToFrontend(sub, versions, exc),
      homework: dbHomeworkAssignmentToFrontend(hw)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania szczegółów pracy: ' + err.message });
  }
});

// POST /api/homework/:id/draft — Save student draft (Autosave)
router.post('/:id/draft', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { content = '', attachments = [], links = [] } = req.body;
    const student = req.user;

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania domowego.' });

    // Check if existing submission exists
    const existing = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(id, student.id);

    // Calculate word count
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    let subId = existing ? existing.id : genId('sub');

    if (existing) {
      // If already graded or sealed, don't allow modifying draft unless returned for revision
      if (['graded'].includes(existing.status)) {
        return res.status(400).json({ error: 'Praca została już oceniona i nie można modyfikować szkicu.' });
      }

      db.prepare(`
        UPDATE homework_submissions SET
          content = ?, word_count = ?, attachments = ?, links = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        content,
        wordCount,
        JSON.stringify(attachments),
        JSON.stringify(links),
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO homework_submissions (
          id, homework_id, student_id, student_name, house, subject_id, subject_name,
          lesson_id, lesson_title, status, current_version, content, word_count,
          attachments, links, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        subId,
        id,
        student.id,
        student.fullName,
        student.house || 'ravnheim',
        hw.subject_id,
        hw.subject_name,
        hw.lesson_id || '',
        hw.lesson_title || '',
        content,
        wordCount,
        JSON.stringify(attachments),
        JSON.stringify(links)
      );
    }

    const saved = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);

    res.json({
      ok: true,
      message: '✓ Zapisano szkic',
      savedAt: nowISO(),
      submission: dbHomeworkSubmissionToFrontend(saved)
    });
  } catch (err) {
    res.status(500).json({ error: '⚠ Nie udało się zsynchronizować zmian: ' + err.message });
  }
});

// POST /api/homework/:id/submit — Seal and submit homework (Student)
router.post('/:id/submit', requireAuth, requireRole('student'), (req, res) => {
  try {
    const { id } = req.params;
    const { content = '', attachments = [], links = [] } = req.body;
    const student = req.user;

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });

    const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(id, student.id);

    // Check deadlines and late submission policies
    const now = new Date();
    const effectiveDueDate = exc?.custom_due_date ? new Date(exc.custom_due_date) : new Date(hw.due_date);
    const isLate = now > effectiveDueDate;
    const lateDurationSeconds = isLate ? Math.floor((now - effectiveDueDate) / 1000) : 0;

    if (isLate && !hw.allow_late && !exc) {
      return res.status(400).json({ error: 'Termin oddania pracy upłynął. Profesor wyłączył możliwość spóźnionych oddań.' });
    }

    if (isLate && hw.late_due_date && new Date(hw.late_due_date) < now && !exc) {
      return res.status(400).json({ error: 'Ostateczny termin spóźnionego oddania pracy minął.' });
    }

    const existing = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(id, student.id);
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    let subId = existing ? existing.id : genId('sub');
    let newVersionNumber = existing ? (existing.current_version || 1) : 1;

    // If resubmitting after revision, increment version number
    const isResubmission = existing && existing.status === 'returned_for_revision';
    if (isResubmission) {
      newVersionNumber += 1;
    }

    const status = isLate ? 'late' : (isResubmission ? 'resubmitted' : 'submitted');

    const tx = db.transaction(() => {
      if (existing) {
        db.prepare(`
          UPDATE homework_submissions SET
            status = ?, current_version = ?, content = ?, word_count = ?, attachments = ?, links = ?,
            submitted_at = datetime('now'), is_late = ?, late_duration_seconds = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(
          status,
          newVersionNumber,
          content,
          wordCount,
          JSON.stringify(attachments),
          JSON.stringify(links),
          isLate ? 1 : 0,
          lateDurationSeconds,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO homework_submissions (
            id, homework_id, student_id, student_name, house, subject_id, subject_name,
            lesson_id, lesson_title, status, current_version, content, word_count,
            attachments, links, submitted_at, is_late, late_duration_seconds,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'), datetime('now'))
        `).run(
          subId,
          id,
          student.id,
          student.fullName,
          student.house || 'ravnheim',
          hw.subject_id,
          hw.subject_name,
          hw.lesson_id || '',
          hw.lesson_title || '',
          status,
          newVersionNumber,
          content,
          wordCount,
          JSON.stringify(attachments),
          JSON.stringify(links),
          isLate ? 1 : 0,
          lateDurationSeconds
        );
      }

      // Create sealed snapshot version row
      const verId = genId('ver');
      db.prepare(`
        INSERT INTO homework_submission_versions (
          id, submission_id, homework_id, student_id, version_number, content, word_count,
          attachments, links, submitted_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
      `).run(
        verId,
        subId,
        id,
        student.id,
        newVersionNumber,
        content,
        wordCount,
        JSON.stringify(attachments),
        JSON.stringify(links),
        status
      );

      auditLog(
        student.id,
        student.fullName,
        student.role,
        isResubmission ? 'resubmit_homework' : 'submit_homework',
        id,
        subId,
        `Oddano wersję ${newVersionNumber} (Słowa: ${wordCount}, Spóźnienie: ${isLate ? 'TAK' : 'NIE'})`
      );

      return db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    });

    const finalSub = tx();
    const versions = db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(subId);

    // Notify professor
    if (hw.professor_id) {
      createNotification(
        hw.professor_id,
        hw.professor_name,
        `Adept ${student.fullName} oddał pracę: ${hw.title}`,
        `Adept ${student.fullName} (${student.house?.toUpperCase() || 'BRAK'}) złożył pracę domową z przedmiotu ${hw.subject_name}: „${hw.title}" (Wersja ${newVersionNumber}).`,
        'homework'
      );
    }

    res.json({
      ok: true,
      message: 'Twoja praca została zapieczętowana i przekazana profesorowi.',
      submittedAt: finalSub.submitted_at,
      status: finalSub.status,
      version: newVersionNumber,
      submission: dbHomeworkSubmissionToFrontend(finalSub, versions, exc)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd oddawania pracy domowej: ' + err.message });
  }
});

// POST /api/homework/submissions/:subId/grade — Grade homework submission (Professor/Admin)
router.post('/submissions/:subId/grade', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromSubmission), (req, res) => {
  try {
    const { subId } = req.params;
    const {
      gradeScore,
      gradeMax = 20,
      rubricScores = {},
      feedback = '',
      inlineAnnotations = [],
      housePointsAwarded = 0,
      skirnirAwarded = 0,
      isFeatured = false,
      featuredBadge = '',
      achievementAwarded = '',
      recordToGradebook = true
    } = req.body;

    const sub = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    if (!sub) return res.status(404).json({ error: 'Nie odnaleziono pracy do oceny.' });

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(sub.homework_id);

    const numericScore = parseFloat(gradeScore);
    const numericGradeMax = Number(gradeMax);
    const numericHousePoints = Number(housePointsAwarded);
    const numericSkirnirs = Number(skirnirAwarded);
    if (!Number.isFinite(numericScore) || !Number.isFinite(numericGradeMax) || numericGradeMax <= 0 || numericScore < 0 || numericScore > numericGradeMax) {
      return res.status(400).json({ error: 'Wprowadź poprawną liczbę punktów.' });
    }
    if (!Number.isInteger(numericHousePoints) || numericHousePoints < 0 || numericHousePoints > 100 || !Number.isInteger(numericSkirnirs) || numericSkirnirs < 0 || numericSkirnirs > 100) {
      return res.status(400).json({ error: 'Nagroda może wynosić od 0 do 100 punktów i Skirnirów.' });
    }

    const percentage = Math.round((numericScore / gradeMax) * 100);
    const gradeLabel = computeGradeLabel(percentage);
    const professor = req.user;

    const tx = db.transaction(() => {
      // Check if this is a re-grade (previous points existed)
      const prevPointsAwarded = sub.house_points_awarded || 0;
      const prevSkirnirAwarded = sub.skirnir_awarded || 0;

      // 1. Update submission record
      db.prepare(`
        UPDATE homework_submissions SET
          status = 'graded',
          grade_score = ?,
          grade_max = ?,
          grade_percentage = ?,
          grade_label = ?,
          rubric_scores = ?,
          feedback = ?,
          inline_annotations = ?,
          house_points_awarded = ?,
          skirnir_awarded = ?,
          is_featured = ?,
          featured_badge = ?,
          achievement_awarded = ?,
          recorded_to_gradebook = ?,
          graded_by = ?,
          graded_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        numericScore,
        gradeMax,
        percentage,
        gradeLabel,
        JSON.stringify(rubricScores),
        feedback.trim(),
        JSON.stringify(inlineAnnotations),
        housePointsAwarded,
        skirnirAwarded,
        isFeatured ? 1 : 0,
        featuredBadge,
        achievementAwarded,
        recordToGradebook ? 1 : 0,
        professor.fullName,
        subId
      );

      // 2. Update snapshot version row
      db.prepare(`
        UPDATE homework_submission_versions SET
          grade_score = ?, grade_label = ?, feedback = ?, rubric_scores = ?, inline_annotations = ?
        WHERE submission_id = ? AND version_number = ?
      `).run(
        numericScore,
        gradeLabel,
        feedback.trim(),
        JSON.stringify(rubricScores),
        JSON.stringify(inlineAnnotations),
        subId,
        sub.current_version || 1
      );

      // 3. Award House & Student Points via central service (idempotent, handles re-grade)
      if (housePointsAwarded > 0 && sub.house) {
        const idempKey = `homework-grade-pts-${subId}`;
        const existingPtTx = db.prepare("SELECT id, points FROM point_transactions WHERE idempotency_key = ?").get(idempKey);

        if (existingPtTx && existingPtTx.points !== housePointsAwarded) {
          // Re-grade with different points: correct the existing transaction
          try {
            correctTransaction(existingPtTx.id, housePointsAwarded, professor.id, professor.fullName,
              `Korekta oceny pracy domowej „${hw ? hw.title : sub.subject_name}"`);
          } catch (_) {}
        } else if (!existingPtTx) {
          awardPoints({
            studentId: sub.student_id,
            studentName: sub.student_name,
            house: sub.house,
            points: housePointsAwarded,
            source: `Praca domowa: ${hw ? hw.title : sub.subject_name}`,
            sourceType: 'HOMEWORK',
            sourceId: sub.homework_id || subId,
            lessonId: sub.lesson_id || (hw?.lesson_id || null),
            actorId: professor.id,
            actorName: professor.fullName,
            comment: `Nagroda za pracę domową „${hw ? hw.title : sub.subject_name}" (${numericScore}/${gradeMax} pkt) od ${professor.fullName}`,
            idempotencyKey: idempKey
          });
        }
      }

      // 3b. Award Skirniry via central Skirnir service (idempotent)
      if (skirnirAwarded > 0 && sub.student_id) {
        try {
          creditSkirniry({
            userId: sub.student_id,
            userName: sub.student_name,
            amount: skirnirAwarded,
            category: 'nagroda-akademicka',
            title: `Nagroda za pracę domową: ${hw ? hw.title : sub.subject_name}`,
            note: `Przyznano przez ${professor.fullName} za ocenę ${numericScore}/${gradeMax} pkt`,
            sourceType: 'HOMEWORK',
            sourceId: sub.homework_id || subId,
            actorId: professor.id,
            actorName: professor.fullName,
            idempotencyKey: `homework-grade-skr-${subId}`
          });
        } catch (skirnirErr) {
          console.warn('[Homework Grade] Błąd przyznawania Skirnirów:', skirnirErr.message);
        }
      }

      // 4. Record to central Gradebook (grades table) if requested
      if (recordToGradebook) {
        const gradeId = `grd-hw-${subId}`;
        const existingGrade = db.prepare('SELECT id FROM grades WHERE id = ?').get(gradeId);

        // Find or fallback category
        const cat = db.prepare("SELECT id FROM grade_categories WHERE subject_id = ? AND name LIKE '%domow%' LIMIT 1").get(sub.subject_id);
        const categoryId = cat ? cat.id : (db.prepare('SELECT id FROM grade_categories WHERE subject_id = ? LIMIT 1').get(sub.subject_id)?.id || 'cat-homework');

        if (existingGrade) {
          db.prepare(`
            UPDATE grades SET
              grade = ?, grade_label = ?, grade_value = ?, title = ?, comment = ?, professor_id = ?, professor_name = ?, date = date('now')
            WHERE id = ?
          `).run(
            gradeLabel.split(' ')[0],
            gradeLabel,
            Math.min(6, Math.max(1, Math.round((percentage / 100) * 5) + 1)),
            hw ? hw.title : 'Praca Domowa',
            feedback,
            professor.id,
            professor.fullName,
            gradeId
          );
        } else {
          db.prepare(`
            INSERT INTO grades (
              id, subject_id, category_id, student_id, student_name, house,
              grade, grade_label, grade_value, title, comment, professor_id, professor_name, lesson_id, date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), datetime('now'))
          `).run(
            gradeId,
            sub.subject_id,
            categoryId,
            sub.student_id,
            sub.student_name,
            sub.house,
            gradeLabel.split(' ')[0],
            gradeLabel,
            Math.min(6, Math.max(1, Math.round((percentage / 100) * 5) + 1)),
            hw ? hw.title : 'Praca Domowa',
            feedback,
            professor.id,
            professor.fullName,
            sub.lesson_id || ''
          );
        }
      }

      auditLog(
        professor.id,
        professor.fullName,
        professor.role,
        'grade_submission',
        sub.homework_id,
        subId,
        `Oceniono pracę na ${numericScore}/${gradeMax} (${gradeLabel}), Bonus Zakonu: +${housePointsAwarded} pkt`
      );

      return db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    });

    const updatedSub = tx();
    const rankings = calculateHouseRankings('overall');

    // Notify student (build comprehensive message)
    const bonusParts = [];
    if (housePointsAwarded > 0) bonusParts.push(`+${housePointsAwarded} pkt dla Zakonu ${sub.house?.toUpperCase()}`);
    if (skirnirAwarded > 0) bonusParts.push(`+${skirnirAwarded} Skirnirów`);
    const bonusStr = bonusParts.length > 0 ? ` Bonus: ${bonusParts.join(', ')}!` : '';

    createNotification(
      sub.student_id,
      sub.student_name,
      `Twoja praca domowa została oceniona: ${hw?.title || sub.subject_name}`,
      `Profesor ${professor.fullName} ocenił Twoją pracę domową z przedmiotu ${sub.subject_name}: „${hw?.title || ''}". Wynik: ${numericScore}/${gradeMax} pkt (${percentage}%, ${gradeLabel}).${bonusStr}`,
      'homework'
    );

    const versions = db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(subId);
    const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(sub.homework_id, sub.student_id);

    const awardedParts = [];
    if (housePointsAwarded > 0) awardedParts.push(`+${housePointsAwarded} pkt dla Zakonu`);
    if (skirnirAwarded > 0) awardedParts.push(`+${skirnirAwarded} Skirnirów`);
    const awardedStr = awardedParts.length > 0 ? ` Przyznano: ${awardedParts.join(', ')}.` : '';

    res.json({
      ok: true,
      message: `Praca została pomyślnie oceniona (${numericScore}/${gradeMax} pkt • ${gradeLabel}).${awardedStr}`,
      submission: dbHomeworkSubmissionToFrontend(updatedSub, versions, exc),
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd oceniania pracy domowej: ' + err.message });
  }
});

// POST /api/homework/submissions/:subId/return — Return submission for revision (Professor/Admin)
router.post('/submissions/:subId/return', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromSubmission), (req, res) => {
  try {
    const { subId } = req.params;
    const { reason = '', revisionDueDate = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Podaj powód zwrotu pracy do poprawy.' });
    }

    const sub = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    if (!sub) return res.status(404).json({ error: 'Nie odnaleziono pracy.' });

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(sub.homework_id);
    const professor = req.user;

    db.prepare(`
      UPDATE homework_submissions SET
        status = 'returned_for_revision',
        revision_reason = ?,
        revision_due_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(reason.trim(), revisionDueDate, subId);

    auditLog(
      professor.id,
      professor.fullName,
      professor.role,
      'return_for_revision',
      sub.homework_id,
      subId,
      `Zwrócono do poprawy. Powód: ${reason}. Nowy termin: ${revisionDueDate || 'Brak'}`
    );

    // Notify student
    createNotification(
      sub.student_id,
      sub.student_name,
      `Praca zwrócona do poprawy: ${hw?.title || sub.subject_name}`,
      `Profesor ${professor.fullName} zwrócił Twoją pracę domową do poprawy. Powód: „${reason}".${revisionDueDate ? ` Nowy termin poprawy: ${revisionDueDate}.` : ''}`,
      'homework'
    );

    const updated = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(subId);
    const versions = db.prepare('SELECT * FROM homework_submission_versions WHERE submission_id = ? ORDER BY version_number DESC').all(subId);
    const exc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(sub.homework_id, sub.student_id);

    res.json({
      ok: true,
      message: 'Praca została zwrócona adeptowi do poprawy.',
      submission: dbHomeworkSubmissionToFrontend(updated, versions, exc)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zwracania pracy do poprawy: ' + err.message });
  }
});

// ==================== 7. INDIVIDUAL EXCEPTIONS ====================

// POST /api/homework/:id/exceptions — Set individual student exception (Professor/Admin)
router.post('/:id/exceptions', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, customDueDate, extraTimeHours = 0, isExempt = false, allowResubmission = true, reason = '' } = req.body;

    if (!studentId) return res.status(400).json({ error: 'Wybierz ucznia.' });

    const hw = db.prepare('SELECT * FROM homework_assignments WHERE id = ?').get(id);
    if (!hw) return res.status(404).json({ error: 'Nie odnaleziono zadania.' });
    const student = db.prepare("SELECT id, full_name, class_year FROM users WHERE id = ? AND role = 'student'").get(studentId);
    if (!student) return res.status(404).json({ error: 'Nie odnaleziono ucznia.' });
    if (hw.class_year && hw.class_year !== 'Wszystkie' && hw.class_year !== student.class_year) return res.status(400).json({ error: 'Uczeń nie należy do klasy przypisanej do zadania.' });
    const studentName = student.full_name;

    const excId = genId('exc');
    const existing = db.prepare('SELECT id FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(id, studentId);

    if (existing) {
      db.prepare(`
        UPDATE homework_exceptions SET
          custom_due_date = ?, extra_time_hours = ?, is_exempt = ?, allow_resubmission = ?, reason = ?
        WHERE id = ?
      `).run(customDueDate || null, extraTimeHours, isExempt ? 1 : 0, allowResubmission ? 1 : 0, reason, existing.id);
    } else {
      db.prepare(`
        INSERT INTO homework_exceptions (id, homework_id, student_id, student_name, custom_due_date, extra_time_hours, is_exempt, allow_resubmission, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(excId, id, studentId, studentName || studentId, customDueDate || null, extraTimeHours, isExempt ? 1 : 0, allowResubmission ? 1 : 0, reason, req.user.id);
    }

    auditLog(
      req.user.id,
      req.user.fullName,
      req.user.role,
      'set_exception',
      id,
      '',
      `Ustawiono wyjątek dla ${studentName}: Termin: ${customDueDate || 'Brak'}, Zwolnienie: ${isExempt ? 'TAK' : 'NIE'}`
    );

    const updatedExc = db.prepare('SELECT * FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').get(id, studentId);
    res.json({
      ok: true,
      message: `Przyznano indywidualne warunki dla adepta ${studentName}.`,
      exception: dbHomeworkExceptionToFrontend(updatedExc)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd ustawiania wyjątku: ' + err.message });
  }
});

// DELETE /api/homework/:id/exceptions/:studentId — Delete student exception
router.delete('/:id/exceptions/:studentId', requireAuth, requireRole('professor', 'admin'), requireHomeworkOwner(homeworkFromParam), (req, res) => {
  try {
    const { id, studentId } = req.params;
    db.prepare('DELETE FROM homework_exceptions WHERE homework_id = ? AND student_id = ?').run(id, studentId);
    res.json({ ok: true, message: 'Usunięto indywidualny wyjątek dla ucznia.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania wyjątku: ' + err.message });
  }
});

// ==================== 8. FILE UPLOAD ====================

// POST /api/homework/upload — Upload attachment for assignment or submission
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { fileName, fileData, fileType } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Brak pliku do przesłania.' });
    }

    // Safety checks
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedName).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.docx'];

    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: `Niedozwolony format pliku: ${ext}. Dozwolone: grafiki, PDF, TXT i DOCX.` });
    }

    const uniqueName = `hw-${Date.now()}-${sanitizedName}`;
    const targetPath = path.join(UPLOADS_DIR, uniqueName);

    // If fileData is base64 string
    const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Rozmiar pliku przekracza limit 10MB.' });
    }

    const signatures = {
      '.jpg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
      '.jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
      '.png': b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      '.gif': b => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')),
      '.webp': b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
      '.pdf': b => b.subarray(0, 5).toString('ascii') === '%PDF-',
      '.docx': b => b[0] === 0x50 && b[1] === 0x4b,
      '.txt': b => !b.includes(0)
    };
    if (buffer.length === 0 || !signatures[ext](buffer)) return res.status(400).json({ error: 'Zawartość pliku nie odpowiada jego rozszerzeniu.' });

    await fs.promises.writeFile(targetPath, buffer);

    const relativeUrl = `/uploads/homework/${uniqueName}`;

    res.json({
      ok: true,
      attachment: {
        id: `att-${Date.now()}`,
        name: fileName,
        url: relativeUrl,
        size: buffer.length,
        type: fileType || ext.replace('.', '')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd uploadu pliku: ' + err.message });
  }
});

export default router;
