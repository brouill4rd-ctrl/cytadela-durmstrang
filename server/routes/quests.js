import { Router } from 'express';
import db, { dbCompletedQuestToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

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

      // 2. Update user profile (XP, level, currency, points, inventory)
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
          SET xp = ?, level = ?, next_level_xp = ?, points = points + ?, currency = currency + ?, inventory = ?
          WHERE id = ?
        `).run(
          newXp,
          newLevel,
          nextXp,
          rewardPoints || 0,
          rewardGalleons || 0,
          JSON.stringify(currentInv),
          userId
        );
      }

      // 3. Add house point transaction
      if (rewardPoints > 0 && userRow?.house) {
        const ptId = `pt-quest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO point_transactions (id, student_id, student_name, house, points, source, date, comment, is_revoked, created_at)
          VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, 0, datetime('now'))
        `).run(
          ptId,
          userId,
          userRow.full_name,
          userRow.house,
          rewardPoints,
          `Side Quest Mapy: ${questTitle || questId}`,
          `Ukończenie misji w lokacji ${locationName || 'Twierdzy'}`
        );
      }

      // 4. Add bank transaction
      if (rewardGalleons > 0) {
        const bankTxId = `tx-quest-${Date.now()}`;
        db.prepare(`
          INSERT INTO bank_transactions (id, user_id, user_name, amount, type, category, title, note, status, reference_code, date)
          VALUES (?, ?, ?, ?, 'inflow', 'quest', ?, ?, 'completed', ?, datetime('now'))
        `).run(
          bankTxId,
          userId,
          userRow?.full_name || 'Adept',
          rewardGalleons,
          `Nagroda: ${questTitle || questId}`,
          `Lokacja: ${locationName || 'Cytadela Durmstrang'}`,
          `SKR-QST-${Math.floor(10000 + Math.random() * 90000)}`
        );
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
