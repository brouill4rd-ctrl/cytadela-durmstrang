import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ScrollText, ChevronRight, BookOpen, Eye, Plus, Settings,
  Shield, Archive
} from 'lucide-react';

const STATUS_CONFIG = {
  locked: { label: 'NIEDOSTĘPNY', icon: '\u{1F512}', color: '#64748b' },
  upcoming: { label: 'NADCHODZĄCY', icon: '\u{1F56F}', color: '#f59e0b' },
  available: { label: 'DOSTĘPNY', icon: '✦', color: '#10b981' },
  in_progress: { label: 'W TRAKCIE', icon: '✍', color: '#3b82f6' },
  awaiting_review: { label: 'OCZEKUJE NA SPRAWDZENIE', icon: '⌛', color: '#a855f7' },
  graded: { label: 'OCENIONY', icon: '\u{1F3C6}', color: '#eab308' },
  missed: { label: 'NIE PRZYSTĄPIŁ', icon: '⚠', color: '#ef4444' },
  retake: { label: 'POPRAWA', icon: '\u{1F501}', color: '#f97316' }
};

const SESSION_STATUS = {
  planned: { label: 'PLANOWANA', color: '#64748b' },
  upcoming: { label: 'NADCHODZĄCA', color: '#f59e0b' },
  active: { label: 'TRWA', color: '#10b981' },
  finished: { label: 'ZAKOŃCZONA', color: '#3b82f6' },
  archived: { label: 'ARCHIWALNA', color: '#6b7280' }
};

const formatDate = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d.replace(' ', 'T'));
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

const formatTime = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d.replace(' ', 'T'));
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const sealStyle = {
  background: 'radial-gradient(ellipse at center, rgba(197,159,78,0.15) 0%, transparent 70%)',
  border: '2px solid rgba(197,159,78,0.3)',
  borderRadius: '50%',
  width: 80, height: 80,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '2.2rem', margin: '0 auto 1rem',
  boxShadow: '0 0 30px rgba(197,159,78,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
};

const ProfessorPanel = ({ currentUser, navigateToExamCreator, navigateToExamGrading, navigateToExamBank }) => {
  const [profExams, setProfExams] = useState([]);
  const [profLoading, setProfLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setProfLoading(true);
      const res = await api.getExams({ professorId: currentUser.id });
      if (res.ok) setProfExams(res.data);
      setProfLoading(false);
    })();
  }, [currentUser.id]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#fff', letterSpacing: '0.05em' }}>MOJE EGZAMINY</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-durmstrang-secondary" onClick={() => navigateToExamBank()} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={14} /> BANK PYTAŃ
          </button>
          <button className="btn-durmstrang" onClick={() => navigateToExamCreator()} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={14} /> NOWY EGZAMIN
          </button>
        </div>
      </div>
      {profLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Ładowanie...</div>
      ) : profExams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <p>Nie utworzyłeś jeszcze żadnych egzaminów.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {profExams.map(exam => (
            <div key={exam.id} className="gothic-card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', letterSpacing: '0.04em' }}>{exam.subjectName || exam.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{exam.title} {exam.classYear && `• ${exam.classYear}`}</div>
                <div style={{ fontSize: '0.7rem', color: exam.status === 'published' || exam.status === 'active' ? '#10b981' : exam.status === 'draft' ? '#f59e0b' : '#64748b', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', marginTop: '3px' }}>
                  {exam.status === 'draft' ? 'SZKIC' : exam.status === 'published' ? 'OPUBLIKOWANY' : exam.status === 'active' ? 'AKTYWNY' : exam.status === 'closed' ? 'ZAMKNIĘTY' : exam.status?.toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn-durmstrang-secondary" onClick={() => navigateToExamCreator(exam.id)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }} title="Edytuj">
                  <Settings size={13} />
                </button>
                {(exam.status === 'active' || exam.status === 'published' || exam.status === 'closed') && (
                  <button className="btn-durmstrang-secondary" onClick={() => navigateToExamGrading(exam.id)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }} title="Sprawdzanie">
                    <Eye size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel = ({ showNotification }) => {
  const [adminSessions, setAdminSessions] = useState([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSession, setNewSession] = useState({ name: '', schoolYear: '', startDate: '', endDate: '', description: '', classYears: [] });

  useEffect(() => {
    (async () => {
      const res = await api.getExamSessions();
      if (res.ok) setAdminSessions(res.data);
    })();
  }, []);

  const handleCreateSession = async () => {
    const res = await api.createExamSession(newSession);
    if (res.ok) {
      setAdminSessions(prev => [res.data, ...prev]);
      setShowCreateSession(false);
      setNewSession({ name: '', schoolYear: '', startDate: '', endDate: '', description: '', classYears: [] });
      showNotification('Sesja egzaminacyjna utworzona.', 'success');
    } else {
      showNotification(res.error, 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await api.updateExamSession(id, { status });
    if (res.ok) setAdminSessions(prev => prev.map(s => s.id === id ? res.data : s));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#fff', letterSpacing: '0.05em' }}>SESJE EGZAMINACYJNE</h3>
        <button className="btn-durmstrang" onClick={() => setShowCreateSession(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={14} /> NOWA SESJA
        </button>
      </div>

      {showCreateSession && (
        <div className="gothic-card" style={{ padding: '1.2rem', marginBottom: '1.2rem' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '0.8rem', fontSize: '0.95rem' }}>TWORZENIE SESJI</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <input className="gothic-input" placeholder="Nazwa sesji..." value={newSession.name} onChange={e => setNewSession(p => ({ ...p, name: e.target.value }))} />
            <input className="gothic-input" placeholder="Rok szkolny..." value={newSession.schoolYear} onChange={e => setNewSession(p => ({ ...p, schoolYear: e.target.value }))} />
            <input className="gothic-input" type="datetime-local" value={newSession.startDate} onChange={e => setNewSession(p => ({ ...p, startDate: e.target.value.replace('T', ' ') }))} />
            <input className="gothic-input" type="datetime-local" value={newSession.endDate} onChange={e => setNewSession(p => ({ ...p, endDate: e.target.value.replace('T', ' ') }))} />
          </div>
          <textarea className="gothic-textarea" placeholder="Opis sesji..." rows={2} value={newSession.description} onChange={e => setNewSession(p => ({ ...p, description: e.target.value }))} style={{ marginBottom: '0.6rem', width: '100%' }} />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Klasy objęte sesją:</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {['Klasa I', 'Klasa II', 'Klasa III', 'Klasa IV'].map(cy => (
              <button key={cy} className={newSession.classYears.includes(cy) ? 'btn-durmstrang' : 'btn-durmstrang-secondary'}
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                onClick={() => setNewSession(p => ({ ...p, classYears: p.classYears.includes(cy) ? p.classYears.filter(c => c !== cy) : [...p.classYears, cy] }))}>
                {cy}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn-durmstrang-secondary" onClick={() => setShowCreateSession(false)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>ANULUJ</button>
            <button className="btn-durmstrang" onClick={handleCreateSession} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>UTWÓRZ</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {adminSessions.map(sess => {
          const sc = SESSION_STATUS[sess.status] || SESSION_STATUS.planned;
          return (
            <div key={sess.id} className="gothic-card" style={{ padding: '1rem 1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: '#fff', letterSpacing: '0.04em' }}>{sess.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sess.schoolYear} • {formatDate(sess.startDate)} – {formatDate(sess.endDate)}</div>
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '3px', background: `${sc.color}22`, color: sc.color, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>{sc.label}</span>
              </div>
              {sess.classYears?.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.5rem' }}>{Array.isArray(sess.classYears) ? sess.classYears.join(', ') : sess.classYears}</div>
              )}
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {['planned', 'upcoming', 'active', 'finished', 'archived'].map(st => (
                  <button key={st} className="btn-durmstrang-secondary" disabled={sess.status === st}
                    onClick={() => handleUpdateStatus(sess.id, st)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.62rem', opacity: sess.status === st ? 0.4 : 1 }}>
                    {SESSION_STATUS[st]?.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ExamCenterView = () => {
  const { currentUser, navigateToExamTaking, navigateToExamResult, navigateToExamCreator, navigateToExamGrading, navigateToExamBank, showNotification } = useSchool();
  const [centerData, setCenterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('center');
  const [examHistory, setExamHistory] = useState([]);
  const [selectedExamCard, setSelectedExamCard] = useState(null);
  const [examCardData, setExamCardData] = useState(null);
  const [confirmStart, setConfirmStart] = useState(false);
  const [startingExam, setStartingExam] = useState(false);

  const isProfessor = currentUser?.role === 'professor' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  const loadCenter = useCallback(async () => {
    setLoading(true);
    if (!isProfessor) {
      const res = await api.getStudentExamCenter();
      if (res.ok) setCenterData(res.data);
    }
    setLoading(false);
  }, [isProfessor]);

  useEffect(() => { loadCenter(); }, [loadCenter]);

  const loadHistory = useCallback(async () => {
    const res = await api.getStudentExamHistory();
    if (res.ok) setExamHistory(res.data);
  }, []);

  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  const openExamCard = async (examId) => {
    setSelectedExamCard(examId);
    const res = await api.getStudentExamCard(examId);
    if (res.ok) setExamCardData(res.data);
  };

  const handleStartExam = async (examId) => {
    setStartingExam(true);
    const res = await api.startExamAttempt(examId);
    setStartingExam(false);
    if (res.ok) {
      navigateToExamTaking(res.data.attemptId);
    } else {
      showNotification(res.error || 'Nie udało się rozpocząć egzaminu.', 'error');
    }
  };

  const renderStudentCenter = () => {
    if (centerData.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={sealStyle}>{'ᛟ'}</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#94a3b8', marginBottom: '0.5rem' }}>BRAK AKTYWNYCH SESJI</h3>
          <p style={{ fontSize: '0.88rem' }}>Nie ma żadnych sesji egzaminacyjnych przypisanych do Twojej klasy.</p>
        </div>
      );
    }

    return centerData.map(({ session, exams }) => (
      <div key={session.id} style={{ marginBottom: '2rem' }}>
        <div style={{
          textAlign: 'center', padding: '1.5rem 1rem', marginBottom: '1.5rem',
          background: 'linear-gradient(180deg, rgba(197,159,78,0.08) 0%, transparent 100%)',
          borderTop: '1px solid rgba(197,159,78,0.25)', borderBottom: '1px solid rgba(197,159,78,0.15)'
        }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>SESJA EGZAMINACYJNA</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff', letterSpacing: '0.06em', margin: '0.3rem 0' }}>{session.name}</h2>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {currentUser?.class_year && <span style={{ color: 'var(--ice-frost)' }}>{currentUser.class_year}</span>}
            {session.endDate && <span> • Sesja trwa do {formatDate(session.endDate)}</span>}
          </div>
        </div>

        {exams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Brak egzaminów w tej sesji.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {exams.map(exam => {
              const st = STATUS_CONFIG[exam.studentStatus] || STATUS_CONFIG.locked;
              return (
                <div key={exam.id} className="gothic-card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderLeft: `3px solid ${st.color}` }}
                  onClick={() => openExamCard(exam.id)}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0, width: 40, textAlign: 'center' }}>{st.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#fff', letterSpacing: '0.04em' }}>{exam.subjectName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      {exam.title}
                      {exam.accessStart && <span> • {formatDate(exam.accessStart)} {formatTime(exam.accessStart)}</span>}
                      {exam.accessEnd && <span>–{formatTime(exam.accessEnd)}</span>}
                      {exam.timeLimitMinutes && <span> • {exam.timeLimitMinutes} min</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: st.color, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', marginTop: '4px' }}>{st.label}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {exam.studentStatus === 'graded' && (
                      <div>
                        <div style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: exam.isPassing ? '#eab308' : '#ef4444' }}>{exam.percentage}%</div>
                        <div style={{ fontSize: '0.72rem', color: exam.isPassing ? '#eab308' : '#ef4444', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>{exam.gradeName}</div>
                      </div>
                    )}
                    {(exam.studentStatus === 'available' || exam.studentStatus === 'in_progress') && (
                      <ChevronRight size={18} style={{ color: 'var(--gold-ancient)' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ));
  };

  const renderExamCardModal = () => {
    if (!selectedExamCard || !examCardData) return null;
    const { exam, professor, currentAttempt, attemptsUsed, exception } = examCardData;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const isAvailable = exam.status !== 'draft' && (!exam.accessStart || exam.accessStart <= now) && (!exam.accessEnd || exam.accessEnd >= now);
    const canStart = isAvailable && (!currentAttempt || currentAttempt.status !== 'in_progress') && attemptsUsed < exam.maxAttempts + (exception?.extraAttempts || 0);
    const canResume = currentAttempt?.status === 'in_progress';

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={() => { setSelectedExamCard(null); setExamCardData(null); setConfirmStart(false); }}>
        <div style={{
          width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto',
          background: 'linear-gradient(180deg, #0d1220 0%, #070a10 100%)',
          border: '1px solid rgba(197,159,78,0.3)', borderRadius: '8px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197,159,78,0.1)'
        }} onClick={e => e.stopPropagation()}>
          {!confirmStart ? (
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={sealStyle}>{'ᛉ'}</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff', letterSpacing: '0.05em' }}>{exam.subjectName}</h2>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.3rem' }}>{exam.title}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {[
                  ['Profesor', professor?.name || exam.professorName || '—'],
                  ['Dostęp', exam.accessStart ? `${formatDate(exam.accessStart)} ${formatTime(exam.accessStart)}–${formatTime(exam.accessEnd)}` : 'Brak ograniczenia'],
                  ['Limit czasu', `${exam.timeLimitMinutes} minut`],
                  ['Pytań', `${exam.totalQuestions || '—'}`],
                  ['Maks. punktów', `${exam.totalPoints || '—'}`],
                  ['Próg zaliczenia', `${exam.passingThreshold}%`],
                  ['Podejścia', `${attemptsUsed} / ${exam.maxAttempts + (exception?.extraAttempts || 0)}`],
                  ['Nawigacja', exam.navigationMode === 'free' ? 'Swobodna' : 'Sekwencyjna']
                ].map(([label, value], i) => (
                  <div key={i} style={{ background: 'rgba(6,9,14,0.7)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(142,202,230,0.1)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
              </div>

              {exam.instructions && (
                <div style={{ background: 'rgba(197,159,78,0.06)', border: '1px solid rgba(197,159,78,0.15)', borderRadius: '4px', padding: '0.8rem 1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>INSTRUKCJA PROFESORA</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.6 }}>{'„'}{exam.instructions}{'”'}</div>
                </div>
              )}

              {exception && (exception.extraMinutes > 0 || exception.extraAttempts > 0) && (
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', padding: '0.6rem 0.8rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#93c5fd' }}>
                  {'✦'} Indywidualny wyjątek: {exception.extraMinutes > 0 ? `+${exception.extraMinutes} minut` : ''} {exception.extraAttempts > 0 ? `+${exception.extraAttempts} podejść` : ''}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button className="btn-durmstrang-secondary" onClick={() => { setSelectedExamCard(null); setExamCardData(null); }} style={{ padding: '0.6rem 1.5rem' }}>ZAMKNIJ</button>
                {canResume && (
                  <button className="btn-durmstrang" onClick={() => navigateToExamTaking(currentAttempt.id)} style={{ padding: '0.6rem 1.5rem' }}>WZNOŹ EGZAMIN</button>
                )}
                {canStart && !canResume && (
                  <button className="btn-durmstrang" onClick={() => setConfirmStart(true)} style={{ padding: '0.6rem 1.5rem' }}>
                    ROZPOCZNIJ EGZAMIN
                  </button>
                )}
                {currentAttempt && ['submitted', 'auto_submitted', 'grading', 'graded', 'approved'].includes(currentAttempt.status) && (
                  <button className="btn-durmstrang" onClick={() => navigateToExamResult(currentAttempt.id)} style={{ padding: '0.6rem 1.5rem' }}>ZOBACZ WYNIK</button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{ ...sealStyle, width: 100, height: 100, fontSize: '2.8rem', border: '2px solid rgba(197,159,78,0.5)' }}>{'ᛉ'}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#fff', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>PIECZĘĆ TWIERDZY</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>SESJA EGZAMINACYJNA</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--gold-glow)', margin: '0.5rem 0', letterSpacing: '0.06em' }}>{exam.subjectName}</h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.5rem' }}>{currentUser?.class_year}</p>
              <div style={{ background: 'rgba(197,159,78,0.06)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                  Po rozpoczęciu egzaminu uruchomiony zostanie licznik <strong style={{ color: '#fff' }}>{exam.timeLimitMinutes} minut</strong>.
                  <br />Pieczęć zostanie złamana wraz z rozpoczęciem egzaminu.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button className="btn-durmstrang-secondary" onClick={() => setConfirmStart(false)} style={{ padding: '0.6rem 1.5rem' }}>ANULUJ</button>
                <button className="btn-durmstrang" onClick={() => handleStartExam(exam.id)} disabled={startingExam}
                  style={{ padding: '0.6rem 1.8rem', opacity: startingExam ? 0.6 : 1 }}>
                  {startingExam ? 'ŁAMANIE PIECZĘCI...' : 'ZŁAM PIECZĘĆ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (examHistory.length === 0) return <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Brak historii egzaminów.</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {examHistory.map(h => (
          <div key={h.id} className="gothic-card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: h.resultsPublished ? 'pointer' : 'default' }}
            onClick={() => h.resultsPublished && navigateToExamResult(h.id)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', letterSpacing: '0.04em' }}>{h.subjectName}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{h.examTitle} • {h.sessionName}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{formatDate(h.startedAt)}</div>
            </div>
            {h.resultsPublished ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: h.isPassing ? '#eab308' : '#ef4444' }}>{h.percentage}%</div>
                <div style={{ fontSize: '0.68rem', color: h.isPassing ? '#eab308' : '#ef4444', fontFamily: 'var(--font-heading)' }}>{h.gradeName}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#a855f7', fontFamily: 'var(--font-heading)' }}>OCZEKUJE</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'center', label: 'CENTRUM', icon: <ScrollText size={14} /> }
  ];
  if (currentUser?.role === 'student') tabs.push({ id: 'history', label: 'HISTORIA', icon: <Archive size={14} /> });
  if (isProfessor) tabs.push({ id: 'professor', label: 'PANEL PROFESORA', icon: <BookOpen size={14} /> });
  if (isAdmin) tabs.push({ id: 'admin', label: 'ADMINISTRACJA', icon: <Shield size={14} /> });

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>TWIERDZA MAGII DURMSTRANG</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#fff', letterSpacing: '0.06em', margin: '0.3rem 0' }}>CENTRUM EGZAMINACYJNE</h1>
        <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold-ancient), transparent)', margin: '0.5rem auto' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', overflowX: 'auto', padding: '0 0.5rem' }}>
        {tabs.map(t => (
          <button key={t.id} className={activeTab === t.id ? 'btn-durmstrang' : 'btn-durmstrang-secondary'}
            onClick={() => setActiveTab(t.id)}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.72rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{'⌛'}</div>
          Ładowanie centrum egzaminacyjnego...
        </div>
      ) : (
        <>
          {activeTab === 'center' && !isProfessor && renderStudentCenter()}
          {activeTab === 'center' && isProfessor && <ProfessorPanel currentUser={currentUser} navigateToExamCreator={navigateToExamCreator} navigateToExamGrading={navigateToExamGrading} navigateToExamBank={navigateToExamBank} />}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'professor' && isProfessor && <ProfessorPanel currentUser={currentUser} navigateToExamCreator={navigateToExamCreator} navigateToExamGrading={navigateToExamGrading} navigateToExamBank={navigateToExamBank} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel showNotification={showNotification} />}
        </>
      )}

      {renderExamCardModal()}
    </div>
  );
};
