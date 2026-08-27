import { Router } from 'express';
import db, { dbHouseToFrontend } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM houses ORDER BY sort_order ASC').all();
    res.json(rows.map(dbHouseToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zakonów: ' + err.message });
  }
});

export default router;
