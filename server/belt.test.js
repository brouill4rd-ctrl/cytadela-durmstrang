import test from 'node:test';
import assert from 'node:assert/strict';
import db from './db.js';

const userId = 'belt-test-user';
const insert = db.prepare('INSERT INTO user_pinned_shortcuts (user_id, slot, target_type, target_id) VALUES (?, ?, ?, ?)');

test.beforeEach(() => {
  db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ?').run(userId);
  db.prepare(`INSERT OR IGNORE INTO users (id, username, password, name, surname, full_name, role, status)
    VALUES (?, 'belt-test-user', 'x', 'Test', 'Pasa', 'Test Pasa', 'student', 'approved')`).run(userId);
});

test.after(() => {
  db.prepare('DELETE FROM user_pinned_shortcuts WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
});

test('Pas egzekwuje jeden znak na slot i brak duplikatów', () => {
  insert.run(userId, 0, 'TIMETABLE', '');
  assert.throws(() => insert.run(userId, 0, 'MAP', ''), /UNIQUE/);
  assert.throws(() => insert.run(userId, 1, 'TIMETABLE', ''), /UNIQUE/);
});

test('Pas egzekwuje zakres pięciu slotów', () => {
  assert.throws(() => insert.run(userId, 5, 'MAP', ''), /CHECK/);
});
