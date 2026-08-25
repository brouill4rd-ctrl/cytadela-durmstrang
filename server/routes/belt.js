import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_SLOTS = 5;
const STATIC_TARGETS = new Map([
  ['TIMETABLE', { roles: ['student', 'professor', 'admin'] }],
  ['RAVEN', { roles: ['student', 'professor', 'admin'] }],
  ['INVENTORY', { roles: ['student', 'professor', 'admin'] }],
  ['BANK', { roles: ['student', 'professor', 'admin'] }],
  ['MARKET', { roles: ['student', 'professor', 'admin'] }],
  ['MAP', { roles: ['student', 'professor', 'admin'] }],
  ['HOMEWORK', { roles: ['student', 'professor', 'admin'] }],
  ['EXAMS', { roles: ['student', 'professor', 'admin'] }],
  ['GAZETTE', { roles: ['student', 'professor', 'admin'] }],
  ['ACADEMIC', { roles: ['student', 'professor', 'admin'] }]
]);

function validateTarget(user, type, id = '') {
  if (type === 'SUBJECT') {
    if (!id) return { ok: false, status: 400, error: 'Wybierz istniejącą Katedrę.' };
    const subject = db.prepare('SELECT id, is_active FROM subjects WHERE id = ?').get(id);
    if (!subject) return { ok: false, status: 404, error: 'Taki znak nie istnieje w rejestrze Cytadeli.' };
    if (!subject.is_active) return { ok: false, status: 403, error: 'Ta Katedra jest obecnie niedostępna.' };
    return { ok: true };
  }
  const target = STATIC_TARGETS.get(type);
  if (!target) return { ok: false, status: 400, error: 'Nie można przypiąć niezarejestrowanego celu.' };
  if (!target.roles.includes(user.role)) return { ok: false, status: 403, error: 'Nie masz dostępu do tego miejsca.' };
  return { ok: true };
}

const list = userId => db.prepare(`
  SELECT slot, target_type AS targetType, target_id AS targetId, created_at AS createdAt
  FROM user_pinned_shortcuts WHERE user_id = ? ORDER BY slot
`).all(userId);

router.get('/', requireAuth, (req, res) => {
  const valid = list(req.user.id).filter(item => validateTarget(req.user, item.targetType, item.targetId).ok);
  res.json(valid);
});

router.post('/', requireAuth, (req, res) => {
  const targetType = String(req.body.targetType || '').toUpperCase();
  const targetId = String(req.body.targetId || '');
  const validation = validateTarget(req.user, targetType, targetId);
  if (!validation.ok) return res.status(validation.status).json({ error: validation.error });
  if (db.prepare('SELECT 1 FROM user_pinned_shortcuts WHERE user_id = ? AND target_type = ? AND target_id = ?').get(req.user.id, targetType, targetId)) {
    return res.status(409).json({ error: 'Ten znak jest już przypięty do Pasa.' });
  }
  const current = list(req.user.id);
  const requested = Number.isInteger(req.body.replaceSlot) ? req.body.replaceSlot : null;
  if (current.length >= MAX_SLOTS && (requested === null || requested < 0 || requested >= MAX_SLOTS)) {
    return res.status(409).json({ code: 'BELT_FULL', error: 'Przy pasie nie pozostało już wolne miejsce.', shortcuts: current });
  }
  const used = new Set(current.map(x => x.slot));
  const slot = requested ?? [0, 1, 2, 3, 4].find(x => !used.has(x));
  const write = db.transaction(() => {
    if (requested !== null) db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ? AND slot = ?').run(req.user.id, slot);
    db.prepare('INSERT INTO user_pinned_shortcuts (user_id, slot, target_type, target_id) VALUES (?, ?, ?, ?)').run(req.user.id, slot, targetType, targetId);
  });
  write();
  res.status(201).json(list(req.user.id));
});

router.put('/order', requireAuth, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const current = list(req.user.id);
  const keys = items.map(x => `${x.targetType}:${x.targetId || ''}`);
  const expected = current.map(x => `${x.targetType}:${x.targetId || ''}`);
  if (items.length !== current.length || new Set(keys).size !== items.length || expected.some(k => !keys.includes(k))) {
    return res.status(400).json({ error: 'Kolejność Pasa nie odpowiada przypiętym znakom.' });
  }
  db.transaction(() => {
    db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ?').run(req.user.id);
    const insert = db.prepare('INSERT INTO user_pinned_shortcuts (user_id, slot, target_type, target_id) VALUES (?, ?, ?, ?)');
    items.forEach((x, slot) => insert.run(req.user.id, slot, x.targetType, x.targetId || ''));
  })();
  res.json(list(req.user.id));
});

const removeTarget = (req, res) => {
  db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .run(req.user.id, String(req.params.targetType).toUpperCase(), req.params.targetId || '');
  const remaining = list(req.user.id);
  db.transaction(() => {
    db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ?').run(req.user.id);
    const insert = db.prepare('INSERT INTO user_pinned_shortcuts (user_id, slot, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)');
    remaining.forEach((x, slot) => insert.run(req.user.id, slot, x.targetType, x.targetId, x.createdAt));
  })();
  res.json(list(req.user.id));
};
router.delete('/:targetType', requireAuth, removeTarget);
router.delete('/:targetType/:targetId', requireAuth, removeTarget);

export default router;
