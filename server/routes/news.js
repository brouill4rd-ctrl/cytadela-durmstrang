import { Router } from 'express';
import db, { dbNewsToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/news — publiczny
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM news ORDER BY pinned DESC, date DESC').all();
  res.json(rows.map(dbNewsToFrontend));
});

// POST /api/news — create new article (admin lub profesor)
router.post('/', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  const data = req.body;
  const newsId = data.id || `news-${Date.now()}`;

  db.prepare(`
    INSERT INTO news (id, title, summary, content, author, author_role, category, pinned, date, reactions, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newsId, data.title, data.summary || '', data.content || '',
    data.author || req.user.fullName, data.authorRole || req.user.role,
    data.category || 'edykty', data.pinned ? 1 : 0,
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

  // Profesor może edytować tylko własne newsy
  if (req.user.role === 'professor' && existing.author !== req.user.fullName) {
    return res.status(403).json({ error: 'Profesorowie mogą edytować tylko własne komunikaty.' });
  }

  db.prepare(`
    UPDATE news SET title = ?, summary = ?, content = ?, author = ?, author_role = ?, category = ?, pinned = ?, reactions = ?, comments = ?
    WHERE id = ?
  `).run(
    data.title ?? existing.title,
    data.summary ?? existing.summary,
    data.content ?? existing.content,
    data.author ?? existing.author,
    data.authorRole ?? existing.author_role,
    data.category ?? existing.category,
    data.pinned !== undefined ? (data.pinned ? 1 : 0) : existing.pinned,
    data.reactions ? JSON.stringify(data.reactions) : existing.reactions,
    data.comments ? JSON.stringify(data.comments) : existing.comments,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  res.json(dbNewsToFrontend(row));
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
    INSERT OR IGNORE INTO news (id, title, summary, content, author, author_role, category, pinned, date, reactions, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(
        item.id, item.title, item.summary || '', item.content || '',
        item.author || '', item.authorRole || 'admin',
        item.category || 'edykty', item.pinned ? 1 : 0,
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
