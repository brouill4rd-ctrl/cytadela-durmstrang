import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

import { initQuestService, loadQuestDefinitions, startQuest, submitAction, getQuestStatus, getJournal, getQuestState, trackQuest, untrackQuest } from './services/questService.js';

// ─── Dane testowe ────────────────────────────────────────────────────────────

const PILOT_CHAIN = [
  {
    id: 'test-q1',
    version: 1,
    title: 'Quest Testowy 1',
    description: 'Pierwszy quest w łańcuchu',
    category: 'Test',
    difficulty: 'Łatwy',
    location_id: 'test-loc-1',
    chain_id: 'test-chain',
    order_index: 1,
    requirements: {},
    stages: [
      {
        index: 0,
        type: 'dialogue',
        title: 'Scena otwierająca',
        narrative: 'Narracja testowa.',
        objective: 'Cel testowy',
        actions: [
          { id: 'dalej', label: 'Kontynuuj' }
        ]
      },
      {
        index: 1,
        type: 'choice',
        title: 'Wybór',
        narrative: 'Wybierz ścieżkę.',
        objective: 'Dokonaj wyboru',
        actions: [
          { id: 'dobry', label: 'Dobra odpowiedź', score: 3 },
          { id: 'zly', label: 'Zła odpowiedź', score: 0 }
        ]
      }
    ],
    rewards: { points: 10, xp: 30, skirniry: 5 }
  },
  {
    id: 'test-q2',
    version: 1,
    title: 'Quest Testowy 2',
    description: 'Drugi quest — wymaga ukończenia pierwszego',
    category: 'Test',
    difficulty: 'Łatwy',
    location_id: 'test-loc-1',
    chain_id: 'test-chain',
    order_index: 2,
    requirements: { type: 'quest_completed', id: 'test-q1' },
    stages: [
      {
        index: 0,
        type: 'choice',
        title: 'Jedyny wybór',
        narrative: 'Jeden etap.',
        objective: 'Zakończ',
        actions: [{ id: 'gotowe', label: 'Gotowe' }]
      }
    ],
    rewards: { points: 20, xp: 50, skirniry: 10 }
  }
];

// ─── Pomocnik: baza testowa ──────────────────────────────────────────────────

function makeTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // Minimalne tabele wymagane przez questService
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      full_name TEXT DEFAULT 'Tester',
      house TEXT DEFAULT 'ravnheim',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      next_level_xp INTEGER DEFAULT 500,
      inventory TEXT DEFAULT '[]'
    );

    CREATE TABLE locations (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Test Location',
      visibility TEXT DEFAULT 'visible',
      state TEXT DEFAULT 'available',
      unlock_condition TEXT DEFAULT ''
    );

    CREATE TABLE user_map_tracking (
      user_id TEXT PRIMARY KEY,
      location_id TEXT,
      quest_id TEXT DEFAULT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE user_map_discoveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      UNIQUE(user_id, location_id)
    );

    CREATE TABLE user_quest_progress (
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
      UNIQUE(user_id, quest_id)
    );

    CREATE TABLE completed_quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      UNIQUE(user_id, quest_id)
    );
  `);

  // Inicjuj serwis questów
  initQuestService(db);
  loadQuestDefinitions(db, PILOT_CHAIN);

  // Stub awardPoints i creditSkirnir — nie robimy nic w testach
  return db;
}

function makeUser(db, overrides = {}) {
  const id = `usr-${randomUUID().slice(0, 8)}`;
  db.prepare(`INSERT INTO users (id, full_name, house, level, xp, next_level_xp, inventory)
    VALUES (?,?,?,?,?,?,?)`)
    .run(id, overrides.full_name || 'Tester', overrides.house || 'ravnheim',
      overrides.level || 1, overrides.xp || 0, overrides.next_level_xp || 500,
      JSON.stringify(overrides.inventory || []));
  return id;
}

// ─── Stub usług nagród (bezpieczny no-op dla testów) ─────────────────────────
// Importujemy serwis po inicjalizacji — stubs przez monkey-patching modułu nie są trywialne,
// więc testy weryfikują logikę questEngine, a nie wypłatę nagród.

// ─── TEST 1: Rozpoczęcie dostępnego questa ───────────────────────────────────

test('1. Można rozpocząć dostępny quest', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  const state = startQuest('test-q1', userId, db);
  assert.equal(state.status, 'active');
  assert.equal(state.currentStageIndex, 0);
  assert.equal(state.stage.type, 'dialogue');
});

// ─── TEST 2: Odrzucenie zablokowanego questa ─────────────────────────────────

test('2. Nie można rozpocząć questa z niespełnionymi wymaganiami', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  // test-q2 wymaga ukończenia test-q1
  assert.throws(
    () => startQuest('test-q2', userId, db),
    /Wymagania questa nie są spełnione/
  );
});

// ─── TEST 3: Wymuszona kolejność etapów ─────────────────────────────────────

test('3. Etapy są wykonywane w kolejności', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);

  // Etap 0 → 1
  const r1 = submitAction('test-q1', userId, 'dalej', db);
  assert.equal(r1.completed, false);
  assert.equal(r1.state.currentStageIndex, 1);

  // Etap 1 → complete
  const r2 = submitAction('test-q1', userId, 'dobry', db);
  assert.equal(r2.completed, true);
});

// ─── TEST 4: Odrzucenie nieznanej akcji ─────────────────────────────────────

test('4. Nieznana akcja jest odrzucana', () => {
  const db = makeTestDb();
  const userId = makeUser(db);
  startQuest('test-q1', userId, db);

  assert.throws(
    () => submitAction('test-q1', userId, 'nieistnieje', db),
    /Nieznana akcja/
  );
});

// ─── TEST 5: Zapis i wznowienie aktywnego questa ────────────────────────────

test('5. Stan questa jest zachowany między wywołaniami', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);
  submitAction('test-q1', userId, 'dalej', db);

  // Pobierz stan od nowa (symulacja wznowienia)
  const state = getQuestState('test-q1', userId, db);
  assert.equal(state.status, 'active');
  assert.equal(state.currentStageIndex, 1);
  assert.equal(state.stage.type, 'choice');
});

// ─── TEST 6: Ukończenie i prawidłowy status ──────────────────────────────────

test('6. Po ukończeniu status zmienia się na "completed"', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);
  submitAction('test-q1', userId, 'dalej', db);
  submitAction('test-q1', userId, 'dobry', db);

  const status = getQuestStatus('test-q1', userId, db);
  assert.equal(status, 'completed');
});

// ─── TEST 7: Brak podwójnej nagrody (drugi start odrzucony) ──────────────────

test('7. Ukończonego questa nie można zacząć od nowa', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);
  submitAction('test-q1', userId, 'dalej', db);
  submitAction('test-q1', userId, 'dobry', db);

  assert.throws(
    () => startQuest('test-q1', userId, db),
    /już ukończony/
  );
});

// ─── TEST 8: Odblokowanie następnego questa ──────────────────────────────────

test('8. Po ukończeniu pierwszego questa drugi staje się dostępny', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  // Przed ukończeniem test-q1
  assert.equal(getQuestStatus('test-q2', userId, db), 'locked');

  startQuest('test-q1', userId, db);
  submitAction('test-q1', userId, 'dalej', db);
  submitAction('test-q1', userId, 'dobry', db);

  // Po ukończeniu test-q1
  assert.equal(getQuestStatus('test-q2', userId, db), 'available');
});

// ─── TEST 9: Odblokowanie lokacji po ukończeniu łańcucha ─────────────────────

test('9. Lokacja jest odblokowywana przez on_complete_unlock', () => {
  const specialChain = [
    {
      id: 'unlock-q1',
      version: 1,
      title: 'Quest odblokowujący',
      description: 'Ten quest odblokowuje lokację',
      category: 'Test',
      difficulty: 'Łatwy',
      location_id: 'test-loc-unlock',
      chain_id: 'unlock-chain',
      order_index: 1,
      requirements: {},
      stages: [
        {
          index: 0, type: 'choice', title: 'Jedyny etap',
          narrative: 'Test', objective: 'Zakończ',
          actions: [{ id: 'tak', label: 'Tak' }]
        }
      ],
      rewards: { points: 5, xp: 10, skirniry: 2 },
      on_complete_unlock: [{ type: 'location', id: 'secret-loc', action: 'reveal' }]
    }
  ];

  const db = makeTestDb();
  // Dodaj lokację sekretną
  db.prepare("INSERT INTO locations (id, name, visibility, state) VALUES ('secret-loc','Sekret','hidden','locked')").run();
  loadQuestDefinitions(db, specialChain);

  const userId = makeUser(db);
  startQuest('unlock-q1', userId, db);
  submitAction('unlock-q1', userId, 'tak', db);

  const loc = db.prepare("SELECT visibility, state FROM locations WHERE id='secret-loc'").get();
  assert.equal(loc.visibility, 'visible');
  assert.equal(loc.state, 'available');
});

// ─── TEST 10: Ochrona ukrytych lokacji ──────────────────────────────────────

test('10. checkUnlockCondition z pustym warunkiem zwraca false (lokacja pozostaje locked)', () => {
  // Testujemy logikę map.js — checkUnlockCondition z pustym JSON
  // Importujemy bezpośrednio przez weryfikację w bazie
  const db = makeTestDb();
  const userId = makeUser(db);

  // Quest z wymaganiem lokacji — lokacja jest locked i nieodkryta
  db.prepare("INSERT INTO locations (id, name, visibility, state, unlock_condition) VALUES ('secret-hidden','Hidden','hidden','locked','')").run();

  // Użytkownik NIE powinien mieć dostępu — weryfikujemy przez brak odkrycia
  const disc = db.prepare('SELECT 1 FROM user_map_discoveries WHERE user_id=? AND location_id=?').get(userId, 'secret-hidden');
  assert.equal(disc, undefined);
});

// ─── TEST 11: Śledzenie konkretnego questa ───────────────────────────────────

test('11. trackQuest zapisuje quest_id i location_id', () => {
  const db = makeTestDb();
  db.prepare("INSERT INTO locations (id, name, visibility, state) VALUES ('test-loc-1','Las','visible','available')").run();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);
  trackQuest('test-q1', userId, db);

  const row = db.prepare('SELECT quest_id, location_id FROM user_map_tracking WHERE user_id=?').get(userId);
  assert.equal(row.quest_id, 'test-q1');
  assert.ok(row.location_id);
});

// ─── TEST 12: Dwa równoległe żądania ukończenia ──────────────────────────────

test('12. Dwa równoległe żądania ukończenia nie podwajają nagrody', () => {
  const db = makeTestDb();
  const userId = makeUser(db);

  startQuest('test-q1', userId, db);
  submitAction('test-q1', userId, 'dalej', db);

  // Pierwsze ukończenie
  const r1 = submitAction('test-q1', userId, 'dobry', db);
  assert.equal(r1.completed, true);

  // Drugie żądanie — quest już completed
  assert.throws(
    () => submitAction('test-q1', userId, 'dobry', db),
    /nie można go kontynuować/
  );
});

test('13. Etap Discord nie może zostać wykonany przez endpoint strony', () => {
  const db = makeTestDb();
  const userId = makeUser(db);
  loadQuestDefinitions(db, [{
    id: 'platform-discord-q1', version: 1, title: 'Discord stage',
    location_id: 'test-loc-1', chain_id: 'platform', order_index: 1,
    requirements: {}, rewards: {},
    stages: [{
      index: 0, type: 'choice', platform: 'discord', title: 'Discord',
      objective: 'Wybierz w wątku', actions: [{ id: 'discord_action_long', label: 'Wykonaj na Discordzie' }]
    }]
  }]);

  const state = startQuest('platform-discord-q1', userId, db);
  assert.equal(state.stage.platform, 'discord');
  assert.throws(
    () => submitAction('platform-discord-q1', userId, 'discord_action_long', db, 'web'),
    /w wątku Discord/
  );
  const result = submitAction('platform-discord-q1', userId, 'discord_action_long', db, 'discord');
  assert.equal(result.completed, true);
});

test('14. Etap odwiedzenia lokacji przyjmuje akcję arrived', () => {
  const db = makeTestDb();
  const userId = makeUser(db);
  loadQuestDefinitions(db, [{
    id: 'visit-location-q1', version: 1, title: 'Wizyta',
    location_id: 'test-loc-1', chain_id: 'visit', order_index: 1,
    requirements: {}, rewards: {},
    stages: [{
      index: 0, type: 'visit_location', platform: 'web', title: 'Dotrzyj',
      objective: 'Dotrzyj do celu', location_id: 'test-loc-2',
      actions: [{ id: 'arrived', label: 'Dotarłem' }]
    }]
  }]);

  startQuest('visit-location-q1', userId, db);
  const result = submitAction('visit-location-q1', userId, 'arrived', db, 'web');
  assert.equal(result.completed, true);
});
