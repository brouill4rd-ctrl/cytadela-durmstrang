import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { initPointsService } from './services/pointsService.js';
import { initSkirnirService } from './services/skirnirService.js';
import {
  abandonRunicDuel,
  getRunicDuelStatus,
  initRunicDuelService,
  startRunicDuel,
  submitRunicDuelAction,
  warsawDateKey
} from './services/runicDuelService.js';

function setup(house = 'ravnheim') {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, full_name TEXT, house TEXT, points INTEGER DEFAULT 0, xp INTEGER DEFAULT 0, currency INTEGER DEFAULT 0);
    CREATE TABLE houses (id TEXT PRIMARY KEY);
    CREATE TABLE school_config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE point_transactions (
      id TEXT PRIMARY KEY, student_id TEXT, student_name TEXT, house TEXT, points INTEGER,
      source TEXT, source_type TEXT, source_id TEXT, lesson_id TEXT, professor_id TEXT,
      professor_name TEXT, actor_id TEXT, actor_name TEXT, date TEXT, comment TEXT,
      is_revoked INTEGER DEFAULT 0, school_year TEXT, idempotency_key TEXT, created_at TEXT
    );
    CREATE TABLE bank_accounts (
      id TEXT PRIMARY KEY, user_id TEXT UNIQUE, user_name TEXT, vault_number TEXT,
      vault_tier TEXT, balance INTEGER DEFAULT 0, security_level TEXT, rune_seal TEXT,
      guardian TEXT, interest_rate REAL DEFAULT 0, opened_at TEXT
    );
    CREATE TABLE bank_transactions (
      id TEXT PRIMARY KEY, sender_id TEXT, sender_name TEXT, recipient_id TEXT,
      recipient_name TEXT, amount INTEGER, type TEXT, category TEXT, title TEXT,
      note TEXT, status TEXT, reference_code TEXT, date TEXT, source_type TEXT,
      source_id TEXT, actor_id TEXT, actor_name TEXT, school_year TEXT,
      idempotency_key TEXT, created_at TEXT
    );
  `);
  db.prepare('INSERT INTO users (id, username, full_name, house) VALUES (?, ?, ?, ?)').run('user-1', 'tester', 'Testowy Adept', house);
  db.prepare('INSERT INTO houses (id) VALUES (?)').run('ravnheim');
  initPointsService(db);
  initSkirnirService(db);
  initRunicDuelService(db);
  return db;
}

test('data pojedynku używa strefy Europe/Warsaw', () => {
  assert.equal(warsawDateKey(new Date('2026-08-28T22:30:00Z')), '2026-08-29');
});

test('powtórzenie actionId jest idempotentne', () => {
  const db = setup();
  const started = startRunicDuel({ userId: 'user-1', clientRunId: 'client-run-0001', mode: 'training', opponentId: 'yrsa' });
  const args = {
    user: { id: 'user-1', username: 'tester', house: 'ravnheim' },
    runId: started.run.runId,
    actionId: 'action-0001',
    turnNumber: 1,
    playerAction: 'isa'
  };
  const first = submitRunicDuelAction(args);
  const second = submitRunicDuelAction(args);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.deepEqual(second.turn.state, first.turn.state);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM runic_duel_turns').get().count, 1);
  db.close();
});

test('czwarta rozpoczęta próba dnia zostaje treningiem', () => {
  const db = setup();
  const user = { id: 'user-1', username: 'tester', house: 'ravnheim' };
  for (let index = 0; index < 3; index += 1) {
    const started = startRunicDuel({ userId: user.id, clientRunId: `client-reward-000${index}`, mode: 'reward' });
    submitRunicDuelAction({
      user,
      runId: started.run.runId,
      actionId: `action-reward-000${index}`,
      turnNumber: 1,
      playerAction: 'isa'
    });
    abandonRunicDuel(user.id, started.run.runId);
  }
  const fourth = startRunicDuel({ userId: user.id, clientRunId: 'client-reward-0004', mode: 'reward' });
  assert.equal(fourth.run.mode, 'training');
  const status = getRunicDuelStatus(user.id);
  assert.equal(status.attemptsUsed, 3);
  assert.equal(status.canStartReward, false);
  db.close();
});

test('porzucenie pustej sesji nie zużywa próby', () => {
  const db = setup();
  const started = startRunicDuel({ userId: 'user-1', clientRunId: 'client-empty-0001', mode: 'reward' });
  abandonRunicDuel('user-1', started.run.runId);
  assert.equal(getRunicDuelStatus('user-1').attemptsUsed, 0);
  db.close();
});

test('zwycięstwo wypłaca nagrodę raz, a duplikat akcji nie dopisuje transakcji', () => {
  const db = setup();
  const user = { id: 'user-1', username: 'tester', fullName: 'Testowy Adept', house: 'ravnheim' };
  const started = startRunicDuel({ userId: user.id, clientRunId: 'client-payout-001', mode: 'reward' });
  const state = started.run.state;
  state.enemy.hp = 18;
  state.player.focus = 100;
  db.prepare("UPDATE runic_duel_runs SET state_json = ?, current_enemy_intent = 'isa' WHERE run_id = ?")
    .run(JSON.stringify(state), started.run.runId);
  const args = { user, runId: started.run.runId, actionId: 'action-payout-001', turnNumber: 1, playerAction: 'tyr' };
  const first = submitRunicDuelAction(args);
  const second = submitRunicDuelAction(args);
  assert.equal(first.run.rewarded, true);
  assert.deepEqual(first.run.reward, { housePoints: 12, skirniry: 10 });
  assert.equal(second.duplicate, true);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM point_transactions').get().count, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM bank_transactions').get().count, 1);
  assert.deepEqual(db.prepare('SELECT points, currency FROM users WHERE id = ?').get(user.id), { points: 12, currency: 10 });
  db.close();
});

test('użytkownik bez Zakonu dostaje Skirniry, ale nie punkty fikcyjnego Zakonu', () => {
  const db = setup(null);
  const user = { id: 'user-1', username: 'tester', fullName: 'Testowy Adept', house: null };
  const started = startRunicDuel({ userId: user.id, clientRunId: 'client-no-house-01', mode: 'reward' });
  const state = started.run.state;
  state.enemy.hp = 18;
  state.player.focus = 100;
  db.prepare("UPDATE runic_duel_runs SET state_json = ?, current_enemy_intent = 'isa' WHERE run_id = ?")
    .run(JSON.stringify(state), started.run.runId);
  const result = submitRunicDuelAction({ user, runId: started.run.runId, actionId: 'action-no-house-01', turnNumber: 1, playerAction: 'tyr' });
  assert.equal(result.run.rewarded, true);
  assert.deepEqual(result.run.reward, { housePoints: 0, skirniry: 10 });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM point_transactions').get().count, 0);
  assert.equal(db.prepare('SELECT currency FROM users WHERE id = ?').get(user.id).currency, 10);
  db.close();
});
