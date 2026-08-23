import React, { useState, useEffect } from 'react';
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
  ExternalLink
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

  // Selected year tab: 'all' | 'year-1' | 'year-2'
  const [selectedYearTab, setSelectedYearTab] = useState('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjectId || 'zaklecia');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [homeworkText, setHomeworkText] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Professor grading local state
  const [gradingScores, setGradingScores] = useState({});

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
      return { label: 'Klasa I & II', color: '#c59f4e', bg: 'rgba(197, 159, 78, 0.15)', border: 'rgba(197, 159, 78, 0.4)' };
    }
    if (isY1) {
      return { label: 'I Klasa • Fundamenty', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' };
    }
    if (isY2) {
      return { label: 'II Klasa • Zaawansowana', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' };
    }
    return { label: 'Katedra Ogólna', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)' };
  };

  // Filter by year tab first
  const yearFilteredSubjects = subjects.filter(s => {
    if (selectedYearTab === 'year-1') return subjectBelongsToYear(s, 1);
    if (selectedYearTab === 'year-2') return subjectBelongsToYear(s, 2);
    return true;
  });

  // Unique categories for the current year tab
  const availableCategories = ['all', ...new Set(yearFilteredSubjects.map(s => s.category).filter(Boolean))];

  // Then filter by category
  const filteredSubjects = filterCategory === 'all'
    ? yearFilteredSubjects
    : yearFilteredSubjects.filter(s => s.category === filterCategory);

  // Keep selectedSubjectId valid when filters change
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const exists = filteredSubjects.some(s => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(filteredSubjects[0].id);
        setSelectedLessonIndex(0);
      }
    }
  }, [selectedYearTab, filterCategory, filteredSubjects, selectedSubjectId]);

  // Selected subject
  const subject = subjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0] || subjects[0] || {};
  const lessonsList = subject.lessons || [];
  const currentLesson = lessonsList[selectedLessonIndex] || lessonsList[0] || null;

  // Submissions for this subject
  const subjectSubmissions = homeworkSubmissions.filter(s => s.subjectId === subject.id);

  // Student's completed submission for this lesson
  const studentSubmission = currentLesson ? homeworkSubmissions.find(
    s => s.subjectId === subject.id && s.lessonId === currentLesson.id && s.studentId === studentProfile?.id
  ) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!homeworkText.trim() || !currentLesson) return;

    playWandSwoosh();
    submitHomework(subject.id, currentLesson.id, homeworkText);
    setHomeworkText('');
  };

  const handleGradeSubmit = (submissionId) => {
    const data = gradingScores[submissionId] || { grade: 'Wybitny', feedback: 'Znakomita praca.' };
    playWandSwoosh();
    gradeHomework(submissionId, data.grade, data.feedback);
  };

  const year1Count = subjects.filter(s => subjectBelongsToYear(s, 1)).length;
  const year2Count = subjects.filter(s => subjectBelongsToYear(s, 2)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.2rem' }} className="animate-fade-in">
      
      {/* =========================================================================
          HERO BANNER: OFERTA EDUKACYJNA CYTADELI DURMSTRANG
          ========================================================================= */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(20, 26, 38, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
        border: '1px solid rgba(197, 159, 78, 0.35)',
        borderRadius: '12px',
        padding: '2.2rem 2rem',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Decorative Runes in background */}
        <div style={{
          position: 'absolute',
          right: '-10px',
          top: '-20px',
          fontSize: '7rem',
          opacity: 0.03,
          fontFamily: 'var(--font-heading)',
          color: 'var(--gold-ancient)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          ᚠᚢᚦᚨᚱᚲ
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid rgba(197, 159, 78, 0.4)',
              color: 'var(--gold-ancient)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-ui)'
            }}>
              Curriculum Academicum • Dwuletni Cykl Kształcenia
            </span>
          </div>

          <h1 style={{
            fontSize: '2.2rem',
            color: '#ffffff',
            margin: '0 0 0.8rem',
            fontFamily: 'var(--font-heading)',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
            lineHeight: 1.2
          }}>
            Oferta Edukacyjna Cytadeli Durmstrang
          </h1>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            margin: '0 0 1.5rem',
            fontStyle: 'italic',
            borderLeft: '3px solid var(--gold-ancient)',
            paddingLeft: '1rem'
          }}>
            „Cytadela prowadzi dwuletni cykl nauki, w którym pierwszy rok poświęcony jest poznaniu fundamentów magii, a drugi — zagłębieniu się w dziedziny szczególnie ważne dla północnej tradycji magicznej.”
          </p>

          {/* Quick Switch Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Box Klasa I */}
            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('year-1'); setFilterCategory('all'); }}
              style={{
                background: selectedYearTab === 'year-1' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'year-1' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '1rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-ui)', letterSpacing: '0.04em' }}>
                  I KLASA • FUNDAMENTY MAGII
                </span>
                <span style={{ background: '#38bdf8', color: '#090d14', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                  {year1Count} przedmiotów
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                Pierwszoroczni poznają szerokie spektrum podstawowych dyscyplin magicznych, zanim zdecydują o dalszej ścieżce.
              </p>
            </div>

            {/* Box Klasa II */}
            <div
              onClick={() => { playRuneChime(); setSelectedYearTab('year-2'); setFilterCategory('all'); }}
              style={{
                background: selectedYearTab === 'year-2' ? 'rgba(168, 85, 247, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedYearTab === 'year-2' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '1rem 1.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-ui)', letterSpacing: '0.04em' }}>
                  II KLASA • MAGIA ZAAWANSOWANA
                </span>
                <span style={{ background: '#a855f7', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                  {year2Count} przedmiotów
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                Podstawowe dziedziny ustępują miejsca niezwykłym i wymagającym północnym sztukom magicznym.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          YEAR SELECTION & CATEGORY FILTER TABS
          ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {/* Main Year Navigation */}
        <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('all'); setFilterCategory('all'); }}
            style={{
              padding: '0.65rem 1.2rem',
              background: selectedYearTab === 'all' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'all' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
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
            <span style={{ background: 'rgba(197, 159, 78, 0.3)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => { playWandSwoosh(); setSelectedYearTab('year-1'); setFilterCategory('all'); }}
            style={{
              padding: '0.65rem 1.2rem',
              background: selectedYearTab === 'year-1' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'year-1' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
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
            onClick={() => { playWandSwoosh(); setSelectedYearTab('year-2'); setFilterCategory('all'); }}
            style={{
              padding: '0.65rem 1.2rem',
              background: selectedYearTab === 'year-2' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedYearTab === 'year-2' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
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
            onClick={() => { playWandSwoosh(); setActiveView('timetable'); }}
            style={{
              marginLeft: 'auto',
              padding: '0.65rem 1.2rem',
              background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(8, 12, 18, 0.9) 100%)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '6px',
              color: 'var(--gold-glow)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
            }}
          >
            <span>📅 Zobacz Grafik & Plan Lekcji</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Secondary Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
          <Filter size={13} color="var(--gold-ancient)" />
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '16px',
                border: filterCategory === cat ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.07)',
                background: filterCategory === cat ? 'rgba(197, 159, 78, 0.2)' : 'rgba(15, 19, 27, 0.6)',
                color: filterCategory === cat ? '#ffe8aa' : '#9ca3af',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {cat === 'all' ? `Wszystkie kategorie (${yearFilteredSubjects.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          LAYOUT GRID: SUBJECT LIST (LEFT) & CLASSROOM CONTENT (RIGHT)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.8rem', alignItems: 'start' }}>
        
        {/* Left Column: Subjects List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          maxHeight: '850px',
          overflowY: 'auto',
          paddingRight: '0.35rem'
        }}>
          {filteredSubjects.map(s => {
            const isSelected = s.id === subject.id;
            const badge = getYearBadge(s);

            return (
              <div
                key={s.id}
                onClick={() => {
                  playWandSwoosh();
                  setSelectedSubjectId(s.id);
                  setSelectedLessonIndex(0);
                }}
                style={{
                  padding: '0.95rem 1rem',
                  background: isSelected ? 'rgba(26, 35, 50, 0.95)' : 'rgba(11, 15, 22, 0.85)',
                  border: isSelected ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.8rem',
                  boxShadow: isSelected ? '0 0 18px rgba(197, 159, 78, 0.22)' : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--gold-ancient)' }} />
                )}

                {/* Subject Icon */}
                <span style={{ fontSize: '1.65rem', flexShrink: 0, lineHeight: 1 }}>{s.icon || '📚'}</span>

                {/* Subject Info Block (Pure vertical flex with explicit line-height to guarantee ZERO overlap) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
                  
                  {/* Badge */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.66rem',
                      lineHeight: '1.2',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '3px',
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      color: badge.color,
                      fontWeight: 800,
                      fontFamily: 'var(--font-ui)',
                      letterSpacing: '0.02em'
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <div style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {s.name}
                  </div>

                  {/* Professor Name */}
                  <div style={{
                    fontSize: '0.76rem',
                    color: '#94a3b8',
                    lineHeight: 1.25,
                    fontFamily: 'var(--font-ui)',
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
            );
          })}
        </div>

        {/* Right Column: Selected Subject & Classroom Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', minWidth: 0 }}>
          
          {/* Subject Overview Card */}
          <div
            className="gothic-card runic-corners"
            style={{
              padding: '2rem',
              background: subject.bannerGradient || 'radial-gradient(circle at 90% 10%, rgba(25, 32, 45, 0.9) 0%, rgba(10, 13, 18, 0.98) 70%)',
              border: '1px solid var(--gold-ancient)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '1.2rem' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--gold-ancient)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-ui)', fontWeight: 800 }}>
                    {subject.category} • KOD: {subject.code}
                  </span>
                  {(() => {
                    const badge = getYearBadge(subject);
                    return (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.12rem 0.5rem',
                        borderRadius: '3px',
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        fontWeight: 800,
                        fontFamily: 'var(--font-ui)'
                      }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <h2 style={{ fontSize: '1.9rem', color: '#ffffff', margin: '0 0 0.3rem', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                  {subject.name}
                </h2>
              </div>

              {/* Action: Open Dedicated Subject Page */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
                <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px', fontSize: '0.82rem', color: '#e5e7eb' }}>
                  Wykładowca: <strong style={{ color: 'var(--gold-ancient)' }}>{subject.professorName || subject.professor}</strong>
                </div>
                
                <button
                  onClick={() => {
                    if (setActiveSubjectId) setActiveSubjectId(subject.id);
                    setActiveView('subject-detail');
                  }}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(197, 159, 78, 0.12) 100%)',
                    border: '1px solid var(--gold-ancient)',
                    borderRadius: '5px',
                    color: '#ffe8aa',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,159,78,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,159,78,0.2)'}
                >
                  <Scroll size={14} /> Strona Katedry, Plan & Oceny <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.3rem' }}>
              {subject.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="var(--gold-ancient)" /> Sala: <strong style={{ color: '#ffffff' }}>{subject.classroom || 'Sala Wykładowa'}</strong>
              </div>
              {subject.syllabus && !subject.syllabus.includes('#') && (
                <div>Sylabus: <strong style={{ color: '#ffffff' }}>{subject.syllabus}</strong></div>
              )}
            </div>
          </div>

          {/* Lesson Tabs & Content (if lessons exist) */}
          {lessonsList.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                {lessonsList.map((lesson, idx) => (
                  <button
                    key={lesson.id || idx}
                    onClick={() => setSelectedLessonIndex(idx)}
                    style={{
                      padding: '0.55rem 1.1rem',
                      background: selectedLessonIndex === idx ? 'rgba(197, 159, 78, 0.18)' : 'transparent',
                      border: selectedLessonIndex === idx ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                      borderRadius: '5px',
                      color: selectedLessonIndex === idx ? '#ffffff' : '#9ca3af',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {lesson.title ? lesson.title.split(':')[0] : `Lekcja ${idx + 1}`}
                  </button>
                ))}
              </div>

              {/* Lesson Content Reader */}
              {currentLesson && (
                <div className="gothic-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                      {currentLesson.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                      {currentLesson.duration && <span>Czas: {currentLesson.duration}</span>}
                      {currentLesson.difficulty && (
                        <>
                          <span>•</span>
                          <span>Trudność: {currentLesson.difficulty}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lore Text */}
                  <div style={{ whiteSpace: 'pre-line', color: '#cfd7e4', fontSize: '0.96rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                    {currentLesson.content}
                  </div>

                  {/* Reading Materials */}
                  {currentLesson.materials && currentLesson.materials.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '6px', padding: '1.2rem', marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                        <BookOpen size={14} /> Wymagane Materiały i Grimuary:
                      </h4>
                      <ul style={{ listStyle: 'square inside', color: '#b0b7c3', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, paddingLeft: '0.5rem' }}>
                        {currentLesson.materials.map((mat, i) => (
                          <li key={i}>{mat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Homework Assignment Box */}
                  {currentLesson.assignment && (
                    <div style={{ borderTop: '1px solid rgba(197, 159, 78, 0.3)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <div>
                          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', fontWeight: 800 }}>
                            Oficjalne Zadanie Domowe
                          </span>
                          <h4 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '0.2rem 0 0', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                            {currentLesson.assignment.title}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
                          <span style={{ background: 'rgba(197, 159, 78, 0.15)', color: '#ffe8aa', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                            +{currentLesson.assignment.maxPoints} pkt
                          </span>
                          <span style={{ background: 'rgba(46, 196, 182, 0.15)', color: '#8cefe6', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                            +{currentLesson.assignment.rewardXp} XP
                          </span>
                          <span style={{ background: 'rgba(197, 159, 78, 0.15)', color: '#ffe8aa', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                            +{currentLesson.assignment.rewardCurrency} Skirnirów
                          </span>
                        </div>
                      </div>

                      <p style={{ color: '#b0b7c3', fontSize: '0.9rem', marginBottom: '1.2rem', lineHeight: 1.6 }}>
                        {currentLesson.assignment.description}
                      </p>

                      {/* Submission status or form */}
                      {studentSubmission ? (
                        <div style={{ background: 'rgba(16, 25, 20, 0.8)', border: '1px solid #2ec4b6', borderRadius: '6px', padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ec4b6', fontWeight: 700, marginBottom: '0.5rem' }}>
                            <CheckCircle size={16} /> Twoja praca została przesłana ({studentSubmission.submittedAt})
                          </div>
                          <div style={{ fontSize: '0.88rem', color: '#cfd7e4', fontStyle: 'italic', marginBottom: '0.8rem' }}>
                            „{studentSubmission.content}”
                          </div>
                          {studentSubmission.status === 'graded' ? (
                            <div style={{ borderTop: '1px solid rgba(46, 196, 182, 0.3)', paddingTop: '0.6rem', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--gold-glow)', fontWeight: 700 }}>Ocena: {studentSubmission.grade}</span> • <span>Ocenił: {studentSubmission.gradedBy}</span>
                              <div style={{ color: '#9ca3af', marginTop: '0.2rem' }}>Komentarz: {studentSubmission.feedback}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.8rem', color: '#eab308' }}>
                              Status: Oczekuje na recenzję profesora Katedry.
                            </div>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <textarea
                            rows={4}
                            value={homeworkText}
                            onChange={(e) => setHomeworkText(e.target.value)}
                            placeholder="Wpisz treść swojego eseju, obliczeń lub analizy runicznej..."
                            className="gothic-textarea"
                            required
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-durmstrang">
                              <Send size={15} /> Prześlij Pracę do Profesora
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{
              background: 'rgba(10, 14, 22, 0.7)',
              border: '1px solid rgba(197, 159, 78, 0.2)',
              borderRadius: '10px',
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <BookOpen size={36} color="var(--gold-ancient)" style={{ opacity: 0.5, marginBottom: '0.8rem' }} />
              <h3 style={{ color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: '0 0 0.5rem' }}>
                Księgi Dydaktyczne Katedry {subject.name}
              </h3>
              <p style={{ color: '#94a3af', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Przejdź na dedykowaną stronę katedry, aby przejrzeć pełny plan nauczania, regulamin zajęć, dzienniki lekcyjne powiązane z Discordem oraz księgę ocen HP.
              </p>
              <button
                onClick={() => {
                  if (setActiveSubjectId) setActiveSubjectId(subject.id);
                  setActiveView('subject-detail');
                }}
                className="btn-durmstrang"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.4rem' }}
              >
                <Scroll size={15} /> Otwórz Stronę Katedry
              </button>
            </div>
          )}

          {/* Professor / Admin Grading Section */}
          {(currentRole === 'professor' || currentRole === 'admin') && subjectSubmissions.length > 0 && (
            <div className="gothic-card" style={{ padding: '2rem', border: '1px solid #9b72cf' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: '#d8c2ff' }}>
                <GraduationCap size={20} />
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0 }}>
                  Panel Oceniania Prac Uczniów ({subjectSubmissions.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {subjectSubmissions.map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      padding: '1.2rem',
                      background: 'rgba(15, 18, 26, 0.9)',
                      border: '1px solid rgba(155, 114, 207, 0.3)',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ color: '#ffffff' }}>{sub.studentName}</strong> ({sub.house}) • <span style={{ color: 'var(--gold-ancient)' }}>{sub.lessonTitle}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub.submittedAt}</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '4px', fontSize: '0.88rem', color: '#cfd7e4', marginBottom: '1rem', fontStyle: 'italic' }}>
                      „{sub.content}”
                    </div>

                    {sub.status === 'graded' ? (
                      <div style={{ fontSize: '0.85rem', color: '#2ec4b6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={14} /> Wystawiono ocenę: <strong>{sub.grade}</strong> ({sub.feedback})
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          className="gothic-select"
                          style={{ width: 'auto' }}
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
                          className="gothic-input"
                          style={{ flex: 1, minWidth: '200px' }}
                          onChange={(e) => setGradingScores(prev => ({
                            ...prev,
                            [sub.id]: { ...(prev[sub.id] || {}), feedback: e.target.value }
                          }))}
                        />

                        <button
                          onClick={() => handleGradeSubmit(sub.id)}
                          className="btn-durmstrang"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
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
    </div>
  );
};
