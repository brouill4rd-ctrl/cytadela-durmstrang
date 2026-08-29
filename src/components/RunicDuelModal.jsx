import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Coins,
  Eye,
  Flame,
  Heart,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Wind,
  X,
  Zap
} from 'lucide-react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  RUNIC_DUEL_ACTIONS,
  RUNIC_DUEL_MAX_TURNS,
  RUNIC_DUEL_OPPONENTS,
  chooseEnemyAction,
  createInitialDuelState,
  getActionLegality,
  resolveDuelTurn
} from '../game/runicDuelRules';
import './RunicDuelModal.css';

const ACTION_ICONS = {
  thurisaz: Flame,
  isa: Shield,
  nauthiz: Zap,
  ansuz: Wind,
  tyr: Swords
};

const RESULT_COPY = {
  player_win: { title: 'Zwycięstwo w Kręgu', icon: Trophy, tone: 'victory' },
  enemy_win: { title: 'Krąg Cię Pokonał', icon: Swords, tone: 'defeat' },
  draw: { title: 'Remis Run', icon: Sparkles, tone: 'draw' }
};

const initialStatus = {
  attemptsUsed: 0,
  attemptsLimit: 3,
  rewardClaimed: false,
  canStartReward: false,
  featuredOpponentId: 'yrsa',
  featuredOpponent: RUNIC_DUEL_OPPONENTS.yrsa,
  activeRun: null,
  record: 0,
  history: []
};

const createId = (prefix) => {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function ResourceBar({ label, value, max, tone, icon: Icon }) {
  const safeValue = Math.max(0, Math.min(max, value));
  return (
    <div className="rdm-resource">
      <div className="rdm-resource__label">
        <span><Icon size={14} aria-hidden="true" /> {label}</span>
        <strong>{safeValue}/{max}</strong>
      </div>
      <div
        className={`rdm-resource__track rdm-resource__track--${tone}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeValue}
      >
        <span style={{ width: `${(safeValue / max) * 100}%` }} />
      </div>
    </div>
  );
}

function OpponentPortrait({ opponent, side = 'card', activeAction = '', hit = false }) {
  return (
    <div
      className={`rdm-portrait rdm-portrait--${side} rdm-portrait--${opponent.portrait} ${activeAction ? `rdm-portrait--action-${activeAction}` : ''} ${hit ? 'rdm-portrait--hit' : ''}`}
      role="img"
      aria-label={`Portret: ${opponent.name}`}
    />
  );
}

function ResultBadge({ result }) {
  const copy = RESULT_COPY[result] || RESULT_COPY.draw;
  const Icon = copy.icon;
  return (
    <div className={`rdm-result-badge rdm-result-badge--${copy.tone}`}>
      <Icon size={24} aria-hidden="true" />
      <span>{copy.title}</span>
    </div>
  );
}

export const RunicDuelModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare, playCoinSound } = useSound();
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const animationTimerRef = useRef(null);

  const [phase, setPhase] = useState('loading');
  const [status, setStatus] = useState(initialStatus);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [selectedOpponentId, setSelectedOpponentId] = useState('yrsa');
  const [pendingMode, setPendingMode] = useState('training');
  const [run, setRun] = useState(null);
  const [duelState, setDuelState] = useState(null);
  const [enemyIntent, setEnemyIntent] = useState('');
  const [localSeed, setLocalSeed] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [events, setEvents] = useState([]);
  const [log, setLog] = useState(['Stań w kamiennym kręgu i odczytaj zamiar przeciwnika.']);
  const [lastActions, setLastActions] = useState({ player: '', enemy: '' });

  const opponent = RUNIC_DUEL_OPPONENTS[run?.opponentId || selectedOpponentId] || RUNIC_DUEL_OPPONENTS.yrsa;
  const intentAction = RUNIC_DUEL_ACTIONS[enemyIntent];
  const isActive = phase === 'fighting' || phase === 'resolving';

  const playerName = useMemo(() => {
    if (!currentUser) return 'Wędrowny Adept';
    return currentUser.full_name || currentUser.fullName || `${currentUser.name || currentUser.first_name || ''} ${currentUser.surname || currentUser.last_name || ''}`.trim() || currentUser.username;
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) {
      window.clearTimeout(animationTimerRef.current);
      setPhase('loading');
      setRun(null);
      setDuelState(null);
      setShowCloseConfirm(false);
      setShowRules(false);
      setError('');
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    loadStatus();
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(animationTimerRef.current);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showRules) setShowRules(false);
        else if (showCloseConfirm) setShowCloseConfirm(false);
        else if (isActive) setShowCloseConfirm(true);
        else onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isActive, onClose, showCloseConfirm, showRules]);

  async function loadStatus() {
    setError('');
    if (!currentUser) {
      setStatus({ ...initialStatus, canStartReward: false });
      setBackendAvailable(false);
      setSelectedOpponentId('yrsa');
      setPhase('intro');
      return;
    }
    setPhase('loading');
    const response = await api.getRunicDuelStatus();
    if (!response.ok) {
      setBackendAvailable(false);
      setStatus({ ...initialStatus, canStartReward: false });
      setPhase('intro');
      setError('Backend Kręgu jest niedostępny. Możesz walczyć treningowo bez nagród.');
      return;
    }
    setBackendAvailable(true);
    setStatus(response.data);
    setSelectedOpponentId(response.data.featuredOpponentId || 'yrsa');
    setPhase('intro');
  }

  const chooseBattle = (mode, opponentId) => {
    const selected = mode === 'reward' ? status.featuredOpponentId : opponentId;
    setPendingMode(mode);
    setSelectedOpponentId(selected);
    setError('');
    setPhase('ready');
  };

  const beginBattle = async () => {
    setBusy(true);
    setError('');
    setEvents([]);
    setLog([`Wkraczasz na Arenę Bazaltową. ${opponent.name} czeka na pierwszy znak.`]);

    if (currentUser && backendAvailable) {
      const response = await api.startRunicDuel({
        clientRunId: createId('rdm-run'),
        mode: pendingMode,
        opponentId: selectedOpponentId
      });
      if (response.ok) {
        const serverRun = response.data.run;
        setRun(serverRun);
        setDuelState(serverRun.state);
        setEnemyIntent(serverRun.currentEnemyIntent);
        setSelectedOpponentId(serverRun.opponentId);
        setIsLocal(false);
        setPhase('fighting');
        if (response.data.downgradedToTraining) setError('Limit nagród wykorzystany — ten pojedynek jest treningowy.');
        setBusy(false);
        return;
      }
      if (pendingMode === 'reward') {
        setError('Nie udało się utworzyć bezpiecznej Próby dnia. Nagrody pozostają wyłączone.');
        setBusy(false);
        return;
      }
    }

    const state = createInitialDuelState();
    const seed = createId('local');
    setRun({ mode: 'training', opponentId: selectedOpponentId, reward: { housePoints: 0, skirniry: 0 }, rewarded: false });
    setDuelState(state);
    setLocalSeed(seed);
    setEnemyIntent(chooseEnemyAction({ state, opponentId: selectedOpponentId, seed, playerHistory: [] }));
    setIsLocal(true);
    setPhase('fighting');
    setBusy(false);
  };

  const resumeBattle = () => {
    const active = status.activeRun;
    if (!active) return;
    setRun(active);
    setDuelState(active.state);
    setEnemyIntent(active.currentEnemyIntent);
    setSelectedOpponentId(active.opponentId);
    setPendingMode(active.mode);
    setIsLocal(false);
    setLog(['Wznowiono pojedynek dokładnie od stanu zapisanego w Kręgu.']);
    setPhase('fighting');
  };

  const announceCompletion = (updatedRun, updatedState) => {
    if (updatedState.result === 'player_win') playSortingFanfare();
    if (updatedRun?.rewarded) {
      playCoinSound();
      addNotification?.(`⚔️ Runiczny Krąg: +${updatedRun.reward.housePoints} pkt Zakonu, +${updatedRun.reward.skirniry} Skirnirów.`);
    }
  };

  const presentTurn = ({ updatedRun, updatedState, turnEvents, nextIntent, playerAction, enemyAction }) => {
    setRun(updatedRun);
    setDuelState(updatedState);
    setEnemyIntent(nextIntent || '');
    setEvents(turnEvents);
    setLastActions({ player: playerAction, enemy: enemyAction });
    setLog((previous) => [
      ...turnEvents.map((event) => event.text),
      ...previous
    ].filter(Boolean).slice(0, 6));
    if (turnEvents.some((event) => event.type === 'resonance')) playRuneChime();
    setPhase('resolving');
    const delay = reducedMotion ? 0 : 520;
    window.clearTimeout(animationTimerRef.current);
    animationTimerRef.current = window.setTimeout(() => {
      setLastActions({ player: '', enemy: '' });
      setEvents([]);
      if (updatedState.status === 'complete') {
        announceCompletion(updatedRun, updatedState);
        setPhase('result');
      } else {
        setPhase('fighting');
      }
      setBusy(false);
    }, delay);
  };

  const handleAction = async (actionId) => {
    if (!duelState || busy || phase !== 'fighting') return;
    const legality = getActionLegality(duelState.player, actionId);
    if (!legality.legal) return;
    setBusy(true);
    setError('');
    playWandSwoosh();

    if (!isLocal && run?.runId) {
      const response = await api.submitRunicDuelAction(run.runId, {
        actionId: createId('rdm-action'),
        turnNumber: duelState.turnNumber,
        playerAction: actionId
      });
      if (!response.ok) {
        if (response.data?.run) {
          setRun(response.data.run);
          setDuelState(response.data.run.state);
          setEnemyIntent(response.data.run.currentEnemyIntent);
        }
        setError(response.error || 'Nie udało się potwierdzić tury. Spróbuj ponownie.');
        setBusy(false);
        return;
      }
      const payload = response.data;
      presentTurn({
        updatedRun: payload.run,
        updatedState: payload.run.state,
        turnEvents: payload.turn.events,
        nextIntent: payload.run.currentEnemyIntent,
        playerAction: actionId,
        enemyAction: payload.turn.enemyAction
      });
      return;
    }

    try {
      const enemyAction = enemyIntent;
      const resolved = resolveDuelTurn({ state: duelState, playerAction: actionId, enemyAction, opponentId: selectedOpponentId });
      const playerHistory = resolved.state.history.map((entry) => entry.playerAction);
      const nextIntent = resolved.state.status === 'fighting'
        ? chooseEnemyAction({ state: resolved.state, opponentId: selectedOpponentId, seed: localSeed, playerHistory })
        : '';
      const localRun = {
        ...run,
        state: resolved.state,
        status: resolved.state.status === 'complete' ? 'completed' : 'active',
        result: resolved.state.result,
        score: resolved.state.score,
        rank: resolved.state.rank,
        rewarded: false,
        rewardReason: 'Pojedynek treningowy.',
        reward: { housePoints: 0, skirniry: 0 }
      };
      presentTurn({
        updatedRun: localRun,
        updatedState: resolved.state,
        turnEvents: resolved.events,
        nextIntent,
        playerAction: actionId,
        enemyAction
      });
    } catch (caught) {
      setError(caught.message);
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (isActive) setShowCloseConfirm(true);
    else onClose();
  };

  const confirmClose = async () => {
    setBusy(true);
    if (!isLocal && run?.runId && run.status === 'active') await api.abandonRunicDuel(run.runId);
    setBusy(false);
    setShowCloseConfirm(false);
    onClose();
  };

  const backToIntro = async () => {
    window.clearTimeout(animationTimerRef.current);
    setRun(null);
    setDuelState(null);
    setEnemyIntent('');
    setEvents([]);
    setLastActions({ player: '', enemy: '' });
    await loadStatus();
  };

  if (!isOpen) return null;

  return (
    <div className="rdm-overlay">
      <section className="rdm-modal" role="dialog" aria-modal="true" aria-labelledby="rdm-title" tabIndex={-1} ref={dialogRef}>
        <header className="rdm-header">
          <div className="rdm-header__title">
            <Swords size={22} aria-hidden="true" />
            <div><h2 id="rdm-title">Runiczny Krąg Pojedynków</h2><span>Arena Bazaltowa</span></div>
          </div>
          <div className="rdm-header__actions">
            {currentUser && <span className="rdm-attempts" title="Wykorzystane próby dnia">Próby {status.attemptsUsed}/{status.attemptsLimit}</span>}
            <button type="button" className="rdm-icon-button" onClick={() => setShowRules(true)} aria-label="Otwórz zasady pojedynku"><BookOpen size={19} /></button>
            <button type="button" className="rdm-icon-button" onClick={requestClose} aria-label="Zamknij Runiczny Krąg"><X size={20} /></button>
          </div>
        </header>

        <div className="rdm-body">
          {phase === 'loading' && <div className="rdm-loading" aria-live="polite"><Sparkles className="rdm-spin" size={30} /><p>Krąg odczytuje dzisiejsze pieczęcie…</p></div>}

          {phase === 'intro' && (
            <div className="rdm-intro">
              <div className="rdm-hero"><div className="rdm-hero__content"><span className="rdm-kicker">Taktyczny pojedynek runiczny</span><h3>Odczytaj zamiar. Wybierz kontrę. Ułóż rezonans.</h3><p>Każda tura jest jawna, lecz skupienie, cooldowny i styl rywala decydują, czy zdołasz wykorzystać wiedzę.</p></div></div>
              {error && <div className="rdm-alert rdm-alert--warning" role="status"><AlertTriangle size={17} /> {error}</div>}
              {status.activeRun && <div className="rdm-resume-card"><div><strong>Aktywny pojedynek: {status.activeRun.opponent.name}</strong><span>Tura {status.activeRun.state.turnNumber} • {status.activeRun.mode === 'reward' ? 'Próba dnia' : 'Trening'}</span></div><button type="button" className="rdm-button rdm-button--gold" onClick={resumeBattle}>Wznów pojedynek</button></div>}

              <div className="rdm-intro-grid">
                <article className="rdm-daily-card">
                  <OpponentPortrait opponent={status.featuredOpponent || RUNIC_DUEL_OPPONENTS[status.featuredOpponentId]} side="daily" />
                  <div className="rdm-daily-card__content">
                    <span className="rdm-kicker">Próba dnia</span><h3>{status.featuredOpponent?.name || RUNIC_DUEL_OPPONENTS[status.featuredOpponentId].name}</h3><p>{status.featuredOpponent?.description || RUNIC_DUEL_OPPONENTS[status.featuredOpponentId].description}</p>
                    <div className="rdm-daily-meta"><span><Trophy size={15} /> Rekord: {status.record}</span><span><Coins size={15} /> Maks. 12 pkt + 10 Sk.</span></div>
                    <button type="button" className="rdm-button rdm-button--gold" disabled={!status.canStartReward || !backendAvailable || !!status.activeRun} onClick={() => chooseBattle('reward', status.featuredOpponentId)}><Play size={17} />{status.rewardClaimed ? 'Nagroda już zdobyta' : status.attemptsUsed >= status.attemptsLimit ? 'Wykorzystano 3/3 prób' : 'Podejmij Próbę dnia'}</button>
                    {!currentUser && <small>Zaloguj się, aby walczyć o nagrodę.</small>}
                  </div>
                </article>

                <section className="rdm-training-panel" aria-labelledby="rdm-training-title">
                  <div className="rdm-section-heading"><div><span className="rdm-kicker">Bez limitu i nagród</span><h3 id="rdm-training-title">Trening z wybranym rywalem</h3></div></div>
                  <div className="rdm-opponent-grid">
                    {Object.values(RUNIC_DUEL_OPPONENTS).map((item) => <button type="button" className="rdm-opponent-card" key={item.id} disabled={!!status.activeRun} onClick={() => chooseBattle('training', item.id)}><OpponentPortrait opponent={item} /><span><strong>{item.name.split(' ')[0]}</strong><small>{item.style}</small></span></button>)}
                  </div>
                </section>
              </div>

              {!!status.history?.length && <section className="rdm-history"><div className="rdm-section-heading"><h3>Ostatnie starcia</h3></div><div className="rdm-history__list">{status.history.map((item) => <div className="rdm-history__item" key={item.runId}><span>{item.result === 'player_win' ? '✓' : item.result === 'draw' ? '＝' : '×'} {item.opponentName}</span><strong>{item.score} pkt</strong><small>{item.mode === 'reward' ? 'Próba dnia' : 'Trening'}</small></div>)}</div></section>}
            </div>
          )}

          {phase === 'ready' && (
            <div className="rdm-ready">
              <div className="rdm-ready__arena"><OpponentPortrait opponent={opponent} side="ready" /><div className="rdm-ready__copy"><span className="rdm-kicker">{pendingMode === 'reward' ? 'Próba dnia' : 'Trening'}</span><h3>{opponent.name}</h3><p className="rdm-ready__title">{opponent.title}</p><p>{opponent.description}</p><div className="rdm-special"><Sparkles size={17} /><span><strong>Zdolność:</strong> {opponent.special}</span></div></div></div>
              <div className="rdm-ready__rules"><span><Eye size={18} /><strong>Zamiar jest jawny</strong><small>Rywal wybiera przed Tobą.</small></span><span><Sparkles size={18} /><strong>Trzy runy = rezonans</strong><small>Thurisaz, Isa i Nauthiz.</small></span><span><Swords size={18} /><strong>Maks. 10 tur</strong><small>Potem werdykt sędziów.</small></span></div>
              {error && <div className="rdm-alert rdm-alert--warning"><AlertTriangle size={17} /> {error}</div>}
              <div className="rdm-ready__actions"><button type="button" className="rdm-button rdm-button--ghost" onClick={() => setPhase('intro')}>Wróć</button><button type="button" className="rdm-button rdm-button--gold" disabled={busy} onClick={beginBattle}><Swords size={18} /> Wejdź do Kręgu</button></div>
            </div>
          )}

          {(phase === 'fighting' || phase === 'resolving') && duelState && (
            <div className="rdm-fight" aria-busy={busy || phase === 'resolving'}>
              <div className="rdm-round-banner">Tura {duelState.turnNumber}/{RUNIC_DUEL_MAX_TURNS} • {run?.mode === 'reward' ? 'Próba dnia' : 'Trening'}</div>
              <div className={`rdm-arena ${events.some((event) => event.type === 'resonance') ? 'rdm-arena--resonance' : ''}`}>
                <div className="rdm-combatant rdm-combatant--player">
                  <div className={`rdm-player-sigil ${lastActions.player ? `rdm-player-sigil--${lastActions.player}` : ''} ${events.some((event) => event.target === 'player' && event.type === 'damage') ? 'rdm-player-sigil--hit' : ''}`} aria-label={`Runiczna sylwetka gracza ${playerName}`}><span>ᛏ</span></div>
                  <div className="rdm-combatant__name"><strong>{playerName}</strong><small>Twój adept</small></div>
                  <ResourceBar label="HP" value={duelState.player.hp} max={100} tone="player" icon={Heart} /><ResourceBar label="Skupienie" value={duelState.player.focus} max={100} tone="focus" icon={Sparkles} />
                  <div className="rdm-status-row">{duelState.player.exposed && <span className="rdm-status rdm-status--danger"><AlertTriangle size={13} /> Odsłonięty</span>}<span className={`rdm-status ${duelState.player.tyrUsed ? 'rdm-status--muted' : ''}`}><Swords size={13} /> Tyr {duelState.player.tyrUsed ? 'zużyty' : 'gotowy'}</span></div>
                </div>
                <div className="rdm-versus" aria-hidden="true"><Swords size={24} /><span>VS</span></div>
                <div className="rdm-combatant rdm-combatant--enemy">
                  <OpponentPortrait opponent={opponent} side="battle" activeAction={lastActions.enemy} hit={events.some((event) => event.target === 'enemy' && event.type === 'damage')} />
                  <div className="rdm-combatant__name"><strong>{opponent.name}</strong><small>{opponent.style}</small></div>
                  <ResourceBar label="HP" value={duelState.enemy.hp} max={100} tone="enemy" icon={Heart} /><ResourceBar label="Skupienie" value={duelState.enemy.focus} max={100} tone="focus" icon={Sparkles} />
                  <div className="rdm-status-row">{duelState.enemy.exposed && <span className="rdm-status rdm-status--danger"><AlertTriangle size={13} /> Odsłonięty</span>}<span className={`rdm-status ${duelState.enemy.tyrUsed ? 'rdm-status--muted' : ''}`}><Swords size={13} /> Tyr {duelState.enemy.tyrUsed ? 'zużyty' : 'gotowy'}</span></div>
                </div>
                {events.filter((event) => event.type === 'damage' || event.type === 'resonance').map((event, index) => <span className={`rdm-float rdm-float--${event.target || 'enemy'}`} key={`${event.type}-${index}`}>-{event.amount}</span>)}
              </div>

              <div className="rdm-intent" aria-live="polite"><div className="rdm-intent__icon">{intentAction ? React.createElement(ACTION_ICONS[enemyIntent], { size: 22 }) : <Eye size={22} />}</div><div><span>Zamiar przeciwnika</span><strong>{intentAction?.name || 'Rozstrzygnięcie tury'}</strong><small>{intentAction?.description || 'Krąg zapisuje rezultat.'}</small></div>{intentAction && <div className="rdm-intent__hint"><Eye size={15} /> {intentAction.counterHint}</div>}</div>
              {error && <div className="rdm-alert rdm-alert--danger" role="alert"><AlertTriangle size={17} /> {error}</div>}

              <div className="rdm-actions" aria-label="Runiczne akcje gracza">
                {Object.values(RUNIC_DUEL_ACTIONS).map((action) => {
                  const legality = getActionLegality(duelState.player, action.id);
                  const Icon = ACTION_ICONS[action.id];
                  return <button type="button" className={`rdm-action rdm-action--${action.id}`} key={action.id} disabled={!legality.legal || busy || phase === 'resolving'} onClick={() => handleAction(action.id)} style={{ '--rdm-action-color': action.color }}><span className="rdm-action__icon"><Icon size={21} /></span><span className="rdm-action__copy"><strong>{action.name}</strong><small>{action.description}</small></span><span className="rdm-action__cost">{action.focusDelta > 0 ? `+${action.focusDelta}` : action.focusDelta} ✦{!legality.legal && <em><Lock size={12} /> {legality.reason}</em>}</span></button>;
                })}
              </div>

              <div className="rdm-chain-panel"><div><Sparkles size={17} /><span><strong>Runiczny Rezonans</strong><small>Ułóż trzy różne runy podstawowe.</small></span></div><div className="rdm-chain" aria-label={`Łańcuch run: ${duelState.player.chain.join(', ') || 'pusty'}`}>{[0, 1, 2].map((index) => <span key={index}>{duelState.player.chain[index] ? RUNIC_DUEL_ACTIONS[duelState.player.chain[index]].shortName.slice(0, 1) : '·'}</span>)}</div></div>
              <div className="rdm-log"><span>Kronika starcia</span><div aria-live="polite">{log.map((entry, index) => <p key={`${entry}-${index}`} className={index === 0 ? 'rdm-log__latest' : ''}>• {entry}</p>)}</div></div>
            </div>
          )}

          {phase === 'result' && duelState && (
            <div className={`rdm-result rdm-result--${RESULT_COPY[duelState.result]?.tone || 'draw'}`} aria-live="polite">
              <div className="rdm-result__hero"><ResultBadge result={duelState.result} /><h3>{duelState.result === 'player_win' ? duelState.rank : opponent.name}</h3><p>{duelState.winReason?.startsWith('judges') ? 'O wyniku rozstrzygnął werdykt sędziów po dziesiątej turze.' : duelState.result === 'player_win' ? 'Twoje runy przełamały pieczęć przeciwnika.' : duelState.result === 'draw' ? 'Obie strony wyczerpały moc w tej samej chwili.' : 'Przestudiuj zamiary rywala i spróbuj nowej sekwencji.'}</p></div>
              <div className="rdm-score-grid"><div className="rdm-score-main"><span>Wynik</span><strong>{duelState.score}</strong><small>na 1000</small></div><div><span>Podstawa zwycięstwa</span><strong>{duelState.result === 'player_win' ? 500 : 0}</strong></div><div><span>Pozostałe HP ×3</span><strong>{duelState.result === 'player_win' ? duelState.player.hp * 3 : 0}</strong></div><div><span>Premia za tempo</span><strong>{duelState.result === 'player_win' ? Math.max(0, RUNIC_DUEL_MAX_TURNS - duelState.turnNumber) * 20 : 0}</strong></div><div><span>Premia rezonansu</span><strong>{duelState.result === 'player_win' && duelState.player.resonanceCount > 0 ? 20 : 0}</strong></div></div>
              <div className={`rdm-reward ${run?.rewarded ? 'rdm-reward--earned' : ''}`}><Coins size={23} /><div><strong>{run?.rewarded ? `+${run.reward.housePoints} pkt Zakonu • +${run.reward.skirniry} Skirnirów` : 'Bez nagrody ekonomicznej'}</strong><span>{run?.rewardReason || (run?.mode === 'training' ? 'Pojedynek treningowy.' : duelState.result === 'player_win' ? 'Nagroda oczekuje na potwierdzenie.' : 'Nagrody otrzymuje wyłącznie zwycięzca.')}</span></div></div>
              <div className="rdm-result__actions"><button type="button" className="rdm-button rdm-button--ghost" onClick={onClose}>Zamknij</button><button type="button" className="rdm-button rdm-button--gold" onClick={backToIntro}><RotateCcw size={17} /> Wróć do Kręgu</button></div>
            </div>
          )}
        </div>

        {showRules && <div className="rdm-sheet-backdrop" role="presentation"><section className="rdm-sheet" role="dialog" aria-modal="true" aria-labelledby="rdm-rules-title"><header><div><BookOpen size={21} /><h3 id="rdm-rules-title">Zasady Runicznego Kręgu</h3></div><button type="button" className="rdm-icon-button" onClick={() => setShowRules(false)} aria-label="Zamknij zasady"><X size={19} /></button></header><div className="rdm-sheet__content"><section><h4>Jak walczyć</h4><ol><li>Najpierw odczytaj dokładny zamiar rywala.</li><li>Wybierz jedną legalną runę; obie akcje rozliczą się równocześnie.</li><li>Pokonaj rywala przed końcem 10. tury albo wygraj werdykt HP i skupienia.</li></ol></section><section><h4>Kontry</h4><ul><li><strong>Thurisaz</strong> kontruje Nauthiz.</li><li><strong>Isa</strong> zatrzymuje Thurisaz, ale przegrywa z Nauthiz.</li><li><strong>Ansuz</strong> leczy i ładuje skupienie, lecz atak przerywa oddech.</li><li><strong>Tyr</strong> jest potężny, kosztuje 70 skupienia i działa raz.</li></ul></section><section><h4>Rezonans</h4><p>Rozegraj Thurisaz, Isa i Nauthiz w dowolnej kolejności. Rezonans zada 10 nieblokowalnych obrażeń i zwróci 10 skupienia.</p></section><section><h4>Próby i nagrody</h4><p>Masz 3 Próby dnia. Pierwszy ruch rezerwuje slot. Tylko pierwsze zwycięstwo dnia wypłaca nagrodę — maksymalnie 12 pkt Zakonu i 10 Skirnirów.</p></section></div></section></div>}

        {showCloseConfirm && <div className="rdm-sheet-backdrop" role="presentation"><section className="rdm-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rdm-confirm-title"><AlertTriangle size={28} /><h3 id="rdm-confirm-title">Przerwać pojedynek?</h3><p>{run?.mode === 'reward' && (duelState?.history?.length || 0) > 0 ? 'Rozpoczęta Próba dnia zostanie porzucona i zużyje jeden z trzech slotów.' : 'Bieżący pojedynek zostanie porzucony bez nagrody.'}</p><div><button type="button" className="rdm-button rdm-button--ghost" onClick={() => setShowCloseConfirm(false)}>Walczę dalej</button><button type="button" className="rdm-button rdm-button--danger" disabled={busy} onClick={confirmClose}>Porzuć pojedynek</button></div></section></div>}
      </section>
    </div>
  );
};
