export const RUNIC_DUEL_RULES_VERSION = '1.0.0';
export const RUNIC_DUEL_MAX_TURNS = 10;
export const RUNIC_DUEL_MAX_HP = 100;
export const RUNIC_DUEL_MAX_FOCUS = 100;

export const RUNIC_DUEL_ACTIONS = {
  thurisaz: {
    id: 'thurisaz',
    name: 'Płomień Thurisaz',
    shortName: 'Thurisaz',
    type: 'Atak',
    focusDelta: -10,
    color: '#ef665f',
    description: '22 obrażenia. Kontruje klątwę i wtedy zadaje 30.',
    counterHint: 'Tarcza ogranicza Płomień do 6 obrażeń.'
  },
  isa: {
    id: 'isa',
    name: 'Lodowa Tarcza Isa',
    shortName: 'Isa',
    type: 'Obrona',
    focusDelta: 14,
    color: '#68aef2',
    description: 'Redukuje Thurisaz do 6, odbija 5 i daje 14 skupienia.',
    counterHint: 'Więzy Nauthiz przełamują tarczę.'
  },
  nauthiz: {
    id: 'nauthiz',
    name: 'Więzy Nauthiz',
    shortName: 'Nauthiz',
    type: 'Klątwa',
    focusDelta: -20,
    color: '#b486ed',
    description: '16 obrażeń; przeciw Isa zadaje 24 i odsłania cel.',
    counterHint: 'Thurisaz i Tyr anulują klątwę.'
  },
  ansuz: {
    id: 'ansuz',
    name: 'Oddech Ansuz',
    shortName: 'Ansuz',
    type: 'Skupienie',
    focusDelta: 28,
    color: '#55d5c7',
    description: 'Leczy 6 HP i daje 28 skupienia. Cooldown: 2 tury.',
    counterHint: 'Thurisaz lub Tyr przerywa skupienie.'
  },
  tyr: {
    id: 'tyr',
    name: 'Wyrok Tyr',
    shortName: 'Tyr',
    type: 'Finisher',
    focusDelta: -70,
    color: '#d7b45d',
    description: '38 obrażeń. Dostępny raz na pojedynek.',
    counterHint: 'Isa redukuje Wyrok do 18 obrażeń.'
  }
};

export const RUNIC_DUEL_OPPONENTS = {
  yrsa: {
    id: 'yrsa',
    name: 'Yrsa Lodowa Strażniczka',
    title: 'Strażniczka Pierwszej Pieczęci',
    style: 'Defensywna',
    portrait: 'yrsa',
    description: 'Wznosi tarczę po silnych trafieniach i cierpliwie gromadzi skupienie.',
    special: 'Pierwszy otrzymany Płomień Thurisaz zadaje jej o 6 obrażeń mniej.',
    weights: { thurisaz: 2, isa: 5, nauthiz: 2, ansuz: 3, tyr: 3 }
  },
  hakon: {
    id: 'hakon',
    name: 'Hakon Żarząca Pięść',
    title: 'Egzekutor Żelaznego Kręgu',
    style: 'Agresywny',
    portrait: 'hakon',
    description: 'Naciska od pierwszej tury i szybko dąży do niszczącego Wyroku Tyr.',
    special: 'Pierwszy udany Płomień Thurisaz zadaje dodatkowe 5 obrażeń.',
    weights: { thurisaz: 6, isa: 1, nauthiz: 2, ansuz: 2, tyr: 6 }
  },
  vala: {
    id: 'vala',
    name: 'Vala Kruczego Cienia',
    title: 'Wieszczka Widmowych Więzów',
    style: 'Kontrolna',
    portrait: 'vala',
    description: 'Łączy skupienie z klątwą i poluje na każdą zbyt oczywistą obronę.',
    special: 'Pierwszy skuteczny Nauthiz dodatkowo odbiera 8 skupienia.',
    weights: { thurisaz: 1, isa: 2, nauthiz: 6, ansuz: 5, tyr: 3 }
  },
  eirik: {
    id: 'eirik',
    name: 'Eirik Czarnoruny',
    title: 'Mistrz Areny Bazaltowej',
    style: 'Adaptacyjny',
    portrait: 'eirik',
    description: 'Zapamiętuje wcześniejsze wybory i karze powtarzalne schematy.',
    special: 'Raz, gdy jego HP spadnie do 35 lub mniej, otrzymuje 12 skupienia.',
    weights: { thurisaz: 3, isa: 3, nauthiz: 3, ansuz: 3, tyr: 4 }
  }
};

export const RUNIC_DUEL_REWARDS = [
  { min: 900, rank: 'Mistrz Kręgu', housePoints: 12, skirniry: 10 },
  { min: 800, rank: 'Strażnik Bazaltu', housePoints: 10, skirniry: 8 },
  { min: 650, rank: 'Runiczny Szermierz', housePoints: 7, skirniry: 5 },
  { min: 500, rank: 'Ocalały Kręgu', housePoints: 4, skirniry: 3 }
];

const PRIMARY_RUNES = new Set(['thurisaz', 'isa', 'nauthiz']);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function makeCombatant() {
  return {
    hp: RUNIC_DUEL_MAX_HP,
    focus: 30,
    ansuzCooldown: 0,
    tyrUsed: false,
    exposed: false,
    chain: [],
    resonanceCount: 0,
    specialUsed: false
  };
}

export function createInitialDuelState() {
  return {
    rulesVersion: RUNIC_DUEL_RULES_VERSION,
    turnNumber: 1,
    status: 'fighting',
    result: null,
    winReason: '',
    score: 0,
    rank: '',
    player: makeCombatant(),
    enemy: makeCombatant(),
    history: []
  };
}

export function getActionLegality(combatant, actionId) {
  if (!RUNIC_DUEL_ACTIONS[actionId]) return { legal: false, reason: 'Nieznana runa.' };
  if (combatant.hp <= 0) return { legal: false, reason: 'Postać nie może już wykonać ruchu.' };
  if (actionId === 'thurisaz' && combatant.focus < 10) return { legal: false, reason: 'Wymaga 10 skupienia.' };
  if (actionId === 'nauthiz' && combatant.focus < 20) return { legal: false, reason: 'Wymaga 20 skupienia.' };
  if (actionId === 'tyr' && combatant.focus < 70) return { legal: false, reason: 'Wymaga 70 skupienia.' };
  if (actionId === 'tyr' && combatant.tyrUsed) return { legal: false, reason: 'Pieczęć Tyr została już użyta.' };
  if (actionId === 'ansuz' && combatant.ansuzCooldown > 0) {
    return { legal: false, reason: `Gotowe za ${combatant.ansuzCooldown} ${combatant.ansuzCooldown === 1 ? 'turę' : 'tury'}.` };
  }
  return { legal: true, reason: '' };
}

export function getLegalActions(combatant) {
  return Object.keys(RUNIC_DUEL_ACTIONS).filter((id) => getActionLegality(combatant, id).legal);
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed) {
  let value = hashString(String(seed));
  value += 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function featuredOpponentForDate(dateKey) {
  const ids = Object.keys(RUNIC_DUEL_OPPONENTS);
  return ids[hashString(String(dateKey)) % ids.length];
}

export function chooseEnemyAction({ state, opponentId, seed, playerHistory = [] }) {
  const opponent = RUNIC_DUEL_OPPONENTS[opponentId];
  if (!opponent) throw new Error('Nieznany przeciwnik Runicznego Kręgu.');

  const legal = getLegalActions(state.enemy);
  if (!legal.length) throw new Error('Przeciwnik nie ma legalnej akcji.');

  if (state.player.hp <= 18 && legal.includes('tyr')) return 'tyr';
  if (state.player.hp <= 12 && legal.includes('thurisaz')) return 'thurisaz';

  const weights = { ...opponent.weights };
  if (opponentId === 'yrsa') {
    if (state.enemy.hp <= 60) weights.isa += 4;
    if (state.enemy.focus <= 20) weights.ansuz += 4;
  }
  if (opponentId === 'hakon' && state.enemy.focus < 10) weights.ansuz += 5;
  if (opponentId === 'vala' && state.enemy.focus < 20) weights.ansuz += 4;
  if (opponentId === 'eirik') {
    const last = playerHistory[playerHistory.length - 1];
    const counter = { thurisaz: 'isa', isa: 'nauthiz', nauthiz: 'thurisaz', ansuz: 'thurisaz', tyr: 'isa' }[last];
    if (counter) weights[counter] += 5;
  }

  const candidates = legal.map((id) => ({ id, weight: Math.max(0, weights[id] || 0) }));
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return legal[0];
  let roll = seededUnit(`${seed}:${state.turnNumber}:${playerHistory.join(',')}:${state.enemy.hp}:${state.enemy.focus}`) * total;
  for (const item of candidates) {
    roll -= item.weight;
    if (roll <= 0) return item.id;
  }
  return candidates[candidates.length - 1].id;
}

function attackEffect(actionId, targetActionId) {
  if (actionId === 'thurisaz') {
    if (targetActionId === 'nauthiz') return { damage: 30, cancelsTarget: true };
    if (targetActionId === 'isa') return { damage: 6 };
    if (targetActionId === 'ansuz') return { damage: 30, cancelsTarget: true };
    return { damage: 22 };
  }
  if (actionId === 'nauthiz') {
    if (targetActionId === 'thurisaz' || targetActionId === 'tyr') return { damage: 0, canceled: true };
    if (targetActionId === 'isa') return { damage: 24, appliesExposed: true };
    return { damage: 16, weakensAnsuz: targetActionId === 'ansuz' };
  }
  if (actionId === 'tyr') {
    if (targetActionId === 'isa') return { damage: 18 };
    if (targetActionId === 'nauthiz' || targetActionId === 'ansuz') return { damage: 38, cancelsTarget: true };
    return { damage: 38 };
  }
  if (actionId === 'isa' && targetActionId === 'thurisaz') return { damage: 5, reflected: true };
  return { damage: 0 };
}

function applyActionCost(combatant, actionId) {
  if (actionId === 'thurisaz') combatant.focus -= 10;
  if (actionId === 'nauthiz') combatant.focus -= 20;
  if (actionId === 'tyr') {
    combatant.focus -= 70;
    combatant.tyrUsed = true;
  }
  combatant.focus = clamp(combatant.focus, 0, RUNIC_DUEL_MAX_FOCUS);
}

function actionRecovery(combatant, actionId, opposingActionId) {
  if (actionId === 'isa') {
    combatant.focus = clamp(combatant.focus + 14, 0, RUNIC_DUEL_MAX_FOCUS);
    return { focus: 14, heal: 0 };
  }
  if (actionId !== 'ansuz' || opposingActionId === 'thurisaz' || opposingActionId === 'tyr') {
    return { focus: 0, heal: 0 };
  }
  const focus = opposingActionId === 'nauthiz' ? 14 : 28;
  combatant.focus = clamp(combatant.focus + focus, 0, RUNIC_DUEL_MAX_FOCUS);
  const beforeHp = combatant.hp;
  combatant.hp = clamp(combatant.hp + 6, 0, RUNIC_DUEL_MAX_HP);
  return { focus, heal: combatant.hp - beforeHp };
}

function advanceCooldown(combatant, actionId, previousCooldown) {
  if (actionId === 'ansuz') combatant.ansuzCooldown = 2;
  else if (previousCooldown > 0) combatant.ansuzCooldown = Math.max(0, previousCooldown - 1);
}

function rewardRank(score) {
  return RUNIC_DUEL_REWARDS.find((tier) => score >= tier.min) || null;
}

export function computeRunicDuelScore(state) {
  if (state.result !== 'player_win') return 0;
  const turnBonus = Math.max(0, RUNIC_DUEL_MAX_TURNS - state.turnNumber) * 20;
  const resonanceBonus = state.player.resonanceCount > 0 ? 20 : 0;
  return clamp(500 + state.player.hp * 3 + turnBonus + resonanceBonus, 0, 1000);
}

export function computeRunicDuelReward(score) {
  const tier = rewardRank(Number(score) || 0);
  return tier
    ? { rank: tier.rank, housePoints: tier.housePoints, skirniry: tier.skirniry }
    : { rank: '', housePoints: 0, skirniry: 0 };
}

function finishState(state, result, reason) {
  state.status = 'complete';
  state.result = result;
  state.winReason = reason;
  state.score = computeRunicDuelScore(state);
  state.rank = computeRunicDuelReward(state.score).rank;
}

function addPrimaryRune(combatant, actionId) {
  if (!PRIMARY_RUNES.has(actionId)) return false;
  combatant.chain = [...combatant.chain, actionId].slice(-3);
  if (combatant.chain.length === 3 && new Set(combatant.chain).size === 3) {
    combatant.chain = [];
    combatant.resonanceCount += 1;
    return true;
  }
  return false;
}

export function resolveDuelTurn({ state: inputState, playerAction, enemyAction, opponentId }) {
  if (!inputState || inputState.status !== 'fighting') throw new Error('Pojedynek nie jest aktywny.');
  if (!RUNIC_DUEL_OPPONENTS[opponentId]) throw new Error('Nieznany przeciwnik.');
  const playerLegality = getActionLegality(inputState.player, playerAction);
  const enemyLegality = getActionLegality(inputState.enemy, enemyAction);
  if (!playerLegality.legal) throw new Error(playerLegality.reason);
  if (!enemyLegality.legal) throw new Error(`Nielegalna akcja przeciwnika: ${enemyLegality.reason}`);

  const state = JSON.parse(JSON.stringify(inputState));
  const events = [];
  const playerCooldownBefore = state.player.ansuzCooldown;
  const enemyCooldownBefore = state.enemy.ansuzCooldown;

  applyActionCost(state.player, playerAction);
  applyActionCost(state.enemy, enemyAction);

  const playerEffect = attackEffect(playerAction, enemyAction);
  const enemyEffect = attackEffect(enemyAction, playerAction);

  if (state.enemy.exposed && (playerAction === 'thurisaz' || playerAction === 'tyr') && playerEffect.damage > 0) {
    playerEffect.damage += 8;
    state.enemy.exposed = false;
    events.push({ type: 'exposed-consumed', actor: 'enemy', text: 'Odsłonięcie wzmacnia trafienie o 8.' });
  }
  if (state.player.exposed && (enemyAction === 'thurisaz' || enemyAction === 'tyr') && enemyEffect.damage > 0) {
    enemyEffect.damage += 8;
    state.player.exposed = false;
    events.push({ type: 'exposed-consumed', actor: 'player', text: 'Rywal wykorzystuje Odsłonięcie: +8 obrażeń.' });
  }

  if (opponentId === 'yrsa' && playerAction === 'thurisaz' && playerEffect.damage > 0 && !state.enemy.specialUsed) {
    playerEffect.damage = Math.max(0, playerEffect.damage - 6);
    state.enemy.specialUsed = true;
    events.push({ type: 'special', actor: 'enemy', text: 'Lodowa Pieczęć Yrsy pochłania 6 obrażeń.' });
  }
  if (opponentId === 'hakon' && enemyAction === 'thurisaz' && enemyEffect.damage > 0 && !state.enemy.specialUsed) {
    enemyEffect.damage += 5;
    state.enemy.specialUsed = true;
    events.push({ type: 'special', actor: 'enemy', text: 'Żar Hakona wzmacnia pierwszy Płomień o 5.' });
  }

  state.enemy.hp = clamp(state.enemy.hp - playerEffect.damage, 0, RUNIC_DUEL_MAX_HP);
  state.player.hp = clamp(state.player.hp - enemyEffect.damage, 0, RUNIC_DUEL_MAX_HP);

  if (playerEffect.damage > 0) events.push({ type: 'damage', actor: 'player', target: 'enemy', amount: playerEffect.damage, action: playerAction, text: `Zadajesz ${playerEffect.damage} obrażeń.` });
  if (enemyEffect.damage > 0) events.push({ type: 'damage', actor: 'enemy', target: 'player', amount: enemyEffect.damage, action: enemyAction, text: `Rywal zadaje ${enemyEffect.damage} obrażeń.` });
  if (playerEffect.canceled) events.push({ type: 'counter', actor: 'enemy', text: 'Twoja klątwa zostaje przerwana.' });
  if (enemyEffect.canceled) events.push({ type: 'counter', actor: 'player', text: 'Kontrujesz klątwę rywala.' });

  if (state.player.hp <= 0 || state.enemy.hp <= 0) {
    if (state.player.hp <= 0 && state.enemy.hp <= 0) finishState(state, 'draw', 'simultaneous_ko');
    else if (state.enemy.hp <= 0) finishState(state, 'player_win', 'knockout');
    else finishState(state, 'enemy_win', 'knockout');
  } else {
    const playerRecovery = actionRecovery(state.player, playerAction, enemyAction);
    const enemyRecovery = actionRecovery(state.enemy, enemyAction, playerAction);
    if (playerRecovery.focus || playerRecovery.heal) events.push({ type: 'recovery', actor: 'player', ...playerRecovery, text: `Odzyskujesz ${playerRecovery.focus} skupienia${playerRecovery.heal ? ` i ${playerRecovery.heal} HP` : ''}.` });
    if (enemyRecovery.focus || enemyRecovery.heal) events.push({ type: 'recovery', actor: 'enemy', ...enemyRecovery, text: `Rywal odzyskuje ${enemyRecovery.focus} skupienia${enemyRecovery.heal ? ` i ${enemyRecovery.heal} HP` : ''}.` });

    if (playerEffect.appliesExposed) state.enemy.exposed = true;
    if (enemyEffect.appliesExposed) state.player.exposed = true;
    if (opponentId === 'vala' && enemyAction === 'nauthiz' && enemyEffect.damage > 0 && !state.enemy.specialUsed) {
      state.player.exposed = true;
      state.player.focus = clamp(state.player.focus - 8, 0, RUNIC_DUEL_MAX_FOCUS);
      state.enemy.specialUsed = true;
      events.push({ type: 'special', actor: 'enemy', text: 'Kruczy Szept odbiera Ci 8 skupienia.' });
    }

    if (addPrimaryRune(state.player, playerAction)) {
      state.enemy.hp = clamp(state.enemy.hp - 10, 0, RUNIC_DUEL_MAX_HP);
      state.player.focus = clamp(state.player.focus + 10, 0, RUNIC_DUEL_MAX_FOCUS);
      events.push({ type: 'resonance', actor: 'player', amount: 10, text: 'Runiczny Rezonans: 10 obrażeń i 10 skupienia.' });
      if (state.enemy.hp <= 0) finishState(state, 'player_win', 'resonance');
    }

    if (state.status === 'fighting' && opponentId === 'eirik' && state.enemy.hp <= 35 && !state.enemy.specialUsed) {
      state.enemy.focus = clamp(state.enemy.focus + 12, 0, RUNIC_DUEL_MAX_FOCUS);
      state.enemy.specialUsed = true;
      events.push({ type: 'special', actor: 'enemy', text: 'Czarnoruny budzi pieczęć i zyskuje 12 skupienia.' });
    }
  }

  advanceCooldown(state.player, playerAction, playerCooldownBefore);
  advanceCooldown(state.enemy, enemyAction, enemyCooldownBefore);

  state.history.push({ turnNumber: state.turnNumber, playerAction, enemyAction });

  if (state.status === 'fighting' && state.turnNumber >= RUNIC_DUEL_MAX_TURNS) {
    if (state.player.hp > state.enemy.hp) finishState(state, 'player_win', 'judges_hp');
    else if (state.enemy.hp > state.player.hp) finishState(state, 'enemy_win', 'judges_hp');
    else if (state.player.focus > state.enemy.focus) finishState(state, 'player_win', 'judges_focus');
    else if (state.enemy.focus > state.player.focus) finishState(state, 'enemy_win', 'judges_focus');
    else finishState(state, 'draw', 'judges_draw');
  }

  if (state.status === 'fighting') state.turnNumber += 1;
  if (state.status === 'complete') {
    state.score = computeRunicDuelScore(state);
    state.rank = computeRunicDuelReward(state.score).rank;
  }

  return { state, events };
}

