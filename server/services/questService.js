// Silnik questów — serwerowa logika wykonywania, walidacji i nagradzania
import { randomUUID } from 'crypto';
import { awardPoints } from './pointsService.js';
import { credit as creditSkirnir } from './skirnirService.js';

let _db = null;

export function initQuestService(db) {
  _db = db;

  // Migracje tabel
  db.exec(`
    CREATE TABLE IF NOT EXISTS quest_narrative_reviews (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      stage_index INTEGER NOT NULL,
      response_text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_discord_id TEXT DEFAULT NULL,
      reviewed_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quest_discord_threads (
      quest_id TEXT NOT NULL,
      discord_user_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      parent_channel_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (quest_id, discord_user_id)
    );

    CREATE TABLE IF NOT EXISTS location_discord_threads (
      location_id TEXT NOT NULL,
      discord_user_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      parent_channel_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (location_id, discord_user_id)
    );

    CREATE TABLE IF NOT EXISTS user_location_action_log (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action_index INTEGER NOT NULL,
      action_label TEXT NOT NULL,
      discord_thread_id TEXT NOT NULL,
      result_text TEXT NOT NULL DEFAULT '',
      effect_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, location_id, action_index)
    );

    CREATE TABLE IF NOT EXISTS location_narrative_reviews (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action_index INTEGER NOT NULL,
      action_label TEXT NOT NULL,
      discord_thread_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_discord_id TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quest_definitions (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'Łatwy',
      location_id TEXT NOT NULL DEFAULT '',
      chain_id TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      requirements_json TEXT NOT NULL DEFAULT '{}',
      stages_json TEXT NOT NULL DEFAULT '[]',
      rewards_json TEXT NOT NULL DEFAULT '{}',
      on_complete_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      available_from TEXT DEFAULT '',
      available_until TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_quest_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      quest_version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      current_stage INTEGER NOT NULL DEFAULT 0,
      state_json TEXT NOT NULL DEFAULT '{}',
      started_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      UNIQUE(user_id, quest_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quest_id) REFERENCES quest_definitions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_uqp_user_status
      ON user_quest_progress(user_id, status);
  `);

  // Dodaj quest_id do user_map_tracking jeśli nie istnieje
  const trackCols = db.pragma('table_info(user_map_tracking)').map(c => c.name);
  if (!trackCols.includes('quest_id')) {
    try {
      db.exec('ALTER TABLE user_map_tracking ADD COLUMN quest_id TEXT DEFAULT NULL;');
    } catch (_) {}
  }

  const locationActionCols = db.pragma('table_info(user_location_action_log)').map(c => c.name);
  if (!locationActionCols.includes('result_text')) {
    try { db.exec("ALTER TABLE user_location_action_log ADD COLUMN result_text TEXT NOT NULL DEFAULT '';"); } catch (_) {}
  }
  if (!locationActionCols.includes('effect_json')) {
    try { db.exec("ALTER TABLE user_location_action_log ADD COLUMN effect_json TEXT NOT NULL DEFAULT '{}';"); } catch (_) {}
  }
  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_location_action_once
      ON user_location_action_log(user_id, location_id, action_index)
    `);
  } catch (_) {}
}

export function loadQuestDefinitions(db, definitions) {
  const stmt = db.prepare(`
    INSERT INTO quest_definitions
      (id, version, title, description, category, difficulty, location_id,
       chain_id, order_index, requirements_json, stages_json, rewards_json,
       on_complete_json, is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    ON CONFLICT(id) DO UPDATE SET
      version       = excluded.version,
      title         = excluded.title,
      description   = excluded.description,
      category      = excluded.category,
      difficulty    = excluded.difficulty,
      location_id   = excluded.location_id,
      chain_id      = excluded.chain_id,
      order_index   = excluded.order_index,
      requirements_json = excluded.requirements_json,
      stages_json   = excluded.stages_json,
      rewards_json  = excluded.rewards_json,
      on_complete_json = excluded.on_complete_json,
      is_active     = 1
  `);

  for (const def of definitions) {
    stmt.run(
      def.id,
      def.version || 1,
      def.title,
      def.description || '',
      def.category || '',
      def.difficulty || 'Łatwy',
      def.location_id || '',
      def.chain_id || '',
      def.order_index || 0,
      JSON.stringify(def.requirements || {}),
      JSON.stringify(def.stages || []),
      JSON.stringify(def.rewards || {}),
      JSON.stringify(def.on_complete_unlock || [])
    );
  }
}

// ─── Warunki odblokowania ────────────────────────────────────────────────────

function checkCondition(cond, userId, db) {
  if (!cond || Object.keys(cond).length === 0) return true;

  if (cond.all) {
    return cond.all.every(c => checkCondition(c, userId, db));
  }
  if (cond.any) {
    return cond.any.some(c => checkCondition(c, userId, db));
  }

  switch (cond.type) {
    case 'quest_completed': {
      const row = db.prepare(
        "SELECT 1 FROM user_quest_progress WHERE user_id=? AND quest_id=? AND status='completed'"
      ).get(userId, cond.id);
      return Boolean(row);
    }
    case 'location_discovered': {
      const row = db.prepare(
        'SELECT 1 FROM user_map_discoveries WHERE user_id=? AND location_id=?'
      ).get(userId, cond.id);
      return Boolean(row);
    }
    case 'level': {
      const user = db.prepare('SELECT level FROM users WHERE id=?').get(userId);
      return user && user.level >= (cond.value || 1);
    }
    case 'order': {
      const user = db.prepare('SELECT house FROM users WHERE id=?').get(userId);
      return user && user.house === cond.value;
    }
    case 'item_owned': {
      const user = db.prepare('SELECT inventory FROM users WHERE id=?').get(userId);
      if (!user) return false;
      let inv = [];
      try { inv = JSON.parse(user.inventory || '[]'); } catch (_) {}
      return inv.some(i => i.id === cond.id || i.name === cond.name);
    }
    default:
      return true;
  }
}

// ─── Status questa dla użytkownika ──────────────────────────────────────────

export function getQuestStatus(questId, userId, db = _db) {
  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) return 'unknown';

  const progress = db.prepare('SELECT status FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);
  if (progress) return progress.status; // 'active' | 'completed' | 'failed'

  let req = {};
  try { req = JSON.parse(def.requirements_json || '{}'); } catch (_) {}

  if (!checkCondition(req, userId, db)) return 'locked';
  return 'available';
}

// ─── Questy dostępne w lokacji ───────────────────────────────────────────────

export function getLocationQuests(locationId, userId, db = _db) {
  const defs = db.prepare(
    'SELECT * FROM quest_definitions WHERE location_id=? AND is_active=1 ORDER BY order_index ASC'
  ).all(locationId);

  return defs.map(def => {
    const status = getQuestStatus(def.id, userId, db);
    let stages = [];
    try { stages = JSON.parse(def.stages_json || '[]'); } catch (_) {}
    let rewards = {};
    try { rewards = JSON.parse(def.rewards_json || '{}'); } catch (_) {}
    let requirements = {};
    try { requirements = JSON.parse(def.requirements_json || '{}'); } catch (_) {}

    const progress = status === 'active'
      ? db.prepare('SELECT current_stage, state_json FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, def.id)
      : null;

    const currentStage = progress ? (stages[progress.current_stage] || null) : null;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      difficulty: def.difficulty,
      chainId: def.chain_id,
      orderIndex: def.order_index,
      status,
      requirements,
      rewards,
      totalStages: stages.length,
      currentStage: progress ? progress.current_stage : 0,
      currentStageInfo: currentStage ? {
        index: currentStage.index,
        type: currentStage.type,
        platform: currentStage.platform || 'both',
        title: currentStage.title,
        objective: currentStage.objective,
      } : null,
    };
  });
}

// ─── Dziennik questów użytkownika ───────────────────────────────────────────

export function getJournal(userId, db = _db) {
  const allProgress = db.prepare(
    "SELECT * FROM user_quest_progress WHERE user_id=? ORDER BY updated_at DESC"
  ).all(userId);

  const progressMap = {};
  for (const p of allProgress) progressMap[p.quest_id] = p;

  const allDefs = db.prepare('SELECT * FROM quest_definitions WHERE is_active=1 ORDER BY chain_id ASC, order_index ASC').all();

  const journal = { active: [], available: [], completed: [] };

  for (const def of allDefs) {
    const status = getQuestStatus(def.id, userId, db);
    if (status === 'locked' || status === 'unknown') continue;

    let stages = [];
    try { stages = JSON.parse(def.stages_json || '[]'); } catch (_) {}
    let rewards = {};
    try { rewards = JSON.parse(def.rewards_json || '{}'); } catch (_) {}

    const progress = progressMap[def.id];
    const currentStage = progress && status === 'active'
      ? stages[progress.current_stage] || null
      : null;

    const entry = {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      difficulty: def.difficulty,
      chainId: def.chain_id,
      orderIndex: def.order_index,
      locationId: def.location_id,
      status,
      rewards,
      currentStage: progress?.current_stage ?? 0,
      totalStages: stages.length,
      currentObjective: currentStage?.objective || null,
      startedAt: progress?.started_at || null,
      completedAt: progress?.completed_at || null,
    };

    if (status === 'completed') journal.completed.push(entry);
    else if (status === 'active') journal.active.push(entry);
    else if (status === 'available') journal.available.push(entry);
  }

  return journal;
}

// ─── Pobierz aktualny stan questa (dla modala) ───────────────────────────────

export function getQuestState(questId, userId, db = _db) {
  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) return null;

  const status = getQuestStatus(questId, userId, db);
  let stages = [];
  try { stages = JSON.parse(def.stages_json || '[]'); } catch (_) {}
  let rewards = {};
  try { rewards = JSON.parse(def.rewards_json || '{}'); } catch (_) {}

  const progress = db.prepare('SELECT * FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);

  if (!progress && status !== 'available') return { id: def.id, status, title: def.title };

  const stageIndex = progress?.current_stage ?? 0;
  const currentStage = stages[stageIndex] || null;

  // Nie ujawniaj score opcji klientowi
  const sanitizedActions = currentStage?.actions?.map(a => ({
    id: a.id,
    label: a.label,
    ...(a.next_stage !== undefined ? { next_stage: a.next_stage } : {}),
  })) || [];

  let stateJson = {};
  try { stateJson = JSON.parse(progress?.state_json || '{}'); } catch (_) {}
  if (stateJson.reward_item_override) rewards.item = stateJson.reward_item_override;

  const pendingReviewId = stateJson.pending_review_id || null;

  return {
    id: def.id,
    title: def.title,
    description: def.description,
    category: def.category,
    difficulty: def.difficulty,
    chainId: def.chain_id,
    locationId: def.location_id,
    status,
    currentStageIndex: stageIndex,
    totalStages: stages.length,
    stage: currentStage ? {
      index: currentStage.index,
      type: currentStage.type,
      platform: currentStage.platform || 'both',
      title: currentStage.title,
      narrative: currentStage.narrative,
      objective: currentStage.objective,
      prompt: currentStage.prompt || null,
      location_id: currentStage.location_id || null,
      actions: sanitizedActions,
      pendingReview: pendingReviewId ? true : false,
    } : null,
    rewards: status === 'completed' ? rewards : null,
    completedAt: progress?.completed_at || null,
    lastActionResult: stateJson.last_action_result || null,
    stateJson,
  };
}

// ─── Rozpocznij quest ────────────────────────────────────────────────────────

export function startQuest(questId, userId, db = _db) {
  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) throw Object.assign(new Error('Quest nie istnieje.'), { statusCode: 404 });

  const existing = db.prepare('SELECT status FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);
  if (existing?.status === 'completed') {
    throw Object.assign(new Error('Ten quest został już ukończony.'), { statusCode: 409 });
  }
  if (existing?.status === 'active') {
    // Zwróć aktualny stan zamiast błędu — pozwól wznowić
    return getQuestState(questId, userId, db);
  }

  let req = {};
  try { req = JSON.parse(def.requirements_json || '{}'); } catch (_) {}
  if (!checkCondition(req, userId, db)) {
    throw Object.assign(new Error('Wymagania questa nie są spełnione.'), { statusCode: 403 });
  }

  db.prepare(`
    INSERT INTO user_quest_progress (id, user_id, quest_id, quest_version, status, current_stage, state_json)
    VALUES (?, ?, ?, ?, 'active', 0, '{}')
  `).run(randomUUID(), userId, questId, def.version);

  return getQuestState(questId, userId, db);
}

// ─── Wyślij akcję (przesuń stage) ────────────────────────────────────────────

export function submitAction(questId, userId, actionId, db = _db, source = 'web') {
  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) throw Object.assign(new Error('Quest nie istnieje.'), { statusCode: 404 });

  const progress = db.prepare('SELECT * FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);
  if (!progress) throw Object.assign(new Error('Quest nie jest aktywny. Najpierw go rozpocznij.'), { statusCode: 400 });
  if (progress.status !== 'active') {
    throw Object.assign(new Error(`Quest jest w stanie "${progress.status}" — nie można go kontynuować.`), { statusCode: 409 });
  }

  let stages = [];
  try { stages = JSON.parse(def.stages_json || '[]'); } catch (_) {}

  const stageIndex = progress.current_stage;
  const currentStage = stages[stageIndex];
  if (!currentStage) throw Object.assign(new Error('Nieprawidłowy etap questa.'), { statusCode: 500 });

  const platform = currentStage.platform || 'both';
  if (platform !== 'both' && platform !== source) {
    const target = platform === 'discord' ? 'w wątku Discord' : 'na stronie';
    throw Object.assign(new Error(`Ten etap wykonuje się ${target}.`), { statusCode: 409 });
  }

  // Walidacja actionId
  const validActions = currentStage.actions || [];
  const chosenAction = validActions.find(a => a.id === actionId);
  if (!chosenAction) {
    throw Object.assign(
      new Error(`Nieznana akcja "${actionId}". Dozwolone: ${validActions.map(a => a.id).join(', ')}`),
      { statusCode: 400 }
    );
  }

  // Dla visit_location: zawsze tylko jedna akcja 'arrived' lub dowolna spośród dostępnych
  // Jeśli mamy score — zapisz go do state_json
  let state = {};
  try { state = JSON.parse(progress.state_json || '{}'); } catch (_) {}

  const choiceKey = `stage_${stageIndex}_choice`;
  state[choiceKey] = { actionId, score: chosenAction.score ?? null };
  const actionResult = chosenAction.result_narrative
    ? String(chosenAction.result_narrative).slice(0, 3500)
    : null;
  if (actionResult) {
    state.last_action_result = {
      stageIndex,
      actionId,
      text: actionResult,
      createdAt: new Date().toISOString(),
    };
  }
  if (chosenAction.reward_item) {
    state.reward_item_override = String(chosenAction.reward_item).slice(0, 160);
  }

  // Wyznacz następny stage
  const nextStageIndex = chosenAction.next_stage !== undefined
    ? chosenAction.next_stage
    : stageIndex + 1;

  const isLastStage = nextStageIndex >= stages.length;

  if (isLastStage) {
    // Atomowo oznacz quest jako ukończony (bez nagród w transakcji)
    db.transaction(() => {
      db.prepare(`
        UPDATE user_quest_progress
        SET status='completed', current_stage=?, state_json=?, updated_at=datetime('now'), completed_at=datetime('now')
        WHERE user_id=? AND quest_id=? AND status='active'
      `).run(nextStageIndex, JSON.stringify(state), userId, questId);

      const changes = db.prepare(
        "SELECT changes() AS n"
      ).get().n;
      if (changes === 0) {
        throw new Error('Quest był już rozliczony (concurrent request).');
      }
    })();

    // Nagrody poza transakcją (nie cofają ukończenia questa przy błędzie serwisu)
    let rewards = {};
    try { rewards = _awardQuestRewards(def, userId, db, state); } catch (_) {}

    // Odblokowania po ukończeniu
    _processOnComplete(def, userId, db);

    return {
      completed: true,
      questId,
      title: def.title,
      rewards,
      actionResult,
      state: getQuestState(questId, userId, db),
    };
  }

  // Przejdź do następnego etapu
  db.prepare(`
    UPDATE user_quest_progress
    SET current_stage=?, state_json=?, updated_at=datetime('now')
    WHERE user_id=? AND quest_id=? AND status='active'
  `).run(nextStageIndex, JSON.stringify(state), userId, questId);

  return {
    completed: false,
    questId,
    actionResult,
    state: getQuestState(questId, userId, db),
  };
}

// ─── Śledzenie questa ────────────────────────────────────────────────────────

export function trackQuest(questId, userId, db = _db) {
  const def = db.prepare('SELECT id, location_id FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) throw Object.assign(new Error('Quest nie istnieje.'), { statusCode: 404 });

  const status = getQuestStatus(questId, userId, db);
  if (status === 'locked') throw Object.assign(new Error('Nie możesz śledzić zablokowanego questa.'), { statusCode: 403 });

  // Pobierz lokację aktualnego etapu
  const progress = db.prepare('SELECT current_stage FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);
  let stages = [];
  try {
    const defFull = db.prepare('SELECT stages_json FROM quest_definitions WHERE id=?').get(questId);
    stages = JSON.parse(defFull?.stages_json || '[]');
  } catch (_) {}

  const stageIndex = progress?.current_stage ?? 0;
  const currentStage = stages[stageIndex];
  const locationId = currentStage?.location_id || def.location_id;

  db.prepare(`
    INSERT INTO user_map_tracking (user_id, location_id, quest_id, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      location_id = excluded.location_id,
      quest_id    = excluded.quest_id,
      updated_at  = excluded.updated_at
  `).run(userId, locationId, questId);

  return { tracked: questId, locationId };
}

export function untrackQuest(userId, db = _db) {
  db.prepare("UPDATE user_map_tracking SET quest_id=NULL WHERE user_id=?").run(userId);
  return { tracked: null };
}

// ─── Prywatne pomocniki ──────────────────────────────────────────────────────

function _awardQuestRewards(def, userId, db, state = {}) {
  let rewards = {};
  try { rewards = JSON.parse(def.rewards_json || '{}'); } catch (_) {}
  if (state.reward_item_override) rewards.item = state.reward_item_override;

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  if (!user) throw new Error('Użytkownik nie istnieje.');

  const idemKey = `quest-${userId}-${def.id}`;

  if (rewards.points > 0 && user.house) {
    awardPoints({
      studentId: userId,
      studentName: user.full_name || 'Adept',
      house: user.house,
      points: rewards.points,
      source: `Quest: ${def.title}`,
      sourceType: 'QUEST',
      sourceId: def.id,
      actorId: 'system',
      actorName: 'System Questów',
      comment: `Łańcuch: ${def.chain_id || 'brak'}`,
      idempotencyKey: `pt-${idemKey}`,
    });
  }

  if (rewards.skirniry > 0) {
    creditSkirnir({
      userId,
      userName: user.full_name || 'Adept',
      amount: rewards.skirniry,
      category: 'quest',
      title: `Nagroda: ${def.title}`,
      note: `Łańcuch: ${def.chain_id || 'brak'}`,
      sourceType: 'QUEST',
      sourceId: def.id,
      idempotencyKey: `skr-${idemKey}`,
    });
  }

  if (rewards.xp > 0) {
    const newXp = (user.xp || 0) + rewards.xp;
    let newLevel = user.level || 1;
    let nextXp = user.next_level_xp || 500;
    let xpLeft = newXp;
    while (xpLeft >= nextXp) {
      newLevel += 1;
      xpLeft -= nextXp;
      nextXp = Math.round(nextXp * 1.5);
    }
    db.prepare('UPDATE users SET xp=?, level=?, next_level_xp=? WHERE id=?').run(xpLeft, newLevel, nextXp, userId);
  }

  if (rewards.item) {
    let inventory = [];
    try { inventory = JSON.parse(user.inventory || '[]'); } catch (_) {}
    if (!inventory.some(i => i.name === rewards.item)) {
      inventory.unshift({
        id: `item-quest-${def.id}-${userId.slice(0, 8)}`,
        name: rewards.item,
        icon: '🎁',
        rarity: 'Nagroda z Questu',
        price: rewards.skirniry * 2 || 30,
        description: `Zdobyto podczas misji „${def.title}".`
      });
      db.prepare('UPDATE users SET inventory=? WHERE id=?').run(JSON.stringify(inventory), userId);
    }
  }

  return rewards;
}

function _processOnComplete(def, userId, db) {
  let actions = [];
  try { actions = JSON.parse(def.on_complete_json || '[]'); } catch (_) {}

  for (const action of actions) {
    if (action.type === 'location' && action.action === 'reveal') {
      // Zmień ukrytą/zablokowaną lokację na widoczną i dostępną
      db.prepare(`
        UPDATE locations SET visibility='visible', state='available'
        WHERE id=? AND (visibility='hidden' OR state='locked')
      `).run(action.id);
    }
  }
}

// ─── Narracyjne recenzje (typ narrative) ─────────────────────────────────────

export function submitNarrative(questId, userId, responseText, db = _db) {
  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=? AND is_active=1').get(questId);
  if (!def) throw Object.assign(new Error('Quest nie istnieje.'), { statusCode: 404 });

  const progress = db.prepare('SELECT * FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(userId, questId);
  if (!progress || progress.status !== 'active') {
    throw Object.assign(new Error('Quest nie jest aktywny.'), { statusCode: 400 });
  }

  let stages = [];
  try { stages = JSON.parse(def.stages_json || '[]'); } catch (_) {}

  const stage = stages[progress.current_stage];
  if (!stage || stage.type !== 'narrative') {
    throw Object.assign(new Error('Aktualny etap nie jest sceną narracyjną.'), { statusCode: 400 });
  }

  let state = {};
  try { state = JSON.parse(progress.state_json || '{}'); } catch (_) {}

  if (state.pending_review_id) {
    throw Object.assign(new Error('Odpowiedź już wysłana — czeka na zatwierdzenie Arxymistrza.'), { statusCode: 409 });
  }

  const reviewId = randomUUID();
  db.prepare(`
    INSERT INTO quest_narrative_reviews (id, quest_id, user_id, stage_index, response_text, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(reviewId, questId, userId, progress.current_stage, responseText.trim().slice(0, 4000));

  state.pending_review_id = reviewId;
  db.prepare(`
    UPDATE user_quest_progress SET state_json=?, updated_at=datetime('now')
    WHERE user_id=? AND quest_id=?
  `).run(JSON.stringify(state), userId, questId);

  return { reviewId, questId, stageIndex: progress.current_stage };
}

export function approveNarrative(reviewId, reviewerDiscordId, db = _db) {
  const review = db.prepare("SELECT * FROM quest_narrative_reviews WHERE id=? AND status='pending'").get(reviewId);
  if (!review) throw Object.assign(new Error('Recenzja nie istnieje lub już rozpatrzona.'), { statusCode: 404 });

  db.prepare(`
    UPDATE quest_narrative_reviews SET status='approved', reviewer_discord_id=?, reviewed_at=datetime('now')
    WHERE id=?
  `).run(reviewerDiscordId, reviewId);

  // Wyczyść pending_review_id i przejdź do następnego stage
  const progress = db.prepare('SELECT * FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(review.user_id, review.quest_id);
  if (!progress) throw new Error('Postęp questa nie istnieje.');

  const def = db.prepare('SELECT * FROM quest_definitions WHERE id=?').get(review.quest_id);
  let stages = [];
  try { stages = JSON.parse(def?.stages_json || '[]'); } catch (_) {}

  let state = {};
  try { state = JSON.parse(progress.state_json || '{}'); } catch (_) {}
  delete state.pending_review_id;

  const nextStageIndex = review.stage_index + 1;
  const isLastStage = nextStageIndex >= stages.length;

  if (isLastStage) {
    db.transaction(() => {
      db.prepare(`
        UPDATE user_quest_progress
        SET status='completed', current_stage=?, state_json=?, updated_at=datetime('now'), completed_at=datetime('now')
        WHERE user_id=? AND quest_id=? AND status='active'
      `).run(nextStageIndex, JSON.stringify(state), review.user_id, review.quest_id);
    })();
    let rewards = {};
    try { rewards = _awardQuestRewards(def, review.user_id, db, state); } catch (_) {}
    _processOnComplete(def, review.user_id, db);
    return { completed: true, questId: review.quest_id, userId: review.user_id, rewards, state: getQuestState(review.quest_id, review.user_id, db) };
  }

  db.prepare(`
    UPDATE user_quest_progress SET current_stage=?, state_json=?, updated_at=datetime('now')
    WHERE user_id=? AND quest_id=? AND status='active'
  `).run(nextStageIndex, JSON.stringify(state), review.user_id, review.quest_id);

  return { completed: false, questId: review.quest_id, userId: review.user_id, state: getQuestState(review.quest_id, review.user_id, db) };
}

export function rejectNarrative(reviewId, reviewerDiscordId, db = _db) {
  const review = db.prepare("SELECT * FROM quest_narrative_reviews WHERE id=? AND status='pending'").get(reviewId);
  if (!review) throw Object.assign(new Error('Recenzja nie istnieje lub już rozpatrzona.'), { statusCode: 404 });

  db.prepare(`
    UPDATE quest_narrative_reviews SET status='rejected', reviewer_discord_id=?, reviewed_at=datetime('now')
    WHERE id=?
  `).run(reviewerDiscordId, reviewId);

  // Wyczyść pending_review_id — gracz może spróbować ponownie
  const progress = db.prepare('SELECT state_json FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(review.user_id, review.quest_id);
  let state = {};
  try { state = JSON.parse(progress?.state_json || '{}'); } catch (_) {}
  delete state.pending_review_id;

  db.prepare(`
    UPDATE user_quest_progress SET state_json=?, updated_at=datetime('now')
    WHERE user_id=? AND quest_id=?
  `).run(JSON.stringify(state), review.user_id, review.quest_id);

  return { rejected: true, questId: review.quest_id, userId: review.user_id };
}

export function getNarrativeReview(reviewId, db = _db) {
  return db.prepare('SELECT * FROM quest_narrative_reviews WHERE id=?').get(reviewId) || null;
}
