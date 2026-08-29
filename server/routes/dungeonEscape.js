import { Router } from 'express';
import db, { dbUserToFrontend, calculateHouseRankings } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getDungeonStatus,
  startOrResumeAttempt,
  submitStageAnswer,
  requestHint,
  abandonAttempt
} from '../services/dungeonEscapeService.js';

const router = Router();

// GET /api/dungeon-escape/status
router.get('/status', requireAuth, (req, res) => {
  try {
    const status = getDungeonStatus(req.user.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Błąd odczytu statusu Labiryntu: ' + err.message });
  }
});

// POST /api/dungeon-escape/start — rozpocznij lub wznów podejście
router.post('/start', requireAuth, (req, res) => {
  try {
    const result = startOrResumeAttempt(
      req.user.id,
      req.user.fullName || req.user.full_name,
      req.user.house
    );

    if (result.error) return res.status(result.code || 400).json({ error: result.error });
    res.status(result.resumed ? 200 : 201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się rozpocząć podejścia: ' + err.message });
  }
});

// POST /api/dungeon-escape/submit — prześlij odpowiedź dla bieżącego etapu
router.post('/submit', requireAuth, (req, res) => {
  try {
    const { attemptId, answer } = req.body;
    if (!attemptId || !answer) {
      return res.status(400).json({ error: 'Wymagane: attemptId i answer.' });
    }

    // Klient nie może przesłać wysokości nagrody ani wyniku
    const sanitizedAnswer = {};
    if (typeof answer.r1 === 'number') sanitizedAnswer.r1 = answer.r1;
    if (typeof answer.r2 === 'number') sanitizedAnswer.r2 = answer.r2;
    if (typeof answer.r3 === 'number') sanitizedAnswer.r3 = answer.r3;
    if (typeof answer.constellationId === 'string') sanitizedAnswer.constellationId = answer.constellationId;
    if (answer.undo === true) sanitizedAnswer.undo = true;
    if (typeof answer.solvent === 'string') sanitizedAnswer.solvent = answer.solvent;
    if (typeof answer.catalyst === 'string') sanitizedAnswer.catalyst = answer.catalyst;

    const result = submitStageAnswer(req.user.id, attemptId, sanitizedAnswer);

    if (result.error) return res.status(result.code || 400).json({ error: result.error, outcome: result.outcome });

    // Jeśli ukończono — dołącz dane użytkownika i rankingi
    if (result.outcome === 'completed' && result.user) {
      const updatedUser = dbUserToFrontend(result.user);
      const rankings = calculateHouseRankings('overall');
      return res.json({ ...result, user: updatedUser, rankings });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Błąd zatwierdzania odpowiedzi: ' + err.message });
  }
});

// POST /api/dungeon-escape/hint — pobierz podpowiedź
router.post('/hint', requireAuth, (req, res) => {
  try {
    const { attemptId } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'Wymagane: attemptId.' });

    const result = requestHint(req.user.id, attemptId);
    if (result.error) return res.status(result.code || 400).json({ error: result.error, outcome: result.outcome });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się pobrać podpowiedzi: ' + err.message });
  }
});

// POST /api/dungeon-escape/abandon — porzuć podejście
router.post('/abandon', requireAuth, (req, res) => {
  try {
    const { attemptId } = req.body;
    if (!attemptId) return res.status(400).json({ error: 'Wymagane: attemptId.' });

    const result = abandonAttempt(req.user.id, attemptId);
    if (result.error) return res.status(result.code || 400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się porzucić podejścia: ' + err.message });
  }
});

export default router;
