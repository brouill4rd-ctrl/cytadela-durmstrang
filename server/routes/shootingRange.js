import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';

const router = Router();

const REWARD_DAILY_LIMIT = 3;
const MIN_DURATION_MS = 23_000;

function getWarsawDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

function computeReward(score) {
  if (score < 400)  return { housePoints: 0, skirniry: 0 };
  if (score < 800)  return { housePoints: 2, skirniry: 2 };
  if (score < 1200) return { housePoints: 4, skirniry: 3 };
  if (score < 1600) return { housePoints: 6, skirniry: 5 };
  return             { housePoints: 8, skirniry: 7 };
}

// POST /api/shooting-range/finish
router.post('/finish', requireAuth, (req, res) => {
  const { runId, score, hits, misses, traps, maxCombo, durationMs } = req.body;
  const user = req.user;

  if (!runId || typeof score !== 'number' || typeof durationMs !== 'number') {
    return res.status(400).json({ error: 'Nieprawidłowe dane rundy.' });
  }
  if (durationMs < MIN_DURATION_MS) {
    return res.status(400).json({ error: 'Runda zakończona zbyt wcześnie — brak nagrody.' });
  }

  // Idempotency
  const existing = db.prepare('SELECT * FROM shooting_range_runs WHERE run_id = ?').get(runId);
  if (existing) {
    const rewardedToday = db.prepare(
      'SELECT COUNT(*) AS cnt FROM shooting_range_runs WHERE user_id = ? AND date_warsaw = ? AND rewarded = 1'
    ).get(user.id, existing.date_warsaw)?.cnt || 0;
    return res.json({
      duplicate: true,
      rewarded: !!existing.rewarded,
      housePoints: existing.house_points,
      skirniry: existing.skirniry,
      dailyCount: rewardedToday,
      isTraining: !existing.rewarded,
      message: existing.rewarded
        ? `Nagroda już przyznana: +${existing.house_points} pkt Zakonu, +${existing.skirniry} Skirnirów.`
        : 'Runda była treningowa.',
    });
  }

  const dateWarsaw = getWarsawDate();
  const rewardedToday = db.prepare(
    'SELECT COUNT(*) AS cnt FROM shooting_range_runs WHERE user_id = ? AND date_warsaw = ? AND rewarded = 1'
  ).get(user.id, dateWarsaw)?.cnt || 0;

  const isTraining = rewardedToday >= REWARD_DAILY_LIMIT;
  // Server independently computes reward — never trusts client
  const { housePoints, skirniry } = isTraining ? { housePoints: 0, skirniry: 0 } : computeReward(score);
  const rewarded = !isTraining && (housePoints > 0 || skirniry > 0);

  db.prepare(`
    INSERT INTO shooting_range_runs
      (run_id, user_id, score, hits, misses, traps, max_combo, duration_ms,
       rewarded, house_points, skirniry, date_warsaw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    user.id,
    Math.max(0, Math.round(score)),
    Math.max(0, Math.round(hits   || 0)),
    Math.max(0, Math.round(misses || 0)),
    Math.max(0, Math.round(traps  || 0)),
    Math.max(1, Math.round(maxCombo || 1)),
    Math.round(durationMs),
    rewarded ? 1 : 0,
    housePoints,
    skirniry,
    dateWarsaw
  );

  if (rewarded) {
    const base = `shooting-${runId}`;
    if (housePoints > 0 && user.house) {
      try {
        awardPoints({
          studentId: user.id,
          studentName: user.fullName || user.full_name || user.username,
          house: user.house,
          points: housePoints,
          source: `Runiczna Strzelnica — Wynik: ${score} pkt`,
          sourceType: 'MINIGAME',
          sourceId: runId,
          actorId: user.id,
          actorName: user.fullName || user.full_name || user.username,
          idempotencyKey: `${base}-pts`,
        });
      } catch (err) {
        console.error('[ShootingRange] awardPoints error:', err.message);
      }
    }
    if (skirniry > 0) {
      try {
        creditSkirnir({
          userId: user.id,
          userName: user.fullName || user.full_name || user.username,
          amount: skirniry,
          category: 'nagroda',
          title: `Runiczna Strzelnica — Wynik: ${score} pkt`,
          sourceType: 'MINIGAME',
          sourceId: runId,
          actorId: user.id,
          actorName: user.fullName || user.full_name || user.username,
          idempotencyKey: `${base}-sk`,
        });
      } catch (err) {
        console.error('[ShootingRange] creditSkirnir error:', err.message);
      }
    }
  }

  return res.json({
    rewarded,
    housePoints,
    skirniry,
    dailyCount: rewardedToday + (rewarded ? 1 : 0),
    isTraining,
    message: isTraining
      ? 'Limit nagród na dziś wykorzystany — ta runda była treningowa.'
      : rewarded
        ? `Nagroda przyznana: +${housePoints} pkt Zakonu, +${skirniry} Skirnirów.`
        : 'Wynik poniżej progu nagrody (400 pkt). Ćwicz dalej!',
  });
});

// GET /api/shooting-range/daily-status
router.get('/daily-status', requireAuth, (req, res) => {
  const dateWarsaw = getWarsawDate();
  const rewardedToday = db.prepare(
    'SELECT COUNT(*) AS cnt FROM shooting_range_runs WHERE user_id = ? AND date_warsaw = ? AND rewarded = 1'
  ).get(req.user.id, dateWarsaw)?.cnt || 0;
  res.json({ rewardedToday, limit: REWARD_DAILY_LIMIT });
});

export default router;
