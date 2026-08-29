import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Shield, Skull, Volume2, X } from 'lucide-react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import './BestiaryModal.css';

function makeId(prefix) {
  const r = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${r}`;
}

const BEAST_ICONS = {
  frost_drake: '❄️',
  shadow_wolf: '🌑',
  ice_jotun: '⛰️',
  kraken: '🌊'
};

const COUNTDOWN_FROM = 3;
const OBSERVE_TOTAL_MS = 9000;
const COUNTER_TOTAL_MS = 8000;

// ── BestiaryModal ─────────────────────────────────────────────────────────────

export const BestiaryModal = ({ isOpen, onClose }) => {
  const { currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  // ── Persistent refs to avoid stale closures ─────────────────────────────────
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const isMountedRef = useRef(true);
  const activeActionRef = useRef(false); // guard against Strict Mode double-fire

  // ── State ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('archive'); // 'archive' | 'expedition'
  const [selectedBeast, setSelectedBeast] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [discoveries, setDiscoveries] = useState([]);
  const [userStatus, setUserStatus] = useState(null);

  // expedition
  const [phase, setPhase] = useState('briefing'); // briefing | resume_prompt | countdown | observe | countermeasure | encounter_result | expedition_result
  const [session, setSession] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [currentEncData, setCurrentEncData] = useState(null);
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_FROM);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [encResult, setEncResult] = useState(null); // result of just-resolved encounter
  const [expResult, setExpResult] = useState(null); // final expedition result
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [identifyLocked, setIdentifyLocked] = useState(false);
  const [counterLocked, setCounterLocked] = useState(false);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (countdownRef.current) { clearTimeout(countdownRef.current); countdownRef.current = null; }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  // ── Load catalog and status on open ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function load() {
      const catRes = await api.getBestiaryCatalog();
      if (cancelled || !isMountedRef.current) return;
      if (catRes.ok) {
        setCatalog(catRes.data.beasts || []);
        setSelectedBeast(prev => prev || catRes.data.beasts?.[0] || null);
      }

      if (currentUser) {
        const stRes = await api.getBestiaryStatus();
        if (cancelled || !isMountedRef.current) return;
        if (stRes.ok) {
          setUserStatus(stRes.data);
          setDiscoveries(stRes.data.discoveries || []);
          if (stRes.data.activeSessionId) {
            setPhase('resume_prompt');
            setSession({ id: stRes.data.activeSessionId });
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isOpen, currentUser]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e) {
      if (e.key === 'Escape') {
        if (showAbortConfirm) {
          setShowAbortConfirm(false);
          return;
        }
        if (phase === 'observe' || phase === 'countermeasure') {
          setShowAbortConfirm(true);
        } else if (phase === 'briefing' || tab === 'archive') {
          onClose();
        }
        return;
      }

      if ((phase === 'observe' || phase === 'countermeasure') && !showAbortConfirm) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) {
          const opts = phase === 'observe'
            ? currentEncData?.identifyOptions
            : currentEncData?.counterOptions;
          if (opts && opts[n - 1]) {
            phase === 'observe'
              ? handleIdentify(opts[n - 1])
              : handleCountermeasure(opts[n - 1]?.id || opts[n - 1]);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, phase, tab, showAbortConfirm, currentEncData]); // eslint-disable-line

  // ── Derive current encounter data from session + encounters ─────────────────
  useEffect(() => {
    if (!session || !encounters.length) { setCurrentEncData(null); return; }
    const idx = session.currentEncounter ?? 0;
    const enc = encounters.find(e => e.encounterIndex === idx) || null;
    setCurrentEncData(enc);
  }, [session, encounters]);

  // ── Observe timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'observe' || !currentEncData?.observeDeadlineAt) return;
    clearTimers();

    const deadline = new Date(currentEncData.observeDeadlineAt).getTime();

    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const left = deadline - Date.now();
      setTimeLeftMs(Math.max(0, left));

      if (left <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // server will resolve timeout on next poll / identify call
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentEncData?.observeDeadlineAt]); // eslint-disable-line

  // ── Counter timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countermeasure' || !currentEncData?.counterDeadlineAt) return;
    clearTimers();

    const deadline = new Date(currentEncData.counterDeadlineAt).getTime();

    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const left = deadline - Date.now();
      setTimeLeftMs(Math.max(0, left));

      if (left <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentEncData?.counterDeadlineAt]); // eslint-disable-line

  // ── Re-sync with server after page visibility changes ───────────────────────
  useEffect(() => {
    function handleVisible() {
      if (!document.hidden && session?.id && phase === 'observe') {
        syncSession(session.id);
      }
    }
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [session?.id, phase]); // eslint-disable-line

  // ── Helpers ──────────────────────────────────────────────────────────────────
  async function syncSession(sessionId) {
    if (!sessionId) return;
    const res = await api.getBestiarySession(sessionId);
    if (!isMountedRef.current || !res.ok) return;
    setSession(res.data.session);
    setEncounters(res.data.encounters || []);
    _syncPhaseFromServer(res.data.session, res.data.encounters || []);
  }

  function _syncPhaseFromServer(sess, encs) {
    if (!sess) return;
    if (sess.status === 'failed' || sess.status === 'completed') return;
    const serverPhase = sess.currentPhase;
    if (serverPhase === 'observe') setPhase('observe');
    else if (serverPhase === 'countermeasure') setPhase('countermeasure');
    else if (serverPhase === 'encounter_result') setPhase('encounter_result');
    else if (serverPhase === 'finished') triggerComplete(sess.id);
  }

  async function triggerComplete(sessionId) {
    const res = await api.completeBestiarySession(sessionId);
    if (!isMountedRef.current || !res.ok) return;
    setExpResult(res.data);
    setDiscoveries(prev => {
      const newIds = res.data.newDiscoveries || [];
      const newEntries = newIds.filter(id => !prev.find(d => d.beast_id === id))
        .map(id => ({ beast_id: id, field_note_unlocked: 1 }));
      return [...prev, ...newEntries];
    });
    setPhase('expedition_result');
    clearTimers();
    playRuneChime?.();
  }

  // ── Start countdown animation → advance to observe ───────────────────────────
  function startCountdown() {
    clearTimers();
    setCountdownVal(COUNTDOWN_FROM);
    setPhase('countdown');

    let val = COUNTDOWN_FROM;
    function tick() {
      val -= 1;
      if (!isMountedRef.current) return;
      setCountdownVal(val);
      if (val <= 0) {
        countdownRef.current = null;
        doAdvance();
      } else {
        countdownRef.current = setTimeout(tick, 900);
      }
    }
    countdownRef.current = setTimeout(tick, 900);
  }

  async function doAdvance() {
    if (!session?.id) return;
    const res = await api.advanceBestiaryEncounter(session.id);
    if (!isMountedRef.current || !res.ok) return;

    if (res.data.phase === 'observe') {
      await syncSession(session.id);
      setPhase('observe');
      setTimeLeftMs(OBSERVE_TOTAL_MS);
      setIdentifyLocked(false);
      setFeedback('');
    } else if (res.data.phase === 'finished') {
      await triggerComplete(session.id);
    } else if (res.data.phase === 'countdown') {
      await syncSession(session.id);
      startCountdown();
    }
  }

  // ── Create / start expedition ────────────────────────────────────────────────
  async function handleStartExpedition(requestedMode) {
    if (activeActionRef.current) return;
    activeActionRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const runId = makeId('bst');
      const res = await api.createBestiarySession(runId, requestedMode || 'rewarded');
      if (!isMountedRef.current) return;

      if (!res.ok) {
        if (res.data?.needsResume) {
          setPhase('resume_prompt');
          setSession({ id: res.data.activeSessionId });
          return;
        }
        setError(res.error || 'Nie udało się rozpocząć ekspedycji.');
        return;
      }

      if (res.data.needsResume) {
        setPhase('resume_prompt');
        setSession({ id: res.data.activeSessionId });
        return;
      }

      const sess = res.data.session;
      setSession(sess);
      await syncSession(sess.id);
      setUserStatus(prev => prev ? { ...prev, usedRewards: (prev.usedRewards || 0) + (sess.rewardSlotReserved ? 1 : 0) } : prev);
      startCountdown();
    } finally {
      if (isMountedRef.current) setLoading(false);
      activeActionRef.current = false;
    }
  }

  // ── Resume active session ─────────────────────────────────────────────────────
  async function handleResume() {
    if (!session?.id) return;
    setLoading(true);
    try {
      await syncSession(session.id);
      if (!isMountedRef.current) return;
      const sess = session;
      const serverPhase = sess.currentPhase;
      if (serverPhase === 'countdown') startCountdown();
      else if (serverPhase === 'observe') setPhase('observe');
      else if (serverPhase === 'countermeasure') setPhase('countermeasure');
      else if (serverPhase === 'encounter_result') setPhase('encounter_result');
      else if (serverPhase === 'finished') await triggerComplete(sess.id);
      setTab('expedition');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  // ── Identify ──────────────────────────────────────────────────────────────────
  async function handleIdentify(beastId) {
    if (identifyLocked || !session?.id) return;
    setIdentifyLocked(true);
    clearTimers();

    const actionId = makeId('id');
    const res = await api.submitBestiaryIdentify(session.id, actionId, beastId);
    if (!isMountedRef.current) return;

    if (!res.ok && !res.data?.duplicate) {
      setFeedback(res.error || 'Błąd odpowiedzi.');
      setFeedbackType('error');
      setIdentifyLocked(false);
      return;
    }

    const data = res.data;
    const correct = data.correct;
    const pts = data.identifyPoints ?? 0;
    setFeedback(correct ? `+${pts} • Rozpoznano` : 'Nie rozpoznano • Pieczęć zagrożona');
    setFeedbackType(correct ? '' : 'error');

    await syncSession(session.id);
    setPhase('countermeasure');
    setTimeLeftMs(COUNTER_TOTAL_MS);
    setCounterLocked(false);
    playWandSwoosh?.();
  }

  // ── Countermeasure ────────────────────────────────────────────────────────────
  async function handleCountermeasure(choiceId) {
    if (counterLocked || !session?.id) return;
    setCounterLocked(true);
    clearTimers();

    const actionId = makeId('ct');
    const res = await api.submitBestiaryCountermeasure(session.id, actionId, choiceId);
    if (!isMountedRef.current) return;

    if (!res.ok && !res.data?.duplicate) {
      setFeedback(res.error || 'Błąd reakcji.');
      setFeedbackType('error');
      setCounterLocked(false);
      return;
    }

    const data = res.data;
    const correct = data.correct;
    const pts = data.counterPoints ?? 0;
    const bonus = data.flawlessBonus ?? 0;
    const flawless = data.flawless;

    let msg = correct ? `+${pts} Reakcja poprawna` : 'Reakcja błędna • Pieczęć naruszona';
    if (flawless) msg += ` • +${bonus} Bezbłędna obserwacja`;
    setFeedback(msg);
    setFeedbackType(correct ? '' : 'error');

    await syncSession(session.id);

    const freshSession = await api.getBestiarySession(session.id);
    if (!isMountedRef.current) return;

    if (freshSession.ok) {
      setSession(freshSession.data.session);
      setEncounters(freshSession.data.encounters || []);
    }

    const currentEnc = (freshSession.data?.encounters || []).find(e => e.encounterIndex === (session?.currentEncounter ?? 0));
    setEncResult({
      beastId: data.beastId,
      beastName: data.beastName,
      identifyCorrect: currentEnc?.identifyCorrect,
      identifyPoints: currentEnc?.identifyPoints,
      counterCorrect: correct,
      counterPoints: pts,
      flawlessBonus: bonus,
      flawless,
      wardLoss: data.wardLoss,
      wardsRemaining: data.wardsRemaining,
      failed: data.failed
    });

    setPhase('encounter_result');
    playRuneChime?.();
  }

  // ── After encounter result: advance ──────────────────────────────────────────
  async function handleNextEncounter() {
    if (!session?.id) return;
    setLoading(true);
    setFeedback('');
    setEncResult(null);

    try {
      const res = await api.advanceBestiaryEncounter(session.id);
      if (!isMountedRef.current) return;

      if (!res.ok) {
        setError(res.error || 'Błąd przejścia.');
        return;
      }

      if (res.data.phase === 'finished') {
        await triggerComplete(session.id);
      } else {
        await syncSession(session.id);
        startCountdown();
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  // ── Abandon ───────────────────────────────────────────────────────────────────
  async function handleAbortConfirmed() {
    if (!session?.id) { setShowAbortConfirm(false); return; }
    setLoading(true);
    try {
      await api.abandonBestiarySession(session.id);
      if (!isMountedRef.current) return;
      clearTimers();
      setSession(null);
      setEncounters([]);
      setPhase('briefing');
      setShowAbortConfirm(false);
      setTab('archive');

      const stRes = await api.getBestiaryStatus();
      if (isMountedRef.current && stRes.ok) {
        setUserStatus(stRes.data);
        setDiscoveries(stRes.data.discoveries || []);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  // ── Echo bestii (audio) ───────────────────────────────────────────────────────
  function handleEcho() {
    playWandSwoosh?.();
    playRuneChime?.();
  }

  // ── Render helpers ────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const beastList = catalog.length ? catalog : FALLBACK_CATALOG;
  const currentBeast = selectedBeast || beastList[0];
  const isSealUnlocked = (beastId) => discoveries.some(d => d.beast_id === beastId && d.field_note_unlocked);
  const sealCount = beastList.filter(b => isSealUnlocked(b.id)).length;

  const isInGame = ['countdown', 'observe', 'countermeasure', 'encounter_result', 'expedition_result'].includes(phase);
  const canAccessArchive = !isInGame;

  const usedRewards = userStatus?.usedRewards ?? 0;
  const limitReached = usedRewards >= 3;
  const bestScore = userStatus?.bestScore ?? 0;

  const timerPct = phase === 'observe'
    ? (timeLeftMs / OBSERVE_TOTAL_MS) * 100
    : (timeLeftMs / COUNTER_TOTAL_MS) * 100;
  const timerWarning = timeLeftMs < 3000 && timeLeftMs > 0;

  // ── Modal ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="bestiary-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bestiary-title"
      aria-describedby="bestiary-desc"
    >
      <div className="bestiary-modal" style={{ position: 'relative' }}>

        {/* Abort confirm overlay */}
        {showAbortConfirm && (
          <div className="bestiary-abort-overlay">
            <div className="bestiary-abort-box">
              <h3>Przerwać ekspedycję?</h3>
              <p>Bieżąca próba zostanie oznaczona jako porzucona i nie da nagrody. Pieczęcie badacza nie są odbierane.</p>
              <div className="bestiary-abort-btns">
                <button className="btn-cancel" onClick={() => setShowAbortConfirm(false)}>Wróć</button>
                <button className="btn-abort" onClick={handleAbortConfirmed} disabled={loading}>
                  {loading ? 'Przerywam…' : 'Przerwij ekspedycję'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bestiary-header">
          <div className="bestiary-header-left">
            <Skull size={20} style={{ color: 'var(--gold-ancient, #c59f4e)', flexShrink: 0 }} />
            <div>
              <h3 className="bestiary-header-title" id="bestiary-title">
                Bestiariusz Północy • Ekspedycja Badawcza
              </h3>
              <span className="bestiary-header-sub" id="bestiary-desc">
                Archiwum Bestii i gra wiedzy o stworzeniach Północy
              </span>
            </div>
          </div>
          <button
            className="bestiary-close-btn"
            onClick={() => {
              if (isInGame && phase !== 'expedition_result') {
                setShowAbortConfirm(true);
              } else {
                onClose();
              }
            }}
            aria-label="Zamknij Bestiariusz"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bestiary-tabs" role="tablist">
          <button
            className={`bestiary-tab ${tab === 'archive' ? 'active' : ''}`}
            role="tab"
            aria-selected={tab === 'archive'}
            disabled={isInGame}
            onClick={() => { if (canAccessArchive) setTab('archive'); }}
          >
            <BookOpen size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Archiwum
          </button>
          <button
            className={`bestiary-tab ${tab === 'expedition' ? 'active' : ''}`}
            role="tab"
            aria-selected={tab === 'expedition'}
            onClick={() => setTab('expedition')}
          >
            <Shield size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Ekspedycja
          </button>
        </div>

        {/* Body */}
        <div className="bestiary-body">

          {/* ── ARCHIVE ─────────────────────────────────────────────────────── */}
          {tab === 'archive' && (
            <div className="bestiary-archive">
              {/* Beast list */}
              <div className="bestiary-beast-list" role="listbox" aria-label="Lista bestii">
                {beastList.map(beast => (
                  <button
                    key={beast.id}
                    className={`bestiary-beast-btn ${currentBeast?.id === beast.id ? 'active' : ''}`}
                    role="option"
                    aria-selected={currentBeast?.id === beast.id}
                    onClick={() => { playWandSwoosh?.(); setSelectedBeast(beast); }}
                  >
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{BEAST_ICONS[beast.id] || '🔮'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="beast-btn-name">{beast.name.split('(')[0].trim()}</div>
                      <div className="beast-btn-danger" style={{ color: beast.dangerColor }}>
                        {beast.danger?.split(':')?.[1]?.trim()}
                      </div>
                    </div>
                    {isSealUnlocked(beast.id) && (
                      <span className="beast-seal" title="Pieczęć badacza odblokowana">✦</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Beast detail card */}
              {currentBeast && (
                <div className="bestiary-beast-card">
                  <div className="beast-card-header">
                    <div>
                      <div className="beast-card-danger" style={{ color: currentBeast.dangerColor }}>
                        {currentBeast.danger}
                      </div>
                      <h2 className="beast-card-name">{currentBeast.name}</h2>
                      <div className="beast-card-habitat">
                        Siedlisko: <strong>{currentBeast.habitat}</strong>
                      </div>
                      {isSealUnlocked(currentBeast.id) && (
                        <div className="beast-seal-unlocked">
                          <span>✦</span> Pieczęć badacza odblokowana
                        </div>
                      )}
                    </div>
                    <button className="beast-echo-btn" onClick={handleEcho}>
                      <Volume2 size={14} /> Echo bestii
                    </button>
                  </div>

                  <p className="beast-card-desc">{currentBeast.desc}</p>

                  <div className="beast-card-block weakness">
                    <div className="beast-block-label weakness">⚡ Słabość na zaklęcie z Grimoire:</div>
                    <p className="beast-block-text">{currentBeast.weakness}</p>
                  </div>

                  <div className="beast-card-block lore">
                    <div className="beast-block-label lore">📜 Fragment z Kronik Cytadeli:</div>
                    <p className="beast-block-lore">„{currentBeast.lore}"</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPEDITION ──────────────────────────────────────────────────── */}
          {tab === 'expedition' && (
            <>
              {/* HUD for in-game phases */}
              {isInGame && phase !== 'expedition_result' && session && (
                <div className="bestiary-hud" aria-live="polite">
                  <div className="hud-encounter">
                    Spotkanie <strong>{(session.currentEncounter ?? 0) + 1}/4</strong>
                  </div>
                  <div className="hud-score">
                    Wynik: <strong>{session.score ?? 0}</strong> pkt
                  </div>
                  <div className="hud-wards" aria-label={`Pieczęcie: ${session.wardsRemaining} z 4`}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className={`ward-dot ${i < (session.wardsRemaining ?? 4) ? 'full' : 'empty'}`}
                        title={`Pieczęć ochronna ${i + 1}`}
                      />
                    ))}
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '0.3rem' }}>
                      {session.wardsRemaining ?? 4}/4
                    </span>
                  </div>
                  {timerWarning && (phase === 'observe' || phase === 'countermeasure') && (
                    <div className="hud-timer-warning" aria-live="assertive">
                      ⚠ {Math.ceil(timeLeftMs / 1000)}s
                    </div>
                  )}
                  <button
                    style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '5px', padding: '0.25rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer' }}
                    onClick={() => setShowAbortConfirm(true)}
                  >
                    Przerwij
                  </button>
                </div>
              )}

              {/* BRIEFING */}
              {phase === 'briefing' && (
                <div className="bestiary-briefing">
                  <h3 className="briefing-title">Ekspedycja Badawcza</h3>

                  <div className="briefing-slots">
                    <div>Próby premiowane dzisiaj: <strong>{usedRewards}/3</strong></div>
                    <div className="briefing-slot-dots">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className={`slot-dot ${i < usedRewards ? 'used' : 'empty'}`} />
                      ))}
                    </div>
                    {limitReached && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                        Dzisiejszy limit nagród został wykorzystany — wynik tej ekspedycji będzie treningowy.
                      </div>
                    )}
                  </div>

                  {bestScore > 0 && (
                    <div className="briefing-record">
                      Twój rekord: <strong style={{ color: 'var(--gold-ancient)' }}>{bestScore} pkt</strong>
                    </div>
                  )}

                  <ul className="briefing-rules">
                    <li>Ekspedycja = 4 spotkania z różnymi bestiami (losowa kolejność).</li>
                    <li>Każde spotkanie: rozpoznaj bestię po śladach, potem wybierz poprawną reakcję obronną.</li>
                    <li>Szybsze rozpoznanie = więcej punktów (100 / 75 / 50 po kolejnych wskazówkach).</li>
                    <li>Poprawna reakcja = +50 pkt. Bezbłędne spotkanie = dodatkowe +25 pkt.</li>
                    <li>Błędna odpowiedź lub timeout odbiera 1 Pieczęć ochronną (masz 4).</li>
                    <li>Utrata wszystkich pieczęci kończy ekspedycję przedwcześnie.</li>
                    <li>Maksymalny wynik badawczy: 700 pkt. Nagrody: punkty Zakonu i Skirniry.</li>
                  </ul>

                  {error && <div className="bestiary-error">{error}</div>}

                  <div className="briefing-btns">
                    {!currentUser ? (
                      <div style={{ color: '#9ca3af', fontSize: '0.83rem', textAlign: 'center' }}>
                        Zaloguj się, aby zapisywać odkrycia i zdobywać nagrody. Możesz ćwiczyć lokalnie.
                      </div>
                    ) : (
                      <button
                        className="briefing-start-btn"
                        onClick={() => handleStartExpedition(limitReached ? 'training' : 'rewarded')}
                        disabled={loading}
                      >
                        {loading ? 'Przygotowuję…' : limitReached ? 'Rozpocznij trening' : 'Rozpocznij ekspedycję'}
                      </button>
                    )}
                  </div>

                  {limitReached && currentUser && (
                    <div className="briefing-training-notice">
                      Dzisiejszy limit nagród został wykorzystany — wynik tej ekspedycji będzie treningowy.
                    </div>
                  )}
                </div>
              )}

              {/* RESUME PROMPT */}
              {phase === 'resume_prompt' && (
                <div className="bestiary-resume">
                  <h3 className="resume-title">Aktywna ekspedycja</h3>
                  <p className="resume-desc">
                    Masz niedokończoną ekspedycję. Możesz ją wznowić lub przerwać — porzucenie zużywa zarezerwowany slot dnia i nie daje nagrody.
                  </p>
                  <div className="resume-btns">
                    <button className="btn-resume" onClick={handleResume} disabled={loading}>
                      {loading ? 'Wznawianie…' : 'Wznów ekspedycję'}
                    </button>
                    <button className="btn-abandon-confirm" onClick={() => setShowAbortConfirm(true)} disabled={loading}>
                      Przerwij ekspedycję
                    </button>
                  </div>
                </div>
              )}

              {/* COUNTDOWN */}
              {phase === 'countdown' && (
                <div className="bestiary-countdown" aria-live="polite" aria-label={`Odliczanie: ${countdownVal}`}>
                  <div className="countdown-label">Przygotuj się do obserwacji</div>
                  <div key={countdownVal} className="countdown-number">{countdownVal}</div>
                </div>
              )}

              {/* OBSERVE */}
              {phase === 'observe' && currentEncData && (
                <div className="bestiary-observe">
                  {/* Timer bar */}
                  <div className="observe-timer-bar" role="progressbar" aria-valuenow={Math.round(timerPct)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`observe-timer-fill ${timerWarning ? 'warning' : 'normal'}`}
                      style={{ width: `${Math.max(0, timerPct)}%` }}
                    />
                  </div>

                  {/* Clues */}
                  <div className="observe-clues" aria-label="Wskazówki">
                    {currentEncData.clues && currentEncData.clues.length > 0
                      ? currentEncData.clues.map((clue, i) => (
                        <div key={i} className="clue-item">
                          <div className="clue-index">{i + 1}</div>
                          <span>{clue}</span>
                        </div>
                      ))
                      : <div className="clue-placeholder">Wczytuję ślady…</div>
                    }
                    {currentEncData.clues && currentEncData.clues.length < 3 && (
                      <div className="clue-placeholder">Oczekuję na kolejne wskazówki…</div>
                    )}
                  </div>

                  {/* Feedback */}
                  {feedback && (
                    <div className={`phase-feedback ${feedbackType}`} aria-live="polite">{feedback}</div>
                  )}

                  {/* Identify options */}
                  <div className="observe-identify-label">Rozpoznaj bestię:</div>
                  <div className="identify-options" role="group" aria-label="Wybierz bestię">
                    {(currentEncData.identifyOptions || []).map((beastId, i) => {
                      const beastData = beastList.find(b => b.id === beastId);
                      const beastName = beastData?.name || beastId;
                      return (
                        <button
                          key={beastId}
                          className="identify-btn"
                          onClick={() => handleIdentify(beastId)}
                          disabled={identifyLocked}
                          aria-label={`Opcja ${i + 1}: ${beastName}`}
                        >
                          <span className="identify-btn-num">{i + 1}.</span>
                          {BEAST_ICONS[beastId]} {beastName.split('(')[0].trim()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COUNTERMEASURE */}
              {phase === 'countermeasure' && currentEncData && (
                <div className="bestiary-countermeasure">
                  {/* Timer */}
                  <div className="observe-timer-bar" role="progressbar" aria-valuenow={Math.round(timerPct)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`observe-timer-fill ${timerWarning ? 'warning' : 'normal'}`}
                      style={{ width: `${Math.max(0, timerPct)}%` }}
                    />
                  </div>

                  <div className="countermeasure-label">
                    Wybierz reakcję obronną — masz {Math.ceil(timeLeftMs / 1000)}s:
                  </div>

                  {feedback && (
                    <div className={`phase-feedback ${feedbackType}`} aria-live="polite">{feedback}</div>
                  )}

                  <div className="counter-options" role="group" aria-label="Wybierz reakcję obronną">
                    {(currentEncData.counterOptions || []).map((opt, i) => {
                      const id = typeof opt === 'string' ? opt : opt.id;
                      const label = typeof opt === 'string' ? opt : opt.label;
                      return (
                        <button
                          key={id}
                          className="counter-btn"
                          onClick={() => handleCountermeasure(id)}
                          disabled={counterLocked}
                          aria-label={`Opcja ${i + 1}: ${label}`}
                        >
                          <span className="identify-btn-num">{i + 1}.</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ENCOUNTER RESULT */}
              {phase === 'encounter_result' && encResult && (
                <div className="bestiary-enc-result" aria-live="polite">
                  <h4 className="enc-result-title">
                    {BEAST_ICONS[encResult.beastId] || '🔮'} {encResult.beastName}
                  </h4>

                  <div className="enc-result-rows">
                    <div className="enc-result-row">
                      <span>Rozpoznanie</span>
                      <span className={`enc-result-pts ${encResult.identifyCorrect ? 'green' : 'red'}`}>
                        {encResult.identifyCorrect ? `+${encResult.identifyPoints ?? 0}` : '0'} pkt
                        {' '}{encResult.identifyCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="enc-result-row">
                      <span>Reakcja obronna</span>
                      <span className={`enc-result-pts ${encResult.counterCorrect ? 'green' : 'red'}`}>
                        {encResult.counterCorrect ? `+${encResult.counterPoints ?? 50}` : '0'} pkt
                        {' '}{encResult.counterCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    {encResult.flawless && (
                      <div className="enc-result-flawless">
                        ✦ Bezbłędna obserwacja +{encResult.flawlessBonus} pkt • Pieczęć badacza odblokowana
                      </div>
                    )}
                    {(encResult.wardLoss > 0) && (
                      <div className="enc-result-ward-loss">
                        🔴 Pieczęć ochronna utracona ({encResult.wardsRemaining} pozostało)
                      </div>
                    )}
                  </div>

                  {encResult.failed ? (
                    <div className="bestiary-error" style={{ marginTop: '0.75rem' }}>
                      Wszystkie pieczęcie stracone — ekspedycja zakończona niepowodzeniem.
                      <br />
                      <button
                        className="enc-result-next-btn"
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => triggerComplete(session.id)}
                        disabled={loading}
                      >
                        {loading ? 'Wczytuję wyniki…' : 'Zobacz wyniki'}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="enc-result-next-btn"
                      onClick={handleNextEncounter}
                      disabled={loading}
                    >
                      {loading ? 'Wczytuję…'
                        : (session?.currentEncounter ?? 0) >= 3 ? 'Zakończ ekspedycję' : 'Następne spotkanie'}
                    </button>
                  )}
                </div>
              )}

              {/* EXPEDITION RESULT */}
              {phase === 'expedition_result' && expResult && (
                <div className="bestiary-exp-result">
                  <div className="exp-result-header">
                    <div className="exp-result-score">{expResult.score} / 700</div>
                    <div className={`exp-result-status ${expResult.status}`}>
                      {expResult.status === 'completed' ? '✓ Ekspedycja ukończona' : '✗ Ekspedycja nieudana'}
                      {expResult.mode === 'training' && ' (tryb treningowy)'}
                    </div>
                  </div>

                  <div className="exp-result-grid">
                    <div className="exp-stat">
                      <strong>{expResult.encounters?.filter(e => e.identifyCorrect).length ?? 0}/4</strong>
                      Poprawne rozpoznania
                    </div>
                    <div className="exp-stat">
                      <strong>{expResult.encounters?.filter(e => e.counterCorrect).length ?? 0}/4</strong>
                      Poprawne reakcje
                    </div>
                    <div className="exp-stat">
                      <strong>{expResult.encounters?.filter(e => e.flawlessBonus > 0).length ?? 0}</strong>
                      Bezbłędne spotkania
                    </div>
                    <div className="exp-stat">
                      <strong>{expResult.wardsRemaining ?? 0}/4</strong>
                      Pozostałe pieczęcie
                    </div>
                  </div>

                  {expResult.rewarded ? (
                    <div className="exp-result-reward">
                      <div className="reward-title">Nagroda za ekspedycję</div>
                      {expResult.rewardHousePoints > 0 && (
                        <div>+{expResult.rewardHousePoints} punktów Zakonu</div>
                      )}
                      {expResult.rewardSkirnirs > 0 && (
                        <div>+{expResult.rewardSkirnirs} Skirnirów</div>
                      )}
                      {!expResult.rewardHousePoints && !expResult.rewardSkirnirs && (
                        <div style={{ color: '#9ca3af' }}>Wynik poniżej progu nagrody (250 pkt).</div>
                      )}
                    </div>
                  ) : (
                    <div className="exp-result-no-reward">
                      {expResult.status === 'failed'
                        ? 'Brak nagrody — ekspedycja zakończona niepowodzeniem.'
                        : expResult.mode === 'training'
                          ? 'Tryb treningowy — brak nagrody.'
                          : expResult.score < 250
                            ? 'Wynik poniżej progu 250 pkt — brak nagrody.'
                            : 'Brak nagrody.'}
                    </div>
                  )}

                  {expResult.newDiscoveries?.length > 0 && (
                    <div className="exp-discoveries">
                      <div className="disc-title">✦ Nowe Pieczęcie badacza</div>
                      {expResult.newDiscoveries.map(bId => {
                        const b = beastList.find(x => x.id === bId);
                        return <div key={bId}>{BEAST_ICONS[bId]} {b?.name || bId}</div>;
                      })}
                    </div>
                  )}

                  {expResult.encounters?.length > 0 && (
                    <div className="exp-enc-list">
                      {expResult.encounters.map((enc, i) => {
                        const total = (enc.identifyPoints || 0) + (enc.counterPoints || 0) + (enc.flawlessBonus || 0);
                        return (
                          <div key={i} className="exp-enc-item">
                            <span className="exp-enc-name">
                              {BEAST_ICONS[enc.beastId]} {enc.beastName?.split('(')[0]?.trim()}
                            </span>
                            <span className="exp-enc-pts">
                              {enc.identifyCorrect ? '✓' : '✗'} Rozp.
                              {' | '}
                              {enc.counterCorrect ? '✓' : '✗'} Rea.
                              {enc.flawlessBonus > 0 ? ' | ✦' : ''}
                              {' = '}<strong>+{total}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    className="exp-result-back-btn"
                    onClick={async () => {
                      setSession(null);
                      setEncounters([]);
                      setExpResult(null);
                      setEncResult(null);
                      setPhase('briefing');
                      setTab('archive');

                      const stRes = await api.getBestiaryStatus();
                      if (isMountedRef.current && stRes.ok) {
                        setUserStatus(stRes.data);
                        setDiscoveries(stRes.data.discoveries || []);
                      }
                    }}
                  >
                    Wróć do Bestiariusza
                  </button>
                </div>
              )}

              {/* No user — offline briefing */}
              {phase === 'briefing' && !currentUser && (
                <div style={{ padding: '0.75rem 1.5rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center', marginTop: '-0.5rem' }}>
                    Archiwum dostępne dla wszystkich — nagrody i odkrycia wymagają zalogowania.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Archive footer */}
        {tab === 'archive' && (
          <div className="bestiary-archive-footer">
            <div className="bestiary-seals-counter">
              <span>✦</span>
              <span>{sealCount}/{beastList.length} pieczęci badacza</span>
            </div>
            <button
              className="bestiary-start-btn"
              onClick={() => {
                setTab('expedition');
                if (phase === 'briefing' || phase === 'resume_prompt') return;
                setPhase('briefing');
              }}
            >
              {session?.status === 'active' ? 'Wznów ekspedycję' : 'Rozpocznij ekspedycję'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Fallback catalog when backend is unavailable
const FALLBACK_CATALOG = [
  {
    id: 'frost_drake',
    name: 'Smok Lodowych Fiordów (Dreki)',
    danger: 'Klasa Zagrożenia: XXXXX (Śmiertelny)',
    dangerColor: '#ef4444',
    habitat: 'Szczyty Gór Skandynawskich i Lodowce',
    weakness: 'Płomień Berserka (Ignis Furor)',
    desc: 'Skrzydlaty gad o łuskach twardszych niż diament. Jego lodowy oddech zamraża w kamień całe drakkary w ułamku sekundy.',
    lore: 'Pradawne sagi mówią, że założyciele Durmstrangu zawarli pakt z pierwszym Dreki, oddając mu pieczę nad podziemiami.'
  },
  {
    id: 'shadow_wolf',
    name: 'Widmowy Wilk Północy (Ulfr)',
    danger: 'Klasa Zagrożenia: XXXX (Niebezpieczny)',
    dangerColor: '#f97316',
    habitat: 'Przeklęta Puszcza Cieni (Myrkviðr)',
    weakness: 'Lumos Borealis (Rozproszenie Cienia)',
    desc: 'Drapieżnik zdolny do stapiania się z mrokiem. Jego wycie wywołuje paraliżujący strach w sercach adeptów.',
    lore: 'Zakonnicy z Reinhall i Björnhall często obłaskawiają młode wilki Ulfr na lojalnych chowańców.'
  },
  {
    id: 'ice_jotun',
    name: 'Lodowy Jotun (Jötunn)',
    danger: 'Klasa Zagrożenia: XXXXX (Monumentalny)',
    dangerColor: '#ef4444',
    habitat: 'Jaskinie Jotunheimen',
    weakness: 'Runa Przełamania (Thurisaz)',
    desc: 'Pradawny kolos wykuty z lodowca i bazaltu. Porusza się powoli, lecz jego uderzenie kruszy mury zamkowe.',
    lore: 'Śpią przez stulecia w głębi tundry. Budzą się wyłącznie podczas największych anomalii magicznych Północy.'
  },
  {
    id: 'kraken',
    name: 'Głębinowy Kraken ze Skandów',
    danger: 'Klasa Zagrożenia: XXXXX (Legendarny)',
    dangerColor: '#a855f7',
    habitat: 'Bezkresne Głębiny Zamarzniętego Fiordu',
    weakness: 'Runiczny Piorun (Tiwaz)',
    desc: 'Wieloramienny potwór morski strzegący dna fiordu przed intruzami z zewnątrz.',
    lore: 'Członkowie Zakonu Otergard czerpią ze śluzu Krakena najsilniejsze odczynniki paraliżujące do alchemii.'
  }
];
