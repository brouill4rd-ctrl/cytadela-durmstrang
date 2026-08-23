import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Send,
  CheckCircle,
  FileText,
  User,
  Award,
  Layers,
  ChevronRight,
  Filter,
  Scroll,
  Shield,
  Flame,
  ArrowRight,
  MapPin,
  Clock,
  ExternalLink,
  Search,
  LayoutGrid,
  ListOrdered,
  Maximize2,
  X,
  Compass,
  Zap,
  Bookmark,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Activity
} from 'lucide-react';

export const AcademicView = () => {
  const {
    subjects,
    activeSubjectId,
    setActiveSubjectId,
    setActiveView,
    currentRole,
    studentProfile,
    submitHomework,
    gradeHomework,
    homeworkSubmissions,
    houses
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  // Primary State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'curriculum' | 'studio' | 'categories'
  const [selectedYearTab, setSelectedYearTab] = useState('all'); // 'all' | 'year-1' | 'year-2' | 'both'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'name' | 'lessons' | 'code'
  const [auroraEnabled, setAuroraEnabled] = useState(true); // Atmospheric Northern Lights toggle

  // Selected subject for Studio view & Quick Inspector modal
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjectId || (subjects[0]?.id || 'czarna-magia'));
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [inspectorSubject, setInspectorSubject] = useState(null); // When open, shows modal
  const [inspectorLessonIndex, setInspectorLessonIndex] = useState(0);

  // Homework & Grading local state
  const [homeworkText, setHomeworkText] = useState('');
  const [gradingScores, setGradingScores] = useState({});

  // Sync activeSubjectId from context if it changes externally
  useEffect(() => {
    if (activeSubjectId) {
      setSelectedSubjectId(activeSubjectId);
    }
  }, [activeSubjectId]);

  // Helper to check if subject belongs to Year 1 or Year 2
  const subjectBelongsToYear = (s, year) => {
    if (!s) return false;
    const years = s.classYears || (Array.isArray(s.classYear) ? s.classYear : [s.classYear]);
    if (year === 1) {
      return years.some(y => y === 'Klasa I' || y === 1 || y === '1' || (typeof y === 'string' && y.includes('I') && !y.includes('II')));
    }
    if (year === 2) {
      return years.some(y => y === 'Klasa II' || y === 2 || y === '2' || (typeof y === 'string' && y.includes('II')));
    }
    return true;
  };

  const getYearBadge = (s) => {
    const isY1 = subjectBelongsToYear(s, 1);
    const isY2 = subjectBelongsToYear(s, 2);
    if (isY1 && isY2) {
      return { label: 'Klasa I & II', color: '#f3d995', bg: 'rgba(197, 159, 78, 0.18)', border: 'rgba(197, 159, 78, 0.45)', rune: 'ᛞ' };
    }
    if (isY1) {
      return { label: 'I Klasa • Fundamenty', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', rune: 'ᚠ' };
    }
    if (isY2) {
      return { label: 'II Klasa • Zaawansowana', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.45)', rune: 'ᛏ' };
    }
    return { label: 'Katedra Ogólna', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', rune: 'ᚱ' };
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Sztuki Zakazane':
        return { border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.12)' };
      case 'Magia Praktyczna':
        return { border: 'rgba(56, 189, 248, 0.4)', text: '#7dd3fc', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'Alchemia & Warzenie':
      case 'Eliksiry':
        return { border: 'rgba(46, 196, 182, 0.4)', text: '#5eead4', bg: 'rgba(46, 196, 182, 0.12)' };
      case 'Przyroda Magiczna':
        return { border: 'rgba(34, 197, 94, 0.4)', text: '#86efac', bg: 'rgba(34, 197, 94, 0.12)' };
      case 'Obrona & Przetrwanie':
      case 'Sztuka Bojowa':
        return { border: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5', bg: 'rgba(239, 68, 68, 0.12)' };
      case 'Kosmologia':
      case 'Astronomia':
        return { border: 'rgba(99, 102, 241, 0.4)', text: '#a5b4fc', bg: 'rgba(99, 102, 241, 0.12)' };
      case 'Historia & Kroniki':
      case 'Nauki Ścisłe Magii':
      case 'Języki I Inskrypcje':
        return { border: 'rgba(245, 158, 11, 0.4)', text: '#fde68a', bg: 'rgba(245, 158, 11, 0.12)' };
      default:
        return { border: 'rgba(197, 159, 78, 0.35)', text: 'var(--gold-glow)', bg: 'rgba(197, 159, 78, 0.1)' };
    }
  };

  // House tag resolver
  const getHouseBadge = (houseKey) => {
    if (!houseKey) return null;
    const key = houseKey.toLowerCase();
    if (key.includes('kruk') || key.includes('ravn')) return { name: 'Ravnheim', color: '#c084fc', border: 'rgba(192, 132, 252, 0.4)', bg: 'rgba(88, 28, 135, 0.2)' };
    if (key.includes('renifer') || key.includes('rein')) return { name: 'Reinhall', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(139, 30, 45, 0.25)' };
    if (key.includes('niedzw') || key.includes('bjorn')) return { name: 'Bjornhall', color: '#f87171', border: 'rgba(248, 113, 113, 0.4)', bg: 'rgba(153, 27, 27, 0.25)' };
    if (key.includes('waz') || key.includes('oter') || key.includes('wydra')) return { name: 'Otergard', color: '#2dd4bf', border: 'rgba(45, 212, 191, 0.4)', bg: 'rgba(15, 118, 110, 0.25)' };
    return null;
  };

  // Filtered & Sorted Subjects List
  const processedSubjects = useMemo(() => {
    return subjects
      .filter(s => {
        if (selectedYearTab === 'year-1' && !subjectBelongsToYear(s, 1)) return false;
        if (selectedYearTab === 'year-2' && !subjectBelongsToYear(s, 2)) return false;
        if (selectedYearTab === 'both' && (!subjectBelongsToYear(s, 1) || !subjectBelongsToYear(s, 2))) return false;
        if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (s.name || '').toLowerCase().includes(q);
          const matchCode = (s.code || '').toLowerCase().includes(q);
          const matchProf = ((s.professorName || s.professor) || '').toLowerCase().includes(q);
          const matchRoom = (s.classroom || '').toLowerCase().includes(q);
          const matchDesc = (s.description || '').toLowerCase().includes(q);
          const matchCat = (s.category || '').toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchProf && !matchRoom && !matchDesc && !matchCat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'lessons') return (b.lessons?.length || 0) - (a.lessons?.length || 0);
        if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
        return 0;
      });
  }, [subjects, selectedYearTab, selectedCategory, searchQuery, sortBy]);

  const allCategories = useMemo(() => {
    const set = new Set(subjects.map(s => s.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [subjects]);

  const year1Count = subjects.filter(s => subjectBelongsToYear(s, 1)).length;
  const year2Count = subjects.filter(s => subjectBelongsToYear(s, 2)).length;
  const bothYearsCount = subjects.filter(s => subjectBelongsToYear(s, 1) && subjectBelongsToYear(s, 2)).length;

  const currentStudioSubject = subjects.find(s => s.id === selectedSubjectId) || processedSubjects[0] || subjects[0] || {};
  const studioLessons = currentStudioSubject.lessons || [];
  const activeStudioLesson = studioLessons[selectedLessonIndex] || studioLessons[0] || null;

  const subjectSubmissions = homeworkSubmissions.filter(s => s.subjectId === currentStudioSubject.id);

  const studentSubmission = activeStudioLesson ? homeworkSubmissions.find(
    s => s.subjectId === currentStudioSubject.id && s.lessonId === activeStudioLesson.id && s.studentId === studentProfile?.id
  ) : null;

  const handleSubmitHomework = (subjectId, lessonId) => {
    if (!homeworkText.trim() || !lessonId) return;
    playWandSwoosh();
    submitHomework(subjectId, lessonId, homeworkText);
    setHomeworkText('');
  };

  const handleGradeSubmit = (submissionId) => {
    const data = gradingScores[submissionId] || { grade: 'Wybitny', feedback: 'Znakomita praca.' };
    playWandSwoosh();
    gradeHomework(submissionId, data.grade, data.feedback);
  };

  const navigateToSubject = (subjectId) => {
    playWandSwoosh();
    if (setActiveSubjectId) setActiveSubjectId(subjectId);
    setActiveView('subject-detail');
  };

  const openInspector = (subj) => {
    playRuneChime();
    setInspectorSubject(subj);
    setInspectorLessonIndex(0);
    setHomeworkText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }} className="animate-fade-in">
      
      {/* =========================================================================
          DYNAMIC SCOPED AURORA BOREALIS STYLES
          ========================================================================= */}
      <style>{`
        @keyframes aurora-wave-shift {
          0% {
            transform: translate(-15%, -15%) rotate(0deg) scale(1);
            opacity: 0.15;
          }
          33% {
            transform: translate(20%, 10%) rotate(120deg) scale(1.18);
            opacity: 0.24;
          }
          66% {
            transform: translate(-10%, 20%) rotate(240deg) scale(0.92);
            opacity: 0.18;
          }
          100% {
            transform: translate(-15%, -15%) rotate(360deg) scale(1);
            opacity: 0.15;
          }
        }

        @keyframes aurora-ribbon-drift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes aurora-glow-subtle {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(45, 212, 191, 0.15));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(168, 85, 247, 0.22));
          }
        }

        .durmstrang-aurora-card {
          position: relative;
          background: linear-gradient(145deg, rgba(14, 20, 32, 0.92) 0%, rgba(7, 10, 16, 0.98) 100%);
          border: 1px solid rgba(197, 159, 78, 0.25);
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .durmstrang-aurora-card:hover {
          transform: translateY(-5px);
          border-color: var(--gold-ancient);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.2);
        }

        .aurora-flowing-veil {
          position: absolute;
          inset: -60%;
          background: radial-gradient(circle at 30% 20%, rgba(45, 212, 191, 0.22) 0%, transparent 45%),
                      radial-gradient(circle at 75% 65%, rgba(56, 189, 248, 0.2) 0%, transparent 45%),
                      radial-gradient(circle at 45% 85%, rgba(168, 85, 247, 0.22) 0%, transparent 45%),
                      radial-gradient(circle at 80% 15%, rgba(243, 217, 149, 0.12) 0%, transparent 40%);
          filter: blur(32px);
          mix-blend-mode: screen;
          pointer-events: none;
          animation: aurora-wave-shift 22s ease-in-out infinite alternate;
          z-index: 1;
        }

        .aurora-header-banner {
          position: absolute;
          inset: -40%;
          background: radial-gradient(ellipse at 20% 30%, rgba(45, 212, 191, 0.25) 0%, transparent 40%),
                      radial-gradient(ellipse at 70% 70%, rgba(168, 85, 247, 0.25) 0%, transparent 45%),
                      radial-gradient(ellipse at 50% 20%, rgba(56, 189, 248, 0.2) 0%, transparent 50%);
          filter: blur(40px);
          mix-blend-mode: screen;
          pointer-events: none;
          animation: aurora-wave-shift 28s ease-in-out infinite alternate;
          z-index: 1;
        }
      `}</style>

      {/* =========================================================================
          HERO BANNER: MONUMENTAL DURMSTRANG ACADEMIA
          ========================================================================= */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.96) 0%, rgba(8, 12, 18, 0.98) 60%, rgba(4, 6, 10, 1) 100%)',
        border: '1px solid var(--gold-border)',
        borderRadius: '16px',
        padding: '2.5rem 2.2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(197, 159, 78, 0.25)',
        overflow: 'hidden'
      }}>
        
        {/* Shifting Aurora Layer in Hero */}
        {auroraEnabled && <div className="aurora-header-banner" />}

        {/* Ambient Runic Glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '5%',
          fontSize: '9rem',
          opacity: 0.04,
          fontFamily: 'var(--font-heading)',
          color: 'var(--gold-glow)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
          zIndex: 2
        }}>
          ᚦᚢᚱᛁᛋᚨᛉ
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Top Tag & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(197, 159, 78, 0.15)',
                border: '1px solid var(--gold-ancient)',
                color: '#ffe8aa',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-ui)',
                boxShadow: '0 0 12px rgba(197, 159, 78, 0.15)'
              }}>
                <Sparkles size={13} color="var(--gold-ancient)" />
                Curriculum Academicum • Dwuletni Cykl Kształcenia
              </span>

              {/* Aurora Toggle Button */}
              <button
                onClick={() => { playRuneChime(); setAuroraEnabled(!auroraEnabled); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.25rem 0.75rem',
                  background: auroraEnabled ? 'rgba(45, 212, 191, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  border: auroraEnabled ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: auroraEnabled ? '#5eead4' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Włącz lub wyłącz subtelną zorzę polarną na kafelkach"
              >
                <span>🌌 Zorza Polarna:</span>
                <span style={{ fontWeight: 800 }}>{auroraEnabled ? 'Aktywna' : 'Wyciszona'}</span>
              </button>
            </div>

            {/* Timetable Quick Jump */}
            <button
              onClick={() => { playWandSwoosh(); setActiveView('timetable'); }}
              style={{
                padding: '0.5rem 1.1rem',
                background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(15, 20, 30, 0.9) 100%)',
                border: '1px solid var(--gold-ancient)',
                borderRadius: '8px',
                color: '#ffe8aa',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Calendar size={15} color="var(--gold-ancient)" />
              <span>Harmonogram & Plan Lekcji</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: '2.5rem',
            color: '#ffffff',
            margin: '0 0 0.8rem',
            fontFamily: 'var(--font-heading)',
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 30px rgba(197, 159, 78, 0.25)',
            lineHeight: 1.15,
            letterSpacing: '0.02em'
          }}>
            Katedry i Dydaktyka Twierdzy Magii Durmstrang (TMD)
          </h1>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.98rem',
            lineHeight: 1.7,
            margin: '0 0 1.8rem',
            maxWidth: '920px',
            fontStyle: 'italic',
            borderLeft: '3px solid var(--gold-ancient)',
            paddingLeft: '1.2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '0.6rem 1.2rem',
            borderRadius: '0 8px 8px 0'
          }}>
            „W Durmstrangu magia nie jest suchą teorią spisaną na południowych pergaminach. Tutaj okiełznujemy arktyczne żywioły, zgłębiamy starożytne runy, pętamy cienie i badamy granice tego, co czarodziejski świat uznaje za zakazane.”
          </p>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('all'); }}
              style={{
                background: selectedYearTab === 'all' ? 'rgba(197, 159, 78, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'all' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.9rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(197, 159, 78, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-ancient)',
                fontSize: '1.2rem'
              }}>
                🏛️
              </div>
              <div>
                <div style={{ color: 'var(--gold-glow)', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  {subjects.length} Katedr
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Wszystkie dyscypliny akademii
                </div>
              </div>
            </div>

            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('year-1'); }}
              style={{
                background: selectedYearTab === 'year-1' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'year-1' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.9rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontSize: '1.2rem'
              }}>
                ❄️
              </div>
              <div>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  {year1Count} Przedmiotów
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  I Rok • Fundamenty Magii
                </div>
              </div>
            </div>

            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('year-2'); }}
              style={{
                background: selectedYearTab === 'year-2' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'year-2' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.9rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                fontSize: '1.2rem'
              }}>
                ⚔️
              </div>
              <div>
                <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  {year2Count} Przedmiotów
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  II Rok • Magia Zaawansowana
                </div>
              </div>
            </div>

            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('both'); }}
              style={{
                background: selectedYearTab === 'both' ? 'rgba(46, 196, 182, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'both' ? '1px solid #2ec4b6' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.9rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(46, 196, 182, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2ec4b6',
                fontSize: '1.2rem'
              }}>
                🌟
              </div>
              <div>
                <div style={{ color: '#2ec4b6', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  {bothYearsCount} Wspólne
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Ciągłość I i II Klasy
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          CONTROL HUB: SEARCH, VIEW MODES & FILTERS
          ========================================================================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        background: 'rgba(11, 15, 24, 0.88)',
        border: '1px solid rgba(197, 159, 78, 0.25)',
        borderRadius: '14px',
        padding: '1.4rem 1.6rem',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
      }}>
        
        {/* Row 1: Search Bar & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 340px',
            minWidth: '260px'
          }}>
            <Search size={16} color="var(--gold-ancient)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj katedry, profesora, sali, kodu (np. DARK-101) lub tematu..."
              style={{
                width: '100%',
                padding: '0.75rem 2.4rem 0.75rem 2.8rem',
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid rgba(197, 159, 78, 0.35)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-ui)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--gold-ancient)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(197, 159, 78, 0.35)'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* View Modes Switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(5, 8, 14, 0.8)',
            border: '1px solid rgba(197, 159, 78, 0.3)',
            borderRadius: '8px',
            padding: '0.25rem',
            gap: '0.3rem'
          }}>
            <button
              onClick={() => { playWandSwoosh(); setViewMode('grid'); }}
              title="Widok Siatki Kart (Mozaika)"
              style={{
                padding: '0.45rem 0.9rem',
                background: viewMode === 'grid' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                border: viewMode === 'grid' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                borderRadius: '6px',
                color: viewMode === 'grid' ? '#ffe8aa' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={15} />
              <span>Mozaika Kart</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setViewMode('curriculum'); }}
              title="Widok Szlaku Kształcenia (Dwuletni Program)"
              style={{
                padding: '0.45rem 0.9rem',
                background: viewMode === 'curriculum' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                border: viewMode === 'curriculum' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                borderRadius: '6px',
                color: viewMode === 'curriculum' ? '#ffe8aa' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <ListOrdered size={15} />
              <span>Szlak Kształcenia</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setViewMode('studio'); }}
              title="Widok Pracowni i Sali Wykładowej"
              style={{
                padding: '0.45rem 0.9rem',
                background: viewMode === 'studio' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                border: viewMode === 'studio' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                borderRadius: '6px',
                color: viewMode === 'studio' ? '#ffe8aa' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <BookOpen size={15} />
              <span>Pracownia & Lekcje</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={14} color="var(--gold-ancient)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                borderRadius: '6px',
                padding: '0.5rem 0.8rem',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="default">Domyślny porządek</option>
              <option value="name">Nazwa (A - Z)</option>
              <option value="lessons">Ilość materiałów</option>
              <option value="code">Kod Katedry</option>
            </select>
          </div>

        </div>

        {/* Row 2: Year Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('all'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: selectedYearTab === 'all' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'all' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: selectedYearTab === 'all' ? '#ffe8aa' : '#cbd5e1',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BookOpen size={14} color="var(--gold-ancient)" />
            <span>Wszystkie Katedry</span>
            <span style={{ background: 'rgba(197, 159, 78, 0.3)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 800 }}>
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('year-1'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: selectedYearTab === 'year-1' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'year-1' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: selectedYearTab === 'year-1' ? '#38bdf8' : '#cbd5e1',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Scroll size={14} color="#38bdf8" />
            <span>I Klasa • Fundamenty Magii</span>
            <span style={{ background: '#38bdf8', color: '#090d14', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
              {year1Count}
            </span>
          </button>

          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('year-2'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: selectedYearTab === 'year-2' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'year-2' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: selectedYearTab === 'year-2' ? '#c084fc' : '#cbd5e1',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Flame size={14} color="#a855f7" />
            <span>II Klasa • Magia Zaawansowana</span>
            <span style={{ background: '#a855f7', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
              {year2Count}
            </span>
          </button>

          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('both'); }}
            style={{
              padding: '0.55rem 1.1rem',
              background: selectedYearTab === 'both' ? 'rgba(46, 196, 182, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'both' ? '1px solid #2ec4b6' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: selectedYearTab === 'both' ? '#5eead4' : '#cbd5e1',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={14} color="#2ec4b6" />
            <span>Wspólne I & II</span>
            <span style={{ background: '#2ec4b6', color: '#090d14', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
              {bothYearsCount}
            </span>
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
            Wyników: <strong style={{ color: 'var(--gold-glow)', marginLeft: '0.35rem' }}>{processedSubjects.length}</strong>
          </div>
        </div>

        {/* Row 3: Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
          <Filter size={13} color="var(--gold-ancient)" />
          {allCategories.map(cat => {
            const isCatActive = selectedCategory === cat;
            const count = cat === 'all' 
              ? subjects.length 
              : subjects.filter(s => s.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => { playRuneChime(); setSelectedCategory(cat); }}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  border: isCatActive ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                  background: isCatActive ? 'rgba(197, 159, 78, 0.22)' : 'rgba(15, 19, 27, 0.65)',
                  color: isCatActive ? '#ffe8aa' : '#9ca3af',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s'
                }}
              >
                <span>{cat === 'all' ? 'Wszystkie dziedziny' : cat}</span>
                <span style={{
                  fontSize: '0.65rem',
                  opacity: 0.8,
                  background: isCatActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.08)',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '8px'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* =========================================================================
          VIEW MODE 1: MOZAIKA KART (GRAND RESPONSIVE CARD GRID WITH AURORA VEIL)
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          {processedSubjects.map(s => {
            const badge = getYearBadge(s);
            const catStyle = getCategoryColor(s.category);
            const houseBadge = getHouseBadge(s.house);
            const lessonCount = s.lessons?.length || 0;

            return (
              <div
                key={s.id}
                className="durmstrang-aurora-card"
              >
                {/* Dynamic Shifting Aurora Borealis Veil on each card */}
                {auroraEnabled && <div className="aurora-flowing-veil" />}

                {/* Top Corner Runic Watermark */}
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '8px',
                  fontSize: '3.6rem',
                  opacity: 0.05,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--gold-glow)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 2
                }}>
                  {badge.rune}
                </div>

                {/* Card Content Container */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  
                  <div>
                    {/* Header: Category Pill & Code */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-ui)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: catStyle.text,
                        background: catStyle.bg,
                        border: `1px solid ${catStyle.border}`,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {s.category}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--gold-ancient)',
                        letterSpacing: '0.05em'
                      }}>
                        {s.code || 'DURM-00'}
                      </span>
                    </div>

                    {/* Icon + Title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', marginBottom: '0.85rem' }}>
                      <div style={{
                        fontSize: '2.2rem',
                        lineHeight: 1,
                        flexShrink: 0,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        width: '54px',
                        height: '54px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                      }}>
                        {s.icon || '📚'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '1.28rem',
                          color: '#ffffff',
                          margin: '0 0 0.35rem',
                          fontFamily: 'var(--font-heading)',
                          lineHeight: 1.25,
                          textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                        }}>
                          {s.name}
                        </h3>

                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.5rem',
                          borderRadius: '3px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontWeight: 800,
                          fontFamily: 'var(--font-ui)'
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Professor Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(5, 8, 14, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                        <User size={13} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.professorName || s.professor || 'Prowadzący Katedry'}
                        </span>
                      </div>

                      {houseBadge && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: houseBadge.color,
                          background: houseBadge.bg,
                          border: `1px solid ${houseBadge.border}`,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '3px',
                          flexShrink: 0
                        }}>
                          {houseBadge.name}
                        </span>
                      )}
                    </div>

                    {/* Description snippet */}
                    <p style={{
                      color: '#94a3b8',
                      fontSize: '0.84rem',
                      lineHeight: 1.55,
                      margin: '0 0 1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {s.description}
                    </p>
                  </div>

                  <div>
                    {/* Meta bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                      paddingTop: '0.75rem',
                      marginBottom: '1rem',
                      fontSize: '0.78rem',
                      color: '#94a3b8'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <MapPin size={12} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#cbd5e1' }}>{s.classroom || 'Sala Wykładowa'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <BookOpen size={12} color="var(--ice-frost)" />
                        <span style={{ color: '#8ecae6', fontWeight: 700 }}>{lessonCount} {lessonCount === 1 ? 'lekcja' : (lessonCount < 5 ? 'lekcje' : 'lekcji')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <button
                        onClick={() => openInspector(s)}
                        style={{
                          padding: '0.55rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.18s'
                        }}
                      >
                        <Eye size={13} color="var(--gold-glow)" />
                        <span>Lekcje ({lessonCount})</span>
                      </button>

                      <button
                        onClick={() => navigateToSubject(s.id)}
                        style={{
                          padding: '0.55rem 0.75rem',
                          background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(197, 159, 78, 0.1) 100%)',
                          border: '1px solid var(--gold-ancient)',
                          borderRadius: '6px',
                          color: '#ffe8aa',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.18s'
                        }}
                      >
                        <span>Strona Katedry</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: SZLAK KSZTAŁCENIA (CURRICULUM PROGRAM BY YEAR)
          ========================================================================= */}
      {viewMode === 'curriculum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* SECTION: I KLASA — FUNDAMENTY MAGII */}
          {(selectedYearTab === 'all' || selectedYearTab === 'year-1' || selectedYearTab === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(14, 38, 64, 0.8) 0%, rgba(6, 12, 22, 0.95) 100%)',
                border: '1px solid #38bdf8',
                borderRadius: '12px',
                padding: '1.5rem 1.8rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                {auroraEnabled && <div className="aurora-header-banner" />}
                
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: '#38bdf8', color: '#090d14', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                      I Rok Nauki
                    </span>
                    <span style={{ color: '#7dd3fc', fontSize: '0.8rem', fontWeight: 700 }}>
                      14 Dyscyplin Podstawowych
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    Fundamenty Magii & Inicjacja Północna
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0.4rem 0 0', maxWidth: '750px' }}>
                    Pierwszoroczni adepci poznają szerokie spektrum podstawowych dyscyplin magicznych: od eliksirów i zielarstwa po manipulację siłami cienia i obronę przed ciemnymi mocami.
                  </p>
                </div>

                <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '1.8rem', color: '#38bdf8', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                    {subjects.filter(s => subjectBelongsToYear(s, 1)).length} Katedr
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem' }}>
                {subjects
                  .filter(s => subjectBelongsToYear(s, 1))
                  .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
                  .filter(s => !searchQuery || (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(s => {
                    const lessonCount = s.lessons?.length || 0;
                    return (
                      <div
                        key={s.id}
                        onClick={() => openInspector(s)}
                        className="durmstrang-aurora-card"
                        style={{ cursor: 'pointer', padding: '1.2rem' }}
                      >
                        {auroraEnabled && <div className="aurora-flowing-veil" />}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{s.icon || '📚'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.68rem', color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase' }}>
                                {s.code} • {s.category}
                              </div>
                              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.98rem', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                {s.professorName || s.professor}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              {lessonCount} lekcji
                            </span>
                            <ChevronRight size={16} color="#7dd3fc" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>
          )}

          {/* SECTION: II KLASA — MAGIA ZAAWANSOWANA */}
          {(selectedYearTab === 'all' || selectedYearTab === 'year-2' || selectedYearTab === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(38, 14, 60, 0.8) 0%, rgba(12, 6, 20, 0.95) 100%)',
                border: '1px solid #a855f7',
                borderRadius: '12px',
                padding: '1.5rem 1.8rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                overflow: 'hidden'
              }}>
                {auroraEnabled && <div className="aurora-header-banner" />}

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: '#a855f7', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                      II Rok Nauki
                    </span>
                    <span style={{ color: '#d8b4fe', fontSize: '0.8rem', fontWeight: 700 }}>
                      10 Dyscyplin Mistrzowskich & Północnych
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    Magia Zaawansowana & Sztuki Zakazane Północy
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0.4rem 0 0', maxWidth: '750px' }}>
                    Na drugim roku nauki podstawowe dziedziny ustępują miejsca unikalnym, wymagającym dyscyplinom: sztuce bojowej, magii pierwotnej, kosmologii i rytuałom.
                  </p>
                </div>

                <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '1.8rem', color: '#c084fc', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                    {subjects.filter(s => subjectBelongsToYear(s, 2)).length} Katedr
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem' }}>
                {subjects
                  .filter(s => subjectBelongsToYear(s, 2))
                  .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
                  .filter(s => !searchQuery || (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(s => {
                    const lessonCount = s.lessons?.length || 0;
                    return (
                      <div
                        key={s.id}
                        onClick={() => openInspector(s)}
                        className="durmstrang-aurora-card"
                        style={{ cursor: 'pointer', padding: '1.2rem' }}
                      >
                        {auroraEnabled && <div className="aurora-flowing-veil" />}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
                            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{s.icon || '⚔️'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.68rem', color: '#d8b4fe', fontWeight: 800, textTransform: 'uppercase' }}>
                                {s.code} • {s.category}
                              </div>
                              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.98rem', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                {s.professorName || s.professor}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              {lessonCount} lekcji
                            </span>
                            <ChevronRight size={16} color="#c084fc" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: PRACOWNIA & SALA WYKŁADOWA (STUDIO & HOMEWORK WORKSHOP)
          ========================================================================= */}
      {viewMode === 'studio' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Spacious Subject Picker */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: '900px',
            overflowY: 'auto',
            paddingRight: '0.4rem'
          }}>
            <div style={{ color: 'var(--gold-glow)', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Wybierz Katedrę do nauki:
            </div>

            {processedSubjects.map(s => {
              const isSelected = s.id === currentStudioSubject.id;
              const badge = getYearBadge(s);

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    playWandSwoosh();
                    setSelectedSubjectId(s.id);
                    setSelectedLessonIndex(0);
                  }}
                  className={isSelected ? "durmstrang-aurora-card" : ""}
                  style={{
                    padding: '1rem 1.1rem',
                    background: isSelected ? 'rgba(26, 35, 52, 0.95)' : 'rgba(11, 15, 22, 0.85)',
                    border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.8rem',
                    boxShadow: isSelected ? '0 0 20px rgba(197, 159, 78, 0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isSelected && auroraEnabled && <div className="aurora-flowing-veil" />}
                  {isSelected && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--gold-ancient)', borderRadius: '10px 0 0 10px', zIndex: 3 }} />
                  )}

                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', minWidth: 0 }}>
                    <span style={{ fontSize: '1.8rem', flexShrink: 0, lineHeight: 1 }}>{s.icon || '📚'}</span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.66rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '3px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontWeight: 800,
                          fontFamily: 'var(--font-ui)'
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isSelected ? '#ffffff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.name}
                      </div>

                      <div style={{
                        fontSize: '0.76rem',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <User size={11} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />
                        <span>{s.professorName || s.professor || 'Prowadzący Katedry'}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} color={isSelected ? 'var(--gold-ancient)' : '#4b5563'} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Classroom Studio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', minWidth: 0 }}>
            
            {/* Subject Overview Card */}
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(18, 25, 38, 0.95) 0%, rgba(8, 12, 18, 0.98) 100%)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '14px',
              padding: '2rem',
              boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}>
              {auroraEnabled && <div className="aurora-header-banner" />}

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--gold-ancient)', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-ui)', fontWeight: 800 }}>
                        {currentStudioSubject.category} • KOD: {currentStudioSubject.code}
                      </span>
                      {(() => {
                        const badge = getYearBadge(currentStudioSubject);
                        return (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.12rem 0.5rem',
                            borderRadius: '4px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            fontWeight: 800
                          }}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    <h2 style={{ fontSize: '2rem', color: '#ffffff', margin: '0 0 0.4rem', fontFamily: 'var(--font-heading)' }}>
                      {currentStudioSubject.name}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
                    <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '6px', fontSize: '0.84rem', color: '#e5e7eb' }}>
                      Wykładowca: <strong style={{ color: 'var(--gold-ancient)' }}>{currentStudioSubject.professorName || currentStudioSubject.professor}</strong>
                    </div>

                    <button
                      onClick={() => navigateToSubject(currentStudioSubject.id)}
                      style={{
                        padding: '0.55rem 1.2rem',
                        background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(197, 159, 78, 0.15) 100%)',
                        border: '1px solid var(--gold-ancient)',
                        borderRadius: '6px',
                        color: '#ffe8aa',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Scroll size={15} />
                      <span>Dziennik & Pełna Katedra</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '1.4rem' }}>
                  {currentStudioSubject.description}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.86rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} color="var(--gold-ancient)" />
                    <span>Sala: <strong style={{ color: '#ffffff' }}>{currentStudioSubject.classroom || 'Sala Wykładowa'}</strong></span>
                  </div>
                  {currentStudioSubject.syllabus && !currentStudioSubject.syllabus.includes('#') && (
                    <div>Sylabus: <strong style={{ color: '#ffffff' }}>{currentStudioSubject.syllabus}</strong></div>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Content Reader */}
            {studioLessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.6rem', overflowX: 'auto' }}>
                  {studioLessons.map((lesson, idx) => (
                    <button
                      key={lesson.id || idx}
                      onClick={() => setSelectedLessonIndex(idx)}
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: selectedLessonIndex === idx ? 'rgba(197, 159, 78, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                        border: selectedLessonIndex === idx ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        color: selectedLessonIndex === idx ? '#ffffff' : '#9ca3af',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <BookOpen size={14} color={selectedLessonIndex === idx ? 'var(--gold-ancient)' : '#9ca3af'} />
                      <span>{lesson.title ? lesson.title.split(':')[0] : `Lekcja ${idx + 1}`}</span>
                    </button>
                  ))}
                </div>

                {activeStudioLesson && (
                  <div style={{
                    background: 'rgba(12, 17, 26, 0.95)',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                        {activeStudioLesson.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.82rem', color: '#94a3af' }}>
                        {activeStudioLesson.duration && <span>⏱️ Czas: {activeStudioLesson.duration}</span>}
                        {activeStudioLesson.difficulty && (
                          <>
                            <span>•</span>
                            <span>⚔️ Trudność: {activeStudioLesson.difficulty}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ whiteSpace: 'pre-line', color: '#cfd7e4', fontSize: '0.98rem', lineHeight: 1.85, marginBottom: '2rem' }}>
                      {activeStudioLesson.content}
                    </div>

                    {activeStudioLesson.materials && activeStudioLesson.materials.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '1.2rem', marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.88rem', color: 'var(--gold-glow)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                          <BookOpen size={15} /> Wymagane Grimuary i Rekwizyty:
                        </h4>
                        <ul style={{ listStyle: 'square inside', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingLeft: '0.5rem' }}>
                          {activeStudioLesson.materials.map((mat, i) => (
                            <li key={i}>{mat}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeStudioLesson.assignment && (
                      <div style={{ borderTop: '1px solid rgba(197, 159, 78, 0.3)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.8rem' }}>
                          <div>
                            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', fontWeight: 800 }}>
                              Oficjalne Zadanie Domowe Katedry
                            </span>
                            <h4 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0.2rem 0 0', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                              {activeStudioLesson.assignment.title}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
                            <span style={{ background: 'rgba(197, 159, 78, 0.2)', color: '#ffe8aa', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                              +{activeStudioLesson.assignment.maxPoints} pkt
                            </span>
                            <span style={{ background: 'rgba(46, 196, 182, 0.2)', color: '#8cefe6', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                              +{activeStudioLesson.assignment.rewardXp} XP
                            </span>
                            <span style={{ background: 'rgba(197, 159, 78, 0.2)', color: '#ffe8aa', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                              +{activeStudioLesson.assignment.rewardCurrency} Skirnirów
                            </span>
                          </div>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '1.2rem', lineHeight: 1.65 }}>
                          {activeStudioLesson.assignment.description}
                        </p>

                        {studentSubmission ? (
                          <div style={{ background: 'rgba(16, 25, 20, 0.9)', border: '1px solid #2ec4b6', borderRadius: '8px', padding: '1.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ec4b6', fontWeight: 700, marginBottom: '0.6rem' }}>
                              <CheckCircle size={18} /> Twoja praca została zarejestrowana ({studentSubmission.submittedAt})
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontStyle: 'italic', marginBottom: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px' }}>
                              „{studentSubmission.content}”
                            </div>
                            {studentSubmission.status === 'graded' ? (
                              <div style={{ borderTop: '1px solid rgba(46, 196, 182, 0.3)', paddingTop: '0.8rem', fontSize: '0.88rem' }}>
                                <span style={{ color: 'var(--gold-glow)', fontWeight: 700 }}>Ocena: {studentSubmission.grade}</span> • <span>Ocenił: {studentSubmission.gradedBy}</span>
                                <div style={{ color: '#9ca3af', marginTop: '0.3rem' }}>Komentarz: {studentSubmission.feedback}</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.84rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={14} /> Status: Oczekuje na recenzję profesora Katedry.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <textarea
                              rows={4}
                              value={homeworkText}
                              onChange={(e) => setHomeworkText(e.target.value)}
                              placeholder="Wpisz treść swojego eseju, obliczeń lub analizy runicznej..."
                              style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(10, 14, 22, 0.95)',
                                border: '1px solid rgba(197, 159, 78, 0.3)',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '0.92rem',
                                outline: 'none',
                                fontFamily: 'var(--font-ui)'
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleSubmitHomework(currentStudioSubject.id, activeStudioLesson.id)}
                                style={{
                                  padding: '0.65rem 1.4rem',
                                  background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(197, 159, 78, 0.15) 100%)',
                                  border: '1px solid var(--gold-ancient)',
                                  borderRadius: '6px',
                                  color: '#ffe8aa',
                                  fontSize: '0.88rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <Send size={15} /> Prześlij Pracę do Profesora
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            ) : (
              <div style={{
                background: 'rgba(10, 14, 22, 0.8)',
                border: '1px solid rgba(197, 159, 78, 0.25)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center'
              }}>
                <BookOpen size={42} color="var(--gold-ancient)" style={{ opacity: 0.6, marginBottom: '1rem' }} />
                <h3 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', margin: '0 0 0.6rem' }}>
                  Księgi Dydaktyczne Katedry {currentStudioSubject.name}
                </h3>
                <p style={{ color: '#94a3af', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.8rem', lineHeight: 1.6 }}>
                  Przejdź na dedykowaną stronę katedry, aby przejrzeć pełny plan nauczania, regulamin zajęć, dzienniki lekcyjne powiązane z Discordem oraz księgę ocen HP.
                </p>
                <button
                  onClick={() => navigateToSubject(currentStudioSubject.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.6rem',
                    background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(197, 159, 78, 0.1) 100%)',
                    border: '1px solid var(--gold-ancient)',
                    borderRadius: '8px',
                    color: '#ffe8aa',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Scroll size={16} /> Otwórz Stronę Katedry
                </button>
              </div>
            )}

            {/* Professor Grading Section */}
            {(currentRole === 'professor' || currentRole === 'admin') && subjectSubmissions.length > 0 && (
              <div style={{
                background: 'rgba(15, 12, 28, 0.95)',
                border: '1px solid #c084fc',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.4rem', color: '#d8c2ff' }}>
                  <GraduationCap size={22} />
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    Panel Oceniania Prac Uczniów ({subjectSubmissions.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {subjectSubmissions.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        padding: '1.3rem',
                        background: 'rgba(10, 8, 18, 0.9)',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ color: '#ffffff', fontSize: '0.96rem' }}>{sub.studentName}</strong> ({sub.house}) • <span style={{ color: 'var(--gold-ancient)' }}>{sub.lessonTitle}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{sub.submittedAt}</span>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.9rem', borderRadius: '6px', fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '1rem', fontStyle: 'italic' }}>
                        „{sub.content}”
                      </div>

                      {sub.status === 'graded' ? (
                        <div style={{ fontSize: '0.88rem', color: '#2ec4b6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={15} /> Wystawiono ocenę: <strong>{sub.grade}</strong> ({sub.feedback})
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            style={{
                              background: 'rgba(20, 16, 32, 0.95)',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              borderRadius: '6px',
                              padding: '0.5rem 0.8rem',
                              color: '#ffffff',
                              fontSize: '0.84rem'
                            }}
                            defaultValue="Wybitny"
                            onChange={(e) => setGradingScores(prev => ({
                              ...prev,
                              [sub.id]: { ...(prev[sub.id] || {}), grade: e.target.value }
                            }))}
                          >
                            <option value="Wybitny">Wybitny (W)</option>
                            <option value="Powyżej oczekiwań">Powyżej oczekiwań (P)</option>
                            <option value="Zadowalający">Zadowalający (Z)</option>
                            <option value="Poniżej oczekiwań">Poniżej oczekiwań (N)</option>
                            <option value="Troll">Troll (T)</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Komentarz profesorski..."
                            style={{
                              flex: 1,
                              minWidth: '200px',
                              background: 'rgba(20, 16, 32, 0.95)',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              borderRadius: '6px',
                              padding: '0.5rem 0.8rem',
                              color: '#ffffff',
                              fontSize: '0.84rem'
                            }}
                            onChange={(e) => setGradingScores(prev => ({
                              ...prev,
                              [sub.id]: { ...(prev[sub.id] || {}), feedback: e.target.value }
                            }))}
                          />

                          <button
                            onClick={() => handleGradeSubmit(sub.id)}
                            style={{
                              padding: '0.55rem 1.1rem',
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(126, 34, 206, 0.6) 100%)',
                              border: '1px solid #c084fc',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer'
                            }}
                          >
                            Zatwierdź Ocenę (+30 pkt)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          QUICK LESSON INSPECTOR MODAL
          ========================================================================= */}
      {inspectorSubject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 5, 8, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}
        onClick={() => setInspectorSubject(null)}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(16, 22, 34, 0.98) 0%, rgba(8, 12, 18, 0.99) 100%)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem 2.2rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(197, 159, 78, 0.3)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {auroraEnabled && <div className="aurora-header-banner" />}

            <button
              onClick={() => setInspectorSubject(null)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
                zIndex: 3
              }}
            >
              <X size={18} />
            </button>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1.2rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{inspectorSubject.icon || '📚'}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--gold-ancient)', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {inspectorSubject.category} • {inspectorSubject.code}
                    </span>
                    {(() => {
                      const badge = getYearBadge(inspectorSubject);
                      return (
                        <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '3px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontWeight: 800 }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {inspectorSubject.name}
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Wykładowca: <strong style={{ color: '#ffffff' }}>{inspectorSubject.professorName || inspectorSubject.professor}</strong> • Sala: <strong style={{ color: '#ffffff' }}>{inspectorSubject.classroom || 'Sala Wykładowa'}</strong>
                  </div>
                </div>
              </div>

              {inspectorSubject.lessons && inspectorSubject.lessons.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                    {inspectorSubject.lessons.map((les, idx) => (
                      <button
                        key={les.id || idx}
                        onClick={() => setInspectorLessonIndex(idx)}
                        style={{
                          padding: '0.55rem 1.1rem',
                          background: inspectorLessonIndex === idx ? 'rgba(197, 159, 78, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                          border: inspectorLessonIndex === idx ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: inspectorLessonIndex === idx ? '#ffffff' : '#9ca3af',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {les.title ? les.title.split(':')[0] : `Lekcja ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const les = inspectorSubject.lessons[inspectorLessonIndex] || inspectorSubject.lessons[0];
                    if (!les) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
                          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0 0 0.3rem', fontFamily: 'var(--font-heading)' }}>
                            {les.title}
                          </h3>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            ⏱️ Czas: {les.duration || '45 min'} • ⚔️ Trudność: {les.difficulty || 'Średnia'}
                          </div>
                        </div>

                        <div style={{ whiteSpace: 'pre-line', color: '#cfd7e4', fontSize: '0.94rem', lineHeight: 1.8 }}>
                          {les.content}
                        </div>

                        {les.materials && les.materials.length > 0 && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '8px', padding: '1rem 1.2rem' }}>
                            <div style={{ color: 'var(--gold-glow)', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                              📖 Wymagane Materiały:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.6 }}>
                              {les.materials.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}

                        {les.assignment && (
                          <div style={{ background: 'rgba(15, 20, 30, 0.9)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '8px', padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ color: 'var(--gold-ancient)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800 }}>
                                Zadanie Domowe
                              </span>
                              <span style={{ color: '#5eead4', fontSize: '0.78rem', fontWeight: 800 }}>
                                +{les.assignment.maxPoints} pkt • +{les.assignment.rewardXp} XP
                              </span>
                            </div>
                            <h4 style={{ color: '#ffffff', margin: '0 0 0.4rem', fontSize: '1rem' }}>
                              {les.assignment.title}
                            </h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                              {les.assignment.description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.94rem' }}>
                    Szczegółowe materiały i rejestr ocen tej katedry znajdują się w pełnym dossier.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
                <button
                  onClick={() => setInspectorSubject(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Zamknij Podgląd
                </button>

                <button
                  onClick={() => {
                    setInspectorSubject(null);
                    navigateToSubject(inspectorSubject.id);
                  }}
                  style={{
                    padding: '0.6rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(197, 159, 78, 0.15) 100%)',
                    border: '1px solid var(--gold-ancient)',
                    borderRadius: '6px',
                    color: '#ffe8aa',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Scroll size={15} />
                  <span>Otwórz Pełną Stronę Katedry</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
