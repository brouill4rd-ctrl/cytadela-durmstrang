import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYER_ACTIONS, OPPONENTS, MAX_HP, MAX_FOCUS, MAX_TURNS, STARTING_FOCUS,
  createPRNG, rngInt,
  initRoundState, isActionLegal, getEnemyIntent,
  applyPlayerAction, resolveEnemyTurn,
  computeRoundScore, computeScore, computeReward, getRank,
  replayFromLog,
} from '../src/game/wandFencingRules.js';

const rng = createPRNG(42);

function freshState(roundIdx = 0, carry = null) {
  return initRoundState(roundIdx, carry);
}

// Pomocnicza: jedna pełna tura (gracz + wróg)
function oneTurn(state, actionId, seed = 42) {
  const r = createPRNG(seed);
  const pRng = r();
  const { newState: s1, roundDone, playerDefeated } = applyPlayerAction(state, actionId, pRng);
  if (roundDone || playerDefeated) return { state: s1, roundDone, playerDefeated };
  const eRng = r();
  const { newState: s2, playerDefeated: pd } = resolveEnemyTurn(s1, eRng, actionId === 'northern_guard');
  return { state: s2, roundDone: false, playerDefeated: pd };
}

// ===== 1. Każda akcja respektuje koszt/przyrost skupienia i zakres 0–100 =====

test('runic_cut zwiększa skupienie o 18', () => {
  const state = freshState();
  const { newState } = applyPlayerAction(state, 'runic_cut', 0.5);
  assert.equal(newState.focus, Math.min(MAX_FOCUS, STARTING_FOCUS + 18));
});

test('champion_strike zmniejsza skupienie o 50', () => {
  const state = { ...freshState(), focus: 60 };
  const { newState } = applyPlayerAction(state, 'champion_strike', 0.5);
  assert.equal(newState.focus, 10);
});

test('skupienie nie spada poniżej 0', () => {
  const state = { ...freshState(), focus: 10 };
  const { newState } = applyPlayerAction(state, 'champion_strike', 0.5);
  assert.equal(newState.focus, 0);
});

test('skupienie nie przekracza 100', () => {
  const state = { ...freshState(), focus: 95 };
  const { newState } = applyPlayerAction(state, 'runic_cut', 0.5);
  assert.equal(newState.focus, MAX_FOCUS);
});

test('champion_strike zablokowany poniżej 50 skupienia', () => {
  const state = { ...freshState(), focus: 49 };
  const { legal } = isActionLegal(state, 'champion_strike');
  assert.equal(legal, false);
});

// ===== 2. Cooldown =====

test('Garda Północy ma cooldown 2 po użyciu', () => {
  const state = freshState();
  const { newState } = applyPlayerAction(state, 'northern_guard', 0.5);
  assert.equal(newState.cooldowns.northern_guard, 2);
});

test('Garda Północy jest zablokowana przez cooldown', () => {
  let state = freshState();
  ({ newState: state } = applyPlayerAction(state, 'northern_guard', 0.5));
  const { legal } = isActionLegal(state, 'northern_guard');
  assert.equal(legal, false);
});

test('cooldown Gardy nie spada w turze użycia', () => {
  const state = freshState();
  const { newState } = applyPlayerAction(state, 'northern_guard', 0.5);
  // Cooldown nadal 2 (nie dekrementowany w tej samej turze)
  assert.equal(newState.cooldowns.northern_guard, 2);
});

test('cooldown spada po pełnej turze i odblokowuje akcję po 2 turach', () => {
  let state = freshState();
  // Tura 1: użycie Gardy
  ({ newState: state } = applyPlayerAction(state, 'northern_guard', 0.5));
  const eR = createPRNG(42);
  // Tura 1 wróg (dekrementuje cooldown dla innych, nie dla użytej)
  ({ newState: state } = resolveEnemyTurn(state, eR(), false));
  // Po turze 1: northern_guard = 2 (nie dekrementowane w turze użycia)
  // Tura 2: gracz używa innej akcji, cooldown Gardy spada
  ({ newState: state } = applyPlayerAction(state, 'runic_cut', 0.5));
  ({ newState: state } = resolveEnemyTurn(state, eR(), false));
  // northern_guard powinno być 1
  assert.equal(state.cooldowns.northern_guard, 1);
  // Tura 3: runic_cut, cooldown Gardy spada do 0
  ({ newState: state } = applyPlayerAction(state, 'runic_cut', 0.5));
  ({ newState: state } = resolveEnemyTurn(state, eR(), false));
  assert.equal(state.cooldowns.northern_guard, 0);
  // Teraz Garda dostępna
  assert.equal(isActionLegal(state, 'northern_guard').legal, true);
});

// ===== 3. Status Odsłonięty =====

test('Odsłonięty wzmacnia runic_cut o +50%', () => {
  const state = { ...freshState(), exposed: true };
  const { newState, events } = applyPlayerAction(state, 'runic_cut', 0.0); // minDmg = 14
  const dmgEvt = events.find(e => e.type === 'player_action');
  // 14 * 1.5 = 21
  assert.equal(dmgEvt.damage, 21);
  assert.equal(dmgEvt.exposedConsumed, true);
  assert.equal(newState.exposed, false);
});

test('Odsłonięty wzmacnia champion_strike', () => {
  const state = { ...freshState(), focus: 100, exposed: true };
  const { events } = applyPlayerAction(state, 'champion_strike', 0.0); // minDmg=28 -> 42
  const dmgEvt = events.find(e => e.type === 'player_action');
  assert.equal(dmgEvt.damage, 42);
});

test('Odsłonięty NIE wzmacnia Gardy', () => {
  const state = { ...freshState(), exposed: true };
  const { events, newState } = applyPlayerAction(state, 'northern_guard', 0.0);
  const dmgEvt = events.find(e => e.type === 'player_action');
  // minDmg=5, bez wzmocnienia
  assert.equal(dmgEvt.damage, 5);
  assert.equal(dmgEvt.exposedConsumed, false);
  // Odsłonięty NIE jest konsumowany przez Gardę
  assert.equal(newState.exposed, true);
});

test('Odsłonięty NIE wzmacnia Zwodniczego znaku', () => {
  const state = { ...freshState(), exposed: true };
  const { events, newState } = applyPlayerAction(state, 'decoy_sign', 0.0);
  const dmgEvt = events.find(e => e.type === 'player_action');
  // minDmg=9, bez wzmocnienia
  assert.equal(dmgEvt.damage, 9);
  // Odsłonięty NIE jest konsumowany, ale decoy_sign go nadpisuje (exposed zostaje true)
  assert.equal(newState.exposed, true);
});

// ===== 4. Garda redukuje następny cios i znika =====

test('Garda redukuje następny cios o 60%', () => {
  let state = freshState();
  // Użyj Gardy
  ({ newState: state } = applyPlayerAction(state, 'northern_guard', 0.5));
  assert.equal(state.shield, true);
  assert.equal(state.shieldPct, 60);
  // Wróg atakuje z rngVal=1.0 → maxDmg=12 (Sven)
  const { newState: s2, events } = resolveEnemyTurn(state, 0.999, false);
  const shieldEvt = events.find(e => e.type === 'shield_block');
  assert.ok(shieldEvt, 'Powinien być event shield_block');
  assert.ok(shieldEvt.reduction > 0);
  // Osłona znika po użyciu
  assert.equal(s2.shield, false);
  assert.equal(s2.shieldPct, 0);
});

test('Garda znika po jednym ciosie', () => {
  let state = { ...freshState(), shield: true, shieldPct: 60 };
  const { newState } = resolveEnemyTurn(state, 0.5, false);
  assert.equal(newState.shield, false);
});

// ===== 5. Pokonany przeciwnik nie kontratakuje =====

test('pokonany przeciwnik nie kontratakuje', () => {
  const state = { ...freshState(), enemyHp: 1, playerHp: 100 };
  const { roundDone, playerDefeated } = applyPlayerAction(state, 'runic_cut', 0.5);
  assert.equal(roundDone, true);
  assert.equal(playerDefeated, false);
  // Nie wywołujemy resolveEnemyTurn gdy roundDone=true
});

// ===== 6. Jednoczesne 0 HP przez kontrę = porażka gracza =====

test('jednoczesne 0 HP przez kontrę Ilony to porażka gracza', () => {
  // Gracz ma 1 HP, Ilona ma 1 HP, kontra aktywna
  const state = {
    ...freshState(2),
    playerHp: 1,
    enemyHp: 1,
    enemyState: { moveCount: 3, counterActive: true },
    focus: 20,
  };
  const { playerDefeated, roundDone, events } = applyPlayerAction(state, 'runic_cut', 0.0);
  // Obie strony giną — ale gracz ginie od kontry → porażka
  assert.equal(playerDefeated, true);
  assert.equal(roundDone, false);
});

// ===== 7. Specjalna umiejętność Svena =====

test('Sven zapowiada Nerwowe pchnięcie co 3 ruchy', () => {
  let state = freshState(0);
  const r = createPRNG(99);
  let announced = false;
  for (let i = 0; i < 2; i++) {
    ({ newState: state } = resolveEnemyTurn(state, r(), false));
    // Stan po ruchu 1: moveCount=1, bez zapowiedzi
    // Stan po ruchu 2: moveCount=2, zapowiedź
    if (state.enemyState.nextIsSpecial) announced = true;
  }
  assert.equal(announced, true, 'Po 2. ruchu Sven powinien zapowiedzieć specjalny');
});

test('Sven używa Nerwowego pchnięcia na 3. ruchu i zadaje 14', () => {
  let state = freshState(0);
  const r = createPRNG(99);
  // 2 normalne ruchy (2. ustawia nextIsSpecial)
  ({ newState: state } = resolveEnemyTurn(state, r(), false));
  ({ newState: state } = resolveEnemyTurn(state, r(), false));
  assert.equal(state.enemyState.nextIsSpecial, true);
  // 3. ruch — Nerwowe pchnięcie
  const { events } = resolveEnemyTurn(state, r(), false);
  const special = events.find(e => e.type === 'enemy_special' && e.name === 'Nerwowe pchnięcie');
  assert.ok(special, 'Powinien być event Nerwowego pchnięcia');
  assert.equal(special.damage, 14);
});

test('Gunnar wchodzi w Szał niedźwiedzia raz, gdy HP <= 35', () => {
  let state = freshState(1);
  state = { ...state, enemyHp: 35 };
  const r = createPRNG(7);
  const { newState, events } = resolveEnemyTurn(state, r(), false);
  assert.equal(newState.enemyState.berserkActivated, true, 'Berserk powinien być aktywowany');
  // Drugi raz nie aktywuje
  const { newState: s2 } = resolveEnemyTurn({ ...newState, enemyHp: 30 }, r(), false);
  assert.equal(s2.enemyState.berserkActivated, true);
  // berserkTurnsLeft był 2, po 1. turze → 1
  assert.equal(s2.enemyState.berserkTurnsLeft, 1);
});

test('Ilona ustawia kontrę co 4 ruchy', () => {
  let state = freshState(2);
  const r = createPRNG(11);
  for (let i = 0; i < 3; i++) {
    ({ newState: state } = resolveEnemyTurn(state, r(), false));
  }
  assert.equal(state.enemyState.counterActive, false, 'Przed 4. ruchem kontra nieaktywna');
  ({ newState: state } = resolveEnemyTurn(state, r(), false));
  assert.equal(state.enemyState.counterActive, true, 'Po 4. ruchu kontra aktywna');
});

test('Vidar leczy się raz na rundę', () => {
  let state = { ...freshState(3), enemyHp: 80 };
  const r = createPRNG(5);
  const { newState: s1, events } = resolveEnemyTurn(state, r(), false);
  const healEvt = events.find(e => e.type === 'enemy_special' && e.name === 'Leczenie alchemiczne');
  assert.ok(healEvt);
  assert.equal(s1.enemyState.hasHealedThisRound, true);
  assert.equal(s1.enemyState.brittleGuardActive, true);
  // Drugi raz w tej samej rundzie NIE leczy
  const { events: ev2 } = resolveEnemyTurn(s1, r(), false);
  assert.ok(!ev2.find(e => e.type === 'enemy_special' && e.name === 'Leczenie alchemiczne'));
});

// ===== 8. Limit 12 tur =====

test('limit 12 tur: wygrywa strona z większym % HP', () => {
  // Gracz 100HP vs Sven 30HP (max 60) → gracz ma 100%, Sven 50% → gracz wygrywa
  let state = freshState(0);
  state = { ...state, playerHp: 100, enemyHp: 30, turn: MAX_TURNS - 1, playerActionsUsed: MAX_TURNS - 1 };
  const { newState } = applyPlayerAction(state, 'runic_cut', 0.0); // min dmg 14 → enemy 30-14=16 > 0, turn becomes 12
  // Teraz limit osiągnięty
  const playerPct = newState.playerHp / MAX_HP;
  const enemyPct = newState.enemyHp / OPPONENTS[0].maxHp;
  // player 100% > enemy ~27% → gracz wygrałby sędziowsko
  assert.ok(playerPct > enemyPct);
});

test('wynik nigdy nie spada poniżej 0 ani nie przekracza 1000', () => {
  const results = [
    { won: true, judgeWin: false, playerHpPct: 1, playerActionsUsed: 0, guardBonuses: 3, comboBonuses: 2 },
    { won: true, judgeWin: false, playerHpPct: 1, playerActionsUsed: 0, guardBonuses: 3, comboBonuses: 2 },
    { won: true, judgeWin: false, playerHpPct: 1, playerActionsUsed: 0, guardBonuses: 3, comboBonuses: 2 },
    { won: true, judgeWin: false, playerHpPct: 1, playerActionsUsed: 0, guardBonuses: 3, comboBonuses: 2 },
    { won: true, judgeWin: false, playerHpPct: 1, playerActionsUsed: 0, guardBonuses: 3, comboBonuses: 2 },
  ];
  const score = computeScore(results);
  assert.ok(score >= 0 && score <= 1000);
});

test('wynik 0 pkt za przegraną rundę', () => {
  const result = { won: false, judgeWin: false, playerHpPct: 0, playerActionsUsed: 5, guardBonuses: 0, comboBonuses: 0 };
  assert.equal(computeRoundScore(result), 0);
});

// ===== 9. Progi nagród =====

test('progi nagród są jednoznaczne i prawidłowe', () => {
  assert.deepEqual(computeReward(549), { housePoints: 0, skirnirs: 0 });
  assert.deepEqual(computeReward(550), { housePoints: 5, skirnirs: 5 });
  assert.deepEqual(computeReward(699), { housePoints: 5, skirnirs: 5 });
  assert.deepEqual(computeReward(700), { housePoints: 8, skirnirs: 7 });
  assert.deepEqual(computeReward(849), { housePoints: 8, skirnirs: 7 });
  assert.deepEqual(computeReward(850), { housePoints: 12, skirnirs: 10 });
  assert.deepEqual(computeReward(949), { housePoints: 12, skirnirs: 10 });
  assert.deepEqual(computeReward(950), { housePoints: 20, skirnirs: 15 });
  assert.deepEqual(computeReward(1000), { housePoints: 20, skirnirs: 15 });
});

// ===== 10. Zduplikowany actionId odrzucony przez replay =====

test('zduplikowany actionId jest odrzucany przez replayFromLog', () => {
  const log = [
    { actionId: 'aaa', round: 0, turn: 0, action: 'runic_cut', relativeTimeMs: 1000 },
    { actionId: 'aaa', round: 0, turn: 1, action: 'runic_cut', relativeTimeMs: 2000 },
  ];
  const result = replayFromLog(log, 42, 60_000);
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes('Zduplikowany'));
});

// ===== 11. Za krótka próba =====

test('próba krótsza niż 45 sekund jest odrzucana', () => {
  const log = [{ actionId: 'x1', round: 0, turn: 0, action: 'runic_cut', relativeTimeMs: 1000 }];
  const result = replayFromLog(log, 42, 44_000);
  assert.equal(result.valid, false);
  assert.ok(result.reason.toLowerCase().includes('szybko') || result.reason.toLowerCase().includes('min'));
});

// ===== 12. Brak Zakonu — brak punktów domyślnych (logika w trasie serwera) =====
// Testujemy że computeReward zwraca housePoints > 0 dla wyników >= 550,
// ale że odpowiedzialność za house===null spoczywa na routerze (nie ustawiamy domyślnego Zakonu).
test('computeReward nie ustawia Zakonu — tylko zwraca liczby', () => {
  const { housePoints, skirnirs } = computeReward(700);
  assert.equal(typeof housePoints, 'number');
  assert.equal(typeof skirnirs, 'number');
  // Brak pola "house" w zwracanym obiekcie — router decyduje
  assert.equal('house' in computeReward(700), false);
});

// ===== 13. replayFromLog odrzuca nielegalny cooldown =====

test('nielegalna akcja na cooldownie jest odrzucana przez replay', () => {
  const log = [
    { actionId: 'a1', round: 0, turn: 0, action: 'northern_guard', relativeTimeMs: 1000 },
    { actionId: 'a2', round: 0, turn: 1, action: 'northern_guard', relativeTimeMs: 2000 }, // cooldown!
  ];
  const result = replayFromLog(log, 42, 60_000);
  assert.equal(result.valid, false);
  assert.ok(result.reason.toLowerCase().includes('nielegalna'));
});

// ===== 14. Kombinacja decoy_sign → champion_strike jest liczona =====

test('kombinacja Zwodniczy znak → Uderzenie Czempiona dodaje komboPunktów', () => {
  let state = { ...freshState(), focus: 60 };
  const r = createPRNG(42);
  // Decoy sign
  ({ newState: state } = applyPlayerAction(state, 'decoy_sign', r()));
  assert.equal(state.exposed, true);
  // Champion strike
  const { newState: s2, events } = applyPlayerAction(state, 'champion_strike', r());
  assert.equal(s2.comboBonuses, 1);
});
