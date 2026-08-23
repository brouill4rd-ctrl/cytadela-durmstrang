import express from 'express';
import db, {
  dbSubjectToFrontend,
  dbGradeCategoryToFrontend,
  dbGradeToFrontend,
  dbSubjectAchievementToFrontend,
  dbLessonToFrontend
} from '../db.js';
import { requireAuth, requireRole, requireSubjectOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Słownik wag i etykiet dla skali HP
const HP_GRADES = {
  'W': { label: 'Wybitny (W)', value: 6, color: '#eab308' },
  'PO': { label: 'Powyżej Oczekiwań (PO)', value: 5, color: '#10b981' },
  'Z': { label: 'Zadowalający (Z)', value: 4, color: '#3b82f6' },
  'N': { label: 'Nędzny (N)', value: 3, color: '#f97316' },
  'O': { label: 'Okropny (O)', value: 2, color: '#ba36b0' },
  'T': { label: 'Troll (T)', value: 1, color: '#ef4444' }
};

// GET /api/subjects - Lista wszystkich przedmiotów
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM subjects ORDER BY sort_order ASC, name ASC').all();

    // Dołączamy podstawowe statystyki do każdego przedmiotu
    const subjects = rows.map(r => {
      const categories = db.prepare('SELECT * FROM grade_categories WHERE subject_id = ? ORDER BY sort_order ASC').all(r.id);

      const statsRow = db.prepare(`
        SELECT 
          COUNT(id) as total_grades,
          AVG(grade_value) as avg_grade
        FROM grades 
        WHERE subject_id = ?
      `).get(r.id);

      const lessonsCount = db.prepare(`
        SELECT COUNT(id) as count 
        FROM lessons 
        WHERE subject_id = ? OR subject_name LIKE ?
      `).get(r.id, `%${r.name}%`)?.count || 0;

      return dbSubjectToFrontend(r, categories, [], [], {
        totalGrades: statsRow?.total_grades || 0,
        averageGrade: statsRow?.avg_grade ? Number(statsRow.avg_grade.toFixed(2)) : null,
        lessonsCount
      });
    });

    res.json(subjects);
  } catch (err) {
    console.error('[API /subjects] Błąd pobierania przedmiotów:', err);
    res.status(500).json({ error: 'Nie udało się pobrać listy przedmiotów.' });
  }
});

// GET /api/subjects/:id - Pełne szczegóły wybranego przedmiotu
router.get('/:id', (req, res) => {
  try {
    const subjectRow = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subjectRow) {
      return res.status(404).json({ error: 'Nie znaleziono takiego przedmiotu w archiwach Cytadeli.' });
    }

    const categories = db.prepare('SELECT * FROM grade_categories WHERE subject_id = ? ORDER BY sort_order ASC').all(subjectRow.id);

    // Oceny wraz z nazwą kategorii
    const gradesRows = db.prepare(`
      SELECT g.*, gc.name as category_name, gc.icon as category_icon
      FROM grades g
      LEFT JOIN grade_categories gc ON g.category_id = gc.id
      WHERE g.subject_id = ?
      ORDER BY g.date DESC, g.created_at DESC
    `).all(subjectRow.id);

    // Powiązane dzienniki lekcyjne z Discorda
    const lessonRows = db.prepare(`
      SELECT * FROM lessons 
      WHERE subject_id = ? OR subject_name LIKE ?
      ORDER BY date DESC 
      LIMIT 10
    `).all(subjectRow.id, `%${subjectRow.name}%`);

    const recentLessons = lessonRows.map(l => {
      const participants = db.prepare('SELECT * FROM lesson_participants WHERE lesson_id = ?').all(l.id);
      return dbLessonToFrontend(l, [], participants);
    });

    // Osiągnięcia przedmiotowe
    const achievements = db.prepare('SELECT * FROM subject_achievements WHERE subject_id = ? ORDER BY date DESC').all(subjectRow.id)
      .map(dbSubjectAchievementToFrontend);

    // Statystyki
    const gradeDistribution = { W: 0, P: 0, Z: 0, N: 0, T: 0 };
    let sumGrades = 0;
    gradesRows.forEach(g => {
      if (gradeDistribution[g.grade] !== undefined) {
        gradeDistribution[g.grade]++;
      }
      sumGrades += g.grade_value;
    });

    const stats = {
      totalGrades: gradesRows.length,
      averageGrade: gradesRows.length > 0 ? Number((sumGrades / gradesRows.length).toFixed(2)) : null,
      gradeDistribution,
      lessonsCount: lessonRows.length,
      achievements
    };

    const subject = dbSubjectToFrontend(subjectRow, categories, gradesRows, recentLessons, stats);
    res.json(subject);
  } catch (err) {
    console.error(`[API /subjects/${req.params.id}] Błąd:`, err);
    res.status(500).json({ error: 'Błąd podczas pobierania szczegółów katedry.' });
  }
});

// POST /api/subjects - Tworzenie nowego przedmiotu (Admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const {
      id,
      name,
      code = '',
      icon = '📚',
      category = 'Ogólne',
      description = '',
      classroom = '',
      professorId = '',
      professorName = '',
      bannerUrl = '',
      bannerGradient = 'linear-gradient(135deg, #1c132e 0%, #0d0618 100%)',
      syllabus = '',
      regulations = '',
      classYears = ['Klasa I', 'Klasa II', 'Klasa III', 'Klasa IV']
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nazwa przedmiotu jest wymagana.' });
    }

    const subjectId = id ? id.trim().toLowerCase().replace(/\s+/g, '-') : name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existing = db.prepare('SELECT id FROM subjects WHERE id = ?').get(subjectId);
    if (existing) {
      return res.status(400).json({ error: 'Przedmiot o tym identyfikatorze już istnieje.' });
    }

    const defaultSyllabus = syllabus || `# Plan Nauczania: ${name}\n\n## Zakres tematyczny\nPlan nauczania dla Katedry ${name}.\n\n## Wymagania\nRegularne uczestnictwo w zajęciach i oddawanie esejów.`;
    const defaultRegulations = regulations || `# Regulamin Zajęć: ${name}\n\n1. Przestrzeganie dyscypliny w Katedrze.\n2. Punktualne oddawanie prac domowych.\n3. Użycie różdżki wyłącznie na polecenie Prowadzącego.`;

    const maxSort = db.prepare('SELECT MAX(sort_order) as maxSort FROM subjects').get()?.maxSort || 0;

    db.prepare(`
      INSERT INTO subjects (id, name, code, icon, category, description, classroom, professor_id, professor_name, banner_url, banner_gradient, syllabus, regulations, class_years, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      subjectId,
      name.trim(),
      code.trim(),
      icon.trim(),
      category.trim(),
      description.trim(),
      classroom.trim(),
      professorId.trim(),
      professorName.trim(),
      bannerUrl.trim(),
      bannerGradient.trim(),
      defaultSyllabus,
      defaultRegulations,
      JSON.stringify(classYears),
      maxSort + 1
    );

    // Domyślne kategorie ocen
    const defaultCats = [
      { name: 'Prace Domowe', weight: 1.0, icon: '📝', sort: 1 },
      { name: 'Egzaminy', weight: 2.0, icon: '📋', sort: 2 },
      { name: 'Aktywność', weight: 0.5, icon: '🗣️', sort: 3 },
      { name: 'Quizy', weight: 0.8, icon: '⚡', sort: 4 }
    ];

    const insertCat = db.prepare('INSERT INTO grade_categories (id, subject_id, name, weight, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const c of defaultCats) {
      insertCat.run(`cat-${subjectId}-${c.sort}`, subjectId, c.name, c.weight, c.icon, c.sort);
    }

    const createdRow = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
    const cats = db.prepare('SELECT * FROM grade_categories WHERE subject_id = ?').all(subjectId);

    res.status(201).json(dbSubjectToFrontend(createdRow, cats));
  } catch (err) {
    console.error('[API POST /subjects] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się utworzyć przedmiotu.' });
  }
});

// PUT /api/subjects/:id - Aktualizacja danych przedmiotu (Admin / Przypisany Profesor)
router.put('/:id', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const {
      name,
      code,
      icon,
      category,
      description,
      classroom,
      professorId,
      professorName,
      bannerUrl,
      bannerGradient,
      classYears,
      isActive,
      sortOrder
    } = req.body;

    const current = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Nie znaleziono przedmiotu do aktualizacji.' });
    }

    db.prepare(`
      UPDATE subjects
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          icon = COALESCE(?, icon),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          classroom = COALESCE(?, classroom),
          professor_id = COALESCE(?, professor_id),
          professor_name = COALESCE(?, professor_name),
          banner_url = COALESCE(?, banner_url),
          banner_gradient = COALESCE(?, banner_gradient),
          class_years = COALESCE(?, class_years),
          is_active = COALESCE(?, is_active),
          sort_order = COALESCE(?, sort_order),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : null,
      code !== undefined ? code.trim() : null,
      icon !== undefined ? icon.trim() : null,
      category !== undefined ? category.trim() : null,
      description !== undefined ? description.trim() : null,
      classroom !== undefined ? classroom.trim() : null,
      professorId !== undefined ? professorId.trim() : null,
      professorName !== undefined ? professorName.trim() : null,
      bannerUrl !== undefined ? bannerUrl.trim() : null,
      bannerGradient !== undefined ? bannerGradient.trim() : null,
      classYears !== undefined ? JSON.stringify(classYears) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      sortOrder !== undefined ? parseInt(sortOrder, 10) : null,
      req.params.id
    );

    const updatedRow = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    const categories = db.prepare('SELECT * FROM grade_categories WHERE subject_id = ? ORDER BY sort_order ASC').all(req.params.id);

    res.json(dbSubjectToFrontend(updatedRow, categories));
  } catch (err) {
    console.error(`[API PUT /subjects/${req.params.id}] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się zaktualizować przedmiotu.' });
  }
});

// PUT /api/subjects/:id/syllabus - Aktualizacja planu nauczania (Profesor / Admin)
router.put('/:id/syllabus', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const { syllabus } = req.body;
    if (syllabus === undefined) {
      return res.status(400).json({ error: 'Brak treści planu nauczania.' });
    }

    db.prepare(`
      UPDATE subjects
      SET syllabus = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(syllabus, req.params.id);

    res.json({ message: 'Plan nauczania został pomyślnie zaktualizowany na pergaminie.', syllabus });
  } catch (err) {
    console.error(`[API PUT /subjects/${req.params.id}/syllabus] Błąd:`, err);
    res.status(500).json({ error: 'Błąd zapisu planu nauczania.' });
  }
});

// PUT /api/subjects/:id/regulations - Aktualizacja regulaminu zajęć (Profesor / Admin)
router.put('/:id/regulations', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const { regulations } = req.body;
    if (regulations === undefined) {
      return res.status(400).json({ error: 'Brak treści regulaminu.' });
    }

    db.prepare(`
      UPDATE subjects
      SET regulations = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(regulations, req.params.id);

    res.json({ message: 'Regulamin zajęć został zaktualizowany.', regulations });
  } catch (err) {
    console.error(`[API PUT /subjects/${req.params.id}/regulations] Błąd:`, err);
    res.status(500).json({ error: 'Błąd zapisu regulaminu.' });
  }
});

// DELETE /api/subjects/:id - Usunięcie przedmiotu (Admin)
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Przedmiot nie istnieje.' });
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ message: `Przedmiot „${subject.name}” został wymazany z ksiąg Cytadeli.` });
  } catch (err) {
    console.error(`[API DELETE /subjects/${req.params.id}] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się usunąć przedmiotu.' });
  }
});

// ==================== SYSTEM OCEN W SKALI HP ====================

// GET /api/subjects/:id/grades - Pobierz oceny przedmiotu
router.get('/:id/grades', (req, res) => {
  try {
    const { studentId, categoryId, house } = req.query;
    let query = `
      SELECT g.*, gc.name as category_name, gc.icon as category_icon
      FROM grades g
      LEFT JOIN grade_categories gc ON g.category_id = gc.id
      WHERE g.subject_id = ?
    `;
    const params = [req.params.id];

    if (studentId) {
      query += ' AND g.student_id = ?';
      params.push(studentId);
    }
    if (categoryId) {
      query += ' AND g.category_id = ?';
      params.push(categoryId);
    }
    if (house) {
      query += ' AND g.house = ?';
      params.push(house.toLowerCase());
    }

    query += ' ORDER BY g.date DESC, g.created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbGradeToFrontend));
  } catch (err) {
    console.error(`[API GET /subjects/${req.params.id}/grades] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się pobrać ocen.' });
  }
});

// POST /api/subjects/:id/grades - Dodaj ocenę w skali HP (Profesor / Admin)
router.post('/:id/grades', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const {
      categoryId,
      studentId,
      studentName,
      house,
      grade,
      title,
      comment = '',
      professorId,
      professorName,
      lessonId = '',
      date = new Date().toISOString().split('T')[0]
    } = req.body;

    if (!studentId || !studentName || !grade || !categoryId) {
      return res.status(400).json({ error: 'Wymagane pola: adept, kategoria oraz ocena HP (W, P, Z, N, T).' });
    }

    const hpInfo = HP_GRADES[grade.toUpperCase()];
    if (!hpInfo) {
      return res.status(400).json({ error: 'Nieprawidłowa ocena. Dopuszczalne: W (Wybitny), P (Powyżej Oczekiwań), Z (Zadowalający), N (Nędzny), T (Troll).' });
    }

    const gradeId = `grd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    db.prepare(`
      INSERT INTO grades (id, subject_id, category_id, student_id, student_name, house, grade, grade_label, grade_value, title, comment, professor_id, professor_name, lesson_id, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      gradeId,
      req.params.id,
      categoryId,
      studentId,
      studentName,
      (house || 'ravnheim').toLowerCase(),
      grade.toUpperCase(),
      hpInfo.label,
      hpInfo.value,
      title || 'Ocena cząstkowa',
      comment,
      professorId || '',
      professorName || 'Profesor Katedry',
      lessonId || '',
      date
    );

    const inserted = db.prepare(`
      SELECT g.*, gc.name as category_name, gc.icon as category_icon
      FROM grades g
      LEFT JOIN grade_categories gc ON g.category_id = gc.id
      WHERE g.id = ?
    `).get(gradeId);

    // Sprawdź czy adept zasłużył na odznakę "Wybitny Adept Katedry" (np. 3 oceny W)
    const wGradesCount = db.prepare('SELECT COUNT(*) as count FROM grades WHERE subject_id = ? AND student_id = ? AND grade = ?').get(req.params.id, studentId, 'W')?.count || 0;
    if (wGradesCount >= 3) {
      const existingAch = db.prepare('SELECT id FROM subject_achievements WHERE subject_id = ? AND student_id = ? AND achievement_type = ?').get(req.params.id, studentId, 'perfect_mastery');
      if (!existingAch) {
        db.prepare(`
          INSERT INTO subject_achievements (id, subject_id, student_id, student_name, achievement_type, title, description, icon, date)
          VALUES (?, ?, ?, ?, 'perfect_mastery', 'Arcymistrz Katedry', 'Zdobyto 3 oceny Wybitny (W) z przedmiotu.', '🌟', ?)
        `).run(`ach-${Date.now()}`, req.params.id, studentId, studentName, date);
      }
    }

    res.status(201).json(dbGradeToFrontend(inserted));
  } catch (err) {
    console.error(`[API POST /subjects/${req.params.id}/grades] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się wystawić oceny.' });
  }
});

// DELETE /api/subjects/:id/grades/:gradeId - Usunięcie oceny (Profesor / Admin)
router.delete('/:id/grades/:gradeId', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const deleted = db.prepare('DELETE FROM grades WHERE id = ? AND subject_id = ?').run(req.params.gradeId, req.params.id);
    if (deleted.changes === 0) {
      return res.status(404).json({ error: 'Nie znaleziono oceny do usunięcia.' });
    }
    res.json({ message: 'Ocena została usunięta z księgi.' });
  } catch (err) {
    console.error(`[API DELETE grade] Błąd:`, err);
    res.status(500).json({ error: 'Błąd podczas usuwania oceny.' });
  }
});

// ==================== KATEGORIE OCEN ====================

// POST /api/subjects/:id/categories - Dodanie nowej kategorii ocen (Profesor / Admin)
router.post('/:id/categories', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    const { name, weight = 1.0, icon = '📝' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
    }

    const maxSort = db.prepare('SELECT MAX(sort_order) as maxSort FROM grade_categories WHERE subject_id = ?').get(req.params.id)?.maxSort || 0;
    const catId = `cat-${req.params.id}-${Date.now()}`;

    db.prepare(`
      INSERT INTO grade_categories (id, subject_id, name, weight, icon, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(catId, req.params.id, name.trim(), Number(weight) || 1.0, icon.trim() || '📝', maxSort + 1);

    const inserted = db.prepare('SELECT * FROM grade_categories WHERE id = ?').get(catId);
    res.status(201).json(dbGradeCategoryToFrontend(inserted));
  } catch (err) {
    console.error(`[API POST /subjects/${req.params.id}/categories] Błąd:`, err);
    res.status(500).json({ error: 'Nie udało się dodać kategorii ocen.' });
  }
});

// DELETE /api/subjects/:id/categories/:catId - Usunięcie kategorii ocen (Profesor / Admin)
router.delete('/:id/categories/:catId', requireAuth, requireSubjectOwnerOrAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM grade_categories WHERE id = ? AND subject_id = ?').run(req.params.catId, req.params.id);
    res.json({ message: 'Kategoria ocen została usunięta.' });
  } catch (err) {
    console.error(`[API DELETE category] Błąd:`, err);
    res.status(500).json({ error: 'Błąd podczas usuwania kategorii.' });
  }
});

export default router;
