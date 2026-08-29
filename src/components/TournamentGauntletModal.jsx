import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  Trophy, Swords, Shield, Zap, BookOpen, X, RotateCcw,
  ChevronRight, User, Check, Crown, Sparkles, Star
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  OPPONENTS, PLAYER_ACTIONS, MAX_HP, MAX_FOCUS, MAX_TURNS,
  createPRNG, initRoundState, isActionLegal, getEnemyIntent,
  applyPlayerAction, resolveEnemyTurn, computeRoundScore, computeScore, getRank, computeReward,
} from '../game/wandFencingRules.js';
import { api } from '../api.js';
import './TournamentGauntletModal.css';

// ===== Portret przeciwnika (sprite sheet) =====
function OpponentPortrait({ idx, size = 'md', active = false, className = '' }) {
  const cls = size === 'lg' ? 'tgm-portrait-lg' : size === 'sm' ? 'tgm-portrait-sm' : 'tgm-portrait';
  const name = OPPONENTS[idx]?.name || `Rywal ${idx + 1}`;
  return (
    <div
      className={`${cls} ${active ? 'active' : ''} ${className}`}
      data-idx={idx}
      role="img"
      aria-label={name}
      title={name}
    />
  );
}

// ===== Pasek HP / skupienia =====
function StatBar({ value, max, variant, label, id }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="tgm-bar-row">
      <span className="tgm-bar-label" id={id}>{label}</span>
      <div
        className="tgm-bar-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={id}
      >
        <div className={`tgm-bar-fill ${variant}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tgm-bar-val">{value}/{max}</span>
    </div>
  );
}

// ===== Główny komponent =====
export const TournamentGauntletModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare, playCoinSound } = useSound();

  const titleId = useId();

  // Fazy automatu stanów
  const [phase, setPhase] = useState('intro');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesTab, setRulesTab] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);

  // Sesja
  const [runId, setRunId] = useState(null);
  const [canBeRewarded, setCanBeRewarded] = useState(true);
  const [serverResult, setServerResult] = useState(null);

  // Stan gry
  const [gameState, setGameState] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState([]);

  // UI
  const [countdownNum, setCountdownNum] = useState(null);
  const [enemyIntent, setEnemyIntent] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [floatingDmg, setFloatingDmg] = useState([]);
  const [isStarting, setIsStarting] = useState(false);

  // Refs
  const processingRef = useRef(false);
  const timeoutsRef = useRef([]);
  const rngRef = useRef(null);
  const actionLogRef = useRef([]);
  const runStartRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const gameStateRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const addTout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const resetState = () => {
    clearAllTouts();
    processingRef.current = false;
    rngRef.current = null;
    actionLogRef.current = [];
    seenIdsRef.current = new Set();
    runStartRef.current = null;
    setPhase('intro');
    setRulesOpen(false);
    setConfirmClose(false);
    setRunId(null);
    setCanBeRewarded(true);
    setServerResult(null);
    setGameState(null);
    setCurrentRound(0);
    setRoundResults([]);
    setCountdownNum(null);
    setEnemyIntent(null);
    setCombatLog([]);
    setFloatingDmg([]);
    setIsStarting(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
      addTout(() => firstFocusRef.current?.focus(), 60);
    }
    return () => { if (!isOpen) clearAllTouts(); };
  }, [isOpen]);

  useEffect(() => () => clearAllTouts(), []);

  // Zamknięcie podczas walki
  const handleClose = () => {
    const fighting = ['playerTurn', 'resolvingPlayer', 'enemyTurn', 'roundResult'].includes(phase);
    if (fighting) { setConfirmClose(true); return; }
    onClose();
  };

  const handleConfirmClose = async () => {
    if (runId) { try { await api.wandFencingAbandon(runId); } catch {} }
    resetState();
    onClose();
  };

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, phase]);

  const addLog = (text, type = 'default') => {
    setCombatLog(prev => [{ text, type, key: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 6));
  };

  const addFloat = (val, type) => {
    const id = `f${Date.now()}${Math.random()}`;
    setFloatingDmg(prev => [...prev, { id, val, type }]);
    addTout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 960);
  };

  const startCountdown = () => {
    setPhase('countdown');
    const seq = [3, 2, 1, 'WALCZ!'];
    seq.forEach((n, i) => addTout(() => {
      setCountdownNum(n);
      if (n === 'WALCZ!') addTout(() => setPhase('playerTurn'), 500);
    }, i * 700));
  };

  // Start próby
  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    actionLogRef.current = [];
    seenIdsRef.current = new Set();

    let seed = (Math.random() * 2147483646 | 0) + 1;
    let rId = null;
    let rewarded = false;

    try {
      const res = await api.wandFencingStart();
      if (res.ok) { rId = res.data.runId; seed = res.data.seed; rewarded = res.data.canBeRewarded; }
    } catch {}

    setRunId(rId);
    setCanBeRewarded(rewarded);
    rngRef.current = createPRNG(seed);
    runStartRef.current = Date.now();

    const gs = initRoundState(0, null);
    setGameState(gs);
    setCurrentRound(0);
    setRoundResults([]);
    setCombatLog([`Turniej Szermierki Różdżkowej — Runda 1: ${OPPONENTS[0].name}`]);
    setIsStarting(false);
    startCountdown();
  };

  // Akcja gracza
  const handleAction = useCallback((actionId) => {
    if (processingRef.current || phase !== 'playerTurn') return;
    const state = gameStateRef.current;
    if (!state) return;
    if (!isActionLegal(state, actionId).legal) return;

    const entryId = crypto.randomUUID();
    if (seenIdsRef.current.has(entryId)) return;
    seenIdsRef.current.add(entryId);

    processingRef.current = true;
    setPhase('resolvingPlayer');

    actionLogRef.current.push({
      actionId: entryId, round: state.round, turn: state.turn, action: actionId,
      relativeTimeMs: runStartRef.current ? Date.now() - runStartRef.current : 0,
    });

    if (actionId === 'northern_guard') playRuneChime?.();
    else playWandSwoosh?.();

    const pRng = rngRef.current();
    const { newState: s1, events, roundDone, playerDefeated } = applyPlayerAction(state, actionId, pRng);
    setGameState(s1);

    const atkEvt = events.find(e => e.type === 'player_action');
    if (atkEvt) {
      addLog(`Ty: ${PLAYER_ACTIONS[actionId].name} → ${atkEvt.damage} obrażeń.`, 'positive');
      addFloat(`−${atkEvt.damage}`, 'enemy');
    }
    if (events.find(e => e.type === 'counter_reflected')) {
      addLog('Kontra Ilony! +10 obrażeń zwrotnych.', 'danger');
      addFloat('−10', 'player');
    }
    if (events.find(e => e.type === 'counter_disarmed')) addLog('Garda rozbroiła kontrę!', 'positive');

    addTout(() => {
      if (playerDefeated) { endRound(s1, 'playerDied'); return; }
      if (roundDone) { endRound(s1, 'won'); return; }
      if (s1.turn >= MAX_TURNS) {
        const pPct = s1.playerHp / MAX_HP;
        const ePct = s1.enemyHp / OPPONENTS[s1.round].maxHp;
        endRound(s1, pPct > ePct ? 'judgeWin' : ePct > pPct ? 'playerLost' : 'draw');
        return;
      }
      const intent = getEnemyIntent(s1);
      setEnemyIntent(intent);
      setPhase('enemyTurn');
      addTout(() => resolveEnemy(s1, actionId === 'northern_guard'), 550);
    }, 340);
  }, [phase]);

  const resolveEnemy = (afterPlayer, guardUsed) => {
    const eRng = rngRef.current();
    const { newState: s2, events, playerDefeated } = resolveEnemyTurn(afterPlayer, eRng, guardUsed);
    setGameState(s2);
    setEnemyIntent(null);

    const atkEvt = events.find(e => e.type === 'enemy_attack');
    const specEvt = events.find(e => e.type === 'enemy_special');
    const shEvt = events.find(e => e.type === 'shield_block');
    const annEvt = events.find(e => e.type === 'enemy_announce');
    const guardBonus = events.find(e => e.type === 'guard_bonus');
    const healEvt = specEvt?.name === 'Leczenie alchemiczne' ? specEvt : null;

    if (healEvt) {
      addLog(`${OPPONENTS[s2.round].name}: Leczenie alchemiczne (+${healEvt.healed} HP).`, 'warning');
    } else if (specEvt && !healEvt) {
      const dmg = specEvt.damage || 0;
      addLog(`${OPPONENTS[s2.round].name}: ${specEvt.name}! ${dmg > 0 ? `(${dmg} obrażeń)` : ''}`, 'danger');
      if (dmg > 0) addFloat(`−${shEvt ? shEvt.reduced : dmg}`, 'player');
    } else if (atkEvt) {
      const shown = shEvt ? shEvt.reduced : atkEvt.damage;
      addLog(`${OPPONENTS[s2.round].name}: ${atkEvt.damage} obrażeń${shEvt ? ` (→ ${shEvt.reduced})` : ''}.`, 'default');
      if (shown > 0) addFloat(`−${shown}`, 'player');
    }

    if (shEvt && !specEvt) addLog('Garda zmniejszyła cios!', 'positive');
    if (annEvt) addLog(`${OPPONENTS[s2.round].name} zapowiada: ${annEvt.name}!`, 'warning');
    if (guardBonus) addLog('Garda skuteczna vs. silny atak! +8 pkt.', 'positive');

    addTout(() => {
      if (playerDefeated) { endRound(s2, 'playerDied'); return; }
      processingRef.current = false;
      setPhase('playerTurn');
    }, 240);
  };

  const endRound = (finalState, result) => {
    const opp = OPPONENTS[finalState.round];
    const isWin = result === 'won' || result === 'judgeWin';

    const roundResult = {
      round: finalState.round,
      won: isWin,
      judgeWin: result === 'judgeWin',
      playerHpPct: isWin ? finalState.playerHp / MAX_HP : 0,
      playerHp: finalState.playerHp,
      playerActionsUsed: finalState.playerActionsUsed,
      guardBonuses: finalState.guardBonuses,
      comboBonuses: finalState.comboBonuses,
    };

    if (isWin) {
      playSortingFanfare?.();
      const pts = computeRoundScore(roundResult);
      addLog(`Runda ukończona! +${pts} pkt${result === 'judgeWin' ? ' (sędziowskie)' : ''}.`, 'positive');
    } else if (result === 'draw') {
      addLog('Remis sędziowski — próba zakończona bez nagrody.', 'warning');
    } else {
      addLog('Porażka! Spróbuj od początku.', 'danger');
    }

    const newResults = [...roundResults, roundResult];
    setRoundResults(newResults);
    processingRef.current = false;

    if (isWin && finalState.round + 1 >= OPPONENTS.length) {
      finishTournament(finalState, newResults);
    } else if (isWin) {
      setPhase('roundResult');
    } else {
      setPhase('defeat');
    }
  };

  const handleNextRound = () => {
    const nextRound = currentRound + 1;
    const carry = { playerHp: gameState.playerHp, focus: gameState.focus };
    const nextGs = initRoundState(nextRound, carry);
    setGameState(nextGs);
    setCurrentRound(nextRound);
    addLog(`Runda ${nextRound + 1}: ${OPPONENTS[nextRound].name}. Do boju!`);
    startCountdown();
  };

  const finishTournament = async (finalState, results) => {
    setPhase('rewardPending');
    const score = computeScore(results);
    const log = actionLogRef.current;

    let srvRes = null;
    if (runId) {
      try {
        const r = await api.wandFencingComplete(runId, log);
        if (r.ok) srvRes = r.data;
      } catch {}
    }

    if (!srvRes) {
      // Serwer niedostępny — tryb treningowy
      srvRes = {
        score, rank: getRank(score), won: true, rewardEligible: false,
        housePoints: 0, skirnirs: 0, trophyAwarded: false,
        message: 'Nie udało się potwierdzić przebiegu turnieju. Nagroda nie została naliczona.',
        roundResults: results, totalTurns: log.length, maxDmg: 0,
        durationMs: runStartRef.current ? Date.now() - runStartRef.current : 0,
      };
    }

    setServerResult(srvRes);
    if (srvRes.rewardEligible) { playCoinSound?.(); addNotification?.(srvRes.message); }
    playSortingFanfare?.();
    setPhase('tournamentResult');
  };

  if (!isOpen) return null;

  const gs = gameState;
  const opp = gs ? OPPONENTS[gs.round] : null;
  const busy = ['resolvingPlayer', 'enemyTurn', 'countdown'].includes(phase);

  // ===== Render =====
  return (
    <div className="tgm-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div
        className="tgm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Nagłówek */}
        <div className="tgm-header">
          <div className="tgm-header-bg" aria-hidden="true" />
          <div className="tgm-header-gradient" aria-hidden="true" />
          <div className="tgm-header-inner">
            <div className="tgm-header-title">
              <Trophy size={20} color="var(--gold-ancient, #c59f4e)" aria-hidden="true" />
              <div className="tgm-title-text">
                <h3 id={titleId}>Turniej Szermierki Różdżkowej • Droga Czempiona</h3>
                <div className="tgm-title-sub">
                  {gs ? `Runda ${gs.round + 1} / 5 — ${opp?.subtitle}` : 'Drabinka 5 rund'}
                </div>
              </div>
            </div>
            <div className="tgm-header-actions">
              <button
                className="tgm-btn-icon"
                onClick={() => setRulesOpen(r => !r)}
                aria-label="Zasady turnieju"
                title="Zasady"
                ref={firstFocusRef}
              >
                <BookOpen size={16} />
              </button>
              <button
                className="tgm-btn-icon"
                onClick={handleClose}
                aria-label="Zamknij turniej"
                title="Zamknij"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Treść */}
        <div className="tgm-content" role="region" aria-label="Pole walki" aria-busy={busy}>

          {/* Drabinka */}
          {!['intro', 'rules'].includes(phase) && (
            <div className="tgm-bracket" role="list" aria-label="Postęp turnieju">
              {OPPONENTS.map((op, idx) => {
                const done = roundResults[idx]?.won;
                const lost = roundResults[idx] && !roundResults[idx].won;
                const active = gs?.round === idx;
                const locked = !done && !active && !lost;
                return (
                  <div
                    key={op.id}
                    className={`tgm-bracket-item ${active ? 'active' : done ? 'defeated' : locked ? 'locked' : ''}`}
                    role="listitem"
                    aria-label={`${op.name} — ${done ? 'pokonany' : active ? 'aktywny' : locked ? 'zablokowany' : 'przegrany'}`}
                  >
                    {done && <Check size={10} className="tgm-bracket-check" aria-hidden="true" />}
                    <OpponentPortrait idx={idx} size="sm" active={active} />
                    <div className="tgm-bracket-label">R{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FAZA: intro */}
          {phase === 'intro' && (
            <div className="tgm-intro">
              <div className="tgm-banner">
                <div className="tgm-banner-bg" aria-hidden="true" />
                <div className="tgm-banner-inner">
                  <div className="tgm-banner-ornament" aria-hidden="true"><Trophy size={28} /></div>
                  <h2 className="tgm-banner-title">Turniej Szermierki Różdżkowej</h2>
                  <p className="tgm-banner-sub">Droga Czempiona — 5 rund taktycznej walki</p>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.6 }}>
                Zmierz się z pięcioma rywalami. Wybierz jedną z czterech akcji, odpowiedz na zamiar
                wroga i pokieruj skupieniem, by sięgnąć po tytuł Czempiona Północy.
              </div>

              {!canBeRewarded && (
                <div className="tgm-reward-box training" role="status">
                  Dzisiejsza nagroda została już odebrana. Kolejna próba będzie treningowa.
                </div>
              )}

              <div className="tgm-rewards-table" role="table" aria-label="Nagrody turniejowe">
                <table>
                  <thead>
                    <tr>
                      <th>Wynik</th><th>Ranga</th><th>Pkt Zakonu</th><th>Skirniry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['950–1000', 'Legenda Żelaznego Kręgu', 20, 15],
                      ['850–949', 'Czempion Północy', 12, 10],
                      ['700–849', 'Mistrz Areny', 8, 7],
                      ['550–699', 'Runiczny Fechmistrz', 5, 5],
                      ['0–549', 'Uczeń Ostrza', 0, 0],
                    ].map(([sc, rk, pt, sk]) => (
                      <tr key={sc}>
                        <td>{sc}</td><td>{rk}</td><td>{pt}</td><td>{sk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="tgm-btn-row">
                <button className="tgm-btn-primary" onClick={handleStart} disabled={isStarting}>
                  <Swords size={16} /> {isStarting ? 'Ładowanie…' : 'Wejdź na arenę'}
                </button>
                <button className="tgm-btn-secondary" onClick={() => setRulesOpen(true)}>
                  <BookOpen size={15} /> Zasady
                </button>
              </div>
            </div>
          )}

          {/* FAZA: countdown */}
          {phase === 'countdown' && (
            <div className="tgm-countdown" aria-live="assertive" aria-label="Odliczanie do walki">
              <div className="tgm-countdown-num" key={countdownNum}>{countdownNum}</div>
            </div>
          )}

          {/* FAZA: walka */}
          {['playerTurn', 'resolvingPlayer', 'enemyTurn'].includes(phase) && gs && opp && (
            <>
              {/* Pole walki */}
              <div className="tgm-battlefield">
                {/* Gracz */}
                <div className="tgm-fighter">
                  <div className="tgm-fighter-header">
                    <div className="tgm-player-avatar" aria-hidden="true"><User size={28} /></div>
                    <div className="tgm-fighter-name">Twój czarodziej</div>
                  </div>
                  <StatBar value={gs.playerHp} max={MAX_HP} variant="hp-player" label="HP" id="tgm-player-hp" />
                  <StatBar value={gs.focus} max={MAX_FOCUS} variant="focus-bar" label="Sk." id="tgm-player-focus" />
                  <div className="tgm-status-row" aria-label="Statusy gracza">
                    {gs.exposed && <span className="tgm-badge exposed" title="Odsłonięty: następna ofensywna akcja +50%">Odsłonięty</span>}
                    {gs.shield && <span className="tgm-badge shield" title={`Garda: ${gs.shieldPct}% redukcji`}>Garda {gs.shieldPct}%</span>}
                  </div>
                </div>

                <div className="tgm-vs" aria-hidden="true">VS</div>

                {/* Przeciwnik */}
                <div className="tgm-fighter" style={{ position: 'relative' }}>
                  <div className="tgm-fighter-header">
                    <OpponentPortrait idx={opp.portraitIdx} size="lg" active={phase === 'enemyTurn'} />
                    <div>
                      <div className="tgm-fighter-name" style={{ color: 'var(--gold-ancient,#c59f4e)' }}>{opp.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{opp.subtitle}</div>
                    </div>
                  </div>
                  <StatBar value={gs.enemyHp} max={opp.maxHp} variant="hp-enemy" label="HP" id="tgm-enemy-hp" />
                  <div className="tgm-status-row" aria-label="Statusy przeciwnika">
                    {gs.enemyState.berserkActivated && gs.enemyState.berserkTurnsLeft > 0 && (
                      <span className="tgm-badge berserk">Szał ({gs.enemyState.berserkTurnsLeft})</span>
                    )}
                    {gs.enemyState.brittleGuardActive && <span className="tgm-badge brittle">Krucha garda</span>}
                    {gs.enemyState.counterActive && <span className="tgm-badge counter">Kontra!</span>}
                    {gs.round === 4 && gs.enemyState.shieldActive && <span className="tgm-badge shield">Osłona 40%</span>}
                  </div>
                  {(enemyIntent || phase === 'enemyTurn') && (
                    <div className="tgm-intent" aria-live="polite" aria-label="Zamiar przeciwnika">
                      <div className="tgm-intent-label">Zamiar:</div>
                      <div className={`tgm-intent-value ${enemyIntent?.isStrong ? 'strong' : ''}`}>
                        {enemyIntent?.label} — {enemyIntent?.detail}
                      </div>
                    </div>
                  )}
                  {/* Floating damage */}
                  {floatingDmg.filter(f => f.type === 'enemy').map(f => (
                    <div key={f.id} className={`tgm-float-dmg enemy`} aria-hidden="true">{f.val}</div>
                  ))}
                </div>
              </div>

              {/* Licznik tur */}
              <div className="tgm-turn-badge">
                Tura {gs.turn + 1} / {MAX_TURNS} — HP: {gs.playerHp}
              </div>

              {/* Akcje gracza */}
              <div className="tgm-actions" role="group" aria-label="Dostępne akcje" aria-busy={busy}>
                {Object.values(PLAYER_ACTIONS).map(action => {
                  const { legal, reason } = isActionLegal(gs, action.id);
                  const cd = gs.cooldowns[action.id] || 0;
                  const isDisabled = busy || !legal;
                  return (
                    <button
                      key={action.id}
                      className="tgm-action-btn"
                      onClick={() => handleAction(action.id)}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      aria-label={`${action.name}${!legal ? ` — ${reason}` : ''}`}
                      title={!legal ? reason : action.desc}
                    >
                      <div className="tgm-action-name">{action.name}</div>
                      <div className="tgm-action-desc">{action.desc}</div>
                      <div className="tgm-action-meta">
                        <span className="tgm-action-focus">{action.focusLabel} skupienia</span>
                        {cd > 0 && (
                          <span className="tgm-action-cd active-cd" aria-label={`Cooldown: ${cd} ${cd === 1 ? 'tura' : 'tury'}`}>
                            CD {cd}
                          </span>
                        )}
                        {action.requiresFocus > 0 && gs.focus < action.requiresFocus && (
                          <span className="tgm-action-cd active-cd">Sk. {action.requiresFocus}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Log walki */}
              <div
                className="tgm-log"
                role="log"
                aria-live="polite"
                aria-label="Dziennik walki"
              >
                {combatLog.map((entry, i) => (
                  <div
                    key={entry.key}
                    className={`tgm-log-entry ${i === 0 ? 'latest' : ''} ${entry.type === 'positive' ? 'positive' : entry.type === 'danger' ? 'danger' : entry.type === 'warning' ? 'warning' : ''}`}
                  >
                    {entry.text}
                  </div>
                ))}
              </div>

              {/* Floating damage po stronie gracza */}
              <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
                {floatingDmg.filter(f => f.type === 'player').map(f => (
                  <div key={f.id} className="tgm-float-dmg player" aria-hidden="true">{f.val}</div>
                ))}
              </div>
            </>
          )}

          {/* FAZA: roundResult */}
          {phase === 'roundResult' && gs && (
            <div className="tgm-result won" role="status" aria-live="polite">
              <div className="tgm-banner-ornament" aria-hidden="true"><Star size={28} color="var(--gold-ancient,#c59f4e)" /></div>
              <div className="tgm-result-rank">Runda {gs.round + 1} ukończona!</div>
              <div style={{ fontSize: '0.85rem', color: '#d1d5db', margin: '0.5rem 0' }}>
                Pokonałeś {OPPONENTS[gs.round].name}
              </div>
              <div className="tgm-stats-grid">
                <div className="tgm-stat">
                  <div className="tgm-stat-label">Pozostałe HP</div>
                  <div className="tgm-stat-val">{gs.playerHp} / {MAX_HP}</div>
                </div>
                <div className="tgm-stat">
                  <div className="tgm-stat-label">Użyte tury</div>
                  <div className="tgm-stat-val">{gs.playerActionsUsed} / {MAX_TURNS}</div>
                </div>
              </div>
              {currentRound + 1 < OPPONENTS.length && (
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                  Następny rywal: <strong style={{ color: '#fff' }}>{OPPONENTS[currentRound + 1].name}</strong>
                  {' '}(HP: {OPPONENTS[currentRound + 1].maxHp})
                </div>
              )}
              <div className="tgm-btn-row" style={{ marginTop: '0.75rem' }}>
                <button className="tgm-btn-primary" onClick={handleNextRound}>
                  <ChevronRight size={16} /> Wejdź na arenę
                </button>
              </div>
            </div>
          )}

          {/* FAZA: defeat */}
          {phase === 'defeat' && (
            <div className="tgm-result lost" role="status" aria-live="assertive">
              <div className="tgm-banner-ornament" aria-hidden="true"><X size={28} color="#f87171" /></div>
              <div className="tgm-result-rank" style={{ color: '#f87171' }}>Droga zakończona</div>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '0.25rem 0 0.75rem' }}>
                Twój czarodziej nie zdołał ukończyć turnieju. Wynik treningowy zostaje zapisany.
              </p>
              <div className="tgm-btn-row">
                <button className="tgm-btn-primary" onClick={handleStart}>
                  <RotateCcw size={15} /> Spróbuj od początku
                </button>
                <button className="tgm-btn-secondary" onClick={onClose}>
                  <X size={15} /> Zamknij
                </button>
              </div>
            </div>
          )}

          {/* FAZA: rewardPending */}
          {phase === 'rewardPending' && (
            <div className="tgm-busy-indicator" role="status" aria-live="polite">
              <div style={{ width: 16, height: 16, border: '2px solid rgba(197,159,78,0.4)', borderTopColor: 'var(--gold-ancient,#c59f4e)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />
              Zapisywanie wyniku…
            </div>
          )}

          {/* FAZA: tournamentResult */}
          {phase === 'tournamentResult' && serverResult && (
            <div className="tgm-result won" role="status" aria-live="polite" style={{ position: 'relative' }}>
              {serverResult.score >= 850 && (
                <div className="tgm-particles" aria-hidden="true">
                  {Array.from({ length: Math.min(24, Math.floor(serverResult.score / 42)) }).map((_, i) => (
                    <div
                      key={i}
                      className="tgm-particle"
                      style={{
                        left: `${(i * 37 + 10) % 90}%`,
                        top: `${(i * 23 + 5) % 60}%`,
                        '--dur': `${1.2 + (i % 4) * 0.25}s`,
                        '--delay': `${(i % 6) * 0.12}s`,
                        '--dx': `${((i % 5) - 2) * 18}px`,
                        '--dy': `${40 + (i % 3) * 20}px`,
                        background: i % 3 === 0 ? 'var(--gold-ancient,#c59f4e)' : '#f0f4f8',
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="tgm-banner-ornament" aria-hidden="true">
                {serverResult.score >= 850 ? <Crown size={32} color="var(--gold-ancient,#c59f4e)" /> : <Trophy size={28} />}
              </div>
              <div className="tgm-result-rank">
                {serverResult.score >= 950 ? 'Nowy Czempion Północy!' : 'Turniej ukończony'}
              </div>
              <div className="tgm-result-score">{serverResult.score} pkt</div>
              <div style={{ fontSize: '1rem', color: 'var(--gold-ancient,#c59f4e)', fontWeight: 700 }}>{serverResult.rank}</div>

              <div className="tgm-stats-grid" style={{ marginTop: '0.75rem' }}>
                <div className="tgm-stat"><div className="tgm-stat-label">Rundy</div><div className="tgm-stat-val">{serverResult.roundResults?.length || roundResults.length} / 5</div></div>
                <div className="tgm-stat"><div className="tgm-stat-label">Łączne tury</div><div className="tgm-stat-val">{serverResult.totalTurns}</div></div>
                <div className="tgm-stat"><div className="tgm-stat-label">Najwyższe obrażenia</div><div className="tgm-stat-val">{serverResult.maxDmg}</div></div>
                <div className="tgm-stat"><div className="tgm-stat-label">Czas próby</div><div className="tgm-stat-val">{Math.floor((serverResult.durationMs || 0) / 60000)} min {Math.floor(((serverResult.durationMs || 0) % 60000) / 1000)} s</div></div>
              </div>

              <div className={`tgm-reward-box ${serverResult.rewardEligible ? '' : 'training'}`} role="note">
                {serverResult.message}
              </div>

              <div className="tgm-btn-row" style={{ marginTop: '0.75rem' }}>
                <button className="tgm-btn-primary" onClick={handleStart}>
                  <RotateCcw size={15} /> Nowa próba (trening)
                </button>
                <button className="tgm-btn-secondary" onClick={onClose}>
                  <X size={15} /> Zamknij
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Regulamin — nakładka */}
        {rulesOpen && (
          <div className="tgm-rules-overlay" role="dialog" aria-modal="true" aria-label="Zasady turnieju">
            <div className="tgm-rules-header">
              <h3>Zasady turnieju</h3>
              <button className="tgm-btn-icon" onClick={() => setRulesOpen(false)} aria-label="Zamknij zasady">
                <X size={16} />
              </button>
            </div>
            <div className="tgm-rules-tabs" role="tablist" aria-label="Sekcje zasad">
              {['Jak walczyć', 'Rywalowie', 'Punktacja', 'Nagrody'].map((label, i) => (
                <button
                  key={i}
                  className={`tgm-tab-btn ${rulesTab === i ? 'active' : ''}`}
                  role="tab"
                  aria-selected={rulesTab === i}
                  onClick={() => setRulesTab(i)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="tgm-rules-body" role="tabpanel">
              {rulesTab === 0 && (
                <>
                  <p>Turniej składa się z 5 rund taktycznych. W każdej turze wybierasz jedną akcję, a następnie rywal odpowiada.</p>
                  <h4>Akcje gracza</h4>
                  <ul>
                    <li><strong>Runiczne cięcie</strong> — 14–18 obrażeń, +18 skupienia. Niezawodna akcja podstawowa.</li>
                    <li><strong>Garda Północy</strong> — 5–8 obrażeń, 60% redukcji następnego ciosu, leczenie 5 HP, +10 skupienia. Cooldown 2 tury.</li>
                    <li><strong>Zwodniczy znak</strong> — 9–12 obrażeń, nadaje status <em>Odsłonięty</em> (następna ofensywna akcja +50% obrażeń). Cooldown 2 tury.</li>
                    <li><strong>Uderzenie Czempiona</strong> — 28–36 obrażeń, −50 skupienia. Wymaga 50 skupienia. Cooldown 1 tura.</li>
                  </ul>
                  <h4>Zasoby</h4>
                  <ul>
                    <li>HP gracza: 0–100. Po każdej rundzie odzyskujesz 22 HP.</li>
                    <li>Skupienie: 0–100. Start każdej rundy: min(20, poprzednie).</li>
                    <li>Limit tur: 12 akcji gracza na rundę.</li>
                  </ul>
                </>
              )}
              {rulesTab === 1 && (
                <ul>
                  <li><strong>Sven z Reinhall</strong> (60 HP) — Co 3 ruchy używa Nerwowego pchnięcia (14) — zapowiedzianego turę wcześniej.</li>
                  <li><strong>Gunnar z Björnhall</strong> (82 HP) — Poniżej 35 HP wchodzi w Szał niedźwiedzia: 2 ataki +4 obrażeń, ale przyjmuje +20% obrażeń.</li>
                  <li><strong>Ilona z Ravnheim</strong> (96 HP) — Co 4 ruchy zakłada kontrę: atak ofensywny gracza zwraca 10 obrażeń; Garda rozbraja bezpiecznie.</li>
                  <li><strong>Vidar z Otergard</strong> (112 HP) — Raz na rundę leczy 16 HP, po czym ma Kruchą gardę (+30% z następnego trafienia).</li>
                  <li><strong>Valgerda Storm</strong> (135 HP) — Rotuje fazy: Atak, Osłona 40%, Burza run (18–22, zapowiedziana). Poniżej 45 HP nie leczy.</li>
                </ul>
              )}
              {rulesTab === 2 && (
                <>
                  <p>Wynik turnieju mieści się w zakresie 0–1000.</p>
                  <h4>Punkty za rundę</h4>
                  <ul>
                    <li>120 pkt za zwycięstwo, 60 pkt za zwycięstwo sędziowskie.</li>
                    <li>+max 30 pkt za % pozostałego HP.</li>
                    <li>+max 44 pkt za tempo (12 − tury użyte) × 4.</li>
                    <li>+8 pkt za Gardę skutecznie zmniejszającą silny atak (maks. 24).</li>
                    <li>+6 pkt za kombinację Zwodniczy znak → Uderzenie Czempiona (maks. 12).</li>
                  </ul>
                  <h4>Remis sędziowski</h4>
                  <p>Przy identycznym % HP po 12 turach próba kończy się bez nagrody.</p>
                </>
              )}
              {rulesTab === 3 && (
                <>
                  <p>Nagroda przysługuje za ukończenie wszystkich 5 rund z wynikiem ≥ 550. Jedna nagroda dziennie.</p>
                  <h4>Puchar Czempiona Północy</h4>
                  <p>Przyznawany raz za pierwsze ukończenie z wynikiem ≥ 850.</p>
                  <p>Druga i kolejne próby tego samego dnia są treningowe — bez nagrody ekonomicznej, ale wynik jest zapisywany.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Potwierdzenie zamknięcia podczas walki */}
        {confirmClose && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(10,13,20,0.96)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '1rem', borderRadius: '12px', zIndex: 30,
          }} role="alertdialog" aria-modal="true" aria-label="Potwierdzenie porzucenia">
            <X size={32} color="#f87171" />
            <p style={{ color: '#d1d5db', textAlign: 'center', margin: 0, maxWidth: 280 }}>
              Zamknięcie teraz oznacza <strong>porzucenie</strong> bieżącej próby bez nagrody.
              Czy na pewno chcesz wyjść?
            </p>
            <div className="tgm-btn-row">
              <button className="tgm-btn-primary" style={{ background: '#ef4444', color: '#fff' }} onClick={handleConfirmClose}>
                Opuść turniej
              </button>
              <button className="tgm-btn-secondary" onClick={() => setConfirmClose(false)}>
                Kontynuuj walkę
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
