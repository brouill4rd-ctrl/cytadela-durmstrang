import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  abandonRunicDuel,
  getRunicDuel,
  getRunicDuelStatus,
  startRunicDuel,
  submitRunicDuelAction
} from '../services/runicDuelService.js';

const router = Router();

router.get('/status', requireAuth, (req, res) => {
  try {
    res.json(getRunicDuelStatus(req.user.id));
  } catch (error) {
    res.status(500).json({ error: `Nie udało się odczytać statusu Kręgu: ${error.message}` });
  }
});

router.post('/start', requireAuth, (req, res) => {
  try {
    const result = startRunicDuel({
      userId: req.user.id,
      clientRunId: req.body?.clientRunId,
      mode: req.body?.mode,
      opponentId: req.body?.opponentId
    });
    if (result.error) return res.status(result.code || 400).json({ error: result.error });
    return res.status(result.resumed ? 200 : 201).json(result);
  } catch (error) {
    return res.status(500).json({ error: `Nie udało się rozpocząć pojedynku: ${error.message}` });
  }
});

router.get('/:runId', requireAuth, (req, res) => {
  try {
    const result = getRunicDuel(req.user.id, req.params.runId);
    if (result.error) return res.status(result.code || 400).json({ error: result.error });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: `Nie udało się odczytać pojedynku: ${error.message}` });
  }
});

router.post('/:runId/actions', requireAuth, (req, res) => {
  try {
    const result = submitRunicDuelAction({
      user: req.user,
      runId: req.params.runId,
      actionId: req.body?.actionId,
      turnNumber: req.body?.turnNumber,
      playerAction: req.body?.playerAction
    });
    if (result.error) return res.status(result.code || 400).json({ error: result.error, run: result.run || null });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: `Nie udało się rozliczyć tury: ${error.message}` });
  }
});

router.post('/:runId/abandon', requireAuth, (req, res) => {
  try {
    const result = abandonRunicDuel(req.user.id, req.params.runId);
    if (result.error) return res.status(result.code || 400).json({ error: result.error });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: `Nie udało się porzucić pojedynku: ${error.message}` });
  }
});

export default router;

