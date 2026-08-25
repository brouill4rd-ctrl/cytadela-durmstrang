import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  BookOpen, Plus, Search, Filter, Edit3, Trash2, Copy,
  ArrowLeft, CheckCircle2, HelpCircle, Layers, Tag
} from 'lucide-react';

export const ExamBankView = () => {
  const { navigateToExams, showNotification, currentUser } = useSchool();

  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('czarna-magia');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterType, setFilterType] = useState('');

  // Create / Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState({
    id: null,
    subjectId: 'czarna-magia',
    categoryId: '',
    type: 'single_choice',
    content: '',
    explanation: '',
    difficulty: 'medium',
    tags: [],
    mediaUrl: '',
    mediaType: '',
    supplementaryMaterial: '',
    correctShortAnswers: [],
    fillGapsAnswers: [],
    options: [
      { id: 'opt-1', content: '', isCorrect: true, matchTarget: '', sortOrder: 0 },
      { id: 'opt-2', content: '', isCorrect: false, matchTarget: '', sortOrder: 1 }
    ]
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const catRes = await api.getQuestionBankCategories(selectedSubject);
    if (catRes.ok && catRes.data) setCategories(catRes.data);

    const qRes = await api.getQuestions({
      subjectId: selectedSubject,
      categoryId: selectedCategory || undefined,
      difficulty: filterDifficulty || undefined,
      type: filterType || undefined,
      search: searchQuery || undefined
    });
    if (qRes.ok && qRes.data) setQuestions(qRes.data);
    setLoading(false);
  }, [selectedSubject, selectedCategory, filterDifficulty, filterType, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingQuestion({
      id: null,
      subjectId: selectedSubject,
      categoryId: selectedCategory || '',
      type: 'single_choice',
      content: '',
      explanation: '',
      difficulty: 'medium',
      tags: [],
      mediaUrl: '',
      mediaType: '',
      supplementaryMaterial: '',
      correctShortAnswers: [],
      fillGapsAnswers: [],
      options: [
        { id: 'opt-1', content: '', isCorrect: true, matchTarget: '', sortOrder: 0 },
        { id: 'opt-2', content: '', isCorrect: false, matchTarget: '', sortOrder: 1 },
        { id: 'opt-3', content: '', isCorrect: false, matchTarget: '', sortOrder: 2 },
        { id: 'opt-4', content: '', isCorrect: false, matchTarget: '', sortOrder: 3 }
      ]
    });
    setEditModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion.content.trim()) {
      showNotification('Wpisz treść pytania.', 'warning');
      return;
    }
    let res;
    if (editingQuestion.id) {
      res = await api.updateQuestion(editingQuestion.id, editingQuestion);
    } else {
      res = await api.createQuestion(editingQuestion);
    }
    if (res.ok) {
      showNotification('Pytanie zostało zapisane w Banku Pytań.', 'success');
      setEditModalOpen(false);
      loadData();
    } else {
      showNotification(res.error || 'Błąd zapisu pytania.', 'error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to pytanie z banku?')) return;
    const res = await api.deleteQuestion(id);
    if (res.ok) {
      showNotification('Pytanie usunięte.', 'info');
      loadData();
    } else {
      showNotification(res.error || 'Błąd usuwania pytania.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          className="btn-durmstrang-secondary"
          onClick={() => navigateToExams()}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={14} /> POWRÓT DO CENTRUM
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
            REZYDENCJA PROFESORSKA
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#fff', letterSpacing: '0.04em' }}>
            BANK PYTAŃ CYTADELI
          </h1>
        </div>
        <button
          className="btn-durmstrang"
          onClick={handleOpenCreate}
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={14} /> NOWE PYTANIE
        </button>
      </div>

      {/* Filter Matrix */}
      <div className="gothic-card" style={{ padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', gap: '0.6rem' }}>
          <select
            className="gothic-input"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}>
            <option value="czarna-magia">Czarna Magia</option>
            <option value="eliksiry">Eliksiry</option>
            <option value="starozytne-runy">Starożytne Runy</option>
            <option value="transmutacja">Transmutacja</option>
            <option value="obrona-przed-czarna-magia">Obrona Przed Czarną Magią</option>
          </select>

          <input
            className="gothic-input"
            placeholder="Szukaj po treści lub tagach..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
      </div>

      {/* Questions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Ładowanie pytań...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Brak pytań spełniających podane kryteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="gothic-card" style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontSize: '0.85rem', width: 24 }}>
                {idx + 1}.
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', color: '#fff', lineHeight: 1.4 }}>{q.content}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                  Typ: <strong style={{ color: 'var(--gold-ancient)' }}>{q.type}</strong> • Trudność: {q.difficulty}
                  {q.tags?.length > 0 && ` • Tagi: ${q.tags.join(', ')}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className="btn-durmstrang-secondary"
                  onClick={() => { setEditingQuestion(q); setEditModalOpen(true); }}
                  style={{ padding: '0.35rem 0.6rem' }} title="Edytuj">
                  <Edit3 size={13} />
                </button>
                <button
                  className="btn-durmstrang-secondary"
                  onClick={() => handleDeleteQuestion(q.id)}
                  style={{ padding: '0.35rem 0.6rem', color: '#ef4444' }} title="Usuń">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Question */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setEditModalOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 680, maxHeight: '85vh', overflow: 'auto',
            background: 'linear-gradient(180deg, #0d1220 0%, #070a10 100%)',
            border: '1px solid rgba(197,159,78,0.35)', borderRadius: '8px', padding: '1.8rem',
            boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.15rem' }}>
                {editingQuestion.id ? 'EDYCJA PYTANIA' : 'NOWE PYTANIE W BANKU'}
              </h3>
              <button className="btn-durmstrang-secondary" onClick={() => setEditModalOpen(false)} style={{ padding: '0.3rem 0.6rem' }}>
                ZAMKNIJ
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                  Typ Pytania:
                </label>
                <select
                  className="gothic-input"
                  value={editingQuestion.type}
                  onChange={e => setEditingQuestion(p => ({ ...p, type: e.target.value }))}>
                  <option value="single_choice">Jednokrotny wybór</option>
                  <option value="multi_choice">Wielokrotny wybór</option>
                  <option value="true_false">Prawda / Fałsz</option>
                  <option value="short_answer">Krótka odpowiedź</option>
                  <option value="open_text">Odpowiedź otwarta (praktyczna)</option>
                  <option value="matching">Dopasowywanie</option>
                  <option value="ordering">Ustawianie kolejności</option>
                  <option value="fill_gaps">Uzupełnianie luk</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                  Trudność:
                </label>
                <select
                  className="gothic-input"
                  value={editingQuestion.difficulty}
                  onChange={e => setEditingQuestion(p => ({ ...p, difficulty: e.target.value }))}>
                  <option value="easy">Łatwe</option>
                  <option value="medium">Średnie</option>
                  <option value="hard">Trudne</option>
                  <option value="very_hard">Bardzo Trudne</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Treść Pytania:
              </label>
              <textarea
                className="gothic-textarea"
                rows={3}
                placeholder="Wpisz treść pytania..."
                value={editingQuestion.content}
                onChange={e => setEditingQuestion(p => ({ ...p, content: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Wyjaśnienie / Klucz Odpowiedzi dla Profesora:
              </label>
              <textarea
                className="gothic-textarea"
                rows={2}
                placeholder="Notatki i uzasadnienie poprawnej odpowiedzi..."
                value={editingQuestion.explanation}
                onChange={e => setEditingQuestion(p => ({ ...p, explanation: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button className="btn-durmstrang-secondary" onClick={() => setEditModalOpen(false)} style={{ padding: '0.5rem 1.2rem' }}>
                ANULUJ
              </button>
              <button className="btn-durmstrang" onClick={handleSaveQuestion} style={{ padding: '0.5rem 1.5rem' }}>
                ZAPISZ PYTANIE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
