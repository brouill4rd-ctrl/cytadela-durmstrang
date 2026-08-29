import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  CheckCircle,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
  X
} from 'lucide-react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  ICE_FISHING_BAITS,
  ICE_FISHING_CASTS,
  ICE_FISHING_RARITY_COLORS,
  ICE_FISHING_RARITY_LABELS,
  evaluateLocalFishingCast
} from '../data/iceFishingData';
import './IceFishingModal.css';

const BITE_WINDOW_MS = 1300;
const REEL_PASS_MS = 1600;

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function emptyLocalSession(id) {
  return {
    id,
    mode: 'training',
    status: 'in_progress',
    score: 0,
    castsCompleted: 0,
    catchesCount: 0,
    escapesCount: 0,
    perfectHooks: 0,
    perfectReels: 0,
    casts: [],
    remote: false,
    startedAt: new Date().toISOString()
  };
}

function gradeLabel(grade) {
  if (grade === 'perfect') return 'Perfekcyjnie';
  if (grade === 'good') return 'Dobrze';
  if (grade === 'late') return 'Późno';
  return 'Pudło';
}

function phaseIsActive(phase) {
  return ['countdown', 'bait_select', 'casting', 'waiting', 'bite', 'reeling', 'resolving', 'cast_error', 'cast_result'].includes(phase);
}

export const IceFishingModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification, applyServerUserSnapshot } = useSchool();
  const { playWandSwoosh, playRuneChime, playCoinSound, playSortingFanfare } = useSound();

  const [phase, setPhase] = useState('intro');
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState(null);
  const [session, setSession] = useState(null);
  const [selectedBait, setSelectedBait] = useState(null);
  const [currentCast, setCurrentCast] = useState(null);
  const [castResult, setCastResult] = useState(null);
  const [expeditionResult, setExpeditionResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [biteTimeLeft, setBiteTimeLeft] = useState(BITE_WINDOW_MS);
  const [reelRound, setReelRound] = useState(0);
  const [reelGrades, setReelGrades] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(0);
  const [zone, setZone] = useState({ start: 34, width: 32 });
  const [reelFeedback, setReelFeedback] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);

  const phaseRef = useRef('intro');
  const sessionRef = useRef(null);
  const currentCastRef = useRef(null);
  const timeoutRef = useRef(null);
  const auxiliaryTimeoutRef = useRef(null);
  const rafRef = useRef(null);
  const actionLockedRef = useRef(false);
  const reactionStartedRef = useRef(0);
  const reactionMsRef = useRef(1300);
  const reelGradesRef = useRef([]);
  const markerRef = useRef(0);
  const zoneRef = useRef({ start: 34, width: 32 });
  const settleReelRef = useRef(null);
  const finishCastRef = useRef(null);
  const actionButtonRef = useRef(null);

  const setGamePhase = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const syncSession = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const syncCurrentCast = useCallback((next) => {
    currentCastRef.current = next;
    setCurrentCast(next);
  }, []);

  const clearRuntime = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(auxiliaryTimeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timeoutRef.current = null;
    auxiliaryTimeoutRef.current = null;
    rafRef.current = null;
    actionLockedRef.current = false;
  }, []);

  const loadStatus = useCallback(async () => {
    if (!currentUser?.id) {
      setStatus({
        rewardSlotsUsed: 0,
        rewardSlotsRemaining: 0,
        dailyLimit: 3,
        activeSession: null,
        stats: { personalBest: 0, totalCatches: 0, bestLoot: null },
        history: []
      });
      setServerOffline(false);
      return;
    }

    setStatusLoading(true);
    const response = await api.getFishingStatus();
    setStatusLoading(false);
    if (response.ok) {
      setStatus(response.data);
      setServerOffline(false);
      if (response.data.activeSession) syncSession(response.data.activeSession);
    } else if (response.offline) {
      setServerOffline(true);
      setError('Serwer nagród jest niedostępny. Możesz rozegrać bezpieczny trening bez wypłaty.');
    } else {
      setError(response.error || 'Nie udało się odczytać dziennika połowów.');
    }
  }, [currentUser?.id, syncSession]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(Boolean(media?.matches));
    update();
    media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearRuntime();
      return undefined;
    }
    clearRuntime();
    setGamePhase('intro');
    setCountdown(3);
    setSelectedBait(null);
    syncCurrentCast(null);
    setCastResult(null);
    setExpeditionResult(null);
    setConfirmClose(false);
    setError('');
    syncSession(null);
    loadStatus();
    return clearRuntime;
  }, [isOpen, currentUser?.id, clearRuntime, loadStatus, setGamePhase, syncCurrentCast, syncSession]);

  useEffect(() => {
    if (phase === 'bite' || phase === 'reeling') actionButtonRef.current?.focus();
  }, [phase, reelRound]);

  const baitUses = useMemo(() => {
    const uses = {};
    (session?.casts || []).forEach((cast) => {
      uses[cast.baitId] = (uses[cast.baitId] || 0) + 1;
    });
    return uses;
  }, [session?.casts]);

  const beginCountdown = useCallback(() => {
    clearRuntime();
    setCountdown(3);
    setGamePhase('countdown');
    let value = 3;
    const tick = () => {
      value -= 1;
      if (value <= 0) {
        setSelectedBait(null);
        setGamePhase('bait_select');
        return;
      }
      setCountdown(value);
      timeoutRef.current = setTimeout(tick, 750);
    };
    timeoutRef.current = setTimeout(tick, 750);
  }, [clearRuntime, setGamePhase]);

  const startSession = useCallback(async () => {
    setBusy(true);
    setError('');
    setExpeditionResult(null);
    const runId = makeId('fishing');
    const canUseServer = Boolean(currentUser?.id && !serverOffline);
    const mode = canUseServer && (status?.rewardSlotsRemaining || 0) > 0 ? 'reward' : 'training';

    if (!canUseServer) {
      syncSession(emptyLocalSession(runId));
      setBusy(false);
      beginCountdown();
      return;
    }

    let response = await api.startFishingSession(runId, mode);
    if (!response.ok && response.status === 429) {
      response = await api.startFishingSession(makeId('fishing-training'), 'training');
    }
    setBusy(false);

    if (response.ok) {
      syncSession(response.data.session);
      setStatus((previous) => ({ ...previous, ...response.data, activeSession: response.data.session }));
      beginCountdown();
      return;
    }
    if (response.data?.activeSession) {
      syncSession(response.data.activeSession);
      setError('Masz już rozpoczętą wyprawę. Wznów ją zamiast rezerwować nowy slot.');
      return;
    }
    if (response.offline) {
      setServerOffline(true);
      syncSession(emptyLocalSession(runId));
      setError('Utracono połączenie — uruchomiono trening bez nagrody.');
      beginCountdown();
      return;
    }
    setError(response.error || 'Nie udało się rozpocząć wyprawy.');
  }, [beginCountdown, currentUser?.id, serverOffline, status?.rewardSlotsRemaining, syncSession]);

  const completeExpedition = useCallback(async () => {
    const active = sessionRef.current;
    if (!active) return;
    clearRuntime();
    setBusy(true);
    setError('');

    if (active.remote === false) {
      const localResult = {
        session: { ...active, status: 'completed', rewardPoints: 0, rewardSkirnirs: 0, rewardLoot: null },
        housePoints: 0,
        skirnirs: 0,
        rewardLoot: null,
        rewarded: false,
        message: 'Wyprawa treningowa ukończona — wynik nie wpływa na ekonomię.'
      };
      syncSession(localResult.session);
      setExpeditionResult(localResult);
      setBusy(false);
      setGamePhase('expedition_result');
      playSortingFanfare?.();
      return;
    }

    const response = await api.completeFishingSession(active.id);
    setBusy(false);
    if (!response.ok) {
      setError(response.error || 'Nie udało się zapisać wyniku wyprawy.');
      setExpeditionResult({ session: active, message: response.error, saveFailed: true });
      setGamePhase('expedition_result');
      return;
    }

    syncSession(response.data.session);
    setExpeditionResult(response.data);
    if (response.data.status) setStatus(response.data.status);
    if (response.data.user) applyServerUserSnapshot?.(response.data.user);
    if (response.data.rewarded) {
      addNotification?.(`🎣 ${response.data.message}`, 'success');
      playCoinSound?.();
    } else {
      playSortingFanfare?.();
    }
    setGamePhase('expedition_result');
  }, [addNotification, applyServerUserSnapshot, clearRuntime, playCoinSound, playSortingFanfare, setGamePhase, syncSession]);

  const finishCast = useCallback(async (reactionMs, grades) => {
    const activeSession = sessionRef.current;
    const activeCast = currentCastRef.current;
    if (!activeSession || !activeCast) return;
    clearRuntime();
    setGamePhase('resolving');
    setBusy(true);
    setError('');
    reactionMsRef.current = reactionMs;
    reelGradesRef.current = grades;

    if (activeSession.remote === false) {
      const evaluated = {
        ...evaluateLocalFishingCast({ reactionMs, reelGrades: grades, baitId: activeCast.baitId }),
        id: activeCast.id,
        castIndex: activeCast.castIndex
      };
      const casts = [...(activeSession.casts || []), evaluated];
      const next = {
        ...activeSession,
        score: casts.reduce((sum, cast) => sum + cast.castScore, 0),
        castsCompleted: casts.length,
        catchesCount: casts.filter((cast) => cast.caught).length,
        escapesCount: casts.filter((cast) => !cast.caught).length,
        perfectHooks: casts.filter((cast) => cast.hookGrade === 'perfect').length,
        perfectReels: casts.reduce((sum, cast) => sum + cast.reelGrades.filter((grade) => grade === 'perfect').length, 0),
        casts
      };
      syncSession(next);
      setCastResult(evaluated);
      setBusy(false);
      setGamePhase('cast_result');
      evaluated.caught ? playRuneChime?.() : playWandSwoosh?.();
      return;
    }

    const response = await api.completeFishingCast(activeSession.id, activeCast.id, { reactionMs, reelGrades: grades });
    setBusy(false);
    if (!response.ok) {
      setError(response.error || 'Nie udało się rozliczyć rzutu.');
      setGamePhase('cast_error');
      return;
    }
    syncSession(response.data.session);
    setCastResult(response.data.cast);
    setGamePhase('cast_result');
    response.data.cast.caught ? playRuneChime?.() : playWandSwoosh?.();
  }, [clearRuntime, playRuneChime, playWandSwoosh, setGamePhase, syncSession]);

  finishCastRef.current = finishCast;

  const runReelRound = useCallback((round, previousGrades) => {
    clearRuntime();
    actionLockedRef.current = false;
    const bait = ICE_FISHING_BAITS.find((entry) => entry.id === currentCastRef.current?.baitId) || ICE_FISHING_BAITS[0];
    const width = bait.zoneWidth;
    const start = 4 + Math.random() * (92 - width);
    const nextZone = { start, width };
    zoneRef.current = nextZone;
    setZone(nextZone);
    setReelRound(round);
    setReelFeedback('');
    const startedAt = performance.now();
    const directionForward = round % 2 === 0;

    const frame = (now) => {
      const progress = Math.min(1, (now - startedAt) / REEL_PASS_MS);
      let position;
      if (reducedMotion) {
        const step = Math.min(4, Math.floor(progress * 5));
        position = (step / 4) * 100;
      } else {
        position = progress * 100;
      }
      if (!directionForward) position = 100 - position;
      markerRef.current = position;
      setMarkerPosition(position);
      if (progress < 1 && phaseRef.current === 'reeling') rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    timeoutRef.current = setTimeout(() => settleReelRef.current?.('miss', round, previousGrades), REEL_PASS_MS);
  }, [clearRuntime, reducedMotion]);

  const settleReelAttempt = useCallback((forcedGrade = null, round = reelRound, previousGrades = reelGradesRef.current) => {
    if (actionLockedRef.current || phaseRef.current !== 'reeling') return;
    actionLockedRef.current = true;
    clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let grade = forcedGrade;
    if (!grade) {
      const position = markerRef.current;
      const currentZone = zoneRef.current;
      const center = currentZone.start + currentZone.width / 2;
      const perfectHalf = currentZone.width * 0.35 / 2;
      if (Math.abs(position - center) <= perfectHalf) grade = 'perfect';
      else if (position >= currentZone.start && position <= currentZone.start + currentZone.width) grade = 'good';
      else grade = 'miss';
    }

    const nextGrades = [...previousGrades, grade];
    reelGradesRef.current = nextGrades;
    setReelGrades(nextGrades);
    setReelFeedback(grade === 'perfect' ? 'PERFEKCYJNIE +30' : grade === 'good' ? 'DOBRZE +20' : 'ŻYŁKA TRZESZCZY');
    grade === 'miss' ? playWandSwoosh?.() : playRuneChime?.();

    auxiliaryTimeoutRef.current = setTimeout(() => {
      if (round >= 2) finishCastRef.current?.(reactionMsRef.current, nextGrades);
      else {
        actionLockedRef.current = false;
        runReelRound(round + 1, nextGrades);
      }
    }, 250);
  }, [playRuneChime, playWandSwoosh, reelRound, runReelRound]);

  settleReelRef.current = settleReelAttempt;

  const beginReeling = useCallback((reactionMs) => {
    reactionMsRef.current = reactionMs;
    reelGradesRef.current = [];
    setReelGrades([]);
    setGamePhase('reeling');
    auxiliaryTimeoutRef.current = setTimeout(() => runReelRound(0, []), 60);
  }, [runReelRound, setGamePhase]);

  const beginBite = useCallback(() => {
    clearRuntime();
    actionLockedRef.current = false;
    reactionStartedRef.current = performance.now();
    setBiteTimeLeft(BITE_WINDOW_MS);
    setGamePhase('bite');
    playRuneChime?.();
    const deadline = performance.now() + BITE_WINDOW_MS;
    const frame = () => {
      const remaining = Math.max(0, deadline - performance.now());
      setBiteTimeLeft(remaining);
      if (remaining > 0 && phaseRef.current === 'bite') rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    timeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== 'bite') return;
      actionLockedRef.current = true;
      finishCastRef.current?.(BITE_WINDOW_MS, ['miss', 'miss', 'miss']);
    }, BITE_WINDOW_MS);
  }, [clearRuntime, playRuneChime, setGamePhase]);

  const handleHook = useCallback(() => {
    if (phaseRef.current !== 'bite' || actionLockedRef.current) return;
    actionLockedRef.current = true;
    const reaction = Math.max(0, Math.round(performance.now() - reactionStartedRef.current));
    clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (reaction >= BITE_WINDOW_MS) {
      finishCastRef.current?.(reaction, ['miss', 'miss', 'miss']);
      return;
    }
    playWandSwoosh?.();
    actionLockedRef.current = false;
    beginReeling(reaction);
  }, [beginReeling, playWandSwoosh]);

  const beginWaiting = useCallback(() => {
    setGamePhase('waiting');
    const delay = 2000 + Math.floor(Math.random() * 3001);
    timeoutRef.current = setTimeout(beginBite, delay);
  }, [beginBite, setGamePhase]);

  const startCast = useCallback(async () => {
    const active = sessionRef.current;
    if (!active || !selectedBait) return;
    const castIndex = active.castsCompleted || active.casts?.length || 0;
    const cast = { id: makeId('cast'), castIndex, baitId: selectedBait, status: 'started' };
    setBusy(true);
    setError('');

    if (active.remote !== false) {
      const response = await api.startFishingCast(active.id, { castId: cast.id, castIndex, baitId: selectedBait });
      setBusy(false);
      if (!response.ok) {
        setError(response.error || 'Nie udało się rozpocząć rzutu.');
        return;
      }
      syncCurrentCast({ ...response.data.cast, castIndex, baitId: selectedBait });
    } else {
      setBusy(false);
      syncCurrentCast(cast);
    }

    setCastResult(null);
    playWandSwoosh?.();
    setGamePhase('casting');
    timeoutRef.current = setTimeout(beginWaiting, 650);
  }, [beginWaiting, playWandSwoosh, selectedBait, setGamePhase, syncCurrentCast]);

  const nextCast = useCallback(() => {
    if ((sessionRef.current?.castsCompleted || 0) >= ICE_FISHING_CASTS) {
      completeExpedition();
      return;
    }
    syncCurrentCast(null);
    setCastResult(null);
    setSelectedBait(null);
    setGamePhase('bait_select');
  }, [completeExpedition, setGamePhase, syncCurrentCast]);

  const resumeSession = useCallback(() => {
    const active = sessionRef.current || status?.activeSession;
    if (!active) return;
    syncSession(active);
    if ((active.castsCompleted || 0) >= ICE_FISHING_CASTS) completeExpedition();
    else {
      setSelectedBait(null);
      setGamePhase('bait_select');
    }
  }, [completeExpedition, setGamePhase, status?.activeSession, syncSession]);

  const handleCloseRequest = useCallback(() => {
    if (phaseIsActive(phaseRef.current) && sessionRef.current?.status === 'in_progress') {
      setConfirmClose(true);
      return;
    }
    clearRuntime();
    onClose();
  }, [clearRuntime, onClose]);

  const confirmAndClose = useCallback(() => {
    clearRuntime();
    setConfirmClose(false);
    onClose();
  }, [clearRuntime, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (![' ', 'Enter'].includes(event.key)) return;
      if (phaseRef.current === 'bite') {
        event.preventDefault();
        handleHook();
      } else if (phaseRef.current === 'reeling') {
        event.preventDefault();
        settleReelRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleHook, isOpen]);

  useEffect(() => {
    if (!isOpen || !['bite', 'reeling'].includes(phase)) return undefined;
    const onVisibility = () => {
      if (!document.hidden) return;
      if (phaseRef.current === 'bite') finishCastRef.current?.(BITE_WINDOW_MS, ['miss', 'miss', 'miss']);
      else if (phaseRef.current === 'reeling') settleReelRef.current?.('miss');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const castsCompleted = session?.castsCompleted || 0;
  const currentNumber = Math.min(ICE_FISHING_CASTS, castsCompleted + 1);
  const score = session?.score || 0;
  const rewardMode = session?.mode === 'reward';
  const activeSession = status?.activeSession || (session?.status === 'in_progress' ? session : null);

  return (
    <div className="ice-fishing__overlay" role="dialog" aria-modal="true" aria-label="Połów w Zamarzniętym Fjordzie">
      <div className="ice-fishing__modal">
        <header className="ice-fishing__header">
          <div className="ice-fishing__title-wrap">
            <Anchor size={22} aria-hidden="true" />
            <div>
              <h3>Połów w Zamarzniętym Fjordzie • Przystań Drakkarów</h3>
              <p>ARKTYCZNY POŁÓW SKŁADNIKÓW &amp; ZATOPIONYCH SKARBÓW</p>
            </div>
          </div>
          <button className="ice-fishing__icon-btn" onClick={handleCloseRequest} aria-label="Zamknij połów"><X size={20} /></button>
        </header>

        {phase !== 'intro' && phase !== 'expedition_result' && (
          <div className="ice-fishing__stats" aria-label="Stan wyprawy">
            <div><span>Rzut</span><strong>{currentNumber}/{ICE_FISHING_CASTS}</strong></div>
            <div><span>Wynik</span><strong>{score}/680</strong></div>
            <div><span>Zdobycze</span><strong>{session?.catchesCount || 0}</strong></div>
            <div><span>Tryb</span><strong>{rewardMode ? 'Nagroda' : 'Trening'}</strong></div>
          </div>
        )}

        <main className="ice-fishing__content">
          {error && <div className="ice-fishing__notice ice-fishing__notice--error" role="alert"><AlertTriangle size={16} /><span>{error}</span></div>}

          {phase === 'intro' && (
            <section className="ice-fishing__intro">
              <div className="ice-fishing__intro-grid">
                <div>
                  <div className="ice-fishing__hole ice-fishing__hole--idle" aria-hidden="true"><span>ᛟ</span></div>
                  <h4>Cztery rzuty. Jedna wyprawa.</h4>
                  <ol className="ice-fishing__rules">
                    <li>Wybierz przynętę i zaczekaj na branie.</li>
                    <li>Zatnij w ciągu 1,3 sekundy.</li>
                    <li>Traf bezpieczną strefę w co najmniej 2 z 3 prób holowania.</li>
                    <li>Lepsza precyzja oznacza rzadszą zdobycz.</li>
                    <li>Nagrody przysługują za maksymalnie 3 wyprawy dziennie.</li>
                  </ol>
                </div>

                <aside className="ice-fishing__ledger">
                  <h4>Dziennik połowów</h4>
                  {statusLoading ? <p>Odczytywanie księgi przystani…</p> : (
                    <>
                      <div className="ice-fishing__ledger-grid">
                        <div><span>Dziś</span><strong>{status?.rewardSlotsUsed || 0}/{status?.dailyLimit || 3}</strong></div>
                        <div><span>Rekord</span><strong>{status?.stats?.personalBest || 0}/680</strong></div>
                        <div><span>Połowy</span><strong>{status?.stats?.totalCatches || 0}</strong></div>
                        <div><span>Najlepsza zdobycz</span><strong>{status?.stats?.bestLoot?.name || '—'}</strong></div>
                      </div>
                      {(status?.history || []).length > 0 && (
                        <div className="ice-fishing__history">
                          {status.history.slice(0, 5).map((entry) => (
                            <div key={entry.id}><span>{entry.dateKey || 'Wyprawa'} • {entry.mode === 'reward' ? 'nagroda' : 'trening'}</span><strong>{entry.score}/680</strong></div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </aside>
              </div>

              {serverOffline && <div className="ice-fishing__notice"><Clock size={16} /> Serwer jest niedostępny — dostępny jest tylko trening.</div>}
              {!currentUser?.id && <div className="ice-fishing__notice"><Clock size={16} /> Zaloguj się, aby rezerwować wyprawy nagradzane.</div>}

              <div className="ice-fishing__intro-actions">
                {activeSession && activeSession.status === 'in_progress' && (
                  <button className="ice-fishing__btn ice-fishing__btn--secondary" onClick={resumeSession} disabled={busy}><RotateCcw size={17} /> Wznów wyprawę ({activeSession.castsCompleted || 0}/4)</button>
                )}
                <button className="ice-fishing__btn ice-fishing__btn--primary" onClick={startSession} disabled={busy || statusLoading || Boolean(activeSession)}>
                  <Play size={17} />
                  {busy ? 'Otwieranie szlaku…' : currentUser?.id && !serverOffline && (status?.rewardSlotsRemaining || 0) > 0
                    ? `Rozpocznij wyprawę nagradzaną (${status.rewardSlotsRemaining}/3)` : 'Rozpocznij trening'}
                </button>
              </div>
            </section>
          )}

          {phase === 'countdown' && <section className="ice-fishing__center" aria-live="assertive"><div className="ice-fishing__countdown">{countdown}</div><h4>Przygotuj dłuto i wędkę…</h4></section>}

          {phase === 'bait_select' && (
            <section className="ice-fishing__game-panel">
              <div className="ice-fishing__section-heading"><div><span>RZUT {currentNumber} Z 4</span><h4>Wybierz przynętę</h4></div><p>Trudniejsza przynęta zwęża bezpieczną strefę, ale prowadzi do innej puli zdobyczy.</p></div>
              <div className="ice-fishing__baits" role="radiogroup" aria-label="Wybór przynęty">
                {ICE_FISHING_BAITS.map((bait) => {
                  const used = baitUses[bait.id] || 0;
                  const exhausted = used >= bait.maxUses;
                  const selected = selectedBait === bait.id;
                  return (
                    <button key={bait.id} type="button" role="radio" aria-checked={selected} className={`ice-fishing__bait${selected ? ' is-selected' : ''}`} style={{ '--bait-accent': bait.accent }} onClick={() => !exhausted && setSelectedBait(bait.id)} disabled={exhausted}>
                      <span className="ice-fishing__bait-icon">{bait.icon}</span><strong>{bait.name}</strong><small>{bait.short}</small><span>Strefa {bait.zoneWidth}% • {bait.id === 'ice_worm' ? 'bez limitu' : `${used}/${bait.maxUses}`}</span>
                    </button>
                  );
                })}
              </div>
              <button className="ice-fishing__btn ice-fishing__btn--primary" onClick={startCast} disabled={!selectedBait || busy}><Anchor size={17} /> {busy ? 'Zapisywanie rzutu…' : 'Wyrąb przerębel i zarzuć'}</button>
            </section>
          )}

          {['casting', 'waiting', 'bite'].includes(phase) && (
            <section className="ice-fishing__center">
              <div className={`ice-fishing__hole ice-fishing__hole--${phase}`}>
                {phase === 'casting' && <span className="ice-fishing__line">⌁</span>}
                {phase === 'waiting' && <><span className="ice-fishing__float">●</span><small>Cisza pod lodem…</small></>}
                {phase === 'bite' && <><span className="ice-fishing__bite">!</span><strong>BIERZE!</strong></>}
              </div>
              {phase === 'casting' && <h4>Zarzucasz żyłkę w lodową toń…</h4>}
              {phase === 'waiting' && <h4>Czekaj na drgnięcie spławika</h4>}
              {phase === 'bite' && <><div className="ice-fishing__bite-timer" aria-hidden="true"><span style={{ width: `${Math.max(0, biteTimeLeft / BITE_WINDOW_MS * 100)}%` }} /></div><button ref={actionButtonRef} className="ice-fishing__btn ice-fishing__btn--hook" onClick={handleHook}>⚡ ZATNIJ WĘDKĘ!</button><p className="ice-fishing__hint">Kliknij albo naciśnij Spację/Enter.</p></>}
            </section>
          )}

          {phase === 'reeling' && (
            <section className="ice-fishing__reeling">
              <div className="ice-fishing__section-heading"><div><span>HOLOWANIE {reelRound + 1}/3</span><h4>Utrzymaj naprężenie żyłki</h4></div><p>Traf wskaźnikiem w oznaczoną strefę. Potrzebujesz co najmniej dwóch celnych prób.</p></div>
              <div className="ice-fishing__tension-wrap">
                <div className="ice-fishing__tension" aria-label={`Próba holowania ${reelRound + 1} z 3`}><div className="ice-fishing__safe-zone" style={{ left: `${zone.start}%`, width: `${zone.width}%` }}><span /></div><div className="ice-fishing__marker" style={{ left: `${markerPosition}%` }} /></div>
                <div className="ice-fishing__grade-dots" aria-label="Wyniki prób">{[0, 1, 2].map((index) => <span key={index} data-grade={reelGrades[index] || 'pending'}>{reelGrades[index] ? gradeLabel(reelGrades[index]).slice(0, 1) : index + 1}</span>)}</div>
              </div>
              <div className="ice-fishing__feedback" aria-live="polite">{reelFeedback || 'Zatrzymaj wskaźnik w bezpiecznej strefie'}</div>
              <button ref={actionButtonRef} className="ice-fishing__btn ice-fishing__btn--reel" onClick={() => settleReelRef.current?.()}>ZWIŃ ŻYŁKĘ</button>
              <p className="ice-fishing__hint">Kliknij albo naciśnij Spację/Enter.</p>
            </section>
          )}

          {phase === 'resolving' && <section className="ice-fishing__center" aria-live="polite"><div className="ice-fishing__spinner" /><h4>Kwatermistrz zapisuje wynik rzutu…</h4></section>}

          {phase === 'cast_error' && (
            <section className="ice-fishing__center"><AlertTriangle size={38} color="#f87171" /><h4>Rzut czeka na zapis</h4><p>Nie rozpoczynaj kolejnego rzutu. Ponowienie użyje tego samego identyfikatora i nie naliczy wyniku dwa razy.</p><button className="ice-fishing__btn ice-fishing__btn--primary" onClick={() => finishCast(reactionMsRef.current, reelGradesRef.current)} disabled={busy}><RotateCcw size={17} /> Ponów zapis</button></section>
          )}

          {phase === 'cast_result' && castResult && (
            <section className="ice-fishing__cast-result" aria-live="polite">
              <div className={`ice-fishing__catch-card${castResult.caught ? ' is-caught' : ' is-escaped'}`} style={{ '--rarity-color': ICE_FISHING_RARITY_COLORS[castResult.rarity] || '#64748b' }}>
                <span className="ice-fishing__catch-icon">{castResult.loot?.icon || '≈'}</span><div><small>{castResult.caught ? `${ICE_FISHING_RARITY_LABELS[castResult.rarity] || ''} zdobycz` : 'RYBA ZERWAŁA ŻYŁKĘ'}</small><h4>{castResult.loot?.name || 'Pusta toń'}</h4><p>Rzut: <strong>{castResult.castScore}/170</strong> • Zacięcie: {gradeLabel(castResult.hookGrade)}</p></div>
              </div>
              <div className="ice-fishing__cast-breakdown"><div><span>Zacięcie</span><strong>+{castResult.hookPoints || 0}</strong></div>{(castResult.reelGrades || []).map((grade, index) => <div key={index}><span>Hol {index + 1}</span><strong>{grade === 'perfect' ? '+30' : grade === 'good' ? '+20' : '+0'}</strong></div>)}<div><span>Połów</span><strong>{castResult.caught ? '+40' : '+0'}</strong></div></div>
              <button className="ice-fishing__btn ice-fishing__btn--primary" onClick={nextCast}>{(session?.castsCompleted || 0) >= ICE_FISHING_CASTS ? 'Podsumuj wyprawę' : 'Następny rzut'} <ChevronRight size={17} /></button>
            </section>
          )}

          {phase === 'expedition_result' && expeditionResult && (
            <section className="ice-fishing__result">
              <CheckCircle size={42} color="#4ade80" /><span className="ice-fishing__eyebrow">WYPRAWA ZAKOŃCZONA</span><h4>{expeditionResult.session?.score || 0} / 680 punktów</h4><p className="ice-fishing__result-message">{expeditionResult.message}</p>
              <div className="ice-fishing__result-grid"><div><span>Zdobycze</span><strong>{expeditionResult.session?.catchesCount || 0}</strong></div><div><span>Ucieczki</span><strong>{expeditionResult.session?.escapesCount || 0}</strong></div><div><span>Perfekcyjne zacięcia</span><strong>{expeditionResult.session?.perfectHooks || 0}</strong></div><div><span>Perfekcyjne hole</span><strong>{expeditionResult.session?.perfectReels || 0}</strong></div><div><span>Punkty Zakonu</span><strong>+{expeditionResult.housePoints || 0}</strong></div><div><span>Skirniry</span><strong>+{expeditionResult.skirnirs || 0}</strong></div></div>
              {expeditionResult.rewardLoot && <div className="ice-fishing__reward-loot" style={{ '--rarity-color': ICE_FISHING_RARITY_COLORS[expeditionResult.rewardLoot.rarity] }}><span>{expeditionResult.rewardLoot.icon}</span><div><small>PRZEDMIOT W EKWIPUNKU</small><strong>{expeditionResult.rewardLoot.name}</strong></div></div>}
              <div className="ice-fishing__summary-casts">{(expeditionResult.session?.casts || []).map((cast) => <div key={cast.id}><span>Rzut {cast.castIndex + 1} • {ICE_FISHING_BAITS.find((bait) => bait.id === cast.baitId)?.name}</span><strong>{cast.loot?.name || 'Ucieczka'} — {cast.castScore}/170</strong></div>)}</div>
              <div className="ice-fishing__intro-actions">
                {expeditionResult.saveFailed ? <button className="ice-fishing__btn ice-fishing__btn--primary" onClick={completeExpedition} disabled={busy}><RotateCcw size={17} /> Ponów rozliczenie</button> : <button className="ice-fishing__btn ice-fishing__btn--primary" onClick={() => { syncSession(null); setExpeditionResult(null); setGamePhase('intro'); loadStatus(); }}><RotateCcw size={17} /> Wróć do przystani</button>}
                <button className="ice-fishing__btn ice-fishing__btn--secondary" onClick={handleCloseRequest}>Zamknij</button>
              </div>
            </section>
          )}
        </main>
      </div>

      {confirmClose && (
        <div className="ice-fishing__confirm" role="alertdialog" aria-modal="true" aria-labelledby="fishing-close-title"><div><AlertTriangle size={30} color="#fbbf24" /><h4 id="fishing-close-title">Przerwać teraz?</h4><p>Bieżący rzut zostanie uznany za nieudany, ale wyprawę możesz wznowić przez 15 minut. Zarezerwowany slot nagrody pozostanie wykorzystany.</p><div className="ice-fishing__intro-actions"><button className="ice-fishing__btn ice-fishing__btn--primary" onClick={() => setConfirmClose(false)}>Wróć do gry</button><button className="ice-fishing__btn ice-fishing__btn--secondary" onClick={confirmAndClose}>Zamknij i zachowaj wyprawę</button></div></div></div>
      )}
    </div>
  );
};
