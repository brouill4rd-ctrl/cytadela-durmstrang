import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, CheckCircle, Lock, Loader, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import api from '../../api';

const DIFFICULTY_COLOR = {
  'Łatwy':   '#22c55e',
  'Średni':  '#f59e0b',
  'Trudny':  '#f87171',
  'Legendarny': '#a78bfa',
};

const STAGE_TYPE_LABEL = {
  dialogue:       'Scena fabularna',
  choice:         'Wybór',
  visit_location: 'Cel: odwiedź lokację',
  complete:       'Finał',
};

export function QuestModal({ questId, isOpen, onClose, onQuestComplete, autoStart = false }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null); // actionId w trakcie

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.startQuest(questId);
      const payload = res?.data ?? res;
      setState(payload?.state ?? payload);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Nie udało się rozpocząć questa.');
    } finally {
      setLoading(false);
    }
  }, [questId]);

  const loadState = useCallback(async () => {
    if (!questId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getQuestState(questId);
      const fetched = res?.data ?? res;
      // auto-start: jeśli quest jest "available" i użytkownik kliknął "Rozpocznij", od razu go startujemy
      if (autoStart && fetched?.status === 'available') {
        // już mamy loading=true, startujemy
        const startRes = await api.startQuest(questId);
        const payload = startRes?.data ?? startRes;
        setState(payload?.state ?? payload);
      } else {
        setState(fetched);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Błąd ładowania questa.');
    } finally {
      setLoading(false);
    }
  }, [questId, autoStart]);

  useEffect(() => {
    if (isOpen && questId) loadState();
  }, [isOpen, questId, loadState]);


  const handleAction = async (actionId) => {
    setSubmitting(actionId);
    setError(null);
    try {
      const res = await api.submitQuestAction(questId, actionId);
      const payload = res?.data ?? res;
      if (payload?.completed) {
        setState(payload?.state ?? null);
        onQuestComplete?.({ questId, rewards: payload.rewards, title: payload.title });
      } else {
        setState(payload?.state ?? null);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Błąd wykonania akcji.');
    } finally {
      setSubmitting(null);
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modalStyle = {
    background: 'rgba(7,10,16,0.99)',
    border: '1px solid rgba(197,159,78,0.4)',
    borderRadius: '10px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.95)',
    width: '100%', maxWidth: '520px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '1rem 1.25rem 0.75rem',
    borderBottom: '1px solid rgba(197,159,78,0.15)',
    flexShrink: 0,
  };

  const contentStyle = {
    flex: 1, overflowY: 'auto', padding: '1.25rem',
  };

  const footerStyle = {
    padding: '0.75rem 1.25rem',
    borderTop: '1px solid rgba(197,159,78,0.12)',
    flexShrink: 0,
  };

  const narrativeStyle = {
    fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.7,
    fontFamily: 'var(--font-lore)', fontStyle: 'italic',
    background: 'rgba(197,159,78,0.04)',
    border: '1px solid rgba(197,159,78,0.1)',
    borderRadius: '6px', padding: '1rem',
    marginBottom: '1.25rem',
    whiteSpace: 'pre-wrap',
  };

  const actionBtnStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    width: '100%', textAlign: 'left',
    background: 'rgba(197,159,78,0.07)',
    border: '1px solid rgba(197,159,78,0.2)',
    borderRadius: '6px', padding: '0.75rem 1rem',
    cursor: isActive ? 'wait' : 'pointer',
    color: '#f3d995', fontSize: '0.85rem',
    fontFamily: 'var(--font-heading)', letterSpacing: '0.04em',
    opacity: isActive ? 0.6 : 1,
    transition: 'all 0.15s',
    marginBottom: '0.5rem',
  });

  const diffColor = state ? (DIFFICULTY_COLOR[state.difficulty] || '#9ca3af') : '#9ca3af';

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={modalStyle}>
        {/* Nagłówek */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {state?.category || '—'} · <span style={{ color: diffColor }}>{state?.difficulty || '—'}</span>
              </div>
              <h2 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                {state?.title || 'Quest'}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          {/* Pasek postępu etapów */}
          {state?.totalStages > 1 && state?.status === 'active' && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '4px' }}>
              {Array.from({ length: state.totalStages }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: i < state.currentStageIndex
                    ? 'var(--gold-ancient)'
                    : i === state.currentStageIndex
                      ? 'rgba(197,159,78,0.6)'
                      : 'rgba(255,255,255,0.08)',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Treść */}
        <div style={contentStyle}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Ładowanie…</div>
            </div>
          )}

          {error && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.82rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '0.75rem' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {!loading && state && (
            <>
              {/* Status: ukończony */}
              {state.status === 'completed' && (
                <div>
                  <div style={{ textAlign: 'center', padding: '1rem 0', marginBottom: '1rem' }}>
                    <CheckCircle size={40} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                      Quest ukończony!
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {state.completedAt ? new Date(state.completedAt).toLocaleDateString('pl-PL') : ''}
                    </div>
                  </div>
                  {state.rewards && (
                    <div style={{ background: 'rgba(197,159,78,0.07)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '6px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                        Nagrody
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {state.rewards.points > 0 && <span style={{ fontSize: '0.82rem', color: '#f3d995' }}>⚡ {state.rewards.points} pkt</span>}
                        {state.rewards.xp > 0 && <span style={{ fontSize: '0.82rem', color: '#a78bfa' }}>✨ {state.rewards.xp} XP</span>}
                        {state.rewards.skirniry > 0 && <span style={{ fontSize: '0.82rem', color: '#f3d995' }}>🪙 {state.rewards.skirniry} SKR</span>}
                        {state.rewards.item && <span style={{ fontSize: '0.82rem', color: '#22c55e' }}>🎁 {state.rewards.item}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status: zablokowany */}
              {state.status === 'locked' && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
                  <Lock size={30} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem' }}>Wymagania questa nie są spełnione.</div>
                </div>
              )}

              {/* Status: available */}
              {state.status === 'available' && (
                <div>
                  <p style={{ fontSize: '0.88rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {state.description}
                  </p>
                </div>
              )}

              {/* Status: active — etap questa */}
              {state.status === 'active' && state.stage && (
                <div>
                  {/* Typ etapu */}
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    {STAGE_TYPE_LABEL[state.stage.type] || state.stage.type}
                    {state.totalStages > 1 && ` — etap ${state.currentStageIndex + 1} z ${state.totalStages}`}
                  </div>

                  {/* Tytuł etapu */}
                  {state.stage.title && (
                    <h3 style={{ fontSize: '0.95rem', color: '#e5e7eb', margin: '0 0 0.75rem', fontFamily: 'var(--font-heading)' }}>
                      {state.stage.title}
                    </h3>
                  )}

                  {/* Narracja */}
                  {state.stage.narrative && (
                    <div style={narrativeStyle}>
                      {state.stage.narrative}
                    </div>
                  )}

                  {/* narrative — Discord */}
                  {state.stage.type === 'narrative' && (
                    <div style={{ marginBottom: '1rem' }}>
                      {state.stage.prompt && (
                        <div style={{ fontSize: '0.82rem', color: '#e5e7eb', background: 'rgba(197,159,78,0.06)', border: '1px solid rgba(197,159,78,0.18)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Twoje zadanie</div>
                          {state.stage.prompt}
                        </div>
                      )}
                      {state.stage.pendingReview ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f59e0b', fontSize: '0.82rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '0.75rem' }}>
                          <Clock size={14} />
                          Odpowiedź wysłana — czeka na zatwierdzenie Arxymistrza.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#8ecae6', fontSize: '0.82rem', background: 'rgba(142,202,230,0.07)', border: '1px solid rgba(142,202,230,0.2)', borderRadius: '6px', padding: '0.75rem' }}>
                          <MessageSquare size={14} />
                          Odpowiedz przez bota na Discordzie — scena pojawi się w publicznym wątku questa.
                        </div>
                      )}
                    </div>
                  )}

                  {/* visit_location — specjalny typ */}
                  {state.stage.type === 'visit_location' && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(142,202,230,0.07)', border: '1px solid rgba(142,202,230,0.2)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#8ecae6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                        Cel
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>{state.stage.objective}</div>
                    </div>
                  )}

                  {/* Akcje */}
                  {state.stage.actions?.length > 0 && state.stage.type !== 'visit_location' && state.stage.type !== 'narrative' && (
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
                        Co robisz?
                      </div>
                      {state.stage.actions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action.id)}
                          disabled={submitting !== null}
                          style={actionBtnStyle(submitting === action.id)}
                          onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = 'rgba(197,159,78,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(197,159,78,0.07)'; }}
                        >
                          {submitting === action.id
                            ? <Loader size={13} style={{ flexShrink: 0 }} />
                            : <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--gold-dim)' }} />
                          }
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dla visit_location: przycisk "Dotarłem" */}
                  {state.stage.type === 'visit_location' && (
                    <button
                      onClick={() => handleAction('arrived')}
                      disabled={submitting !== null}
                      style={{
                        ...actionBtnStyle(submitting === 'arrived'),
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#4ade80',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={13} />
                      Dotarłem do celu
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stopka */}
        <div style={footerStyle}>
          {state?.status === 'available' && !loading && (
            <button
              onClick={handleStart}
              disabled={loading}
              style={{
                width: '100%', padding: '0.7rem',
                background: 'linear-gradient(135deg, rgba(197,159,78,0.9) 0%, rgba(140,109,59,0.9) 100%)',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                color: '#000', fontWeight: 700, fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem', letterSpacing: '0.08em',
                boxShadow: '0 4px 16px rgba(197,159,78,0.25)',
              }}
            >
              ᛏ ROZPOCZNIJ QUEST
            </button>
          )}
          {(state?.status === 'active' || state?.status === 'completed') && (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '0.6rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', cursor: 'pointer',
                color: '#9ca3af', fontSize: '0.82rem',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {state?.status === 'completed' ? 'Zamknij' : 'Przerwij i wróć później'}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
