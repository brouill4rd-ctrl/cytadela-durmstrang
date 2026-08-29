import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';
import {
  createInitialState,
  applyMove,
  getAllLegalMoves,
  REWARDS,
  DAILY_REWARD_LIMIT,
  DAILY_POINTS_LIMIT,
  DAILY_SKIRNIRS_LIMIT,
  MIN_GAME_MS,
  MAX_GAME_MS,
} from '../../src/game/hnefataflRules.js';

const router = Router();

function getWarsawDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

function getUserName(user) {
  return user.fullName || user.full_name || user.username || 'Gracz';
}

// POST /api/hnefatafl/start
router.post('/start', requireAuth, (req, res) => {
  const { difficulty, playerSide } = req.body;
  if (!['uczen','einar','jarl'].includes(difficulty)) {
    return res.status(400).json({ error: 'Nieprawidłowy poziom trudności.' });
  }
  if (!['defenders','attackers'].includes(playerSide)) {
    return res.status(400).json({ error: 'Nieprawidłowa strona.' });
  }

  const user = req.user;
  const runId = `hfatafl-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const aiSeed = Math.floor(Math.random() * 2147483647);
  const dateWarsaw = getWarsawDate();

  const rewardedToday = db.prepare(
    'SELECT COUNT(*) AS cnt FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(user.id, dateWarsaw)?.cnt || 0;

  const ptsTodayRow = db.prepare(
    'SELECT COALESCE(SUM(reward_points),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(user.id, dateWarsaw);
  const sksTodayRow = db.prepare(
    'SELECT COALESCE(SUM(reward_skirnirs),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(user.id, dateWarsaw);

  db.prepare(`
    INSERT INTO hnefatafl_runs
      (run_id, user_id, mode, difficulty, player_side, ai_seed, status, date_warsaw, started_at)
    VALUES (?,?,?,?,?,?,?,?,datetime('now'))
  `).run(runId, user.id, 'ai', difficulty, playerSide, aiSeed, 'started', dateWarsaw);

  return res.json({
    runId,
    aiSeed,
    difficulty,
    playerSide,
    dailyRewardedCount: rewardedToday,
    dailyRewardLimit: DAILY_REWARD_LIMIT,
    dailyPointsUsed: ptsTodayRow?.s || 0,
    dailySkirnisUsed: sksTodayRow?.s || 0,
  });
});

// POST /api/hnefatafl/complete
router.post('/complete', requireAuth, (req, res) => {
  const { runId, moveLog } = req.body;
  const user = req.user;

  if (!runId || !Array.isArray(moveLog)) {
    return res.status(400).json({ error: 'Nieprawidłowe dane.' });
  }

  // Idempotency: already completed?
  const existing = db.prepare('SELECT * FROM hnefatafl_runs WHERE run_id=?').get(runId);
  if (!existing) return res.status(404).json({ error: 'Nieznana próba.' });
  if (existing.user_id !== user.id) return res.status(403).json({ error: 'Brak dostępu.' });

  if (existing.status === 'completed') {
    return res.json({
      duplicate: true,
      winner: existing.winner,
      endReason: existing.end_reason,
      rewarded: !!existing.rewarded,
      rewardPoints: existing.reward_points,
      rewardSkirnirs: existing.reward_skirnirs,
      rewardReason: existing.reward_reason,
      message: existing.rewarded
        ? `Nagroda już zapisana: +${existing.reward_points} pkt Zakonu, +${existing.reward_skirnirs} Skirnirów.`
        : existing.reward_reason || 'Partia treningowa.',
    });
  }

  // Replay & validate
  let state = createInitialState();
  for (let i = 0; i < moveLog.length; i++) {
    const entry = moveLog[i];
    if (!entry || !Array.isArray(entry.from) || !Array.isArray(entry.to)) {
      db.prepare(`UPDATE hnefatafl_runs SET status='invalid', end_reason='Nieprawidłowy format dziennika' WHERE run_id=?`).run(runId);
      return res.status(400).json({ error: `Nieprawidłowy ruch #${i}.` });
    }
    const move = { from: entry.from, to: entry.to };
    const legal = getAllLegalMoves(state.board, state.turn);
    const isLegal = legal.some(
      m => m.from[0]===move.from[0] && m.from[1]===move.from[1] &&
           m.to[0]===move.to[0]   && m.to[1]===move.to[1]
    );
    if (!isLegal) {
      db.prepare(`UPDATE hnefatafl_runs SET status='invalid', end_reason='Nielegalny ruch' WHERE run_id=?`).run(runId);
      return res.status(400).json({ error: `Nielegalny ruch #${i}.` });
    }
    state = applyMove(state, move);
  }

  const winner = state.result?.winner || null;
  const endReason = state.result?.reason || 'Partia nierozstrzygnięta';

  // Time check
  const startedAt = new Date(existing.started_at + 'Z').getTime();
  const durationMs = Date.now() - startedAt;

  const playerSide = existing.player_side;
  const playerWon = winner === playerSide;
  const difficulty = existing.difficulty;

  let rewardEligible = false;
  let rewardReason = 'Partia treningowa.';
  let rewardPoints = 0;
  let rewardSkirnirs = 0;

  if (playerWon && existing.mode === 'ai') {
    if (durationMs < MIN_GAME_MS) {
      rewardReason = 'Partia zakończona zbyt szybko (min. 8 sekund).';
    } else if (durationMs > MAX_GAME_MS) {
      rewardReason = 'Partia trwała zbyt długo (max. 45 minut).';
    } else {
      const dateWarsaw = getWarsawDate();
      const rewardedToday = db.prepare(
        'SELECT COUNT(*) AS cnt FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
      ).get(user.id, dateWarsaw)?.cnt || 0;

      if (rewardedToday >= DAILY_REWARD_LIMIT) {
        rewardReason = 'Limit nagród na dziś wykorzystany — partia została zapisana jako treningowa.';
      } else {
        const ptsTodayRow = db.prepare(
          'SELECT COALESCE(SUM(reward_points),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
        ).get(user.id, dateWarsaw);
        const sksTodayRow = db.prepare(
          'SELECT COALESCE(SUM(reward_skirnirs),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
        ).get(user.id, dateWarsaw);

        const ptsUsed = ptsTodayRow?.s || 0;
        const sksUsed = sksTodayRow?.s || 0;

        const base = REWARDS[difficulty] || { points: 0, skirnirs: 0 };
        rewardPoints  = Math.min(base.points,  DAILY_POINTS_LIMIT   - ptsUsed);
        rewardSkirnirs = Math.min(base.skirnirs, DAILY_SKIRNIRS_LIMIT - sksUsed);
        rewardPoints  = Math.max(0, rewardPoints);
        rewardSkirnirs = Math.max(0, rewardSkirnirs);

        // User without house gets no points (never award to a dummy house)
        if (!user.house) rewardPoints = 0;

        if (rewardPoints > 0 || rewardSkirnirs > 0) {
          rewardEligible = true;
          rewardReason = null;
        } else {
          rewardReason = 'Dzienny limit punktów lub Skirnirów został osiągnięty.';
        }
      }
    }
  } else if (!playerWon && winner !== null) {
    rewardReason = 'Nagroda tylko za zwycięstwo.';
  } else if (winner === null) {
    rewardReason = 'Remis — brak nagrody.';
  } else if (existing.mode !== 'ai') {
    rewardReason = 'Tryb lokalny — brak nagrody.';
  }

  // Atomic write
  const completeStmt = db.prepare(`
    UPDATE hnefatafl_runs SET
      status='completed',
      winner=?,
      end_reason=?,
      move_count=?,
      move_log=?,
      reward_points=?,
      reward_skirnirs=?,
      reward_eligible=?,
      reward_reason=?,
      rewarded=?,
      completed_at=datetime('now')
    WHERE run_id=?
  `);

  const moveLogJson = JSON.stringify(moveLog);

  if (rewardEligible) {
    const runMany = db.transaction(() => {
      completeStmt.run(
        winner, endReason, state.halfMoves, moveLogJson,
        rewardPoints, rewardSkirnirs, 1, null, 1, runId
      );

      const idBase = `hnefatafl-${runId}`;
      const name = getUserName(user);

      if (rewardPoints > 0 && user.house) {
        try {
          awardPoints({
            studentId: user.id,
            studentName: name,
            house: user.house,
            points: rewardPoints,
            source: `Hnefatafl Magów — poziom: ${difficulty}`,
            sourceType: 'MINIGAME',
            sourceId: runId,
            actorId: user.id,
            actorName: name,
            idempotencyKey: `${idBase}-pts`,
          });
        } catch (e) {
          console.error('[Hnefatafl] awardPoints error:', e.message);
        }
      }

      if (rewardSkirnirs > 0) {
        try {
          creditSkirnir({
            userId: user.id,
            userName: name,
            amount: rewardSkirnirs,
            category: 'nagroda',
            title: `Hnefatafl Magów — poziom: ${difficulty}`,
            sourceType: 'MINIGAME',
            sourceId: runId,
            actorId: user.id,
            actorName: name,
            idempotencyKey: `${idBase}-sk`,
          });
        } catch (e) {
          console.error('[Hnefatafl] creditSkirnir error:', e.message);
        }
      }
    });
    runMany();
  } else {
    completeStmt.run(
      winner, endReason, state.halfMoves, moveLogJson,
      0, 0, 0, rewardReason, 0, runId
    );
  }

  const diffLabels = { uczen: 'Ucznia Skalda', einar: 'Skalda Einara', jarl: 'Jarla Widmowej Tarczy' };
  let message;
  if (rewardEligible) {
    if (!user.house && rewardPoints > 0) {
      message = `Zwycięstwo zapisane. Nie należysz jeszcze do Zakonu, dlatego otrzymujesz +${rewardSkirnirs} Skirniry bez punktów Zakonu.`;
      rewardPoints = 0;
    } else {
      const label = diffLabels[difficulty] || difficulty;
      message = `Zwycięstwo nad ${label}: +${rewardPoints} pkt Zakonu i +${rewardSkirnirs} Skirniry.`;
    }
  } else {
    message = rewardReason || 'Partia zapisana.';
  }

  return res.json({
    winner,
    endReason,
    rewarded: rewardEligible,
    rewardPoints: rewardEligible ? rewardPoints : 0,
    rewardSkirnirs: rewardEligible ? rewardSkirnirs : 0,
    rewardReason: rewardEligible ? null : rewardReason,
    moveCount: state.halfMoves,
    message,
  });
});

// GET /api/hnefatafl/daily-status
router.get('/daily-status', requireAuth, (req, res) => {
  const dateWarsaw = getWarsawDate();
  const uid = req.user.id;
  const rewardedToday = db.prepare(
    'SELECT COUNT(*) AS cnt FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(uid, dateWarsaw)?.cnt || 0;
  const ptsRow = db.prepare(
    'SELECT COALESCE(SUM(reward_points),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(uid, dateWarsaw);
  const sksRow = db.prepare(
    'SELECT COALESCE(SUM(reward_skirnirs),0) AS s FROM hnefatafl_runs WHERE user_id=? AND date_warsaw=? AND rewarded=1'
  ).get(uid, dateWarsaw);

  res.json({
    rewardedToday,
    limit: DAILY_REWARD_LIMIT,
    pointsUsed: ptsRow?.s || 0,
    pointsLimit: DAILY_POINTS_LIMIT,
    skirnisUsed: sksRow?.s || 0,
    skirnisLimit: DAILY_SKIRNIRS_LIMIT,
  });
});

export default router;
