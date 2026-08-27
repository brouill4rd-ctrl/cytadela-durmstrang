import { Router } from 'express';
import db, { dbCeremonyQuestionToFrontend } from '../db.js';

const router = Router();

router.get('/questions', (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM ceremony_questions ORDER BY sort_order ASC').all();
    const allOptions = db.prepare('SELECT * FROM ceremony_options ORDER BY sort_order ASC').all();

    const optionsByQuestion = {};
    for (const opt of allOptions) {
      if (!optionsByQuestion[opt.question_id]) optionsByQuestion[opt.question_id] = [];
      optionsByQuestion[opt.question_id].push(opt);
    }

    res.json(questions.map(q => dbCeremonyQuestionToFrontend(q, optionsByQuestion[q.id] || [])));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania pytań ceremonii: ' + err.message });
  }
});

export default router;
