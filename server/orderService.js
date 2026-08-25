import { randomUUID } from 'crypto';

export const ORDER_IDS = ['reinhall', 'bjornhall', 'ravnheim', 'otergard'];
export const COUNCIL_PERMISSIONS = ['chronicle.write', 'treasury.view', 'project.propose', 'announcements.write', 'minievent.run'];

export function ensureOrderSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_projects (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', school_year TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', persistence TEXT NOT NULL DEFAULT 'permanent', visual_state TEXT DEFAULT 'before', started_at TEXT NOT NULL, completed_at TEXT);
    CREATE TABLE IF NOT EXISTS order_project_stages (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', position INTEGER NOT NULL, requirement_type TEXT NOT NULL DEFAULT 'resource', requirement_key TEXT NOT NULL, required_amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active', completed_at TEXT, FOREIGN KEY(project_id) REFERENCES order_projects(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS order_project_contributions (id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, project_id TEXT NOT NULL, stage_id TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT NOT NULL, order_id TEXT NOT NULL, source_type TEXT NOT NULL, source_ref TEXT NOT NULL, resource_key TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), created_at TEXT NOT NULL, UNIQUE(source_type, source_ref), FOREIGN KEY(project_id) REFERENCES order_projects(id), FOREIGN KEY(stage_id) REFERENCES order_project_stages(id));
    CREATE TABLE IF NOT EXISTS order_council_roles (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, name TEXT NOT NULL, permissions TEXT NOT NULL DEFAULT '[]', seats INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_council_memberships (id TEXT PRIMARY KEY, role_id TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT NOT NULL, order_id TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT, revoked_at TEXT, assigned_by TEXT NOT NULL, FOREIGN KEY(role_id) REFERENCES order_council_roles(id));
    CREATE TABLE IF NOT EXISTS order_sagas (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', school_year TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', started_at TEXT, completed_at TEXT);
    CREATE TABLE IF NOT EXISTS order_saga_stages (id TEXT PRIMARY KEY, saga_id TEXT NOT NULL, title TEXT NOT NULL, narrative TEXT DEFAULT '', position INTEGER NOT NULL, visibility TEXT NOT NULL DEFAULT 'members', status TEXT NOT NULL DEFAULT 'locked', completed_at TEXT, FOREIGN KEY(saga_id) REFERENCES order_sagas(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS order_achievements (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', school_year TEXT NOT NULL, earned_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_history (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', school_year TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_event_log (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, order_id TEXT NOT NULL, aggregate_id TEXT NOT NULL, payload TEXT NOT NULL DEFAULT '{}', actor_id TEXT, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_order_projects_order ON order_projects(order_id, status);
    CREATE INDEX IF NOT EXISTS idx_order_contributions_project ON order_project_contributions(project_id, stage_id);
    CREATE INDEX IF NOT EXISTS idx_order_council_order ON order_council_memberships(order_id, ends_at);
  `);
}

export function seedOrderDefaults(db) {
  const schoolYear = db.prepare("SELECT value FROM school_config WHERE key='school_year'").get()?.value || 'XIX Rok Szkolny';
  const defaults = {
    reinhall: ['Odbudowa Starej Biblioteki Rodowej', 'Pamięć rodowa', 'stare_drewno'],
    bjornhall: ['Wzmocnienie Północnego Bastionu', 'Nieugięty mur', 'zelazo_runiczne'],
    ravnheim: ['Odbudowa Obserwatorium', 'Głos spod Skrzydeł', 'fragment_obsydianu'],
    otergard: ['Odtworzenie Podwodnej Galerii', 'Zielona Głębia', 'szklo_alchemiczne']
  };
  db.transaction(() => {
    for (const [orderId, [projectTitle, sagaTitle, resourceKey]] of Object.entries(defaults)) {
      if (!db.prepare('SELECT id FROM order_projects WHERE order_id=? LIMIT 1').get(orderId)) {
        createProject(db, { orderId, title: projectTitle, description: 'Wspólne dzieło, które pozostawi trwały ślad w pokoju Zakonu.', schoolYear, stages: [
          { title: 'Zbieranie materiałów', requirementKey: resourceKey, requiredAmount: 100 },
          { title: 'Odbudowa', requirementKey: 'praca_wspolnoty', requiredAmount: 60 },
          { title: 'Aktywacja', requirementKey: 'znak_aktywacji', requiredAmount: 20 }
        ] }, 'system');
      }
      for (const [name, permissions] of [['Kronikarz', ['chronicle.write']], ['Strażnik Skarbca', ['treasury.view', 'project.propose']], ['Posłaniec', ['announcements.write']], ['Mistrz Gry', ['minievent.run']]]) {
        if (!db.prepare('SELECT id FROM order_council_roles WHERE order_id=? AND name=?').get(orderId, name)) db.prepare('INSERT INTO order_council_roles (id,order_id,name,permissions,seats,created_at) VALUES (?,?,?,?,1,?)').run(randomUUID(), orderId, name, JSON.stringify(permissions), now());
      }
      if (!db.prepare('SELECT id FROM order_sagas WHERE order_id=? LIMIT 1').get(orderId)) {
        const sagaId = randomUUID();
        db.prepare("INSERT INTO order_sagas (id,order_id,title,description,school_year,status,started_at) VALUES (?,?,?,?,?,'active',?)").run(sagaId, orderId, sagaTitle, 'Doroczna opowieść Zakonu, połączona z wydarzeniami Cytadeli.', schoolYear, now());
        const insertStage = db.prepare('INSERT INTO order_saga_stages (id,saga_id,title,narrative,position,visibility,status) VALUES (?,?,?,?,?,?,?)');
        ['Odkrycie', 'Próba', 'Finał'].forEach((title, i) => insertStage.run(randomUUID(), sagaId, title, i === 0 ? 'Pierwsze znaki czekają na odczytanie.' : 'Treść ujawni się wraz z postępem sagi.', i + 1, 'members', i === 0 ? 'active' : 'locked'));
      }
    }
  })();
}

const now = () => new Date().toISOString();
const json = value => JSON.stringify(value || {});
const validOrder = id => ORDER_IDS.includes(String(id || '').toLowerCase());
const event = (db, type, orderId, aggregateId, actorId, payload = {}) => db.prepare('INSERT INTO order_event_log (id,event_type,order_id,aggregate_id,payload,actor_id,created_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(), type, orderId, aggregateId, json(payload), actorId || null, now());

export function createProject(db, input, actorId) {
  if (!validOrder(input.orderId) || !input.title || !Array.isArray(input.stages) || !input.stages.length) throw new Error('Niepełna definicja projektu Zakonu.');
  const id = input.id || randomUUID();
  const created = now();
  db.transaction(() => {
    db.prepare('INSERT INTO order_projects (id,order_id,title,description,school_year,status,persistence,visual_state,started_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id, input.orderId, input.title, input.description || '', input.schoolYear || 'XIX Rok Szkolny', input.status || 'active', input.persistence || 'permanent', input.visualState || 'before', created);
    const insert = db.prepare('INSERT INTO order_project_stages (id,project_id,title,description,position,requirement_type,requirement_key,required_amount,status) VALUES (?,?,?,?,?,?,?,?,?)');
    input.stages.forEach((s, i) => insert.run(s.id || randomUUID(), id, s.title, s.description || '', i + 1, s.requirementType || 'resource', s.requirementKey, Number(s.requiredAmount), i === 0 ? 'active' : 'locked'));
    event(db, 'order.project.created', input.orderId, id, actorId, { title: input.title });
  })();
  return id;
}

export function contribute(db, input, user) {
  if (!input.idempotencyKey || !input.sourceType || !input.sourceRef || !input.resourceKey || Number(input.amount) <= 0) throw new Error('Wkład wymaga dodatniej ilości, źródła i klucza idempotencji.');
  return db.transaction(() => {
    const project = db.prepare('SELECT * FROM order_projects WHERE id=? AND status=\'active\'').get(input.projectId);
    if (!project || project.order_id !== user.house) throw new Error('Projekt jest niedostępny dla tego użytkownika.');
    const stage = db.prepare('SELECT * FROM order_project_stages WHERE project_id=? AND status=\'active\' ORDER BY position LIMIT 1').get(project.id);
    if (!stage || stage.requirement_key !== input.resourceKey) throw new Error('Ten zasób nie pasuje do aktywnego etapu.');
    db.prepare('INSERT INTO order_project_contributions (id,idempotency_key,project_id,stage_id,user_id,user_name,order_id,source_type,source_ref,resource_key,amount,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), input.idempotencyKey, project.id, stage.id, user.id, user.fullName || user.username, user.house, input.sourceType, input.sourceRef, input.resourceKey, Number(input.amount), now());
    const total = db.prepare('SELECT COALESCE(SUM(amount),0) total FROM order_project_contributions WHERE stage_id=?').get(stage.id).total;
    let completed = false;
    if (total >= stage.required_amount) {
      db.prepare("UPDATE order_project_stages SET status='completed',completed_at=? WHERE id=?").run(now(), stage.id);
      const next = db.prepare("SELECT id FROM order_project_stages WHERE project_id=? AND status='locked' ORDER BY position LIMIT 1").get(project.id);
      if (next) db.prepare("UPDATE order_project_stages SET status='active' WHERE id=?").run(next.id);
      else {
        completed = true;
        db.prepare("UPDATE order_projects SET status='completed',visual_state='completed',completed_at=? WHERE id=?").run(now(), project.id);
        db.prepare('INSERT INTO order_history (id,order_id,type,title,description,school_year,created_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(), project.order_id, 'project', project.title, `Zakon ukończył projekt: ${project.title}.`, project.school_year, now());
        event(db, 'order.project.completed', project.order_id, project.id, user.id, { title: project.title });
      }
      event(db, 'order.project.stage.completed', project.order_id, stage.id, user.id, { total });
    }
    event(db, 'order.project.contributed', project.order_id, project.id, user.id, { amount: Number(input.amount), sourceType: input.sourceType, sourceRef: input.sourceRef });
    return { total, required: stage.required_amount, completed };
  })();
}

export function assignCouncilMember(db, input, actorId) {
  const role = db.prepare('SELECT * FROM order_council_roles WHERE id=?').get(input.roleId);
  const member = db.prepare('SELECT id,house,full_name,username FROM users WHERE id=?').get(input.userId);
  if (!role || !member || role.order_id !== member.house) throw new Error('Rola Rady działa wyłącznie we właściwym Zakonie.');
  const active = db.prepare("SELECT COUNT(*) count FROM order_council_memberships WHERE role_id=? AND revoked_at IS NULL AND (ends_at IS NULL OR ends_at>?)").get(role.id, now()).count;
  if (active >= role.seats) throw new Error('Wszystkie miejsca tej roli są zajęte.');
  const id = randomUUID();
  db.prepare('INSERT INTO order_council_memberships (id,role_id,user_id,user_name,order_id,starts_at,ends_at,assigned_by) VALUES (?,?,?,?,?,?,?,?)').run(id, role.id, member.id, member.full_name || member.username, member.house, input.startsAt || now(), input.endsAt || null, actorId);
  event(db, 'order.council.member.assigned', member.house, id, actorId, { roleId: role.id, userId: member.id });
  return id;
}

export function getCouncilPermissions(db, userId, orderId) {
  const rows = db.prepare("SELECT r.permissions FROM order_council_memberships m JOIN order_council_roles r ON r.id=m.role_id WHERE m.user_id=? AND m.order_id=? AND m.revoked_at IS NULL AND m.starts_at<=? AND (m.ends_at IS NULL OR m.ends_at>?)").all(userId, orderId, now(), now());
  return [...new Set(rows.flatMap(r => { try { return JSON.parse(r.permissions); } catch { return []; } }).filter(p => COUNCIL_PERMISSIONS.includes(p)))];
}

export function getOrderRoom(db, orderId, viewer) {
  if (!validOrder(orderId)) throw new Error('Nieznany Zakon.');
  const isAdmin = viewer?.role === 'admin';
  const isMember = viewer?.house === orderId;
  const projects = isMember || isAdmin ? db.prepare(`SELECT p.*, COALESCE(SUM(c.amount),0) progress FROM order_projects p LEFT JOIN order_project_contributions c ON c.project_id=p.id WHERE p.order_id=? GROUP BY p.id ORDER BY p.started_at DESC`).all(orderId) : [];
  const council = isMember || isAdmin ? db.prepare("SELECT m.*,r.name role_name,r.permissions FROM order_council_memberships m JOIN order_council_roles r ON r.id=m.role_id WHERE m.order_id=? ORDER BY m.starts_at DESC").all(orderId) : [];
  const saga = isMember || isAdmin ? db.prepare('SELECT * FROM order_sagas WHERE order_id=? ORDER BY school_year DESC LIMIT 1').get(orderId) : null;
  const stages = saga ? db.prepare(`SELECT * FROM order_saga_stages WHERE saga_id=? ${isAdmin ? '' : "AND visibility!='admin'"} ORDER BY position`).all(saga.id) : [];
  return { orderId, access: isAdmin ? 'admin' : isMember ? 'member' : 'public', roomVariant: projects.some(p => p.status === 'completed') ? 'restored' : 'original', projects, council, saga: saga ? { ...saga, stages } : null, history: db.prepare('SELECT * FROM order_history WHERE order_id=? ORDER BY created_at DESC LIMIT 20').all(orderId), achievements: db.prepare('SELECT * FROM order_achievements WHERE order_id=? ORDER BY earned_at DESC').all(orderId), permissions: viewer ? getCouncilPermissions(db, viewer.id, orderId) : [] };
}
