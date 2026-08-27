import { Router } from 'express';
import db, { dbCompletedQuestToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';

const router = Router();

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
