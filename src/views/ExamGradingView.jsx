import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ArrowLeft, CheckCircle2, Clock, Eye, MessageSquare, Award,
  Shield, Check, AlertCircle, Save, Send, Users, Activity, Plus
} from 'lucide-react';

export const ExamGradingView = () => {
  const { activeExamId, navigateToExams, showNotification } = useSchool();

  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'monitor' | 'stats'
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [gradingScores, setGradingScores] = useState({}); // { [ansId]: { manualScore, professorComment, rubricScores } }
  const [overallComment, setOverallComment] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [monitorData, setMonitorData] = useState(null);

  // Load Overview
  const loadOverview = useCallback(async () => {
    if (!activeExamId) return;
    setLoading(true);
    const res = await api.getExamGradingOverview(activeExamId);
    if (res.ok && res.data) {
      setOverviewData(res.data);
    }
    setLoading(false);
  }, [activeExamId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Load Monitor Data if on monitor tab
  useEffect(() => {
    if (activeTab === 'monitor' && activeExamId) {
      (async () => {
        const res = await api.monitorExam(activeExamId);
        if (res.ok && res.data) setMonitorData(res.data);
      })();
    }
  }, [activeTab, activeExamId]);

  // Open single submission for grading
  const openAttemptGrading = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    const res = await api.getExamGradingAttempt(attemptId);
    if (res.ok && res.data) {
      setAttemptDetail(res.data);
      setOverallComment(res.data.attempt?.professorComment || '');
      const scores = {};
      (res.data.answers || []).forEach(a => {
        scores[a.id] = {
          manualScore: a.manualScore !== null ? a.manualScore : a.autoScore || 0,
          professorComment: a.professorComment || '',
          rubricScores: a.rubricScores || {}
        };
      });
      setGradingScores(scores);
    }
  };

  // Grade single answer
  const handleSaveAnswerScore = async (answerId) => {
    const sc = gradingScores[answerId];
    if (!sc) return;
    await api.gradeExamAnswer(answerId, {
      manualScore: Number(sc.manualScore),
      professorComment: sc.professorComment,
      rubricScores: sc.rubricScores
    });
    showNotification('Zapisano ocenę pytania.', 'success');
  };

  // Approve Full Final Grade
  const handleApproveGrade = async () => {
    if (!selectedAttemptId) return;
    setSavingGrade(true);
    const res = await api.approveExamResult(selectedAttemptId, {
      professorComment: overallComment
    });
    setSavingGrade(false);
    if (res.ok) {
      showNotification('Ocena egzaminu została oficjalnie zatwierdzona!', 'success');
      setSelectedAttemptId(null);
      setAttemptDetail(null);
      loadOverview();
    } else {
      showNotification(res.error || 'Błąd zatwierdzania oceny.', 'error');
    }
  };

  // Mass Publish
  const handlePublishAll = async () => {
    if (!window.confirm('Czy na pewno chcesz opublikować wyniki dla wszystkich ocenionych prac w tym egzaminie?')) return;
    const res = await api.publishAllExamResults(activeExamId);
    if (res.ok) {
      showNotification('Wyniki zostały opublikowane dla uczniów!', 'success');
      loadOverview();
    }
  };

  // Add 10 Minutes Emergency Extension
  const handleExtendEmergency = async (attemptId = null) => {
    if (attemptId) {
      await api.extendAttemptTime(attemptId, { extraMinutes: 10, reason: 'Awaria techniczna / decyzja profesora' });
      showNotification('Dodano +10 minut dla wybranego adepta.', 'success');
    } else {
      await api.extendExamTimeAll(activeExamId, { extraMinutes: 10, reason: 'Ogólne przedłużenie czasu dla wszystkich aktywnych' });
      showNotification('Dodano +10 minut dla wszystkich aktywnych adeptów.', 'success');
    }
    // Refresh monitor
    const res = await api.monitorExam(activeExamId);
    if (res.ok) setMonitorData(res.data);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Ładowanie panelu sprawdzania...</div>;
  }

  const { exam, attempts = [], stats } = overviewData || { exam: {}, attempts: [], stats: {} };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <button
          className="btn-durmstrang-secondary"
          onClick={() => navigateToExams()}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} /> POWRÓT DO CENTRUM
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
            PANEL SPRAWDZAJĄCY PROFESORA
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#fff', letterSpacing: '0.04em' }}>
            {exam.subjectName || exam.title}
          </h1>
        </div>
        <button
          className="btn-durmstrang"
          onClick={handlePublishAll}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Send size={13} /> OPUBLIKUJ WYNIKI
        </button>
      </div>

      {/* Overview Metric Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div className="gothic-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Oddano Prac</div>
          <div style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {attempts.filter(a => ['submitted', 'auto_submitted', 'grading', 'graded', 'approved'].includes(a.status)).length}
          </div>
        </div>
        <div className="gothic-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Sprawdzono</div>
          <div style={{ fontSize: '1.4rem', color: '#10b981', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {attempts.filter(a => a.status === 'approved' || a.status === 'graded').length}
          </div>
        </div>
        <div className="gothic-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Do Sprawdzenia</div>
          <div style={{ fontSize: '1.4rem', color: '#f59e0b', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted' || a.status === 'grading').length}
          </div>
        </div>
        <div className="gothic-card" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Średni Wynik</div>
          <div style={{ fontSize: '1.4rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {stats?.averagePercentage ? `${stats.averagePercentage}%` : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem' }}>
        <button
          className={activeTab === 'submissions' ? 'btn-durmstrang' : 'btn-durmstrang-secondary'}
          onClick={() => setActiveTab('submissions')}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem' }}>
          PRACE UCZNIÓW ({attempts.length})
        </button>
        <button
          className={activeTab === 'monitor' ? 'btn-durmstrang' : 'btn-durmstrang-secondary'}
          onClick={() => setActiveTab('monitor')}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Activity size={13} /> NADZÓR NA ŻYWO
        </button>
      </div>

      {/* TAB: SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {attempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>Brak nadesłanych prac dla tego egzaminu.</div>
          ) : (
            attempts.map(att => {
              const isGraded = att.status === 'approved' || att.status === 'graded';
              return (
                <div key={att.id} className="gothic-card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: '#fff' }}>
                      {att.studentName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      Oddano: {att.submittedAt ? att.submittedAt.slice(11, 16) : 'W trakcie'} • Auto: {att.autoScore} pkt
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                    <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: isGraded ? '#10b981' : '#f59e0b' }}>
                      {att.totalScore} / {att.maxScore} pkt
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isGraded ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                      {isGraded ? (att.gradeName || 'ZATWIERDZONY') : 'DO SPRAWDZENIA'}
                    </div>
                  </div>
                  <button
                    className="btn-durmstrang"
                    onClick={() => openAttemptGrading(att.id)}
                    style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={13} /> {isGraded ? 'PRZEGLĄDAJ' : 'SPRAWDŹ'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: MONITOR */}
      {activeTab === 'monitor' && (
        <div className="gothic-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1rem' }}>
              AKTYWNE PODEJŚCIA W TOKU
            </h3>
            <button
              className="btn-durmstrang-secondary"
              onClick={() => handleExtendEmergency(null)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Plus size={13} /> +10 MINUT DLA WSZYSTKICH
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(monitorData?.activeAttempts || []).length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Brak adeptów aktualnie rozwiązujących ten arkusz.</p>
            ) : (
              (monitorData?.activeAttempts || []).map(att => (
                <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6,9,14,0.6)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid rgba(142,202,230,0.1)' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{att.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Rozpoczęto: {att.startedAt?.slice(11, 16)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gold-ancient)', fontFamily: 'monospace' }}>
                      Wygasa: {att.timeExpiresAt?.slice(11, 16)}
                    </span>
                    <button
                      className="btn-durmstrang-secondary"
                      onClick={() => handleExtendEmergency(att.id)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
                      +10 MIN
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Full Student Attempt Grading Sheet */}
      {selectedAttemptId && attemptDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setSelectedAttemptId(null); setAttemptDetail(null); }}>
          <div style={{
            width: '100%', maxWidth: 840, maxHeight: '90vh', overflow: 'auto',
            background: 'linear-gradient(180deg, #0d1220 0%, #070a10 100%)',
            border: '1px solid rgba(197,159,78,0.35)', borderRadius: '8px', padding: '2rem',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(197,159,78,0.2)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff' }}>
                  SPRAWDZANIE: {attemptDetail.attempt?.studentName}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {attemptDetail.exam?.subjectName} • {attemptDetail.exam?.title}
                </div>
              </div>
              <button className="btn-durmstrang-secondary" onClick={() => { setSelectedAttemptId(null); setAttemptDetail(null); }} style={{ padding: '0.4rem 0.8rem' }}>
                ZAMKNIJ
              </button>
            </div>

            {/* List of answers to grade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
              {(attemptDetail.answers || []).map((ans, idx) => {
                const sc = gradingScores[ans.id] || { manualScore: ans.manualScore || 0, professorComment: '' };
                const isOpen = ans.questionType === 'open_text';

                return (
                  <div key={ans.id} className="gothic-card" style={{ padding: '1.2rem', borderLeft: isOpen ? '3px solid var(--gold-ancient)' : '3px solid rgba(142,202,230,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)' }}>
                        PYTANIE {idx + 1} ({ans.questionType})
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Maksymalnie: {ans.maxScore} pkt
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', color: '#fff', marginBottom: '0.8rem', lineHeight: 1.4 }}>
                      {ans.questionContent}
                    </div>

                    {/* Student Response */}
                    <div style={{ background: 'rgba(6,9,14,0.7)', padding: '0.8rem 1rem', borderRadius: '4px', marginBottom: '0.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                        Odpowiedź adepta:
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                        {ans.answerText || (ans.selectedOptions?.length > 0 ? `Wybrano: ${ans.selectedOptions.join(', ')}` : 'Brak odpowiedzi')}
                      </div>
                    </div>

                    {/* Answer Key / Criteria for Professor */}
                    {ans.explanation && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                        Klucz / Wytyczne: {ans.explanation}
                      </div>
                    )}

                    {/* Grading Controls */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(197,159,78,0.06)', padding: '0.8rem', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Punkty:</span>
                        <input
                          type="number"
                          min="0" max={ans.maxScore}
                          className="gothic-input"
                          value={sc.manualScore}
                          onChange={e => setGradingScores(p => ({
                            ...p,
                            [ans.id]: { ...sc, manualScore: Number(e.target.value) }
                          }))}
                          style={{ width: 60, textAlign: 'center', padding: '0.3rem' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/ {ans.maxScore}</span>
                      </div>

                      <input
                        type="text"
                        className="gothic-input"
                        placeholder="Komentarz do tego pytania..."
                        value={sc.professorComment}
                        onChange={e => setGradingScores(p => ({
                          ...p,
                          [ans.id]: { ...sc, professorComment: e.target.value }
                        }))}
                        style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                      />

                      <button
                        className="btn-durmstrang-secondary"
                        onClick={() => handleSaveAnswerScore(ans.id)}
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem' }}>
                        ZAPISZ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Professor Feedback */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Ogólny Komentarz i Podsumowanie Egzaminu:
              </label>
              <textarea
                className="gothic-textarea"
                rows={3}
                placeholder="np. Bardzo dobra analiza taktyczna i rzetelna znajomość kanonu..."
                value={overallComment}
                onChange={e => setOverallComment(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button className="btn-durmstrang-secondary" onClick={() => { setSelectedAttemptId(null); setAttemptDetail(null); }} style={{ padding: '0.6rem 1.4rem' }}>
                ANULUJ
              </button>
              <button
                className="btn-durmstrang"
                disabled={savingGrade}
                onClick={handleApproveGrade}
                style={{ padding: '0.6rem 1.8rem', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderColor: '#34d399' }}>
                {savingGrade ? 'ZATWIERDZANIE...' : 'ZATWIERDŹ OCENĘ FINALNĄ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
