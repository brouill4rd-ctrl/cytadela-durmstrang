import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getWorldState } from '../worldState.js';

const router = Router();
const stages = ['LETTER_PENDING', 'LETTER_OPENED', 'PREPARATION', 'PORT', 'SHIP', 'FJORD', 'BORDER_CONTROL', 'GREAT_HALL', 'ARRIVED', 'COMPLETED'];
const choiceMap = {
  PORT: { return: 'HELPFUL', call: 'OBSERVANT', ignore: 'RESERVED' },
  SHIP: { deck: 'BOLD', below: 'CURIOUS', passenger: 'OPEN' },
  FJORD: { watch: 'OBSERVANT', listen: 'CURIOUS', prepare: 'TRADITIONAL' }
};
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function ensureProgress(user) {
  let row = db.prepare('SELECT * FROM character_prologues WHERE user_id = ?').get(user.id);
  if (!row) {
    db.prepare("INSERT INTO character_prologues (user_id, stage, completed) VALUES (?, 'COMPLETED', 1)").run(user.id);
    row = db.prepare('SELECT * FROM character_prologues WHERE user_id = ?').get(user.id);
  }
  return row;
}

function publicState(user, row) {
  const choices = db.prepare('SELECT scene, choice_id, story_tag, created_at FROM prologue_choices WHERE user_id = ? ORDER BY created_at').all(user.id);
  return {
    stage: row.stage, completed: Boolean(row.completed), acceptedAt: row.accepted_at,
    arrivedAt: row.arrived_at, choices,
    character: { firstName: user.name, lastName: user.surname, fullName: user.full_name, className: user.class_year, origin: user.origin, companion: user.companion },
    letter: {
      salutation: user.gender?.toLowerCase().includes('kob') ? `Szanowna Panno ${user.surname}` : `Szanowny Panie ${user.surname}`,
      schoolYear: 'XIX Rok Szkolny',
      requiredItems: ['Różdżka', 'Kociołek', 'Zestaw fiolek', 'Podręczniki', 'Szaty szkolne', 'Przybory piśmiennicze'],
      ticket: { holder: user.full_name, departure: 'Nabrzeże Czarnej Latarni', passage: `D-${user.id.slice(-6).toUpperCase()}` }
    }
  };
}

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(publicState(user, ensureProgress(user)));
});

router.post('/advance', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const current = ensureProgress(user);
  if (current.completed) return res.json(publicState(user, current));
  const currentIndex = stages.indexOf(current.stage);
  const requested = req.body.stage;
  if (!stages.includes(requested) || stages.indexOf(requested) !== currentIndex + 1) {
    return res.status(409).json({ error: 'Pieczęcie podróży muszą być otwierane we właściwej kolejności.', stage: current.stage });
  }
  const scene = current.stage;
  const choiceId = req.body.choiceId;
  const storyTag = choiceMap[scene]?.[choiceId] || null;
  const now = new Date().toISOString();
  const world = getWorldState();
  const tx = db.transaction(() => {
    if (choiceId && storyTag) db.prepare('INSERT OR IGNORE INTO prologue_choices (id,user_id,scene,choice_id,story_tag,created_at) VALUES (?,?,?,?,?,?)').run(id('choice'), user.id, scene, choiceId, storyTag, now);
    if (requested === 'PREPARATION') {
      const inventory = JSON.parse(user.inventory || '[]');
      if (!inventory.some(item => item.id === 'memento-durmstrang-ticket')) {
        inventory.push({ id: 'memento-durmstrang-ticket', name: 'Bilet do Durmstrangu', category: 'memento', rarity: 'unique', icon: '🎟️', price: 0 });
        db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(inventory), user.id);
      }
    }
    if (requested === 'COMPLETED') {
      db.prepare("UPDATE character_prologues SET stage=?, completed=1, arrived_at=COALESCE(arrived_at,?), world_snapshot=?, updated_at=? WHERE user_id=?").run(requested, now, JSON.stringify(world), now, user.id);
      db.prepare('INSERT OR IGNORE INTO character_history_events (id,user_id,event_key,title,description,snapshot,created_at) VALUES (?,?,?,?,?,?,?)').run(id('history'), user.id, 'FIRST_NIGHT', 'Pierwsza noc w Cytadeli', `${user.full_name} przybył(a) do Twierdzy przez Czarny Fiord.`, JSON.stringify(world), now);
    } else {
      db.prepare('UPDATE character_prologues SET stage=?, updated_at=? WHERE user_id=?').run(requested, now, user.id);
    }
  });
  tx();
  res.json(publicState(db.prepare('SELECT * FROM users WHERE id=?').get(user.id), ensureProgress(user)));
});

router.get('/lineage/me', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT cl.status, cl.discovery, cl.discovered_text, sl.public_title
    FROM character_lineages cl JOIN secret_lineages sl ON sl.id=cl.lineage_id
    WHERE cl.user_id=? AND cl.discovery > 0`).all(req.user.id);
  res.json(rows.map(row => ({ status: row.status, discovery: row.discovery, title: row.public_title || 'Stary znak', text: row.discovered_text })));
});

router.get('/wand/me', requireAuth, (req, res) => {
  const events = db.prepare('SELECT affinity,narrative,created_at FROM wand_resonance_events WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json({ bond: events.length > 5 ? 'Zestrojona' : events.length ? 'Budząca się' : 'Nieznajoma', events });
});

router.get('/admin', requireAuth, requireRole('admin'), (_req, res) => {
  res.json(db.prepare(`SELECT p.*,u.full_name FROM character_prologues p JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC`).all());
});

router.patch('/admin/:userId', requireAuth, requireRole('admin'), (req, res) => {
  const stage = req.body.stage;
  if (!stages.includes(stage)) return res.status(400).json({ error: 'Nieznany etap prologu.' });
  const completed = stage === 'COMPLETED' ? 1 : 0;
  db.prepare('INSERT INTO character_prologues(user_id,stage,completed) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET stage=excluded.stage,completed=excluded.completed,updated_at=datetime(\'now\')').run(req.params.userId, stage, completed);
  db.prepare('INSERT INTO audit_logs(id,timestamp,admin,action,detail) VALUES(?,?,?,?,?)').run(id('log'), new Date().toISOString(), req.user.fullName, 'Zmieniono etap prologu', `${req.params.userId}: ${stage}`);
  res.json({ ok: true, stage, completed: Boolean(completed) });
});

export default router;
