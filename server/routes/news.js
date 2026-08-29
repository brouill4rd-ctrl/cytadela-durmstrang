import { Router } from 'express';
import db, { dbNewsToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

// GET /api/news — publiczny
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM news ORDER BY pinned DESC, date DESC').all();
  res.json(rows.map(dbNewsToFrontend));
});

// GET /api/news/authors — lista profesorów i adminów do wyboru autora
router.get('/authors', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, full_name, title, department_name, avatar, signature_png, role
      FROM users
      WHERE role IN ('admin', 'professor') AND status = 'active'
      ORDER BY role DESC, full_name ASC
    `).all();
    res.json(rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      title: r.title || '',
      departmentName: r.department_name || '',
      avatar: r.avatar || '',
      signaturePng: r.signature_png || '',
      role: r.role,
      displayLabel: `${r.full_name}${r.department_name ? ` (${r.department_name})` : r.title ? ` (${r.title})` : ''}`
    })));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania autorów: ' + err.message });
  }
});

// POST /api/news — create new article (admin lub profesor)
router.post('/', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const data = req.body;
  const newsId = data.id || `news-${Date.now()}`;

  const authorUser = db.prepare('SELECT full_name, title, department_name, signature_png, role FROM users WHERE id = ?').get(req.user.id);
  const defaultAuthorName = authorUser?.full_name || req.user.fullName;
  const defaultAuthorRole = authorUser?.department_name || authorUser?.title || (req.user.role === 'admin' ? 'Dyrekcja Cytadeli' : 'Profesor');
  const defaultSignature = authorUser?.signature_png || '';

  // Profesorowie nie mogą podpisywać się cudzym (adminskim) imieniem
  const isProfessor = req.user.role === 'professor';
  const finalAuthorName = isProfessor ? defaultAuthorName : (data.author || defaultAuthorName);
  const finalAuthorId = isProfessor ? req.user.id : (data.authorId || req.user.id);
  const finalAuthorRole = isProfessor ? defaultAuthorRole : (data.authorRole || defaultAuthorRole);
  const finalAuthorSignature = isProfessor ? defaultSignature : (data.authorSignature ?? defaultSignature);

  const readTime = data.readTime || estimateReadTime(data.content || data.summary || '');

  db.prepare(`
    INSERT INTO news (id, title, summary, content, author, author_id, author_role, author_signature,
      category, category_key, banner_custom_text, wax_seal, house, tags, read_time, subject_id, pinned, date, reactions, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newsId,
    data.title,
    data.summary || '',
    data.content || '',
    finalAuthorName,
    finalAuthorId,
    finalAuthorRole,
    finalAuthorSignature,
    data.category || 'Edykty Dyrekcji',
    data.categoryKey || data.category || 'edykty',
    data.bannerCustomText || '',
    data.waxSeal || 'gold',
    data.house || '',
    JSON.stringify(data.tags || []),
    readTime,
    data.subjectId || '',
    data.pinned ? 1 : 0,
    data.date || new Date().toISOString().split('T')[0],
    JSON.stringify(data.reactions || {}),
    JSON.stringify(data.comments || [])
  );

  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(newsId);
  res.status(201).json(dbNewsToFrontend(row));
});

// PUT /api/news/:id — update article (admin lub profesor - profesor tylko swoje)
router.put('/:id', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const data = req.body;
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'News not found' });

  if (req.user.role === 'professor' && existing.author_id && existing.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Profesorowie mogą edytować tylko własne komunikaty.' });
  }

  // Profesorowie nie mogą zmienić autora na inną osobę (np. dyrekcję)
  const isProfessorEdit = req.user.role === 'professor';

  const readTime = data.readTime || estimateReadTime(data.content ?? existing.content ?? '');

  db.prepare(`
    UPDATE news SET
      title = ?, summary = ?, content = ?,
      author = ?, author_id = ?, author_role = ?, author_signature = ?,
      category = ?, category_key = ?, banner_custom_text = ?, wax_seal = ?, house = ?,
      tags = ?, read_time = ?, subject_id = ?, pinned = ?, reactions = ?, comments = ?
    WHERE id = ?
  `).run(
    data.title ?? existing.title,
    data.summary ?? existing.summary,
    data.content ?? existing.content,
    isProfessorEdit ? existing.author : (data.author ?? existing.author),
    isProfessorEdit ? existing.author_id : (data.authorId ?? existing.author_id),
    isProfessorEdit ? existing.author_role : (data.authorRole ?? existing.author_role),
    isProfessorEdit ? existing.author_signature : (data.authorSignature ?? existing.author_signature),
    data.category ?? existing.category,
    data.categoryKey ?? existing.category_key,
    data.bannerCustomText ?? existing.banner_custom_text,
    data.waxSeal ?? existing.wax_seal,
    data.house ?? existing.house,
    data.tags ? JSON.stringify(data.tags) : existing.tags,
    readTime,
    data.subjectId ?? existing.subject_id ?? '',
    data.pinned !== undefined ? (data.pinned ? 1 : 0) : existing.pinned,
    data.reactions ? JSON.stringify(data.reactions) : existing.reactions,
    data.comments ? JSON.stringify(data.comments) : existing.comments,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json(dbNewsToFrontend(row));
});

// PATCH /api/news/:id/react — add reaction to news item (zalogowani)
router.patch('/:id/react', requireAuth, (req, res) => {
  const { reactionType } = req.body;
  if (!reactionType) return res.status(400).json({ error: 'Brak typu reakcji.' });

  const row = db.prepare('SELECT reactions FROM news WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'News nie istnieje.' });

  let reactions = {};
  try { reactions = JSON.parse(row.reactions || '{}'); } catch {}

  reactions[reactionType] = (reactions[reactionType] || 0) + 1;

  db.prepare('UPDATE news SET reactions = ? WHERE id = ?').run(JSON.stringify(reactions), req.params.id);

  res.json({ reactions });
});

// DELETE /api/news/:id — tylko admin
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/news/seed — seed initial news (tylko admin)
router.post('/seed', requireAuth, requireRole('admin'), (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });

  const count = db.prepare('SELECT COUNT(*) as c FROM news').get().c;
  if (count > 0) return res.json({ message: 'News already seeded', count });

  const insert = db.prepare(`
    INSERT OR IGNORE INTO news (id, title, summary, content, author, author_id, author_role, author_signature,
      category, category_key, banner_custom_text, wax_seal, house, tags, read_time, pinned, date, reactions, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(
        item.id, item.title, item.summary || '', item.content || '',
        item.author || '', item.authorId || '',
        item.authorRole || 'admin', item.authorSignature || '',
        item.category || 'Edykty Dyrekcji',
        item.categoryKey || item.category || 'edykty',
        item.bannerCustomText || '', item.waxSeal || 'gold',
        item.house || '',
        JSON.stringify(item.tags || []),
        estimateReadTime(item.content || item.summary || ''),
        item.pinned ? 1 : 0,
        item.date || new Date().toISOString().split('T')[0],
        JSON.stringify(item.reactions || {}),
        JSON.stringify(item.comments || [])
      );
    }
  });

  insertMany(items);
  res.json({ message: 'Seeded', count: items.length });
});

export default router;
