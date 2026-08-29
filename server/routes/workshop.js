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
router.get('/formulas', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM crafted_formulas WHERE user_id = ? ORDER BY rowid DESC'
    ).all(req.user.id);
    res.json(rows.map(dbCraftedFormulaToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wykutych formuł: ' + err.message });
  }
});

// POST /api/workshop/craft — Craft rune formula on altar
router.post('/craft', requireAuth, (req, res) => {
  try {
    const { formulaId, catalyst = 'Krew Renifera', runes = [] } = req.body;

    const userId = req.user.id;
    if (!formulaId) return res.status(400).json({ error: 'Wybierz formułę z katalogu Warsztatu.' });

    const catalogFormula = db.prepare('SELECT * FROM rune_formulas WHERE id = ?').get(formulaId);
    if (!catalogFormula) return res.status(404).json({ error: 'Nieznana formuła runiczna.' });

    const expectedRunes = JSON.parse(catalogFormula.runes || '[]').map(String).sort();
    const submittedRunes = Array.isArray(runes) ? runes.map(String).sort() : [];
    if (expectedRunes.length !== submittedRunes.length || expectedRunes.some((rune, index) => rune !== submittedRunes[index])) {
      return res.status(400).json({ error: 'Zestaw run nie odpowiada wybranej formule.' });
    }

    const existing = db.prepare(
      'SELECT * FROM crafted_formulas WHERE user_id = ? AND formula_id = ?'
    ).get(userId, formulaId);
    if (existing) {
      return res.json({
        ok: true,
        alreadyCrafted: true,
        message: 'Ta formuła została już przez Ciebie wykuta.',
        formula: dbCraftedFormulaToFrontend(existing),
        user: dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(userId)),
        rankings: calculateHouseRankings('overall')
      });
    }

    const name = catalogFormula.name;
    const type = catalogFormula.type || 'Bojowa / Ochronna';
    const rewardPoints = Math.max(0, Number(catalogFormula.reward_points) || 0);
    const rewardCurrency = Math.max(0, Number(catalogFormula.reward_currency) || 0);

    const tx = db.transaction(() => {
      const id = `craft-${userId}-${formulaId}`;
      db.prepare(`
        INSERT INTO crafted_formulas (id, user_id, formula_id, name, type, catalyst, runes, reward_points, reward_currency, crafted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        userId,
        formulaId,
        name,
        type,
        catalyst,
        JSON.stringify(runes),
        rewardPoints,
        rewardCurrency
      );

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (userRow) {
        const idemKey = `craft-${userId}-${formulaId}`;
        if (rewardPoints > 0 && userRow.house) {
          awardPoints({
            studentId: userId,
            studentName: userRow.full_name,
            house: userRow.house,
            points: rewardPoints,
            source: `Warsztat Runiczny: ${name}`,
            sourceType: 'WORKSHOP',
            sourceId: formulaId,
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
            sourceId: formulaId,
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
