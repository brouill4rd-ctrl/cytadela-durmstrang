import { Router } from 'express';
import db, { dbDocumentToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/documents — List all documents with optional filtering
router.get('/', (req, res) => {
  try {
    const { category, search, officialOnly } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND (LOWER(category) = LOWER(?) OR LOWER(slug) LIKE LOWER(?))';
      params.push(category, `%${category}%`);
    }

    if (officialOnly === 'true' || officialOnly === '1') {
      query += ' AND is_official = 1';
    }

    if (search) {
      query += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(summary) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?))';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY is_pinned DESC, rowid DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbDocumentToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania dokumentów: ' + err.message });
  }
});

// GET /api/documents/:slugOrId — Get single document
router.get('/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    const row = db.prepare('SELECT * FROM documents WHERE id = ? OR slug = ?').get(slugOrId, slugOrId);
    if (!row) {
      return res.status(404).json({ error: 'Nie znaleziono dokumentu o podanym identyfikatorze/slug.' });
    }
    res.json(dbDocumentToFrontend(row));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania dokumentu: ' + err.message });
  }
});

// POST /api/documents — Create new document (Admin only)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const doc = req.body;
    if (!doc.title || !doc.title.trim()) {
      return res.status(400).json({ error: 'Tytuł dokumentu jest wymagany.' });
    }

    const baseSlug = (doc.slug || doc.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `doc-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (db.prepare('SELECT id FROM documents WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const contentStr = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content || []);
    const tagsStr = Array.isArray(doc.tags) ? JSON.stringify(doc.tags) : JSON.stringify([]);

    db.prepare(`
      INSERT INTO documents (
        id, slug, category, category_label, number, title, subtitle, author, author_role,
        date, seal_type, icon_name, severity, summary, content, tags, is_official, is_pinned,
        cover_image, rune, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      slug,
      doc.category || 'custom',
      doc.categoryLabel || doc.category || 'Dokument',
      doc.number || '',
      doc.title.trim(),
      doc.subtitle || '',
      doc.author || req.user.fullName || 'Dyrekcja Cytadeli',
      doc.authorRole || 'Dyrekcja Cytadeli',
      doc.date || new Date().toISOString().split('T')[0],
      doc.sealType || 'gold',
      doc.iconName || 'ShieldAlert',
      doc.severity || 'normalny',
      doc.summary || '',
      contentStr,
      tagsStr,
      doc.isOfficial !== undefined ? (doc.isOfficial ? 1 : 0) : 1,
      doc.isPinned ? 1 : 0,
      doc.coverImage || '',
      doc.rune || 'ᛟ'
    );

    const created = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json(dbDocumentToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia dokumentu: ' + err.message });
  }
});

// PUT /api/documents/:id — Update existing document (Admin only)
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM documents WHERE id = ? OR slug = ?').get(id, id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono dokumentu do edycji.' });
    }

    const doc = req.body;
    const targetId = existing.id;
    const contentStr = doc.content !== undefined
      ? (typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content))
      : existing.content;
    const tagsStr = doc.tags !== undefined ? JSON.stringify(doc.tags) : existing.tags;

    db.prepare(`
      UPDATE documents
      SET slug = ?, category = ?, category_label = ?, number = ?, title = ?, subtitle = ?,
          author = ?, author_role = ?, date = ?, seal_type = ?, icon_name = ?, severity = ?,
          summary = ?, content = ?, tags = ?, is_official = ?, is_pinned = ?, cover_image = ?,
          rune = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      doc.slug || existing.slug,
      doc.category || existing.category,
      doc.categoryLabel !== undefined ? doc.categoryLabel : existing.category_label,
      doc.number !== undefined ? doc.number : existing.number,
      doc.title !== undefined ? doc.title.trim() : existing.title,
      doc.subtitle !== undefined ? doc.subtitle : existing.subtitle,
      doc.author !== undefined ? doc.author : existing.author,
      doc.authorRole !== undefined ? doc.authorRole : existing.author_role,
      doc.date !== undefined ? doc.date : existing.date,
      doc.sealType !== undefined ? doc.sealType : existing.seal_type,
      doc.iconName !== undefined ? doc.iconName : existing.icon_name,
      doc.severity !== undefined ? doc.severity : existing.severity,
      doc.summary !== undefined ? doc.summary : existing.summary,
      contentStr,
      tagsStr,
      doc.isOfficial !== undefined ? (doc.isOfficial ? 1 : 0) : existing.is_official,
      doc.isPinned !== undefined ? (doc.isPinned ? 1 : 0) : existing.is_pinned,
      doc.coverImage !== undefined ? doc.coverImage : existing.cover_image,
      doc.rune !== undefined ? doc.rune : existing.rune,
      targetId
    );

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(targetId);
    res.json(dbDocumentToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji dokumentu: ' + err.message });
  }
});

// DELETE /api/documents/:id — Delete document (Admin only)
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM documents WHERE id = ? OR slug = ?').run(id, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Nie znaleziono dokumentu do usunięcia.' });
    }
    res.json({ ok: true, message: 'Dokument został pomyślnie wymazany z archiwum.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania dokumentu: ' + err.message });
  }
});

export default router;
