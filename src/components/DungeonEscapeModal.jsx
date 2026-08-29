import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import { Lock, X, RotateCw, AlertTriangle, CheckCircle, Clock, Zap, HelpCircle, RotateCcw, Skull, Trophy } from 'lucide-react';

// ===================== STAŁE UI =====================
const MAX_HP = 3;
const MAX_HINTS = 2;
const REWARD_LABELS = {
  master:   { label: 'Mistrz Labiryntu', color: '#ffd700' },
  standard: { label: 'Zwycięstwo Standardowe', color: '#22c55e' },
  hint1:    { label: 'Zwycięstwo z Podpowiedzią', color: '#60a5fa' },
  hint2:    { label: 'Zwycięstwo z Dwiema Podpowiedziami', color: '#a78bfa' }
};

// ===================== POMOCNICZE =====================
function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDatePL(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw'
  });
}

// ===================== SUBKOMPONENTY =====================

function HpDots({ hp }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} aria-label={`Wytrzymałość: ${hp} z ${MAX_HP}`}>
      {Array.from({ length: MAX_HP }).map((_, i) => (
        <div key={i} style={{
          width: 18, height: 18, borderRadius: '50%',
          background: i < hp ? '#ef4444' : 'rgba(239,68,68,0.2)',
          border: '1.5px solid rgba(239,68,68,0.5)',
          transition: 'background 0.3s'
        }} aria-hidden="true" />
      ))}
      <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.2rem' }}>HP</span>
    </div>
  );
}

function StageBar({ stage }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }} role="progressbar" aria-valuenow={stage} aria-valuemin={1} aria-valuemax={3} aria-label={`Etap ${stage} z 3`}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: s < stage ? 'rgba(34,197,94,0.3)' : s === stage ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${s <= stage ? (s < stage ? '#22c55e' : 'var(--gold-ancient)') : 'rgba(255,255,255,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: s === stage ? '#000' : s < stage ? '#22c55e' : '#6b7280',
            transition: 'all 0.3s'
          }}>
            {s < stage ? '✓' : s}
          </div>
          {s < 3 && <div style={{ width: 24, height: 2, background: s < stage ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />}
        </div>
      ))}
    </div>
  );
}

function TimerDisplay({ remainingMs, expired }) {
  const danger = remainingMs < 60000;
  const warning = remainingMs < 120000;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.7rem',
      background: expired ? 'rgba(239,68,68,0.2)' : danger ? 'rgba(239,68,68,0.15)' : warning ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.3)',
      border: `1px solid ${expired || danger ? '#ef4444' : warning ? '#f59e0b' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 6
    }}>
      <Clock size={14} style={{ color: expired || danger ? '#ef4444' : warning ? '#f59e0b' : '#9ca3af' }} />
      <span style={{
        fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700,
        color: expired ? '#ef4444' : danger ? '#ef4444' : warning ? '#f59e0b' : '#e5e7eb',
        letterSpacing: '0.08em'
      }} aria-live="polite" aria-atomic="true">
        {formatTime(remainingMs)}
      </span>
    </div>
  );
}

// ===================== ETAP 1: Runiczne Pierścienie =====================
function Stage1Puzzle({ stageData, attempt, onSubmit, submitting }) {
  const [rings, setRings] = useState([0, 0, 0]);
  const { playWandSwoosh } = useSound();

  const runeSymbols = stageData?.runeSymbols || ['ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛉ', 'ᛞ'];
  const runeLexicon = stageData?.runeLexicon || {};
  const inscription = stageData?.inscription || '';

  const handleRotate = (idx, dir = 1) => {
    playWandSwoosh?.();
    setRings((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] + dir + runeSymbols.length) % runeSymbols.length;
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit({ r1: rings[0], r2: rings[1], r3: rings[2] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Runiczne Pierścienie Wrót
        </h4>
        <p style={{ margin: 0, color: '#d4c9a8', fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.5 }}>
          „{inscription}"
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {rings.map((pos, idx) => (
          <div key={idx} style={{
            background: 'rgba(15,20,28,0.85)',
            border: '2px solid var(--gold-ancient)',
            borderRadius: 8, padding: '1rem',
            width: 120, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pierścień {idx + 1}
            </span>
            <div style={{
              fontSize: '2rem', color: '#ffe599', lineHeight: 1,
              fontFamily: 'serif', userSelect: 'none'
            }} aria-label={`Pierścień ${idx + 1}: runa ${runeSymbols[pos]}`}>
              {runeSymbols[pos]}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                onClick={() => handleRotate(idx, -1)}
                disabled={submitting}
                aria-label={`Obróć pierścień ${idx + 1} w lewo`}
                style={{
                  background: 'rgba(197,159,78,0.15)', border: '1px solid var(--gold-ancient)',
                  color: '#ffe599', borderRadius: 4, padding: '0.3rem 0.5rem',
                  cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.7rem'
                }}>
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => handleRotate(idx, 1)}
                disabled={submitting}
                aria-label={`Obróć pierścień ${idx + 1} w prawo`}
                style={{
                  background: 'rgba(197,159,78,0.15)', border: '1px solid var(--gold-ancient)',
                  color: '#ffe599', borderRadius: 4, padding: '0.3rem 0.5rem',
                  cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.7rem'
                }}>
                <RotateCw size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Leksykon Run */}
      <details style={{ width: '100%', maxWidth: 480 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--gold-ancient)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          📜 Leksykon Pradawnych Run (częściowo zatarty)
        </summary>
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.2)',
          borderRadius: 6, padding: '0.75rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem'
        }}>
          {runeSymbols.map((sym) => (
            <div key={sym} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', color: '#ffe599', minWidth: 20, fontFamily: 'serif' }}>{sym}</span>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', lineHeight: 1.4 }}>
                {runeLexicon[sym] || '…'}
              </span>
            </div>
          ))}
        </div>
      </details>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
          color: '#000', border: 'none', borderRadius: 6,
          padding: '0.7rem 1.8rem', fontWeight: 700, fontSize: '0.9rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-heading)', opacity: submitting ? 0.6 : 1
        }}>
        {submitting ? 'Sprawdzam…' : 'Dociśnij Kamienne Pierścienie →'}
      </button>
    </div>
  );
}

// ===================== ETAP 2: Astrarium =====================
function Stage2Puzzle({ stageData, attempt, onSubmit, onUndo, submitting }) {
  const { playRuneChime } = useSound();
  const constellations = stageData?.constellations || [];
  const saga = stageData?.saga || '';
  const selected = stageData?.stage2SequenceSoFar || [];

  const handleClick = (id) => {
    if (selected.includes(id)) return;
    playRuneChime?.();
    onSubmit({ constellationId: id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#38bdf8', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Astrarium Nordyckich Gwiazd
        </h4>
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 6, padding: '0.75rem',
          fontSize: '0.85rem', color: '#d4c9a8', textAlign: 'left', lineHeight: 1.7,
          fontStyle: 'italic'
        }}>
          {saga.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.7rem',
        width: '100%', maxWidth: 440
      }}>
        {constellations.map((c) => {
          const selIdx = selected.indexOf(c.id);
          const isSelected = selIdx !== -1;
          return (
            <button
              key={c.id}
              onClick={() => handleClick(c.id)}
              disabled={submitting}
              aria-label={`${c.name}${isSelected ? ` (wybrano jako ${selIdx + 1})` : ''}`}
              aria-pressed={isSelected}
              style={{
                padding: '0.8rem 0.4rem',
                background: isSelected ? 'rgba(56,189,248,0.2)' : 'rgba(15,20,28,0.8)',
                border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: '#fff', fontWeight: 600,
                fontSize: '0.78rem', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                position: 'relative', transition: 'all 0.2s'
              }}>
              <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
              <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{c.name}</span>
              {isSelected && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#38bdf8', color: '#000',
                  borderRadius: '50%', width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700
                }}>{selIdx + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          Wybrano: {selected.length} / 4
        </span>
        {selected.length > 0 && (
          <button
            onClick={onUndo}
            disabled={submitting}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: '#9ca3af', borderRadius: 4, padding: '0.25rem 0.6rem',
              cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
            <RotateCcw size={12} /> Cofnij ostatni
          </button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        Błędny wybór odbiera punkt wytrzymałości i resetuje sekwencję.
      </p>
    </div>
  );
}

// ===================== ETAP 3: Alchemiczny Rygiel =====================
function Stage3Puzzle({ stageData, attempt, onSubmit, submitting }) {
  const { playRuneChime } = useSound();
  const [solvent, setSolvent] = useState(null);
  const [catalyst, setCatalyst] = useState(null);
  const reagents = stageData?.reagents || [];
  const inscription = stageData?.inscription || '';

  const handleSelect = (id) => {
    playRuneChime?.();
    if (!solvent) { setSolvent(id); return; }
    if (solvent === id) { setSolvent(null); return; }
    if (!catalyst) { setCatalyst(id); return; }
    if (catalyst === id) { setCatalyst(null); return; }
  };

  const handleRemoveSolvent = () => setSolvent(null);
  const handleRemoveCatalyst = () => setCatalyst(null);

  const handleSubmit = () => {
    onSubmit({ solvent, catalyst });
    setSolvent(null);
    setCatalyst(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#f59e0b', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Alchemiczny Rygiel
        </h4>
        <p style={{ margin: 0, color: '#d4c9a8', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>
          {inscription}
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem',
        width: '100%', maxWidth: 480
      }}>
        {reagents.map((r) => {
          const isSolvent = solvent === r.id;
          const isCatalyst = catalyst === r.id;
          const isSelected = isSolvent || isCatalyst;
          return (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              disabled={submitting}
              title={r.desc}
              aria-label={`${r.name}${isSolvent ? ' (wybrany jako rozpuszczalnik)' : isCatalyst ? ' (wybrany jako katalizator)' : ''}: ${r.desc}`}
              style={{
                padding: '0.6rem 0.4rem',
                background: isSolvent ? 'rgba(239,68,68,0.2)' : isCatalyst ? 'rgba(245,158,11,0.2)' : 'rgba(15,20,28,0.8)',
                border: `1.5px solid ${isSolvent ? '#ef4444' : isCatalyst ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.75rem', transition: 'all 0.2s'
              }}>
              <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
              <span style={{ textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>{r.name}</span>
              {isSolvent && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Rozpuszczalnik</span>}
              {isCatalyst && <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>Katalizator</span>}
            </button>
          );
        })}
      </div>

      {/* Wybrany skład */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Rozpuszczalnik:</span>
          {solvent ? (
            <span style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {reagents.find(r => r.id === solvent)?.name}
              <button onClick={handleRemoveSolvent} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: '0.7rem' }}>✕</button>
            </span>
          ) : <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>—</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Katalizator:</span>
          {catalyst ? (
            <span style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {reagents.find(r => r.id === catalyst)?.name}
              <button onClick={handleRemoveCatalyst} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: '0.7rem' }}>✕</button>
            </span>
          ) : <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>—</span>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!solvent || !catalyst || submitting}
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#000', border: 'none', borderRadius: 6,
          padding: '0.7rem 1.8rem', fontWeight: 700, fontSize: '0.9rem',
          cursor: (!solvent || !catalyst || submitting) ? 'not-allowed' : 'pointer',
          opacity: (!solvent || !catalyst || submitting) ? 0.4 : 1,
          fontFamily: 'var(--font-heading)'
        }}>
        {submitting ? 'Sprawdzam…' : 'Wlej do Zamka i Przełam Rygiel!'}
      </button>
    </div>
  );
}

// ===================== GŁÓWNY KOMPONENT =====================
export const DungeonEscapeModal = ({ isOpen, onClose }) => {
  const { currentUser, setUsers, addNotification } = useSchool();
  const { playGateThud, playSortingFanfare, playWandSwoosh } = useSound();

  // Stan ogólny
  const [screen, setScreen] = useState('loading'); // loading | entry | playing | success | failure
  const [status, setStatus] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [hintText, setHintText] = useState('');
  const [outcome, setOutcome] = useState(null); // { success, reward, reason }

  // Timer lokalny
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = useCallback((expiresAt) => {
    clearTimer();
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, ms));
    };
    update();
    timerRef.current = setInterval(update, 500);
  }, []);

  useEffect(() => () => clearTimer(), []);

  // ---- Ładowanie statusu ----
  const loadStatus = useCallback(async () => {
    if (!currentUser) {
      setScreen('entry');
      return;
    }
    setScreen('loading');
    const res = await api.getDungeonStatus();
    if (!res.ok) { setScreen('entry'); return; }
    setStatus(res.data);
    const active = res.data.activeAttempt;
    if (active) {
      setAttempt(active);
      startTimer(active.expiresAt);
      setScreen('playing');
    } else {
      setScreen('entry');
    }
  }, [currentUser, startTimer]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(''); setInfoMsg(''); setHintText('');
      loadStatus();
    } else {
      clearTimer();
    }
  }, [isOpen, loadStatus]);

  if (!isOpen) return null;

  // ---- Handlers ----
  const handleStart = async () => {
    setSubmitting(true);
    setErrorMsg('');
    const res = await api.startDungeon();
    setSubmitting(false);
    if (!res.ok) { setErrorMsg(res.error || 'Nie udało się rozpocząć.'); return; }
    const att = res.data.attempt;
    setAttempt(att);
    startTimer(att.expiresAt);
    await loadStatus();
    setScreen('playing');
  };

  const handleSubmitAnswer = async (answer) => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    setErrorMsg(''); setInfoMsg(''); setHintText('');

    const res = await api.submitDungeonAnswer(attempt.id, answer);
    setSubmitting(false);

    if (!res.ok) {
      if (res.data?.outcome === 'timeout') {
        clearTimer();
        setOutcome({ success: false, reason: 'timeout' });
        setScreen('failure');
        return;
      }
      if (res.data?.outcome === 'failed') {
        clearTimer();
        setOutcome({ success: false, reason: res.data.reason || 'hp_depleted' });
        setScreen('failure');
        return;
      }
      setErrorMsg(res.error || 'Błąd serwera.');
      return;
    }

    const d = res.data;

    if (d.outcome === 'timeout') {
      clearTimer();
      setOutcome({ success: false, reason: 'timeout' });
      setScreen('failure');
      return;
    }
    if (d.outcome === 'failed') {
      clearTimer();
      setOutcome({ success: false, reason: d.reason || 'hp_depleted' });
      setScreen('failure');
      return;
    }
    if (d.outcome === 'completed') {
      clearTimer();
      playSortingFanfare?.(); playGateThud?.();
      if (d.user && setUsers) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? d.user : u));
      }
      setOutcome({ success: true, reward: d.reward, trainingMode: d.trainingMode });
      setScreen('success');
      return;
    }

    // Częściowy sukces lub błąd
    if (d.correct === false) {
      playWandSwoosh?.();
      setErrorMsg(d.message || 'Błędna odpowiedź.');
    } else {
      setInfoMsg('✓ Poprawnie!');
    }

    if (d.attempt) {
      setAttempt(d.attempt);
      startTimer(d.attempt.expiresAt);
    }
  };

  const handleUndo = async () => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    const res = await api.submitDungeonAnswer(attempt.id, { undo: true });
    setSubmitting(false);
    if (res.ok && res.data.attempt) {
      setAttempt(res.data.attempt);
    }
  };

  const handleHint = async () => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    setHintText('');
    const res = await api.getDungeonHint(attempt.id);
    setSubmitting(false);
    if (!res.ok) {
      if (res.data?.outcome === 'timeout') {
        clearTimer();
        setOutcome({ success: false, reason: 'timeout' });
        setScreen('failure');
        return;
      }
      setErrorMsg(res.error);
      return;
    }
    setHintText(res.data.hint);
    if (res.data.attempt) {
      setAttempt(res.data.attempt);
      startTimer(res.data.attempt.expiresAt);
    }
  };

  const handleAbandon = async () => {
    if (!attempt) return;
    await api.abandonDungeon(attempt.id);
    clearTimer();
    setAttempt(null);
    await loadStatus();
    setScreen('entry');
  };

  const handleClose = () => {
    // Timer dalej biegnie, ostrzeżenie pokazywane w nagłówku
    onClose();
  };

  // ===================== RENDER =====================

  const isStudent = currentUser?.role === 'student';

  const renderEntry = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Zasady */}
      <div style={{
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(197,159,78,0.2)',
        borderRadius: 8, padding: '1.2rem'
      }}>
        <h4 style={{ margin: '0 0 0.7rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
          Zasady Labiryntu
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.7 }}>
          <li>Trzy etapy zagadek — Pierścienie, Astrarium, Rygiel Alchemiczny.</li>
          <li>8 minut na całe podejście. Czas biegnie nawet po zamknięciu okna.</li>
          <li>3 punkty wytrzymałości — każdy błąd kosztuje 1 HP.</li>
          <li>Do 2 podpowiedzi (każda skraca czas o 45 sekund).</li>
          <li>Maksymalnie 2 podejścia na dobę. Limit resetuje się o północy (czas warszawski).</li>
          <li>Nagroda ekonomiczna — tylko za pierwsze ukończenie w tygodniu.</li>
        </ul>
      </div>

      {/* Status dzienny i tygodniowy */}
      {status && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 140,
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '0.75rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Podejścia dzisiaj</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: status.dailyAttemptsUsed >= 2 ? '#ef4444' : '#22c55e' }}>
              {status.dailyAttemptsUsed} / {status.dailyLimit}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.2rem' }}>
              Reset: {formatDatePL(status.dailyResetAt)}
            </div>
          </div>
          <div style={{
            flex: 1, minWidth: 140,
            background: status.weeklyRewardAvailable ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${status.weeklyRewardAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8, padding: '0.75rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.3rem' }}>Nagroda tygodniowa</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: status.weeklyRewardAvailable ? '#22c55e' : '#6b7280' }}>
              {status.weeklyRewardAvailable ? '✦ Dostępna' : '✓ Odebrana'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.2rem' }}>
              Reset: {formatDatePL(status.weeklyResetAt)}
            </div>
          </div>
        </div>
      )}

      {!currentUser && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8, padding: '0.8rem', color: '#fbbf24', fontSize: '0.85rem', textAlign: 'center'
        }}>
          Zaloguj się, aby rozpocząć oficjalne podejście.
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6, padding: '0.6rem 0.8rem', color: '#fca5a5', fontSize: '0.85rem'
        }} role="alert">{errorMsg}</div>
      )}

      <button
        onClick={handleStart}
        disabled={submitting || !currentUser || (status && status.dailyAttemptsUsed >= status.dailyLimit)}
        style={{
          background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
          color: '#000', border: 'none', borderRadius: 6,
          padding: '0.8rem 1.8rem', fontWeight: 700, fontSize: '0.95rem',
          cursor: (submitting || !currentUser || (status && status.dailyAttemptsUsed >= status.dailyLimit)) ? 'not-allowed' : 'pointer',
          opacity: (submitting || !currentUser || (status && status.dailyAttemptsUsed >= status.dailyLimit)) ? 0.4 : 1,
          fontFamily: 'var(--font-heading)', alignSelf: 'center'
        }}>
        {submitting ? 'Otwieranie wrót…' : 'Wejdź do Labiryntu →'}
      </button>
    </div>
  );

  const renderPlaying = () => {
    if (!attempt) return null;
    const { stage, hp, hintsUsed, stageData } = attempt;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* HUD */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', flexWrap: 'wrap',
          padding: '0.6rem 0.8rem',
          background: 'rgba(0,0,0,0.4)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <StageBar stage={stage} />
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <HpDots hp={hp} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} style={{ color: '#9ca3af' }} />
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{hintsUsed}/{MAX_HINTS} podpowiedzi</span>
            </div>
            <TimerDisplay remainingMs={remainingMs} expired={remainingMs <= 0} />
          </div>
        </div>

        {/* Tryb treningowy info */}
        {status && !status.weeklyRewardAvailable && (
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6, padding: '0.5rem 0.8rem', fontSize: '0.78rem', color: '#fbbf24', textAlign: 'center'
          }}>
            Tryb treningowy — nagroda tygodniowa została już odebrana
          </div>
        )}

        {/* Komunikaty */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, padding: '0.5rem 0.8rem', color: '#fca5a5', fontSize: '0.82rem'
          }} role="alert" aria-live="assertive">{errorMsg}</div>
        )}
        {infoMsg && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 6, padding: '0.5rem 0.8rem', color: '#86efac', fontSize: '0.82rem'
          }} role="status" aria-live="polite">{infoMsg}</div>
        )}
        {hintText && (
          <div style={{
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 6, padding: '0.6rem 0.8rem', color: '#c4b5fd', fontSize: '0.82rem'
          }} role="status">
            <strong style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Podpowiedź
            </strong>
            {hintText}
          </div>
        )}

        {/* Zagadka */}
        <div style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(197,159,78,0.15)',
          borderRadius: 8, padding: '1.2rem'
        }}>
          {stage === 1 && (
            <Stage1Puzzle stageData={stageData} attempt={attempt} onSubmit={handleSubmitAnswer} submitting={submitting} />
          )}
          {stage === 2 && (
            <Stage2Puzzle stageData={stageData} attempt={attempt} onSubmit={handleSubmitAnswer} onUndo={handleUndo} submitting={submitting} />
          )}
          {stage === 3 && (
            <Stage3Puzzle stageData={stageData} attempt={attempt} onSubmit={handleSubmitAnswer} submitting={submitting} />
          )}
        </div>

        {/* Podpowiedź i porzucenie */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={handleHint}
            disabled={submitting || hintsUsed >= MAX_HINTS}
            style={{
              background: 'transparent', border: '1px solid rgba(139,92,246,0.4)',
              color: hintsUsed >= MAX_HINTS ? '#4b5563' : '#c4b5fd',
              borderRadius: 6, padding: '0.45rem 0.9rem', cursor: (submitting || hintsUsed >= MAX_HINTS) ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
            <HelpCircle size={13} />
            {hintsUsed >= MAX_HINTS ? 'Brak podpowiedzi' : `Podpowiedź (−45s) [${MAX_HINTS - hintsUsed} pozostałe]`}
          </button>
          <button
            onClick={handleAbandon}
            disabled={submitting}
            style={{
              background: 'transparent', border: '1px solid rgba(239,68,68,0.25)',
              color: '#6b7280', borderRadius: 6, padding: '0.35rem 0.7rem',
              cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.72rem'
            }}>
            Porzuć podejście
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.7rem', color: '#4b5563', textAlign: 'center' }}>
          ⚠ Zamknięcie okna nie zatrzymuje czasu. Możesz wrócić i wznowić tę próbę.
        </p>
      </div>
    );
  };

  const renderSuccess = () => {
    const r = outcome?.reward;
    const tierInfo = r ? REWARD_LABELS[r.tier] : null;

    return (
      <div style={{
        background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e',
        borderRadius: 10, padding: '2rem', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center'
      }}>
        <span style={{ fontSize: '3rem' }}>🗝️</span>
        <h3 style={{ margin: 0, color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
          WROTA ROZWARTE — LABIRYNT POKONANY!
        </h3>
        <p style={{ color: '#d1d5db', fontSize: '0.9rem', maxWidth: 480 }}>
          Twoja błyskotliwość i znajomość run, konstelacji oraz alchemii pozwoliły przejść przez wszystkie trzy zagadki Labiryntu Tajemnic.
        </p>

        {r && (
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 360
          }}>
            <div style={{ color: tierInfo?.color || '#ffd700', fontWeight: 700, fontSize: '1rem' }}>
              ✦ {tierInfo?.label || 'Zwycięstwo'}
            </div>
            {r.points > 0 && (
              <div style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>
                +{r.points} {isStudent ? 'Punktów Zakonu' : 'punktów osobistych'} &nbsp;·&nbsp; +{r.skirnirs} Skirnirów
              </div>
            )}
            {r.artifactGranted && (
              <div style={{ color: '#ffd700', fontSize: '0.85rem' }}>
                🗝️ Zdobyto: Złoty Klucz Pradawnych (artefakt legendarny)
              </div>
            )}
          </div>
        )}
        {outcome?.trainingMode && !r && (
          <div style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
            Tryb treningowy — nagroda tygodniowa została już wcześniej odebrana.
          </div>
        )}

        <button
          onClick={() => { setScreen('entry'); setOutcome(null); loadStatus(); }}
          style={{
            background: 'var(--gold-ancient)', color: '#000', border: 'none',
            borderRadius: 6, padding: '0.6rem 1.4rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-heading)'
          }}>
          Powrót do Wrót Labiryntu
        </button>
      </div>
    );
  };

  const renderFailure = () => {
    const reason = outcome?.reason;
    const reasonLabel = reason === 'timeout' ? 'Upływ czasu 8 minut' : reason === 'hp_depleted' ? 'Wyczerpanie punktów wytrzymałości' : 'Podejście zakończone porażką';
    return (
      <div style={{
        background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)',
        borderRadius: 10, padding: '2rem', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center'
      }}>
        <Skull size={48} style={{ color: '#ef4444' }} />
        <h3 style={{ margin: 0, color: '#f87171', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
          LABIRYNT POCHŁONĄŁ CIĘ W MROKU
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: 420 }}>
          Pradawne zamknięcia się nie otworzyły. {reasonLabel}. Podejście zakończone porażką — bez nagrody.
        </p>
        <button
          onClick={() => { setScreen('entry'); setOutcome(null); loadStatus(); }}
          style={{
            background: 'rgba(239,68,68,0.2)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6,
            padding: '0.6rem 1.4rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-heading)'
          }}>
          Powrót do Wrót Labiryntu
        </button>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Labirynt Tajemnic — Komnata Zagadek"
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(3,5,8,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}>
      <div style={{
        background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
        border: '2px solid var(--gold-ancient)',
        boxShadow: '0 12px 60px rgba(0,0,0,0.95), 0 0 30px rgba(197,159,78,0.3)',
        borderRadius: 12, width: '100%', maxWidth: 800,
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        {/* Nagłówek */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(197,159,78,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.45)', position: 'sticky', top: 0, zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={20} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                Labirynt Tajemnic
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', letterSpacing: '0.06em' }}>
                KOMNATA ZAGADEK W PODZIEMIACH
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            {screen === 'playing' && (
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                Czas biegnie po zamknięciu
              </span>
            )}
            <button
              onClick={handleClose}
              aria-label="Zamknij modal"
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Zawartość */}
        <div style={{ padding: '1.6rem' }}>
          {screen === 'loading' && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
              Otwieranie wrót Labiryntu…
            </div>
          )}
          {screen === 'entry' && renderEntry()}
          {screen === 'playing' && renderPlaying()}
          {screen === 'success' && renderSuccess()}
          {screen === 'failure' && renderFailure()}
        </div>
      </div>
    </div>
  );
};
