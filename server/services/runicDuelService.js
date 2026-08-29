import { randomUUID } from 'crypto';
import { awardPoints } from './pointsService.js';
import { credit as creditSkirnir } from './skirnirService.js';
import {
  RUNIC_DUEL_OPPONENTS,
  RUNIC_DUEL_RULES_VERSION,
  chooseEnemyAction,
  computeRunicDuelReward,
  createInitialDuelState,
  featuredOpponentForDate,
  resolveDuelTurn
} from '../../src/game/runicDuelRules.js';

let _db;

export const RUNIC_DUEL_DAILY_ATTEMPT_LIMIT = 3;
const ACTIVE_TIMEOUT_MS = 15 * 60 * 1000;
const EMPTY_TIMEOUT_MS = 5 * 60 * 1000;

export function warsawDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

function nowIso(date = new Date()) {
  return date.toISOString();
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function publicTurn(row) {
  return {
    turnNumber: row.turn_number,
    actionId: row.action_id,
    playerAction: row.player_action,
    enemyAction: row.enemy_action,
    events: parseJson(row.events_json, []),
    state: parseJson(row.state_after_json, null)
  };
}

function publicRun(row) {
  if (!row) return null;
  const state = parseJson(row.state_json, createInitialDuelState());
  const opponent = RUNIC_DUEL_OPPONENTS[row.opponent_id];
  return {
    runId: row.run_id,
    clientRunId: row.client_run_id,
    dateKey: row.date_key,
    mode: row.mode,
    status: row.status,
    rulesVersion: row.rules_version,
    opponentId: row.opponent_id,
    opponent,
    attemptReserved: !!row.attempt_reserved,
    turnNumber: row.turn_number,
    currentEnemyIntent: row.current_enemy_intent || null,
    state,
    result: row.result || null,
    winReason: row.win_reason || '',
    score: row.score || 0,
    rank: row.rank || '',
    rewarded: !!row.rewarded,
    rewardEligible: !!row.reward_eligible,
    rewardReason: row.reward_reason || '',
    reward: {
      housePoints: row.reward_points || 0,
      skirniry: row.reward_skirnirs || 0
    },
    startedAt: row.started_at,
    lastActionAt: row.last_action_at,
    completedAt: row.completed_at
  };
}

function getRunRow(runId, userId) {
  return _db.prepare('SELECT * FROM runic_duel_runs WHERE run_id = ? AND user_id = ?').get(runId, userId);
}

function expireStaleRuns(userId, date = new Date()) {
  const active = _db.prepare("SELECT * FROM runic_duel_runs WHERE user_id = ? AND status = 'active'").all(userId);
  const timestamp = date.getTime();
  const update = _db.prepare("UPDATE runic_duel_runs SET status = 'abandoned', result = 'abandoned', win_reason = 'timeout', reward_reason = 'Sesja wygasła.', completed_at = ? WHERE run_id = ?");
  for (const run of active) {
    const reference = Date.parse(run.last_action_at || run.started_at);
    const timeout = run.action_count > 0 ? ACTIVE_TIMEOUT_MS : EMPTY_TIMEOUT_MS;
    if (Number.isFinite(reference) && timestamp - reference > timeout) update.run(nowIso(date), run.run_id);
  }
}

function dailyUsage(userId, dateKey) {
  const attemptsUsed = _db.prepare(
    'SELECT COUNT(*) AS count FROM runic_duel_runs WHERE user_id = ? AND date_key = ? AND attempt_reserved = 1'
  ).get(userId, dateKey)?.count || 0;
  const rewardClaimed = !!_db.prepare(
    'SELECT 1 FROM runic_duel_runs WHERE user_id = ? AND date_key = ? AND rewarded = 1 LIMIT 1'
  ).get(userId, dateKey);
  return { attemptsUsed, rewardClaimed };
}

function historyForUser(userId) {
  return _db.prepare(`
    SELECT run_id, opponent_id, mode, status, result, score, rank, rewarded,
           reward_points, reward_skirnirs, completed_at
      FROM runic_duel_runs
     WHERE user_id = ? AND status != 'active'
     ORDER BY completed_at DESC
     LIMIT 5
  `).all(userId).map((row) => ({
    runId: row.run_id,
    opponentId: row.opponent_id,
    opponentName: RUNIC_DUEL_OPPONENTS[row.opponent_id]?.name || row.opponent_id,
    mode: row.mode,
    status: row.status,
    result: row.result,
    score: row.score || 0,
    rank: row.rank || '',
    rewarded: !!row.rewarded,
    reward: { housePoints: row.reward_points || 0, skirniry: row.reward_skirnirs || 0 },
    completedAt: row.completed_at
  }));
}

export function initRunicDuelService(db) {
  _db = db;
  db.exec(`
    CREATE TABLE IF NOT EXISTS runic_duel_runs (
      run_id TEXT PRIMARY KEY,
      client_run_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date_key TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('reward', 'training')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned', 'invalid')),
      rules_version TEXT NOT NULL,
      seed TEXT NOT NULL,
      opponent_id TEXT NOT NULL,
      attempt_reserved INTEGER NOT NULL DEFAULT 0,
      action_count INTEGER NOT NULL DEFAULT 0,
      turn_number INTEGER NOT NULL DEFAULT 1,
      current_enemy_intent TEXT DEFAULT '',
      state_json TEXT NOT NULL,
      result TEXT DEFAULT '',
      win_reason TEXT DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0,
      rank TEXT DEFAULT '',
      rewarded INTEGER NOT NULL DEFAULT 0,
      reward_eligible INTEGER NOT NULL DEFAULT 0,
      reward_reason TEXT DEFAULT '',
      reward_points INTEGER NOT NULL DEFAULT 0,
      reward_skirnirs INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      first_action_at TEXT DEFAULT '',
      last_action_at TEXT DEFAULT '',
      completed_at TEXT DEFAULT '',
      UNIQUE(user_id, client_run_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS runic_duel_turns (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      action_id TEXT NOT NULL,
      player_action TEXT NOT NULL,
      enemy_action TEXT NOT NULL,
      ai_decision_reason TEXT DEFAULT '',
      events_json TEXT NOT NULL,
      state_before_json TEXT NOT NULL,
      state_after_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(run_id, turn_number),
      UNIQUE(run_id, action_id),
      FOREIGN KEY(run_id) REFERENCES runic_duel_runs(run_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_rdr_user_date ON runic_duel_runs(user_id, date_key);
    CREATE INDEX IF NOT EXISTS idx_rdr_active ON runic_duel_runs(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_rdt_run ON runic_duel_turns(run_id, turn_number);
  `);
}

export function getRunicDuelStatus(userId, date = new Date()) {
  expireStaleRuns(userId, date);
  const dateKey = warsawDateKey(date);
  const usage = dailyUsage(userId, dateKey);
  const active = _db.prepare(
    "SELECT * FROM runic_duel_runs WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1"
  ).get(userId);
  const record = _db.prepare(
    "SELECT MAX(score) AS score FROM runic_duel_runs WHERE user_id = ? AND result = 'player_win'"
  ).get(userId)?.score || 0;

  return {
    dateKey,
    featuredOpponentId: featuredOpponentForDate(dateKey),
    featuredOpponent: RUNIC_DUEL_OPPONENTS[featuredOpponentForDate(dateKey)],
    attemptsUsed: usage.attemptsUsed,
    attemptsLimit: RUNIC_DUEL_DAILY_ATTEMPT_LIMIT,
    rewardClaimed: usage.rewardClaimed,
    canStartReward: usage.attemptsUsed < RUNIC_DUEL_DAILY_ATTEMPT_LIMIT && !usage.rewardClaimed,
    activeRun: publicRun(active),
    record,
    history: historyForUser(userId)
  };
}

export function startRunicDuel({ userId, clientRunId, mode = 'training', opponentId = '', date = new Date() }) {
  if (!_db) throw new Error('Serwis Runicznego Kręgu nie został zainicjalizowany.');
  if (!userId || typeof clientRunId !== 'string' || clientRunId.length < 8 || clientRunId.length > 120) {
    return { error: 'Nieprawidłowy identyfikator pojedynku.', code: 400 };
  }
  if (!['reward', 'training'].includes(mode)) return { error: 'Nieprawidłowy tryb pojedynku.', code: 400 };
  expireStaleRuns(userId, date);

  const duplicate = _db.prepare('SELECT * FROM runic_duel_runs WHERE user_id = ? AND client_run_id = ?').get(userId, clientRunId);
  if (duplicate) return { resumed: true, run: publicRun(duplicate) };

  const active = _db.prepare("SELECT * FROM runic_duel_runs WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1").get(userId);
  if (active) return { resumed: true, run: publicRun(active) };

  const dateKey = warsawDateKey(date);
  const usage = dailyUsage(userId, dateKey);
  const rewardAllowed = mode === 'reward' && usage.attemptsUsed < RUNIC_DUEL_DAILY_ATTEMPT_LIMIT && !usage.rewardClaimed;
  const effectiveMode = rewardAllowed ? 'reward' : 'training';
  const selectedOpponent = effectiveMode === 'reward'
    ? featuredOpponentForDate(dateKey)
    : (RUNIC_DUEL_OPPONENTS[opponentId] ? opponentId : featuredOpponentForDate(dateKey));
  const state = createInitialDuelState();
  const seed = randomUUID();
  const currentEnemyIntent = chooseEnemyAction({ state, opponentId: selectedOpponent, seed, playerHistory: [] });
  const runId = randomUUID();
  const timestamp = nowIso(date);

  _db.prepare(`
    INSERT INTO runic_duel_runs (
      run_id, client_run_id, user_id, date_key, mode, rules_version, seed,
      opponent_id, turn_number, current_enemy_intent, state_json,
      reward_eligible, reward_reason, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `).run(
    runId, clientRunId, userId, dateKey, effectiveMode, RUNIC_DUEL_RULES_VERSION, seed,
    selectedOpponent, currentEnemyIntent, JSON.stringify(state), rewardAllowed ? 1 : 0,
    rewardAllowed ? '' : (mode === 'reward' ? 'Limit nagród został wykorzystany — pojedynek treningowy.' : 'Tryb treningowy.'),
    timestamp
  );

  return { resumed: false, downgradedToTraining: mode === 'reward' && !rewardAllowed, run: publicRun(getRunRow(runId, userId)) };
}

function rewardCompletedRun({ row, state, user }) {
  const baseReward = computeRunicDuelReward(state.score);
  if (row.mode !== 'reward' || !row.attempt_reserved) {
    return { rewarded: false, rewardReason: 'Pojedynek treningowy.', housePoints: 0, skirniry: 0 };
  }
  if (state.result !== 'player_win') {
    return { rewarded: false, rewardReason: state.result === 'draw' ? 'Remis nie daje nagrody.' : 'Porażka nie daje nagrody.', housePoints: 0, skirniry: 0 };
  }
  const alreadyClaimed = _db.prepare(
    'SELECT 1 FROM runic_duel_runs WHERE user_id = ? AND date_key = ? AND rewarded = 1 AND run_id != ? LIMIT 1'
  ).get(row.user_id, row.date_key, row.run_id);
  if (alreadyClaimed) {
    return { rewarded: false, rewardReason: 'Nagroda dnia została już zdobyta.', housePoints: 0, skirniry: 0 };
  }

  const houseExists = user.house && _db.prepare('SELECT 1 FROM houses WHERE id = ?').get(String(user.house).toLowerCase());
  const housePoints = houseExists ? baseReward.housePoints : 0;
  const skirniry = baseReward.skirniry;
  const source = `Runiczny Krąg Pojedynków — ${baseReward.rank}`;
  const actorName = user.fullName || user.full_name || user.username || 'Adept';

  if (housePoints > 0) {
    awardPoints({
      studentId: user.id,
      studentName: actorName,
      house: String(user.house).toLowerCase(),
      points: housePoints,
      source,
      sourceType: 'MINIGAME',
      sourceId: row.run_id,
      actorId: user.id,
      actorName,
      idempotencyKey: `runic-duel:${row.run_id}:points`
    });
  }
  if (skirniry > 0) {
    creditSkirnir({
      userId: user.id,
      userName: actorName,
      amount: skirniry,
      category: 'nagroda',
      title: source,
      sourceType: 'MINIGAME',
      sourceId: row.run_id,
      actorId: user.id,
      actorName,
      idempotencyKey: `runic-duel:${row.run_id}:currency`
    });
  }

  return {
    rewarded: true,
    rewardReason: houseExists ? 'Nagroda przyznana.' : 'Nagroda przyznana bez punktów Zakonu — brak prawidłowego Zakonu.',
    housePoints,
    skirniry
  };
}

export function submitRunicDuelAction({ user, runId, actionId, turnNumber, playerAction, date = new Date() }) {
  if (!user?.id || !runId || !actionId || !Number.isInteger(turnNumber) || typeof playerAction !== 'string') {
    return { error: 'Nieprawidłowe dane akcji.', code: 400 };
  }

  return _db.transaction(() => {
    let row = getRunRow(runId, user.id);
    if (!row) return { error: 'Pojedynek nie istnieje lub nie należy do Ciebie.', code: 403 };

    const duplicate = _db.prepare('SELECT * FROM runic_duel_turns WHERE run_id = ? AND action_id = ?').get(runId, actionId);
    if (duplicate) return { duplicate: true, turn: publicTurn(duplicate), run: publicRun(row) };

    if (row.status !== 'active') return { error: 'Pojedynek jest już zakończony.', code: 409, run: publicRun(row) };
    const reference = Date.parse(row.last_action_at || row.started_at);
    const timeout = row.action_count > 0 ? ACTIVE_TIMEOUT_MS : EMPTY_TIMEOUT_MS;
    if (Number.isFinite(reference) && date.getTime() - reference > timeout) {
      _db.prepare("UPDATE runic_duel_runs SET status = 'abandoned', result = 'abandoned', win_reason = 'timeout', reward_reason = 'Sesja wygasła.', completed_at = ? WHERE run_id = ?")
        .run(nowIso(date), runId);
      return { error: 'Sesja pojedynku wygasła.', code: 410, run: publicRun(getRunRow(runId, user.id)) };
    }
    if (turnNumber !== row.turn_number) return { error: 'Stan tury jest nieaktualny.', code: 409, run: publicRun(row) };

    if (row.action_count === 0 && row.mode === 'reward') {
      const usage = dailyUsage(user.id, row.date_key);
      if (usage.attemptsUsed >= RUNIC_DUEL_DAILY_ATTEMPT_LIMIT || usage.rewardClaimed) {
        _db.prepare("UPDATE runic_duel_runs SET mode = 'training', reward_eligible = 0, reward_reason = ? WHERE run_id = ?")
          .run('Limit nagród został wykorzystany — pojedynek treningowy.', runId);
      } else {
        _db.prepare('UPDATE runic_duel_runs SET attempt_reserved = 1, first_action_at = ? WHERE run_id = ?')
          .run(nowIso(date), runId);
      }
      row = getRunRow(runId, user.id);
    }

    const stateBefore = parseJson(row.state_json, null);
    if (!stateBefore) return { error: 'Nie udało się odczytać stanu pojedynku.', code: 500 };
    let resolved;
    try {
      resolved = resolveDuelTurn({
        state: stateBefore,
        playerAction,
        enemyAction: row.current_enemy_intent,
        opponentId: row.opponent_id
      });
    } catch (error) {
      return { error: error.message, code: 400 };
    }

    const playerHistory = resolved.state.history.map((entry) => entry.playerAction);
    const nextIntent = resolved.state.status === 'fighting'
      ? chooseEnemyAction({ state: resolved.state, opponentId: row.opponent_id, seed: row.seed, playerHistory })
      : '';
    const timestamp = nowIso(date);
    let payout = { rewarded: false, rewardReason: row.reward_reason || '', housePoints: 0, skirniry: 0 };
    if (resolved.state.status === 'complete') payout = rewardCompletedRun({ row: getRunRow(runId, user.id), state: resolved.state, user });

    _db.prepare(`
      UPDATE runic_duel_runs
         SET status = ?, action_count = action_count + 1, turn_number = ?, current_enemy_intent = ?,
             state_json = ?, result = ?, win_reason = ?, score = ?, rank = ?,
             rewarded = ?, reward_reason = ?, reward_points = ?, reward_skirnirs = ?,
             last_action_at = ?, completed_at = ?
       WHERE run_id = ?
    `).run(
      resolved.state.status === 'complete' ? 'completed' : 'active',
      resolved.state.turnNumber,
      nextIntent,
      JSON.stringify(resolved.state),
      resolved.state.result || '',
      resolved.state.winReason || '',
      resolved.state.score || 0,
      resolved.state.rank || '',
      payout.rewarded ? 1 : 0,
      payout.rewardReason,
      payout.housePoints,
      payout.skirniry,
      timestamp,
      resolved.state.status === 'complete' ? timestamp : '',
      runId
    );

    _db.prepare(`
      INSERT INTO runic_duel_turns (
        id, run_id, turn_number, action_id, player_action, enemy_action,
        ai_decision_reason, events_json, state_before_json, state_after_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), runId, turnNumber, actionId, playerAction, row.current_enemy_intent,
      `profil:${row.opponent_id};seed:${row.seed.slice(0, 8)}`,
      JSON.stringify(resolved.events), JSON.stringify(stateBefore), JSON.stringify(resolved.state), timestamp
    );

    const updated = getRunRow(runId, user.id);
    const turn = _db.prepare('SELECT * FROM runic_duel_turns WHERE run_id = ? AND action_id = ?').get(runId, actionId);
    const userRow = _db.prepare('SELECT points, currency FROM users WHERE id = ?').get(user.id);
    return { duplicate: false, turn: publicTurn(turn), run: publicRun(updated), balances: userRow || null };
  })();
}

export function abandonRunicDuel(userId, runId, date = new Date()) {
  return _db.transaction(() => {
    const row = getRunRow(runId, userId);
    if (!row) return { error: 'Pojedynek nie istnieje lub nie należy do Ciebie.', code: 403 };
    if (row.status !== 'active') return { duplicate: true, run: publicRun(row) };
    _db.prepare(`
      UPDATE runic_duel_runs
         SET status = 'abandoned', result = 'abandoned', win_reason = 'abandoned',
             reward_reason = ?, completed_at = ?
       WHERE run_id = ?
    `).run(row.action_count > 0 ? 'Próba została porzucona po rozpoczęciu.' : 'Pusta sesja anulowana bez zużycia próby.', nowIso(date), runId);
    return { duplicate: false, run: publicRun(getRunRow(runId, userId)) };
  })();
}

export function getRunicDuel(userId, runId, date = new Date()) {
  expireStaleRuns(userId, date);
  const row = getRunRow(runId, userId);
  if (!row) return { error: 'Pojedynek nie istnieje lub nie należy do Ciebie.', code: 404 };
  return { run: publicRun(row) };
}

