import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCatalog,
  getUserStatus,
  createSession,
  getSessionState,
  advanceEncounter,
  submitIdentify,
  submitCountermeasure,
  completeSession,
  abandonSession
} from '../services/bestiaryService.js';

const router = Router();

function ok(res, data) {
  return res.json(data);
}

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

// GET /api/bestiary/catalog — public beast data
router.get('/catalog', (req, res) => {
  ok(res, { beasts: getCatalog() });
});

// GET /api/bestiary/status — authenticated user status
router.get('/status', requireAuth, (req, res) => {
  const result = getUserStatus(req.user.id);
  ok(res, result);
});

// POST /api/bestiary/sessions
router.post('/sessions', requireAuth, (req, res) => {
  const { runId, mode } = req.body;
  if (!runId || typeof runId !== 'string' || runId.trim().length === 0 || runId.length > 100) {
    return fail(res, 400, 'Wymagany niepusty runId (maks. 100 znaków).');
  }

  const result = createSession({ userId: req.user.id, runId: runId.trim(), requestedMode: mode });

  if (result.error) return fail(res, 400, result.error);
  if (result.conflict) return fail(res, 409, 'Identyfikator sesji należy do innego użytkownika.');
  if (result.needsResume) {
    return res.status(200).json({ needsResume: true, activeSessionId: result.activeSessionId });
  }

  ok(res, { session: result.session, created: result.created, resumed: result.resumed, mode: result.mode });
});

// GET /api/bestiary/sessions/:sessionId
router.get('/sessions/:sessionId', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');

  const result = getSessionState(sessionId, req.user.id);

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');

  ok(res, result);
});

// POST /api/bestiary/sessions/:sessionId/advance
router.post('/sessions/:sessionId/advance', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');

  const result = advanceEncounter(sessionId, req.user.id);

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');
  if (result.error) return fail(res, 409, result.error);

  ok(res, result);
});

// POST /api/bestiary/sessions/:sessionId/identify
router.post('/sessions/:sessionId/identify', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const { actionId, choiceId } = req.body;

  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');
  if (!actionId || typeof actionId !== 'string' || actionId.trim().length === 0 || actionId.length > 100) {
    return fail(res, 400, 'Wymagany niepusty actionId (maks. 100 znaków).');
  }
  if (!choiceId || typeof choiceId !== 'string' || choiceId.trim().length === 0 || choiceId.length > 100) {
    return fail(res, 400, 'Wymagany niepusty choiceId (maks. 100 znaków).');
  }

  const result = submitIdentify({
    sessionId,
    userId: req.user.id,
    actionId: actionId.trim(),
    choiceId: choiceId.trim()
  });

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');
  if (result.error) return fail(res, 409, result.error);

  ok(res, result);
});

// POST /api/bestiary/sessions/:sessionId/countermeasure
router.post('/sessions/:sessionId/countermeasure', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const { actionId, choiceId } = req.body;

  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');
  if (!actionId || typeof actionId !== 'string' || actionId.trim().length === 0 || actionId.length > 100) {
    return fail(res, 400, 'Wymagany niepusty actionId (maks. 100 znaków).');
  }
  if (!choiceId || typeof choiceId !== 'string' || choiceId.trim().length === 0 || choiceId.length > 100) {
    return fail(res, 400, 'Wymagany niepusty choiceId (maks. 100 znaków).');
  }

  const result = submitCountermeasure({
    sessionId,
    userId: req.user.id,
    actionId: actionId.trim(),
    choiceId: choiceId.trim()
  });

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');
  if (result.error) return fail(res, 409, result.error);

  ok(res, result);
});

// POST /api/bestiary/sessions/:sessionId/complete
router.post('/sessions/:sessionId/complete', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');

  const result = completeSession(sessionId, req.user.id);

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');
  if (result.error) return fail(res, 409, result.error);

  ok(res, result);
});

// POST /api/bestiary/sessions/:sessionId/abandon
router.post('/sessions/:sessionId/abandon', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId || sessionId.length > 100) return fail(res, 400, 'Nieprawidłowy sessionId.');

  const result = abandonSession(sessionId, req.user.id);

  if (result.notFound) return fail(res, 404, 'Sesja nie istnieje.');
  if (result.forbidden) return fail(res, 403, 'Brak dostępu do tej sesji.');
  if (result.error) return fail(res, 409, result.error);

  ok(res, result);
});

export default router;
