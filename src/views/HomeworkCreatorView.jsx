import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '../components/RichTextEditor';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Send,
  Sparkles,
  Shield,
  Layers,
  FileText,
  Paperclip,
  Link2,
  Award,
  Star,
  Copy,
  Eye,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const HomeworkCreatorView = () => {
  const {
    currentUser,
    subjects,
    lessons,
    createHomeworkAssignment,
    homeworkDraftLessonData,
    createHomeworkTemplate,
    setActiveView,
    showNotification
  } = useSchool();

  // For professors: only show subjects they actually teach
  const availableSubjects = currentUser?.role === 'professor' && currentUser?.taughtSubjects?.length > 0
    ? subjects.filter(s => currentUser.taughtSubjects.includes(s.id))
    : subjects;

  const { playRuneChime, playWandSwoosh } = useSound();

  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    assignmentNumber: 1,
    type: 'homework', // 'homework', 'essay', 'practical', 'report', 'analysis', 'project', 'extra', 'optional'
    subjectId: 'czarna-magia',
    subjectName: 'Czarna Magia',
    classYear: 'Klasa II',
    schoolYear: 'XVII Rok Szkolny',
    lessonId: '',
    lessonTitle: '',
    description: '',
    instructions: '',
    requirements: [
      { text: 'Objętość: 300–500 słów' },
      { text: 'Odwołanie do materiału z lekcji' },
      { text: 'Samodzielne uzasadnienie stanowiska' }
    ],
    resources: [],
    submissionTypes: ['text', 'file'],
    publishDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    allowLate: true,
    lateDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    latePenaltyPoints: 0,
    revisionAllowed: true,
    revisionDueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxPoints: 20,
    gradingType: 'rubric', // 'points', 'rubric'
    rubric: [
      { id: 'crit-1', name: 'Poprawność merytoryczna', maxPoints: 8, description: 'Zgodność z kanonem i wiedzą z lekcji' },
      { id: 'crit-2', name: 'Argumentacja i uzasadnienie', maxPoints: 5, description: 'Logika wywodu i obrona stanowiska' },
      { id: 'crit-3', name: 'Wykorzystanie materiału', maxPoints: 4, description: 'Odwołania do terminologii i kronik' },
      { id: 'crit-4', name: 'Forma i stylistyka', maxPoints: 3, description: 'Akapity, styl wypowiedzi' }
    ],
    isOptional: false,
    isGroup: false
  });

  // Resource input state
  const [newResTitle, setNewResTitle] = useState('');
  const [newResType, setNewResType] = useState('note');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResDesc, setNewResDesc] = useState('');
  const [showAddResource, setShowAddResource] = useState(false);

  // Requirement input state
  const [newReqText, setNewReqText] = useState('');

  // Auto-fill from lesson data if opened from Journal
  useEffect(() => {
    if (homeworkDraftLessonData) {
      const { lesson, template } = homeworkDraftLessonData;
      if (lesson) {
        setFormData(prev => ({
          ...prev,
          subjectId: lesson.subjectId || prev.subjectId,
          subjectName: lesson.subjectName || prev.subjectName,
          classYear: lesson.classYear || prev.classYear,
          lessonId: lesson.id || '',
          lessonTitle: lesson.topic || lesson.title || '',
          title: `Zadanie: ${lesson.topic || lesson.title || 'Wyprawcowanie'}`
        }));
      }
      if (template) {
        setFormData(prev => ({
          ...prev,
          title: template.title || prev.title,
          type: template.type || prev.type,
          description: template.description || prev.description,
          instructions: template.instructions || prev.instructions,
          requirements: template.requirements?.length ? template.requirements : prev.requirements,
          rubric: template.rubric?.length ? template.rubric : prev.rubric,
          submissionTypes: template.submissionTypes?.length ? template.submissionTypes : prev.submissionTypes
        }));
      }
    }
  }, [homeworkDraftLessonData]);

  const handleSubjectChange = (subjId) => {
    const s = subjects.find(sub => sub.id === subjId);
    setFormData(prev => ({
      ...prev,
      subjectId: subjId,
      subjectName: s ? s.name : subjId
    }));
  };

  // Requirement handlers
  const handleAddRequirement = () => {
    if (!newReqText.trim()) return;
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, { text: newReqText.trim() }]
    }));
    setNewReqText('');
    playRuneChime();
  };

  const handleRemoveRequirement = (idx) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== idx)
    }));
  };

  // Resource handlers
  const handleAddResource = () => {
    if (!newResTitle.trim()) return;
    const resItem = {
      id: `res-${Date.now()}`,
      title: newResTitle.trim(),
      type: newResType,
      url: newResUrl.trim(),
      description: newResDesc.trim()
    };
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, resItem]
    }));
    setNewResTitle('');
    setNewResUrl('');
    setNewResDesc('');
    setShowAddResource(false);
    playRuneChime();
  };

  const handleRemoveResource = (id) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(r => r.id !== id)
    }));
  };

  // Rubric handlers
  const handleAddRubricCriterion = () => {
    const newCrit = {
      id: `crit-${Date.now()}`,
      name: 'Nowe kryterium',
      maxPoints: 5,
      description: 'Opis kryterium oceny'
    };
    setFormData(prev => {
      const newRubric = [...prev.rubric, newCrit];
      const sumPoints = newRubric.reduce((sum, c) => sum + (parseInt(c.maxPoints) || 0), 0);
      return {
        ...prev,
        rubric: newRubric,
        maxPoints: sumPoints
      };
    });
  };

  const handleUpdateRubricCriterion = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.rubric];
      updated[idx] = { ...updated[idx], [field]: val };
      const sumPoints = updated.reduce((sum, c) => sum + (parseInt(c.maxPoints) || 0), 0);
      return {
        ...prev,
        rubric: updated,
        maxPoints: sumPoints
      };
    });
  };

  const handleRemoveRubricCriterion = (idx) => {
    setFormData(prev => {
      const updated = prev.rubric.filter((_, i) => i !== idx);
      const sumPoints = updated.reduce((sum, c) => sum + (parseInt(c.maxPoints) || 0), 0);
      return {
        ...prev,
        rubric: updated,
        maxPoints: sumPoints
      };
    });
  };

  // Submission types toggle
  const toggleSubmissionType = (typeKey) => {
    setFormData(prev => {
      const exists = prev.submissionTypes.includes(typeKey);
      const updated = exists
        ? prev.submissionTypes.filter(t => t !== typeKey)
        : [...prev.submissionTypes, typeKey];
      return { ...prev, submissionTypes: updated.length > 0 ? updated : ['text'] };
    });
  };

  // Save as template
  const handleSaveAsTemplate = async () => {
    await createHomeworkTemplate({
      title: formData.title || 'Szablon Pracy Domowej',
      category: formData.type,
      type: formData.type,
      description: formData.description,
      instructions: formData.instructions,
      requirements: formData.requirements,
      rubric: formData.rubric,
      submissionTypes: formData.submissionTypes
    });
  };

  const returnView = homeworkDraftLessonData?.returnView || 'homework';

  // Final Publish
  const handlePublishHomework = async () => {
    if (!formData.title.trim()) {
      showNotification('Brak Tytułu', 'Wprowadź tytuł zadania domowego.', 'error');
      setCurrentStep(1);
      return;
    }

    setIsPublishing(true);
    try {
      playWandSwoosh();
      await createHomeworkAssignment(formData);
      setActiveView(returnView);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="homework-creator-container">
      {/* Creator Top Nav */}
      <div className="creator-top-bar">
        <button
          className="tmd-back-btn"
          onClick={() => {
            playWandSwoosh();
            setActiveView(returnView);
          }}
        >
          <ArrowLeft size={16} />
          <span>Anuluj & Powrót do Centrum</span>
        </button>

        <div className="creator-title-block">
          <span className="creator-step-tag">KREATOR PRAC DOMOWYCH • KROK {currentStep} Z 6</span>
          <h2 className="creator-step-heading">
            {currentStep === 1 && 'Krok 1: Podstawowe Informacje i Klasa'}
            {currentStep === 2 && 'Krok 2: Treść Zadania, Wymagania i Materiały'}
            {currentStep === 3 && 'Krok 3: Sposób Oddania Pracy'}
            {currentStep === 4 && 'Krok 4: Terminy, Spóźnienia i Poprawy'}
            {currentStep === 5 && 'Krok 5: Ocenianie, Rubryka i Punkty Zakonu'}
            {currentStep === 6 && 'Krok 6: Podgląd jako Uczeń & Publikacja'}
          </h2>
        </div>

        <div className="creator-step-progress-dots">
          {[1, 2, 3, 4, 5, 6].map(st => (
            <button
              key={st}
              className={`step-dot ${currentStep === st ? 'active' : ''} ${currentStep > st ? 'completed' : ''}`}
              onClick={() => setCurrentStep(st)}
              title={`Krok ${st}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Main Content Body */}
      <div className="creator-step-card">
        {/* =========================================================================
            KROK 1: PODSTAWOWE INFORMACJE
            ========================================================================= */}
        {currentStep === 1 && (
          <div className="step-section">
            <div className="form-group-grid">
              <div className="form-field full-width">
                <label>Tytuł pracy domowej *</label>
                <input
                  type="text"
                  placeholder="np. Granice magii krwi — analiza konsekwencji etycznych"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="tmd-input"
                />
              </div>

              <div className="form-field">
                <label>Przedmiot *</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="tmd-select"
                >
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {currentUser?.role === 'professor' && availableSubjects.length === 0 && (
                  <span className="field-hint-warn">Brak przypisanych przedmiotów. Skontaktuj się z Dyrekcją.</span>
                )}
              </div>

              <div className="form-field">
                <label>Rodzaj pracy</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="tmd-select"
                >
                  <option value="homework">Praca domowa</option>
                  <option value="essay">Esej</option>
                  <option value="practical">Zadanie praktyczne</option>
                  <option value="report">Raport laboratoryjny</option>
                  <option value="analysis">Analiza tekstu źródłowego</option>
                  <option value="project">Projekt badawczy</option>
                  <option value="extra">Praca dodatkowa</option>
                  <option value="optional">Dla chętnych (brak zaległości przy braku oddania)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Klasa</label>
                <select
                  value={formData.classYear}
                  onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                  className="tmd-select"
                >
                  <option value="Klasa I">Klasa I</option>
                  <option value="Klasa II">Klasa II</option>
                  <option value="Klasa III">Klasa III</option>
                  <option value="Klasa IV">Klasa IV</option>
                  <option value="Wszystkie">Wszystkie klasy</option>
                </select>
              </div>

              <div className="form-field">
                <label>Rok szkolny</label>
                <input
                  type="text"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="tmd-input"
                />
              </div>

              <div className="form-field">
                <label>Numer zadania</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.assignmentNumber}
                  onChange={(e) => setFormData({ ...formData, assignmentNumber: parseInt(e.target.value) || 1 })}
                  className="tmd-input"
                />
              </div>

              <div className="form-field full-width">
                <label>Powiązana lekcja z Dziennika (opcjonalnie)</label>
                <select
                  value={formData.lessonId}
                  onChange={(e) => {
                    const les = lessons.find(l => l.id === e.target.value);
                    setFormData({
                      ...formData,
                      lessonId: e.target.value,
                      lessonTitle: les ? (les.topic || les.title) : ''
                    });
                  }}
                  className="tmd-select"
                >
                  <option value="">-- Brak powiązania z konkretną lekcją --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.subjectName} • {l.topic || l.title} ({l.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field full-width">
                <label>Krótki opis / Zajawka</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={val => setFormData(prev => ({ ...prev, description: val }))}
                  placeholder="Krótki zarys tematyki widoczny na kafelku zadania..."
                  minHeight={100}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            KROK 2: ZADANIE, WYMAGANIA & MATERIAŁY
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="step-section">
            <div className="form-field full-width">
              <label>Szczegółowa instrukcja dla adeptów *</label>
              <RichTextEditor
                value={formData.instructions}
                onChange={val => setFormData(prev => ({ ...prev, instructions: val }))}
                placeholder="Przedstaw pełną treść zadania, kontekst, pytania problemowe i oczekiwane wnioski..."
                minHeight={220}
              />
            </div>

            {/* Requirements Builder */}
            <div className="sub-builder-section">
              <label className="section-subtitle">Wymagania i kryteria formalne</label>
              <div className="items-builder-list">
                {formData.requirements.map((req, idx) => (
                  <div key={idx} className="builder-item-row">
                    <span className="bullet-icon">◆</span>
                    <span className="item-text">{req.text}</span>
                    <button
                      type="button"
                      className="item-del-btn"
                      onClick={() => handleRemoveRequirement(idx)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-item-bar">
                <input
                  type="text"
                  placeholder="np. Minimum 400 słów / Odwołanie do traktatu z 1294 r."
                  value={newReqText}
                  onChange={(e) => setNewReqText(e.target.value)}
                  className="tmd-input"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                />
                <button
                  type="button"
                  className="tmd-action-btn primary small"
                  onClick={handleAddRequirement}
                >
                  <Plus size={14} />
                  <span>Dodaj wymóg</span>
                </button>
              </div>
            </div>

            {/* Resources Builder */}
            <div className="sub-builder-section mt-4">
              <div className="section-header-flex">
                <label className="section-subtitle">Materiały pomocnicze, notatki & ryciny Katedry</label>
                <button
                  type="button"
                  className="tmd-action-btn secondary small"
                  onClick={() => setShowAddResource(prev => !prev)}
                >
                  <Plus size={13} />
                  <span>{showAddResource ? 'Zwiń' : 'Dołącz materiał'}</span>
                </button>
              </div>

              {showAddResource && (
                <div className="add-resource-card">
                  <div className="form-group-grid">
                    <div className="form-field">
                      <label>Tytuł materiału</label>
                      <input
                        type="text"
                        placeholder="np. Notatka z lekcji 4 / Rycina kręgu"
                        value={newResTitle}
                        onChange={(e) => setNewResTitle(e.target.value)}
                        className="tmd-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Typ materiału</label>
                      <select
                        value={newResType}
                        onChange={(e) => setNewResType(e.target.value)}
                        className="tmd-select"
                      >
                        <option value="note">Notatka z lekcji</option>
                        <option value="image">Ilustracja / Rycina</option>
                        <option value="document">Dokument / PDF / Kronika</option>
                        <option value="link">Odnośnik zewnętrzny</option>
                      </select>
                    </div>
                    <div className="form-field full-width">
                      <label>Adres URL / Link do zasobu</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={newResUrl}
                        onChange={(e) => setNewResUrl(e.target.value)}
                        className="tmd-input"
                      />
                    </div>
                    <div className="form-field full-width">
                      <label>Krótki opis</label>
                      <input
                        type="text"
                        placeholder="np. Tabela formuł ochronnych Starszego Futharku"
                        value={newResDesc}
                        onChange={(e) => setNewResDesc(e.target.value)}
                        className="tmd-input"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tmd-action-btn primary small mt-2"
                    onClick={handleAddResource}
                  >
                    Dodaj materiał do zadania
                  </button>
                </div>
              )}

              <div className="resources-preview-list">
                {formData.resources.map(res => (
                  <div key={res.id} className="resource-preview-item">
                    <Paperclip size={14} />
                    <span className="res-name">{res.title}</span>
                    <span className="res-badge">{res.type}</span>
                    <button
                      type="button"
                      className="item-del-btn"
                      onClick={() => handleRemoveResource(res.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {formData.resources.length === 0 && (
                  <span className="hint-empty">Brak dołączonych materiałów pomocniczych.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            KROK 3: SPOSÓB ODDANIA
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="step-section">
            <label className="section-subtitle">Dozwolone sposoby oddania odpowiedzi przez adeptów</label>
            <p className="section-desc">
              Możesz zezwolić na jeden lub kilka połączonych sposobów składania pracy.
            </p>

            <div className="submission-types-grid">
              <div
                className={`type-option-card ${formData.submissionTypes.includes('text') ? 'selected' : ''}`}
                onClick={() => toggleSubmissionType('text')}
              >
                <div className="option-checkbox">
                  {formData.submissionTypes.includes('text') ? '✓' : ''}
                </div>
                <div className="option-content">
                  <h4>A. Odpowiedź tekstowa na stronie</h4>
                  <p>Adept pisze wypracowanie bezpośrednio w edytorze Durmstrangu z autosavem i formatowaniem.</p>
                </div>
              </div>

              <div
                className={`type-option-card ${formData.submissionTypes.includes('file') ? 'selected' : ''}`}
                onClick={() => toggleSubmissionType('file')}
              >
                <div className="option-checkbox">
                  {formData.submissionTypes.includes('file') ? '✓' : ''}
                </div>
                <div className="option-content">
                  <h4>B. Załącznik / Plik</h4>
                  <p>Adept może przesłać plik (np. PDF z esejem, rysunek runiczny, diagram rytualny).</p>
                </div>
              </div>

              <div
                className={`type-option-card ${formData.submissionTypes.includes('link') ? 'selected' : ''}`}
                onClick={() => toggleSubmissionType('link')}
              >
                <div className="option-checkbox">
                  {formData.submissionTypes.includes('link') ? '✓' : ''}
                </div>
                <div className="option-content">
                  <h4>C. Odnośnik zewnętrzny</h4>
                  <p>Adept podaje link do własnej pracy badawczej, prezentacji lub zewnętrznej grafiki.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            KROK 4: TERMINY & SPÓŹNIENIA
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="step-section">
            <div className="form-group-grid">
              <div className="form-field">
                <label>Data publikacji zadania</label>
                <input
                  type="datetime-local"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  className="tmd-input"
                />
              </div>

              <div className="form-field">
                <label>Główny termin oddania *</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="tmd-input due-highlight"
                />
              </div>

              <div className="form-field full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allowLate}
                    onChange={(e) => setFormData({ ...formData, allowLate: e.target.checked })}
                  />
                  <span>Zezwalaj na oddawanie prac po terminie (ze statusem SPÓŹNIONA)</span>
                </label>
              </div>

              {formData.allowLate && (
                <>
                  <div className="form-field">
                    <label>Ostateczny termin spóźnionego oddania</label>
                    <input
                      type="datetime-local"
                      value={formData.lateDueDate}
                      onChange={(e) => setFormData({ ...formData, lateDueDate: e.target.value })}
                      className="tmd-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>Automatyczne odejmowanie punktów za spóźnienie (opcjonalnie)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.latePenaltyPoints}
                      onChange={(e) => setFormData({ ...formData, latePenaltyPoints: parseInt(e.target.value) || 0 })}
                      className="tmd-input"
                      placeholder="0 = brak automatycznej kary"
                    />
                  </div>
                </>
              )}

              <div className="form-field full-width mt-2">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.revisionAllowed}
                    onChange={(e) => setFormData({ ...formData, revisionAllowed: e.target.checked })}
                  />
                  <span>Zezwalaj na zwrot do poprawy i tworzenie kolejnych wersji submission</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            KROK 5: OCENIANIE & RUBRYKA
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="step-section">
            <div className="form-group-grid">
              <div className="form-field">
                <label>Sposób oceniania</label>
                <select
                  value={formData.gradingType}
                  onChange={(e) => setFormData({ ...formData, gradingType: e.target.value })}
                  className="tmd-select"
                >
                  <option value="rubric">Rubryka kryteriów (sumowanie punktów)</option>
                  <option value="points">Zwykłe punkty (np. 0–20)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Maksymalna liczba punktów</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxPoints}
                  onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 20 })}
                  className="tmd-input"
                  disabled={formData.gradingType === 'rubric'}
                />
              </div>
            </div>

            {/* Rubric Builder */}
            {formData.gradingType === 'rubric' && (
              <div className="rubric-builder-section mt-4">
                <div className="section-header-flex">
                  <label className="section-subtitle">
                    Kryteria Rubryki (Łącznie: <strong>{formData.maxPoints} pkt</strong>)
                  </label>
                  <button
                    type="button"
                    className="tmd-action-btn secondary small"
                    onClick={handleAddRubricCriterion}
                  >
                    <Plus size={13} />
                    <span>Dodaj kryterium</span>
                  </button>
                </div>

                <div className="rubric-builder-list">
                  {formData.rubric.map((crit, idx) => (
                    <div key={crit.id || idx} className="rubric-builder-card">
                      <div className="crit-inputs-row">
                        <input
                          type="text"
                          value={crit.name}
                          onChange={(e) => handleUpdateRubricCriterion(idx, 'name', e.target.value)}
                          placeholder="Nazwa kryterium (np. Merytoryka)"
                          className="tmd-input crit-name-input"
                        />
                        <div className="crit-pts-box">
                          <span>0 do</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={crit.maxPoints}
                            onChange={(e) => handleUpdateRubricCriterion(idx, 'maxPoints', parseInt(e.target.value) || 1)}
                            className="tmd-input crit-pts-input"
                          />
                          <span>pkt</span>
                        </div>
                        <button
                          type="button"
                          className="item-del-btn"
                          onClick={() => handleRemoveRubricCriterion(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={crit.description}
                        onChange={(e) => handleUpdateRubricCriterion(idx, 'description', e.target.value)}
                        placeholder="Szczegółowy opis wymagań tego kryterium..."
                        className="tmd-input crit-desc-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            KROK 6: PODGLĄD JAKO UCZEŃ & PUBLIKACJA
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="step-section">
            <div className="preview-student-wrapper">
              <div className="preview-label-tag">
                <Eye size={14} />
                <span>PODGLĄD KARTY PRACY WIDZIANEJ PRZEZ ADEPTA</span>
              </div>

              <div className="preview-parchment-sheet">
                <div className="sheet-subject">{formData.subjectName.toUpperCase()}</div>
                <div className="sheet-assignment-nr">PRACA DOMOWA NR {formData.assignmentNumber}</div>
                <h2 className="sheet-title">„{formData.title || 'Bez tytułu'}”</h2>

                <div className="sheet-meta-row">
                  <div><strong>Profesor:</strong> {currentUser?.fullName}</div>
                  <div><strong>Termin:</strong> {formData.dueDate.replace('T', ' ')}</div>
                  <div><strong>Maksymalnie:</strong> {formData.maxPoints} pkt</div>
                </div>

                <div className="sheet-section-divider"></div>

                <div className="sheet-block">
                  <h4>TREŚĆ ZADANIA</h4>
                  <RichTextRenderer content={formData.instructions || formData.description || 'Brak treści zadania.'} />
                </div>

                {formData.requirements.length > 0 && (
                  <div className="sheet-block">
                    <h4>WYMAGANIA</h4>
                    <ul>
                      {formData.requirements.map((r, i) => (
                        <li key={i}>• {r.text}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.rubric.length > 0 && (
                  <div className="sheet-block">
                    <h4>RUBRYKA OCENIANIA</h4>
                    <div className="preview-rubric-mini">
                      {formData.rubric.map(c => (
                        <div key={c.id} className="rub-mini-row">
                          <span>{c.name}</span>
                          <strong>0–{c.maxPoints} pkt</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Wizard Stepper Navigation */}
        <div className="creator-stepper-footer">
          <div className="footer-left">
            {currentStep > 1 && (
              <button
                type="button"
                className="tmd-action-btn secondary"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
                <span>Poprzedni krok</span>
              </button>
            )}
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="tmd-action-btn secondary"
              onClick={handleSaveAsTemplate}
              title="Zapisz ten układ jako szablon do wielokrotnego użytku"
            >
              <Save size={15} />
              <span>Zapisz jako szablon</span>
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                className="tmd-action-btn primary"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                <span>Dalej</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="tmd-action-btn primary large glow-btn"
                onClick={handlePublishHomework}
                disabled={isPublishing}
              >
                <Send size={16} />
                <span>{isPublishing ? 'PUBLIKACJA...' : 'OPUBLIKUJ PRACĘ DOMOWĄ'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
