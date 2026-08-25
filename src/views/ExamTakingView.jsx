import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  Clock, Flag, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight,
  Shield, Send, Wifi, WifiOff, FileText, Sparkles, Image as ImageIcon,
  HelpCircle, ChevronUp, ChevronDown, Check, RefreshCw
} from 'lucide-react';

const sealStyle = {
  background: 'radial-gradient(ellipse at center, rgba(197,159,78,0.2) 0%, transparent 70%)',
  border: '2px solid rgba(197,159,78,0.4)',
  borderRadius: '50%',
  width: 90, height: 90,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '2.5rem', margin: '0 auto 1.2rem',
  boxShadow: '0 0 40px rgba(197,159,78,0.2), inset 0 0 25px rgba(0,0,0,0.6)',
  color: 'var(--gold-glow)'
};

export const ExamTakingView = () => {
  const { activeExamAttemptId, navigateToExams, navigateToExamResult, showNotification } = useSchool();

  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [eqId]: { answerText, selectedOptions, matchingPairs, ordering, fillGaps } }
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'offline' | 'error'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const pendingSavesRef = useRef({});
  const saveTimeoutRef = useRef(null);

  // Load Attempt Data
  const loadAttempt = useCallback(async () => {
    if (!activeExamAttemptId) return;
    setLoading(true);
    const res = await api.getExamAttempt(activeExamAttemptId);
    if (res.ok && res.data) {
      setAttemptData(res.data);
      const initialAnswers = {};
      (res.data.answers || []).forEach(a => {
        initialAnswers[a.examQuestionId] = {
          answerText: a.answerText || '',
          selectedOptions: a.selectedOptions || [],
          matchingPairs: a.matchingPairs || {},
          ordering: a.ordering || [],
          fillGaps: a.fillGaps || []
        };
      });
      setAnswers(initialAnswers);
      setFlagged(new Set(res.data.flaggedQuestions || []));

      if (['submitted', 'auto_submitted', 'grading', 'graded', 'approved'].includes(res.data.status)) {
        setIsSubmitted(true);
        setSubmittedData(res.data);
      }
    } else {
      showNotification(res.error || 'Nie udało się pobrać arkusza egzaminacyjnego.', 'error');
    }
    setLoading(false);
  }, [activeExamAttemptId, showNotification]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('saving');
      // Flush pending saves
      Object.entries(pendingSavesRef.current).forEach(([eqId, data]) => {
        saveAnswerToServer(eqId, data);
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Server-Synchronized Timer Countdown
  useEffect(() => {
    if (!attemptData || isSubmitted || !attemptData.timeExpiresAt) return;

    const calcTimeLeft = () => {
      const expiresAt = new Date(attemptData.timeExpiresAt.replace(' ', 'T')).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      return diff;
    };

    setTimeLeftSec(calcTimeLeft());

    const interval = setInterval(() => {
      const remaining = calcTimeLeft();
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptData, isSubmitted]);

  // Auto-Submit on Timer Expiry
  const handleAutoSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setSaveStatus('saving');
    const res = await api.submitExamAttempt(activeExamAttemptId);
    setIsSubmitting(false);
    if (res.ok) {
      setIsSubmitted(true);
      setSubmittedData(res.data);
      showNotification('Czas minął. Egzamin został automatycznie zapieczętowany i oddany.', 'info');
    }
  };

  // Debounced Autosave to Backend
  const saveAnswerToServer = async (eqId, ansData) => {
    if (!navigator.onLine) {
      pendingSavesRef.current[eqId] = ansData;
      setSaveStatus('offline');
      return;
    }
    setSaveStatus('saving');
    try {
      const res = await api.saveExamAnswer(activeExamAttemptId, {
        examQuestionId: eqId,
        ...ansData
      });
      if (res.ok) {
        delete pendingSavesRef.current[eqId];
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleUpdateAnswer = (eqId, updates) => {
    const nextAns = {
      ...(answers[eqId] || { answerText: '', selectedOptions: [], matchingPairs: {}, ordering: [], fillGaps: [] }),
      ...updates
    };
    setAnswers(prev => ({ ...prev, [eqId]: nextAns }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswerToServer(eqId, nextAns);
    }, 600);
  };

  // Toggle Flag Question for Review
  const toggleFlagQuestion = async (eqId) => {
    const isCurrentlyFlagged = flagged.has(eqId);
    const newFlagged = new Set(flagged);
    if (isCurrentlyFlagged) newFlagged.delete(eqId);
    else newFlagged.add(eqId);
    setFlagged(newFlagged);

    await api.flagExamQuestion(activeExamAttemptId, {
      examQuestionId: eqId,
      isFlagged: !isCurrentlyFlagged
    });
  };

  // Manual Final Submission
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    const res = await api.submitExamAttempt(activeExamAttemptId);
    setIsSubmitting(false);
    setConfirmSubmitOpen(false);
    if (res.ok) {
      setIsSubmitted(true);
      setSubmittedData(res.data);
      showNotification('Arkusz egzaminacyjny został pomyślnie oddany i zapieczętowany!', 'success');
    } else {
      showNotification(res.error || 'Błąd podczas oddawania egzaminu.', 'error');
    }
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds) => {
    if (seconds == null) return '--:--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 3s linear infinite' }}>{'ᛟ'}</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', letterSpacing: '0.06em' }}>OTWIERANIE ZAPISÓW EGZAMINACYJNYCH...</h2>
        <p style={{ fontSize: '0.85rem' }}>Trwa synchronizacja arkusza z pieczęcią Twierdzy Durmstrang.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="gothic-card" style={{ padding: '3rem 2rem', border: '1px solid rgba(197,159,78,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(197,159,78,0.15)' }}>
          <div style={sealStyle}>{'ᛉ'}</div>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            PROTOKÓŁ ZAMKNIĘTY
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: '#fff', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            ARKUSZ ZAPYSANY I ODDANY
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '2rem' }}>
            Twój egzamin został oficjalnie zapieczętowany pieczęcią Cytadeli Durmstrang i przekazany profesorowi do weryfikacji.
          </p>

          <div style={{ background: 'rgba(6,9,14,0.8)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '6px', padding: '1.2rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Przedmiot</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{attemptData?.exam?.subjectName || 'Czarna Magia'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Godzina Oddania</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gold-ancient)' }}>
                {submittedData?.submittedAt ? submittedData.submittedAt.slice(11, 16) : new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Liczba Pytań</div>
              <div style={{ fontSize: '0.9rem', color: '#fff' }}>{attemptData?.questions?.length || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Status Weryfikacji</div>
              <div style={{ fontSize: '0.85rem', color: '#a855f7', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
                OCZEKUJE NA SPRAWDZENIE
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-durmstrang-secondary" onClick={() => navigateToExams()} style={{ padding: '0.7rem 1.8rem' }}>
              POWRÓT DO CENTRUM
            </button>
            {submittedData?.id && (
              <button className="btn-durmstrang" onClick={() => navigateToExamResult(submittedData.id)} style={{ padding: '0.7rem 1.8rem' }}>
                PODGLĄD PROTOKOŁU
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { exam, sections, questions } = attemptData || { exam: {}, sections: [], questions: [] };
  const currentQ = questions[currentIdx] || null;
  const currentEqId = currentQ?.examQuestionId;
  const currentAns = answers[currentEqId] || { answerText: '', selectedOptions: [], matchingPairs: {}, ordering: [], fillGaps: [] };
  const currentSec = sections.find(s => s.id === currentQ?.sectionId);

  const isFreeNav = exam?.navigationMode !== 'sequential';
  const totalQuestions = questions.length;

  // Check which questions are answered
  const isQuestionAnswered = (q) => {
    const a = answers[q.examQuestionId];
    if (!a) return false;
    if (q.type === 'single_choice' || q.type === 'true_false' || q.type === 'image_choice') {
      return a.selectedOptions?.length > 0;
    }
    if (q.type === 'multi_choice') {
      return a.selectedOptions?.length > 0;
    }
    if (q.type === 'short_answer' || q.type === 'open_text') {
      return !!a.answerText?.trim();
    }
    if (q.type === 'matching') {
      return Object.keys(a.matchingPairs || {}).length > 0;
    }
    if (q.type === 'ordering') {
      return a.ordering?.length > 0;
    }
    if (q.type === 'fill_gaps') {
      return a.fillGaps?.some(g => !!g?.trim());
    }
    return false;
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flagged.size;

  // Timer urgency color
  const getTimerColor = () => {
    if (timeLeftSec == null) return '#94a3b8';
    if (timeLeftSec <= 60) return '#ef4444'; // < 1 min (czerwony)
    if (timeLeftSec <= 300) return '#f97316'; // < 5 min (pomarańczowy)
    if (timeLeftSec <= 600) return '#f59e0b'; // < 10 min (złoto-żółty)
    return 'var(--gold-ancient)';
  };

  // Question renderers
  const renderQuestionBody = () => {
    if (!currentQ) return null;

    switch (currentQ.type) {
      case 'single_choice':
      case 'true_false':
      case 'image_choice': {
        const selectedId = currentAns.selectedOptions?.[0] || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' }}>
            {currentQ.options?.map((opt, idx) => {
              const isSelected = selectedId === opt.id;
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={opt.id}
                  onClick={() => handleUpdateAnswer(currentEqId, { selectedOptions: [opt.id] })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '0.85rem 1.1rem', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? 'rgba(197,159,78,0.12)' : 'rgba(10,14,22,0.6)',
                    border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(142,202,230,0.12)',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontSize: '0.85rem',
                    background: isSelected ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#000' : '#94a3b8',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)'
                  }}>
                    {isSelected ? <Check size={16} /> : letter}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.5 }}>
                    {opt.content}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'multi_choice': {
        const selectedSet = new Set(currentAns.selectedOptions || []);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ice-frost)', fontStyle: 'italic', marginBottom: '0.2rem' }}>
              ✦ Zaznacz wszystkie poprawne odpowiedzi (może być więcej niż jedna):
            </div>
            {currentQ.options?.map((opt, idx) => {
              const isSelected = selectedSet.has(opt.id);
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={opt.id}
                  onClick={() => {
                    const next = new Set(selectedSet);
                    if (isSelected) next.delete(opt.id);
                    else next.add(opt.id);
                    handleUpdateAnswer(currentEqId, { selectedOptions: Array.from(next) });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '0.85rem 1.1rem', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? 'rgba(197,159,78,0.12)' : 'rgba(10,14,22,0.6)',
                    border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(142,202,230,0.12)',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '4px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#000' : '#94a3b8',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)'
                  }}>
                    {isSelected ? <Check size={16} /> : <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>{letter}</span>}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.5 }}>
                    {opt.content}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'short_answer': {
        return (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
              Twoja odpowiedź (zwięzły zapis):
            </label>
            <input
              type="text"
              className="gothic-input"
              placeholder="Wpisz odpowiedź..."
              value={currentAns.answerText || ''}
              onChange={(e) => handleUpdateAnswer(currentEqId, { answerText: e.target.value })}
              style={{ width: '100%', fontSize: '1rem', padding: '0.8rem 1rem' }}
            />
          </div>
        );
      }

      case 'open_text': {
        return (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                Rozwiązanie / Odpowiedź opisowa:
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Znaków: {(currentAns.answerText || '').length}
              </span>
            </div>
            <textarea
              className="gothic-textarea"
              rows={8}
              placeholder="Rozwiń swoją myśl, opisując szczegółowo procedurę, zaklęcia i uzasadnienie..."
              value={currentAns.answerText || ''}
              onChange={(e) => handleUpdateAnswer(currentEqId, { answerText: e.target.value })}
              style={{ width: '100%', fontSize: '0.92rem', lineHeight: 1.6, padding: '0.9rem' }}
            />
          </div>
        );
      }

      case 'matching': {
        const pairs = currentAns.matchingPairs || {};
        const availableTargets = (currentQ.options || []).map(o => o.matchTarget).filter(Boolean);
        return (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ice-frost)', fontStyle: 'italic' }}>
              ✦ Dopasuj odpowiednie pojęcia z prawej kolumny do elementów po lewej:
            </div>
            {currentQ.options?.map((opt) => (
              <div key={opt.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', background: 'rgba(10,14,22,0.5)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid rgba(142,202,230,0.1)' }}>
                <div style={{ fontSize: '0.9rem', color: '#fff' }}>{opt.content}</div>
                <select
                  className="gothic-input"
                  value={pairs[opt.id] || ''}
                  onChange={(e) => {
                    const nextPairs = { ...pairs, [opt.id]: e.target.value };
                    handleUpdateAnswer(currentEqId, { matchingPairs: nextPairs });
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                  <option value="">-- Wybierz dopasowanie --</option>
                  {availableTargets.map((target, idx) => (
                    <option key={idx} value={target}>{target}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      }

      case 'ordering': {
        const currentOrder = currentAns.ordering?.length > 0
          ? currentAns.ordering
          : (currentQ.options || []).map(o => o.id);

        const moveItem = (fromIdx, toIdx) => {
          if (toIdx < 0 || toIdx >= currentOrder.length) return;
          const updated = [...currentOrder];
          const [moved] = updated.splice(fromIdx, 1);
          updated.splice(toIdx, 0, moved);
          handleUpdateAnswer(currentEqId, { ordering: updated });
        };

        const optionMap = new Map((currentQ.options || []).map(o => [o.id, o.content]));

        return (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ice-frost)', fontStyle: 'italic', marginBottom: '0.3rem' }}>
              ✦ Użyj strzałek, aby ułożyć elementy w prawidłowej kolejności od pierwszego (góra) do ostatniego (dół):
            </div>
            {currentOrder.map((optId, idx) => (
              <div key={optId} style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.75rem 1rem', background: 'rgba(10,14,22,0.7)',
                borderRadius: '6px', border: '1px solid rgba(197,159,78,0.2)'
              }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold-ancient)', width: 24 }}>
                  {idx + 1}.
                </span>
                <div style={{ flex: 1, fontSize: '0.9rem', color: '#e2e8f0' }}>
                  {optionMap.get(optId) || 'Element'}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    className="btn-durmstrang-secondary"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Przesuń wyżej">
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="btn-durmstrang-secondary"
                    disabled={idx === currentOrder.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Przesuń niżej">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'fill_gaps': {
        const parts = currentQ.content.split(/\[(.*?)\]/g);
        const gapsAnswers = currentAns.fillGaps || [];
        let gapCounter = 0;

        return (
          <div style={{ marginTop: '1.5rem', background: 'rgba(10,14,22,0.6)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(142,202,230,0.15)', lineHeight: 2.2, fontSize: '1rem', color: '#e2e8f0' }}>
            {parts.map((part, pIdx) => {
              if (pIdx % 2 === 1) {
                const currentGapIdx = gapCounter++;
                return (
                  <input
                    key={pIdx}
                    type="text"
                    className="gothic-input"
                    placeholder={`[luka ${currentGapIdx + 1}]`}
                    value={gapsAnswers[currentGapIdx] || ''}
                    onChange={(e) => {
                      const updated = [...gapsAnswers];
                      updated[currentGapIdx] = e.target.value;
                      handleUpdateAnswer(currentEqId, { fillGaps: updated });
                    }}
                    style={{
                      display: 'inline-block', width: 140, margin: '0 0.4rem',
                      padding: '0.3rem 0.6rem', fontSize: '0.9rem', textAlign: 'center',
                      borderColor: gapsAnswers[currentGapIdx] ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Exam Header Bar (Distraction-Free) */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(13,18,32,0.98) 0%, rgba(7,10,16,0.98) 100%)',
        border: '1px solid rgba(197,159,78,0.25)',
        borderRadius: '8px',
        padding: '0.9rem 1.4rem',
        marginBottom: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(197,159,78,0.12)', border: '1px solid var(--gold-ancient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: 'var(--gold-glow)'
          }}>
            {'ᛉ'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#fff', letterSpacing: '0.04em' }}>
              {exam.subjectName || exam.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {exam.title} {exam.classYear && `• ${exam.classYear}`}
            </div>
          </div>
        </div>

        {/* Center: Autosave Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--ice-frost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Zapisywanie...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} /> Zapisano
            </span>
          )}
          {saveStatus === 'offline' && (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <WifiOff size={13} /> Brak połączenia (synchronizacja po odzyskaniu)
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={13} /> Błąd zapisu
            </span>
          )}
        </div>

        {/* Right: Server-Synchronized Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '6px',
          border: `1px solid ${getTimerColor()}44`
        }}>
          <Clock size={16} color={getTimerColor()} />
          <div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
              POZOSTAŁY CZAS
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700,
              color: getTimerColor(), letterSpacing: '0.05em'
            }}>
              {formatTimer(timeLeftSec)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Examination Grid (Sidebar Navigation + Question View) */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.2rem', alignItems: 'start' }}>
        {/* Left: Questions Navigation Matrix */}
        <div className="gothic-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: '#fff', letterSpacing: '0.06em' }}>
              ARKUSZ PYTAŃ
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)' }}>
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          {/* Grid of Question Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '1.2rem' }}>
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAns = isQuestionAnswered(q);
              const isFlag = flagged.has(q.examQuestionId);
              const disabled = !isFreeNav && idx > currentIdx && !isAns;

              let bgColor = 'rgba(255,255,255,0.04)';
              let borderColor = 'rgba(255,255,255,0.1)';
              let textColor = '#94a3b8';

              if (isCurrent) {
                borderColor = 'var(--gold-ancient)';
                bgColor = 'rgba(197,159,78,0.2)';
                textColor = '#fff';
              } else if (isAns) {
                borderColor = 'rgba(16,185,129,0.4)';
                bgColor = 'rgba(16,185,129,0.1)';
                textColor = '#10b981';
              }

              return (
                <button
                  key={q.examQuestionId}
                  disabled={disabled}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    padding: '0.55rem 0.2rem', borderRadius: '4px',
                    background: bgColor, border: `1px solid ${borderColor}`,
                    color: textColor, fontFamily: 'var(--font-heading)',
                    fontSize: '0.78rem', cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1, position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px'
                  }}>
                  {String(idx + 1).padStart(2, '0')}
                  {isFlag && <span style={{ color: '#f59e0b', fontSize: '0.65rem' }}>⚑</span>}
                  {!isFlag && isAns && <span style={{ color: '#10b981', fontSize: '0.65rem' }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Odpowiedziano ({answeredCount})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>—</span> Brak odpowiedzi ({unansweredCount})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#f59e0b' }}>⚑</span> Oznaczono do powrotu ({flaggedCount})
            </div>
          </div>

          <button
            className="btn-durmstrang"
            onClick={() => setConfirmSubmitOpen(true)}
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Send size={14} /> ODDAJ EGZAMIN
          </button>
        </div>

        {/* Right: Active Question Card */}
        <div className="gothic-card" style={{ padding: '1.8rem', minHeight: 480, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {currentQ ? (
            <div>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(197,159,78,0.15)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <div>
                  {currentSec && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      {currentSec.title}
                    </div>
                  )}
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', letterSpacing: '0.04em' }}>
                    PYTANIE {currentIdx + 1} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {totalQuestions}</span>
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', background: 'rgba(197,159,78,0.1)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(197,159,78,0.25)', fontFamily: 'var(--font-heading)' }}>
                    {currentQ.points} {currentQ.points === 1 ? 'pkt' : 'pkt'}
                  </span>
                  <button
                    onClick={() => toggleFlagQuestion(currentEqId)}
                    style={{
                      background: flagged.has(currentEqId) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                      border: flagged.has(currentEqId) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)',
                      color: flagged.has(currentEqId) ? '#f59e0b' : '#94a3b8',
                      padding: '0.35rem 0.7rem', borderRadius: '4px', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer'
                    }}>
                    <Flag size={13} /> {flagged.has(currentEqId) ? 'OZNACZONE' : 'OZNACZ DO POWROTU'}
                  </button>
                </div>
              </div>

              {/* Supplementary Material Banner (if any) */}
              {currentQ.supplementaryMaterial && (
                <div style={{ background: 'rgba(197,159,78,0.06)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.8rem 1rem', borderRadius: '4px', marginBottom: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                    MATERIAŁ ŹRÓDŁOWY / FRAGMENT
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {currentQ.supplementaryMaterial}
                  </div>
                </div>
              )}

              {/* Image illustration (if any) */}
              {currentQ.mediaUrl && (
                <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                  <img
                    src={currentQ.mediaUrl}
                    alt="Materiał ilustracyjny do pytania"
                    style={{ maxHeight: 220, maxWidth: '100%', borderRadius: '6px', border: '1px solid rgba(197,159,78,0.3)', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}
                  />
                </div>
              )}

              {/* Question Content */}
              {currentQ.type !== 'fill_gaps' && (
                <div style={{ fontSize: '1.05rem', color: '#f3f4f6', lineHeight: 1.6, fontWeight: 500 }}>
                  {currentQ.content}
                </div>
              )}

              {/* Interactive Answers Component */}
              {renderQuestionBody()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Brak pytania.</div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', marginTop: '2rem' }}>
            <button
              className="btn-durmstrang-secondary"
              disabled={currentIdx === 0 || !isFreeNav}
              onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
              style={{ padding: '0.55rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: currentIdx === 0 || !isFreeNav ? 0.3 : 1 }}>
              <ArrowLeft size={15} /> POPRZEDNIE
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                className="btn-durmstrang"
                onClick={() => setCurrentIdx(p => Math.min(totalQuestions - 1, p + 1))}
                style={{ padding: '0.55rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                NASTĘPNE <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="btn-durmstrang"
                onClick={() => setConfirmSubmitOpen(true)}
                style={{ padding: '0.55rem 1.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderColor: '#34d399' }}>
                <Send size={15} /> ODDAJ EGZAMIN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Final Submit */}
      {confirmSubmitOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmSubmitOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 480, background: 'linear-gradient(180deg, #0d1220 0%, #070a10 100%)',
            border: '1px solid rgba(197,159,78,0.35)', borderRadius: '8px', padding: '2rem',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 30px rgba(197,159,78,0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <div style={{ ...sealStyle, width: 70, height: 70, fontSize: '1.8rem', marginBottom: '0.8rem' }}>{'ᛉ'}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', letterSpacing: '0.05em' }}>
                ZAPIECZĘTOWAĆ I ODDAĆ ARKUSZ?
              </h3>
            </div>

            <div style={{ background: 'rgba(6,9,14,0.7)', border: '1px solid rgba(142,202,230,0.1)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Odpowiedziano:</span>
                <strong style={{ color: '#10b981' }}>{answeredCount} / {totalQuestions}</strong>
              </div>
              {unansweredCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#ef4444' }}>⚠ Bez odpowiedzi:</span>
                  <strong style={{ color: '#ef4444' }}>{unansweredCount}</strong>
                </div>
              )}
              {flaggedCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#f59e0b' }}>⚑ Oznaczone do powrotu:</span>
                  <strong style={{ color: '#f59e0b' }}>{flaggedCount}</strong>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Po oddaniu egzaminu arkusz zostanie trwale zablokowany przed dalszą edycją i przekazany profesorowi.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                className="btn-durmstrang-secondary"
                disabled={isSubmitting}
                onClick={() => setConfirmSubmitOpen(false)}
                style={{ padding: '0.6rem 1.4rem' }}>
                WRÓĆ DO ARKUSZA
              </button>
              <button
                className="btn-durmstrang"
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                style={{ padding: '0.6rem 1.6rem', opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? 'PIECZĘTOWANIE...' : 'ZATWIERDŹ I ODDAJ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
