import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { initPointsService } from './services/pointsService.js';
import { initSkirnirService } from './services/skirnirService.js';
import {
  initBestiaryService,
  createSession,
  getSessionState,
  advanceEncounter,
  submitIdentify,
  submitCountermeasure,
  completeSession,
  abandonSession,
  getUserStatus,
  BEAST_CATALOG,
  DAILY_REWARD_LIMIT,
  MAX_WARDS,
  CHALLENGE_VERSION,
  warsawDateKey
} from './services/bestiaryService.js';

// ── Setup helpers ─────────────────────────────────────────────────────────────

function makeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT, full_name TEXT, house TEXT,
      points INTEGER DEFAULT 0, xp INTEGER DEFAULT 0, currency INTEGER DEFAULT 0,
      status TEXT DEFAULT 'approved', role TEXT DEFAULT 'student'
    );
    CREATE TABLE IF NOT EXISTS houses (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS school_config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY, student_id TEXT, student_name TEXT, house TEXT, points INTEGER,
      source TEXT, source_type TEXT, source_id TEXT, lesson_id TEXT, professor_id TEXT,
      professor_name TEXT, actor_id TEXT, actor_name TEXT, date TEXT, comment TEXT,
      is_revoked INTEGER DEFAULT 0, school_year TEXT DEFAULT '', idempotency_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY, user_id TEXT UNIQUE, user_name TEXT, vault_number TEXT,
      vault_tier TEXT, balance INTEGER DEFAULT 0, security_level TEXT, rune_seal TEXT,
      guardian TEXT, interest_rate REAL DEFAULT 0, opened_at TEXT
    );
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY, sender_id TEXT, sender_name TEXT, recipient_id TEXT,
      recipient_name TEXT, amount INTEGER, type TEXT, category TEXT, title TEXT,
      note TEXT, status TEXT, reference_code TEXT, date TEXT, source_type TEXT DEFAULT '',
      source_id TEXT DEFAULT '', actor_id TEXT DEFAULT '', actor_name TEXT DEFAULT '',
      school_year TEXT DEFAULT '', idempotency_key TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

let _clockMs = null;
function fakeClock(ms) { _clockMs = ms; }
function advanceClock(deltaMs) { _clockMs = (_clockMs || Date.now()) + deltaMs; }
function realClock() { _clockMs = null; }

function setup({ house = 'ravnheim', nowFn } = {}) {
  const db = new Database(':memory:');
  makeSchema(db);
  db.prepare('INSERT INTO users (id, username, full_name, house) VALUES (?, ?, ?, ?)').run('user-1', 'tester', 'Testowy Adept', house);
  db.prepare('INSERT INTO houses (id) VALUES (?)').run('ravnheim');
  db.prepare('INSERT INTO school_config (key, value) VALUES (?,?)').run('school_year', 'XIX');
  initPointsService(db);
  initSkirnirService(db);
  const clock = nowFn || (() => new Date());
  initBestiaryService(db, { nowFn: clock });
  return db;
}

// Run a full encounter with controlled timing
function runEncounter({ sessionId, userId, db, now, identifyCorrect = true, counterCorrect = true }) {
  const advRes = advanceEncounter(sessionId, userId);
  assert.ok(advRes.ok, 'advance countdown->observe failed: ' + JSON.stringify(advRes));

  const state = getSessionState(sessionId, userId);
  const enc = state.encounters.find(e => e.encounterIndex === state.session.currentEncounter);
  assert.ok(enc, 'no encounter found');

  const identifyOptions = enc.identifyOptions;
  const correctBeastId = identifyOptions.find(id => {
    const encs = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?')
      .get(sessionId, state.session.currentEncounter);
    return encs.beast_id === id;
  });
  const wrongBeastId = identifyOptions.find(id => id !== correctBeastId);

  const idRes = submitIdentify({
    sessionId,
    userId,
    actionId: `id-${Math.random()}`,
    choiceId: identifyCorrect ? correctBeastId : wrongBeastId
  });
  assert.ok(idRes.ok || idRes.duplicate, 'identify failed: ' + JSON.stringify(idRes));

  // Get correct counter option
  const freshState = getSessionState(sessionId, userId);
  const freshEnc = freshState.encounters.find(e => e.encounterIndex === freshState.session.currentEncounter);
  const correctCm = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?')
    .get(sessionId, freshState.session.currentEncounter);
  const correctCounterId = {
    frost_drake: 'ignis_furor',
    shadow_wolf: 'lumos_borealis',
    ice_jotun: 'thurisaz',
    kraken: 'tiwaz'
  }[correctCm.beast_id];

  const counterOptions = freshEnc?.counterOptions?.map(o => o.id || o) || [];
  const wrongCounterId = counterOptions.find(id => id !== correctCounterId);

  const ctRes = submitCountermeasure({
    sessionId,
    userId,
    actionId: `ct-${Math.random()}`,
    choiceId: counterCorrect ? correctCounterId : (wrongCounterId || counterOptions[0])
  });
  assert.ok(ctRes.ok || ctRes.duplicate, 'countermeasure failed: ' + JSON.stringify(ctRes));

  return { idRes, ctRes };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('1. Maksymalny wynik czterech bezbłędnych spotkań wynosi dokładnie 700', () => {
  const db = setup();
  const res = createSession({ userId: 'user-1', runId: 'run-max', requestedMode: 'rewarded' });
  assert.ok(res.session, 'session not created');

  for (let i = 0; i < 4; i++) {
    runEncounter({ sessionId: 'run-max', userId: 'user-1', db });
    if (i < 3) {
      const adv = advanceEncounter('run-max', 'user-1');
      assert.ok(adv.ok);
    }
  }

  const adv = advanceEncounter('run-max', 'user-1');
  assert.ok(adv.ok);

  const result = completeSession('run-max', 'user-1');
  assert.ok(result.ok, 'complete failed: ' + JSON.stringify(result));
  assert.equal(result.score, 700, `Expected 700, got ${result.score}`);
  db.close();
});

test('2. Punktacja identyfikacji: 100/75/50/0 zależnie od czasu i poprawności', () => {
  // We need to control timing to test clue-count-based scoring
  let now = Date.now();
  const clock = () => new Date(now);
  const db = setup({ nowFn: clock });

  const res = createSession({ userId: 'user-1', runId: 'run-pts', requestedMode: 'training' });
  assert.ok(res.session);

  // advance to observe
  const adv = advanceEncounter('run-pts', 'user-1');
  assert.ok(adv.ok);

  // At t=0, only 1 clue shown → correct answer = 100 pts
  const state = getSessionState('run-pts', 'user-1');
  const enc = state.encounters.find(e => e.encounterIndex === 0);
  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-pts').beast_id;

  const idRes = submitIdentify({ sessionId: 'run-pts', userId: 'user-1', actionId: 'id-a', choiceId: correctBeastId });
  assert.ok(idRes.ok);
  assert.equal(idRes.identifyPoints, 100, `Expected 100, got ${idRes.identifyPoints}`);
  db.close();
});

test('2b. Punktacja: odpowiedź po 2. wskazówce daje 75 pkt', () => {
  let now = Date.now();
  const clock = () => new Date(now);
  const db = setup({ nowFn: clock });

  createSession({ userId: 'user-1', runId: 'run-pts2', requestedMode: 'training' });
  advanceEncounter('run-pts2', 'user-1');

  // Advance clock past 2500ms to simulate 2 clues shown
  now += 2600;

  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-pts2').beast_id;
  const idRes = submitIdentify({ sessionId: 'run-pts2', userId: 'user-1', actionId: 'id-b', choiceId: correctBeastId });
  assert.ok(idRes.ok);
  assert.equal(idRes.identifyPoints, 75, `Expected 75, got ${idRes.identifyPoints}`);
  db.close();
});

test('2c. Punktacja: odpowiedź po 3. wskazówce daje 50 pkt', () => {
  let now = Date.now();
  const clock = () => new Date(now);
  const db = setup({ nowFn: clock });

  createSession({ userId: 'user-1', runId: 'run-pts3', requestedMode: 'training' });
  advanceEncounter('run-pts3', 'user-1');
  now += 5100;

  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-pts3').beast_id;
  const idRes = submitIdentify({ sessionId: 'run-pts3', userId: 'user-1', actionId: 'id-c', choiceId: correctBeastId });
  assert.ok(idRes.ok);
  assert.equal(idRes.identifyPoints, 50, `Expected 50, got ${idRes.identifyPoints}`);
  db.close();
});

test('3. Błędna odpowiedź odbiera dokładnie jedną pieczęć', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-ward', requestedMode: 'training' });
  advanceEncounter('run-ward', 'user-1');

  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-ward').beast_id;
  const opts = JSON.parse(db.prepare('SELECT identify_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-ward').identify_options_json);
  const wrongId = opts.find(id => id !== correctBeastId);

  const idRes = submitIdentify({ sessionId: 'run-ward', userId: 'user-1', actionId: 'id-w', choiceId: wrongId });
  assert.ok(idRes.ok);
  assert.equal(idRes.wardLoss, 1);
  assert.equal(idRes.wardsRemaining, MAX_WARDS - 1);
  db.close();
});

test('3b. Timeout identyfikacji odbiera jedną pieczęć', () => {
  let now = Date.now();
  const clock = () => new Date(now);
  const db = setup({ nowFn: clock });

  createSession({ userId: 'user-1', runId: 'run-timeout', requestedMode: 'training' });
  advanceEncounter('run-timeout', 'user-1');

  // Advance past deadline + tolerance
  now += 9000 + 800;
  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-timeout').beast_id;
  const idRes = submitIdentify({ sessionId: 'run-timeout', userId: 'user-1', actionId: 'id-to', choiceId: correctBeastId });
  assert.ok(idRes.ok);
  assert.equal(idRes.isTimeout, true);
  assert.equal(idRes.wardLoss, 1);
  db.close();
});

test('4. Wynik i pieczęcie pozostają w dozwolonym zakresie', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-range', requestedMode: 'training' });

  // Run all 4 encounters with wrong answers
  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-range', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-range', 'user-1');

    const enc = db.prepare('SELECT beast_id, identify_options_json, counter_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-range', i);
    if (!enc) break;
    const opts = JSON.parse(enc.identify_options_json);
    const wrongId = opts.find(id => id !== enc.beast_id) || opts[0];

    const idRes = submitIdentify({ sessionId: 'run-range', userId: 'user-1', actionId: `id-range-${i}`, choiceId: wrongId });
    if (!idRes.ok) break;

    const sess2 = getSessionState('run-range', 'user-1');
    if (sess2.session.status !== 'active') break;

    const cOpts = JSON.parse(enc.counter_options_json);
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];
    const wrongCm = cOpts.find(id => id !== correctCm) || cOpts[0];

    const ctRes = submitCountermeasure({ sessionId: 'run-range', userId: 'user-1', actionId: `ct-range-${i}`, choiceId: wrongCm });
    if (!ctRes.ok) break;

    if (ctRes.failed) break;
    if (i < 3) {
      const adv = advanceEncounter('run-range', 'user-1');
      if (!adv.ok) break;
    }
  }

  const finalSess = db.prepare('SELECT score, wards_remaining FROM bestiary_sessions WHERE id = ?').get('run-range');
  assert.ok(finalSess.score >= 0, `score must be >=0, got ${finalSess.score}`);
  assert.ok(finalSess.score <= 700, `score must be <=700, got ${finalSess.score}`);
  assert.ok(finalSess.wards_remaining >= 0, `wards must be >=0, got ${finalSess.wards_remaining}`);
  assert.ok(finalSess.wards_remaining <= 4, `wards must be <=4, got ${finalSess.wards_remaining}`);
  db.close();
});

test('5. Ten sam actionId dla identify rozlicza się tylko raz (idempotencja)', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-idem', requestedMode: 'training' });
  advanceEncounter('run-idem', 'user-1');

  const correctBeastId = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-idem').beast_id;
  const first = submitIdentify({ sessionId: 'run-idem', userId: 'user-1', actionId: 'action-same', choiceId: correctBeastId });
  const second = submitIdentify({ sessionId: 'run-idem', userId: 'user-1', actionId: 'action-same', choiceId: correctBeastId });

  assert.ok(first.ok, 'first should succeed');
  assert.ok(second.duplicate, 'second should be duplicate');

  const sessRow = db.prepare('SELECT score, wards_remaining FROM bestiary_sessions WHERE id = ?').get('run-idem');
  // Score should only reflect one identify (correct = 100, no double)
  assert.equal(sessRow.score, 100);
  db.close();
});

test('5b. Ten sam actionId dla countermeasure jest idempotentny', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-idem2', requestedMode: 'training' });
  advanceEncounter('run-idem2', 'user-1');

  const encRow = db.prepare('SELECT beast_id, identify_options_json, counter_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-idem2');
  const correctBeast = encRow.beast_id;
  submitIdentify({ sessionId: 'run-idem2', userId: 'user-1', actionId: 'id-ok', choiceId: correctBeast });

  const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[correctBeast];
  const first = submitCountermeasure({ sessionId: 'run-idem2', userId: 'user-1', actionId: 'cm-same', choiceId: correctCm });
  const second = submitCountermeasure({ sessionId: 'run-idem2', userId: 'user-1', actionId: 'cm-same', choiceId: correctCm });

  assert.ok(first.ok, 'first countermeasure should succeed');
  assert.ok(second.duplicate, 'second should be duplicate');
  db.close();
});

test('6. Nie można wysłać odpowiedzi dla złej fazy', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-phase', requestedMode: 'training' });
  // Phase is 'countdown', not 'observe'
  const res = submitIdentify({ sessionId: 'run-phase', userId: 'user-1', actionId: 'bad-id', choiceId: 'frost_drake' });
  assert.ok(res.error, 'should error on wrong phase');
  db.close();
});

test('6b. Nie można wysłać odpowiedzi dla cudzej sesji', () => {
  const db = setup();
  db.prepare('INSERT INTO users (id, username, full_name, house) VALUES (?, ?, ?, ?)').run('user-2', 'other', 'Inny', 'ravnheim');
  createSession({ userId: 'user-1', runId: 'run-own', requestedMode: 'training' });
  advanceEncounter('run-own', 'user-1');

  const res = submitIdentify({ sessionId: 'run-own', userId: 'user-2', actionId: 'steal', choiceId: 'frost_drake' });
  assert.ok(res.forbidden, 'should be forbidden for other user');
  db.close();
});

test('6c. Nie można wybrać opcji spoza zapisanej listy', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-invalid', requestedMode: 'training' });
  advanceEncounter('run-invalid', 'user-1');

  const res = submitIdentify({ sessionId: 'run-invalid', userId: 'user-1', actionId: 'bad-choice', choiceId: 'not_a_beast' });
  assert.ok(res.error, 'should reject invalid choiceId');
  db.close();
});

test('7. Cztery spotkania zawierają cztery różne kanoniczne bestie', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-beasts', requestedMode: 'training' });

  const encs = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? ORDER BY encounter_index').all('run-beasts');
  assert.equal(encs.length, 4, 'should have 4 encounters');

  const ids = encs.map(e => e.beast_id);
  const unique = new Set(ids);
  assert.equal(unique.size, 4, `Expected 4 unique beasts, got ${unique.size}: ${ids.join(', ')}`);

  const canonicalIds = new Set(BEAST_CATALOG.map(b => b.id));
  for (const id of ids) {
    assert.ok(canonicalIds.has(id), `Unknown beast id: ${id}`);
  }
  db.close();
});

test('8. Wznowienie zwraca te same warianty wskazówek i kolejność opcji', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-resume', requestedMode: 'training' });
  advanceEncounter('run-resume', 'user-1');

  const state1 = getSessionState('run-resume', 'user-1');
  const state2 = getSessionState('run-resume', 'user-1');

  assert.deepEqual(
    state1.encounters.map(e => ({ beast: e.beastId || null, opts: e.identifyOptions })),
    state2.encounters.map(e => ({ beast: e.beastId || null, opts: e.identifyOptions })),
    'Options order should be stable across resumes'
  );

  const enc1 = db.prepare('SELECT clue_set_id, identify_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-resume');
  const enc2 = db.prepare('SELECT clue_set_id, identify_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-resume');
  assert.equal(enc1.clue_set_id, enc2.clue_set_id);
  assert.equal(enc1.identify_options_json, enc2.identify_options_json);
  db.close();
});

test('9. Czwarta próba w dniu Europe/Warsaw jest treningowa', () => {
  const db = setup();
  const today = warsawDateKey();

  // Create 3 rewarded sessions (simulate completion)
  for (let i = 0; i < 3; i++) {
    db.prepare(`
      INSERT INTO bestiary_sessions (id, user_id, mode, status, date_warsaw, challenge_version, reward_slot_reserved, current_phase)
      VALUES (?, 'user-1', 'rewarded', 'completed', ?, 1, 1, 'finished')
    `).run(`old-run-${i}`, today);
  }

  const res = createSession({ userId: 'user-1', runId: 'run-4th', requestedMode: 'rewarded' });
  assert.ok(res.session);
  assert.equal(res.session.mode, 'training', `Expected training, got ${res.session.mode}`);
  assert.equal(res.session.rewardSlotReserved, false, 'Should not reserve slot for 4th attempt');
  db.close();
});

test('10. Dwa równoczesne starty przy ostatnim wolnym slocie tworzą najwyżej jedną próbę premiowaną', () => {
  const db = setup();
  const today = warsawDateKey();

  // 2 slots already used
  for (let i = 0; i < 2; i++) {
    db.prepare(`
      INSERT INTO bestiary_sessions (id, user_id, mode, status, date_warsaw, challenge_version, reward_slot_reserved, current_phase)
      VALUES (?, 'user-1', 'rewarded', 'completed', ?, 1, 1, 'finished')
    `).run(`old-concurrent-${i}`, today);
  }

  // Simulate two concurrent starts by calling createSession twice with different runIds
  const r1 = createSession({ userId: 'user-1', runId: 'run-c1', requestedMode: 'rewarded' });
  const r2 = createSession({ userId: 'user-1', runId: 'run-c2', requestedMode: 'rewarded' });

  // One should succeed as rewarded, the other should need resume or be training
  const modes = [r1, r2].map(r => r.session?.mode || r.needsResume ? 'training_or_resume' : 'unknown');

  const rewardedCount = db.prepare(`
    SELECT COUNT(*) AS cnt FROM bestiary_sessions
    WHERE user_id = 'user-1' AND date_warsaw = ? AND reward_slot_reserved = 1
  `).get(today)?.cnt || 0;

  assert.ok(rewardedCount <= 3, `Should have at most 3 rewarded slots, got ${rewardedCount}`);
  db.close();
});

test('11. failed/abandoned/expired/training dają 0/0 nagród', () => {
  const db = setup();

  for (const status of ['failed', 'abandoned', 'expired']) {
    db.prepare(`
      INSERT INTO bestiary_sessions (id, user_id, mode, status, date_warsaw, challenge_version, reward_slot_reserved, current_phase, wards_remaining)
      VALUES (?, 'user-1', 'rewarded', ?, ?, 1, 1, 'finished', ?)
    `).run(`run-${status}`, status, warsawDateKey(), status === 'failed' ? 0 : 4);

    // For failed: try to complete (should return duplicate/no reward)
    const res = completeSession(`run-${status}`, 'user-1');
    // Should either be an error or return 0 reward
    if (res.ok) {
      assert.equal(res.rewardHousePoints, 0, `${status}: expected 0 house points`);
      assert.equal(res.rewardSkirnirs, 0, `${status}: expected 0 skirnirs`);
    }
  }

  // Training mode: complete a full training session
  createSession({ userId: 'user-1', runId: 'run-training-check', requestedMode: 'training' });
  // All 4 encounters, correct answers
  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-training-check', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-training-check', 'user-1');

    const enc = db.prepare('SELECT beast_id, identify_options_json, counter_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-training-check', i);
    if (!enc) break;

    submitIdentify({ sessionId: 'run-training-check', userId: 'user-1', actionId: `id-tr-${i}`, choiceId: enc.beast_id });
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];
    const ctRes = submitCountermeasure({ sessionId: 'run-training-check', userId: 'user-1', actionId: `ct-tr-${i}`, choiceId: correctCm });
    if (!ctRes.ok || ctRes.failed) break;
    if (i < 3) advanceEncounter('run-training-check', 'user-1');
  }

  const adv = advanceEncounter('run-training-check', 'user-1');
  const trainResult = completeSession('run-training-check', 'user-1');
  if (trainResult.ok) {
    assert.equal(trainResult.rewardHousePoints, 0, 'Training: expected 0 house points');
    assert.equal(trainResult.rewardSkirnirs, 0, 'Training: expected 0 skirnirs');
  }
  db.close();
});

test('12. Powtórne complete zwraca identyczny rezultat bez podwójnej wypłaty', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-dup', requestedMode: 'rewarded' });

  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-dup', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-dup', 'user-1');

    const enc = db.prepare('SELECT beast_id, identify_options_json, counter_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-dup', i);
    if (!enc) break;
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];

    submitIdentify({ sessionId: 'run-dup', userId: 'user-1', actionId: `id-dup-${i}`, choiceId: enc.beast_id });
    const ct = submitCountermeasure({ sessionId: 'run-dup', userId: 'user-1', actionId: `ct-dup-${i}`, choiceId: correctCm });
    if (!ct.ok || ct.failed) break;
    if (i < 3) advanceEncounter('run-dup', 'user-1');
  }

  advanceEncounter('run-dup', 'user-1');

  const first = completeSession('run-dup', 'user-1');
  const second = completeSession('run-dup', 'user-1');

  assert.ok(first.ok);
  assert.ok(second.ok);
  assert.ok(second.duplicate, 'second complete should be marked duplicate');
  assert.equal(first.score, second.score, 'score should be same');
  assert.equal(first.rewardHousePoints, second.rewardHousePoints, 'house points should be same');
  assert.equal(first.rewardSkirnirs, second.rewardSkirnirs, 'skirnirs should be same');

  // Check no double points transaction
  const txCount = db.prepare("SELECT COUNT(*) AS cnt FROM point_transactions WHERE idempotency_key = ?").get(`bestiary:run-dup:pts`)?.cnt || 0;
  assert.ok(txCount <= 1, `Expected at most 1 points tx, got ${txCount}`);
  db.close();
});

test('13. Użytkownik bez Zakonu otrzymuje Skirniry, lecz 0 punktów Zakonu', () => {
  const db = setup({ house: null }); // no house
  db.prepare('UPDATE users SET house = NULL WHERE id = ?').run('user-1');

  createSession({ userId: 'user-1', runId: 'run-nohouse', requestedMode: 'rewarded' });

  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-nohouse', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-nohouse', 'user-1');

    const enc = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-nohouse', i);
    if (!enc) break;
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];

    submitIdentify({ sessionId: 'run-nohouse', userId: 'user-1', actionId: `id-nh-${i}`, choiceId: enc.beast_id });
    const ct = submitCountermeasure({ sessionId: 'run-nohouse', userId: 'user-1', actionId: `ct-nh-${i}`, choiceId: correctCm });
    if (!ct.ok || ct.failed) break;
    if (i < 3) advanceEncounter('run-nohouse', 'user-1');
  }
  advanceEncounter('run-nohouse', 'user-1');
  const result = completeSession('run-nohouse', 'user-1');

  assert.ok(result.ok);
  assert.equal(result.rewardHousePoints, 0, 'No house → 0 house points');
  // Skirniry should be awarded if score >= 250
  if (result.score >= 250) {
    assert.ok(result.rewardSkirnirs > 0, `Score ${result.score} >= 250, expected skirnirs > 0`);
  }

  // No point transaction for this user
  const ptCount = db.prepare("SELECT COUNT(*) AS cnt FROM point_transactions WHERE student_id = ?").get('user-1')?.cnt || 0;
  assert.equal(ptCount, 0, 'No house → no point transactions');
  db.close();
});

test('14. Brak Zakonu nigdy nie przypisuje punktów domyślnemu Zakonowi', () => {
  const db = setup({ house: null });
  db.prepare('UPDATE users SET house = NULL WHERE id = ?').run('user-1');

  createSession({ userId: 'user-1', runId: 'run-nohouse2', requestedMode: 'rewarded' });

  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-nohouse2', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-nohouse2', 'user-1');
    const enc = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-nohouse2', i);
    if (!enc) break;
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];
    submitIdentify({ sessionId: 'run-nohouse2', userId: 'user-1', actionId: `id-nh2-${i}`, choiceId: enc.beast_id });
    const ct = submitCountermeasure({ sessionId: 'run-nohouse2', userId: 'user-1', actionId: `ct-nh2-${i}`, choiceId: correctCm });
    if (!ct.ok || ct.failed) break;
    if (i < 3) advanceEncounter('run-nohouse2', 'user-1');
  }
  advanceEncounter('run-nohouse2', 'user-1');
  completeSession('run-nohouse2', 'user-1');

  const txWithHouse = db.prepare("SELECT * FROM point_transactions WHERE house = 'ravnheim' OR house IS NOT NULL").all();
  assert.equal(txWithHouse.length, 0, 'No house points should be assigned to any house when user has no house');
  db.close();
});

test('15. Idempotentne complete nie pozostawia częściowej nagrody', () => {
  // Test that repeated completes don't double-pay (covers the spirit of atomicity)
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-atom', requestedMode: 'rewarded' });

  for (let i = 0; i < 4; i++) {
    const state = getSessionState('run-atom', 'user-1');
    if (state.session.status !== 'active') break;
    if (state.session.currentPhase === 'countdown') advanceEncounter('run-atom', 'user-1');
    const enc = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-atom', i);
    if (!enc) break;
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];
    submitIdentify({ sessionId: 'run-atom', userId: 'user-1', actionId: `id-at-${i}`, choiceId: enc.beast_id });
    const ct = submitCountermeasure({ sessionId: 'run-atom', userId: 'user-1', actionId: `ct-at-${i}`, choiceId: correctCm });
    if (!ct.ok || ct.failed) break;
    if (i < 3) advanceEncounter('run-atom', 'user-1');
  }
  advanceEncounter('run-atom', 'user-1');

  // Call complete many times
  const r1 = completeSession('run-atom', 'user-1');
  const r2 = completeSession('run-atom', 'user-1');
  const r3 = completeSession('run-atom', 'user-1');

  // All should return same score
  assert.equal(r1.score, r2.score);
  assert.equal(r1.score, r3.score);

  // Only 1 point transaction (idempotency key enforces this)
  const ptCount = db.prepare("SELECT COUNT(*) AS cnt FROM point_transactions").get()?.cnt || 0;
  assert.ok(ptCount <= 1, `Expected at most 1 pt tx, got ${ptCount}`);
  db.close();
});

test('16. Pieczęć badacza odblokowuje się tylko raz i tylko po bezbłędnym spotkaniu', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-seal', requestedMode: 'rewarded' });

  // First encounter: correct both
  const state1 = getSessionState('run-seal', 'user-1');
  advanceEncounter('run-seal', 'user-1');
  const enc0 = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 0').get('run-seal');
  const correctCm0 = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc0.beast_id];
  submitIdentify({ sessionId: 'run-seal', userId: 'user-1', actionId: 'id-s0', choiceId: enc0.beast_id });
  submitCountermeasure({ sessionId: 'run-seal', userId: 'user-1', actionId: 'ct-s0', choiceId: correctCm0 });

  advanceEncounter('run-seal', 'user-1'); // encounter_result → countdown enc1
  advanceEncounter('run-seal', 'user-1'); // countdown → observe enc1
  // Second encounter: wrong identify
  const enc1 = db.prepare('SELECT beast_id, identify_options_json FROM bestiary_encounters WHERE session_id = ? AND encounter_index = 1').get('run-seal');
  const opts1 = JSON.parse(enc1.identify_options_json);
  const wrong1 = opts1.find(id => id !== enc1.beast_id);
  submitIdentify({ sessionId: 'run-seal', userId: 'user-1', actionId: 'id-s1', choiceId: wrong1 });
  const correctCm1 = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc1.beast_id];
  submitCountermeasure({ sessionId: 'run-seal', userId: 'user-1', actionId: 'ct-s1', choiceId: correctCm1 });

  // Advance from encounter_result (enc1) to encounter 2
  advanceEncounter('run-seal', 'user-1');

  // Run encounters 2 and 3 (correct both)
  for (let i = 2; i < 4; i++) {
    // advance countdown → observe
    const adv = advanceEncounter('run-seal', 'user-1');
    assert.ok(adv.ok, `advance to observe failed at enc${i}: ${JSON.stringify(adv)}`);

    const enc = db.prepare('SELECT beast_id FROM bestiary_encounters WHERE session_id = ? AND encounter_index = ?').get('run-seal', i);
    assert.ok(enc, `enc${i} missing`);
    const correctCm = { frost_drake: 'ignis_furor', shadow_wolf: 'lumos_borealis', ice_jotun: 'thurisaz', kraken: 'tiwaz' }[enc.beast_id];

    const id = submitIdentify({ sessionId: 'run-seal', userId: 'user-1', actionId: `id-s${i}`, choiceId: enc.beast_id });
    assert.ok(id.ok, `identify enc${i} failed: ${JSON.stringify(id)}`);
    const ct = submitCountermeasure({ sessionId: 'run-seal', userId: 'user-1', actionId: `ct-s${i}`, choiceId: correctCm });
    assert.ok(ct.ok, `counter enc${i} failed: ${JSON.stringify(ct)}`);
    if (ct.failed) break;

    if (i < 3) {
      const adv2 = advanceEncounter('run-seal', 'user-1'); // encounter_result → countdown
      assert.ok(adv2.ok, `advance after enc${i} failed: ${JSON.stringify(adv2)}`);
    }
  }
  // advance encounter_result → finished
  advanceEncounter('run-seal', 'user-1');
  const result = completeSession('run-seal', 'user-1');

  // Only enc0 was flawless (both correct)
  const discoveries = db.prepare('SELECT beast_id FROM bestiary_discoveries WHERE user_id = ?').all('user-1');
  // enc0 should be unlocked, enc1 should not (wrong identify)
  assert.ok(discoveries.some(d => d.beast_id === enc0.beast_id), 'enc0 beast should be discovered');
  assert.ok(!discoveries.some(d => d.beast_id === enc1.beast_id), 'enc1 beast should NOT be discovered (wrong identify)');

  // Double-complete should not add more discoveries
  completeSession('run-seal', 'user-1');
  const discoveries2 = db.prepare('SELECT COUNT(*) AS cnt FROM bestiary_discoveries WHERE user_id = ?').get('user-1');
  assert.equal(discoveries2.cnt, discoveries.length, 'No new discoveries on second complete');
  db.close();
});

test('17. Sesja wygasa po 15 minutach i nie daje nagrody', () => {
  let now = Date.now();
  const clock = () => new Date(now);
  const db = setup({ nowFn: clock });

  createSession({ userId: 'user-1', runId: 'run-expire', requestedMode: 'rewarded' });

  // Advance time past 15 minutes
  now += 15 * 60 * 1000 + 1000;

  // Status check should expire the session
  getUserStatus('user-1');

  const sessRow = db.prepare('SELECT status FROM bestiary_sessions WHERE id = ?').get('run-expire');
  assert.equal(sessRow.status, 'expired', `Expected expired, got ${sessRow.status}`);

  const res = completeSession('run-expire', 'user-1');
  if (res.ok) {
    assert.equal(res.rewardHousePoints, 0, 'Expired session should give 0 house points');
    assert.equal(res.rewardSkirnirs, 0, 'Expired session should give 0 skirnirs');
  }
  db.close();
});

test('18. Odpowiedzi API nie ujawniają flag poprawności przed rozliczeniem', () => {
  const db = setup();
  createSession({ userId: 'user-1', runId: 'run-noleak', requestedMode: 'training' });
  advanceEncounter('run-noleak', 'user-1');

  const state = getSessionState('run-noleak', 'user-1');
  const enc = state.encounters[0];

  // Should not expose correct beast or correct countermeasure ID
  const encStr = JSON.stringify(enc);
  assert.ok(!encStr.includes('"isCorrect"'), 'should not include isCorrect');
  assert.ok(!encStr.includes('"correct_id"'), 'should not include correct_id');

  // counterOptions should be an array of {id, label} without isCorrect
  assert.ok(Array.isArray(enc.counterOptions), 'counterOptions should be array');
  for (const opt of enc.counterOptions) {
    assert.ok(!Object.prototype.hasOwnProperty.call(opt, 'isCorrect'), 'option should not have isCorrect');
  }

  // identifyAnswered should be false, beastId should not be exposed
  assert.equal(enc.identifyAnswered, false);
  assert.ok(!Object.prototype.hasOwnProperty.call(enc, 'beastId') || enc.beastId === undefined, 'beastId should not be exposed before identification');
  db.close();
});
