import { Router } from 'express';
import db, {
  dbGazetteIssueToFrontend,
  dbGazetteArticleToFrontend,
  dbGazettePageToFrontend,
  dbGazetteSectionToFrontend,
  dbGazetteStaffToFrontend,
  dbGazetteSubmissionToFrontend
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();
const uid = () => crypto.randomUUID().slice(0, 12);

// ===================== GAZETTE ROLE MIDDLEWARE =====================

/**
 * Checks if user has a gazette role (editor_in_chief, editor, photographer, illustrator, proofreader).
 * Admin always passes. Injects req.gazetteRoles array.
 */
function requireGazetteRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Brak autoryzacji.' });
    if (req.user.role === 'admin') {
      req.gazetteRoles = ['admin'];
      return next();
    }

    const staffRows = db.prepare(
      'SELECT gazette_role FROM gazette_staff WHERE user_id = ? AND is_permanent = 1'
    ).all(req.user.id);

    const userGazetteRoles = staffRows.map(r => r.gazette_role);
    req.gazetteRoles = userGazetteRoles;

    if (roles.length === 0 && userGazetteRoles.length > 0) return next();
    if (roles.some(r => userGazetteRoles.includes(r))) return next();

    return res.status(403).json({
      error: `Brak uprawnień redakcyjnych. Wymagana rola: ${roles.join(' lub ')}.`
    });
  };
}

// ===================== PUBLIC ENDPOINTS =====================

// GET /api/gazette/sections — list all active sections
router.get('/sections', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM gazette_sections WHERE is_active = 1 ORDER BY sort_order ASC').all();
    res.json(rows.map(dbGazetteSectionToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania działów: ' + err.message });
  }
});

// GET /api/gazette/issues — list published issues
router.get('/issues', (req, res) => {
  try {
    const { status, year } = req.query;
    let query = 'SELECT * FROM gazette_issues';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    } else {
      conditions.push("status = 'published'");
    }
    if (year) {
      conditions.push('school_year LIKE ?');
      params.push(`%${year}%`);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY number DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbGazetteIssueToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wydań: ' + err.message });
  }
});

// GET /api/gazette/issues/latest — latest published issue with pages and articles
router.get('/issues/latest', (req, res) => {
  try {
    const issue = db.prepare(
      "SELECT * FROM gazette_issues WHERE status = 'published' ORDER BY number DESC LIMIT 1"
    ).get();
    if (!issue) return res.json(null);

    const pages = db.prepare(
      'SELECT * FROM gazette_pages WHERE issue_id = ? ORDER BY sort_order ASC'
    ).all(issue.id);

    const articles = db.prepare(
      "SELECT * FROM gazette_articles WHERE issue_id = ? AND status = 'published' ORDER BY rowid ASC"
    ).all(issue.id);

    res.json({
      ...dbGazetteIssueToFrontend(issue),
      pages: pages.map(dbGazettePageToFrontend),
      articles: articles.map(dbGazetteArticleToFrontend)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania najnowszego numeru: ' + err.message });
  }
});

// GET /api/gazette/issues/:id — full issue with pages, articles, quizzes, crosswords
router.get('/issues/:id', (req, res) => {
  try {
    const issue = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Nie znaleziono wydania.' });

    // Only allow non-published access for staff
    const userId = req.headers['x-user-id'];
    if (issue.status !== 'published') {
      if (!userId) return res.status(403).json({ error: 'Wydanie nie jest jeszcze opublikowane.' });
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
      if (!user || user.role !== 'admin') {
        const staffCheck = db.prepare('SELECT id FROM gazette_staff WHERE user_id = ?').get(userId);
        if (!staffCheck) return res.status(403).json({ error: 'Wydanie nie jest jeszcze opublikowane.' });
      }
    }

    const pages = db.prepare(
      'SELECT * FROM gazette_pages WHERE issue_id = ? ORDER BY sort_order ASC'
    ).all(issue.id);

    const articles = db.prepare(
      'SELECT * FROM gazette_articles WHERE issue_id = ? ORDER BY rowid ASC'
    ).all(issue.id);

    const quizzes = db.prepare(
      'SELECT * FROM gazette_quizzes WHERE issue_id = ?'
    ).all(issue.id);

    const crosswords = db.prepare(
      'SELECT * FROM gazette_crosswords WHERE issue_id = ?'
    ).all(issue.id);

    const secrets = db.prepare(
      'SELECT * FROM gazette_secrets WHERE issue_id = ?'
    ).all(issue.id);

    // Editor info
    let editorInChief = null;
    if (issue.editor_in_chief_id) {
      const editor = db.prepare('SELECT id, full_name, avatar FROM users WHERE id = ?').get(issue.editor_in_chief_id);
      if (editor) editorInChief = { id: editor.id, fullName: editor.full_name, avatar: editor.avatar };
    }

    // Staff for this issue
    const staff = db.prepare(
      `SELECT gs.*, u.full_name, u.avatar FROM gazette_staff gs
       LEFT JOIN users u ON gs.user_id = u.id
       WHERE gs.is_permanent = 1 OR gs.issue_id = ?`
    ).all(issue.id);

    res.json({
      ...dbGazetteIssueToFrontend(issue),
      pages: pages.map(dbGazettePageToFrontend),
      articles: articles.map(dbGazetteArticleToFrontend),
      quizzes: quizzes.map(q => ({
        id: q.id, pageId: q.page_id, title: q.title,
        questions: JSON.parse(q.questions || '[]'),
        resultsMessages: JSON.parse(q.results_messages || '[]')
      })),
      crosswords: crosswords.map(c => ({
        id: c.id, pageId: c.page_id, title: c.title,
        words: JSON.parse(c.words || '[]'),
        gridWidth: c.grid_width, gridHeight: c.grid_height
      })),
      secrets: issue.status === 'published' ? secrets.map(s => ({
        id: s.id, pageId: s.page_id, triggerType: s.trigger_type,
        triggerTarget: s.trigger_target, secretContent: s.secret_content,
        secretType: s.secret_type
      })) : [],
      editorInChief,
      staff: staff.map(s => ({
        id: s.id, userId: s.user_id, userName: s.user_name || s.full_name || '',
        gazetteRole: s.gazette_role, avatar: s.avatar || '', fullName: s.full_name || ''
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wydania: ' + err.message });
  }
});

// GET /api/gazette/archive — archive grouped by year
router.get('/archive', (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM gazette_issues WHERE status IN ('published', 'archived') ORDER BY number DESC"
    ).all();
    res.json(rows.map(dbGazetteIssueToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania archiwum: ' + err.message });
  }
});

// GET /api/gazette/search — search articles across all published issues
router.get('/search', (req, res) => {
  try {
    const { q, issueId } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const searchTerm = `%${q.trim()}%`;
    let query = `
      SELECT ga.*, gi.number as issue_number, gi.title as issue_title
      FROM gazette_articles ga
      LEFT JOIN gazette_issues gi ON ga.issue_id = gi.id
      WHERE ga.status = 'published'
        AND (ga.title LIKE ? OR ga.lead LIKE ? OR ga.content LIKE ? OR ga.author_name LIKE ?)
    `;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm];

    if (issueId) {
      query += ' AND ga.issue_id = ?';
      params.push(issueId);
    }
    query += ' ORDER BY gi.number DESC, ga.rowid ASC LIMIT 50';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(r => {
      const article = dbGazetteArticleToFrontend(r);
      // Find page number for this article
      const page = db.prepare(
        'SELECT page_number FROM gazette_pages WHERE issue_id = ? AND article_id = ? LIMIT 1'
      ).get(r.issue_id, r.id);
      return {
        ...article,
        issueNumber: r.issue_number,
        issueTitle: r.issue_title,
        pageNumber: page ? page.page_number : null
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Błąd wyszukiwania: ' + err.message });
  }
});

// ===================== EDITORIAL ENDPOINTS (require auth + gazette role) =====================

// GET /api/gazette/issues/all — all issues for editorial panel (including drafts)
router.get('/issues/all', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM gazette_issues ORDER BY number DESC').all();
    res.json(rows.map(dbGazetteIssueToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// POST /api/gazette/issues — create new issue
router.post('/issues', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `issue-${uid()}`;
    const number = b.number || 1;

    db.prepare(`
      INSERT INTO gazette_issues (id, number, title, theme, school_year, publication_date, cover_image, description, editor_in_chief_id, editorial_team, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      id, number, b.title || '', b.theme || '', b.schoolYear || '',
      b.publicationDate || '', b.coverImage || '', b.description || '',
      b.editorInChiefId || req.user.id, JSON.stringify(b.editorialTeam || [])
    );

    // Auto-create cover page
    db.prepare(`
      INSERT INTO gazette_pages (id, issue_id, page_number, template, content, sort_order)
      VALUES (?, ?, 1, 'cover', ?, 0)
    `).run(`page-${uid()}`, id, JSON.stringify({
      title: 'ŻELAZNE PIÓRO',
      subtitle: `Nr ${number}`,
      mainHeadline: b.title || '',
      coverImage: b.coverImage || ''
    }));

    const created = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(id);
    res.status(201).json(dbGazetteIssueToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia wydania: ' + err.message });
  }
});

// PUT /api/gazette/issues/:id — update issue
router.put('/issues/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const existing = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono wydania.' });

    db.prepare(`
      UPDATE gazette_issues SET
        number = ?, title = ?, theme = ?, school_year = ?, publication_date = ?,
        cover_image = ?, description = ?, editor_in_chief_id = ?, editorial_team = ?,
        status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      b.number !== undefined ? b.number : existing.number,
      b.title !== undefined ? b.title : existing.title,
      b.theme !== undefined ? b.theme : existing.theme,
      b.schoolYear !== undefined ? b.schoolYear : existing.school_year,
      b.publicationDate !== undefined ? b.publicationDate : existing.publication_date,
      b.coverImage !== undefined ? b.coverImage : existing.cover_image,
      b.description !== undefined ? b.description : existing.description,
      b.editorInChiefId !== undefined ? b.editorInChiefId : existing.editor_in_chief_id,
      b.editorialTeam ? JSON.stringify(b.editorialTeam) : existing.editorial_team,
      b.status !== undefined ? b.status : existing.status,
      id
    );

    const updated = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(id);
    res.json(dbGazetteIssueToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd edycji wydania: ' + err.message });
  }
});

// POST /api/gazette/issues/:id/publish — publish issue with checklist
router.post('/issues/:id/publish', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const { id } = req.params;
    const issue = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(id);
    if (!issue) return res.status(404).json({ error: 'Nie znaleziono wydania.' });

    // Checklist validation
    const errors = [];
    if (!issue.cover_image && !issue.title) errors.push('Brak okładki lub tytułu');
    if (!issue.number) errors.push('Brak numeru wydania');

    const pages = db.prepare('SELECT * FROM gazette_pages WHERE issue_id = ?').all(id);
    if (pages.length < 2) errors.push('Zbyt mało stron (minimum 2)');

    const articles = db.prepare(
      "SELECT * FROM gazette_articles WHERE issue_id = ? AND status != 'approved' AND status != 'in_issue' AND status != 'published'"
    ).all(id);

    // Check for non-approved articles
    const pendingArticles = db.prepare(
      "SELECT COUNT(*) as count FROM gazette_articles WHERE issue_id = ? AND status NOT IN ('approved', 'in_issue', 'published')"
    ).get(id);
    if (pendingArticles.count > 0) errors.push(`${pendingArticles.count} artykuł(y) niezaakceptowane`);

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Checklista publikacji niespełniona', details: errors });
    }

    // Publish
    db.prepare(`
      UPDATE gazette_issues SET status = 'published', publication_date = date('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    // Update all articles to published
    db.prepare(`
      UPDATE gazette_articles SET status = 'published', updated_at = datetime('now')
      WHERE issue_id = ? AND status IN ('approved', 'in_issue')
    `).run(id);

    const updated = db.prepare('SELECT * FROM gazette_issues WHERE id = ?').get(id);
    res.json({ ...dbGazetteIssueToFrontend(updated), message: 'Numer opublikowany pomyślnie!' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd publikacji: ' + err.message });
  }
});

// ===================== ARTICLES =====================

// GET /api/gazette/articles — list articles (filtered)
router.get('/articles', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const { issueId, status, authorId, sectionId } = req.query;
    let query = 'SELECT * FROM gazette_articles';
    const params = [];
    const conditions = [];

    if (issueId) { conditions.push('issue_id = ?'); params.push(issueId); }
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (authorId) { conditions.push('author_id = ?'); params.push(authorId); }
    if (sectionId) { conditions.push('section_id = ?'); params.push(sectionId); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY updated_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbGazetteArticleToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania artykułów: ' + err.message });
  }
});

// POST /api/gazette/articles — create article
router.post('/articles', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const b = req.body;
    const id = `art-${uid()}`;

    db.prepare(`
      INSERT INTO gazette_articles (id, issue_id, title, supertitle, subtitle, lead, content,
        author_id, author_name, coauthor_id, coauthor_name, section_id, section_name,
        featured_image, additional_images, featured_quote, sources, editorial_note,
        status, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, b.issueId || '', b.title || 'Bez tytułu', b.supertitle || '', b.subtitle || '',
      b.lead || '', b.content || '', b.authorId || req.user.id, b.authorName || req.user.fullName || '',
      b.coauthorId || '', b.coauthorName || '', b.sectionId || '', b.sectionName || '',
      b.featuredImage || '', JSON.stringify(b.additionalImages || []),
      b.featuredQuote || '', b.sources || '', b.editorialNote || '',
      b.status || 'idea', b.isAnonymous ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM gazette_articles WHERE id = ?').get(id);
    res.status(201).json(dbGazetteArticleToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia artykułu: ' + err.message });
  }
});

// PUT /api/gazette/articles/:id — update article
router.put('/articles/:id', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const existing = db.prepare('SELECT * FROM gazette_articles WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono artykułu.' });

    // Only author or editor_in_chief or admin can edit
    if (req.user.role !== 'admin' && !req.gazetteRoles.includes('editor_in_chief') && existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Możesz edytować tylko własne artykuły.' });
    }

    db.prepare(`
      UPDATE gazette_articles SET
        title = ?, supertitle = ?, subtitle = ?, lead = ?, content = ?,
        coauthor_id = ?, coauthor_name = ?, section_id = ?, section_name = ?,
        featured_image = ?, additional_images = ?, featured_quote = ?,
        sources = ?, editorial_note = ?, is_anonymous = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      b.title !== undefined ? b.title : existing.title,
      b.supertitle !== undefined ? b.supertitle : existing.supertitle,
      b.subtitle !== undefined ? b.subtitle : existing.subtitle,
      b.lead !== undefined ? b.lead : existing.lead,
      b.content !== undefined ? b.content : existing.content,
      b.coauthorId !== undefined ? b.coauthorId : existing.coauthor_id,
      b.coauthorName !== undefined ? b.coauthorName : existing.coauthor_name,
      b.sectionId !== undefined ? b.sectionId : existing.section_id,
      b.sectionName !== undefined ? b.sectionName : existing.section_name,
      b.featuredImage !== undefined ? b.featuredImage : existing.featured_image,
      b.additionalImages ? JSON.stringify(b.additionalImages) : existing.additional_images,
      b.featuredQuote !== undefined ? b.featuredQuote : existing.featured_quote,
      b.sources !== undefined ? b.sources : existing.sources,
      b.editorialNote !== undefined ? b.editorialNote : existing.editorial_note,
      b.isAnonymous !== undefined ? (b.isAnonymous ? 1 : 0) : existing.is_anonymous,
      id
    );

    const updated = db.prepare('SELECT * FROM gazette_articles WHERE id = ?').get(id);
    res.json(dbGazetteArticleToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd edycji artykułu: ' + err.message });
  }
});

// PATCH /api/gazette/articles/:id/status — change article workflow status
router.patch('/articles/:id/status', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const existing = db.prepare('SELECT * FROM gazette_articles WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono artykułu.' });

    const validStatuses = ['idea', 'draft', 'review', 'pending_approval', 'approved', 'in_issue', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status artykułu.' });
    }

    // Only editor_in_chief or admin can approve/reject
    const chiefOnly = ['approved', 'in_issue', 'published'];
    if (chiefOnly.includes(status) && req.user.role !== 'admin' && !req.gazetteRoles.includes('editor_in_chief')) {
      return res.status(403).json({ error: 'Tylko Redaktor Naczelny może zatwierdzić artykuł.' });
    }

    db.prepare('UPDATE gazette_articles SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);

    // Add editorial comment if provided
    if (comment) {
      db.prepare(`
        INSERT INTO gazette_comments (id, article_id, author_id, author_name, content, is_editorial)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(`comment-${uid()}`, id, req.user.id, req.user.fullName || '', comment);
    }

    const updated = db.prepare('SELECT * FROM gazette_articles WHERE id = ?').get(id);
    res.json(dbGazetteArticleToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd zmiany statusu: ' + err.message });
  }
});

// DELETE /api/gazette/articles/:id
router.delete('/articles/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    db.prepare('DELETE FROM gazette_articles WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania: ' + err.message });
  }
});

// GET /api/gazette/articles/:id/comments — get editorial comments
router.get('/articles/:id/comments', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM gazette_comments WHERE article_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);
    res.json(rows.map(r => ({
      id: r.id, articleId: r.article_id, authorId: r.author_id,
      authorName: r.author_name, content: r.content,
      isEditorial: Boolean(r.is_editorial), createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// POST /api/gazette/articles/:id/comments — add editorial comment
router.post('/articles/:id/comments', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const id = `comment-${uid()}`;
    db.prepare(`
      INSERT INTO gazette_comments (id, article_id, author_id, author_name, content, is_editorial)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, req.params.id, req.user.id, req.user.fullName || '', req.body.content || '');

    const created = db.prepare('SELECT * FROM gazette_comments WHERE id = ?').get(id);
    res.status(201).json({
      id: created.id, articleId: created.article_id, authorId: created.author_id,
      authorName: created.author_name, content: created.content,
      isEditorial: true, createdAt: created.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== PAGES =====================

// GET /api/gazette/pages/:issueId — list pages for issue
router.get('/pages/:issueId', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM gazette_pages WHERE issue_id = ? ORDER BY sort_order ASC'
    ).all(req.params.issueId);
    res.json(rows.map(dbGazettePageToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// POST /api/gazette/pages — create page
router.post('/pages', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `page-${uid()}`;

    // Auto-calculate sort_order
    const maxSort = db.prepare(
      'SELECT MAX(sort_order) as max FROM gazette_pages WHERE issue_id = ?'
    ).get(b.issueId);
    const sortOrder = b.sortOrder !== undefined ? b.sortOrder : (maxSort?.max || 0) + 1;

    db.prepare(`
      INSERT INTO gazette_pages (id, issue_id, page_number, template, content, background_image, background_color, article_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, b.issueId, b.pageNumber || sortOrder, b.template || 'article-single',
      JSON.stringify(b.content || {}), b.backgroundImage || '', b.backgroundColor || '',
      b.articleId || '', sortOrder
    );

    const created = db.prepare('SELECT * FROM gazette_pages WHERE id = ?').get(id);
    res.status(201).json(dbGazettePageToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia strony: ' + err.message });
  }
});

// PUT /api/gazette/pages/:id — update page
router.put('/pages/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const existing = db.prepare('SELECT * FROM gazette_pages WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono strony.' });

    db.prepare(`
      UPDATE gazette_pages SET
        page_number = ?, template = ?, content = ?, background_image = ?,
        background_color = ?, article_id = ?, sort_order = ?
      WHERE id = ?
    `).run(
      b.pageNumber !== undefined ? b.pageNumber : existing.page_number,
      b.template !== undefined ? b.template : existing.template,
      b.content ? JSON.stringify(b.content) : existing.content,
      b.backgroundImage !== undefined ? b.backgroundImage : existing.background_image,
      b.backgroundColor !== undefined ? b.backgroundColor : existing.background_color,
      b.articleId !== undefined ? b.articleId : existing.article_id,
      b.sortOrder !== undefined ? b.sortOrder : existing.sort_order,
      id
    );

    const updated = db.prepare('SELECT * FROM gazette_pages WHERE id = ?').get(id);
    res.json(dbGazettePageToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd edycji strony: ' + err.message });
  }
});

// DELETE /api/gazette/pages/:id
router.delete('/pages/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    db.prepare('DELETE FROM gazette_pages WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania: ' + err.message });
  }
});

// PATCH /api/gazette/pages/reorder — reorder pages
router.patch('/pages/reorder', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const { pages } = req.body; // [{id, sortOrder, pageNumber}]
    if (!Array.isArray(pages)) return res.status(400).json({ error: 'Wymagana tablica stron.' });

    const updateStmt = db.prepare(
      'UPDATE gazette_pages SET sort_order = ?, page_number = ? WHERE id = ?'
    );

    const transaction = db.transaction(() => {
      for (const p of pages) {
        updateStmt.run(p.sortOrder, p.pageNumber, p.id);
      }
    });
    transaction();

    res.json({ ok: true, count: pages.length });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zmiany kolejności: ' + err.message });
  }
});

// ===================== STAFF =====================

// GET /api/gazette/staff — list all staff
router.get('/staff', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT gs.*, u.full_name, u.avatar, u.role as site_role
      FROM gazette_staff gs
      LEFT JOIN users u ON gs.user_id = u.id
      ORDER BY
        CASE gs.gazette_role
          WHEN 'editor_in_chief' THEN 1
          WHEN 'editor' THEN 2
          WHEN 'photographer' THEN 3
          WHEN 'illustrator' THEN 4
          WHEN 'proofreader' THEN 5
          ELSE 6
        END
    `).all();

    res.json(rows.map(r => ({
      ...dbGazetteStaffToFrontend(r),
      fullName: r.full_name || '',
      avatar: r.avatar || '',
      siteRole: r.site_role || ''
    })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// POST /api/gazette/staff — add staff member
router.post('/staff', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `staff-${uid()}`;

    // Check if user already has this role
    const existing = db.prepare(
      'SELECT id FROM gazette_staff WHERE user_id = ? AND gazette_role = ? AND is_permanent = 1'
    ).get(b.userId, b.gazetteRole);
    if (existing) return res.status(400).json({ error: 'Użytkownik już posiada tę rolę w redakcji.' });

    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(b.userId);

    db.prepare(`
      INSERT INTO gazette_staff (id, user_id, user_name, gazette_role, issue_id, is_permanent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, b.userId, user?.full_name || b.userName || '', b.gazetteRole || 'editor', b.issueId || '', b.isPermanent !== false ? 1 : 0);

    const created = db.prepare('SELECT * FROM gazette_staff WHERE id = ?').get(id);
    res.status(201).json(dbGazetteStaffToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// DELETE /api/gazette/staff/:id
router.delete('/staff/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    db.prepare('DELETE FROM gazette_staff WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== SECTIONS MANAGEMENT =====================

// POST /api/gazette/sections — create section (admin/editor_in_chief)
router.post('/sections', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `sec-${b.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || uid()}`;

    const maxSort = db.prepare('SELECT MAX(sort_order) as max FROM gazette_sections').get();
    db.prepare(`
      INSERT INTO gazette_sections (id, name, icon, sort_order, editor_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, b.name || '', b.icon || '📰', (maxSort?.max || 0) + 1, b.editorId || '');

    const created = db.prepare('SELECT * FROM gazette_sections WHERE id = ?').get(id);
    res.status(201).json(dbGazetteSectionToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// PUT /api/gazette/sections/:id
router.put('/sections/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE gazette_sections SET name = COALESCE(?, name), icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order), editor_id = COALESCE(?, editor_id),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(b.name || null, b.icon || null, b.sortOrder ?? null, b.editorId || null,
      b.isActive !== undefined ? (b.isActive ? 1 : 0) : null, req.params.id);

    const updated = db.prepare('SELECT * FROM gazette_sections WHERE id = ?').get(req.params.id);
    res.json(dbGazetteSectionToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// DELETE /api/gazette/sections/:id
router.delete('/sections/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    db.prepare('DELETE FROM gazette_sections WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== QUIZZES =====================

// POST /api/gazette/quizzes
router.post('/quizzes', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `quiz-${uid()}`;
    db.prepare(`
      INSERT INTO gazette_quizzes (id, page_id, issue_id, title, questions, results_messages)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, b.pageId || '', b.issueId || '', b.title || 'Quiz',
      JSON.stringify(b.questions || []), JSON.stringify(b.resultsMessages || []));

    res.status(201).json({ id, title: b.title || 'Quiz' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// PUT /api/gazette/quizzes/:id
router.put('/quizzes/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE gazette_quizzes SET title = ?, questions = ?, results_messages = ?, page_id = ?
      WHERE id = ?
    `).run(b.title || 'Quiz', JSON.stringify(b.questions || []),
      JSON.stringify(b.resultsMessages || []), b.pageId || '', req.params.id);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== CROSSWORDS =====================

// POST /api/gazette/crosswords
router.post('/crosswords', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `cw-${uid()}`;
    db.prepare(`
      INSERT INTO gazette_crosswords (id, page_id, issue_id, title, words, grid_width, grid_height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, b.pageId || '', b.issueId || '', b.title || 'Krzyżówka',
      JSON.stringify(b.words || []), b.gridWidth || 10, b.gridHeight || 10);

    res.status(201).json({ id, title: b.title || 'Krzyżówka' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// PUT /api/gazette/crosswords/:id
router.put('/crosswords/:id', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE gazette_crosswords SET title = ?, words = ?, grid_width = ?, grid_height = ?, page_id = ?
      WHERE id = ?
    `).run(b.title || 'Krzyżówka', JSON.stringify(b.words || []),
      b.gridWidth || 10, b.gridHeight || 10, b.pageId || '', req.params.id);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== SUBMISSIONS (from students) =====================

// POST /api/gazette/submissions — student submits content
router.post('/submissions', requireAuth, (req, res) => {
  try {
    const b = req.body;
    const id = `sub-${uid()}`;
    db.prepare(`
      INSERT INTO gazette_submissions (id, user_id, user_name, type, title, content, attachments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, req.user.id, req.user.fullName || '', b.type || 'article',
      b.title || '', b.content || '', JSON.stringify(b.attachments || []));

    res.status(201).json({ id, message: 'Zgłoszenie wysłane do redakcji!' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// GET /api/gazette/submissions — list submissions (editorial)
router.get('/submissions', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM gazette_submissions ORDER BY created_at DESC').all();
    res.json(rows.map(dbGazetteSubmissionToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// PATCH /api/gazette/submissions/:id — review submission
router.patch('/submissions/:id', requireAuth, requireGazetteRole(), (req, res) => {
  try {
    const { status, reviewerNote } = req.body;
    db.prepare(`
      UPDATE gazette_submissions SET status = ?, reviewer_id = ?, reviewer_note = ?
      WHERE id = ?
    `).run(status || 'pending', req.user.id, reviewerNote || '', req.params.id);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== SECRETS (Easter Eggs) =====================

// POST /api/gazette/secrets
router.post('/secrets', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const b = req.body;
    const id = `secret-${uid()}`;
    db.prepare(`
      INSERT INTO gazette_secrets (id, page_id, issue_id, trigger_type, trigger_target, secret_content, secret_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, b.pageId || '', b.issueId || '', b.triggerType || 'click',
      b.triggerTarget || '', b.secretContent || '', b.secretType || 'message');

    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// ===================== ANALYTICS =====================

// POST /api/gazette/analytics — log user action
router.post('/analytics', (req, res) => {
  try {
    const b = req.body;
    const userId = req.headers['x-user-id'] || '';
    db.prepare(`
      INSERT INTO gazette_analytics (id, issue_id, user_id, action, page_number)
      VALUES (?, ?, ?, ?, ?)
    `).run(`an-${uid()}`, b.issueId || '', userId, b.action || 'view', b.pageNumber || 0);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

// GET /api/gazette/analytics/:issueId — get analytics for issue
router.get('/analytics/:issueId', requireAuth, requireGazetteRole('editor_in_chief'), (req, res) => {
  try {
    const views = db.prepare(
      "SELECT COUNT(*) as count FROM gazette_analytics WHERE issue_id = ? AND action = 'view'"
    ).get(req.params.issueId);

    const pageViews = db.prepare(
      `SELECT page_number, COUNT(*) as count FROM gazette_analytics
       WHERE issue_id = ? AND action = 'page_view' GROUP BY page_number ORDER BY page_number`
    ).all(req.params.issueId);

    const completions = db.prepare(
      "SELECT COUNT(*) as count FROM gazette_analytics WHERE issue_id = ? AND action = 'complete'"
    ).get(req.params.issueId);

    res.json({
      totalViews: views?.count || 0,
      completions: completions?.count || 0,
      pageViews: pageViews.map(p => ({ page: p.page_number, views: p.count }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd: ' + err.message });
  }
});

export default router;
