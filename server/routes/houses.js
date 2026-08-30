import { Router } from 'express';
import db, { dbHouseToFrontend } from '../db.js';

const router = Router();

function cleanPersonName(name) {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.trim();

  if (cleaned.includes('•')) {
    const parts = cleaned.split('•');
    const afterBullet = parts.slice(1).join('•').trim();
    const strippedDept = afterBullet.replace(/^(Transmutacja|Czarna Magia|Eliksiry|Starożytne Runy|Zielarstwo|Astromagia|Historia Magii|Zaklęcia|Wróżbiarstwo|Obrona przed Czarną Magią|Latanie|Runy|Alchemia|Klątwy|Szermierka Runiczna|Katedra [^\s]+)\s+/i, '');
    cleaned = strippedDept || afterBullet;
  }

  cleaned = cleaned
    .replace(/^Arcymistrz\s+Cytadeli\s+/i, '')
    .replace(/^Dyrektor\s+(Cytadeli|Szkoły)\s+/i, '')
    .replace(/^Rada\s+Arcymistrzów\s+/i, '')
    .replace(/^Profesor\s+/i, '')
    .replace(/^Prof\.\s+/i, '')
    .trim();

  return cleaned;
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM houses ORDER BY sort_order ASC').all();
    const formatted = rows.map(r => {
      const front = dbHouseToFrontend(r);
      front.headOfHouse = cleanPersonName(front.headOfHouse);
      front.prefect = cleanPersonName(front.prefect);
      return front;
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zakonów: ' + err.message });
  }
});

// GET /api/houses/fortress-guardian
router.get('/fortress-guardian', (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM school_config WHERE key = 'fortress_guardian'").get();
    if (row && row.value) {
      res.json(JSON.parse(row.value));
    } else {
      res.json({
        name: 'Valdemar Krag-Hansen',
        house: 'ravnheim',
        title: 'Strażnik Twierdzy Durmstrang',
        appointedAt: '2026-09-01',
        note: 'Wybrany jednogłośnie przez Radę Mistrzów Cytadeli.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania Strażnika Twierdzy: ' + err.message });
  }
});

// PUT /api/houses/fortress-guardian
router.put('/fortress-guardian', (req, res) => {
  try {
    const guardianData = req.body;
    if (!guardianData || !guardianData.name) {
      return res.status(400).json({ error: 'Brak danych Strażnika Twierdzy.' });
    }

    const value = JSON.stringify(guardianData);
    const existing = db.prepare("SELECT key FROM school_config WHERE key = 'fortress_guardian'").get();
    if (existing) {
      db.prepare("UPDATE school_config SET value = ? WHERE key = 'fortress_guardian'").run(value);
    } else {
      db.prepare("INSERT INTO school_config (key, value) VALUES ('fortress_guardian', ?)").run(value);
    }

    res.json({ ok: true, data: guardianData });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zapisu Strażnika Twierdzy: ' + err.message });
  }
});

// PUT /api/houses/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { headOfHouse, prefect, name, startingPoints } = req.body;

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
    if (!house) {
      return res.status(404).json({ error: 'Zakon nie istnieje: ' + id });
    }

    const newHead = headOfHouse !== undefined ? cleanPersonName(headOfHouse) : house.head_of_house;
    const newPrefect = prefect !== undefined ? cleanPersonName(prefect) : house.prefect;
    const newName = name !== undefined ? name : house.name;
    const newPoints = startingPoints !== undefined ? Number(startingPoints) : house.starting_points;

    db.prepare(`
      UPDATE houses 
      SET head_of_house = ?, prefect = ?, name = ?, starting_points = ?
      WHERE id = ?
    `).run(newHead, newPrefect, newName, newPoints, id);

    const updated = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
    const formatted = dbHouseToFrontend(updated);
    formatted.headOfHouse = cleanPersonName(formatted.headOfHouse);
    formatted.prefect = cleanPersonName(formatted.prefect);
    res.json({ ok: true, data: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji zakonu: ' + err.message });
  }
});

export default router;
