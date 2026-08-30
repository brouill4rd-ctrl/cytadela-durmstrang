import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { dbLocationToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { credit as skirnirCredit } from '../services/skirnirService.js';
import { awardPoints } from '../services/pointsService.js';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWarsawDateKey() {
  return new Date().toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).split('.').reverse().join('-');
}

function checkTimeAvailability(loc) {
  const now = Date.now();
  if (loc.available_from) {
    const from = new Date(loc.available_from).getTime();
    if (now < from) return false;
  }
  if (loc.available_until) {
    const until = new Date(loc.available_until).getTime();
    if (now > until) return false;
  }
  return true;
}

function computeUserState(loc, userId) {
  if (loc.state === 'locked') {
    // Lokacja zablokowana — sprawdź warunki odblokowania
    if (!checkUnlockCondition(loc.unlock_condition, userId)) return 'locked';
    // Warunek spełniony — lokacja odblokowana przez adepta, traktujemy jako available
  }
  if (!checkTimeAvailability(loc)) return 'time_locked';

  // Sprawdź czy odkryta
  const disc = db.prepare('SELECT 1 FROM user_map_discoveries WHERE user_id = ? AND location_id = ?').get(userId, loc.id);
  if (disc) return 'discovered';

  // Ukryta i nieodkryta — ukrywamy szczegóły
  if (loc.visibility === 'hidden') return 'undiscovered';

  return 'available';
}

function checkUnlockCondition(conditionJson, userId) {
  if (!conditionJson || conditionJson === '' || conditionJson === '{}') return false;
  let cond;
  try { cond = typeof conditionJson === 'string' ? JSON.parse(conditionJson) : conditionJson; } catch { return false; }
  if (!cond || typeof cond !== 'object' || Object.keys(cond).length === 0) return false;

  // Operatory logiczne
  if (cond.all) return cond.all.every(c => checkUnlockCondition(JSON.stringify(c), userId));
  if (cond.any) return cond.any.some(c => checkUnlockCondition(JSON.stringify(c), userId));

  // Typy warunków
  if (cond.type === 'quest') {
    const done = db.prepare('SELECT 1 FROM completed_quests WHERE user_id = ? AND quest_id = ?').get(userId, cond.id);
    return Boolean(done);
  }
  if (cond.type === 'quest_completed') {
    // Nowy silnik questów
    const done = db.prepare("SELECT 1 FROM user_quest_progress WHERE user_id = ? AND quest_id = ? AND status = 'completed'").get(userId, cond.id);
    return Boolean(done);
  }
  if (cond.type === 'discovery') {
    const done = db.prepare('SELECT 1 FROM user_map_discoveries WHERE user_id = ? AND location_id = ?').get(userId, cond.id);
    return Boolean(done);
  }
  if (cond.type === 'level') {
    const user = db.prepare('SELECT level FROM users WHERE id = ?').get(userId);
    return user && user.level >= (cond.value || 1);
  }
  if (cond.type === 'order') {
    const user = db.prepare('SELECT house FROM users WHERE id = ?').get(userId);
    return user && user.house === cond.value;
  }
  if (cond.type === 'item_owned') {
    const user = db.prepare('SELECT inventory FROM users WHERE id = ?').get(userId);
    if (!user) return false;
    let inv = [];
    try { inv = JSON.parse(user.inventory || '[]'); } catch (_) {}
    return inv.some(i => i.id === cond.id || i.name === cond.name);
  }
  // Nieznany typ — bezpieczna odmowa
  return false;
}

// ─── GET /api/map/layers ────────────────────────────────────────────────────

router.get('/layers', (req, res) => {
  try {
    const layers = db.prepare('SELECT * FROM map_layers WHERE is_active = 1 ORDER BY sort_order ASC').all();
    res.json(layers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/map/:layerId/state ────────────────────────────────────────────
// Główny endpoint — zwraca stan całej mapy dla zalogowanego użytkownika

router.get('/:layerId/state', requireAuth, (req, res) => {
  try {
    const { layerId } = req.params;
    const userId = req.user.id;

    const layer = db.prepare('SELECT * FROM map_layers WHERE id = ? AND is_active = 1').get(layerId);
    if (!layer) return res.status(404).json({ error: 'Mapa nie istnieje' });

    const rawLocs = db.prepare(`
      SELECT * FROM locations WHERE layer_id = ? ORDER BY sort_order ASC
    `).all(layerId);

    // Sprawdź odkrycia usera
    const discSet = new Set(
      db.prepare('SELECT location_id FROM user_map_discoveries WHERE user_id = ?')
        .all(userId).map(r => r.location_id)
    );

    // Śledzony quest i lokacja
    const tracking = db.prepare('SELECT location_id, quest_id FROM user_map_tracking WHERE user_id = ?').get(userId);

    const markers = rawLocs.map(loc => {
      const userState = computeUserState(loc, userId);
      const isDiscovered = discSet.has(loc.id);

      // Nie zwracaj szczegółów ukrytych nieodkrytych lokacji
      if (userState === 'undiscovered') {
        return {
          id: loc.id, x: loc.x, y: loc.y, floor: loc.floor,
          layerId: loc.layer_id, markerType: loc.marker_type,
          visibility: loc.visibility, userState,
        };
      }

      const base = dbLocationToFrontend(loc);
      return {
        ...base,
        userState,
        isDiscovered,
        isTracked: tracking?.location_id === loc.id,
      };
    });

    // Licznik odkryć: liczy tylko lokacje visible i discovered, nie przekracza totalDiscoverable
    const visibleDiscovered = markers.filter(m => m.isDiscovered && m.visibility !== 'hidden').length;
    const totalDiscoverable = rawLocs.filter(l => l.visibility !== 'hidden').length;
    const discoveredCount = Math.min(visibleDiscovered, totalDiscoverable);

    res.json({
      layer,
      markers,
      trackedLocationId: tracking?.location_id || null,
      trackedQuestId: tracking?.quest_id || null,
      discoveredCount,
      totalDiscoverable,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/map/discover ─────────────────────────────────────────────────

router.post('/discover', requireAuth, (req, res) => {
  try {
    const { locationId } = req.body;
    if (!locationId) return res.status(400).json({ error: 'Brak locationId' });

    const userId = req.user.id;
    const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(locationId);
    if (!loc) return res.status(404).json({ error: 'Lokacja nie istnieje' });

    // Ukryta/zablokowana lokacja nie może być odkryta ręcznie przed spełnieniem warunków
    if (loc.state === 'locked' && !checkUnlockCondition(loc.unlock_condition, userId)) {
      return res.status(403).json({ error: 'Warunki odblokowania lokacji nie są spełnione.' });
    }
    if (loc.visibility === 'hidden') {
      // Ukryta lokacja: dodatkowe sprawdzenie warunku odblokowania
      if (!loc.unlock_condition || !checkUnlockCondition(loc.unlock_condition, userId)) {
        return res.status(403).json({ error: 'Ta lokacja jest jeszcze ukryta.' });
      }
    }
    if (!checkTimeAvailability(loc)) {
      return res.status(403).json({ error: 'Lokacja tymczasowo niedostępna' });
    }

    // Sprawdź czy już odkryta
    const existing = db.prepare('SELECT 1 FROM user_map_discoveries WHERE user_id = ? AND location_id = ?').get(userId, locationId);
    if (existing) {
      return res.json({ alreadyDiscovered: true, locationId });
    }

    // Zapisz odkrycie
    db.prepare('INSERT INTO user_map_discoveries (id, user_id, location_id) VALUES (?, ?, ?)').run(uuidv4(), userId, locationId);

    // Nagrody za odkrycie
    const rewards = { xp: 0, skirniry: 0 };
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (loc.discovery_reward_xp > 0) {
      const pts = Math.ceil(loc.discovery_reward_xp / 10);
      if (pts > 0) awardPoints({ studentId: userId, studentName: user?.full_name || '', house: user?.house || '', points: pts, source: `Odkrycie: ${loc.name}`, sourceType: 'discovery', actorId: userId, actorName: 'System' });
      rewards.xp = loc.discovery_reward_xp;
    }
    if (loc.discovery_reward_skirniry > 0) {
      skirnirCredit({ userId, userName: user?.full_name || '', amount: loc.discovery_reward_skirniry, category: 'eksploracja', title: `Odkrycie lokacji: ${loc.name}`, idempotencyKey: `disc-${locationId}-${userId}` });
      rewards.skirniry = loc.discovery_reward_skirniry;
    }

    res.json({ discovered: true, locationId, locationName: loc.name, rewards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/map/track ────────────────────────────────────────────────────

router.post('/track', requireAuth, (req, res) => {
  try {
    const { locationId } = req.body;
    const userId = req.user.id;

    if (!locationId) {
      db.prepare('DELETE FROM user_map_tracking WHERE user_id = ?').run(userId);
      return res.json({ tracked: null });
    }

    const loc = db.prepare('SELECT id, name, state, visibility, unlock_condition FROM locations WHERE id = ?').get(locationId);
    if (!loc) return res.status(404).json({ error: 'Lokacja nie istnieje' });

    // Nie pozwól śledzić zablokowanych lokacji
    const locState = computeUserState(loc, userId);
    if (locState === 'locked') {
      return res.status(403).json({ error: 'Nie można śledzić zablokowanej lokacji.' });
    }

    db.prepare(`
      INSERT INTO user_map_tracking (user_id, location_id, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET location_id = excluded.location_id, updated_at = excluded.updated_at
    `).run(userId, locationId);

    res.json({ tracked: locationId, locationName: loc.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/map/track ──────────────────────────────────────────────────

router.delete('/track', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM user_map_tracking WHERE user_id = ?').run(req.user.id);
    res.json({ tracked: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: GET /api/map/admin/markers ──────────────────────────────────────

router.get('/admin/markers', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { layerId } = req.query;
    const query = layerId
      ? db.prepare('SELECT * FROM locations WHERE layer_id = ? ORDER BY sort_order ASC')
      : db.prepare('SELECT * FROM locations ORDER BY layer_id ASC, sort_order ASC');
    const rows = layerId ? query.all(layerId) : query.all();
    res.json(rows.map(r => dbLocationToFrontend(r)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: POST /api/map/admin/markers ─────────────────────────────────────

router.post('/admin/markers', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const {
      id, name, nordic_name, floor, x, y, icon, house, type, region,
      short_desc, full_lore, layer_id, marker_type, visibility, state,
      unlock_condition, linked_activity_type, linked_activity_id,
      available_from, available_until, discovery_reward_xp,
      discovery_reward_skirniry, min_level, required_order, description_short,
      sort_order,
    } = req.body;

    if (!name || !layer_id) return res.status(400).json({ error: 'Brak wymaganych pól (name, layer_id)' });

    const markerId = id || `loc-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO locations (
        id, name, nordic_name, floor, x, y, icon, house, type, region,
        short_desc, full_lore, npcs, actions, secret_clue, quests, sort_order,
        layer_id, marker_type, visibility, state, unlock_condition,
        linked_activity_type, linked_activity_id, available_from, available_until,
        discovery_reward_xp, discovery_reward_skirniry, min_level, required_order,
        description_short
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      markerId, name, nordic_name || '', floor || 0, x || 50, y || 50,
      icon || '📍', house || null, type || 'location', region || '',
      short_desc || '', full_lore || '', '[]', '[]', '', '[]', sort_order || 0,
      layer_id, marker_type || 'location', visibility || 'visible', state || 'available',
      unlock_condition || '', linked_activity_type || '', linked_activity_id || '',
      available_from || '', available_until || '', discovery_reward_xp || 0,
      discovery_reward_skirniry || 0, min_level || 0, required_order || '',
      description_short || ''
    );

    const created = dbLocationToFrontend(db.prepare('SELECT * FROM locations WHERE id = ?').get(markerId));
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: PUT /api/map/admin/markers/:id ──────────────────────────────────

router.put('/admin/markers/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM locations WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Marker nie istnieje' });

    const allowed = [
      'name', 'nordic_name', 'floor', 'x', 'y', 'icon', 'house', 'type', 'region',
      'short_desc', 'full_lore', 'secret_clue', 'layer_id', 'marker_type',
      'visibility', 'state', 'unlock_condition', 'linked_activity_type',
      'linked_activity_id', 'available_from', 'available_until',
      'discovery_reward_xp', 'discovery_reward_skirniry', 'min_level',
      'required_order', 'description_short', 'sort_order',
    ];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (updates.length === 0) return res.status(400).json({ error: 'Brak pól do aktualizacji' });

    const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
    const values = updates.map(([, v]) => v);
    db.prepare(`UPDATE locations SET ${setClauses} WHERE id = ?`).run(...values, id);

    res.json(dbLocationToFrontend(db.prepare('SELECT * FROM locations WHERE id = ?').get(id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: DELETE /api/map/admin/markers/:id ───────────────────────────────

router.delete('/admin/markers/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Marker nie istnieje' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: GET/POST/PUT/DELETE layers ──────────────────────────────────────

router.get('/admin/layers', requireAuth, requireRole('admin'), (req, res) => {
  const layers = db.prepare('SELECT * FROM map_layers ORDER BY sort_order ASC').all();
  res.json(layers);
});

router.post('/admin/layers', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { name, slug, parent_id, image_path, default_zoom, sort_order } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Brak name lub slug' });
    const id = slug;
    db.prepare(`INSERT INTO map_layers (id, name, slug, parent_id, image_path, default_zoom, sort_order) VALUES (?,?,?,?,?,?,?)`)
      .run(id, name, slug, parent_id || null, image_path || '', default_zoom || 0.7, sort_order || 0);
    res.status(201).json(db.prepare('SELECT * FROM map_layers WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/layers/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { name, image_path, default_zoom, sort_order, is_active } = req.body;
    db.prepare(`UPDATE map_layers SET name=COALESCE(?,name), image_path=COALESCE(?,image_path), default_zoom=COALESCE(?,default_zoom), sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active) WHERE id=?`)
      .run(name, image_path, default_zoom, sort_order, is_active, req.params.id);
    res.json(db.prepare('SELECT * FROM map_layers WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
