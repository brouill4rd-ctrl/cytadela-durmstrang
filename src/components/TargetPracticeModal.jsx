import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair, Target, Trophy, X, Play, RotateCcw } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import './TargetPracticeModal.css';

// ── Game constants ────────────────────────────────────────────────────────────
const GAME_DURATION_S  = 25;
const MAX_TARGETS      = 4;
const SPAWN_MIN_MS     = 650;
const SPAWN_MAX_MS     = 950;
const MAX_SPAWN_TRIES  = 10;
const MIN_CENTER_DIST  = 70;   // px
const FIELD_MARGIN_PX  = 12;   // px from edge

const TARGET_TYPES = [
  { id: 'ice',   name: 'Lodowa Tarcza',   points: 10,  size: 48, lifetime: 1500, weight: 48, color: '#38bdf8', rune: 'ᛁ' },
  { id: 'crow',  name: 'Widmowy Kruk',    points: 25,  size: 46, lifetime: 1150, weight: 25, color: '#c084fc', rune: 'ᚾ' },
  { id: 'gold',  name: 'Złota Runa',      points: 50,  size: 44, lifetime: 900,  weight: 10, color: '#facc15', rune: 'ᛟ' },
  { id: 'skull', name: 'Czaszka-Pułapka', points: -30, size: 48, lifetime: 1350, weight: 17, color: '#ef4444', rune: '☠' },
];
const TOTAL_WEIGHT = TARGET_TYPES.reduce((s, t) => s + t.weight, 0);

function pickType() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const t of TARGET_TYPES) {
    if ((r -= t.weight) <= 0) return t;
  }
  return TARGET_TYPES[0];
}

function mkId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const TargetPracticeModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]           = useState('intro');     // intro | countdown | playing | result
  const [countNum, setCountNum]     = useState(3);
  const [timeLeft, setTimeLeft]     = useState(GAME_DURATION_S);
  const [score, setScore]           = useState(0);
  const [combo, setCombo]           = useState(1);
  const [targets, setTargets]       = useState([]);
  const [floaters, setFloaters]     = useState([]);
  const [result, setResult]         = useState(null);

  // ── Stable refs (timer callbacks read from these, not state closures) ─────
  const phaseRef        = useRef('intro');
  const scoreRef        = useRef(0);
  const comboRef        = useRef(1);
  const hitsRef         = useRef(0);
  const missesRef       = useRef(0);
  const trapsRef        = useRef(0);
  const maxComboRef     = useRef(1);
  const deadlineRef     = useRef(null);
  const startedAtRef    = useRef(null);
  const finishedRef     = useRef(false);
  const targetsRef      = useRef([]);   // mirrors targets state

  // ── Timer handles ─────────────────────────────────────────────────────────
  const tickRef         = useRef(null);
  const spawnRef        = useRef(null);
  const cdRef           = useRef(null);
  const tgtTimers       = useRef(new Map()); // uid → timeoutId

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const fieldRef        = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    clearInterval(tickRef.current);
    clearTimeout(spawnRef.current);
    clearInterval(cdRef.current);
    tgtTimers.current.forEach(id => clearTimeout(id));
    tgtTimers.current.clear();
  }, []);

  // Update both ref and state atomically (ref prevents timer stale-closure issues)
  const syncTargets = useCallback((updater) => {
    setTargets(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      targetsRef.current = next;
      return next;
    });
  }, []);

  // ── Full reset to intro ───────────────────────────────────────────────────
  const resetToIntro = useCallback(() => {
    clearAllTimers();
    phaseRef.current  = 'intro';
    finishedRef.current = false;
    scoreRef.current  = 0; comboRef.current = 1;
    hitsRef.current   = 0; missesRef.current = 0;
    trapsRef.current  = 0; maxComboRef.current = 1;
    deadlineRef.current = null;
    targetsRef.current  = [];
    setPhase('intro'); setCountNum(3);
    setTimeLeft(GAME_DURATION_S); setScore(0); setCombo(1);
    setTargets([]); setFloaters([]); setResult(null);
  }, [clearAllTimers]);

  // ── Open / close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) resetToIntro();
    else        clearAllTimers();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearAllTimers(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tab-visibility: recalculate remaining time when tab regains focus
  useEffect(() => {
    if (phase !== 'playing') return;
    const onVis = () => {
      if (!document.hidden && deadlineRef.current) {
        const rem = Math.ceil((deadlineRef.current - Date.now()) / 1000);
        setTimeLeft(rem > 0 ? rem : 0);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase]);

  // ── finishGame (one-shot, deadline-aware) ─────────────────────────────────
  const finishGame = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    clearAllTimers();
    targetsRef.current = [];
    phaseRef.current   = 'result';
    setTargets([]);
    setPhase('result');
    playSortingFanfare?.();

    const finalScore    = scoreRef.current;
    const finalHits     = hitsRef.current;
    const finalMisses   = missesRef.current;
    const finalTraps    = trapsRef.current;
    const finalMaxCombo = maxComboRef.current;
    const denom         = finalHits + finalMisses + finalTraps;
    const accuracy      = denom === 0 ? 0 : Math.round((finalHits / denom) * 100);
    const durationMs    = Date.now() - (startedAtRef.current || Date.now());

    setResult({ score: finalScore, hits: finalHits, misses: finalMisses,
                traps: finalTraps, maxCombo: finalMaxCombo, accuracy,
                pending: true, rewarded: null, housePoints: null,
                skirniry: null, serverMsg: null });

    if (!currentUser?.id) {
      setResult(r => ({ ...r, pending: false, serverMsg: 'Zaloguj się, by zdobywać nagrody.' }));
      return;
    }
    if (durationMs < 23_000) {
      setResult(r => ({ ...r, pending: false, serverMsg: 'Runda anulowana — brak nagrody.' }));
      return;
    }

    try {
      const res = await api.submitShootingRun({
        runId: mkId(), score: finalScore, hits: finalHits,
        misses: finalMisses, traps: finalTraps, maxCombo: finalMaxCombo,
        durationMs,
      });
      if (res.ok) {
        const { rewarded, housePoints, skirniry, message } = res.data;
        setResult(r => ({ ...r, pending: false, rewarded, housePoints: housePoints ?? 0,
                          skirniry: skirniry ?? 0, serverMsg: message ?? '' }));
        if (rewarded && addNotification) {
          addNotification(
            `Runiczna Strzelnica — Wynik: ${finalScore} pkt (+${housePoints} pkt Zakonu, +${skirniry} Sk.)`
          );
        }
      } else {
        setResult(r => ({ ...r, pending: false, rewarded: false,
                          serverMsg: `Błąd zapisu: ${res.error}` }));
      }
    } catch {
      setResult(r => ({ ...r, pending: false, rewarded: false,
                        serverMsg: 'Nie udało się połączyć z serwerem.' }));
    }
  }, [clearAllTimers, playSortingFanfare, currentUser, addNotification]);

  // ── Target spawner (recursive timeouts) ──────────────────────────────────
  const scheduleSpawn = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const delay = SPAWN_MIN_MS + Math.floor(Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS + 1));
    spawnRef.current = setTimeout(() => {
      if (phaseRef.current !== 'playing') return;

      const current = targetsRef.current;
      if (current.length < MAX_TARGETS) {
        const el = fieldRef.current;
        const fw = el?.offsetWidth  || 600;
        const fh = el?.offsetHeight || 380;
        const type = pickType();
        const half = type.size / 2;
        const xMin = FIELD_MARGIN_PX + half;
        const xMax = fw - FIELD_MARGIN_PX - half;
        const yMin = FIELD_MARGIN_PX + half;
        const yMax = fh - FIELD_MARGIN_PX - half;

        let pos = null;
        for (let i = 0; i < MAX_SPAWN_TRIES; i++) {
          const px = xMin + Math.random() * (xMax - xMin);
          const py = yMin + Math.random() * (yMax - yMin);
          const overlaps = current.some(t =>
            Math.hypot(t.px - px, t.py - py) < MIN_CENTER_DIST
          );
          if (!overlaps) { pos = { px, py }; break; }
        }

        if (pos) {
          const uid = mkId();
          const newTgt = { uid, ...type, px: pos.px, py: pos.py };

          // Schedule auto-removal after lifetime
          const removeId = setTimeout(() => {
            tgtTimers.current.delete(uid);
            syncTargets(prev => {
              if (!prev.some(t => t.uid === uid)) return prev;
              // Miss penalty for non-skull
              if (type.id !== 'skull') {
                comboRef.current = Math.max(1, comboRef.current - 1);
                setCombo(comboRef.current);
                missesRef.current += 1;
              }
              return prev.filter(t => t.uid !== uid);
            });
          }, type.lifetime);

          tgtTimers.current.set(uid, removeId);

          syncTargets(prev => {
            if (prev.length >= MAX_TARGETS) {
              // Lost race — cancel this target's timer
              clearTimeout(removeId);
              tgtTimers.current.delete(uid);
              return prev;
            }
            return [...prev, newTgt];
          });
        }
      }

      scheduleSpawn();
    }, delay);
  }, [syncTargets]);

  // ── startPlaying ─────────────────────────────────────────────────────────
  const startPlaying = useCallback(() => {
    // Reset all game counters
    scoreRef.current = 0;  comboRef.current = 1;
    hitsRef.current  = 0;  missesRef.current = 0;
    trapsRef.current = 0;  maxComboRef.current = 1;
    finishedRef.current = false;
    targetsRef.current  = [];

    setScore(0); setCombo(1); setTargets([]); setFloaters([]); setResult(null);
    setTimeLeft(GAME_DURATION_S);

    deadlineRef.current  = Date.now() + GAME_DURATION_S * 1000;
    startedAtRef.current = Date.now();
    phaseRef.current     = 'playing';
    setPhase('playing');

    // Deadline-based tick (250 ms granularity stays accurate after tab switch)
    tickRef.current = setInterval(() => {
      const rem = (deadlineRef.current - Date.now()) / 1000;
      if (rem <= 0) {
        setTimeLeft(0);
        finishGame();
      } else {
        setTimeLeft(Math.ceil(rem));
      }
    }, 250);

    scheduleSpawn();
  }, [finishGame, scheduleSpawn]);

  // ── startCountdown ────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearAllTimers();
    phaseRef.current = 'countdown';
    setPhase('countdown');
    setCountNum(3);
    let n = 3;
    cdRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(cdRef.current); startPlaying(); }
      else          setCountNum(n);
    }, 1000);
  }, [clearAllTimers, startPlaying]);

  // ── handleShoot ───────────────────────────────────────────────────────────
  const handleShoot = useCallback((tgt) => {
    if (phaseRef.current !== 'playing') return;

    // Synchronous ref update prevents double-click scoring
    const idx = targetsRef.current.findIndex(t => t.uid === tgt.uid);
    if (idx === -1) return;
    targetsRef.current = targetsRef.current.filter(t => t.uid !== tgt.uid);
    setTargets([...targetsRef.current]);

    // Cancel auto-remove timer
    const timerId = tgtTimers.current.get(tgt.uid);
    if (timerId) { clearTimeout(timerId); tgtTimers.current.delete(tgt.uid); }

    let text, color;

    if (tgt.id === 'skull') {
      playWandSwoosh?.();
      scoreRef.current = Math.max(0, scoreRef.current - 30);
      comboRef.current = 1;
      trapsRef.current += 1;
      setScore(scoreRef.current);
      setCombo(1);
      text  = '−30 • COMBO UTRACONE';
      color = '#ef4444';
    } else {
      playRuneChime?.();
      const earned = tgt.points * comboRef.current;
      scoreRef.current += earned;
      hitsRef.current  += 1;
      const prev = comboRef.current;
      comboRef.current = Math.min(comboRef.current + 1, 5);
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      text  = `+${earned}${prev > 1 ? ` • COMBO ×${prev}` : ''}`;
      color = tgt.color;
    }

    // Floater
    const fid = `${tgt.uid}-fx`;
    setFloaters(prev => [...prev, { id: fid, text, color, px: tgt.px, py: tgt.py }]);
    setTimeout(() => setFloaters(p => p.filter(f => f.id !== fid)), 1100);
  }, [playWandSwoosh, playRuneChime]);

  // ── handleClose ───────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    clearAllTimers();
    phaseRef.current = 'intro';
    onClose();
  }, [clearAllTimers, onClose]);

  if (!isOpen) return null;

  const isLowTime = timeLeft <= 5 && phase === 'playing';

  // Convert px target position to percentage for responsive rendering
  const fw = fieldRef.current?.offsetWidth  || 600;
  const fh = fieldRef.current?.offsetHeight || 380;

  return (
    <div className="tpm-overlay" role="dialog" aria-modal="true" aria-label="Runiczna Strzelnica">
      <div className="tpm-modal">

        {/* ── Header ── */}
        <div className="tpm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <Crosshair size={20} style={{ color: 'var(--gold-ancient, #c59f4e)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading, serif)',
                           fontSize: '1.1rem', lineHeight: 1.2 }}>
                Runiczna Strzelnica
              </h3>
              <span style={{ fontSize: '.72rem', color: 'var(--gold-ancient, #c59f4e)', letterSpacing: '.05em' }}>
                DZIEDZINIEC SZERMIERKI RÓŻDŻKOWEJ
              </span>
            </div>
          </div>
          <button className="tpm-close-btn" onClick={handleClose}
                  aria-label="Zamknij Runiczną Strzelnicę">
            <X size={20} />
          </button>
        </div>

        {/* ── Stats banner ── */}
        <div className="tpm-stats">
          <div className="tpm-stat">
            <span className="tpm-stat-label">Czas</span>
            <span className={`tpm-stat-value${isLowTime ? ' tpm-time-alert' : ''}`}
                  style={{ color: isLowTime ? '#ef4444' : '#fff' }}>
              {timeLeft}s
            </span>
          </div>
          <div className="tpm-stat">
            <span className="tpm-stat-label">Wynik</span>
            <span className="tpm-stat-value" style={{ color: 'var(--gold-ancient, #c59f4e)' }}>
              {score}
            </span>
          </div>
          <div className="tpm-stat">
            <span className="tpm-stat-label">Combo</span>
            <span className="tpm-stat-value" style={{ color: '#38bdf8' }}>×{combo}</span>
          </div>
        </div>

        {/* ── Playfield ── */}
        <div className="tpm-field" ref={fieldRef}>
          <div className="tpm-grid" aria-hidden="true" />

          {/* ── Intro ── */}
          {phase === 'intro' && (
            <div className="tpm-panel">
              <Target size={42} color="var(--gold-ancient, #c59f4e)" aria-hidden="true" />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.15rem',
                           fontFamily: 'var(--font-heading, serif)' }}>
                Runiczna Strzelnica
              </h4>

              <div className="tpm-legend" role="list" aria-label="Legenda celów">
                {TARGET_TYPES.map(t => (
                  <div key={t.id} className="tpm-legend-item" role="listitem">
                    <div className="tpm-legend-dot" style={{ background: t.color }} aria-hidden="true" />
                    <span style={{ color: t.color, fontWeight: 700 }} aria-hidden="true">{t.rune}</span>
                    <span>{t.name}</span>
                    <span style={{ color: t.points < 0 ? '#ef4444' : '#4ade80', fontWeight: 700 }}>
                      {t.points > 0 ? `+${t.points}` : t.points} pkt
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ margin: 0, color: '#9ca3af', fontSize: '.8rem', maxWidth: 400, lineHeight: 1.5 }}>
                Klikaj tarcze i runy, buduj combo (maks. ×5). Czaszki odejmują 30 pkt i resetują combo.
                Runda trwa 25 sekund. Nagroda za maks. 3 rundy dziennie.
              </p>

              <button className="tpm-btn-primary" onClick={startCountdown}
                      aria-label="Rozpocznij trening">
                <Play size={16} aria-hidden="true" /> Rozpocznij Trening (25s)
              </button>
            </div>
          )}

          {/* ── Countdown ── */}
          {phase === 'countdown' && (
            <div className="tpm-panel" aria-live="assertive">
              <div key={countNum} className="tpm-countdown-num" aria-label={`${countNum}`}>
                {countNum}
              </div>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '.85rem' }}>Przygotuj się…</p>
            </div>
          )}

          {/* ── Active targets ── */}
          {phase === 'playing' && targets.map(t => {
            const xPct = (t.px / fw) * 100;
            const yPct = (t.py / fh) * 100;
            const clickSize = Math.max(t.size, 44);
            return (
              <button
                key={t.uid}
                className="tpm-target"
                style={{
                  left: `${xPct}%`, top: `${yPct}%`,
                  width: clickSize, height: clickSize,
                  fontSize: t.size >= 46 ? '1.5rem' : '1.3rem',
                  background: `radial-gradient(circle, ${t.color}33 0%, rgba(0,0,0,.8) 100%)`,
                  border: `2px solid ${t.color}`,
                  '--tpmc': t.color,
                }}
                onClick={() => handleShoot(t)}
                aria-label={t.name}
              >
                {t.rune}
              </button>
            );
          })}

          {/* ── Floaters ── */}
          {floaters.map(f => (
            <div key={f.id} className="tpm-floater" aria-hidden="true"
                 style={{ left: `${(f.px / fw) * 100}%`, top: `${(f.py / fh) * 100}%`,
                          color: f.color }}>
              {f.text}
            </div>
          ))}

          {/* ── Result ── */}
          {phase === 'result' && result && (
            <div className="tpm-panel tpm-panel--result" aria-live="polite">
              <Trophy size={38} color="var(--gold-ancient, #c59f4e)" aria-hidden="true" />
              <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.25rem',
                           fontFamily: 'var(--font-heading, serif)' }}>
                KONIEC — {result.score} PKT
              </h3>

              <div className="tpm-result-stats" role="list" aria-label="Statystyki rundy">
                {[
                  { label: 'Trafienia', value: result.hits,     color: '#4ade80' },
                  { label: 'Pudła',     value: result.misses,   color: '#fb923c' },
                  { label: 'Pułapki',   value: result.traps,    color: '#ef4444' },
                  { label: 'Celność',   value: `${result.accuracy}%`, color: '#fff' },
                  { label: 'Max Combo', value: `×${result.maxCombo}`, color: '#38bdf8' },
                  { label: 'Wynik',     value: result.score,    color: 'var(--gold-ancient,#c59f4e)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="tpm-rs" role="listitem">
                    <div className="tpm-rs-label">{label}</div>
                    <div className="tpm-rs-value" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              {result.pending && (
                <div className="tpm-training-banner">Zapisywanie wyniku…</div>
              )}
              {!result.pending && result.rewarded && (
                <div className="tpm-reward-banner">
                  ᛟ +{result.housePoints} pkt Zakonu • +{result.skirniry} Skirnirów
                </div>
              )}
              {!result.pending && !result.rewarded && result.serverMsg && (
                <div className="tpm-training-banner">{result.serverMsg}</div>
              )}

              <button className="tpm-btn-primary" onClick={startCountdown}
                      aria-label="Zagraj ponownie">
                <RotateCcw size={15} aria-hidden="true" /> Zagraj ponownie
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
