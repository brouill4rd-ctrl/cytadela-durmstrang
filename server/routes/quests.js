import { Router } from 'express';
import db, { dbCompletedQuestToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';
import { randomUUID } from 'crypto';
import {
  EXPEDITIONS,
  EXPEDITION_DAILY_LIMIT,
  evaluateExpedition,
  warsawDateKey
} from '../expeditions.js';

const router = Router();

function getExpeditionStatus(userId, dateKey = warsawDateKey()) {
  const attempts = db.prepare(`
    SELECT id, destination_id, status, score, reward_points, reward_skirnirs,
           reward_item, started_at, completed_at
    FROM expedition_attempts
    WHERE user_id = ? AND date_key = ?
    ORDER BY started_at ASC
  `).all(userId, dateKey);

  return {
    dateKey,
    dailyLimit: EXPEDITION_DAILY_LIMIT,
    used: attempts.length,
    remaining: Math.max(0, EXPEDITION_DAILY_LIMIT - attempts.length),
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      destinationId: attempt.destination_id,
      status: attempt.status,
      score: attempt.score,
      rewardPoints: attempt.reward_points,
      rewardSkirnirs: attempt.reward_skirnirs,
      rewardItem: attempt.reward_item || null,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at
    }))
  };
}

// GET /api/quests/expeditions/status — dzienny limit i historia wypraw
router.get('/expeditions/status', requireAuth, (req, res) => {
  try {
    res.json(getExpeditionStatus(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się odczytać rejestru ekspedycji: ' + err.message });
  }
});

// POST /api/quests/expeditions/start — rezerwuje dzienny slot przed pokazaniem decyzji
router.post('/expeditions/start', requireAuth, (req, res) => {
  try {
    const { destinationId } = req.body;
    const expedition = EXPEDITIONS[destinationId];
    if (!expedition) return res.status(400).json({ error: 'Nieznany cel ekspedycji.' });
    if (req.user.role === 'student' && !req.user.house) {
      return res.status(403).json({ error: 'Aby wyruszyć, musisz należeć do jednego z Zakonów.' });
    }

    const dateKey = warsawDateKey();
    const result = db.transaction(() => {
      const status = getExpeditionStatus(req.user.id, dateKey);
      if (status.attempts.some((attempt) => attempt.destinationId === destinationId)) {
        return { error: 'Ten szlak został już dziś wykorzystany.', statusCode: 409 };
      }
      if (status.used >= EXPEDITION_DAILY_LIMIT) {
        return { error: 'Dzisiejszy limit trzech ekspedycji został wyczerpany.', statusCode: 429 };
      }

      const attemptId = `exp-${dateKey}-${req.user.id}-${randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO expedition_attempts (id, user_id, destination_id, date_key, status)
        VALUES (?, ?, ?, ?, 'in_progress')
      `).run(attemptId, req.user.id, destinationId, dateKey);
      return { attemptId };
    })();

    if (result.error) return res.status(result.statusCode).json({ error: result.error, ...getExpeditionStatus(req.user.id, dateKey) });
    res.status(201).json({
      ok: true,
      attemptId: result.attemptId,
      message: `Otwarto szlak: ${expedition.name}.`,
      ...getExpeditionStatus(req.user.id, dateKey)
    });
  } catch (err) {
    if (String(err.message).includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Ten szlak został już dziś wykorzystany.' });
    }
    res.status(500).json({ error: 'Nie udało się rozpocząć ekspedycji: ' + err.message });
  }
});

// POST /api/quests/expeditions/complete — serwer ocenia decyzje i atomowo rozlicza nagrody
router.post('/expeditions/complete', requireAuth, (req, res) => {
  try {
    const { attemptId, choices } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'Brak identyfikatora rozpoczętej ekspedycji.' });

    const attempt = db.prepare('SELECT * FROM expedition_attempts WHERE id = ? AND user_id = ?').get(attemptId, req.user.id);
    if (!attempt) return res.status(404).json({ error: 'Nie odnaleziono tej ekspedycji w rejestrze.' });
    if (attempt.status !== 'in_progress') {
      return res.status(409).json({ error: 'Ta ekspedycja została już rozliczona.' });
    }

    const evaluation = evaluateExpedition(attempt.destination_id, choices);
    const expedition = EXPEDITIONS[attempt.destination_id];

    const result = db.transaction(() => {
      const status = evaluation.success ? 'success' : 'failed';
      db.prepare(`
        UPDATE expedition_attempts
        SET status = ?, score = ?, reward_points = ?, reward_skirnirs = ?,
            reward_item = ?, completed_at = datetime('now')
        WHERE id = ? AND status = 'in_progress'
      `).run(
        status,
        evaluation.score,
        evaluation.points,
        evaluation.coins,
        evaluation.item || '',
        attemptId
      );

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (!userRow) throw new Error('Użytkownik nie istnieje.');

      if (evaluation.item) {
        let inventory = [];
        try { inventory = JSON.parse(userRow.inventory || '[]'); } catch (_) {}
        if (!inventory.some((item) => item.name === evaluation.item)) {
          inventory.unshift({
            id: `item-${attemptId}`,
            name: evaluation.item,
            icon: '🎁',
            rarity: 'Legendarny Artefakt',
            price: evaluation.coins * 2,
            description: `Zdobyto podczas ekspedycji: ${expedition.name}.`
          });
          db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(inventory), req.user.id);
        }
      }

      if (evaluation.points > 0) {
        awardPoints({
          studentId: req.user.id,
          studentName: req.user.fullName || 'Adept',
          house: req.user.house,
          points: evaluation.points,
          source: `Ekspedycja Północy: ${expedition.name}`,
          sourceType: 'EXPEDITION',
          sourceId: attemptId,
          actorId: 'system',
          actorName: 'Kwatermistrz Ekspedycji',
          comment: `Wynik wyprawy: ${evaluation.score}/6`,
          idempotencyKey: `pt-${attemptId}`
        });
      }

      if (evaluation.coins > 0) {
        creditSkirnir({
          userId: req.user.id,
          userName: req.user.fullName || 'Adept',
          amount: evaluation.coins,
          category: 'ekspedycja',
          title: `Łup z ekspedycji: ${expedition.name}`,
          note: `Wynik wyprawy: ${evaluation.score}/6`,
          sourceType: 'EXPEDITION',
          sourceId: attemptId,
          idempotencyKey: `skr-${attemptId}`
        });
      }

      return db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    })();

    res.json({
      ok: true,
      expedition: { id: expedition.id, name: expedition.name },
      result: evaluation,
      user: dbUserToFrontend(result),
      rankings: calculateHouseRankings('overall'),
      status: getExpeditionStatus(req.user.id)
    });
  } catch (err) {
    const isValidation = /Nieznany cel|dokładnie dwóch|nieprawidłowe decyzje|progu nagrody/.test(err.message);
    res.status(isValidation ? 400 : 500).json({ error: 'Nie udało się rozliczyć ekspedycji: ' + err.message });
  }
});

// GET /api/quests/completed — Get completed quests for current or given user
router.get('/completed', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    let query = 'SELECT * FROM completed_quests';
    const params = [];
    if (userId && userId !== 'guest') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY rowid DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbCompletedQuestToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania ukończonych zadań: ' + err.message });
  }
});

// POST /api/quests/complete — Mark a quest as completed and award all rewards atomically
router.post('/complete', requireAuth, (req, res) => {
  try {
    const {
      questId,
      questTitle,
      locationId,
      locationName,
      rewardPoints = 20,
      rewardXp = 50,
      rewardGalleons = 15,
      rewardItem = null
    } = req.body;

    const userId = req.user.id;
    if (!questId) {
      return res.status(400).json({ error: 'Brak identyfikatora zadania (questId).' });
    }

    // Check if already completed
    const existing = db.prepare('SELECT id FROM completed_quests WHERE user_id = ? AND quest_id = ?').get(userId, questId);
    if (existing) {
      return res.status(200).json({
        alreadyCompleted: true,
        message: 'To zadanie zostało już wcześniej ukończone i nagrodzone.'
      });
    }

    const tx = db.transaction(() => {
      const completionId = `comp-${userId}-${questId}-${Date.now()}`;
      const rewardItemName = typeof rewardItem === 'object' ? (rewardItem?.name || 'Artefakt z Mapy') : (rewardItem || 'Artefakt z Mapy');

      // 1. Insert completed quest record
      db.prepare(`
        INSERT INTO completed_quests (id, user_id, quest_id, quest_title, location_id, location_name, reward_points, reward_xp, reward_galleons, reward_item, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        completionId,
        userId,
        questId,
        questTitle || questId,
        locationId || '',
        locationName || '',
        rewardPoints,
        rewardXp,
        rewardGalleons,
        rewardItemName
      );

      // 2. Update user profile (XP, level, inventory — NOT points/currency, those go through services)
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (userRow) {
        let currentInv = [];
        try {
          currentInv = JSON.parse(userRow.inventory || '[]');
        } catch (_) {}

        if (rewardItem) {
          const itemObj = typeof rewardItem === 'object' ? rewardItem : {
            id: `item-quest-${questId}-${Date.now()}`,
            name: rewardItem,
            icon: '🧭',
            rarity: 'Nagroda z Questu',
            price: rewardGalleons || 25,
            description: `Zdobyto podczas misji „${questTitle || questId}” w lokacji ${locationName || 'Cytadeli'}.`
          };
          if (!currentInv.some(i => i.name === itemObj.name || (itemObj.id && i.id === itemObj.id))) {
            currentInv.unshift(itemObj);
          }
        }

        let newXp = (userRow.xp || 0) + (rewardXp || 0);
        let newLevel = userRow.level || 1;
        let nextXp = userRow.next_level_xp || 500;

        while (newXp >= nextXp) {
          newLevel += 1;
          newXp -= nextXp;
          nextXp = Math.round(nextXp * 1.5);
        }

        db.prepare(`
          UPDATE users
          SET xp = ?, level = ?, next_level_xp = ?, inventory = ?
          WHERE id = ?
        `).run(newXp, newLevel, nextXp, JSON.stringify(currentInv), userId);
      }

      // 3. Award house points via central service
      const idemKey = `quest-${userId}-${questId}`;
      if (rewardPoints > 0 && userRow?.house) {
        awardPoints({
          studentId: userId,
          studentName: userRow?.full_name || 'Adept',
          house: userRow.house,
          points: rewardPoints,
          source: `Side Quest Mapy: ${questTitle || questId}`,
          sourceType: 'QUEST',
          sourceId: questId,
          actorId: 'system',
          actorName: 'System Cytadeli',
          comment: `Ukończenie misji w lokacji ${locationName || 'Twierdzy'}`,
          idempotencyKey: `pt-${idemKey}`
        });
      }

      // 4. Award Skirniry via central service
      if (rewardGalleons > 0) {
        creditSkirnir({
          userId,
          userName: userRow?.full_name || 'Adept',
          amount: rewardGalleons,
          category: 'quest',
          title: `Nagroda: ${questTitle || questId}`,
          note: `Lokacja: ${locationName || 'Cytadela Durmstrang'}`,
          sourceType: 'QUEST',
          sourceId: questId,
          idempotencyKey: `skr-${idemKey}`
        });
      }

      return {
        completion: db.prepare('SELECT * FROM completed_quests WHERE id = ?').get(completionId),
        updatedUser: db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      };
    });

    const result = tx();
    const rankings = calculateHouseRankings('overall');

    res.status(201).json({
      ok: true,
      message: `Zadanie „${questTitle || questId}” ukończone! Przyznano +${rewardPoints} pkt, +${rewardXp} XP i nagrody.`,
      completion: dbCompletedQuestToFrontend(result.completion),
      user: dbUserToFrontend(result.updatedUser),
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zatwierdzania zadania: ' + err.message });
  }
});

export default router;
