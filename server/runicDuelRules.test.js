import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseEnemyAction,
  computeRunicDuelReward,
  createInitialDuelState,
  getActionLegality,
  getLegalActions,
  resolveDuelTurn
} from '../src/game/runicDuelRules.js';

function duel(playerAction, enemyAction, mutate = () => {}, opponentId = 'eirik') {
  const state = createInitialDuelState();
  mutate(state);
  return resolveDuelTurn({ state, playerAction, enemyAction, opponentId });
}

test('Thurisaz kontra Isa zadaje 6 i odbija 5', () => {
  const { state } = duel('thurisaz', 'isa');
  assert.equal(state.enemy.hp, 94);
  assert.equal(state.player.hp, 95);
});

test('Thurisaz anuluje Nauthiz i zadaje 30 obrażeń', () => {
  const { state } = duel('thurisaz', 'nauthiz');
  assert.equal(state.enemy.hp, 70);
  assert.equal(state.player.hp, 100);
});

test('Nauthiz przełamuje Isa i nakłada Odsłonięty', () => {
  const { state } = duel('nauthiz', 'isa');
  assert.equal(state.enemy.hp, 76);
  assert.equal(state.enemy.exposed, true);
});

test('Ansuz przerwany przez Thurisaz nie leczy ani nie daje skupienia', () => {
  const { state } = duel('ansuz', 'thurisaz', (s) => { s.player.hp = 70; });
  assert.equal(state.player.hp, 40);
  assert.equal(state.player.focus, 30);
  assert.equal(state.player.ansuzCooldown, 2);
});

test('cooldown Ansuz blokuje dwie pełne kolejne tury', () => {
  let state = duel('ansuz', 'isa').state;
  assert.equal(getActionLegality(state.player, 'ansuz').legal, false);
  state = resolveDuelTurn({ state, playerAction: 'isa', enemyAction: 'isa', opponentId: 'eirik' }).state;
  assert.equal(state.player.ansuzCooldown, 1);
  state = resolveDuelTurn({ state, playerAction: 'isa', enemyAction: 'isa', opponentId: 'eirik' }).state;
  assert.equal(state.player.ansuzCooldown, 0);
  assert.equal(getActionLegality(state.player, 'ansuz').legal, true);
});

test('trzy różne runy podstawowe uruchamiają dokładnie jeden rezonans', () => {
  let state = createInitialDuelState();
  state = resolveDuelTurn({ state, playerAction: 'isa', enemyAction: 'isa', opponentId: 'eirik' }).state;
  state = resolveDuelTurn({ state, playerAction: 'thurisaz', enemyAction: 'isa', opponentId: 'eirik' }).state;
  const result = resolveDuelTurn({ state, playerAction: 'nauthiz', enemyAction: 'isa', opponentId: 'eirik' });
  assert.equal(result.state.player.resonanceCount, 1);
  assert.deepEqual(result.state.player.chain, []);
  assert.ok(result.events.some((event) => event.type === 'resonance'));
});

test('Tyr jest dostępny tylko z 70 skupienia i tylko raz', () => {
  const state = createInitialDuelState();
  assert.equal(getActionLegality(state.player, 'tyr').legal, false);
  state.player.focus = 100;
  const next = resolveDuelTurn({ state, playerAction: 'tyr', enemyAction: 'isa', opponentId: 'eirik' }).state;
  next.player.focus = 100;
  assert.equal(getActionLegality(next.player, 'tyr').legal, false);
});

test('jednoczesne zero HP daje remis', () => {
  const { state } = duel('thurisaz', 'thurisaz', (s) => {
    s.player.hp = 22;
    s.enemy.hp = 22;
  });
  assert.equal(state.result, 'draw');
  assert.equal(state.score, 0);
});

test('AI jest deterministyczne i wybiera wyłącznie legalną akcję', () => {
  const state = createInitialDuelState();
  const args = { state, opponentId: 'vala', seed: 'test-seed', playerHistory: ['isa'] };
  const a = chooseEnemyAction(args);
  const b = chooseEnemyAction(args);
  assert.equal(a, b);
  assert.ok(getLegalActions(state.enemy).includes(a));
});

test('progi nagród są jednoznaczne', () => {
  assert.deepEqual(computeRunicDuelReward(649), { rank: 'Ocalały Kręgu', housePoints: 4, skirniry: 3 });
  assert.deepEqual(computeRunicDuelReward(650), { rank: 'Runiczny Szermierz', housePoints: 7, skirniry: 5 });
  assert.deepEqual(computeRunicDuelReward(800), { rank: 'Strażnik Bazaltu', housePoints: 10, skirniry: 8 });
  assert.deepEqual(computeRunicDuelReward(900), { rank: 'Mistrz Kręgu', housePoints: 12, skirniry: 10 });
});
