import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  Save,
  Send,
  Sparkles,
  Shield,
  Layers,
  History,
  MessageSquare,
  Flame,
  Star,
  CornerDownRight,
  Filter,
  User,
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit3
} from 'lucide-react';
import api from '../api';

export const HomeworkGradingView = () => {
  const {
    activeHomeworkId,
    activeHomeworkSubId,
    setActiveHomeworkSubId,
    setActiveView,
    currentUser,
    gradeHomeworkSubmission,
    returnHomeworkForRevision,
    setHomeworkException,
    showNotification
  } = useSchool();

  const { playRuneChime, playWandSwoosh } = useSound();

  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [houseFilter, setHouseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading Form State
  const [gradeScore, setGradeScore] = useState(18);
  const [rubricScores, setRubricScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [housePointsAwarded, setHousePointsAwarded] = useState(0);
  const [skirnirAwarded, setSkirnirAwarded] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredBadge, setFeaturedBadge] = useState('★ Wybitna Praca Badawcza');
  const [recordToGradebook, setRecordToGradebook] = useState(true);
  const [inlineAnnotations, setInlineAnnotations] = useState([]);

  // Modals & Panels
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDueDate, setReturnDueDate] = useState('');

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionDueDate, setExceptionDueDate] = useState('');
  const [exceptionIsExempt, setExceptionIsExempt] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  const [quickComments, setQuickComments] = useState([]);
  const [showQuickComments, setShowQuickComments] = useState(true);

  // Inline Annotation State
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [selectedTextRange, setSelectedTextRange] = useState(null);

  const loadSubmissionsList = async () => {
    if (!activeHomeworkId) return;
    setLoading(true);
    try {
      const res = await api.getHomeworkSubmissions(activeHomeworkId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        house: houseFilter !== 'all' ? houseFilter : undefined
      });
      if (res.ok && res.data) {
        setHomework(res.data.homework);
        setStudentsData(res.data.students || []);

        // Pre-select student if activeHomeworkSubId is set or choose first submitted
        if (res.data.students?.length > 0) {
          const target = activeHomeworkSubId
            ? res.data.students.find(s => s.submission?.id === activeHomeworkSubId)
            : res.data.students.find(s => s.submission?.status === 'submitted' || s.submission?.status === 'resubmitted') || res.data.students[0];
          if (target) {
            selectStudent(target, res.data.homework);
          }
        }
      }

      // Load quick comments
      const qcRes = await api.getHomeworkQuickComments();
      if (qcRes.ok && qcRes.data) {
        setQuickComments(qcRes.data);
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissionsList();
  }, [activeHomeworkId, statusFilter, houseFilter]);

  const selectStudent = (st, hwObj = homework) => {
    setSelectedStudent(st);
    if (st.submission) {
      const sub = st.submission;
      setFeedback(sub.feedback || '');
      setHousePointsAwarded(sub.housePointsAwarded || 0);
      setSkirnirAwarded(sub.skirnirAwarded || 0);
      setIsFeatured(!!sub.isFeatured);
      setFeaturedBadge(sub.featuredBadge || '★ Wybitna Praca Badawcza');
      setInlineAnnotations(sub.inlineAnnotations || []);

      if (sub.gradeScore !== null && sub.gradeScore !== undefined) {
        setGradeScore(sub.gradeScore);
      } else {
        setGradeScore(hwObj?.maxPoints || 20);
      }

      if (sub.rubricScores && Object.keys(sub.rubricScores).length > 0) {
        setRubricScores(sub.rubricScores);
      } else if (hwObj?.rubric?.length > 0) {
        const initial = {};
        hwObj.rubric.forEach(c => { initial[c.id] = c.maxPoints; });
        setRubricScores(initial);
      }
    } else {
      setFeedback('');
      setHousePointsAwarded(0);
      setSkirnirAwarded(0);
      setIsFeatured(false);
      setInlineAnnotations([]);
      setGradeScore(hwObj?.maxPoints || 20);
      setRubricScores({});
    }
  };

  // Compute Grade Score from Rubric
  const handleRubricScoreChange = (critId, val, maxPts) => {
    const numeric = Math.min(maxPts, Math.max(0, parseInt(val) || 0));
    setRubricScores(prev => {
      const updated = { ...prev, [critId]: numeric };
      const sum = Object.values(updated).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
      setGradeScore(sum);
      return updated;
    });
  };

  // Quick Comment Click
  const handleInsertQuickComment = (commentText) => {
    setFeedback(prev => {
      if (!prev.trim()) return commentText;
      return `${prev}\n${commentText}`;
    });
    playRuneChime();
  };

  // Inline Annotation Text Selection in student text
  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim();
    if (selectedText && selectedText.length > 3) {
      setSelectedTextRange({
        text: selectedText,
        start: 0,
        end: selectedText.length
      });
    }
  };

  const handleAddAnnotation = () => {
    if (!selectedTextRange || !newAnnotationText.trim()) return;
    const ann = {
      id: `ann-${Date.now()}`,
      textRange: selectedTextRange,
      comment: newAnnotationText.trim(),
      professorName: currentUser?.fullName || 'Profesor',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setInlineAnnotations(prev => [...prev, ann]);
    setNewAnnotationText('');
    setSelectedTextRange(null);
    playRuneChime();
  };

  // Submit Final Grade
  const handleSaveGrade = async () => {
    if (!selectedStudent?.submission) return;
    try {
      playWandSwoosh();
      await gradeHomeworkSubmission(selectedStudent.submission.id, {
        gradeScore,
        gradeMax: homework.maxPoints || 20,
        rubricScores,
        feedback,
        inlineAnnotations,
        housePointsAwarded,
        skirnirAwarded,
        isFeatured,
        featuredBadge,
        recordToGradebook
      });
      await loadSubmissionsList();
    } catch (err) {
      console.error(err);
    }
  };

  // Return to Student for Revision
  const handleConfirmReturn = async () => {
    if (!selectedStudent?.submission || !returnReason.trim()) return;
    try {
      playWandSwoosh();
      await returnHomeworkForRevision(selectedStudent.submission.id, {
        reason: returnReason,
        revisionDueDate: returnDueDate
      });
      setReturnModalOpen(false);
      setReturnReason('');
      setReturnDueDate('');
      await loadSubmissionsList();
    } catch (err) {
      console.error(err);
    }
  };

  // Set Individual Exception
  const handleSaveException = async () => {
    if (!selectedStudent) return;
    try {
      await setHomeworkException(homework.id, {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        customDueDate: exceptionDueDate,
        isExempt: exceptionIsExempt,
        reason: exceptionReason
      });
      setExceptionModalOpen(false);
      await loadSubmissionsList();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !homework) {
    return (
      <div className="homework-grading-container loading-state">
        <div className="tmd-spinner"></div>
        <span>Otwieranie księgi ocen Katedry...</span>
      </div>
    );
  }

  // Filter student list by search
  const filteredStudents = studentsData.filter(st => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return st.studentName.toLowerCase().includes(q) || st.house.toLowerCase().includes(q);
  });

  const sub = selectedStudent?.submission;

  return (
    <div className="homework-grading-container">
      {/* Top Header Bar */}
      <div className="grading-top-bar">
        <button
          className="tmd-back-btn"
          onClick={() => {
            playWandSwoosh();
            setActiveView('homework');
          }}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Centrum Prac</span>
        </button>

        <div className="grading-hw-header">
          <div className="hw-header-title">
            <span className="hw-subj">{homework.subjectName}</span>
            <span className="hw-name">„{homework.title}”</span>
          </div>
          <div className="hw-stats-strip">
            <span>Termin: <strong>{new Date(homework.dueDate).toLocaleDateString('pl-PL')}</strong></span>
            <span>Maks.: <strong>{homework.maxPoints} pkt</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Left (Student Roster), Right (Submission Inspection & Grading Suite) */}
      <div className="grading-workspace-grid">
        {/* Left Column: Student Roster */}
        <div className="grading-sidebar-students">
          <div className="sidebar-header">
            <h3>Lista Adeptów ({studentsData.length})</h3>
            <div className="roster-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Szukaj adepta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="roster-filter-tabs">
            <button
              className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Wszyscy
            </button>
            <button
              className={`filter-pill ${statusFilter === 'in_review' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in_review')}
            >
              Do spr.
            </button>
            <button
              className={`filter-pill ${statusFilter === 'graded' ? 'active' : ''}`}
              onClick={() => setStatusFilter('graded')}
            >
              Ocenieni
            </button>
            <button
              className={`filter-pill ${statusFilter === 'missing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('missing')}
            >
              Nie oddali
            </button>
          </div>

          {/* Student List Items */}
          <div className="roster-items-list">
            {filteredStudents.map(st => {
              const isSelected = selectedStudent?.studentId === st.studentId;
              const hasSub = !!st.submission;
              const isGraded = st.submission?.status === 'graded';
              const isPending = ['submitted', 'resubmitted', 'late'].includes(st.submission?.status);
              const isRevision = st.submission?.status === 'returned_for_revision';

              return (
                <div
                  key={st.studentId}
                  className={`roster-student-card ${isSelected ? 'active' : ''} house-${st.house}`}
                  onClick={() => selectStudent(st)}
                >
                  <div className="student-card-left">
                    <span className="student-name">{st.studentName}</span>
                    <span className="student-house-tag">{st.house?.toUpperCase()}</span>
                  </div>

                  <div className="student-card-right">
                    {isGraded ? (
                      <span className="badge-graded">{st.submission.gradeScore}/{homework.maxPoints} pkt</span>
                    ) : isPending ? (
                      <span className="badge-pending">DO SPR.</span>
                    ) : isRevision ? (
                      <span className="badge-revision">W POPRAWIE</span>
                    ) : st.exception?.isExempt ? (
                      <span className="badge-exempt">ZWOLNIONY</span>
                    ) : (
                      <span className="badge-missing">NIE ODDANO</span>
                    )}
                    {st.activeAbsence && (
                      <span className="badge-absence" title={`Usprawiedliwienie: ${st.activeAbsence.dateFrom} – ${st.activeAbsence.dateTo}`}>
                        USP.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submission & Grading Suite */}
        <div className="grading-main-sheet">
          {selectedStudent ? (
            <div className="grading-sheet-inner">
              {/* Student Header & Status Bar */}
              <div className="student-inspect-header">
                <div className="inspect-user-info">
                  <div className="inspect-avatar">ᛟ</div>
                  <div>
                    <h2 className="inspect-name">{selectedStudent.studentName}</h2>
                    <div className="inspect-meta">
                      <span className="house-pill">{selectedStudent.house?.toUpperCase()}</span>
                      {sub?.submittedAt && (
                        <span>Oddano: <strong>{sub.submittedAt}</strong> (Wersja {sub.currentVersion || 1})</span>
                      )}
                      {sub?.isLate && (
                        <span className="late-pill">SPÓŹNIONA</span>
                      )}
                      {selectedStudent.activeAbsence && (
                        <span className="absence-info-pill" title="Zatwierdzone usprawiedliwienie obejmuje termin tej pracy">
                          ✓ USPRAWIEDLIWIENIE (do {selectedStudent.activeAbsence.dateTo})
                        </span>
                      )}
                      {selectedStudent.exception?.customDueDate && (
                        <span className="custom-deadline-pill">
                          Ind. termin: {new Date(selectedStudent.exception.customDueDate).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="inspect-actions">
                  <button
                    className="tmd-action-btn secondary small"
                    onClick={() => {
                      setExceptionDueDate(selectedStudent.exception?.customDueDate || '');
                      setExceptionIsExempt(!!selectedStudent.exception?.isExempt);
                      setExceptionReason(selectedStudent.exception?.reason || '');
                      setExceptionModalOpen(true);
                    }}
                  >
                    Indywidualny termin / Wyjątek
                  </button>

                  {sub && (
                    <button
                      className="tmd-action-btn secondary small"
                      onClick={() => setReturnModalOpen(true)}
                    >
                      <CornerDownRight size={13} />
                      <span>Zwróć do poprawy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submission Content Section */}
              {sub ? (
                <div className="inspect-body-grid">
                  {/* Left sub-column: Student Content */}
                  <div className="submission-content-panel">
                    <div className="panel-box-header">
                      <span>ODPOWIEDŹ ADEPTA ({sub.wordCount || 0} SŁÓW)</span>
                      <span className="hint-select-text">Zaznacz tekst, aby dodać uwagę</span>
                    </div>

                    <div
                      className="student-parchment-content"
                      onMouseUp={handleTextMouseUp}
                    >
                      {sub.content ? (
                        sub.content.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))
                      ) : (
                        <p className="empty-text-hint">Brak treści tekstowej (sprawdź załączniki poniżej).</p>
                      )}
                    </div>

                    {/* Inline Annotation Add Prompt */}
                    {selectedTextRange && (
                      <div className="inline-annotation-prompt">
                        <div className="prompt-header">
                          <MessageSquare size={13} />
                          <span>Dodaj uwagę do zaznaczonego fragmentu: „{selectedTextRange.text.slice(0, 40)}...”</span>
                        </div>
                        <div className="prompt-input-row">
                          <input
                            type="text"
                            placeholder="Wpisz uwagę (np. Rozwiń ten argument / Błąd pojęciowy)..."
                            value={newAnnotationText}
                            onChange={(e) => setNewAnnotationText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAnnotation())}
                          />
                          <button
                            type="button"
                            className="tmd-action-btn primary small"
                            onClick={handleAddAnnotation}
                          >
                            Dodaj
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of existing annotations */}
                    {inlineAnnotations.length > 0 && (
                      <div className="existing-annotations-box">
                        <span className="annot-title">DODANE UWAGI DO TEKSTU ({inlineAnnotations.length}):</span>
                        {inlineAnnotations.map((ann, i) => (
                          <div key={ann.id || i} className="annot-row">
                            <div className="annot-quote">„{ann.textRange?.text}”</div>
                            <div className="annot-comment">↳ {ann.comment}</div>
                            <button
                              type="button"
                              className="annot-del"
                              onClick={() => setInlineAnnotations(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Student Attachments / Links */}
                    {sub.attachments && sub.attachments.length > 0 && (
                      <div className="submission-attachments-strip">
                        <span className="strip-label">ZAŁĄCZONE MATERIAŁY:</span>
                        <div className="att-pills-list">
                          {sub.attachments.map(att => (
                            <div key={att.id} className="att-pill">
                              <Paperclip size={13} />
                              <span>{att.name}</span>
                              {att.url && (
                                <a href={att.url} target="_blank" rel="noreferrer" className="att-dl">
                                  <Download size={12} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right sub-column: Grading & Rubric Scoring Suite */}
                  <div className="grading-controls-panel">
                    <div className="panel-box-header">
                      <span>FORMULARZ OCENY & RECENZJI</span>
                    </div>

                    {/* Rubric Criteria Interactive Sliders */}
                    {homework.rubric && homework.rubric.length > 0 && (
                      <div className="rubric-interactive-section">
                        <label className="section-label">PUNKTACJA WG RUBRYKI</label>
                        <div className="rubric-sliders-list">
                          {homework.rubric.map(crit => {
                            const score = rubricScores[crit.id] ?? crit.maxPoints;
                            return (
                              <div key={crit.id} className="rubric-slider-card">
                                <div className="crit-title-flex">
                                  <span className="c-name">{crit.name}</span>
                                  <span className="c-val-box"><strong>{score}</strong> / {crit.maxPoints} pkt</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max={crit.maxPoints}
                                  value={score}
                                  onChange={(e) => handleRubricScoreChange(crit.id, e.target.value, crit.maxPoints)}
                                  className="tmd-slider"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total Score & Rating */}
                    <div className="score-summary-card">
                      <div className="score-display-row">
                        <span className="score-lbl">ŁĄCZNY WYNIK:</span>
                        <div className="score-input-group">
                          <input
                            type="number"
                            min="0"
                            max={homework.maxPoints}
                            value={gradeScore}
                            onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                            className="tmd-input score-box-input"
                          />
                          <span className="score-max-tag">/ {homework.maxPoints} pkt</span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback & Comments */}
                    <div className="grading-feedback-box">
                      <div className="feedback-header-flex">
                        <label className="section-label">KOMENTARZ PROFESORA</label>
                        <button
                          type="button"
                          className="toggle-comments-btn"
                          onClick={() => setShowQuickComments(prev => !prev)}
                        >
                          {showQuickComments ? 'Ukryj bibliotekę' : 'Szybkie uwagi'}
                        </button>
                      </div>

                      {/* Quick Comments Palette */}
                      {showQuickComments && quickComments.length > 0 && (
                        <div className="quick-comments-palette">
                          {quickComments.map(qc => (
                            <button
                              key={qc.id}
                              type="button"
                              className="quick-comment-chip"
                              onClick={() => handleInsertQuickComment(qc.text)}
                              title="Kliknij, aby dołączyć uwagę"
                            >
                              + {qc.text}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        placeholder="Wpisz merytoryczne uzasadnienie oceny, wskazówki i zalecenia..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="tmd-textarea"
                        rows={5}
                      ></textarea>
                    </div>

                    {/* House Points & Bonuses */}
                    <div className="grading-bonuses-section">
                      <label className="section-label">NAGRODY & PUNKTY DLA ZAKONU</label>
                      <div className="bonus-row">
                        <span>Punkty dla {selectedStudent.house?.toUpperCase()}:</span>
                        <select
                          value={housePointsAwarded}
                          onChange={(e) => setHousePointsAwarded(parseInt(e.target.value) || 0)}
                          className="tmd-select small-select"
                        >
                          <option value="0">0 pkt (brak bonusu)</option>
                          <option value="5">+5 pkt dla Zakonu</option>
                          <option value="10">+10 pkt dla Zakonu (Wyróżnienie)</option>
                          <option value="15">+15 pkt dla Zakonu (Wybitny esej)</option>
                          <option value="20">+20 pkt dla Zakonu (Arcydzieło)</option>
                        </select>
                      </div>

                      <div className="bonus-row mt-2">
                        <span>Skirniry dla adepta:</span>
                        <select
                          value={skirnirAwarded}
                          onChange={(e) => setSkirnirAwarded(parseInt(e.target.value) || 0)}
                          className="tmd-select small-select"
                        >
                          <option value="0">0 Skirnirów (brak)</option>
                          <option value="5">+5 Skirnirów</option>
                          <option value="10">+10 Skirnirów (Solidna praca)</option>
                          <option value="20">+20 Skirnirów (Wyróżnienie)</option>
                          <option value="30">+30 Skirnirów (Arcydzieło)</option>
                        </select>
                      </div>

                      <div className="bonus-row mt-2">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                          />
                          <span>★ Oznacz jako Pracę Wyróżnioną Katedry</span>
                        </label>
                      </div>

                      <div className="bonus-row mt-2">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={recordToGradebook}
                            onChange={(e) => setRecordToGradebook(e.target.checked)}
                          />
                          <span>☑ Wpisz ocenę do Dziennika Ocen</span>
                        </label>
                      </div>
                    </div>

                    {/* Save & Approve Grade Button */}
                    <div className="grading-submit-bar">
                      <button
                        type="button"
                        className="tmd-action-btn primary large glow-btn"
                        onClick={handleSaveGrade}
                      >
                        <CheckCircle2 size={16} />
                        <span>ZATWIERDŹ OCENĘ ({gradeScore}/{homework.maxPoints})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="unsubmitted-empty-inspect">
                  <Clock size={36} />
                  <h3>Adept nie złożył jeszcze wypracowania</h3>
                  <p>Możesz przyznać indywidualny termin lub zwolnić ucznia z tego zadania.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-student-selected-state">
              <Users size={36} />
              <h3>Wybierz adepta z listy po lewej stronie</h3>
              <p>Kliknij w nazwisko ucznia, aby obejrzeć jego wypracowanie, załączniki oraz wypełnić rubrykę ocen.</p>
            </div>
          )}
        </div>
      </div>

      {/* RETURN TO REVISION MODAL */}
      {returnModalOpen && (
        <div className="tmd-modal-overlay">
          <div className="tmd-modal-box">
            <h3>ZWROT PRACY DO POPRAWY</h3>
            <p className="modal-sub">
              Praca adepta <strong>{selectedStudent?.studentName}</strong> zostanie zwrócona ze statusem DO POPRAWY.
              Adept będzie mógł sporządzić Wersję II.
            </p>

            <div className="form-field full-width mt-3">
              <label>Powód zwrotu / Wskazówki do poprawy *</label>
              <textarea
                placeholder="np. Rozwiń punkt drugi, popraw analizę inskrypcji i uzupełnij odwołanie do lekcji..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="tmd-textarea"
                rows={3}
              ></textarea>
            </div>

            <div className="form-field full-width mt-2">
              <label>Nowy termin oddania poprawy</label>
              <input
                type="datetime-local"
                value={returnDueDate}
                onChange={(e) => setReturnDueDate(e.target.value)}
                className="tmd-input"
              />
            </div>

            <div className="modal-actions-strip mt-4">
              <button
                type="button"
                className="tmd-action-btn secondary"
                onClick={() => setReturnModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                type="button"
                className="tmd-action-btn primary"
                onClick={handleConfirmReturn}
                disabled={!returnReason.trim()}
              >
                Zatwierdź Zwrot do Poprawy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL EXCEPTION MODAL */}
      {exceptionModalOpen && (
        <div className="tmd-modal-overlay">
          <div className="tmd-modal-box">
            <h3>INDYWIDUALNE WARUNKI / WYJĄTEK</h3>
            <p className="modal-sub">
              Ustaw indywidualne zasady dla adepta <strong>{selectedStudent?.studentName}</strong>. Nie zmieni to terminów pozostałych uczniów.
            </p>

            <div className="form-field full-width mt-3">
              <label>Indywidualny termin oddania</label>
              <input
                type="datetime-local"
                value={exceptionDueDate}
                onChange={(e) => setExceptionDueDate(e.target.value)}
                className="tmd-input"
              />
            </div>

            <div className="form-field full-width mt-2">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={exceptionIsExempt}
                  onChange={(e) => setExceptionIsExempt(e.target.checked)}
                />
                <span>Zwolnij adepta z tego zadania (brak wymogu oddania)</span>
              </label>
            </div>

            <div className="form-field full-width mt-2">
              <label>Uzasadnienie wyjątku</label>
              <input
                type="text"
                placeholder="np. Zwolnienie lekarskie / Misja Zakonu"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="tmd-input"
              />
            </div>

            <div className="modal-actions-strip mt-4">
              <button
                type="button"
                className="tmd-action-btn secondary"
                onClick={() => setExceptionModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                type="button"
                className="tmd-action-btn primary"
                onClick={handleSaveException}
              >
                Zapisz Wyjątek
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
