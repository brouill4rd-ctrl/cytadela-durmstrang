import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ArrowLeft, ArrowRight, Save, Plus, Trash2, CheckCircle2,
  FileText, Clock, Settings, BookOpen, Eye, Award, Layers,
  ListOrdered, Shuffle, HelpCircle, Shield, Copy, Check
} from 'lucide-react';

const WIZARD_STEPS = [
  { step: 1, label: 'Informacje' },
  { step: 2, label: 'Termin i Czas' },
  { step: 3, label: 'Pytania i Sekcje' },
  { step: 4, label: 'Punktacja i Rubryki' },
  { step: 5, label: 'Zasady i Nawigacja' },
  { step: 6, label: 'Publikacja Wyników' },
  { step: 7, label: 'Podgląd i Zapis' }
];

export const ExamCreatorView = () => {
  const { activeExamId, navigateToExams, showNotification, currentUser, subjects: allSubjects } = useSchool();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBankModalOpen, setSelectedBankModalOpen] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchBankQuery, setSearchBankQuery] = useState('');

  // Form State
  const [examForm, setExamForm] = useState({
    id: null,
    sessionId: '',
    subjectId: 'czarna-magia',
    subjectName: 'Czarna Magia',
    title: '',
    description: '',
    classYear: 'Klasa II',
    instructions: '',
    accessStart: '',
    accessEnd: '',
    timeLimitMinutes: 60,
    endPolicy: 'soft_limit',
    maxAttempts: 1,
    passingThreshold: 40,
    navigationMode: 'free',
    shuffleQuestions: false,
    shuffleOptions: false,
    useRandomPool: false,
    randomEasy: 0,
    randomMedium: 0,
    randomHard: 0,
    randomVeryHard: 0,
    resultsVisibility: 'after_approval',
    resultsPublishDate: '',
    showAnswersAfter: false,
    showPointsAfter: true,
    showCorrectAnswers: false,
    showComments: true,
    status: 'draft',
    sections: [
      { id: 'sec-1', title: 'Część Główna', description: '', instructions: '', maxPoints: 100, sortOrder: 0 }
    ],
    examQuestions: [] // [ { id, questionId, question, sectionId, points, partialCredit, rubric } ]
  });

  // Load Sessions and existing Exam if editing
  useEffect(() => {
    (async () => {
      setLoading(true);
      const sessRes = await api.getExamSessions();
      if (sessRes.ok && sessRes.data) {
        setSessions(sessRes.data);
        if (!examForm.sessionId && sessRes.data.length > 0) {
          setExamForm(prev => ({ ...prev, sessionId: sessRes.data[0].id }));
        }
      }

      if (activeExamId) {
        const examRes = await api.getExam(activeExamId);
        if (examRes.ok && examRes.data) {
          const ex = examRes.data;
          setExamForm({
            ...ex,
            sections: ex.sections || [{ id: 'sec-1', title: 'Część Główna', description: '', instructions: '', maxPoints: 100, sortOrder: 0 }],
            examQuestions: ex.examQuestions || []
          });
        }
      }
      setLoading(false);
    })();
  }, [activeExamId]);

  // Load Bank Questions
  const loadBankQuestions = useCallback(async () => {
    const res = await api.getQuestions({
      subjectId: examForm.subjectId,
      difficulty: filterDifficulty || undefined,
      type: filterType || undefined,
      search: searchBankQuery || undefined
    });
    if (res.ok && res.data) {
      setBankQuestions(res.data);
    }
  }, [examForm.subjectId, filterDifficulty, filterType, searchBankQuery]);

  useEffect(() => {
    if (selectedBankModalOpen) {
      loadBankQuestions();
    }
  }, [selectedBankModalOpen, loadBankQuestions]);

  // Calculate Totals
  const totalExamPoints = examForm.examQuestions.reduce((acc, q) => acc + (Number(q.points) || 1), 0);
  const totalQuestionsCount = examForm.examQuestions.length;

  // Add Question from Bank
  const addQuestionFromBank = (q) => {
    if (examForm.examQuestions.some(eq => eq.questionId === q.id)) {
      showNotification('To pytanie jest już dodane do tego egzaminu.', 'warning');
      return;
    }
    const newEq = {
      id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      questionId: q.id,
      question: q,
      sectionId: examForm.sections[0]?.id || '',
      points: 10,
      partialCredit: 'none',
      sortOrder: examForm.examQuestions.length
    };
    setExamForm(prev => ({
      ...prev,
      examQuestions: [...prev.examQuestions, newEq]
    }));
    showNotification(`Dodano pytanie: ${q.content.slice(0, 40)}...`, 'success');
  };

  // Remove Question
  const removeQuestion = (eqId) => {
    setExamForm(prev => ({
      ...prev,
      examQuestions: prev.examQuestions.filter(q => q.id !== eqId)
    }));
  };

  // Save or Publish
  const handleSaveExam = async (status = 'draft') => {
    setLoading(true);
    const payload = {
      ...examForm,
      status,
      totalPoints: totalExamPoints,
      totalQuestions: totalQuestionsCount,
      professorId: currentUser?.id || 'usr-prof-01',
      professorName: currentUser?.fullName || 'Profesor Twierdzy'
    };

    let res;
    if (examForm.id) {
      res = await api.updateExam(examForm.id, payload);
    } else {
      res = await api.createExam(payload);
    }
    setLoading(false);

    if (res.ok) {
      showNotification(status === 'published' ? 'Egzamin został pomyślnie opublikowany!' : 'Szkic egzaminu został zapisany.', 'success');
      navigateToExams();
    } else {
      showNotification(res.error || 'Błąd podczas zapisywania egzaminu.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          className="btn-durmstrang-secondary"
          onClick={() => navigateToExams()}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} /> ANULUJ I WRÓĆ
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
            KREATOR SESJI I ARKUSZY
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#fff', letterSpacing: '0.04em' }}>
            {examForm.id ? 'EDYCJA EGZAMINU' : 'NOWY EGZAMIN PROFESORSKI'}
          </h1>
        </div>
        <button
          className="btn-durmstrang-secondary"
          onClick={() => handleSaveExam('draft')}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Save size={14} /> ZAPISZ SZKIC
        </button>
      </div>

      {/* Step Wizard Progress Bar */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '2rem', overflowX: 'auto', padding: '0.2rem 0' }}>
        {WIZARD_STEPS.map(s => {
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={isActive ? 'btn-durmstrang' : 'btn-durmstrang-secondary'}
              style={{
                flex: 1, padding: '0.5rem 0.3rem', fontSize: '0.72rem', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                opacity: isDone || isActive ? 1 : 0.6
              }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.step}.</span> {s.label}
            </button>
          );
        })}
      </div>

      {/* STEP 1: INFORMACJE */}
      {currentStep === 1 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem' }}>
            KROK 1: INFORMACJE PODSTAWOWE
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Sesja Egzaminacyjna:
              </label>
              <select
                className="gothic-input"
                value={examForm.sessionId}
                onChange={e => setExamForm(p => ({ ...p, sessionId: e.target.value }))}>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.schoolYear})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Katedra / Przedmiot:
              </label>
              <select
                className="gothic-input"
                value={examForm.subjectId}
                onChange={e => {
                  const subj = (allSubjects || []).find(s => s.id === e.target.value);
                  setExamForm(p => ({ ...p, subjectId: e.target.value, subjectName: subj?.name || e.target.value }));
                }}>
                {(allSubjects || []).filter(s => s.isActive !== false).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Tytuł Egzaminu:
              </label>
              <input
                className="gothic-input"
                placeholder="np. Egzamin Końcowy — Czarna Magia Klasa II"
                value={examForm.title}
                onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Klasa / Rocznik:
              </label>
              <select
                className="gothic-input"
                value={examForm.classYear}
                onChange={e => setExamForm(p => ({ ...p, classYear: e.target.value }))}>
                <option value="Klasa I">Klasa I</option>
                <option value="Klasa II">Klasa II</option>
                <option value="Klasa III">Klasa III</option>
                <option value="Klasa IV">Klasa IV</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Oficjalna Instrukcja Profesora dla Uczniów:
            </label>
            <textarea
              className="gothic-textarea"
              rows={3}
              placeholder="np. Egzamin obejmuje materiał z zakresu teorii klątw oraz glifów ochronnych..."
              value={examForm.instructions}
              onChange={e => setExamForm(p => ({ ...p, instructions: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* STEP 2: TERMIN I CZAS */}
      {currentStep === 2 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem' }}>
            KROK 2: HARMONOGRAM I LIMIT CZASU
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Początek okna dostępności:
              </label>
              <input
                type="datetime-local"
                className="gothic-input"
                value={examForm.accessStart ? examForm.accessStart.replace(' ', 'T').slice(0, 16) : ''}
                onChange={e => setExamForm(p => ({ ...p, accessStart: e.target.value.replace('T', ' ') + ':00' }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Koniec okna dostępności:
              </label>
              <input
                type="datetime-local"
                className="gothic-input"
                value={examForm.accessEnd ? examForm.accessEnd.replace(' ', 'T').slice(0, 16) : ''}
                onChange={e => setExamForm(p => ({ ...p, accessEnd: e.target.value.replace('T', ' ') + ':00' }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Limit Czasu (minuty):
              </label>
              <input
                type="number"
                min="5" max="300"
                className="gothic-input"
                value={examForm.timeLimitMinutes}
                onChange={e => setExamForm(p => ({ ...p, timeLimitMinutes: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Liczba Podejść:
              </label>
              <input
                type="number"
                min="1" max="5"
                className="gothic-input"
                value={examForm.maxAttempts}
                onChange={e => setExamForm(p => ({ ...p, maxAttempts: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Próg Zaliczenia (%):
              </label>
              <input
                type="number"
                min="0" max="100"
                className="gothic-input"
                value={examForm.passingThreshold}
                onChange={e => setExamForm(p => ({ ...p, passingThreshold: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PYTANIA I SEKCJE */}
      {currentStep === 3 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem' }}>
                KROK 3: STRUKTURA PYTAŃ I SEKCJE
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Pytań: {totalQuestionsCount} • Maksymalnie: {totalExamPoints} pkt
              </div>
            </div>
            <button
              className="btn-durmstrang"
              onClick={() => setSelectedBankModalOpen(true)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={14} /> DODAJ Z BANKU PYTAŃ
            </button>
          </div>

          {/* List of Added Questions */}
          {examForm.examQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(197,159,78,0.2)', borderRadius: '6px', color: '#64748b' }}>
              <p>Ten egzamin nie zawiera jeszcze żadnych pytań.</p>
              <button className="btn-durmstrang-secondary" onClick={() => setSelectedBankModalOpen(true)} style={{ marginTop: '0.8rem' }}>
                Otwórz Bank Pytań
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {examForm.examQuestions.map((eq, idx) => (
                <div key={eq.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.8rem 1rem', background: 'rgba(10,14,22,0.6)',
                  borderRadius: '6px', border: '1px solid rgba(142,202,230,0.1)'
                }}>
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontSize: '0.85rem', width: 24 }}>
                    {idx + 1}.
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {eq.question?.content || 'Treść pytania'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Typ: {eq.question?.type} • Trudność: {eq.question?.difficulty}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1" max="100"
                      className="gothic-input"
                      value={eq.points}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setExamForm(p => ({
                          ...p,
                          examQuestions: p.examQuestions.map(q => q.id === eq.id ? { ...q, points: val } : q)
                        }));
                      }}
                      style={{ width: 60, textAlign: 'center', padding: '0.3rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>pkt</span>
                    <button
                      className="btn-durmstrang-secondary"
                      onClick={() => removeQuestion(eq.id)}
                      style={{ padding: '0.35rem 0.5rem', color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: PUNKTACJA I RUBRYKI */}
      {currentStep === 4 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem' }}>
            KROK 4: PUNKTACJA I CZĘŚCIOWE PUNKTY
          </h3>

          <div style={{ background: 'rgba(6,9,14,0.7)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Suma Punktów Arkusza</div>
              <div style={{ fontSize: '1.4rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>{totalExamPoints} pkt</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Pytań Otwarte / Zadaniowe</div>
              <div style={{ fontSize: '1.1rem', color: '#fff' }}>
                {examForm.examQuestions.filter(eq => eq.question?.type === 'open_text').length}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Dla pytań wielokrotnego wyboru oraz dopasowywania system stosuje proporcjonalne przyznawanie punktów cząstkowych. Pytania otwarte oceniane są ręcznie przez profesora według przypisanych kryteriów.
          </p>
        </div>
      )}

      {/* STEP 5: ZASADY I NAWIGACJA */}
      {currentStep === 5 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem' }}>
            KROK 5: REGULACJE I TRYB NAWIGACJI
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              onClick={() => setExamForm(p => ({ ...p, navigationMode: 'free' }))}
              style={{
                padding: '1rem', borderRadius: '6px', cursor: 'pointer',
                background: examForm.navigationMode === 'free' ? 'rgba(197,159,78,0.12)' : 'rgba(10,14,22,0.5)',
                border: examForm.navigationMode === 'free' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)'
              }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', marginBottom: '0.3rem' }}>
                TRYB SWOBODNY (Zalecany)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Uczeń może swobodnie wracać do pytań, zmieniać odpowiedzi i oznaczać pytania flagą.
              </div>
            </div>

            <div
              onClick={() => setExamForm(p => ({ ...p, navigationMode: 'sequential' }))}
              style={{
                padding: '1rem', borderRadius: '6px', cursor: 'pointer',
                background: examForm.navigationMode === 'sequential' ? 'rgba(197,159,78,0.12)' : 'rgba(10,14,22,0.5)',
                border: examForm.navigationMode === 'sequential' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)'
              }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: '#fff', marginBottom: '0.3rem' }}>
                TRYB SEKWENCYJNY
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Po przejściu do kolejnego pytania uczeń nie może cofnąć się do wcześniejszych pozycji.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={examForm.shuffleQuestions}
                onChange={e => setExamForm(p => ({ ...p, shuffleQuestions: e.target.checked }))}
              />
              Losowa kolejność pytań dla każdego ucznia
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={examForm.shuffleOptions}
                onChange={e => setExamForm(p => ({ ...p, shuffleOptions: e.target.checked }))}
              />
              Losowa kolejność wariantów odpowiedzi w pytaniach
            </label>
          </div>
        </div>
      )}

      {/* STEP 6: PUBLIKACJA WYNIKÓW */}
      {currentStep === 6 && (
        <div className="gothic-card" style={{ padding: '1.8rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem' }}>
            KROK 6: ZASADY WIDOCZNOŚCI WYNIKÓW
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Kiedy uczeń widzi wynik:
            </label>
            <select
              className="gothic-input"
              value={examForm.resultsVisibility}
              onChange={e => setExamForm(p => ({ ...p, resultsVisibility: e.target.value }))}>
              <option value="after_approval">Po zatwierdzeniu przez profesora (Domyślne)</option>
              <option value="immediate">Natychmiast po oddaniu (dla pytań autosprawdzalnych)</option>
              <option value="scheduled">W wyznaczonym dniu i godzinie</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={examForm.showAnswersAfter}
                onChange={e => setExamForm(p => ({ ...p, showAnswersAfter: e.target.checked }))}
              />
              Pozwól uczniowi przeglądać oddane odpowiedzi po publikacji
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={examForm.showComments}
                onChange={e => setExamForm(p => ({ ...p, showComments: e.target.checked }))}
              />
              Pokaż komentarze i wskazówki sprawdzającego profesora
            </label>
          </div>
        </div>
      )}

      {/* STEP 7: PODGLĄD I ZAPIS */}
      {currentStep === 7 && (
        <div className="gothic-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: 'rgba(197,159,78,0.15)',
            border: '2px solid var(--gold-ancient)', margin: '0 auto 1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--gold-glow)'
          }}>
            {'ᛉ'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff', letterSpacing: '0.05em' }}>
            {examForm.title || 'Nowy Egzamin'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            {examForm.subjectName} • {examForm.classYear} • Limit: {examForm.timeLimitMinutes} min • Pytań: {totalQuestionsCount} • Razem: {totalExamPoints} pkt
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              className="btn-durmstrang-secondary"
              onClick={() => handleSaveExam('draft')}
              style={{ padding: '0.7rem 1.8rem' }}>
              ZAPISZ JAKO SZKIC
            </button>
            <button
              className="btn-durmstrang"
              onClick={() => handleSaveExam('published')}
              style={{ padding: '0.7rem 2.2rem', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderColor: '#34d399' }}>
              OPUBLIKUJ EGZAMIN
            </button>
          </div>
        </div>
      )}

      {/* Bottom Step Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <button
          className="btn-durmstrang-secondary"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
          style={{ padding: '0.55rem 1.4rem', opacity: currentStep === 1 ? 0.3 : 1 }}>
          <ArrowLeft size={14} /> POPRZEDNI KROK
        </button>

        {currentStep < 7 && (
          <button
            className="btn-durmstrang"
            onClick={() => setCurrentStep(p => Math.min(7, p + 1))}
            style={{ padding: '0.55rem 1.6rem' }}>
            DALEJ <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Modal: Bank Pytań Selector */}
      {selectedBankModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedBankModalOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 780, maxHeight: '85vh', overflow: 'auto',
            background: 'linear-gradient(180deg, #0d1220 0%, #070a10 100%)',
            border: '1px solid rgba(197,159,78,0.35)', borderRadius: '8px', padding: '1.8rem',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.15rem' }}>
                BANK PYTAŃ — {examForm.subjectName.toUpperCase()}
              </h3>
              <button className="btn-durmstrang-secondary" onClick={() => setSelectedBankModalOpen(false)} style={{ padding: '0.3rem 0.6rem' }}>
                ZAMKNIJ
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
              <input
                className="gothic-input"
                placeholder="Szukaj w treści pytań..."
                value={searchBankQuery}
                onChange={e => setSearchBankQuery(e.target.value)}
              />
              <select
                className="gothic-input"
                value={filterDifficulty}
                onChange={e => setFilterDifficulty(e.target.value)}>
                <option value="">Wszystkie trudności</option>
                <option value="easy">Łatwe</option>
                <option value="medium">Średnie</option>
                <option value="hard">Trudne</option>
              </select>
              <select
                className="gothic-input"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}>
                <option value="">Wszystkie typy</option>
                <option value="single_choice">Jednokrotny wybór</option>
                <option value="multi_choice">Wielokrotny wybór</option>
                <option value="true_false">Prawda/Fałsz</option>
                <option value="short_answer">Krótka odpowiedź</option>
                <option value="open_text">Odpowiedź otwarta</option>
                <option value="matching">Dopasowywanie</option>
                <option value="ordering">Kolejność</option>
                <option value="fill_gaps">Uzupełnianie luk</option>
              </select>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 400, overflowY: 'auto' }}>
              {bankQuestions.map(q => {
                const isAdded = examForm.examQuestions.some(eq => eq.questionId === q.id);
                return (
                  <div key={q.id} className="gothic-card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', color: '#fff', lineHeight: 1.4 }}>{q.content}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                        Typ: {q.type} • Trudność: {q.difficulty} {q.tags?.length > 0 && `• Tagi: ${q.tags.join(', ')}`}
                      </div>
                    </div>
                    <button
                      className={isAdded ? 'btn-durmstrang-secondary' : 'btn-durmstrang'}
                      disabled={isAdded}
                      onClick={() => addQuestionFromBank(q)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', flexShrink: 0 }}>
                      {isAdded ? 'DODANE' : '+ DODAJ'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
