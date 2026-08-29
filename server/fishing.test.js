import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateFishingCast,
  gradeHook,
  rarityForCastScore,
  rewardForSessionScore,
  selectBestRewardLoot,
  validateBaitUsage,
  warsawDateKey
} from './fishing.js';

test('zacięcie respektuje wszystkie granice czasowe', () => {
  assert.deepEqual(gradeHook(299), { grade: 'perfect', points: 40 });
  assert.deepEqual(gradeHook(300), { grade: 'good', points: 30 });
  assert.deepEqual(gradeHook(699), { grade: 'good', points: 30 });
  assert.deepEqual(gradeHook(700), { grade: 'late', points: 20 });
  assert.deepEqual(gradeHook(1299), { grade: 'late', points: 20 });
  assert.deepEqual(gradeHook(1300), { grade: 'miss', points: 0 });
});

test('perfekcyjny rzut ma 170 punktów i legendarną zdobycz z wybranej puli', () => {
  const result = evaluateFishingCast({
    reactionMs: 120,
    reelGrades: ['perfect', 'perfect', 'perfect'],
    baitId: 'runic_lure'
  });
  assert.equal(result.castScore, 170);
  assert.equal(result.caught, true);
  assert.equal(result.rarity, 'legendary');
  assert.equal(result.loot.id, 'fishing-young-leviathan-scale');
});

test('mniej niż dwa trafienia podczas holowania oznaczają ucieczkę', () => {
  const result = evaluateFishingCast({
    reactionMs: 250,
    reelGrades: ['perfect', 'miss', 'miss'],
    baitId: 'ice_worm'
  });
  assert.equal(result.caught, false);
  assert.equal(result.castScore, 70);
  assert.equal(result.loot, null);
});

test('spóźnione zacięcie zeruje wszystkie oceny holowania', () => {
  const result = evaluateFishingCast({
    reactionMs: 1500,
    reelGrades: ['perfect', 'perfect', 'perfect'],
    baitId: 'glow_larva'
  });
  assert.equal(result.castScore, 0);
  assert.deepEqual(result.reelGrades, ['miss', 'miss', 'miss']);
  assert.equal(result.caught, false);
});

test('granice rzadkości są deterministyczne', () => {
  assert.equal(rarityForCastScore(119), 'common');
  assert.equal(rarityForCastScore(120), 'uncommon');
  assert.equal(rarityForCastScore(139), 'uncommon');
  assert.equal(rarityForCastScore(140), 'rare');
  assert.equal(rarityForCastScore(154), 'rare');
  assert.equal(rarityForCastScore(155), 'epic');
  assert.equal(rarityForCastScore(164), 'epic');
  assert.equal(rarityForCastScore(165), 'legendary');
});

test('granice nagród wyprawy są poprawne', () => {
  assert.deepEqual(rewardForSessionScore(199), { housePoints: 0, skirnirs: 0 });
  assert.deepEqual(rewardForSessionScore(200), { housePoints: 2, skirnirs: 2 });
  assert.deepEqual(rewardForSessionScore(319), { housePoints: 2, skirnirs: 2 });
  assert.deepEqual(rewardForSessionScore(320), { housePoints: 4, skirnirs: 4 });
  assert.deepEqual(rewardForSessionScore(439), { housePoints: 4, skirnirs: 4 });
  assert.deepEqual(rewardForSessionScore(440), { housePoints: 6, skirnirs: 6 });
  assert.deepEqual(rewardForSessionScore(559), { housePoints: 6, skirnirs: 6 });
  assert.deepEqual(rewardForSessionScore(560), { housePoints: 8, skirnirs: 8 });
});

test('najlepszy przedmiot wybiera rzadkość, potem wynik, potem wcześniejszy rzut', () => {
  const loot = selectBestRewardLoot([
    { castIndex: 0, castScore: 150, loot: { id: 'rare-a', rarity: 'rare' } },
    { castIndex: 1, castScore: 162, loot: { id: 'epic-a', rarity: 'epic' } },
    { castIndex: 2, castScore: 164, loot: { id: 'epic-b', rarity: 'epic' } },
    { castIndex: 3, castScore: 164, loot: { id: 'epic-c', rarity: 'epic' } }
  ]);
  assert.equal(loot.id, 'epic-b');
});

test('limity przynęt odrzucają trzecią larwę i drugą błystkę', () => {
  assert.throws(
    () => validateBaitUsage([{ baitId: 'glow_larva' }, { baitId: 'glow_larva' }], 'glow_larva'),
    /Limit przynęty/
  );
  assert.throws(
    () => validateBaitUsage([{ baitId: 'runic_lure' }], 'runic_lure'),
    /Limit przynęty/
  );
  assert.equal(validateBaitUsage([{ baitId: 'ice_worm' }], 'ice_worm'), true);
});

test('data połowu jest liczona według strefy Europe/Warsaw', () => {
  assert.equal(warsawDateKey(new Date('2026-08-28T22:30:00Z')), '2026-08-29');
  assert.equal(warsawDateKey(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
});
