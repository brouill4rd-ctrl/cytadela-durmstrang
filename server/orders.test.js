import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { ensureOrderSchema, createProject, contribute, assignCouncilMember, getCouncilPermissions } from './orderService.js';

function setup() {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, house TEXT, full_name TEXT, username TEXT)');
  ensureOrderSchema(db);
  db.prepare('INSERT INTO users VALUES (?,?,?,?)').run('a', 'ravnheim', 'Astrid Vinter', 'astrid');
  db.prepare('INSERT INTO users VALUES (?,?,?,?)').run('b', 'ravnheim', 'Borin', 'borin');
  db.prepare('INSERT INTO users VALUES (?,?,?,?)').run('c', 'ravnheim', 'Cyra', 'cyra');
  return db;
}

test('projekt sumuje udokumentowane wkłady, kończy się i nie zużywa źródła drugi raz', () => {
  const db = setup();
  const id = createProject(db, { orderId: 'ravnheim', title: 'Odbudowa Obserwatorium', schoolYear: 'XVII', stages: [{ title: 'Odbudowa', requirementKey: 'obsydian', requiredAmount: 100 }] }, 'admin');
  const users = [['a',20],['b',30],['c',50]];
  for (const [userId, amount] of users) contribute(db, { projectId: id, idempotencyKey: `key-${userId}`, sourceType: 'inventory', sourceRef: `stack-${userId}`, resourceKey: 'obsydian', amount }, { id: userId, house: 'ravnheim', fullName: userId });
  assert.equal(db.prepare('SELECT status FROM order_projects WHERE id=?').get(id).status, 'completed');
  assert.equal(db.prepare('SELECT visual_state FROM order_projects WHERE id=?').get(id).visual_state, 'completed');
  assert.equal(db.prepare('SELECT SUM(amount) total FROM order_project_contributions WHERE project_id=?').get(id).total, 100);
  assert.equal(db.prepare("SELECT COUNT(*) count FROM order_event_log WHERE event_type='order.project.completed'").get().count, 1);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM order_history WHERE order_id=\'ravnheim\'').get().count, 1);
  assert.throws(() => contribute(db, { projectId: id, idempotencyKey: 'key-a', sourceType: 'inventory', sourceRef: 'stack-a', resourceKey: 'obsydian', amount: 20 }, { id: 'a', house: 'ravnheim' }));
});

test('rola Rady jest ograniczona do Zakonu i wygasa bez utraty historii', () => {
  const db = setup();
  db.prepare('INSERT INTO order_council_roles VALUES (?,?,?,?,?,?)').run('chron', 'ravnheim', 'Kronikarz', '["chronicle.write"]', 1, new Date().toISOString());
  const membership = assignCouncilMember(db, { roleId: 'chron', userId: 'a', endsAt: '2999-01-01T00:00:00.000Z' }, 'admin');
  assert.deepEqual(getCouncilPermissions(db, 'a', 'ravnheim'), ['chronicle.write']);
  assert.deepEqual(getCouncilPermissions(db, 'a', 'otergard'), []);
  db.prepare('UPDATE order_council_memberships SET ends_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z', membership);
  assert.deepEqual(getCouncilPermissions(db, 'a', 'ravnheim'), []);
  assert.equal(db.prepare('SELECT COUNT(*) count FROM order_council_memberships WHERE id=?').get(membership).count, 1);
});
