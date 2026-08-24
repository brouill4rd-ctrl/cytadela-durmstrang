import { Router } from 'express';
import db, { dbCmsBannerToFrontend, dbCmsBlockGraphicToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ===================== CMS BANNERS =====================

// GET /api/cms/banners — List all category banners
router.get('/banners', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cms_banners ORDER BY rowid ASC').all();
    res.json(rows.map(dbCmsBannerToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania banerów CMS: ' + err.message });
  }
});

// POST /api/cms/banners — Create new category banner (Admin only)
router.post('/banners', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const b = req.body;
    if (!b.categoryName || !b.categoryName.trim()) {
      return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
    }

    const slug = b.id || b.categoryName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    db.prepare(`
      INSERT INTO cms_banners (id, category_name, default_script, theme_color, description, bg_gradient, bg_type, bg_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        category_name = excluded.category_name,
        default_script = excluded.default_script,
        theme_color = excluded.theme_color,
        description = excluded.description,
        bg_gradient = excluded.bg_gradient,
        bg_type = excluded.bg_type,
        bg_image = excluded.bg_image,
        updated_at = datetime('now')
    `).run(
      slug,
      b.categoryName.trim(),
      b.defaultScript || b.categoryName.toLowerCase().trim(),
      b.themeColor || 'var(--gold-ancient)',
      b.description || '',
      b.bgGradient || 'radial-gradient(circle at 50% 60%, rgba(38, 28, 12, 0.95) 0%, rgba(6, 6, 8, 0.98) 100%)',
      b.bgType || 'citadel',
      b.bgImage || ''
    );

    const created = db.prepare('SELECT * FROM cms_banners WHERE id = ?').get(slug);
    res.status(201).json(dbCmsBannerToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu banera CMS: ' + err.message });
  }
});

// PUT /api/cms/banners/:id — Update banner (Admin only)
router.put('/banners/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;
    const existing = db.prepare('SELECT * FROM cms_banners WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono banera kategorii.' });
    }

    db.prepare(`
      UPDATE cms_banners
      SET category_name = ?, default_script = ?, theme_color = ?, description = ?,
          bg_gradient = ?, bg_type = ?, bg_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      patch.categoryName !== undefined ? patch.categoryName : existing.category_name,
      patch.defaultScript !== undefined ? patch.defaultScript : existing.default_script,
      patch.themeColor !== undefined ? patch.themeColor : existing.theme_color,
      patch.description !== undefined ? patch.description : existing.description,
      patch.bgGradient !== undefined ? patch.bgGradient : existing.bg_gradient,
      patch.bgType !== undefined ? patch.bgType : existing.bg_type,
      patch.bgImage !== undefined ? patch.bgImage : existing.bg_image,
      id
    );

    const updated = db.prepare('SELECT * FROM cms_banners WHERE id = ?').get(id);
    res.json(dbCmsBannerToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji banera: ' + err.message });
  }
});

// DELETE /api/cms/banners/:id — Delete banner (Admin only)
router.delete('/banners/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM cms_banners WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Baner kategorii usunięty.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania banera: ' + err.message });
  }
});

// ===================== CMS BLOCK GRAPHICS =====================

// GET /api/cms/blocks — List all block graphics
router.get('/blocks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cms_block_graphics ORDER BY rowid ASC').all();
    res.json(rows.map(dbCmsBlockGraphicToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania grafik bloków: ' + err.message });
  }
});

// POST /api/cms/blocks — Create or update block graphic (Admin only)
router.post('/blocks', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !b.title.trim()) {
      return res.status(400).json({ error: 'Tytuł bloku jest wymagany.' });
    }

    const slug = b.id || b.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    db.prepare(`
      INSERT INTO cms_block_graphics (id, title, location, rune, default_icon, color, bg_image, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        location = excluded.location,
        rune = excluded.rune,
        default_icon = excluded.default_icon,
        color = excluded.color,
        bg_image = excluded.bg_image,
        description = excluded.description,
        updated_at = datetime('now')
    `).run(
      slug,
      b.title.trim(),
      b.location || 'Panel Boczny',
      b.rune || 'ᛟ',
      b.defaultIcon || 'Shield',
      b.color || 'var(--gold-ancient)',
      b.bgImage || '',
      b.description || ''
    );

    const created = db.prepare('SELECT * FROM cms_block_graphics WHERE id = ?').get(slug);
    res.status(201).json(dbCmsBlockGraphicToFrontend(created));
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu grafiki bloku: ' + err.message });
  }
});

// PUT /api/cms/blocks/:id — Update block graphic (Admin only)
router.put('/blocks/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;
    const existing = db.prepare('SELECT * FROM cms_block_graphics WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Nie znaleziono bloku.' });
    }

    db.prepare(`
      UPDATE cms_block_graphics
      SET title = ?, location = ?, rune = ?, default_icon = ?, color = ?,
          bg_image = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      patch.title !== undefined ? patch.title : existing.title,
      patch.location !== undefined ? patch.location : existing.location,
      patch.rune !== undefined ? patch.rune : existing.rune,
      patch.defaultIcon !== undefined ? patch.defaultIcon : existing.default_icon,
      patch.color !== undefined ? patch.color : existing.color,
      patch.bgImage !== undefined ? patch.bgImage : existing.bg_image,
      patch.description !== undefined ? patch.description : existing.description,
      id
    );

    const updated = db.prepare('SELECT * FROM cms_block_graphics WHERE id = ?').get(id);
    res.json(dbCmsBlockGraphicToFrontend(updated));
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji bloku: ' + err.message });
  }
});

// DELETE /api/cms/blocks/:id — Delete block (Admin only)
router.delete('/blocks/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM cms_block_graphics WHERE id = ?').run(id);
    res.json({ ok: true, message: 'Grafika bloku usunięta.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania bloku: ' + err.message });
  }
});

export default router;
