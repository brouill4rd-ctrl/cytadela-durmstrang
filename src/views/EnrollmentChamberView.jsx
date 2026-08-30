import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  BookOpen,
  Shield,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  Plus,
  AlertTriangle
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const GOLD = 'var(--gold-ancient)';
const GOLD_GLOW = 'var(--gold-glow)';

const statusColor = {
  pending:  '#f59e0b',
  approved: '#4ade80',
  rejected: '#f87171'
};

const statusLabel = {
  pending:  'Oczekuje',
  approved: 'Zatwierdzone',
  rejected: 'Odrzucone'
};

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.55rem',
      borderRadius: 4,
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: statusColor[status] || '#9ca3af',
      border: `1px solid ${statusColor[status] || '#374151'}`,
      background: `${statusColor[status] || '#374151'}22`
    }}>
      {statusLabel[status] || status}
    </span>
  );
}

function Block({ title, rune = 'ᛟ', children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(4,7,12,0.7)',
      border: `1px solid ${GOLD}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: '1.5rem',
      ...style
    }}>
      <div style={{
        background: 'rgba(197,159,78,0.08)',
        borderBottom: `1px solid rgba(197,159,78,0.25)`,
        padding: '0.7rem 1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem'
      }}>
        <span style={{ color: GOLD, fontSize: '1rem' }}>{rune}</span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          color: GOLD_GLOW,
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>{title}</span>
      </div>
      <div style={{ padding: '1.2rem' }}>{children}</div>
    </div>
  );
}

function Btn({ onClick, color = GOLD, children, danger = false, small = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '0.3rem 0.7rem' : '0.5rem 1.1rem',
        border: `1px solid ${danger ? '#ef4444' : color}`,
        borderRadius: 5,
        background: danger ? 'rgba(239,68,68,0.12)' : `${color}18`,
        color: danger ? '#f87171' : color,
        fontWeight: 700,
        fontSize: small ? '0.72rem' : '0.8rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all .15s',
        whiteSpace: 'nowrap'
      }}
    >{children}</button>
  );
}

// ── Formularz aplikacji ──────────────────────────────────────────────────────
function ApplyForm({ subjects, onSubmit, loading }) {
  const [subjectId, setSubjectId] = useState('');
  const [classYear, setClassYear] = useState('Klasa I');
  const [note, setNote] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.7rem',
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(197,159,78,0.3)',
    borderRadius: 5,
    color: '#e5e7eb',
    fontSize: '0.82rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.72rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.3rem'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectId || !classYear) return;
    onSubmit({ subjectId, classYear, note });
    setNote('');
    setSubjectId('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div>
        <label style={labelStyle}>Przedmiot</label>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} style={inputStyle} required>
          <option value="">— wybierz przedmiot —</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Rocznik</label>
        <select value={classYear} onChange={e => setClassYear(e.target.value)} style={inputStyle}>
          {['Klasa I', 'Klasa II', 'Klasa III', 'Klasa IV', 'Klasa V', 'Klasa VI', 'Staż Zawodowy'].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Dodatkowe uwagi (opcjonalnie)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          placeholder="Twoje doświadczenie z danym przedmiotem, propozycje zajęć..."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn disabled={loading || !subjectId}>
          {loading ? 'Wysyłanie...' : '✦ Złóż podanie'}
        </Btn>
      </div>
    </form>
  );
}

// ── Karta podania ─────────────────────────────────────────────────────────────
function ApplicationCard({ app, isAdmin, onReview, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(197,159,78,0.2)',
      borderRadius: 6,
      marginBottom: '0.7rem',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          padding: '0.6rem 0.9rem',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(p => !p)}
      >
        {app.professor_avatar
          ? <img src={app.professor_avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${GOLD}` }} />
          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(197,159,78,0.15)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:'0.8rem', color: GOLD }}>✦</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 600 }}>{app.professor_name}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>{app.subject_name} · {app.class_year}</div>
        </div>
        <StatusBadge status={app.status} />
        {expanded ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0.7rem 0.9rem', borderTop: '1px solid rgba(197,159,78,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {app.note && (
            <div style={{ fontSize: '0.78rem', color: '#d1d5db', fontStyle: 'italic', background: 'rgba(197,159,78,0.05)', padding: '0.5rem', borderRadius: 4, border: '1px solid rgba(197,159,78,0.1)' }}>
              „{app.note}"
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
            Złożone: {new Date(app.created_at).toLocaleDateString('pl-PL')}
          </div>

          {app.review_comment && (
            <div style={{ fontSize: '0.75rem', color: app.status === 'approved' ? '#4ade80' : '#f87171' }}>
              Komentarz: {app.review_comment}
            </div>
          )}

          {/* Admin review form */}
          {isAdmin && app.status === 'pending' && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <input
                placeholder="Komentarz do decyzji (opcjonalnie)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(197,159,78,0.25)',
                  borderRadius: 4,
                  color: '#e5e7eb',
                  fontSize: '0.78rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Btn small onClick={() => onReview(app.id, 'approved', comment)}>
                  ✔ Zatwierdź
                </Btn>
                <Btn small danger onClick={() => onReview(app.id, 'rejected', comment)}>
                  ✖ Odrzuć
                </Btn>
              </div>
            </div>
          )}

          {/* Professor cancel own pending */}
          {!isAdmin && app.status === 'pending' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn small danger onClick={() => onCancel(app.id)}>Anuluj podanie</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Główny widok ─────────────────────────────────────────────────────────────
export function EnrollmentChamberView() {
  const { currentUser, showNotification } = useSchool();
  const isAdmin = currentUser?.role === 'admin';
  const isProfessor = ['professor', 'admin'].includes(currentUser?.role);

  const [config, setConfig] = useState({ enrollmentOpen: false, schoolYear: '', enrollmentNote: '' });
  const [stats, setStats] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tab, setTab] = useState(isAdmin ? 'queue' : isProfessor ? 'apply' : 'info');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgR, statsR, profsR, appsR] = await Promise.all([
        api.getEnrollmentConfig(),
        api.getEnrollmentStats(),
        api.getEnrolledProfessors(),
        api.getEnrollmentApplications()
      ]);
      if (cfgR.ok) setConfig(cfgR.data);
      if (statsR.ok) setStats(statsR.data);
      if (profsR.ok) setProfessors(profsR.data);
      if (appsR.ok) setApplications(appsR.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isProfessor) {
      api.getSubjects().then(r => { if (r.ok) setSubjects(r.data); });
    }
  }, [isProfessor]);

  const handleApply = async ({ subjectId, classYear, note }) => {
    setSubmitting(true);
    const r = await api.applyForSubject({ subjectId, classYear, note });
    if (r.ok) {
      showNotification('Podanie zostało złożone pomyślnie', 'success');
      load();
    } else {
      showNotification(r.error || 'Błąd podczas składania podania', 'error');
    }
    setSubmitting(false);
  };

  const handleReview = async (id, decision, reviewComment) => {
    const r = await api.reviewEnrollmentApplication(id, { decision, reviewComment });
    if (r.ok) {
      showNotification(decision === 'approved' ? 'Podanie zatwierdzone' : 'Podanie odrzucone', 'success');
      load();
    } else {
      showNotification(r.error || 'Błąd', 'error');
    }
  };

  const handleCancel = async (id) => {
    const r = await api.cancelEnrollmentApplication(id);
    if (r.ok) { showNotification('Podanie anulowane', 'success'); load(); }
    else showNotification(r.error || 'Błąd', 'error');
  };

  const handleRemoveSubject = async (profId, subjectId) => {
    const r = await api.removeProfessorSubject(profId, subjectId);
    if (r.ok) { showNotification('Usunięto przypisanie do przedmiotu', 'success'); load(); }
    else showNotification(r.error || 'Błąd', 'error');
  };

  const handleSaveConfig = async () => {
    const r = await api.updateEnrollmentConfig(configDraft);
    if (r.ok) {
      showNotification('Konfiguracja zapisana', 'success');
      setEditingConfig(false);
      load();
    } else {
      showNotification(r.error || 'Błąd', 'error');
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const myApps = applications.filter(a => a.professor_id === currentUser?.id);

  const TABS = [
    ...(isAdmin ? [{ id: 'queue', label: `Kolejka (${pendingApps.length})`, icon: <ClipboardList size={14} /> }] : []),
    ...(isProfessor ? [{ id: 'apply', label: 'Złóż podanie', icon: <Plus size={14} /> }] : []),
    ...(isProfessor ? [{ id: 'myapps', label: 'Moje podania', icon: <Clock size={14} /> }] : []),
    { id: 'professors', label: 'Profesorowie', icon: <Users size={14} /> },
    { id: 'info', label: 'Informacje', icon: <BookOpen size={14} /> },
    ...(isAdmin ? [{ id: 'settings', label: 'Ustawienia', icon: <Shield size={14} /> }] : [])
  ];

  const containerStyle = {
    maxWidth: 860,
    margin: '0 auto',
    padding: '1.5rem 1rem'
  };

  const tabBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.3rem',
    marginBottom: '1.5rem'
  };

  const tabStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.4rem 0.9rem',
    border: `1px solid ${active ? GOLD : 'rgba(197,159,78,0.2)'}`,
    borderRadius: 5,
    background: active ? 'rgba(197,159,78,0.15)' : 'rgba(0,0,0,0.3)',
    color: active ? GOLD_GLOW : '#9ca3af',
    fontSize: '0.78rem',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    transition: 'all .15s'
  });

  return (
    <div style={containerStyle}>
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>📋</div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          color: GOLD_GLOW,
          fontSize: '1.6rem',
          letterSpacing: '0.1em',
          margin: 0
        }}>
          Kancelaria Zapisów
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.4rem', marginBottom: '0.8rem' }}>
          {config.schoolYear || 'Rok Szkolny Cytadeli Durmstrang'}
        </p>

        {/* Status banner */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1.2rem',
          borderRadius: 20,
          border: `1px solid ${config.enrollmentOpen ? '#4ade80' : '#ef4444'}`,
          background: config.enrollmentOpen ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          color: config.enrollmentOpen ? '#4ade80' : '#f87171',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.06em'
        }}>
          {config.enrollmentOpen ? <Unlock size={14} /> : <Lock size={14} />}
          {config.enrollmentOpen ? 'ZAPISY SĄ OTWARTE' : 'ZAPISY SĄ ZAMKNIĘTE'}
        </div>

        {config.enrollmentNote && (
          <p style={{ color: '#d1d5db', fontSize: '0.8rem', marginTop: '0.6rem', fontStyle: 'italic' }}>
            {config.enrollmentNote}
          </p>
        )}
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.7rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Uczniów zapisanych', value: stats.studentsEnrolled, icon: <Users size={16} />, color: '#4ade80' },
            { label: 'Uczniów oczekujących', value: stats.studentsPending, icon: <Clock size={16} />, color: '#f59e0b' },
            { label: 'Profesorów aktywnych', value: stats.professorsEnrolled, icon: <Shield size={16} />, color: '#60a5fa' },
            { label: 'Podań oczekujących', value: stats.professorsPending, icon: <ClipboardList size={16} />, color: '#f59e0b' }
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(4,7,12,0.7)',
              border: '1px solid rgba(197,159,78,0.2)',
              borderRadius: 8,
              padding: '0.9rem',
              textAlign: 'center'
            }}>
              <div style={{ color: s.color, marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', color: s.color, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.68rem', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={tabBarStyle}>
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.7rem' }}>Ładowanie danych...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ── QUEUE (admin) ── */}
          {tab === 'queue' && (
            <Block title="Kolejka Podań Profesorskich" rune="ᛜ">
              {pendingApps.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.85rem' }}>
                  <CheckCircle size={32} color="#4ade80" style={{ marginBottom: '0.5rem' }} />
                  <p>Brak oczekujących podań.</p>
                </div>
              ) : (
                pendingApps.map(app => (
                  <ApplicationCard key={app.id} app={app} isAdmin onReview={handleReview} onCancel={handleCancel} />
                ))
              )}
            </Block>
          )}

          {/* ── APPLY (professor) ── */}
          {tab === 'apply' && isProfessor && (
            <Block title="Złóż Podanie na Prowadzenie Przedmiotu" rune="ᛈ">
              {!config.enrollmentOpen && !isAdmin && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.8rem', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                  color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem'
                }}>
                  <AlertTriangle size={16} />
                  Zapisy są obecnie zamknięte. Podania można składać tylko wtedy, gdy Dyrekcja otworzy zapisy.
                </div>
              )}
              <ApplyForm subjects={subjects} onSubmit={handleApply} loading={submitting} />
            </Block>
          )}

          {/* ── MY APPS (professor) ── */}
          {tab === 'myapps' && isProfessor && (
            <Block title="Moje Podania" rune="ᛇ">
              {myApps.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.85rem' }}>
                  Nie złożyłeś/łaś jeszcze żadnych podań.
                </div>
              ) : (
                myApps.map(app => (
                  <ApplicationCard key={app.id} app={app} isAdmin={false} onReview={() => {}} onCancel={handleCancel} />
                ))
              )}
            </Block>
          )}

          {/* ── PROFESSORS ── */}
          {tab === 'professors' && (
            <Block title="Kadra Profesorska i Przedmioty" rune="ᛉ">
              {professors.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.85rem' }}>
                  Brak aktywnych profesorów.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {professors.map(prof => (
                    <div key={prof.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.8rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(197,159,78,0.15)',
                      borderRadius: 6,
                      padding: '0.75rem 1rem'
                    }}>
                      {prof.avatar
                        ? <img src={prof.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${GOLD}`, flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(197,159,78,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '1.1rem', flexShrink: 0 }}>✦</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '0.85rem' }}>{prof.full_name}</div>
                        {prof.specialization && <div style={{ color: '#9ca3af', fontSize: '0.72rem', marginBottom: '0.4rem' }}>{prof.specialization}</div>}

                        {prof.subjects && prof.subjects.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {prof.subjects.map(s => (
                              <span key={s.id} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(197,159,78,0.08)',
                                border: '1px solid rgba(197,159,78,0.2)',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                color: GOLD
                              }}>
                                {s.name}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleRemoveSubject(prof.id, s.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#f87171', display: 'flex', alignItems: 'center' }}
                                    title="Usuń przypisanie"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>Brak przypisanych przedmiotów</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Block>
          )}

          {/* ── INFO ── */}
          {tab === 'info' && (
            <Block title="Informacje o Zapisach" rune="ᛗ">
              <div style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <p>
                  <strong style={{ color: GOLD }}>TWIERDZA MAGII DURMSTRANG</strong> prowadzi system zapisów na rok szkolny <strong style={{ color: GOLD_GLOW }}>{config.schoolYear}</strong>.
                  Zapisy pozwalają profesorom zgłaszać chęć prowadzenia wybranych przedmiotów, a Dyrekcji — zarządzać obsadą zajęć.
                </p>
                <div style={{ background: 'rgba(197,159,78,0.05)', border: '1px solid rgba(197,159,78,0.15)', borderRadius: 6, padding: '0.9rem' }}>
                  <div style={{ fontWeight: 700, color: GOLD, marginBottom: '0.5rem' }}>Jak działa proces?</div>
                  <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <li>Dyrekcja otwiera zapisy na nowy rok szkolny</li>
                    <li>Profesorowie składają podania na wybrany przedmiot i rocznik</li>
                    <li>Dyrekcja przegląda podania i zatwierdza lub odrzuca je</li>
                    <li>Po zatwierdzeniu przedmiot pojawia się w profilu profesora</li>
                    <li>Dyrekcja zamyka zapisy po skompletowaniu kadry</li>
                  </ol>
                </div>
                <p>
                  Aktualny status: <strong style={{ color: config.enrollmentOpen ? '#4ade80' : '#f87171' }}>
                    {config.enrollmentOpen ? 'Zapisy otwarte' : 'Zapisy zamknięte'}
                  </strong>
                </p>
                {config.enrollmentNote && <p style={{ fontStyle: 'italic', color: '#9ca3af' }}>{config.enrollmentNote}</p>}
              </div>
            </Block>
          )}

          {/* ── SETTINGS (admin) ── */}
          {tab === 'settings' && isAdmin && (
            <Block title="Zarządzanie Zapisami" rune="ᛝ">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Toggle open/close */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(197,159,78,0.2)',
                  borderRadius: 6,
                  padding: '0.9rem 1rem'
                }}>
                  <div>
                    <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '0.85rem' }}>Status zapisów</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      Otwierając zapisy, profesorowie będą mogli składać podania
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const r = await api.updateEnrollmentConfig({ enrollmentOpen: !config.enrollmentOpen });
                      if (r.ok) { showNotification(config.enrollmentOpen ? 'Zapisy zamknięte' : 'Zapisy otwarte', 'success'); load(); }
                    }}
                    style={{
                      padding: '0.5rem 1.1rem',
                      border: `1px solid ${config.enrollmentOpen ? '#ef4444' : '#4ade80'}`,
                      borderRadius: 5,
                      background: config.enrollmentOpen ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)',
                      color: config.enrollmentOpen ? '#f87171' : '#4ade80',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {config.enrollmentOpen ? <><Lock size={14} />Zamknij zapisy</> : <><Unlock size={14} />Otwórz zapisy</>}
                  </button>
                </div>

                {/* Edit school year / note */}
                {!editingConfig ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Btn onClick={() => { setEditingConfig(true); setConfigDraft({ schoolYear: config.schoolYear, enrollmentNote: config.enrollmentNote }); }}>
                      Edytuj komunikat i rok szkolny
                    </Btn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Rok szkolny</label>
                      <input
                        value={configDraft.schoolYear || ''}
                        onChange={e => setConfigDraft(p => ({ ...p, schoolYear: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: 5, color: '#e5e7eb', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Komunikat dla zapisujących (opcjonalny)</label>
                      <textarea
                        value={configDraft.enrollmentNote || ''}
                        onChange={e => setConfigDraft(p => ({ ...p, enrollmentNote: e.target.value }))}
                        style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: 5, color: '#e5e7eb', fontSize: '0.82rem', boxSizing: 'border-box', minHeight: 70, resize: 'vertical' }}
                        placeholder="Np. Zapisy trwają do 15 września. Proszę o składanie podań..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Btn onClick={() => setEditingConfig(false)} color="#9ca3af">Anuluj</Btn>
                      <Btn onClick={handleSaveConfig}>Zapisz zmiany</Btn>
                    </div>
                  </div>
                )}

                {/* All applications (admin) */}
                <div>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.7rem' }}>
                    Wszystkie podania ({applications.length})
                  </div>
                  {applications.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem' }}>Brak podań</div>
                  ) : (
                    applications.map(app => (
                      <ApplicationCard key={app.id} app={app} isAdmin onReview={handleReview} onCancel={handleCancel} />
                    ))
                  )}
                </div>
              </div>
            </Block>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
