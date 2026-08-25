import React, { useState, useEffect, useRef } from 'react';
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
  Link2,
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
  RefreshCw,
  Bold,
  Italic,
  Heading,
  List,
  Quote,
  Code
} from 'lucide-react';

export const HomeworkDetailView = () => {
  const {
    activeHomeworkId,
    setActiveView,
    setActiveLessonId,
    currentUser,
    getHomeworkDetails,
    saveHomeworkDraft,
    submitHomework,
    uploadHomeworkAttachment,
    showNotification
  } = useSchool();

  const { playRuneChime, playWandSwoosh } = useSound();

  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('task'); // 'task', 'answer', 'grade', 'versions'

  // Student editor state
  const [editorText, setEditorText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autosaveTimerRef = useRef(null);

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Version for history view
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);

  const loadData = async () => {
    if (!activeHomeworkId) return;
    setLoading(true);
    const data = await getHomeworkDetails(activeHomeworkId);
    if (data) {
      setHomework(data);
      if (data.mySubmission) {
        setSubmission(data.mySubmission);
        setEditorText(data.mySubmission.content || '');
        setAttachments(data.mySubmission.attachments || []);
        setLinks(data.mySubmission.links || []);

        if (data.mySubmission.status === 'graded') {
          setActiveTab('grade');
        } else if (data.mySubmission.status === 'returned_for_revision') {
          setActiveTab('answer');
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeHomeworkId]);

  // Word count helper
  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;

  // Requirements limits
  const minWords = homework?.requirements?.find(r => r.minWords)?.minWords || 0;
  const maxWords = homework?.requirements?.find(r => r.maxWords)?.maxWords || 0;

  // Trigger autosave when editor text or attachments change (debounced 2.5s)
  useEffect(() => {
    if (!homework || !submission || ['submitted', 'resubmitted', 'late', 'graded'].includes(submission.status)) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    setAutosaveStatus('saving');

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await saveHomeworkDraft(homework.id, {
          content: editorText,
          attachments,
          links
        });
        setAutosaveStatus('saved');
        setLastSavedAt(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        setAutosaveStatus('error');
      }
    }, 2500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [editorText, attachments, links]);

  // Editor formatting helpers
  const handleInsertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('homework-text-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editorText.substring(start, end);
    const replacement = prefix + (selected || 'tekst') + suffix;

    const newContent = editorText.substring(0, start) + replacement + editorText.substring(end);
    setEditorText(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 5));
    }, 50);
  };

  // Add External Link
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const linkObj = {
      id: `link-${Date.now()}`,
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
      title: newLinkTitle.trim() || newLinkUrl.trim()
    };
    setLinks(prev => [...prev, linkObj]);
    setNewLinkUrl('');
    setNewLinkTitle('');
    setShowAddLink(false);
    playRuneChime();
  };

  // File Upload Helper
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadHomeworkAttachment({
          fileName: file.name,
          fileData: reader.result,
          fileType: file.type
        });
        if (res.ok && res.data?.attachment) {
          setAttachments(prev => [...prev, res.data.attachment]);
          playRuneChime();
          showNotification('Załącznik Dodany', `Plik ${file.name} został pomyślnie załadowany.`, 'success');
        }
      } catch (err) {
        showNotification('Błąd Uploadu', 'Nie udało się przesłać pliku.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Manual Draft Save
  const handleManualSave = async () => {
    setAutosaveStatus('saving');
    try {
      await saveHomeworkDraft(homework.id, {
        content: editorText,
        attachments,
        links
      });
      setAutosaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      playRuneChime();
      showNotification('Szkic Zapisany', 'Wszystkie zmiany zostały utrwalone w archiwum Cytadeli.', 'success');
    } catch (err) {
      setAutosaveStatus('error');
      showNotification('Błąd Zapisu', 'Nie udało się zapisać szkicu.', 'error');
    }
  };

  // Submit Homework
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      playWandSwoosh();
      const updatedSub = await submitHomework(homework.id, {
        content: editorText,
        attachments,
        links
      });
      setSubmission(updatedSub);
      setSubmitModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go to linked lesson
  const handleGoToLesson = (lessonId) => {
    if (!lessonId) return;
    setActiveLessonId(lessonId);
    setActiveView('lesson-detail');
  };

  if (loading || !homework) {
    return (
      <div className="homework-detail-container loading-state">
        <div className="tmd-spinner"></div>
        <span>Otwieranie zwoju zadania domowego...</span>
      </div>
    );
  }

  const isSealed = submission && ['submitted', 'resubmitted', 'late', 'graded'].includes(submission.status);
  const isReturned = submission?.status === 'returned_for_revision';

  return (
    <div className="homework-detail-container">
      {/* Back Button & Top Navigation */}
      <div className="detail-top-nav">
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

        {submission?.status === 'graded' && (
          <div className="top-graded-pill">
            <Award size={14} />
            <span>OCENIONO: {submission.gradeScore}/{submission.gradeMax} PKT ({submission.gradeLabel})</span>
          </div>
        )}
      </div>

      {/* Main Homework Header Card */}
      <div className="homework-header-card">
        <div className="header-subject-badge">
          <span className="badge-icon">📚</span>
          <span>{homework.subjectName}</span>
          <span className="badge-dot">•</span>
          <span>PRACA DOMOWA NR {homework.assignmentNumber}</span>
        </div>

        <h1 className="header-assignment-title">„{homework.title}”</h1>

        <div className="header-meta-grid">
          <div className="meta-col">
            <span className="meta-label">PROFESOR PROWADZĄCY</span>
            <div className="prof-author-info">
              {homework.professorAvatar ? (
                <img src={homework.professorAvatar} alt={homework.professorName} className="prof-avatar" />
              ) : (
                <div className="prof-avatar-fallback">ᛟ</div>
              )}
              <span className="prof-name">{homework.professorName}</span>
            </div>
          </div>

          <div className="meta-col">
            <span className="meta-label">DATA ZADANIA</span>
            <span className="meta-val">
              {new Date(homework.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="meta-col">
            <span className="meta-label">TERMIN ODDANIA</span>
            <span className="meta-val due-date-highlight">
              {new Date(homework.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date(homework.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="meta-col">
            <span className="meta-label">PUNKTACJA</span>
            <span className="meta-val gold-val">Maksymalnie {homework.maxPoints} pkt</span>
          </div>
        </div>

        {/* Linked Lesson Banner */}
        {homework.lessonTitle && (
          <div className="linked-lesson-banner">
            <div className="lesson-banner-left">
              <BookOpen size={16} />
              <div>
                <span className="banner-small">POWIĄZANA LEKCJA DZIENNIKA</span>
                <span className="banner-title">{homework.lessonTitle}</span>
              </div>
            </div>
            {homework.lessonId && (
              <button
                className="lesson-link-btn"
                onClick={() => handleGoToLesson(homework.lessonId)}
              >
                <span>ZOBACZ DZIENNIK LEKCJI</span>
                <ExternalLink size={13} />
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs for Homework View */}
        <div className="homework-detail-tabs">
          <button
            className={`detail-tab-btn ${activeTab === 'task' ? 'active' : ''}`}
            onClick={() => setActiveTab('task')}
          >
            <BookOpen size={15} />
            <span>Treść Zadania & Materiały</span>
          </button>

          <button
            className={`detail-tab-btn ${activeTab === 'answer' ? 'active' : ''}`}
            onClick={() => setActiveTab('answer')}
          >
            <FileText size={15} />
            <span>
              {isSealed ? 'Twoja Oddana Praca' : (isReturned ? 'Poprawa Pracy (Wersja II)' : 'Twoja Odpowiedź / Szkic')}
            </span>
            {submission?.status === 'draft' && <span className="tab-pill draft">Szkic</span>}
            {submission?.status === 'returned_for_revision' && <span className="tab-pill revision">Do poprawy</span>}
            {isSealed && <span className="tab-pill sealed">Zapieczętowana</span>}
          </button>

          {submission?.status === 'graded' && (
            <button
              className={`detail-tab-btn ${activeTab === 'grade' ? 'active' : ''}`}
              onClick={() => setActiveTab('grade')}
            >
              <Award size={15} />
              <span>Ocena & Recenzja ({submission.gradeScore}/{submission.gradeMax})</span>
            </button>
          )}

          {submission?.versions && submission.versions.length > 1 && (
            <button
              className={`detail-tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
              onClick={() => setActiveTab('versions')}
            >
              <History size={15} />
              <span>Historia Wersji ({submission.versions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TREŚĆ ZADANIA & MATERIAŁY
          ========================================================================= */}
      {activeTab === 'task' && (
        <div className="homework-task-view">
          {/* Main Task Description */}
          <div className="task-section-box">
            <h3 className="section-title">
              <span className="title-rune">ᛞ</span>
              <span>TREŚĆ ZADANIA</span>
            </h3>
            <div className="task-content-body">
              {homework.instructions ? (
                <div className="formatted-instructions">
                  {homework.instructions.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p>{homework.description}</p>
              )}
            </div>
          </div>

          {/* Requirements Section */}
          {homework.requirements && homework.requirements.length > 0 && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᚱ</span>
                <span>WYMAGANIA & KRYTERIA</span>
              </h3>
              <ul className="task-requirements-list">
                {homework.requirements.map((req, i) => (
                  <li key={i}>
                    <span className="req-bullet">◆</span>
                    <span>{req.text || req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rubric Breakdown Preview */}
          {homework.rubric && homework.rubric.length > 0 && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᛟ</span>
                <span>RUBRYKA OCENIANIA (ŁĄCZNIE {homework.maxPoints} PKT)</span>
              </h3>
              <div className="task-rubric-table">
                {homework.rubric.map(crit => (
                  <div key={crit.id} className="rubric-preview-row">
                    <div className="crit-info">
                      <strong className="crit-name">{crit.name}</strong>
                      <span className="crit-desc">{crit.description}</span>
                    </div>
                    <div className="crit-pts">
                      <span>0–{crit.maxPoints} pkt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources & Materials */}
          {homework.resources && homework.resources.length > 0 && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᚦ</span>
                <span>MATERIAŁY & NOTATKI KATEDRY</span>
              </h3>
              <div className="task-resources-grid">
                {homework.resources.map(res => (
                  <div key={res.id} className="resource-card">
                    <div className="res-icon">
                      {res.type === 'image' ? '🖼️' : res.type === 'document' ? '📜' : '📖'}
                    </div>
                    <div className="res-details">
                      <span className="res-title">{res.title}</span>
                      <span className="res-desc">{res.description}</span>
                      {res.url && (
                        <a href={res.url} target="_blank" rel="noreferrer" className="res-link">
                          <span>Otwórz materiał źródłowy</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Call to Action */}
          <div className="task-cta-bar">
            <button
              className="tmd-action-btn primary large"
              onClick={() => {
                playWandSwoosh();
                setActiveTab('answer');
              }}
            >
              <FileText size={18} />
              <span>{isSealed ? 'ZOBACZ SWOJĄ ODDANĄ PRACĘ' : 'PRZEJDŹ DO PISANIA ODPOWIEDZI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EDYTOR ODPOWIEDZI UCZNIA / SZKIC / ODDANIE
          ========================================================================= */}
      {activeTab === 'answer' && (
        <div className="homework-answer-view">
          {/* Revision Banner if Returned */}
          {isReturned && (
            <div className="revision-alert-banner">
              <AlertTriangle size={24} className="alert-icon" />
              <div className="alert-text">
                <h4>PRACA ZWRÓCONA DO POPRAWY PRZEZ PROFESORA</h4>
                <p><strong>Powód zwrotu:</strong> „{submission.revisionReason}”</p>
                {submission.revisionDueDate && (
                  <p><strong>Nowy termin poprawy:</strong> {submission.revisionDueDate}</p>
                )}
                <span className="alert-sub">Wprowadź poprawki poniżej i ponownie oddaj pracę jako Wersję {submission.currentVersion + 1}.</span>
              </div>
            </div>
          )}

          {/* Sealed Work View (If already submitted & waiting review) */}
          {isSealed && submission.status !== 'returned_for_revision' && (
            <div className="sealed-submission-card">
              <div className="sealed-wax-seal">
                <span className="seal-emblem">ᛟ</span>
                <span className="seal-text">ZAPROCZĘTOWANO</span>
              </div>
              <h2 className="sealed-title">PRACA ZŁOŻONA I ZAPROCZĘTOWANA</h2>
              <p className="sealed-info">
                Twoja dysertacja została pomyślnie złożona na ręce Profesora Katedry.
                Niezmienny snapshot treści (Wersja {submission.currentVersion || 1}) oczekuje na sprawdzenie i ocenę.
              </p>

              <div className="sealed-meta-strip">
                <div>
                  <span className="lbl">Data oddania:</span>
                  <span className="val">{submission.submittedAt}</span>
                </div>
                <div>
                  <span className="lbl">Status:</span>
                  <span className="val highlight">
                    {submission.status === 'graded' ? 'OCENIONA' : 'OCZEKUJE NA SPRAWDZENIE'}
                  </span>
                </div>
                <div>
                  <span className="lbl">Liczba słów:</span>
                  <span className="val">{submission.wordCount || wordCount} słów</span>
                </div>
              </div>

              {/* Readonly Content Display */}
              <div className="sealed-content-display">
                <div className="display-label">ODDANA TREŚĆ WYPRACOWANIA:</div>
                <div className="content-parchment">
                  {submission.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Attachments / Links Display */}
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="sealed-attachments-display">
                  <span className="display-label">ZAŁĄCZONE MATERIAŁY:</span>
                  <div className="attachments-list">
                    {submission.attachments.map(att => (
                      <div key={att.id} className="att-item">
                        <Paperclip size={14} />
                        <span className="att-name">{att.name}</span>
                        {att.url && (
                          <a href={att.url} target="_blank" rel="noreferrer" className="att-link">
                            <Download size={13} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Editable Form (Draft or Returned) */}
          {(!isSealed || isReturned) && (
            <div className="editable-homework-form">
              {/* Top Editor Toolbar */}
              <div className="editor-control-strip">
                <div className="editor-tools">
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('**', '**')}
                    title="Pogrubienie (**tekst**)"
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('*', '*')}
                    title="Kursywa (*tekst*)"
                  >
                    <Italic size={15} />
                  </button>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('## ', '')}
                    title="Nagłówek (## Tytuł)"
                  >
                    <Heading size={15} />
                  </button>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('• ', '')}
                    title="Lista wypunktowana"
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('> ', '')}
                    title="Cytat (> cytat)"
                  >
                    <Quote size={15} />
                  </button>
                  <button
                    type="button"
                    className="tool-btn"
                    onClick={() => handleInsertFormatting('`', '`')}
                    title="Runa / Formuła (`glif`)"
                  >
                    <Code size={15} />
                  </button>
                </div>

                {/* Live Word Count & Autosave Badge */}
                <div className="editor-status-indicators">
                  <div className="word-count-badge">
                    <span>Liczba słów: <strong>{wordCount}</strong></span>
                    {maxWords > 0 && <span> / {maxWords}</span>}
                  </div>

                  <div className={`autosave-badge status-${autosaveStatus}`}>
                    {autosaveStatus === 'saving' && (
                      <>
                        <RefreshCw size={13} className="spin-icon" />
                        <span>Zapisywanie...</span>
                      </>
                    )}
                    {autosaveStatus === 'saved' && (
                      <>
                        <CheckCircle2 size={13} />
                        <span>✓ Zapisano ({lastSavedAt})</span>
                      </>
                    )}
                    {autosaveStatus === 'error' && (
                      <>
                        <AlertCircle size={13} />
                        <span>⚠ Błąd zapisu</span>
                      </>
                    )}
                    {autosaveStatus === 'idle' && (
                      <span>✓ Zsynchronizowano</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Textarea Workspace */}
              <div className="parchment-editor-wrapper">
                <textarea
                  id="homework-text-editor"
                  className="homework-parchment-textarea"
                  placeholder="Rozpocznij formułowanie wypracowania... Twoje słowa są automatycznie zabezpieczane przez pieczęcie Cytadeli."
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  rows={16}
                ></textarea>
              </div>

              {/* Attachments & Links Section */}
              <div className="submission-attachments-section">
                <div className="att-header">
                  <span className="att-title">
                    <Paperclip size={15} />
                    <span>ZAŁĄCZNIKI & ODNOŚNIKI ZEWNĘTRZNE</span>
                  </span>

                  <div className="att-actions">
                    <label className="att-upload-btn">
                      <Paperclip size={13} />
                      <span>Dodaj plik</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.zip"
                      />
                    </label>

                    <button
                      type="button"
                      className="att-add-link-btn"
                      onClick={() => setShowAddLink(prev => !prev)}
                    >
                      <Link2 size={13} />
                      <span>Dodaj link</span>
                    </button>
                  </div>
                </div>

                {/* Inline link form */}
                {showAddLink && (
                  <div className="add-link-form">
                    <input
                      type="text"
                      placeholder="Adres URL (np. https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="link-input"
                    />
                    <input
                      type="text"
                      placeholder="Podpis linku (np. Zapis rytuału w archiwum)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="link-input"
                    />
                    <button
                      type="button"
                      className="tmd-action-btn primary small"
                      onClick={handleAddLink}
                    >
                      Dołącz
                    </button>
                  </div>
                )}

                {/* List of uploaded files and links */}
                <div className="attached-items-list">
                  {attachments.map((att, idx) => (
                    <div key={att.id || idx} className="attached-chip">
                      <Paperclip size={13} />
                      <span className="chip-name">{att.name}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {links.map((lnk, idx) => (
                    <div key={lnk.id || idx} className="attached-chip link-chip">
                      <Link2 size={13} />
                      <span className="chip-name">{lnk.title}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => setLinks(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {attachments.length === 0 && links.length === 0 && (
                    <span className="no-att-hint">Brak dołączonych rycin i załączników.</span>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="editor-bottom-actions">
                <button
                  type="button"
                  className="tmd-action-btn secondary"
                  onClick={handleManualSave}
                >
                  <Save size={16} />
                  <span>ZAPISZ SZKIC</span>
                </button>

                <button
                  type="button"
                  className="tmd-action-btn primary large"
                  onClick={() => setSubmitModalOpen(true)}
                  disabled={!editorText.trim() && attachments.length === 0}
                >
                  <Send size={16} />
                  <span>ODDAJ PRACĘ DOMOWĄ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: OCENA & RECENZJA PROFESORA
          ========================================================================= */}
      {activeTab === 'grade' && submission?.status === 'graded' && (
        <div className="homework-grade-view">
          {/* Main Score Hero Card */}
          <div className="grade-result-hero">
            <div className="score-main-block">
              <span className="score-big">{submission.gradeScore} <span className="score-max">/ {submission.gradeMax}</span></span>
              <span className="score-percent">{submission.gradePercentage}%</span>
              <span className="score-label-badge">{submission.gradeLabel}</span>
            </div>

            {/* House points bonus banner */}
            {submission.housePointsAwarded > 0 && (
              <div className="house-reward-banner">
                <Award size={20} className="reward-icon" />
                <div className="reward-text">
                  <strong>+{submission.housePointsAwarded} PUNKTÓW DLA ZAKONU {submission.house?.toUpperCase()}</strong>
                  <span>Nagroda za wybitny wkład merytoryczny odnotowana w Rocznikach Północy.</span>
                </div>
              </div>
            )}

            {/* Distinction Badge */}
            {submission.isFeatured && (
              <div className="featured-badge-banner">
                <Star size={18} />
                <span>★ PRACA WYRÓŻNIONA PRZEZ KATEDRĘ {submission.featuredBadge ? `(${submission.featuredBadge})` : ''}</span>
              </div>
            )}
          </div>

          {/* Professor Feedback Box */}
          {submission.feedback && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᛟ</span>
                <span>RECENZJA & KOMENTARZ PROFESORA ({submission.gradedBy})</span>
              </h3>
              <div className="feedback-content-box">
                <p>„{submission.feedback}”</p>
                <div className="feedback-signature">
                  <span>Data oceny: {submission.gradedAt}</span>
                  <span>Profesor: {submission.gradedBy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rubric Breakdown Grid */}
          {homework.rubric && homework.rubric.length > 0 && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᚱ</span>
                <span>OCENA WG KRYTERIÓW RUBRYKI</span>
              </h3>
              <div className="rubric-results-grid">
                {homework.rubric.map(crit => {
                  const score = submission.rubricScores?.[crit.id] ?? 0;
                  return (
                    <div key={crit.id} className="rubric-result-row">
                      <div className="crit-text">
                        <span className="c-name">{crit.name}</span>
                        <span className="c-desc">{crit.description}</span>
                      </div>
                      <div className="crit-score">
                        <span className="c-val">{score}</span>
                        <span className="c-max">/ {crit.maxPoints} pkt</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline Annotations in Student's Text */}
          {submission.inlineAnnotations && submission.inlineAnnotations.length > 0 && (
            <div className="task-section-box">
              <h3 className="section-title">
                <span className="title-rune">ᚦ</span>
                <span>UWAGI DO FRAGMENTÓW TEKSTU ({submission.inlineAnnotations.length})</span>
              </h3>
              <div className="inline-annotations-list">
                {submission.inlineAnnotations.map(ann => (
                  <div key={ann.id} className="annotation-item">
                    <div className="annotation-quote">
                      <Quote size={13} />
                      <span>„{ann.textRange?.text}”</span>
                    </div>
                    <div className="annotation-comment">
                      <CornerDownRight size={13} />
                      <span className="comment-text"><strong>{ann.professorName || 'Profesor'}:</strong> {ann.comment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: HISTORIA WERSJI (IF REVISED)
          ========================================================================= */}
      {activeTab === 'versions' && submission?.versions && (
        <div className="homework-versions-view">
          <div className="versions-sidebar">
            {submission.versions.map((ver, idx) => (
              <button
                key={ver.id || idx}
                className={`version-tab-btn ${selectedVersionIdx === idx ? 'active' : ''}`}
                onClick={() => setSelectedVersionIdx(idx)}
              >
                <div className="v-num">WERSJA {ver.versionNumber}</div>
                <div className="v-date">{ver.submittedAt}</div>
                <div className="v-status">{ver.status === 'graded' ? `${ver.gradeScore} pkt` : ver.status}</div>
              </button>
            ))}
          </div>

          <div className="version-content-preview">
            {(() => {
              const currentVer = submission.versions[selectedVersionIdx] || submission.versions[0];
              return (
                <div className="v-detail-card">
                  <div className="v-detail-header">
                    <h3>Wersja {currentVer.versionNumber} • Oddano {currentVer.submittedAt}</h3>
                    {currentVer.gradeScore !== null && (
                      <span className="v-score-tag">{currentVer.gradeScore} pkt</span>
                    )}
                  </div>
                  {currentVer.revisionReason && (
                    <div className="v-revision-reason">
                      <strong>Powód zwrotu:</strong> {currentVer.revisionReason}
                    </div>
                  )}
                  <div className="v-text-parchment">
                    {currentVer.content.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {submitModalOpen && (
        <div className="tmd-modal-overlay">
          <div className="tmd-modal-box submit-confirmation-modal">
            <div className="modal-seal-header">
              <span className="seal-emblem">ᛟ</span>
              <h3>PIECZĘTOWANIE PRACY DOMOWEJ</h3>
            </div>

            <p className="modal-body-warning">
              Czy na pewno chcesz oddać pracę z przedmiotu <strong>{homework.subjectName}</strong>?
            </p>
            <p className="modal-body-subtext">
              Po zatwierdzeniu treść wypracowania (<strong>{wordCount} słów</strong>) zostanie zapieczętowana
              i przekazana do oceny przez Profesora. Nie będzie można jej edytować, chyba że Profesor zwróci ją do poprawy.
            </p>

            <div className="modal-actions-strip">
              <button
                type="button"
                className="tmd-action-btn secondary"
                onClick={() => setSubmitModalOpen(false)}
                disabled={isSubmitting}
              >
                WRÓĆ DO EDYCJI
              </button>

              <button
                type="button"
                className="tmd-action-btn primary"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'PIECZĘTOWANIE...' : 'ZATWIERDŹ I ODDAJ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
