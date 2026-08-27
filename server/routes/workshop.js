import { Router } from 'express';
import db, { dbCraftedFormulaToFrontend, dbRuneCatalogToFrontend, dbRuneFormulaToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';

const router = Router();

router.get('/runes', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM runes_catalog ORDER BY sort_order ASC').all();
    res.json(rows.map(dbRuneCatalogToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania run: ' + err.message });
  }
});

router.get('/rune-formulas', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM rune_formulas ORDER BY sort_order ASC').all();
    res.json(rows.map(dbRuneFormulaToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania formuł runicznych: ' + err.message });
  }
});

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
        const idemKey = `craft-${userId}-${formulaId || name}-${Date.now()}`;
        if (rewardPoints > 0 && userRow.house) {
          awardPoints({
            studentId: userId,
            studentName: userRow.full_name,
            house: userRow.house,
            points: rewardPoints,
            source: `Warsztat Runiczny: ${name}`,
            sourceType: 'WORKSHOP',
            sourceId: formulaId || id,
            comment: `Ukucie formuły z katalizatorem: ${catalyst}`,
            idempotencyKey: `pt-${idemKey}`
          });
        }
        if (rewardCurrency > 0) {
          creditSkirnir({
            userId,
            userName: userRow.full_name,
            amount: rewardCurrency,
            category: 'warsztat',
            title: `Nagroda za formułę: ${name}`,
            sourceType: 'WORKSHOP',
            sourceId: formulaId || id,
            idempotencyKey: `skr-${idemKey}`
          });
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
