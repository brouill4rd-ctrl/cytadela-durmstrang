import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  Award, CheckCircle, XCircle, AlertCircle, ArrowLeft,
  ScrollText, MessageSquare, BookOpen, Clock, Shield, Sparkles
} from 'lucide-react';

const sealStyle = {
  background: 'radial-gradient(ellipse at center, rgba(197,159,78,0.25) 0%, transparent 70%)',
  border: '2px solid rgba(197,159,78,0.45)',
  borderRadius: '50%',
  width: 100, height: 100,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '2.8rem', margin: '0 auto 1.2rem',
  boxShadow: '0 0 50px rgba(197,159,78,0.25), inset 0 0 30px rgba(0,0,0,0.6)',
  color: 'var(--gold-glow)'
};

export const ExamResultView = () => {
  const { activeExamAttemptId, navigateToExams, showNotification } = useSchool();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadResult = useCallback(async () => {
    if (!activeExamAttemptId) return;
    setLoading(true);
    const res = await api.getStudentExamResult(activeExamAttemptId);
    if (res.ok && res.data) {
      setResultData(res.data);
    } else {
      showNotification(res.error || 'Nie udało się pobrać wyników egzaminu.', 'error');
    }
    setLoading(false);
  }, [activeExamAttemptId, showNotification]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 3s linear infinite' }}>{'ᛟ'}</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', letterSpacing: '0.06em' }}>ODCZYTYWANIE PROTOKOŁU WYNIKÓW...</h2>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center', color: '#64748b' }}>
        <p>Nie odnaleziono wyników wybranego podejścia.</p>
        <button className="btn-durmstrang-secondary" onClick={() => navigateToExams()} style={{ marginTop: '1rem' }}>
          POWRÓT DO CENTRUM
        </button>
      </div>
    );
  }

  const { attempt, exam, sections, answers, isPublished } = resultData;

  if (!isPublished) {
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="gothic-card" style={{ padding: '3rem 2rem' }}>
          <div style={sealStyle}>{'⌛'}</div>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: '#a855f7', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            PROTOKÓŁ W TOKU WERYFIKACJI
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#fff', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            {exam.subjectName || exam.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
            Twój arkusz został oddany i oczekuje na sprawdzenie pytań otwartych lub oficjalną publikację ocen przez profesora Katedry.
          </p>
          <button className="btn-durmstrang" onClick={() => navigateToExams()} style={{ padding: '0.7rem 1.8rem' }}>
            POWRÓT DO CENTRUM EGZAMINACYJNEGO
          </button>
        </div>
      </div>
    );
  }

  const isPassing = attempt.isPassing;
  const gradeColor = isPassing ? '#eab308' : '#ef4444';

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Back to Center Button */}
      <div style={{ marginBottom: '1.2rem' }}>
        <button
          className="btn-durmstrang-secondary"
          onClick={() => navigateToExams()}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> POWRÓT DO CENTRUM EGZAMINACYJNEGO
        </button>
      </div>

      {/* Monumental Result Seal Card */}
      <div className="gothic-card" style={{
        padding: '2.5rem 2rem', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(13,18,32,0.98) 0%, rgba(6,9,14,0.98) 100%)',
        border: '1px solid rgba(197,159,78,0.35)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(197,159,78,0.15)',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.25em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
          TWIERDZA MAGII DURMSTRANG • OFICJALNY PROTOKÓŁ
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: '#fff', letterSpacing: '0.06em', margin: '0.3rem 0' }}>
          {exam.subjectName || exam.title}
        </h1>
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.8rem' }}>
          {exam.title} {exam.classYear && `• ${exam.classYear}`}
        </div>

        {/* Big Score Display */}
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: 'rgba(0,0,0,0.6)', border: `2px solid ${gradeColor}55`,
          borderRadius: '12px', padding: '1.5rem 3rem', marginBottom: '1.8rem',
          boxShadow: `0 0 40px ${gradeColor}22`
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 700, color: gradeColor, lineHeight: 1 }}>
            {attempt.percentage}%
          </div>
          <div style={{ fontSize: '1.1rem', color: '#fff', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', marginTop: '0.4rem' }}>
            {attempt.gradeName || (isPassing ? 'ZALICZONY' : 'NIEZALICZONY')}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            Zdobyte punkty: <strong style={{ color: '#fff' }}>{attempt.totalScore}</strong> / {attempt.maxScore} pkt
          </div>
        </div>

        {/* Section Breakdown Grid */}
        {sections && sections.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: '0.8rem',
            textAlign: 'left', background: 'rgba(6,9,14,0.6)', padding: '1.2rem', borderRadius: '8px',
            border: '1px solid rgba(142,202,230,0.1)'
          }}>
            {sections.map((sec, idx) => {
              const secAns = answers.filter(a => a.sectionId === sec.id);
              const secScore = secAns.reduce((acc, a) => acc + (a.finalScore || 0), 0);
              const secMax = secAns.reduce((acc, a) => acc + (a.maxScore || 0), 0);
              return (
                <div key={sec.id} style={{ borderLeft: '2px solid var(--gold-ancient)', paddingLeft: '0.8rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                    Część {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, margin: '2px 0' }}>
                    {sec.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
                    {secScore} / {secMax || sec.maxPoints} pkt
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Professor Comment (if any) */}
        {attempt.professorComment && (
          <div style={{
            marginTop: '1.5rem', background: 'rgba(197,159,78,0.06)',
            border: '1px solid rgba(197,159,78,0.2)', borderRadius: '6px',
            padding: '1.2rem', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)', marginBottom: '0.4rem' }}>
              <MessageSquare size={14} /> KOMENTARZ PROFESORA
            </div>
            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.6 }}>
              {'„'}{attempt.professorComment}{'”'}
            </div>
          </div>
        )}
      </div>

      {/* Answers Review (If Exam Policy Allows) */}
      {exam.showAnswersAfter && answers && answers.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <BookOpen size={18} color="var(--gold-ancient)" />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff', letterSpacing: '0.05em' }}>
              PRZEGLĄD ODPOWIEDZI
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {answers.map((ans, idx) => {
              const isFullCredit = (ans.finalScore || 0) === (ans.maxScore || 0) && (ans.maxScore || 0) > 0;
              const isPartial = (ans.finalScore || 0) > 0 && (ans.finalScore || 0) < (ans.maxScore || 0);

              return (
                <div key={ans.id} className="gothic-card" style={{
                  padding: '1.4rem',
                  borderLeft: `3px solid ${isFullCredit ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)' }}>
                      PYTANIE {idx + 1}
                    </div>
                    {exam.showPointsAfter && (
                      <span style={{
                        fontSize: '0.82rem', fontFamily: 'var(--font-heading)',
                        color: isFullCredit ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444',
                        background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.6rem', borderRadius: '4px',
                        border: `1px solid ${isFullCredit ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}44`
                      }}>
                        {ans.finalScore} / {ans.maxScore} pkt
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.8rem', lineHeight: 1.5 }}>
                    {ans.questionContent}
                  </div>

                  {/* Student Answer */}
                  <div style={{ background: 'rgba(6,9,14,0.6)', padding: '0.8rem 1rem', borderRadius: '4px', marginBottom: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                      Twoja odpowiedź:
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                      {ans.answerText || (ans.selectedOptions?.length > 0 ? `Wybrane opcje: ${ans.selectedOptions.join(', ')}` : 'Brak odpowiedzi')}
                    </div>
                  </div>

                  {/* Professor Feedback / Notes on this answer */}
                  {exam.showComments && ans.professorComment && (
                    <div style={{ background: 'rgba(197,159,78,0.05)', padding: '0.6rem 0.9rem', borderRadius: '4px', borderLeft: '2px solid var(--gold-ancient)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
                        Uwagi sprawdzającego:
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                        {ans.professorComment}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
