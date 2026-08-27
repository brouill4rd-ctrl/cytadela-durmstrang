import { Router } from 'express';
import db, { dbSecretToFrontend, dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir } from '../services/skirnirService.js';

const router = Router();

// GET /api/secrets — Get discovered secrets for user
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    let query = 'SELECT * FROM discovered_secrets';
    const params = [];
    if (userId && userId !== 'guest') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    const rows = db.prepare(query).all(...params);
    res.json(rows.map(dbSecretToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania odkrytych sekretów: ' + err.message });
  }
});

// POST /api/secrets/discover — Discover a secret rune / hidden passage
router.post('/discover', requireAuth, (req, res) => {
  try {
    const { secretId, points = 10, currency = 15 } = req.body;
    const userId = req.user.id;
    if (!secretId) {
      return res.status(400).json({ error: 'Brak identyfikatora sekretu.' });
    }

    const existing = db.prepare('SELECT id FROM discovered_secrets WHERE user_id = ? AND secret_id = ?').get(userId, secretId);
    if (existing) {
      return res.json({ alreadyDiscovered: true, message: 'Ten sekret został już przez Ciebie odkryty.' });
    }

    const tx = db.transaction(() => {
      const id = `sec-${userId}-${secretId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO discovered_secrets (id, user_id, secret_id, discovered_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(id, userId, secretId);

      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (userRow) {
        const idemKey = `secret-${userId}-${secretId}`;
        if (points > 0 && userRow.house) {
          awardPoints({
            studentId: userId,
            studentName: userRow.full_name,
            house: userRow.house,
            points,
            source: `Odkrycie Sekretu: ${secretId}`,
            sourceType: 'SECRET',
            sourceId: secretId,
            comment: 'Znalezienie tajemnej runy w Cytadeli',
            idempotencyKey: `pt-${idemKey}`
          });
        }
        if (currency > 0) {
          creditSkirnir({
            userId,
            userName: userRow.full_name,
            amount: currency,
            category: 'sekret',
            title: `Skarb z sekretu: ${secretId}`,
            sourceType: 'SECRET',
            sourceId: secretId,
            idempotencyKey: `skr-${idemKey}`
          });
        }
      }

      return {
        secret: db.prepare('SELECT * FROM discovered_secrets WHERE id = ?').get(id),
        user: db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      };
    });

    const result = tx();
    const rankings = calculateHouseRankings('overall');

    res.status(201).json({
      ok: true,
      message: `Tajemnica odczytana! Przyznano +${points} pkt i +${currency} Skirnirów.`,
      secret: dbSecretToFrontend(result.secret),
      user: dbUserToFrontend(result.user),
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu sekretu: ' + err.message });
  }
});

export default router;
