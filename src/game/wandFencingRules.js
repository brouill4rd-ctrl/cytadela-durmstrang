// Czyste zasady Turnieju Szermierki Różdżkowej — używane przez klienta i walidator serwera.
// Bez importów Reacta ani Node-specific — neutralny moduł ES.

export const RULES_VERSION = '1.0.0';
export const MAX_HP = 100;
export const MAX_FOCUS = 100;
export const STARTING_FOCUS = 20;
export const BETWEEN_ROUND_HEAL = 22;
export const MAX_TURNS = 12;
export const MIN_DURATION_MS = 45_000;
export const MAX_DURATION_MS = 40 * 60 * 1000;

// ===== PRNG (mulberry32) =====

export function createPRNG(seed) {
  let s = ((seed | 0) >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(val, min, max) {
  return min + Math.floor(val * (max - min + 1));
}

// ===== Konfiguracja akcji gracza =====

export const PLAYER_ACTIONS = {
  runic_cut: {
    id: 'runic_cut',
    name: 'Runiczne cięcie',
    type: 'offensive',
    minDmg: 14, maxDmg: 18,
    focusDelta: +18, cooldown: 0, requiresFocus: 0,
    desc: '14–18 obrażeń. Niezawodna akcja podstawowa.',
    focusLabel: '+18',
  },
  northern_guard: {
    id: 'northern_guard',
    name: 'Garda Północy',
    type: 'defensive',
    minDmg: 5, maxDmg: 8,
    focusDelta: +10, cooldown: 2, requiresFocus: 0,
    shieldPct: 60, healHp: 5,
    desc: '5–8 obrażeń, 60% redukcji następnego ciosu, leczenie 5 HP.',
    focusLabel: '+10',
  },
  decoy_sign: {
    id: 'decoy_sign',
    name: 'Zwodniczy znak',
    type: 'offensive',
    minDmg: 9, maxDmg: 12,
    focusDelta: +14, cooldown: 2, requiresFocus: 0,
    setsExposed: true,
    desc: '9–12 obrażeń. Następna ofensywna akcja zadaje +50% obrażeń (Odsłonięty).',
    focusLabel: '+14',
  },
  champion_strike: {
    id: 'champion_strike',
    name: 'Uderzenie Czempiona',
    type: 'offensive',
    minDmg: 28, maxDmg: 36,
    focusDelta: -50, cooldown: 1, requiresFocus: 50,
    consumesExposed: true,
    desc: '28–36 obrażeń; konsumuje i wzmacnia Odsłonięty.',
    focusLabel: '−50',
  },
};

// ===== Konfiguracja przeciwników =====

export const OPPONENTS = [
  {
    id: 'sven', name: 'Nowicjusz Sven z Reinhall', subtitle: 'Eliminacje',
    round: 0, maxHp: 60, minDmg: 8, maxDmg: 12, portraitIdx: 0,
  },
  {
    id: 'gunnar', name: 'Berserk Gunnar z Björnhall', subtitle: 'Ćwierćfinał',
    round: 1, maxHp: 82, minDmg: 11, maxDmg: 15, portraitIdx: 1,
  },
  {
    id: 'ilona', name: 'Mistrzyni Ilona z Ravnheim', subtitle: 'Półfinał',
    round: 2, maxHp: 96, minDmg: 10, maxDmg: 14, portraitIdx: 2,
  },
  {
    id: 'vidar', name: 'Alchemik Vidar z Otergard', subtitle: 'Walka o Puchar',
    round: 3, maxHp: 112, minDmg: 10, maxDmg: 13, portraitIdx: 3,
  },
  {
    id: 'valgerda', name: 'Arcymistrzyni Valgerda Storm', subtitle: 'FINAŁ',
    round: 4, maxHp: 135, minDmg: 12, maxDmg: 16, portraitIdx: 4,
  },
];

function initEnemyState(oppId) {
  switch (oppId) {
    case 'sven':    return { moveCount: 0, nextIsSpecial: false };
    case 'gunnar':  return { moveCount: 0, berserkActivated: false, berserkTurnsLeft: 0 };
    case 'ilona':   return { moveCount: 0, counterActive: false };
    case 'vidar':   return { moveCount: 0, hasHealedThisRound: false, brittleGuardActive: false };
    case 'valgerda': return { moveCount: 0, phase: 0, shieldActive: false };
    default:        return { moveCount: 0 };
  }
}

// ===== Zarządzanie stanem rundy =====

export function initRoundState(roundIdx, carry = null) {
  const opp = OPPONENTS[roundIdx];
  const playerHp = carry
    ? Math.min(MAX_HP, carry.playerHp + BETWEEN_ROUND_HEAL)
    : MAX_HP;
  const focus = carry
    ? Math.max(STARTING_FOCUS, carry.focus)
    : STARTING_FOCUS;
  return {
    round: roundIdx,
    turn: 0,
    playerHp,
    focus,
    shield: false,
    shieldPct: 0,
    exposed: false,
    cooldowns: { northern_guard: 0, decoy_sign: 0, champion_strike: 0 },
    enemyHp: opp.maxHp,
    enemyState: initEnemyState(opp.id),
    guardBonuses: 0,
    comboBonuses: 0,
    playerActionsUsed: 0,
  };
}

// ===== Legalność akcji =====

export function isActionLegal(state, actionId) {
  const a = PLAYER_ACTIONS[actionId];
  if (!a) return { legal: false, reason: 'Nieznana akcja.' };
  if ((state.cooldowns[actionId] || 0) > 0) {
    return { legal: false, reason: `Cooldown: ${state.cooldowns[actionId]} ${state.cooldowns[actionId] === 1 ? 'tura' : 'tury'}` };
  }
  if (a.requiresFocus > 0 && state.focus < a.requiresFocus) {
    return { legal: false, reason: `Wymagane ${a.requiresFocus} skupienia` };
  }
  return { legal: true, reason: '' };
}

// ===== Zamiar przeciwnika (deterministyczny, bez RNG) =====

export function getEnemyIntent(state) {
  const opp = OPPONENTS[state.round];
  const es = state.enemyState;
  switch (opp.id) {
    case 'sven':
      if (es.nextIsSpecial) return { label: 'Umiejętność specjalna', detail: 'Nerwowe pchnięcie (14)', isStrong: true, isAnnounced: true };
      return { label: 'Atak', detail: `${opp.minDmg}–${opp.maxDmg} obrażeń` };
    case 'gunnar':
      if (!es.berserkActivated && state.enemyHp <= 35) return { label: 'Umiejętność specjalna', detail: 'Szał niedźwiedzia!', isStrong: true };
      if (es.berserkActivated && es.berserkTurnsLeft > 0) return { label: 'Atak', detail: `${opp.minDmg + 4}–${opp.maxDmg + 4} (Szał)` };
      return { label: 'Atak', detail: `${opp.minDmg}–${opp.maxDmg} obrażeń` };
    case 'ilona': {
      const nextMoveIsCounter = (es.moveCount + 1) % 4 === 0;
      if (nextMoveIsCounter) return { label: 'Umiejętność specjalna', detail: 'Kontra — 10 obrażeń zwrotnych', isStrong: true, isAnnounced: true };
      return { label: 'Atak', detail: `${opp.minDmg}–${opp.maxDmg} obrażeń` };
    }
    case 'vidar':
      if (!es.hasHealedThisRound && state.enemyHp < opp.maxHp) return { label: 'Umiejętność specjalna', detail: 'Leczenie alchemiczne (+16 HP)' };
      return { label: 'Atak', detail: `${opp.minDmg}–${opp.maxDmg} obrażeń` };
    case 'valgerda': {
      const phase = es.phase % 3;
      if (phase === 1) return { label: 'Obrona', detail: 'Osłona 40% (następny atak)' };
      if (phase === 2) return { label: 'Umiejętność specjalna', detail: 'Burza run (18–22)', isStrong: true, isAnnounced: true };
      return { label: 'Atak', detail: `${opp.minDmg}–${opp.maxDmg} obrażeń` };
    }
    default: return { label: 'Atak', detail: '' };
  }
}

// Zmniejszenie cooldownów — po pełnym rozliczeniu tury, NIE dla akcji właśnie użytej
function decrementCooldowns(cooldowns, justUsedId) {
  const result = {};
  for (const [k, v] of Object.entries(cooldowns)) {
    result[k] = (k !== justUsedId && v > 0) ? v - 1 : v;
  }
  return result;
}

// ===== Rozliczenie akcji gracza =====
// rngVal: float [0,1) dla rzutu obrażeń gracza
// Zwraca: { newState, events, roundDone, playerDefeated }

export function applyPlayerAction(state, actionId, rngVal) {
  const a = PLAYER_ACTIONS[actionId];
  const opp = OPPONENTS[state.round];
  const events = [];
  const es = { ...state.enemyState };

  let dmg = rngInt(rngVal, a.minDmg, a.maxDmg);
  let exposedConsumed = false;
  let comboBonus = false;

  // Odsłonięty: +50% dla runic_cut i champion_strike
  if (state.exposed && (actionId === 'runic_cut' || actionId === 'champion_strike')) {
    dmg = Math.floor(dmg * 1.5);
    exposedConsumed = true;
  }

  // Kombinacja Zwodniczy znak → Uderzenie Czempiona
  if (actionId === 'champion_strike' && state.exposed) comboBonus = true;

  // Krucha garda Vidara: +30%
  let brittleConsumed = false;
  if (state.round === 3 && es.brittleGuardActive) {
    dmg = Math.floor(dmg * 1.3);
    brittleConsumed = true;
    es.brittleGuardActive = false;
  }

  // Osłona Valgerdy: −40% obrażeń zadanych przez gracza
  let vShieldConsumed = false;
  if (state.round === 4 && es.shieldActive) {
    dmg = Math.floor(dmg * 0.6);
    vShieldConsumed = true;
    es.shieldActive = false;
  }

  // Szał niedźwiedzia Gunnara: gracz zadaje +20% obrażeń (Gunnar bierze więcej)
  if (state.round === 1 && es.berserkActivated && es.berserkTurnsLeft > 0) {
    dmg = Math.floor(dmg * 1.2);
  }

  // Skupienie
  const newFocus = Math.max(0, Math.min(MAX_FOCUS, state.focus + a.focusDelta));

  // Cooldown: ustaw dla użytej akcji, dekrementuj wszystkie pozostałe
  const rawCooldowns = { ...state.cooldowns };
  if (a.cooldown > 0) rawCooldowns[actionId] = a.cooldown;
  const newCooldowns = decrementCooldowns(rawCooldowns, actionId);

  // Osłona gracza (Garda)
  const newShield = actionId === 'northern_guard';
  const newShieldPct = newShield ? 60 : state.shieldPct;

  // Status Odsłonięty
  let newExposed = exposedConsumed ? false : state.exposed;
  if (a.setsExposed) newExposed = true;

  // Leczenie (Garda)
  let newPlayerHp = state.playerHp;
  if (a.healHp) newPlayerHp = Math.min(MAX_HP, newPlayerHp + a.healHp);

  // Kontra Ilony
  let ilonaDmg = 0;
  let guardDisarmedBonus = false;
  if (state.round === 2 && es.counterActive) {
    if (a.type === 'offensive') {
      ilonaDmg = 10;
      es.counterActive = false;
      events.push({ type: 'counter_reflected', damage: 10 });
    } else if (actionId === 'northern_guard') {
      es.counterActive = false;
      guardDisarmedBonus = true;
      events.push({ type: 'counter_disarmed' });
    }
  }

  // Obrażenia zwrotne dla gracza
  newPlayerHp = Math.max(0, newPlayerHp - ilonaDmg);

  // Obrażenia dla przeciwnika
  const newEnemyHp = Math.max(0, state.enemyHp - dmg);

  events.push({ type: 'player_action', action: actionId, damage: dmg, exposedConsumed, brittleConsumed, vShieldConsumed, ilonaDmg });
  if (newEnemyHp === 0) events.push({ type: 'enemy_defeated' });

  // Punkty bonusowe: Garda rozbrojona kontra Ilony
  let newGuardBonuses = state.guardBonuses;
  if (guardDisarmedBonus && newGuardBonuses < 3) newGuardBonuses++;

  // Kombinacja
  let newComboBonuses = state.comboBonuses;
  if (comboBonus && newComboBonuses < 2) newComboBonuses++;

  const playerDefeated = newPlayerHp <= 0;
  const roundDone = newEnemyHp === 0 && !playerDefeated;

  if (playerDefeated) events.push({ type: 'player_defeated', reason: 'counter_dmg' });

  const newState = {
    ...state,
    playerHp: newPlayerHp,
    focus: newFocus,
    shield: newShield,
    shieldPct: newShieldPct,
    exposed: newExposed,
    cooldowns: newCooldowns,
    enemyHp: newEnemyHp,
    enemyState: es,
    guardBonuses: newGuardBonuses,
    comboBonuses: newComboBonuses,
    turn: state.turn + 1,
    playerActionsUsed: state.playerActionsUsed + 1,
  };

  return { newState, events, roundDone, playerDefeated };
}

// ===== Rozliczenie tury przeciwnika =====
// rngVal: float [0,1) dla rzutu obrażeń wroga
// playerUsedGuard: czy gracz użył northern_guard w tej turze
// Zwraca: { newState, events, playerDefeated }

export function resolveEnemyTurn(state, rngVal, playerUsedGuard = false) {
  const opp = OPPONENTS[state.round];
  const es = { ...state.enemyState };
  const events = [];
  let rawDmg = 0;
  let isStrongAnnounced = false;
  let newEnemyHp = state.enemyHp;

  switch (opp.id) {

    case 'sven': {
      if (es.nextIsSpecial) {
        rawDmg = 14;
        isStrongAnnounced = true;
        es.nextIsSpecial = false;
        events.push({ type: 'enemy_special', name: 'Nerwowe pchnięcie', damage: 14 });
      } else {
        rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
        events.push({ type: 'enemy_attack', damage: rawDmg });
      }
      es.moveCount++;
      // Zapowiedź: po 2. ruchu w każdym cyklu (co 3 ruchy) — indeks 0,1,[2],3,4,[5]...
      if (es.moveCount % 3 === 2) {
        es.nextIsSpecial = true;
        events.push({ type: 'enemy_announce', name: 'Nerwowe pchnięcie' });
      }
      break;
    }

    case 'gunnar': {
      // Wejście w berserk — berserkTurnsLeft nie spada w turze aktywacji
      const wasAlreadyBerserk = es.berserkActivated;
      if (!es.berserkActivated && state.enemyHp <= 35) {
        es.berserkActivated = true;
        es.berserkTurnsLeft = 2;
        events.push({ type: 'enemy_special', name: 'Szał niedźwiedzia', bonus: '+4 obrażeń, +20% otrzymywanych' });
      }
      const bonusDmg = (es.berserkActivated && es.berserkTurnsLeft > 0) ? 4 : 0;
      rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg) + bonusDmg;
      if (wasAlreadyBerserk && es.berserkTurnsLeft > 0) {
        es.berserkTurnsLeft--;
      }
      es.moveCount++;
      events.push({ type: 'enemy_attack', damage: rawDmg, berserk: bonusDmg > 0 });
      break;
    }

    case 'ilona': {
      const isCounterTurn = (es.moveCount + 1) % 4 === 0;
      rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
      if (isCounterTurn) {
        es.counterActive = true;
        events.push({ type: 'enemy_special', name: 'Zakładanie kontry', dmg: rawDmg });
      } else {
        events.push({ type: 'enemy_attack', damage: rawDmg });
      }
      es.moveCount++;
      break;
    }

    case 'vidar': {
      if (!es.hasHealedThisRound && state.enemyHp < opp.maxHp) {
        const healed = Math.min(opp.maxHp - state.enemyHp, 16);
        newEnemyHp = state.enemyHp + healed;
        es.hasHealedThisRound = true;
        es.brittleGuardActive = true;
        // RNG wywołane ale nieużyte (dla spójności sekwencji)
        rngInt(rngVal, 0, 0); // wynik ignorowany — brak ataku
        rawDmg = 0;
        es.moveCount++;
        events.push({ type: 'enemy_special', name: 'Leczenie alchemiczne', healed, brittleGuard: true });
        // Wcześniejszy powrót — brak obrażeń dla gracza
        const healState = {
          ...state,
          enemyHp: newEnemyHp,
          enemyState: es,
        };
        return { newState: healState, events, playerDefeated: false };
      } else {
        rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
        es.moveCount++;
        events.push({ type: 'enemy_attack', damage: rawDmg });
      }
      break;
    }

    case 'valgerda': {
      const phase = es.phase % 3;
      const lowHp = state.enemyHp <= 45;
      if (phase === 1 && !lowHp) {
        // Faza osłony: Valgerda ustawia tarczę i atakuje
        es.shieldActive = true;
        rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
        events.push({ type: 'enemy_special', name: 'Osłona 40%' });
        events.push({ type: 'enemy_attack', damage: rawDmg });
      } else if (phase === 2 && !lowHp) {
        // Burza run (zapowiadana)
        rawDmg = rngInt(rngVal, 18, 22);
        isStrongAnnounced = true;
        events.push({ type: 'enemy_special', name: 'Burza run', damage: rawDmg });
      } else {
        rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
        events.push({ type: 'enemy_attack', damage: rawDmg });
      }
      es.phase = (es.phase + 1) % 3;
      es.moveCount++;
      break;
    }

    default: {
      rawDmg = rngInt(rngVal, opp.minDmg, opp.maxDmg);
      events.push({ type: 'enemy_attack', damage: rawDmg });
      break;
    }
  }

  // Osłona gracza (Garda)
  let actualDmg = rawDmg;
  let shieldConsumed = false;
  if (state.shield && rawDmg > 0) {
    const reduction = Math.floor(rawDmg * (state.shieldPct / 100));
    actualDmg = rawDmg - reduction;
    shieldConsumed = true;
    events.push({ type: 'shield_block', original: rawDmg, reduced: actualDmg, reduction });
  }

  // Bonus za Gardę zmniejszającą zapowiedziany atak
  let newGuardBonuses = state.guardBonuses;
  if (playerUsedGuard && shieldConsumed && isStrongAnnounced && newGuardBonuses < 3) {
    newGuardBonuses++;
    events.push({ type: 'guard_bonus' });
  }

  const newPlayerHp = Math.max(0, state.playerHp - actualDmg);
  const playerDefeated = newPlayerHp <= 0;
  if (playerDefeated) events.push({ type: 'player_defeated', reason: 'enemy_attack' });

  const newState = {
    ...state,
    playerHp: newPlayerHp,
    shield: shieldConsumed ? false : state.shield,
    shieldPct: shieldConsumed ? 0 : state.shieldPct,
    enemyHp: newEnemyHp,
    enemyState: es,
    guardBonuses: newGuardBonuses,
  };

  return { newState, events, playerDefeated };
}

// ===== Ocena rundy =====

export function computeRoundScore(roundResult) {
  const { won, judgeWin, playerActionsUsed, playerHpPct, guardBonuses, comboBonuses } = roundResult;
  if (!won) return 0;
  const base = judgeWin ? 60 : 120;
  const hpBonus = Math.floor(playerHpPct * 30);
  const tempoBonus = judgeWin ? 0 : Math.max(0, (MAX_TURNS - playerActionsUsed) * 4);
  const guardPts = Math.min(3, guardBonuses) * 8;
  const comboPts = Math.min(2, comboBonuses) * 6;
  return base + hpBonus + tempoBonus + guardPts + comboPts;
}

export function computeScore(roundResults) {
  const raw = roundResults.reduce((sum, r) => sum + computeRoundScore(r), 0);
  return Math.min(1000, Math.max(0, raw));
}

export function getRank(score) {
  if (score >= 950) return 'Legenda Żelaznego Kręgu';
  if (score >= 850) return 'Czempion Północy';
  if (score >= 700) return 'Mistrz Areny';
  if (score >= 550) return 'Runiczny Fechmistrz';
  return 'Uczeń Ostrza';
}

export function computeReward(score) {
  if (score >= 950) return { housePoints: 20, skirnirs: 15 };
  if (score >= 850) return { housePoints: 12, skirnirs: 10 };
  if (score >= 700) return { housePoints: 8, skirnirs: 7 };
  if (score >= 550) return { housePoints: 5, skirnirs: 5 };
  return { housePoints: 0, skirnirs: 0 };
}

// ===== Walidacja i odtworzenie przebiegu (serwer) =====

export function replayFromLog(actionLog, seed, durationMs = 0) {
  const errors = [];
  if (!Array.isArray(actionLog) || actionLog.length === 0) {
    return { valid: false, reason: 'Pusty lub nieprawidłowy log akcji.' };
  }
  if (durationMs < MIN_DURATION_MS) {
    return { valid: false, reason: 'Próba zakończona zbyt szybko.' };
  }
  if (durationMs > MAX_DURATION_MS) {
    return { valid: false, reason: 'Przekroczono maksymalny czas próby.' };
  }

  const rng = createPRNG(seed);
  const seenActionIds = new Set();
  const roundResults = [];

  let state = initRoundState(0, null);
  let currentRound = 0;
  let logIdx = 0;
  let totalTurns = 0;
  let maxDmg = 0;

  while (currentRound < OPPONENTS.length) {
    // Pobierz kolejne akcje gracza dla tej rundy
    const roundActions = [];
    while (logIdx < actionLog.length && actionLog[logIdx].round === currentRound) {
      roundActions.push(actionLog[logIdx]);
      logIdx++;
    }

    if (roundActions.length === 0) {
      // Gracz nie dobrnął do tej rundy
      break;
    }

    let roundDone = false;
    let playerDefeated = false;
    let judgeWin = false;
    let roundLost = false;

    for (const entry of roundActions) {
      const { actionId, action: actionName, turn } = entry;

      // Sprawdź unikalność actionId
      if (seenActionIds.has(actionId)) {
        return { valid: false, reason: `Zduplikowany actionId: ${actionId}` };
      }
      seenActionIds.add(actionId);

      // Sprawdź numer tury
      if (turn !== state.turn) {
        return { valid: false, reason: `Nieprawidłowy numer tury: oczekiwano ${state.turn}, otrzymano ${turn}` };
      }

      // Sprawdź legalność akcji
      const legality = isActionLegal(state, actionName);
      if (!legality.legal) {
        return { valid: false, reason: `Nielegalna akcja w rundzie ${currentRound}, turze ${turn}: ${legality.reason}` };
      }

      // Rozlicz akcję gracza
      const playerRng = rng();
      const pResult = applyPlayerAction(state, actionName, playerRng);
      state = pResult.newState;
      totalTurns++;

      if (pResult.events.some(e => e.type === 'player_action')) {
        const dmgEvt = pResult.events.find(e => e.type === 'player_action');
        if (dmgEvt && dmgEvt.damage > maxDmg) maxDmg = dmgEvt.damage;
      }

      if (pResult.playerDefeated) {
        playerDefeated = true;
        roundLost = true;
        break;
      }

      if (pResult.roundDone) {
        roundDone = true;
        break;
      }

      // Limit tur
      if (state.turn >= MAX_TURNS) {
        // Wynik sędziowski
        const playerPct = state.playerHp / MAX_HP;
        const enemyPct = state.enemyHp / OPPONENTS[currentRound].maxHp;
        if (playerPct > enemyPct) {
          judgeWin = true;
          roundDone = true;
        } else if (enemyPct > playerPct) {
          roundLost = true;
        } else {
          // Remis sędziowski — koniec próby
          return {
            valid: true, reason: 'Remis sędziowski',
            score: computeScore(roundResults), rank: getRank(computeScore(roundResults)),
            roundResults, totalTurns, maxDmg, won: false, allRoundsCompleted: false,
          };
        }
        break;
      }

      // Tura przeciwnika
      const enemyRng = rng();
      const eResult = resolveEnemyTurn(state, enemyRng, actionName === 'northern_guard');
      state = eResult.newState;

      if (eResult.playerDefeated) {
        playerDefeated = true;
        roundLost = true;
        break;
      }
    }

    const roundState = state;
    const opp = OPPONENTS[currentRound];

    if (roundDone || judgeWin) {
      const playerHpPct = roundState.playerHp / MAX_HP;
      roundResults.push({
        round: currentRound,
        won: true,
        judgeWin,
        playerHpPct,
        playerHp: roundState.playerHp,
        playerActionsUsed: roundState.playerActionsUsed,
        guardBonuses: roundState.guardBonuses,
        comboBonuses: roundState.comboBonuses,
      });
      currentRound++;
      if (currentRound < OPPONENTS.length) {
        state = initRoundState(currentRound, { playerHp: roundState.playerHp, focus: roundState.focus });
      }
    } else if (roundLost || playerDefeated) {
      roundResults.push({
        round: currentRound, won: false, judgeWin: false,
        playerHpPct: 0, playerHp: 0, playerActionsUsed: roundState.playerActionsUsed,
        guardBonuses: roundState.guardBonuses, comboBonuses: roundState.comboBonuses,
      });
      break;
    } else {
      // Brak dalszych akcji w logu — turniej nieukończony
      break;
    }
  }

  const allRoundsCompleted = roundResults.length === OPPONENTS.length && roundResults.every(r => r.won);
  const score = computeScore(roundResults);
  const rank = getRank(score);

  return {
    valid: true,
    reason: allRoundsCompleted ? 'Turniej ukończony' : 'Porażka lub nieukończony',
    score,
    rank,
    roundResults,
    totalTurns,
    maxDmg,
    won: allRoundsCompleted,
    allRoundsCompleted,
  };
}
