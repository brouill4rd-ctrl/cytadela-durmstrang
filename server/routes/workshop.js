import { Router } from 'express';
import db, { dbCraftedFormulaToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/workshop/formulas — List crafted formulas for user
router.get('/formulas', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    let query = 'SELECT * FROM crafted_formulas';
    const params = [];
    if (userId && userId !== 'guest') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY rowid DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbCraftedFormulaToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wykutych formuł: ' + err.message });
  }
});

// POST /api/workshop/craft — Craft rune formula on altar
router.post('/craft', requireAuth, (req, res) => {
  try {
    const {
      formulaId,
      name,
      type = 'Bojowa / Ochronna',
      catalyst = 'Krew Renifera',
      runes = [],
      rewardPoints = 15,
      rewardCurrency = 20
    } = req.body;

    const userId = req.user.id;
    if (!name) {
      return res.status(400).json({ error: 'Nazwa formuły jest wymagana.' });
    }

    const tx = db.transaction(() => {
      const id = `craft-${userId}-${formulaId || Date.now()}-${Date.now()}`;
      db.prepare(`
        INSERT INTO crafted_formulas (id, user_id, formula_id, name, type, catalyst, runes, reward_points, reward_currency, crafted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        userId,
        formulaId || id,
        name,
        type,
        catalyst,
        JSON.stringify(runes),
        rewardPoints,
        rewardCurrency
      );

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (userRow) {
        db.prepare('UPDATE users SET points = points + ?, currency = currency + ? WHERE id = ?').run(rewardPoints, rewardCurrency, userId);
        if (rewardPoints > 0 && userRow.house) {
          db.prepare(`
            INSERT INTO point_transactions (id, student_id, student_name, house, points, source, date, comment, is_revoked, created_at)
            VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, 0, datetime('now'))
          `).run(
            `pt-craft-${Date.now()}`,
            userId,
            userRow.full_name,
            userRow.house,
            rewardPoints,
            `Warsztat Runiczny: ${name}`,
            `Ukucie formuły z katalizatorem: ${catalyst}`
          );
        }
      }

      return {
        crafted: db.prepare('SELECT * FROM crafted_formulas WHERE id = ?').get(id),
        user: db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      };
    });

    const result = tx();
    const rankings = calculateHouseRankings('overall');

    res.status(201).json({
      ok: true,
      message: `Pieczęć runiczna „${name}” została wykuta na Ołtarzu! (+${rewardPoints} pkt, +${rewardCurrency} Skirnirów)`,
      formula: dbCraftedFormulaToFrontend(result.crafted),
      user: dbUserToFrontend(result.user),
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd wykuwania pieczęci: ' + err.message });
  }
});

export default router;
