import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {
  initDungeonEscapeService,
  getDungeonStatus,
  startOrResumeAttempt,
  submitStageAnswer,
  requestHint,
  abandonAttempt,
  warsawDateKey,
  warsawNextMidnight,
  warsawWeekKey,
  DAILY_LIMIT,
  MAX_HP,
  MAX_HINTS,
  CONSTELLATIONS,
  RUNE_LEXICON
} from './services/dungeonEscapeService.js';
import { initPointsService } from './services/pointsService.js';
import { initSkirnirService } from './services/skirnirService.js';

// ===================== POMOCNICZE =====================

function makeDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'x',
      email TEXT DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      surname TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL DEFAULT 'Adept',
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'approved',
      house TEXT DEFAULT 'ravnheim',
      points INTEGER DEFAULT 0,
      currency INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      inventory TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      student_name TEXT,
      house TEXT,
      points INTEGER,
      source TEXT,
      source_type TEXT DEFAULT 'MANUAL',
      source_id TEXT DEFAULT '',
      lesson_id TEXT,
      professor_id TEXT,
      professor_name TEXT,
      actor_id TEXT DEFAULT '',
      actor_name TEXT DEFAULT '',
      date TEXT,
      comment TEXT DEFAULT '',
      is_revoked INTEGER DEFAULT 0,
      school_year TEXT DEFAULT '',
      idempotency_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      vault_number TEXT,
      vault_tier TEXT,
      balance INTEGER DEFAULT 0,
      security_level TEXT DEFAULT '',
      rune_seal TEXT DEFAULT '',
      guardian TEXT DEFAULT '',
      interest_rate TEXT DEFAULT '',
      opened_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      sender_id TEXT DEFAULT '',
      sender_name TEXT DEFAULT '',
      recipient_id TEXT DEFAULT '',
      recipient_name TEXT DEFAULT '',
      amount INTEGER DEFAULT 0,
      type TEXT DEFAULT 'inflow',
      category TEXT DEFAULT '',
      title TEXT DEFAULT '',
      note TEXT DEFAULT '',
      status TEXT DEFAULT 'completed',
      reference_code TEXT DEFAULT '',
      date TEXT DEFAULT '',
      source_type TEXT DEFAULT '',
      source_id TEXT DEFAULT '',
      actor_id TEXT DEFAULT '',
      actor_name TEXT DEFAULT '',
      school_year TEXT DEFAULT '',
      idempotency_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS school_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO school_config (key, value) VALUES ('school_year', 'Test Rok');
  `);

  return db;
}

function addUser(db, id, opts = {}) {
  db.prepare(`
    INSERT OR REPLACE INTO users (id, username, full_name, role, status, house, inventory)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    opts.username || id,
    opts.fullName || 'Adept',
    opts.role || 'student',
    opts.status || 'approved',
    opts.house || 'ravnheim',
    opts.inventory || '[]'
  );
}

// Konfiguracja: wariant 0 etapu 1: rozwiązanie [0, 4, 5]
// wariant 0 etapu 2: sekwencja ['polaris', 'kruk', 'wilk', 'tarcza']
// wariant 0 etapu 3: solvent='smocza_krew', catalyst='beryl_proszek'

function solveStage1(db, userId, attemptId) {
  return submitStageAnswer(userId, attemptId, { r1: 0, r2: 4, r3: 5 });
}

function solveStage2(db, userId, attemptId) {
  // Wariant 0: polaris, kruk, wilk, tarcza
  // Ale nie znamy wariantu — odczytajmy go
  const attempt = db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
  const sequences = [
    ['polaris', 'kruk', 'wilk', 'tarcza'],
    ['smok', 'polaris', 'niedzwiedz', 'kruk'],
    ['tarcza', 'wilk', 'polaris', 'smok'],
    ['niedzwiedz', 'kruk', 'tarcza', 'smok']
  ];
  const seq = sequences[attempt.variant_stage2];
  let lastResult;
  for (const id of seq) {
    lastResult = submitStageAnswer(userId, attemptId, { constellationId: id });
  }
  return lastResult;
}

function solveStage3(db, userId, attemptId) {
  const attempt = db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
  const solvents   = ['smocza_krew',  'kwas_smoczy',    'krew_feniksa',  'smocza_krew'];
  const catalysts  = ['beryl_proszek', 'rubin_proszek', 'szafir_proszek', 'szafir_proszek'];
  const v = attempt.variant_stage3;
  return submitStageAnswer(userId, attemptId, { solvent: solvents[v], catalyst: catalysts[v] });
}

function completeAttempt(db, userId, attemptId) {
  solveStage1(db, userId, attemptId);
  const refreshed = db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attemptId);
  solveStage2(db, userId, attemptId);
  return solveStage3(db, userId, attemptId);
}

// ===================== TESTY =====================

test('(1) Trzecie błędne zatwierdzenie kończy podejście porażką', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u1');

  const { attempt } = startOrResumeAttempt('u1', 'Adept', 'ravnheim');
  const id = attempt.id;

  // Trzy błędne odpowiedzi na etapie 1
  const bad = { r1: 5, r2: 5, r3: 5 };
  submitStageAnswer('u1', id, bad);
  submitStageAnswer('u1', id, bad);
  const result = submitStageAnswer('u1', id, bad);

  assert.equal(result.outcome, 'failed');
  assert.equal(result.reason, 'hp_depleted');

  const row = db.prepare('SELECT status FROM dungeon_escape_attempts WHERE id = ?').get(id);
  assert.equal(row.status, 'failed');
});

test('(2) Upływ 8 minut jest rozstrzygany przez serwer', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u2');

  const { attempt } = startOrResumeAttempt('u2', 'Adept', 'ravnheim');
  const id = attempt.id;

  // Cofnij czas wygaśnięcia w przeszłość
  const past = new Date(Date.now() - 1000).toISOString();
  db.prepare('UPDATE dungeon_escape_attempts SET expires_at = ? WHERE id = ?').run(past, id);

  const result = submitStageAnswer('u2', id, { r1: 0, r2: 4, r3: 5 });
  assert.equal(result.outcome, 'timeout');

  const row = db.prepare('SELECT status, failure_reason FROM dungeon_escape_attempts WHERE id = ?').get(id);
  assert.equal(row.status, 'failed');
  assert.equal(row.failure_reason, 'timeout');
});

test('(3) Zamknięcie i ponowne otwarcie wznawia tę samą próbę', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u3');

  const first = startOrResumeAttempt('u3', 'Adept', 'ravnheim');
  const firstId = first.attempt.id;
  assert.equal(first.resumed, false);

  // "Zamknięcie okna" — tylko wywołanie startOrResumeAttempt ponownie
  const second = startOrResumeAttempt('u3', 'Adept', 'ravnheim');
  assert.equal(second.resumed, true);
  assert.equal(second.attempt.id, firstId);
});

test('(4) Nie można utworzyć dwóch aktywnych prób jednocześnie', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u4');

  const r1 = startOrResumeAttempt('u4', 'Adept', 'ravnheim');
  assert.ok(!r1.error);
  const r2 = startOrResumeAttempt('u4', 'Adept', 'ravnheim');
  // Powinien wznowić, a nie tworzyć nową
  assert.equal(r2.resumed, true);
  assert.equal(r2.attempt.id, r1.attempt.id);

  const count = db.prepare(
    "SELECT COUNT(*) as c FROM dungeon_escape_attempts WHERE user_id = 'u4' AND status = 'active'"
  ).get().c;
  assert.equal(count, 1);
});

test('(5) Trzecia próba tego samego dnia jest odrzucana', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u5');

  const today = warsawDateKey();

  // Symuluj dwa zakończone podejścia
  db.prepare(`
    INSERT INTO dungeon_escape_attempts
      (id, user_id, status, stage, variant_stage1, variant_stage2, variant_stage3,
       hints_used, errors, stage2_sequence, started_at, expires_at, daily_key, week_key)
    VALUES (?, 'u5', 'failed', 1, 0, 0, 0, 0, 3, '[]', datetime('now'), datetime('now','+8 minutes'), ?, ?)
  `).run('u5-att1', today, warsawWeekKey());
  db.prepare(`
    INSERT INTO dungeon_escape_attempts
      (id, user_id, status, stage, variant_stage1, variant_stage2, variant_stage3,
       hints_used, errors, stage2_sequence, started_at, expires_at, daily_key, week_key)
    VALUES (?, 'u5', 'failed', 1, 0, 0, 0, 0, 3, '[]', datetime('now'), datetime('now','+8 minutes'), ?, ?)
  `).run('u5-att2', today, warsawWeekKey());

  const result = startOrResumeAttempt('u5', 'Adept', 'ravnheim');
  assert.ok(result.error);
  assert.equal(result.code, 429);
});

test('(6) Klucz dzienny jest w strefie Europe/Warsaw, zmiana czasu DST', () => {
  // 2026-03-29 01:30 UTC — Polska właśnie weszła w czas letni (CEST=UTC+2)
  // W Warszawie jest już 03:30, więc date key to 2026-03-29
  const dst = new Date('2026-03-29T01:30:00Z');
  assert.equal(warsawDateKey(dst), '2026-03-29');

  // 2026-10-25 00:30 UTC — Polska właśnie weszła z powrotem w czas zimowy (CET=UTC+1)
  // W Warszawie jest 01:30, więc date key to 2026-10-25
  const stdBack = new Date('2026-10-25T00:30:00Z');
  assert.equal(warsawDateKey(stdBack), '2026-10-25');

  // Tydzień: 2026-08-28 (piątek Warsaw) → poniedziałek 2026-08-24
  const friday = new Date('2026-08-27T22:30:00Z'); // to jest 28 w Warsaw
  assert.equal(warsawWeekKey(friday), '2026-08-24');

  // Niedziela wieczór UTC — 2026-08-30T22:00Z → poniedziałek 31 w Warsaw → tydzień 2026-08-31
  const sundayEvening = new Date('2026-08-30T22:00:00Z');
  assert.equal(warsawWeekKey(sundayEvening), '2026-08-31');
});

test('(7) Ponowione żądanie ukończenia nie duplikuje nagrody (idempotencja)', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u7');

  const { attempt } = startOrResumeAttempt('u7', 'Adept', 'ravnheim');
  const id = attempt.id;

  // Ukończ etap 1 i 2
  solveStage1(db, 'u7', id);
  solveStage2(db, 'u7', id);

  // Symuluj dwa równoczesne żądania ukończenia etapu 3
  const att = db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(id);
  const solvents   = ['smocza_krew',  'kwas_smoczy',    'krew_feniksa',  'smocza_krew'];
  const catalysts  = ['beryl_proszek', 'rubin_proszek', 'szafir_proszek', 'szafir_proszek'];
  const answer = { solvent: solvents[att.variant_stage3], catalyst: catalysts[att.variant_stage3] };

  const r1 = submitStageAnswer('u7', id, answer);
  assert.equal(r1.outcome, 'completed');

  // Drugie żądanie — podejście już zakończone
  const r2 = submitStageAnswer('u7', id, answer);
  assert.ok(r2.error);
  assert.equal(r2.code, 409);

  // Sprawdź dokładnie jedną nagrodę tygodniową
  const rewards = db.prepare("SELECT COUNT(*) as c FROM dungeon_escape_weekly_rewards WHERE user_id = 'u7'").get().c;
  assert.equal(rewards, 1);

  // Sprawdź, że punkty przyznano dokładnie raz
  const pts = db.prepare("SELECT COUNT(*) as c FROM point_transactions WHERE student_id = 'u7'").get().c;
  assert.equal(pts, 1);
});

test('(8) Klient nie może przesłać wartości nagrody ani wyniku', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u8');

  const { attempt } = startOrResumeAttempt('u8', 'Adept', 'ravnheim');
  const id = attempt.id;

  // Answer zawiera pola, które klient chciałby "wstrzyknąć" — serwis je ignoruje
  const maliciousAnswer = {
    r1: 0, r2: 4, r3: 5,
    reward: { points: 9999, skirnirs: 9999 },
    tier: 'master',
    completed: true,
    errors: 0
  };

  // Serwis sprawdza wyłącznie r1/r2/r3 — reszta jest ignorowana przez sanityzację w trasie
  // Tu testujemy serwis bezpośrednio, więc dodatkowe pola nie mają wpływu
  const result = submitStageAnswer('u8', id, maliciousAnswer);
  assert.equal(result.correct, true); // Poprawna odpowiedź bo r1/r2/r3 = 0/4/5

  // Upewnij się, że nagroda nie została przyznana na etapie 1
  const pts = db.prepare("SELECT COUNT(*) as c FROM point_transactions WHERE student_id = 'u8'").get().c;
  assert.equal(pts, 0); // Nagroda tylko po ukończeniu wszystkich etapów
});

test('(9) Nagroda tygodniowa przyznawana tylko raz w tygodniu', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u9');

  // Pierwsze ukończenie
  const r1 = startOrResumeAttempt('u9', 'Adept', 'ravnheim');
  completeAttempt(db, 'u9', r1.attempt.id);

  // Drugie podejście — muszę zresetować dzienny limit
  const today = warsawDateKey();
  db.prepare("UPDATE dungeon_escape_attempts SET daily_key = '2000-01-01' WHERE user_id = 'u9'").run();

  const r2 = startOrResumeAttempt('u9', 'Adept', 'ravnheim');
  const result2 = completeAttempt(db, 'u9', r2.attempt.id);

  assert.equal(result2.outcome, 'completed');
  assert.equal(result2.trainingMode, true);
  assert.ok(!result2.reward); // Brak nagrody przy kolejnym ukończeniu w tym tygodniu

  const rewards = db.prepare("SELECT COUNT(*) as c FROM dungeon_escape_weekly_rewards WHERE user_id = 'u9'").get().c;
  assert.equal(rewards, 1);
});

test('(10) Złoty Klucz Pradawnych jest unikalny (przyznawany tylko raz)', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u10');

  // Pierwsze ukończenie — powinien dostać klucz
  const r1 = startOrResumeAttempt('u10', 'Adept', 'ravnheim');
  completeAttempt(db, 'u10', r1.attempt.id);

  let inv = JSON.parse(db.prepare("SELECT inventory FROM users WHERE id = 'u10'").get().inventory);
  const keyCount1 = inv.filter(i => i.id === 'labirynt-zloty-klucz-pradawnych').length;
  assert.equal(keyCount1, 1);

  // Drugie ukończenie (inne tygodnie)
  db.prepare("UPDATE dungeon_escape_attempts SET daily_key = '2000-01-01', week_key = '2000-01-01' WHERE user_id = 'u10'").run();
  db.prepare("UPDATE dungeon_escape_weekly_rewards SET week_key = '2000-01-01' WHERE user_id = 'u10'").run();

  const r2 = startOrResumeAttempt('u10', 'Adept', 'ravnheim');
  completeAttempt(db, 'u10', r2.attempt.id);

  inv = JSON.parse(db.prepare("SELECT inventory FROM users WHERE id = 'u10'").get().inventory);
  const keyCount2 = inv.filter(i => i.id === 'labirynt-zloty-klucz-pradawnych').length;
  assert.equal(keyCount2, 1, 'Klucz nie powinien być dodany drugi raz');
});

test('(11) Użytkownik nie może odczytać ani modyfikować cudzego podejścia', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'ua');
  addUser(db, 'ub');

  const { attempt } = startOrResumeAttempt('ua', 'Adept A', 'ravnheim');
  const id = attempt.id;

  // ub próbuje zatwierdzić odpowiedź w podejściu ua
  const result = submitStageAnswer('ub', id, { r1: 0, r2: 4, r3: 5 });
  assert.ok(result.error);
  assert.equal(result.code, 403);

  // ub próbuje pobrać podpowiedź do podejścia ua
  const hintResult = requestHint('ub', id);
  assert.ok(hintResult.error);
  assert.equal(hintResult.code, 403);

  // ub próbuje porzucić podejście ua
  const abandonResult = abandonAttempt('ub', id);
  assert.ok(abandonResult.error);
  assert.equal(abandonResult.code, 403);
});

test('(12) Odpowiedzi nie trafiają do danych publicznych podejścia', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'u12');

  const { attempt } = startOrResumeAttempt('u12', 'Adept', 'ravnheim');

  // Dane publiczne etapu 1 nie zawierają rozwiązania
  const stageData = attempt.stageData;
  assert.ok(!('solution' in stageData), 'solution nie może być w stageData');
  assert.ok(!('hint' in stageData), 'hint nie może być w stageData');

  // Etap 2 — sprawdź po przejściu
  solveStage1(db, 'u12', attempt.id);
  const att2 = db.prepare('SELECT * FROM dungeon_escape_attempts WHERE id = ?').get(attempt.id);
  // buildPublicAttempt dla etapu 2
  const status = getDungeonStatus('u12');
  const stage2Data = status.activeAttempt?.stageData;
  assert.ok(stage2Data, 'Powinien być activeAttempt po przejściu etapu 1');
  assert.ok(!('sequence' in stage2Data), 'sequence nie może być w stageData etapu 2');
  assert.ok(!('hint' in stage2Data), 'hint nie może być w stageData etapu 2');
});

test('reset dzienny działa na końcu miesiąca i roku', () => {
  assert.equal(warsawDateKey(warsawNextMidnight(new Date('2026-08-31T12:00:00Z'))), '2026-09-01');
  assert.equal(warsawDateKey(warsawNextMidnight(new Date('2026-12-31T12:00:00Z'))), '2027-01-01');
});

test('Wskazówka skraca czas i zwraca tekst', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'uh');

  const { attempt } = startOrResumeAttempt('uh', 'Adept', 'ravnheim');
  const id = attempt.id;

  const before = new Date(attempt.expiresAt).getTime();
  const result = requestHint('uh', id);

  assert.ok(!result.error);
  assert.equal(typeof result.hint, 'string');
  assert.ok(result.hint.length > 10);

  const after = new Date(result.newExpiresAt).getTime();
  // Czas powinien być skrócony o 45 sekund
  assert.ok(Math.abs((before - after) - 45000) < 1000, 'Czas powinien być skrócony o ~45 sekund');
  assert.equal(result.hintsUsed, 1);
});

test('Limit podpowiedzi jest egzekwowany', () => {
  const db = makeDb();
  initPointsService(db);
  initSkirnirService(db);
  initDungeonEscapeService(db);
  addUser(db, 'uh2');

  const { attempt } = startOrResumeAttempt('uh2', 'Adept', 'ravnheim');
  const id = attempt.id;

  requestHint('uh2', id);
  requestHint('uh2', id);
  const third = requestHint('uh2', id);

  assert.ok(third.error);
  assert.ok(/limit/i.test(third.error));
});
