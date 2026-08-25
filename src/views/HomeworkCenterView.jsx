import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Filter,
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Layers,
  Archive,
  Star,
  Users,
  Copy,
  ExternalLink,
  MessageSquare,
  Flame,
  CornerDownRight,
  RefreshCw
} from 'lucide-react';
import { HomeworkCalendarView } from './HomeworkCalendarView';
import { HomeworkArchiveView } from './HomeworkArchiveView';
import { HomeworkTemplatesModal } from '../components/HomeworkTemplatesModal';
import { HomeworkQuickCommentsModal } from '../components/HomeworkQuickCommentsModal';

export const HomeworkCenterView = () => {
  const {
    currentUser,
    homeworkAssignments,
    loadHomework,
    homeworkOverview,
    loadStudentHomeworkOverview,
    subjects,
    houses,
    navigateToHomeworkDetail,
    navigateToHomeworkCreator,
    navigateToHomeworkGrading,
    duplicateHomeworkAssignment,
    deleteHomeworkAssignment,
    showNotification
  } = useSchool();

  const { playRuneChime, playWandSwoosh } = useSound();

  const isProfessorOrAdmin = currentUser?.role === 'professor' || currentUser?.role === 'admin';

  // Sub-view: 'hub', 'calendar', 'archive'
  const [subView, setSubView] = useState('hub');

  // Filter states
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'to_submit', 'in_review', 'graded', 'revision', 'missing'
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [schoolYearFilter, setSchoolYearFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadHomework({
        subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
        classYear: classFilter !== 'all' ? classFilter : undefined,
        schoolYear: schoolYearFilter !== 'all' ? schoolYearFilter : undefined,
        search: searchQuery || undefined
      });
      if (currentUser?.role === 'student') {
        await loadStudentHomeworkOverview();
      }
      setLoading(false);
    };

    fetchData();
  }, [subjectFilter, classFilter, schoolYearFilter, searchQuery, currentUser]);

  const handleOpenHomework = (id) => {
    playRuneChime();
    navigateToHomeworkDetail(id);
  };

  const handleOpenGrading = (id) => {
    playRuneChime();
    navigateToHomeworkGrading(id);
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    await duplicateHomeworkAssignment(id);
    await loadHomework();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie domowe?')) {
      await deleteHomeworkAssignment(id);
      await loadHomework();
    }
  };

  // House color accents helper
  const getHouseColor = (houseKey) => {
    switch (houseKey?.toLowerCase()) {
      case 'reinhall': return '#8B1E2B';
      case 'bjornhall': return '#203A58';
      case 'ravnheim': return '#382548';
      case 'otergard': return '#1B3B32';
      default: return '#8B6A38';
    }
  };

  // Compute days remaining text
  const getRemainingTimeBadge = (dueDateStr) => {
    if (!dueDateStr) return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due - now;

    if (diffMs < 0) {
      const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      return {
        label: pastDays > 0 ? `Termin minął ${pastDays} dni temu` : 'Termin minął dzisiaj',
        isPast: true,
        urgency: 'overdue'
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return {
        label: `Pozostało: ${diffDays} dni`,
        isPast: false,
        urgency: diffDays <= 2 ? 'warning' : 'normal'
      };
    } else if (diffDays === 1) {
      return {
        label: 'Pozostał 1 dzień',
        isPast: false,
        urgency: 'warning'
      };
    } else if (diffHours > 0) {
      return {
        label: `Pozostało: ${diffHours} godz.`,
        isPast: false,
        urgency: 'urgent'
      };
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return {
        label: `Pozostało: ${Math.max(1, diffMins)} min!`,
        isPast: false,
        urgency: 'critical'
      };
    }
  };

  // Filtered assignments for display
  const getFilteredAssignments = () => {
    let list = [...homeworkAssignments];

    if (currentUser?.role === 'student' && selectedTab !== 'all') {
      if (selectedTab === 'to_submit') {
        list = list.filter(hw => !hw.mySubmission || ['draft'].includes(hw.mySubmission.status));
      } else if (selectedTab === 'in_review') {
        list = list.filter(hw => hw.mySubmission && ['submitted', 'resubmitted', 'late'].includes(hw.mySubmission.status));
      } else if (selectedTab === 'graded') {
        list = list.filter(hw => hw.mySubmission && hw.mySubmission.status === 'graded');
      } else if (selectedTab === 'revision') {
        list = list.filter(hw => hw.mySubmission && hw.mySubmission.status === 'returned_for_revision');
      } else if (selectedTab === 'missing') {
        const now = new Date();
        list = list.filter(hw => {
          const isPastDue = new Date(hw.dueDate) < now;
          return isPastDue && (!hw.mySubmission || hw.mySubmission.status === 'draft');
        });
      }
    }

    return list;
  };

  const filteredList = getFilteredAssignments();

  return (
    <div className="homework-center-container">
      {/* Header Banner with Nordic Gothic Ambience */}
      <div className="homework-monumental-header">
        <div className="homework-header-backdrop">
          <div className="header-rune-seal">ᛞ</div>
          <div className="header-badge-pillar">
            <span className="pillar-dot"></span>
            <span>CYTADELA DURMSTRANG • KATEDRY AKADEMICKIE</span>
            <span className="pillar-dot"></span>
          </div>
          <h1 className="homework-main-title">PRACE DOMOWE & WYPRACOWANIA</h1>
          <p className="homework-subtitle">
            XVII ROK SZKOLNY • {currentUser?.classYear || 'KLASA II'} • SYSTEM ROZPRAW I PROTOKOŁÓW
          </p>

          {/* Sub-view switcher tabs */}
          <div className="homework-view-switcher">
            <button
              className={`switcher-btn ${subView === 'hub' ? 'active' : ''}`}
              onClick={() => { playWandSwoosh(); setSubView('hub'); }}
            >
              <BookOpen size={16} />
              <span>Centrum Zadań</span>
            </button>
            <button
              className={`switcher-btn ${subView === 'calendar' ? 'active' : ''}`}
              onClick={() => { playWandSwoosh(); setSubView('calendar'); }}
            >
              <Calendar size={16} />
              <span>Kalendarz Terminów</span>
            </button>
            <button
              className={`switcher-btn ${subView === 'archive' ? 'active' : ''}`}
              onClick={() => { playWandSwoosh(); setSubView('archive'); }}
            >
              <Archive size={16} />
              <span>Archiwum Roczników</span>
            </button>
          </div>
        </div>
      </div>

      {/* Runic divider */}
      <div className="durmstrang-rune-divider">
        <span className="line"></span>
        <span className="rune">ᛟ ᚱ ᛞ ᚦ</span>
        <span className="line"></span>
      </div>

      {/* SUB-VIEW 1: CALENDAR */}
      {subView === 'calendar' && (
        <HomeworkCalendarView onOpenHomework={handleOpenHomework} />
      )}

      {/* SUB-VIEW 2: ARCHIVE */}
      {subView === 'archive' && (
        <HomeworkArchiveView onOpenHomework={handleOpenHomework} />
      )}

      {/* SUB-VIEW 3: MAIN HUB */}
      {subView === 'hub' && (
        <div className="homework-hub-content">
          {/* Top Actions & Filters Bar */}
          <div className="homework-controls-bar">
            <div className="controls-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Szukaj pracy, przedmiotu lub profesora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="controls-dropdowns">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="tmd-select"
              >
                <option value="all">Wszystkie przedmioty</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="tmd-select"
              >
                <option value="all">Wszystkie klasy</option>
                <option value="Klasa I">Klasa I</option>
                <option value="Klasa II">Klasa II</option>
                <option value="Klasa III">Klasa III</option>
                <option value="Klasa IV">Klasa IV</option>
              </select>

              <select
                value={schoolYearFilter}
                onChange={(e) => setSchoolYearFilter(e.target.value)}
                className="tmd-select"
              >
                <option value="all">Wszystkie lata</option>
                <option value="XVII Rok Szkolny">XVII Rok Szkolny</option>
                <option value="XVI Rok Szkolny">XVI Rok Szkolny</option>
              </select>
            </div>

            {/* Professor / Admin Quick Actions */}
            {isProfessorOrAdmin && (
              <div className="controls-prof-actions">
                <button
                  className="tmd-action-btn secondary"
                  onClick={() => setTemplatesModalOpen(true)}
                  title="Biblioteka gotowych szablonów prac domowych"
                >
                  <Layers size={15} />
                  <span>Szablony</span>
                </button>
                <button
                  className="tmd-action-btn secondary"
                  onClick={() => setCommentsModalOpen(true)}
                  title="Biblioteka gotowych uwag profesorskich"
                >
                  <MessageSquare size={15} />
                  <span>Komentarze</span>
                </button>
                <button
                  className="tmd-action-btn primary"
                  onClick={() => {
                    playWandSwoosh();
                    navigateToHomeworkCreator();
                  }}
                >
                  <Plus size={16} />
                  <span>Zadaj Pracę</span>
                </button>
              </div>
            )}
          </div>

          {/* Student Status Summary Cards / Overview */}
          {currentUser?.role === 'student' && homeworkOverview && (
            <div className="student-overview-strip">
              <div
                className={`overview-tile ${selectedTab === 'to_submit' ? 'active' : ''}`}
                onClick={() => setSelectedTab(selectedTab === 'to_submit' ? 'all' : 'to_submit')}
              >
                <div className="tile-icon-box to-submit">
                  <Clock size={20} />
                </div>
                <div className="tile-info">
                  <span className="tile-count">{homeworkOverview.stats.toSubmitCount}</span>
                  <span className="tile-label">Do oddania</span>
                </div>
              </div>

              <div
                className={`overview-tile ${selectedTab === 'in_review' ? 'active' : ''}`}
                onClick={() => setSelectedTab(selectedTab === 'in_review' ? 'all' : 'in_review')}
              >
                <div className="tile-icon-box in-review">
                  <Layers size={20} />
                </div>
                <div className="tile-info">
                  <span className="tile-count">{homeworkOverview.stats.inReviewCount}</span>
                  <span className="tile-label">Oczekuje na ocenę</span>
                </div>
              </div>

              <div
                className={`overview-tile ${selectedTab === 'revision' ? 'active' : ''}`}
                onClick={() => setSelectedTab(selectedTab === 'revision' ? 'all' : 'revision')}
              >
                <div className="tile-icon-box revision">
                  <AlertTriangle size={20} />
                </div>
                <div className="tile-info">
                  <span className="tile-count">{homeworkOverview.stats.needsRevisionCount}</span>
                  <span className="tile-label">Do poprawy</span>
                </div>
              </div>

              <div
                className={`overview-tile ${selectedTab === 'graded' ? 'active' : ''}`}
                onClick={() => setSelectedTab(selectedTab === 'graded' ? 'all' : 'graded')}
              >
                <div className="tile-icon-box graded">
                  <CheckCircle2 size={20} />
                </div>
                <div className="tile-info">
                  <span className="tile-count">{homeworkOverview.stats.gradedCount}</span>
                  <span className="tile-label">Ocenione</span>
                </div>
              </div>

              {homeworkOverview.stats.totalHousePointsEarned > 0 && (
                <div className="overview-tile highlight-points">
                  <div className="tile-icon-box house-points">
                    <Award size={20} />
                  </div>
                  <div className="tile-info">
                    <span className="tile-count">+{homeworkOverview.stats.totalHousePointsEarned} pkt</span>
                    <span className="tile-label">Dla Zakonu</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Professor Quick Stats Dashboard */}
          {isProfessorOrAdmin && (
            <div className="professor-dashboard-summary">
              <div className="prof-summary-header">
                <div className="summary-title">
                  <Shield size={16} />
                  <span>PANEL PROFESORSKI KATEDR</span>
                </div>
                <span className="summary-badge">{homeworkAssignments.length} aktywnych zadań</span>
              </div>
              <div className="prof-metrics-grid">
                <div className="metric-box">
                  <span className="m-val">{homeworkAssignments.reduce((acc, h) => acc + (h.stats?.totalSubmissions || 0), 0)}</span>
                  <span className="m-lbl">Oddanych Prac</span>
                </div>
                <div className="metric-box alert-box">
                  <span className="m-val">{homeworkAssignments.reduce((acc, h) => acc + (h.stats?.inReviewCount || 0), 0)}</span>
                  <span className="m-lbl">Do Sprawdzenia</span>
                </div>
                <div className="metric-box success-box">
                  <span className="m-val">{homeworkAssignments.reduce((acc, h) => acc + (h.stats?.gradedCount || 0), 0)}</span>
                  <span className="m-lbl">Ocenionych</span>
                </div>
                <div className="metric-box">
                  <span className="m-val">{homeworkAssignments.reduce((acc, h) => acc + (h.stats?.returnedCount || 0), 0)}</span>
                  <span className="m-lbl">W Poprawie</span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Status Tabs */}
          <div className="homework-status-tabs">
            <button
              className={`status-tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              Wszystkie ({homeworkAssignments.length})
            </button>
            <button
              className={`status-tab-btn ${selectedTab === 'to_submit' ? 'active' : ''}`}
              onClick={() => setSelectedTab('to_submit')}
            >
              Do oddania
            </button>
            <button
              className={`status-tab-btn ${selectedTab === 'in_review' ? 'active' : ''}`}
              onClick={() => setSelectedTab('in_review')}
            >
              Oczekujące na sprawdzenie
            </button>
            <button
              className={`status-tab-btn ${selectedTab === 'graded' ? 'active' : ''}`}
              onClick={() => setSelectedTab('graded')}
            >
              Ocenione
            </button>
            <button
              className={`status-tab-btn ${selectedTab === 'revision' ? 'active' : ''}`}
              onClick={() => setSelectedTab('revision')}
            >
              Do poprawy
            </button>
            <button
              className={`status-tab-btn ${selectedTab === 'missing' ? 'active' : ''}`}
              onClick={() => setSelectedTab('missing')}
            >
              Zaległe
            </button>
          </div>

          {/* Assignments Grid / List */}
          {loading ? (
            <div className="homework-loading-state">
              <div className="tmd-spinner"></div>
              <span>Ładowanie archiwów prac domowych...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="homework-empty-state">
              <div className="empty-seal">📜</div>
              <h3>Brak zadań domowych w wybranej kategorii</h3>
              <p>Wszystkie wymagane dysertacje i protokoły z tego zakresu zostały złożone lub nie zostały jeszcze zadane przez Katedrę.</p>
              {isProfessorOrAdmin && (
                <button
                  className="tmd-action-btn primary mt-3"
                  onClick={() => navigateToHomeworkCreator()}
                >
                  <Plus size={16} />
                  <span>Zadaj pierwszą pracę domową</span>
                </button>
              )}
            </div>
          ) : (
            <div className="homework-grid">
              {filteredList.map(hw => {
                const sub = hw.mySubmission;
                const remaining = getRemainingTimeBadge(hw.myException?.customDueDate || hw.dueDate);
                const isStudent = currentUser?.role === 'student';

                return (
                  <div
                    key={hw.id}
                    className={`homework-card ${sub ? `card-status-${sub.status}` : ''} ${hw.isFeatured ? 'featured-card' : ''}`}
                    onClick={() => handleOpenHomework(hw.id)}
                  >
                    {/* Header bar */}
                    <div className="card-top-bar">
                      <div className="card-subject-pill">
                        <span className="subject-icon">📚</span>
                        <span className="subject-name">{hw.subjectName}</span>
                      </div>
                      <div className="card-assignment-nr">
                        Zadanie nr {hw.assignmentNumber}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="card-body">
                      <h3 className="card-title">„{hw.title}”</h3>
                      <p className="card-desc">
                        {hw.description || (hw.instructions ? hw.instructions.slice(0, 140) + '...' : 'Szczegółowa praca pisemna z kanonu przedmiotu.')}
                      </p>

                      {/* Linked Lesson Badge */}
                      {hw.lessonTitle && (
                        <div className="card-lesson-link">
                          <BookOpen size={12} />
                          <span>Lekcja: {hw.lessonTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Deadlines */}
                    <div className="card-meta-section">
                      <div className="meta-row">
                        <span className="meta-lbl">Profesor:</span>
                        <span className="meta-val">{hw.professorName}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-lbl">Termin:</span>
                        <span className="meta-val due-date-val">
                          {new Date(hw.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}, {new Date(hw.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-lbl">Maksymalnie:</span>
                        <span className="meta-val gold">{hw.maxPoints} pkt</span>
                      </div>

                      {/* Remaining time countdown badge */}
                      {remaining && (!sub || sub.status === 'draft') && (
                        <div className={`meta-remaining-badge urgency-${remaining.urgency}`}>
                          <Clock size={12} />
                          <span>{remaining.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Student Status or Professor Stats Footer */}
                    <div className="card-footer">
                      {isStudent ? (
                        <div className="student-status-footer">
                          {sub?.status === 'graded' ? (
                            <div className="status-graded-badge">
                              <span className="score-val">{sub.gradeScore} / {sub.gradeMax} pkt</span>
                              <span className="grade-name">{sub.gradeLabel || 'WYBITNY'}</span>
                              {sub.housePointsAwarded > 0 && (
                                <span className="house-bonus-pill">+{sub.housePointsAwarded} pkt Zakonu</span>
                              )}
                            </div>
                          ) : sub?.status === 'submitted' || sub?.status === 'resubmitted' || sub?.status === 'late' ? (
                            <div className="status-submitted-badge">
                              <CheckCircle2 size={14} />
                              <span>ODDANO (Wersja {sub.currentVersion || 1}) • Oczekuje na ocenę</span>
                            </div>
                          ) : sub?.status === 'returned_for_revision' ? (
                            <div className="status-revision-badge">
                              <AlertTriangle size={14} />
                              <span>DO POPRAWY: {sub.revisionReason?.slice(0, 45)}...</span>
                            </div>
                          ) : sub?.status === 'draft' ? (
                            <div className="status-draft-badge">
                              <FileText size={14} />
                              <span>SZKIC ZAPISANY ({sub.wordCount || 0} słów)</span>
                            </div>
                          ) : (
                            <div className="status-pending-badge">
                              <Clock size={14} />
                              <span>DO ODDANIA</span>
                            </div>
                          )}

                          <button className="card-action-btn primary" onClick={() => handleOpenHomework(hw.id)}>
                            <span>OTWÓRZ</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="professor-status-footer">
                          <div className="prof-stats-pills">
                            <span className="p-stat" title="Wszystkie oddane">
                              Oddano: <strong>{hw.stats?.totalSubmissions || 0}</strong>
                            </span>
                            <span className="p-stat alert" title="Oczekują na sprawdzenie">
                              Do spr.: <strong>{hw.stats?.inReviewCount || 0}</strong>
                            </span>
                            <span className="p-stat success" title="Ocenione">
                              Oceniono: <strong>{hw.stats?.gradedCount || 0}</strong>
                            </span>
                          </div>

                          <div className="prof-card-buttons">
                            <button
                              className="card-action-btn secondary icon-only"
                              onClick={(e) => handleDuplicate(hw.id, e)}
                              title="Duplikuj zadanie"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              className="card-action-btn primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenGrading(hw.id);
                              }}
                            >
                              <span>SPRAWDZAJ</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Templates Modal */}
      {templatesModalOpen && (
        <HomeworkTemplatesModal
          onClose={() => setTemplatesModalOpen(false)}
          onUseTemplate={(tpl) => {
            setTemplatesModalOpen(false);
            navigateToHomeworkCreator({ template: tpl });
          }}
        />
      )}

      {/* Quick Comments Modal */}
      {commentsModalOpen && (
        <HomeworkQuickCommentsModal
          onClose={() => setCommentsModalOpen(false)}
        />
      )}
    </div>
  );
};
