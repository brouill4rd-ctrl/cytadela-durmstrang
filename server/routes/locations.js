import { Router } from 'express';
import db, { dbLocationToFrontend } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM locations ORDER BY sort_order ASC').all();
    res.json(rows.map(dbLocationToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania lokacji: ' + err.message });
  }
});

export default router;
