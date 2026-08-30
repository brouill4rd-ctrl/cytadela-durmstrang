import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import db from '../db.js';
import {
  getLocationQuests,
  getJournal,
  getQuestState,
  startQuest,
  submitAction,
  trackQuest,
  untrackQuest,
} from '../services/questService.js';
import { discordBot } from '../discordBot.js';

const router = Router();

function handleError(res, err) {
  const code = err.statusCode || 500;
  res.status(code).json({ error: err.message || 'Błąd serwera.' });
}

// GET /api/quest-engine/journal
router.get('/journal', requireAuth, (req, res) => {
  try {
    res.json(getJournal(req.user.id, db));
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/quest-engine/location/:locationId
router.get('/location/:locationId', requireAuth, (req, res) => {
  try {
    const quests = getLocationQuests(req.params.locationId, req.user.id, db);
    res.json(quests);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/quest-engine/location/:locationId/discord-thread
router.post('/location/:locationId/discord-thread', requireAuth, async (req, res) => {
  try {
    const user = db.prepare('SELECT discord_id FROM users WHERE id=?').get(req.user.id);
    if (!user?.discord_id) {
      return res.status(400).json({ error: 'Najpierw powiąż konto portalu z Discordem.' });
    }
    if (!discordBot?.isReady) {
      return res.status(503).json({ error: 'Bot Discord jest obecnie niedostępny.' });
    }
    const discovered = db.prepare(
      'SELECT 1 FROM user_map_discoveries WHERE user_id=? AND location_id=?'
    ).get(req.user.id, req.params.locationId);
    if (!discovered) {
      return res.status(403).json({ error: 'Najpierw odkryj tę lokację na mapie.' });
    }

    const result = await discordBot.openLocationActionsThread(user.discord_id, req.params.locationId);
    res.json({ ok: true, ...result });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/quest-engine/:questId/state
router.get('/:questId/state', requireAuth, (req, res) => {
  try {
    const state = getQuestState(req.params.questId, req.user.id, db);
    if (!state) return res.status(404).json({ error: 'Quest nie istnieje.' });
    res.json(state);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/quest-engine/:questId/start
router.post('/:questId/start', requireAuth, (req, res) => {
  try {
    const state = startQuest(req.params.questId, req.user.id, db);
    res.status(201).json({ ok: true, state });

    // Wyślij scenę do publicznego wątku questa, jeśli konto Discord jest powiązane
    setImmediate(() => {
      try {
        const user = db.prepare('SELECT discord_id FROM users WHERE id=?').get(req.user.id);
        if (user?.discord_id && discordBot?.isReady && state?.stage?.platform !== 'web') {
          discordBot.sendQuestSceneToThread(user.discord_id, req.params.questId, state);
        }
      } catch (_) {}
    });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/quest-engine/:questId/action
router.post('/:questId/action', requireAuth, (req, res) => {
  try {
    const { actionId } = req.body;
    if (!actionId) return res.status(400).json({ error: 'Brak actionId.' });
    const result = submitAction(req.params.questId, req.user.id, actionId, db, 'web');
    res.json({ ok: true, ...result });

    // Wyślij kolejną scenę do publicznego wątku questa
    setImmediate(() => {
      try {
        const user = db.prepare('SELECT discord_id FROM users WHERE id=?').get(req.user.id);
        if (user?.discord_id && discordBot?.isReady && !result.completed && result.state?.stage?.platform !== 'web') {
          discordBot.sendQuestSceneToThread(user.discord_id, req.params.questId, result.state);
        } else if (user?.discord_id && discordBot?.isReady && result.completed) {
          discordBot.sendQuestCompleteToThread(user.discord_id, req.params.questId, result.state?.title || req.params.questId, result.rewards, result.actionResult);
        }
      } catch (_) {}
    });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/quest-engine/track
router.post('/track', requireAuth, (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId) return res.status(400).json({ error: 'Brak questId.' });
    const result = trackQuest(questId, req.user.id, db);
    res.json({ ok: true, ...result });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/quest-engine/track
router.delete('/track', requireAuth, (req, res) => {
  try {
    res.json(untrackQuest(req.user.id, db));
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
