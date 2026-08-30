import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { awardPoints, getHousePointsTotal, getUserPointsTotal, initPointsService } from './services/pointsService.js';

function createDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      role TEXT NOT NULL,
      house TEXT,
      discord_id TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0
    );
    CREATE TABLE school_config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE point_transactions (
      id TEXT PRIMARY KEY, student_id TEXT, student_name TEXT, house TEXT, points INTEGER,
      source TEXT, source_type TEXT, source_id TEXT, lesson_id TEXT, professor_id TEXT,
      professor_name TEXT, actor_id TEXT, actor_name TEXT, date TEXT, comment TEXT,
      is_revoked INTEGER DEFAULT 0, school_year TEXT DEFAULT '', idempotency_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.prepare('INSERT INTO school_config (key, value) VALUES (?, ?)').run('school_year', 'XIX');
  db.prepare('INSERT INTO users (id, full_name, role, house, discord_id) VALUES (?, ?, ?, ?, ?)').run('student-1', 'Adept Testowy', 'student', 'ravnheim', 'discord-student-1');
  // Celowo pozostawiony stary Zakon na koncie kadry: serwis musi go zignorować.
  db.prepare('INSERT INTO users (id, full_name, role, house) VALUES (?, ?, ?, ?)').run('staff-1', 'Profesor Testowy', 'professor', 'ravnheim');
  initPointsService(db);
  return db;
}

test('punkty kadry są osobiste i nie zasilają Zakonu', () => {
  const db = createDb();
  awardPoints({
    studentId: 'staff-1',
    studentName: 'Profesor Testowy',
    house: 'ravnheim',
    points: 5,
    source: 'Gra testowa'
  });

  const transaction = db.prepare('SELECT student_id, house, points FROM point_transactions WHERE student_id = ?').get('staff-1');
  assert.equal(transaction.house, '');
  assert.equal(transaction.points, 5);
  assert.equal(getUserPointsTotal('staff-1'), 5);
  assert.equal(getHousePointsTotal('ravnheim'), 0);
  assert.equal(db.prepare('SELECT points FROM users WHERE id = ?').get('staff-1').points, 5);
  db.close();
});

test('punkty adepta nadal zasilają jego Zakon', () => {
  const db = createDb();
  awardPoints({
    studentId: 'student-1',
    studentName: 'Adept Testowy',
    house: 'ravnheim',
    points: 7,
    source: 'Gra testowa'
  });

  assert.equal(getUserPointsTotal('student-1'), 7);
  assert.equal(getHousePointsTotal('ravnheim'), 7);
  db.close();
});

test('ID Discorda jest mapowane na konto portalu w rankingu osobistym', () => {
  const db = createDb();
  awardPoints({
    studentId: 'discord-student-1',
    studentName: 'Adept Testowy',
    house: 'ravnheim',
    points: 11,
    source: 'Lekcja Discord'
  });

  const transaction = db.prepare('SELECT student_id FROM point_transactions').get();
  assert.equal(transaction.student_id, 'student-1');
  assert.equal(db.prepare('SELECT points FROM users WHERE id = ?').get('student-1').points, 11);
  assert.equal(getUserPointsTotal('student-1'), 11);
  db.close();
});

test('migracja przepina historyczne transakcje z Discord ID na konto portalu', () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO point_transactions
      (id, student_id, student_name, house, points, source, is_revoked)
    VALUES ('legacy-discord', 'discord-student-1', 'Adept Testowy', 'ravnheim', 13, 'Stara lekcja Discord', 0)
  `).run();

  initPointsService(db);

  assert.equal(db.prepare('SELECT student_id FROM point_transactions WHERE id = ?').get('legacy-discord').student_id, 'student-1');
  assert.equal(getUserPointsTotal('student-1'), 13);
  db.close();
});

test('migracja usuwa Zakon z dawnych transakcji kadry bez kasowania punktów osobistych', () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO point_transactions
      (id, student_id, student_name, house, points, source, is_revoked)
    VALUES ('legacy-staff', 'staff-1', 'Profesor Testowy', 'ravnheim', 9, 'Stara gra', 0)
  `).run();

  initPointsService(db);

  assert.equal(db.prepare('SELECT house FROM point_transactions WHERE id = ?').get('legacy-staff').house, '');
  assert.equal(getUserPointsTotal('staff-1'), 9);
  assert.equal(getHousePointsTotal('ravnheim'), 0);
  db.close();
});
