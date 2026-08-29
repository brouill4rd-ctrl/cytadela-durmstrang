import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpedition, warsawDateKey } from './expeditions.js';

test('ocena wyprawy wylicza wynik wyłącznie z decyzji zapisanych na serwerze', () => {
  assert.deepEqual(evaluateExpedition('drakkar_graveyard', ['drakkar_leap', 'norse_greeting']), {
    score: 6,
    maxScore: 6,
    success: true,
    coins: 25,
    points: 15,
    item: 'Srebrny Naszyjnik Jarlów Fiordu'
  });
});

test('zbyt słaby wynik kończy trudną wyprawę bez nagrody', () => {
  const result = evaluateExpedition('jotun_caves', ['ice_charge', 'touch_crystal']);
  assert.equal(result.score, 2);
  assert.equal(result.success, false);
  assert.equal(result.coins, 0);
  assert.equal(result.points, 0);
});

test('nie można przesłać dwóch decyzji z tego samego etapu', () => {
  assert.throws(
    () => evaluateExpedition('shadow_forest', ['ignis', 'invisibility']),
    /nieprawidłowe decyzje/
  );
});

test('doba ekspedycyjna jest liczona w strefie Europe\/Warsaw', () => {
  assert.equal(warsawDateKey(new Date('2026-08-28T22:30:00Z')), '2026-08-29');
});

