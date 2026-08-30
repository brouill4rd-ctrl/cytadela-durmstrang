import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { MAP_CONTENT_LOCATIONS } from './seed/mapContentLocations.js';
import { QUEST_DEFINITIONS } from './seed/questDefinitions.js';
import {
  WORLD_QUEST_DEFINITIONS,
  auditWorldQuestDefinitions,
} from './seed/worldQuestDefinitions.js';
import {
  LOCATION_ACTION_DEFINITIONS,
  auditLocationActionDefinitions,
} from './seed/locationActionDefinitions.js';
import {
  initQuestService,
  loadQuestDefinitions,
  startQuest,
  submitAction,
  getQuestStatus,
} from './services/questService.js';
import { initSkirnirService } from './services/skirnirService.js';
import { executeLocationAction } from './services/locationActionService.js';

function makeContentDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT DEFAULT '',
      full_name TEXT DEFAULT 'Tester',
      role TEXT DEFAULT 'student',
      house TEXT DEFAULT '',
      currency INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      next_level_xp INTEGER DEFAULT 500,
      inventory TEXT DEFAULT '[]'
    );
    CREATE TABLE locations (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT '',
      actions TEXT DEFAULT '[]',
      visibility TEXT DEFAULT 'visible',
      state TEXT DEFAULT 'available',
      unlock_condition TEXT DEFAULT ''
    );
    CREATE TABLE user_map_tracking (
      user_id TEXT PRIMARY KEY,
      location_id TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE user_map_discoveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      UNIQUE(user_id, location_id)
    );
    CREATE TABLE school_config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE bank_accounts (
      id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, vault_number TEXT,
      vault_tier TEXT, balance INTEGER DEFAULT 0, security_level TEXT,
      rune_seal TEXT, guardian TEXT, interest_rate TEXT, opened_at TEXT
    );
    CREATE TABLE bank_transactions (
      id TEXT PRIMARY KEY, sender_id TEXT, sender_name TEXT, recipient_id TEXT,
      recipient_name TEXT, amount INTEGER, type TEXT, category TEXT, title TEXT,
      note TEXT, status TEXT, reference_code TEXT, date TEXT, source_type TEXT,
      source_id TEXT, actor_id TEXT, actor_name TEXT, school_year TEXT,
      idempotency_key TEXT DEFAULT '', created_at TEXT
    );
  `);
  initSkirnirService(db);
  initQuestService(db);
  return db;
}

test('wszystkie starsze questy mapy mają wykonywalne definicje', () => {
  const audit = auditWorldQuestDefinitions();
  assert.equal(audit.legacyCount, 64);
  assert.equal(audit.generatedCount, 64);
  assert.deepEqual(audit.missing, []);
  assert.deepEqual(audit.invalid, []);
  assert.equal(audit.complete, true);
  assert.equal(JSON.stringify(WORLD_QUEST_DEFINITIONS).includes('solutionKeywords'), false);
  assert.equal(JSON.stringify(WORLD_QUEST_DEFINITIONS).includes('galleons'), false);
  assert.equal(
    WORLD_QUEST_DEFINITIONS.every(definition => {
      const platforms = new Set(definition.stages.map(stage => stage.platform));
      return platforms.has('web') && platforms.has('discord');
    }),
    true
  );
});

test('każdą ścieżkę wyboru w 64 questach można przejść do ukończenia', () => {
  const db = makeContentDb();

  const independentDefinitions = WORLD_QUEST_DEFINITIONS.map(definition => ({
    ...definition,
    requirements: {},
    rewards: {},
  }));
  loadQuestDefinitions(db, independentDefinitions);

  let expectedCompleted = 0;
  for (const definition of independentDefinitions) {
    for (let openingChoice = 0; openingChoice < definition.stages[0].actions.length; openingChoice += 1) {
      const userId = `world-user-${expectedCompleted}`;
      db.prepare('INSERT INTO users (id, full_name, currency) VALUES (?, ?, ?)').run(userId, 'Tester', 1000);
      let state = startQuest(definition.id, userId, db);
      let steps = 0;
      while (state.status === 'active' && state.stage) {
        const action = state.stage.actions[state.currentStageIndex === 0 ? openingChoice : 0];
        assert.ok(action?.id, `${definition.id}: brak działania`);
        const result = submitAction(
          definition.id,
          userId,
          action.id,
          db,
          state.stage.platform === 'discord' ? 'discord' : 'web'
        );
        state = result.state;
        steps += 1;
        assert.ok(steps <= 10, `${definition.id}: pętla etapów`);
      }
      assert.equal(state.status, 'completed', `${definition.id}: quest nieukończony`);
      expectedCompleted += 1;
    }
  }

  const completed = db.prepare("SELECT COUNT(*) AS count FROM user_quest_progress WHERE status='completed'").get().count;
  assert.equal(completed, expectedCompleted);
  assert.ok(expectedCompleted >= 100);
});

test('pełny graf wymagań odblokowuje wszystkie 64 questy bez zakleszczeń', () => {
  const db = makeContentDb();
  db.prepare("INSERT INTO users (id, full_name, currency) VALUES ('chain-user','Tester',1000)").run();
  for (const location of MAP_CONTENT_LOCATIONS) {
    db.prepare('INSERT INTO user_map_discoveries (id, user_id, location_id) VALUES (?, ?, ?)')
      .run(`disc-${location.id}`, 'chain-user', location.id);
  }
  loadQuestDefinitions(db, WORLD_QUEST_DEFINITIONS.map(definition => ({ ...definition, rewards: {} })));

  const pending = new Set(WORLD_QUEST_DEFINITIONS.map(definition => definition.id));
  let progress = true;
  while (pending.size > 0 && progress) {
    progress = false;
    for (const questId of [...pending]) {
      if (getQuestStatus(questId, 'chain-user', db) !== 'available') continue;
      let state = startQuest(questId, 'chain-user', db);
      while (state.status === 'active' && state.stage) {
        const result = submitAction(
          questId,
          'chain-user',
          state.stage.actions[0].id,
          db,
          state.stage.platform === 'discord' ? 'discord' : 'web'
        );
        state = result.state;
      }
      assert.equal(state.status, 'completed');
      pending.delete(questId);
      progress = true;
    }
  }

  assert.deepEqual([...pending], []);
});

test('wszystkie 171 działań lokacji mają treść i konkretne efekty', () => {
  const audit = auditLocationActionDefinitions();
  assert.equal(audit.expected, 171);
  assert.equal(audit.generated, 171);
  assert.deepEqual(audit.invalid, []);
  assert.equal(audit.complete, true);
  assert.equal(LOCATION_ACTION_DEFINITIONS.every(action => action.effects && action.result), true);
});

test('działanie lokacji nalicza efekty tylko raz', () => {
  const db = makeContentDb();
  db.prepare("INSERT INTO users (id, username, full_name, currency, inventory) VALUES ('action-user','tester','Tester',20,'[]')").run();
  db.prepare("INSERT INTO locations (id, name, actions) VALUES ('test-shop','Sklep','[\"Kup zioła lecznicze\",\"Zbadaj zaplecze\"]')").run();

  const first = executeLocationAction({
    locationId: 'test-shop', userId: 'action-user', actionIndex: 0,
    discordThreadId: 'thread-1', db,
  });
  assert.equal(first.duplicate, false);
  assert.equal(first.effects.skirnirySpent, 5);
  assert.equal(first.effects.itemAdded, 'zioła lecznicze');

  const duplicate = executeLocationAction({
    locationId: 'test-shop', userId: 'action-user', actionIndex: 0,
    discordThreadId: 'thread-1', db,
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(db.prepare("SELECT currency FROM users WHERE id='action-user'").get().currency, 15);
  assert.equal(JSON.parse(db.prepare("SELECT inventory FROM users WHERE id='action-user'").get().inventory).length, 1);

  const exploration = executeLocationAction({
    locationId: 'test-shop', userId: 'action-user', actionIndex: 1,
    discordThreadId: 'thread-1', db,
  });
  assert.equal(exploration.effects.xpAwarded, 2);
  assert.equal(db.prepare("SELECT xp FROM users WHERE id='action-user'").get().xp, 2);
});

test('każda lokacja i każdy quest ma unikalny identyfikator', () => {
  const locationIds = MAP_CONTENT_LOCATIONS.map(location => location.id);
  const questIds = [...QUEST_DEFINITIONS, ...WORLD_QUEST_DEFINITIONS].map(quest => quest.id);
  assert.equal(new Set(locationIds).size, locationIds.length);
  assert.equal(new Set(questIds).size, questIds.length);
});
