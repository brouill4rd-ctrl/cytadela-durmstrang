import { Router } from 'express';
import { randomUUID, randomInt } from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';
import {
  RULES_VERSION, OPPONENTS,
  computeReward, getRank, replayFromLog,
} from '../../src/game/wandFencingRules.js';

const router = Router();

// Migracja tabeli
db.exec(`
  CREATE TABLE IF NOT EXISTS wand_fencing_runs (
    run_id        TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    rules_version TEXT NOT NULL DEFAULT '${RULES_VERSION}',
    seed          INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'started',
    action_log    TEXT,
    round_reached INTEGER DEFAULT 0,
    turn_count    INTEGER DEFAULT 0,
    duration_ms   INTEGER DEFAULT 0,
    final_score   INTEGER,
    rank          TEXT,
    result_reason TEXT,
    reward_eligible INTEGER DEFAULT 0,
    reward_reason TEXT,
    reward_points INTEGER DEFAULT 0,
    reward_skirnirs INTEGER DEFAULT 0,
    trophy_awarded INTEGER DEFAULT 0,
    started_at    TEXT NOT NULL,
    completed_at  TEXT,
    reward_day    TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_wf_user_day
    ON wand_fencing_runs(user_id, reward_day)
    WHERE reward_day IS NOT NULL;
`);

function warsawDate(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

function hasTodayReward(userId) {
  const today = warsawDate();
  const row = db.prepare(
    `SELECT COUNT(*) AS cnt FROM wand_fencing_runs
     WHERE user_id = ? AND reward_day = ? AND status = 'completed' AND reward_eligible = 1`
  ).get(userId, today);
  return (row?.cnt || 0) > 0;
}

function hasTrophy(userId) {
  const user = db.prepare('SELECT inventory FROM users WHERE id = ?').get(userId);
  if (!user) return false;
  try {
    const inv = JSON.parse(user.inventory || '[]');
    return inv.some(item => item.id === `trophy-wand-fencing`);
  } catch {
    return false;
  }
}

function grantTrophy(userId) {
  const user = db.prepare('SELECT inventory FROM users WHERE id = ?').get(userId);
  if (!user) return;
  let inv;
  try { inv = JSON.parse(user.inventory || '[]'); } catch { inv = []; }
  if (inv.some(item => item.id === 'trophy-wand-fencing')) return;
  inv.push({
    id: 'trophy-wand-fencing',
    name: 'Puchar Czempiona Północy',
    icon: '🏆',
    rarity: 'Mityczny Relikt',
    price: 0,
    nonSellable: true,
    desc: 'Przyznany za pierwsze ukończenie Turnieju Szermierki Różdżkowej z wynikiem co najmniej 850 pkt.',
  });
  db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(inv), userId);
}

// POST /api/minigames/wand-fencing/start
router.post('/start', requireAuth, (req, res) => {
  const user = req.user;

  // Oznacz ewentualną nieukończoną próbę jako porzuconą
  db.prepare(
    `UPDATE wand_fencing_runs SET status = 'abandoned'
     WHERE user_id = ? AND status = 'started'`
  ).run(user.id);

  const runId = randomUUID();
  const seed = randomInt(1, 2147483647); // bezpieczne nasiono serwera
  const today = warsawDate();
  const canBeRewarded = !hasTodayReward(user.id);

  db.prepare(`
    INSERT INTO wand_fencing_runs (run_id, user_id, seed, status, started_at, reward_day)
    VALUES (?, ?, ?, 'started', ?, ?)
  `).run(runId, user.id, seed, new Date().toISOString(), today);

  res.json({
    runId,
    seed,
    canBeRewarded,
    rulesVersion: RULES_VERSION,
    opponents: OPPONENTS.map(o => ({ id: o.id, name: o.name, subtitle: o.subtitle, maxHp: o.maxHp, round: o.round })),
  });
});

// POST /api/minigames/wand-fencing/complete
router.post('/complete', requireAuth, (req, res) => {
  const user = req.user;
  const { runId, actionLog } = req.body;

  if (!runId || !Array.isArray(actionLog)) {
    return res.status(400).json({ error: 'Wymagane runId i log akcji.' });
  }

  // Pobierz zapis próby
  const run = db.prepare('SELECT * FROM wand_fencing_runs WHERE run_id = ?').get(runId);
  if (!run) return res.status(404).json({ error: 'Nieznany runId.' });
  if (run.user_id !== user.id) return res.status(403).json({ error: 'Brak dostępu.' });

  // Idempotencja — jeśli już ukończona, zwróć zapisany rezultat
  if (run.status === 'completed') {
    return res.json({
      duplicate: true,
      score: run.final_score,
      rank: run.rank,
      rewardEligible: !!run.reward_eligible,
      housePoints: run.reward_points,
      skirnirs: run.reward_skirnirs,
      trophyAwarded: !!run.trophy_awarded,
      message: run.reward_eligible
        ? `Nagroda już przyznana: +${run.reward_points} pkt Zakonu, +${run.reward_skirnirs} Skirnirów.`
        : 'Wynik zapisano jako treningowy.',
    });
  }

  if (run.status !== 'started') {
    return res.status(400).json({ error: `Próba ma status '${run.status}' — nie można ukończyć.` });
  }

  const startedAt = new Date(run.started_at);
  const durationMs = Date.now() - startedAt.getTime();

  // Odtworzenie i walidacja po stronie serwera
  const replay = replayFromLog(actionLog, run.seed, durationMs);

  if (!replay.valid) {
    db.prepare(
      `UPDATE wand_fencing_runs SET status = 'invalid', result_reason = ?, completed_at = ? WHERE run_id = ?`
    ).run(replay.reason, new Date().toISOString(), runId);
    return res.status(422).json({ error: `Nie udało się potwierdzić przebiegu turnieju: ${replay.reason}` });
  }

  const score = replay.score;
  const rank = replay.rank;
  const won = replay.allRoundsCompleted;
  const { housePoints: rewardPts, skirnirs: rewardSk } = won ? computeReward(score) : { housePoints: 0, skirnirs: 0 };

  // Sprawdzenie prawa do nagrody
  const today = warsawDate();
  const alreadyRewarded = run.reward_day === today && hasTodayReward(user.id);
  const rewardEligible = won && !alreadyRewarded && (rewardPts > 0 || rewardSk > 0);

  // Puchar: pierwsze ukończenie z wynikiem >= 850
  let trophyAwarded = false;
  if (won && score >= 850 && !hasTrophy(user.id)) {
    trophyAwarded = true;
  }

  // Atomowy zapis
  const complete = db.transaction(() => {
    db.prepare(`
      UPDATE wand_fencing_runs SET
        status = 'completed', action_log = ?, round_reached = ?, turn_count = ?,
        duration_ms = ?, final_score = ?, rank = ?, result_reason = ?,
        reward_eligible = ?, reward_reason = ?, reward_points = ?, reward_skirnirs = ?,
        trophy_awarded = ?, completed_at = ?
      WHERE run_id = ?
    `).run(
      JSON.stringify(actionLog),
      replay.roundResults.length,
      replay.totalTurns,
      Math.round(durationMs),
      score, rank, replay.reason,
      rewardEligible ? 1 : 0,
      rewardEligible ? 'Nagroda przyznana' : (alreadyRewarded ? 'Dzienna nagroda już odebrana' : 'Brak kwalifikacji'),
      rewardEligible ? rewardPts : 0,
      rewardEligible ? rewardSk : 0,
      trophyAwarded ? 1 : 0,
      new Date().toISOString(),
      runId,
    );

    if (rewardEligible) {
      const base = `wand-fencing-${runId}`;
      if (rewardPts > 0 && user.house) {
        awardPoints({
          studentId: user.id,
          studentName: user.fullName || user.full_name || user.username,
          house: user.house,
          points: rewardPts,
          source: `Turniej Szermierki Różdżkowej — Ranga: ${rank} (${score} pkt)`,
          sourceType: 'MINIGAME',
          sourceId: runId,
          actorId: user.id,
          actorName: user.fullName || user.full_name || user.username,
          idempotencyKey: `${base}-pts`,
        });
      }
      if (rewardSk > 0) {
        creditSkirnir({
          userId: user.id,
          userName: user.fullName || user.full_name || user.username,
          amount: rewardSk,
          category: 'nagroda',
          title: `Turniej Szermierki Różdżkowej — Ranga: ${rank} (${score} pkt)`,
          sourceType: 'MINIGAME',
          sourceId: runId,
          actorId: user.id,
          actorName: user.fullName || user.full_name || user.username,
          idempotencyKey: `${base}-sk`,
        });
      }
    }

    if (trophyAwarded) {
      grantTrophy(user.id);
    }
  });

  try {
    complete();
  } catch (err) {
    console.error('[WandFencing] Błąd transakcji:', err.message);
    return res.status(500).json({ error: 'Błąd zapisu nagrody.' });
  }

  // Komunikat dla gracza
  let message;
  if (!won) {
    message = 'Turniej nieukończony — wynik zapisano jako treningowy.';
  } else if (alreadyRewarded) {
    message = 'Dzisiejsza nagroda została już odebrana — wynik zapisano jako treningowy.';
  } else if (!rewardEligible) {
    message = score < 550 ? 'Wynik poniżej progu nagrody. Ćwicz dalej!' : 'Wynik zapisano jako treningowy.';
  } else if (!user.house && rewardPts === 0) {
    message = `Nie należysz jeszcze do Zakonu: otrzymujesz +${rewardSk} Skirnirów bez punktów Zakonu.`;
  } else {
    const rankLabel = rank;
    message = `${rankLabel}: +${rewardPts} pkt Zakonu i +${rewardSk} Skirnirów.`;
  }

  if (trophyAwarded) {
    message += ' Pierwszy wielki triumf: Puchar Czempiona Północy dodano do kolekcji.';
  }

  return res.json({
    score,
    rank,
    won,
    rewardEligible,
    housePoints: rewardEligible ? rewardPts : 0,
    skirnirs: rewardEligible ? rewardSk : 0,
    trophyAwarded,
    message,
    roundResults: replay.roundResults,
    totalTurns: replay.totalTurns,
    maxDmg: replay.maxDmg,
    durationMs: Math.round(durationMs),
  });
});

// POST /api/minigames/wand-fencing/abandon
router.post('/abandon', requireAuth, (req, res) => {
  const { runId } = req.body;
  if (!runId) return res.status(400).json({ error: 'Wymagane runId.' });
  const run = db.prepare('SELECT * FROM wand_fencing_runs WHERE run_id = ?').get(runId);
  if (!run || run.user_id !== req.user.id) return res.status(404).json({ error: 'Nieznany runId.' });
  if (run.status !== 'started') return res.json({ ok: true, status: run.status });
  db.prepare(`UPDATE wand_fencing_runs SET status = 'abandoned', completed_at = ? WHERE run_id = ?`)
    .run(new Date().toISOString(), runId);
  return res.json({ ok: true, status: 'abandoned' });
});

// GET /api/minigames/wand-fencing/daily-status
router.get('/daily-status', requireAuth, (req, res) => {
  const today = warsawDate();
  const rewarded = hasTodayReward(req.user.id);
  res.json({ canBeRewarded: !rewarded, rewardDay: today });
});

export default router;
