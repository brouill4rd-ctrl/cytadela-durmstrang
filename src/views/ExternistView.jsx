import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  ScrollText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Oczekujący',  color: '#c8a94a', bg: 'rgba(200,169,74,0.12)',  icon: Clock },
  approved:  { label: 'Zatwierdzony', color: '#5cb87a', bg: 'rgba(92,184,122,0.12)', icon: CheckCircle2 },
  rejected:  { label: 'Odrzucony',   color: '#c85c5c', bg: 'rgba(200,92,92,0.12)',  icon: XCircle },
  completed: { label: 'Ukończony',   color: '#8a7cbf', bg: 'rgba(138,124,191,0.12)', icon: Award },
};

const REQUIREMENTS_LABELS = {
  exam:     'Egzamin',
  homework: 'Praca pisemna',
  both:     'Egzamin + praca pisemna',
  custom:   'Wymagania indywidualne',
};

export const ExternistView = () => {
  const { currentUser, subjects, showNotification } = useSchool();
  const { playRuneChime, playWandSwoosh } = useSound();

  const isStudent = currentUser?.role === 'student';
  const isProfOrAdmin = currentUser?.role === 'professor' || currentUser?.role === 'admin';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Formularz wniosku (student)
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySubjectId, setApplySubjectId] = useState('');
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Modal decyzji (profesor/admin)
  const [decideModalApp, setDecideModalApp] = useState(null);
  const [decideChoice, setDecideChoice] = useState('approved');
  const [decideReqType, setDecideReqType] = useState('both');
  const [decideReqNote, setDecideReqNote] = useState('');
  const [decideNote, setDecideNote] = useState('');
  const [decideLoading, setDecideLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const endpoint = isStudent ? '/api/externist/my'
        : currentUser?.role === 'admin' ? '/api/externist/all'
        : '/api/externist/pending';
      const res = await fetch(endpoint, { credentials: 'include' });
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('[ExternistView] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  // --- Złóż wniosek ---
  const handleApply = async (e) => {
    e.preventDefault();
    if (!applySubjectId) return;
    const subject = subjects.find(s => s.id === applySubjectId);
    if (!subject) return;

    setApplyLoading(true);
    try {
      const res = await fetch('/api/externist/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subjectId: subject.id,
          subjectName: subject.name,
          motivation: applyMotivation
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Błąd podczas składania wniosku', 'error');
      } else {
        playRuneChime();
        showNotification('Wniosek złożony pomyślnie', 'success');
        setApplyModalOpen(false);
        setApplySubjectId('');
        setApplyMotivation('');
        fetchApplications();
      }
    } catch (err) {
      showNotification('Błąd połączenia z serwerem', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  // --- Decyzja profesora ---
  const handleDecide = async (e) => {
    e.preventDefault();
    if (!decideModalApp) return;
    setDecideLoading(true);
    try {
      const res = await fetch(`/api/externist/${decideModalApp.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision: decideChoice,
          requirementsType: decideChoice === 'approved' ? decideReqType : '',
          requirementsNote: decideChoice === 'approved' ? decideReqNote : '',
          decisionNote: decideNote
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Błąd podczas wydawania decyzji', 'error');
      } else {
        playRuneChime();
        showNotification(decideChoice === 'approved' ? 'Wniosek zatwierdzony' : 'Wniosek odrzucony', 'success');
        setDecideModalApp(null);
        setDecideReqNote('');
        setDecideNote('');
        fetchApplications();
      }
    } catch (err) {
      showNotification('Błąd połączenia z serwerem', 'error');
    } finally {
      setDecideLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px',
        background: cfg.bg, color: cfg.color,
        fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.03em'
      }}>
        <Icon size={13} />
        {cfg.label}
      </span>
    );
  };

  const renderCard = (app) => {
    const isOpen = expanded === app.id;
    return (
      <div key={app.id} className="ext-card" style={{
        background: 'var(--bg-card, rgba(255,255,255,0.04))',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
        borderRadius: '10px', marginBottom: '12px', overflow: 'hidden'
      }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', cursor: 'pointer', gap: '12px'
          }}
          onClick={() => { playWandSwoosh(); setExpanded(isOpen ? null : app.id); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <BookOpen size={18} style={{ color: 'var(--accent, #c8a94a)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.subject_name}
              </div>
              {isProfOrAdmin && (
                <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '2px' }}>
                  {app.student_name}{app.house ? ` · ${app.house}` : ''}
                </div>
              )}
              {isStudent && (
                <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '2px' }}>
                  {new Date(app.created_at).toLocaleDateString('pl-PL')}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {renderStatusBadge(app.status)}
            {isOpen ? <ChevronUp size={16} style={{ opacity: 0.5 }} /> : <ChevronDown size={16} style={{ opacity: 0.5 }} />}
          </div>
        </div>

        {isOpen && (
          <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))' }}>
            {app.motivation && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motywacja</div>
                <p style={{ fontSize: '0.88rem', opacity: 0.85, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.motivation}</p>
              </div>
            )}

            {app.status === 'approved' && (
              <div style={{
                marginTop: '14px', padding: '12px 14px',
                background: 'rgba(92,184,122,0.08)', borderRadius: '8px',
                border: '1px solid rgba(92,184,122,0.2)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#5cb87a', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Wymagania do zaliczenia
                </div>
                {app.requirements_type && (
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: app.requirements_note ? '6px' : 0 }}>
                    {REQUIREMENTS_LABELS[app.requirements_type] || app.requirements_type}
                  </div>
                )}
                {app.requirements_note && (
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{app.requirements_note}</p>
                )}
                {app.professor_name && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>
                    Zatwierdził/a: {app.professor_name}
                  </div>
                )}
              </div>
            )}

            {app.status === 'rejected' && app.decision_note && (
              <div style={{
                marginTop: '14px', padding: '12px 14px',
                background: 'rgba(200,92,92,0.08)', borderRadius: '8px',
                border: '1px solid rgba(200,92,92,0.2)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#c85c5c', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Powód odrzucenia
                </div>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{app.decision_note}</p>
              </div>
            )}

            {/* Przycisk decyzji dla profesora/admina */}
            {isProfOrAdmin && app.status === 'pending' && (
              <button
                onClick={() => { setDecideModalApp(app); setDecideChoice('approved'); setDecideReqType('both'); setDecideReqNote(''); setDecideNote(''); }}
                style={{
                  marginTop: '14px', padding: '8px 16px', borderRadius: '8px',
                  background: 'var(--accent, #c8a94a)', color: '#000', border: 'none',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Wydaj decyzję
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

      {/* Nagłówek */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScrollText size={20} style={{ color: 'var(--accent, #c8a94a)' }} />
            {isStudent ? 'Moje wnioski eksternistyczne' : 'Wnioski eksternistyczne'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.55 }}>
            {isStudent
              ? 'Zaliczenie przedmiotu bez uczęszczania na regularne zajęcia'
              : 'Wnioski studentów o eksternistyczne zaliczenie przedmiotu'}
          </p>
        </div>
        {isStudent && (
          <button
            onClick={() => { playWandSwoosh(); setApplyModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '8px',
              background: 'var(--accent, #c8a94a)', color: '#000',
              border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            Złóż wniosek
          </button>
        )}
      </div>

      {/* Lista wniosków */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>Ładowanie...</div>
      ) : applications.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--bg-card, rgba(255,255,255,0.03))',
          borderRadius: '12px', border: '1px dashed var(--border-subtle, rgba(255,255,255,0.1))'
        }}>
          <ScrollText size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
          <p style={{ opacity: 0.5, margin: 0 }}>
            {isStudent ? 'Nie złożono jeszcze żadnego wniosku' : 'Brak oczekujących wniosków'}
          </p>
          {isStudent && (
            <button
              onClick={() => { playWandSwoosh(); setApplyModalOpen(true); }}
              style={{
                marginTop: '16px', padding: '8px 18px', borderRadius: '8px',
                background: 'var(--accent, #c8a94a)', color: '#000',
                border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              Złóż pierwszy wniosek
            </button>
          )}
        </div>
      ) : (
        <div>{applications.map(renderCard)}</div>
      )}

      {/* === MODAL: Złóż wniosek === */}
      {applyModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}
          onClick={() => setApplyModalOpen(false)}
        >
          <div style={{
            background: 'var(--bg-panel, #1a1a2e)', borderRadius: '14px',
            border: '1px solid var(--border, rgba(255,255,255,0.12))',
            padding: '28px', width: '100%', maxWidth: '480px'
          }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
              Wniosek eksternistyczny
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', opacity: 0.5 }}>
              Wybierz przedmiot i napisz krótkie uzasadnienie
            </p>

            <form onSubmit={handleApply}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.65, marginBottom: '6px', fontWeight: 600 }}>
                  Przedmiot *
                </label>
                <select
                  value={applySubjectId}
                  onChange={e => setApplySubjectId(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '0.9rem',
                    background: 'var(--bg-input, rgba(255,255,255,0.06))',
                    border: '1px solid var(--border, rgba(255,255,255,0.12))',
                    color: 'inherit', boxSizing: 'border-box'
                  }}
                >
                  <option value="">— wybierz przedmiot —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.65, marginBottom: '6px', fontWeight: 600 }}>
                  Uzasadnienie
                </label>
                <textarea
                  value={applyMotivation}
                  onChange={e => setApplyMotivation(e.target.value)}
                  placeholder="Dlaczego chcesz zaliczyć ten przedmiot eksternistycznie?"
                  rows={4}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '0.88rem',
                    background: 'var(--bg-input, rgba(255,255,255,0.06))',
                    border: '1px solid var(--border, rgba(255,255,255,0.12))',
                    color: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setApplyModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.15))', color: 'inherit', cursor: 'pointer', fontSize: '0.88rem' }}>
                  Anuluj
                </button>
                <button type="submit" disabled={applyLoading || !applySubjectId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px',
                    background: applyLoading || !applySubjectId ? 'rgba(200,169,74,0.4)' : 'var(--accent, #c8a94a)',
                    color: '#000', border: 'none', fontWeight: 700, fontSize: '0.88rem',
                    cursor: applyLoading || !applySubjectId ? 'not-allowed' : 'pointer'
                  }}>
                  <Send size={14} />
                  {applyLoading ? 'Wysyłanie...' : 'Złóż wniosek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: Decyzja profesora === */}
      {decideModalApp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}
          onClick={() => setDecideModalApp(null)}
        >
          <div style={{
            background: 'var(--bg-panel, #1a1a2e)', borderRadius: '14px',
            border: '1px solid var(--border, rgba(255,255,255,0.12))',
            padding: '28px', width: '100%', maxWidth: '480px'
          }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>
              Decyzja o wniosku
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', opacity: 0.5 }}>
              {decideModalApp.student_name} · {decideModalApp.subject_name}
            </p>

            <form onSubmit={handleDecide}>
              {/* Zatwierdź / Odrzuć */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['approved', 'rejected'].map(choice => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setDecideChoice(choice)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                      border: `2px solid ${decideChoice === choice ? (choice === 'approved' ? '#5cb87a' : '#c85c5c') : 'transparent'}`,
                      background: decideChoice === choice
                        ? (choice === 'approved' ? 'rgba(92,184,122,0.15)' : 'rgba(200,92,92,0.15)')
                        : 'var(--bg-input, rgba(255,255,255,0.05))',
                      color: decideChoice === choice ? (choice === 'approved' ? '#5cb87a' : '#c85c5c') : 'inherit'
                    }}
                  >
                    {choice === 'approved' ? '✓ Zatwierdź' : '✗ Odrzuć'}
                  </button>
                ))}
              </div>

              {/* Wymagania — tylko przy zatwierdzeniu */}
              {decideChoice === 'approved' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.65, marginBottom: '8px', fontWeight: 600 }}>
                      Wymagania do zaliczenia
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(REQUIREMENTS_LABELS).map(([val, label]) => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input type="radio" name="reqType" value={val}
                            checked={decideReqType === val}
                            onChange={() => setDecideReqType(val)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.65, marginBottom: '6px', fontWeight: 600 }}>
                      Szczegóły wymagań (opcjonalnie)
                    </label>
                    <textarea
                      value={decideReqNote}
                      onChange={e => setDecideReqNote(e.target.value)}
                      placeholder="Np. zakres materiału, termin, forma egzaminu..."
                      rows={3}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '0.88rem',
                        background: 'var(--bg-input, rgba(255,255,255,0.06))',
                        border: '1px solid var(--border, rgba(255,255,255,0.12))',
                        color: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Powód odrzucenia */}
              {decideChoice === 'rejected' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.65, marginBottom: '6px', fontWeight: 600 }}>
                    Powód odrzucenia (opcjonalnie)
                  </label>
                  <textarea
                    value={decideNote}
                    onChange={e => setDecideNote(e.target.value)}
                    placeholder="Wyjaśnienie dla studenta..."
                    rows={3}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '0.88rem',
                      background: 'var(--bg-input, rgba(255,255,255,0.06))',
                      border: '1px solid var(--border, rgba(255,255,255,0.12))',
                      color: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setDecideModalApp(null)}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.15))', color: 'inherit', cursor: 'pointer', fontSize: '0.88rem' }}>
                  Anuluj
                </button>
                <button type="submit" disabled={decideLoading}
                  style={{
                    padding: '9px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: decideLoading ? 'not-allowed' : 'pointer',
                    background: decideChoice === 'approved' ? '#5cb87a' : '#c85c5c',
                    border: 'none', color: '#fff', opacity: decideLoading ? 0.6 : 1
                  }}>
                  {decideLoading ? 'Zapisywanie...' : 'Zatwierdź decyzję'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
