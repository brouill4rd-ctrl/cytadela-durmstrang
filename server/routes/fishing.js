import { Router } from 'express';
import db, { calculateHouseRankings, dbUserToFrontend } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';
import {
  FISHING_BAITS,
  FISHING_CASTS_PER_SESSION,
  FISHING_DAILY_LIMIT,
  FISHING_MIN_REWARD_DURATION_MS,
  FISHING_RARITY_RANK,
  evaluateFishingCast,
  getFishingLootById,
  rewardForSessionScore,
  selectBestRewardLoot,
  validateBaitUsage,
  warsawDateKey
} from '../fishing.js';

const router = Router();

function parseJson(value, fallback) {
  try {
    return JSON.parse(value ?? '') ?? fallback;
  } catch {
    return fallback;
  }
}

function isValidId(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(value);
}

function expireStaleSessions(userId) {
  db.prepare(`
    UPDATE fishing_sessions
    SET status = 'abandoned', completed_at = datetime('now')
    WHERE user_id = ? AND status = 'in_progress'
      AND last_active_at < datetime('now', '-15 minutes')
  `).run(userId);
}

function mapCast(row) {
  if (!row) return null;
  const loot = row.loot_id ? getFishingLootById(row.loot_id) : null;
  return {
    id: row.id,
    castIndex: row.cast_index,
    baitId: row.bait_id,
    status: row.status,
    hookGrade: row.hook_grade || 'miss',
    hookPoints: row.hook_points || 0,
    reelGrades: parseJson(row.reel_results, ['miss', 'miss', 'miss']),
    reelPoints: row.reel_points || 0,
    castScore: row.cast_score || 0,
    caught: row.status === 'caught',
    rarity: row.loot_rarity || null,
    loot,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

function sessionCasts(sessionId) {
  return db.prepare('SELECT * FROM fishing_casts WHERE session_id = ? ORDER BY cast_index ASC').all(sessionId).map(mapCast);
}

function mapSession(row, includeCasts = true) {
  if (!row) return null;
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    dateKey: row.date_key,
    score: row.score || 0,
    castsCompleted: row.casts_completed || 0,
    catchesCount: row.catches_count || 0,
    escapesCount: row.escapes_count || 0,
    perfectHooks: row.perfect_hooks || 0,
    perfectReels: row.perfect_reels || 0,
    rewardPoints: row.reward_points || 0,
    rewardSkirnirs: row.reward_skirnirs || 0,
    rewardLoot: row.reward_loot_id ? getFishingLootById(row.reward_loot_id) : null,
    rewardMessage: row.reward_message || '',
    startedAt: row.started_at,
    lastActiveAt: row.last_active_at,
    completedAt: row.completed_at,
    casts: includeCasts ? sessionCasts(row.id) : undefined
  };
}

function recalculateSession(sessionId) {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS casts_completed,
      COALESCE(SUM(cast_score), 0) AS score,
      COALESCE(SUM(CASE WHEN status = 'caught' THEN 1 ELSE 0 END), 0) AS catches_count,
      COALESCE(SUM(CASE WHEN status = 'escaped' THEN 1 ELSE 0 END), 0) AS escapes_count,
      COALESCE(SUM(CASE WHEN hook_grade = 'perfect' THEN 1 ELSE 0 END), 0) AS perfect_hooks
    FROM fishing_casts
    WHERE session_id = ? AND status IN ('caught', 'escaped')
  `).get(sessionId);
  const perfectReels = db.prepare(`
    SELECT reel_results FROM fishing_casts
    WHERE session_id = ? AND status IN ('caught', 'escaped')
  `).all(sessionId).reduce((total, row) => (
    total + parseJson(row.reel_results, []).filter((grade) => grade === 'perfect').length
  ), 0);

  db.prepare(`
    UPDATE fishing_sessions
    SET casts_completed = ?, score = ?, catches_count = ?, escapes_count = ?,
        perfect_hooks = ?, perfect_reels = ?, last_active_at = datetime('now')
    WHERE id = ?
  `).run(
    summary.casts_completed,
    summary.score,
    summary.catches_count,
    summary.escapes_count,
    summary.perfect_hooks,
    perfectReels,
    sessionId
  );
}

function settleInterruptedCast(sessionId) {
  const interrupted = db.prepare(`
    SELECT * FROM fishing_casts WHERE session_id = ? AND status = 'started'
    ORDER BY cast_index ASC LIMIT 1
  `).get(sessionId);
  if (!interrupted) return false;

  db.transaction(() => {
    db.prepare(`
      UPDATE fishing_casts
      SET status = 'escaped', hook_grade = 'miss', hook_points = 0,
          reel_results = '["miss","miss","miss"]', reel_points = 0,
          cast_score = 0, loot_id = '', loot_rarity = '', completed_at = datetime('now')
      WHERE id = ? AND status = 'started'
    `).run(interrupted.id);
    recalculateSession(sessionId);
  })();
  return true;
}

function dailyUsage(userId, dateKey = warsawDateKey()) {
  return db.prepare(`
    SELECT COUNT(*) AS count FROM fishing_sessions
    WHERE user_id = ? AND date_key = ? AND mode = 'reward'
  `).get(userId, dateKey)?.count || 0;
}

function getStatusPayload(userId) {
  const dateKey = warsawDateKey();
  const used = dailyUsage(userId, dateKey);
  const activeRow = db.prepare(`
    SELECT * FROM fishing_sessions
    WHERE user_id = ? AND status = 'in_progress'
    ORDER BY started_at DESC LIMIT 1
  `).get(userId);

  const stats = db.prepare(`
    SELECT
      COALESCE(MAX(score), 0) AS personal_best,
      COALESCE(SUM(catches_count), 0) AS total_catches
    FROM fishing_sessions
    WHERE user_id = ? AND status = 'completed'
  `).get(userId);

  const bestLootRow = db.prepare(`
    SELECT fc.loot_id, fc.loot_rarity, fc.cast_score
    FROM fishing_casts fc
    JOIN fishing_sessions fs ON fs.id = fc.session_id
    WHERE fs.user_id = ? AND fs.status = 'completed' AND fc.loot_id != ''
    ORDER BY CASE fc.loot_rarity
      WHEN 'legendary' THEN 5 WHEN 'epic' THEN 4 WHEN 'rare' THEN 3
      WHEN 'uncommon' THEN 2 WHEN 'common' THEN 1 ELSE 0 END DESC,
      fc.cast_score DESC, fc.completed_at ASC
    LIMIT 1
  `).get(userId);

  const history = db.prepare(`
    SELECT * FROM fishing_sessions
    WHERE user_id = ? AND status IN ('completed', 'abandoned')
    ORDER BY COALESCE(completed_at, started_at) DESC LIMIT 5
  `).all(userId).map((row) => mapSession(row, false));

  return {
    dateKey,
    rewardSlotsUsed: used,
    rewardSlotsRemaining: Math.max(0, FISHING_DAILY_LIMIT - used),
    dailyLimit: FISHING_DAILY_LIMIT,
    activeSession: mapSession(activeRow),
    stats: {
      personalBest: stats.personal_best || 0,
      totalCatches: stats.total_catches || 0,
      bestLoot: bestLootRow?.loot_id ? getFishingLootById(bestLootRow.loot_id) : null
    },
    history
  };
}

function completionResponse(sessionRow, duplicate = false) {
  const session = mapSession(sessionRow);
  return {
    duplicate,
    session,
    rewarded: session.mode === 'reward' && (
      session.rewardPoints > 0 || session.rewardSkirnirs > 0 || Boolean(session.rewardLoot)
    ),
    housePoints: session.rewardPoints,
    skirnirs: session.rewardSkirnirs,
    rewardLoot: session.rewardLoot,
    message: session.rewardMessage
  };
}

router.get('/status', requireAuth, (req, res) => {
  try {
    expireStaleSessions(req.user.id);
    const active = db.prepare(`
      SELECT id FROM fishing_sessions
      WHERE user_id = ? AND status = 'in_progress'
      ORDER BY started_at DESC LIMIT 1
    `).get(req.user.id);
    if (active) settleInterruptedCast(active.id);
    res.json(getStatusPayload(req.user.id));
  } catch (error) {
    res.status(500).json({ error: `Nie udało się odczytać dziennika połowów: ${error.message}` });
  }
});

router.post('/sessions', requireAuth, (req, res) => {
  const { runId, mode = 'reward' } = req.body || {};
  if (!isValidId(runId)) return res.status(400).json({ error: 'Nieprawidłowy identyfikator wyprawy.' });
  if (!['reward', 'training'].includes(mode)) return res.status(400).json({ error: 'Nieprawidłowy tryb wyprawy.' });

  try {
    expireStaleSessions(req.user.id);
    const existing = db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(runId);
    if (existing) {
      if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Ta wyprawa należy do innego użytkownika.' });
      return res.json({ duplicate: true, session: mapSession(existing), ...getStatusPayload(req.user.id) });
    }

    const dateKey = warsawDateKey();
    const created = db.transaction(() => {
      const activeSession = db.prepare(`
        SELECT * FROM fishing_sessions
        WHERE user_id = ? AND status = 'in_progress'
        ORDER BY started_at DESC LIMIT 1
      `).get(req.user.id);
      if (activeSession) {
        const error = new Error('Najpierw wznów rozpoczętą wyprawę.');
        error.code = 'ACTIVE_SESSION';
        error.activeSession = mapSession(activeSession);
        throw error;
      }

      if (mode === 'reward') {
        if (dailyUsage(req.user.id, dateKey) >= FISHING_DAILY_LIMIT) {
          const error = new Error('Dzisiejszy limit nagród został wykorzystany.');
          error.code = 'DAILY_LIMIT';
          throw error;
        }
      }

      db.prepare(`
        INSERT INTO fishing_sessions (id, user_id, date_key, mode, status)
        VALUES (?, ?, ?, ?, 'in_progress')
      `).run(runId, req.user.id, dateKey, mode);
      return db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(runId);
    })();

    res.status(201).json({ session: mapSession(created), ...getStatusPayload(req.user.id) });
  } catch (error) {
    if (error.code === 'ACTIVE_SESSION') {
      return res.status(409).json({ error: error.message, activeSession: error.activeSession });
    }
    if (error.code === 'DAILY_LIMIT') {
      return res.status(429).json({ error: error.message, canTrain: true, ...getStatusPayload(req.user.id) });
    }
    if (String(error.message).includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Nie udało się zarezerwować kolejnego slotu wyprawy.' });
    }
    res.status(500).json({ error: `Nie udało się rozpocząć wyprawy: ${error.message}` });
  }
});

router.post('/sessions/:sessionId/casts', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const { castId, castIndex, baitId } = req.body || {};
  if (!isValidId(castId)) return res.status(400).json({ error: 'Nieprawidłowy identyfikator rzutu.' });
  if (!Number.isInteger(castIndex) || castIndex < 0 || castIndex >= FISHING_CASTS_PER_SESSION) {
    return res.status(400).json({ error: 'Nieprawidłowy numer rzutu.' });
  }
  if (!FISHING_BAITS[baitId]) return res.status(400).json({ error: 'Nieprawidłowa przynęta.' });

  try {
    expireStaleSessions(req.user.id);
    const session = db.prepare('SELECT * FROM fishing_sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: 'Nie odnaleziono wyprawy.' });
    if (session.status !== 'in_progress') return res.status(409).json({ error: 'Ta wyprawa nie jest już aktywna.' });

    const existing = db.prepare('SELECT * FROM fishing_casts WHERE id = ?').get(castId);
    if (existing) {
      if (existing.session_id !== sessionId) return res.status(409).json({ error: 'Identyfikator rzutu jest już używany.' });
      return res.json({ duplicate: true, cast: mapCast(existing), session: mapSession(session) });
    }

    const rows = db.prepare('SELECT * FROM fishing_casts WHERE session_id = ? ORDER BY cast_index').all(sessionId);
    if (rows.some((row) => row.status === 'started')) {
      return res.status(409).json({ error: 'Poprzedni rzut nie został jeszcze rozliczony.' });
    }
    if (castIndex !== rows.length) {
      return res.status(409).json({ error: `Oczekiwano rzutu ${rows.length + 1}.` });
    }
    validateBaitUsage(rows.map((row) => ({ baitId: row.bait_id })), baitId);

    db.transaction(() => {
      db.prepare(`
        INSERT INTO fishing_casts (id, session_id, cast_index, bait_id, status)
        VALUES (?, ?, ?, ?, 'started')
      `).run(castId, sessionId, castIndex, baitId);
      db.prepare("UPDATE fishing_sessions SET last_active_at = datetime('now') WHERE id = ?").run(sessionId);
    })();

    res.status(201).json({ cast: mapCast(db.prepare('SELECT * FROM fishing_casts WHERE id = ?').get(castId)) });
  } catch (error) {
    const validation = /przynęt|przynęta/.test(error.message);
    res.status(validation ? 400 : 500).json({ error: `Nie udało się rozpocząć rzutu: ${error.message}` });
  }
});

router.post('/sessions/:sessionId/casts/:castId/complete', requireAuth, (req, res) => {
  const { sessionId, castId } = req.params;
  const { reactionMs, reelGrades } = req.body || {};

  try {
    expireStaleSessions(req.user.id);
    const session = db.prepare('SELECT * FROM fishing_sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: 'Nie odnaleziono wyprawy.' });
    if (session.status !== 'in_progress') return res.status(409).json({ error: 'Ta wyprawa nie jest już aktywna.' });

    const cast = db.prepare('SELECT * FROM fishing_casts WHERE id = ? AND session_id = ?').get(castId, sessionId);
    if (!cast) return res.status(404).json({ error: 'Nie odnaleziono rzutu.' });
    if (cast.status !== 'started') {
      return res.json({ duplicate: true, cast: mapCast(cast), session: mapSession(session) });
    }

    const evaluation = evaluateFishingCast({
      reactionMs: Number(reactionMs),
      reelGrades,
      baitId: cast.bait_id
    });

    db.transaction(() => {
      db.prepare(`
        UPDATE fishing_casts
        SET status = ?, hook_grade = ?, hook_points = ?, reel_results = ?,
            reel_points = ?, cast_score = ?, loot_id = ?, loot_rarity = ?, completed_at = datetime('now')
        WHERE id = ? AND status = 'started'
      `).run(
        evaluation.caught ? 'caught' : 'escaped',
        evaluation.hookGrade,
        evaluation.hookPoints,
        JSON.stringify(evaluation.reelGrades),
        evaluation.reelPoints,
        evaluation.castScore,
        evaluation.loot?.id || '',
        evaluation.rarity || '',
        castId
      );
      recalculateSession(sessionId);
    })();

    const updatedSession = db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(sessionId);
    res.json({
      cast: mapCast(db.prepare('SELECT * FROM fishing_casts WHERE id = ?').get(castId)),
      session: mapSession(updatedSession)
    });
  } catch (error) {
    const validation = /Holowanie|ocena|przynęt/.test(error.message);
    res.status(validation ? 400 : 500).json({ error: `Nie udało się rozliczyć rzutu: ${error.message}` });
  }
});

router.post('/sessions/:sessionId/complete', requireAuth, (req, res) => {
  const { sessionId } = req.params;

  try {
    expireStaleSessions(req.user.id);
    const initial = db.prepare('SELECT * FROM fishing_sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!initial) return res.status(404).json({ error: 'Nie odnaleziono wyprawy.' });
    if (initial.status === 'completed') return res.json(completionResponse(initial, true));
    if (initial.status !== 'in_progress') return res.status(409).json({ error: 'Porzucona wyprawa nie może zostać nagrodzona.' });

    const casts = sessionCasts(sessionId);
    if (casts.length !== FISHING_CASTS_PER_SESSION || casts.some((cast) => cast.status === 'started')) {
      return res.status(409).json({ error: 'Wyprawa wymaga czterech rozliczonych rzutów.' });
    }

    const result = db.transaction(() => {
      recalculateSession(sessionId);
      const session = db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(sessionId);
      const durationMs = Math.max(0, Date.now() - new Date(`${session.started_at}Z`).getTime());
      const validTiming = durationMs >= FISHING_MIN_REWARD_DURATION_MS;
      const baseReward = session.mode === 'reward' && validTiming
        ? rewardForSessionScore(session.score)
        : { housePoints: 0, skirnirs: 0 };
      const bestLoot = session.mode === 'reward' && validTiming ? selectBestRewardLoot(casts) : null;

      const validHouse = req.user.role === 'student' && req.user.house
        ? db.prepare('SELECT id FROM houses WHERE id = ?').get(req.user.house)
        : null;
      const housePoints = validHouse ? baseReward.housePoints : 0;
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (!userRow) throw new Error('Użytkownik nie istnieje.');

      if (housePoints > 0) {
        awardPoints({
          studentId: req.user.id,
          studentName: req.user.fullName || 'Adept',
          house: req.user.house,
          points: housePoints,
          source: `Połów w Zamarzniętym Fjordzie — ${session.score}/680`,
          sourceType: 'MINIGAME',
          sourceId: sessionId,
          actorId: 'system',
          actorName: 'Przystań Drakkarów',
          comment: 'Nagroda za wyprawę połowową.',
          idempotencyKey: `fishing:${sessionId}:points`
        });
      }

      if (baseReward.skirnirs > 0) {
        creditSkirnir({
          userId: req.user.id,
          userName: req.user.fullName || 'Adept',
          amount: baseReward.skirnirs,
          category: 'nagroda',
          title: `Połów w Zamarzniętym Fjordzie — ${session.score}/680`,
          note: 'Rozliczenie wyprawy z Przystani Drakkarów.',
          sourceType: 'MINIGAME',
          sourceId: sessionId,
          actorId: 'system',
          actorName: 'Przystań Drakkarów',
          idempotencyKey: `fishing:${sessionId}:currency`
        });
      }

      if (bestLoot) {
        const freshUser = db.prepare('SELECT inventory FROM users WHERE id = ?').get(req.user.id);
        const inventory = parseJson(freshUser?.inventory, []);
        const existingIndex = inventory.findIndex((item) => item.id === bestLoot.id || item.lootId === bestLoot.id);
        if (existingIndex >= 0) {
          inventory[existingIndex] = {
            ...inventory[existingIndex],
            lootId: bestLoot.id,
            quantity: Math.max(1, Number(inventory[existingIndex].quantity) || 1) + 1
          };
        } else {
          inventory.unshift({
            ...bestLoot,
            lootId: bestLoot.id,
            quantity: 1,
            price: 0,
            source: 'Połów w Zamarzniętym Fjordzie'
          });
        }
        db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(inventory), req.user.id);
      }

      let message;
      if (session.mode === 'training') {
        message = 'Wyprawa treningowa ukończona — wynik zapisano bez nagrody.';
      } else if (!validTiming) {
        message = 'Wyprawa zakończyła się zbyt szybko — wynik zapisano bez nagrody.';
      } else if (baseReward.housePoints === 0 && baseReward.skirnirs === 0 && !bestLoot) {
        message = 'Wynik poniżej progu nagrody. Następna wyprawa może pójść lepiej.';
      } else {
        const parts = [];
        if (housePoints > 0) parts.push(`+${housePoints} pkt Zakonu`);
        if (baseReward.skirnirs > 0) parts.push(`+${baseReward.skirnirs} Skirnirów`);
        if (bestLoot) parts.push(bestLoot.name);
        message = `Wyprawa rozliczona: ${parts.join(', ')}.`;
        if (baseReward.housePoints > 0 && !validHouse) {
          message += ' Punkty Zakonu pominięto — konto nie należy do prawidłowego Zakonu.';
        }
      }

      db.prepare(`
        UPDATE fishing_sessions
        SET status = 'completed', reward_points = ?, reward_skirnirs = ?,
            reward_loot_id = ?, reward_message = ?, completed_at = datetime('now'), last_active_at = datetime('now')
        WHERE id = ? AND status = 'in_progress'
      `).run(housePoints, baseReward.skirnirs, bestLoot?.id || '', message, sessionId);

      return db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(sessionId);
    })();

    const response = completionResponse(result);
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({
      ...response,
      user: dbUserToFrontend(updatedUser),
      rankings: calculateHouseRankings('overall'),
      status: getStatusPayload(req.user.id)
    });
  } catch (error) {
    res.status(500).json({ error: `Nie udało się zakończyć wyprawy: ${error.message}` });
  }
});

router.post('/sessions/:sessionId/abandon', requireAuth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM fishing_sessions WHERE id = ? AND user_id = ?').get(req.params.sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: 'Nie odnaleziono wyprawy.' });
    if (session.status === 'completed') return res.status(409).json({ error: 'Ukończonej wyprawy nie można porzucić.' });
    if (session.status !== 'abandoned') {
      db.prepare(`
        UPDATE fishing_sessions SET status = 'abandoned', completed_at = datetime('now'),
          reward_message = 'Wyprawa została przerwana — brak nagrody.'
        WHERE id = ?
      `).run(session.id);
    }
    res.json({ session: mapSession(db.prepare('SELECT * FROM fishing_sessions WHERE id = ?').get(session.id)), ...getStatusPayload(req.user.id) });
  } catch (error) {
    res.status(500).json({ error: `Nie udało się przerwać wyprawy: ${error.message}` });
  }
});

export default router;
