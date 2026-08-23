import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  BookOpen,
  Calendar,
  User,
  Users,
  Search,
  Filter,
  Shield,
  MessageSquare,
  Sparkles,
  Award,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';

export const JournalsListView = () => {
  const {
    lessons,
    setActiveView,
    setActiveLessonId,
    setActiveLessonTab,
    houses,
    subjects,
    currentUser,
    hasPermission,
    setDiscordSimulatorOpen
  } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = l.topic?.toLowerCase().includes(q);
        const matchesDesc = l.description?.toLowerCase().includes(q);
        const matchesSubject = l.subjectName?.toLowerCase().includes(q);
        const matchesProf = l.professorName?.toLowerCase().includes(q);
        if (!matchesTopic && !matchesDesc && !matchesSubject && !matchesProf) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && l.subjectId !== selectedSubject) return false;

      // Class filter
      if (selectedClass !== 'all' && l.classYear !== selectedClass) return false;

      // Status filter
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;

      // House filter
      if (selectedHouse !== 'all') {
        const hasHouseParticipant = l.participants?.some(p => p.house?.toLowerCase() === selectedHouse.toLowerCase());
        if (!hasHouseParticipant) return false;
      }

      return true;
    });
  }, [lessons, searchQuery, selectedSubject, selectedClass, selectedHouse, selectedStatus]);

  // Overall stats
  const publishedCount = lessons.filter(l => l.status === 'published').length;
  const totalPointsDistributed = lessons
    .filter(l => l.status === 'published')
    .reduce((sum, l) => sum + (l.totalPoints || 0), 0);
  const totalParticipantsRecorded = lessons
    .filter(l => l.status === 'published')
    .reduce((sum, l) => sum + (l.participantsCount || l.participants?.length || 0), 0);

  const handleOpenLesson = (lessonId, tab = 'journal') => {
    setActiveLessonId(lessonId);
    setActiveLessonTab(tab);
    setActiveView('lesson-detail');
  };

  const handleEditLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setActiveView('professor-journal-editor');
  };

  return (
    <div className="view-container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* =========================================================================
          1. MONUMENTAL HEADER (GOTHIC PARCHMENT & NORDIC ACCENTS)
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(197, 159, 78, 0.08)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}
      >
        {/* Runic Corner Ornaments */}
        <div style={{ position: 'absolute', top: '10px', left: '15px', color: 'rgba(197, 159, 78, 0.25)', fontSize: '1.4rem', fontFamily: 'serif' }}>ᚠ ᚢ ᚦ</div>
        <div style={{ position: 'absolute', top: '10px', right: '15px', color: 'rgba(197, 159, 78, 0.25)', fontSize: '1.4rem', fontFamily: 'serif' }}>ᛞ ᛟ ᛏ</div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-glow)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                📖 Kancelaria Dydaktyczna Cytadeli
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>•</span>
              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Archiwum Wątków Discord & Pakt 1294</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.2rem',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.05em',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
              }}
            >
              DZIENNIKI LEKCYJNE
            </h1>

            <p style={{ color: '#c5cdd9', fontSize: '0.95rem', maxWidth: '680px', marginTop: '0.6rem', lineHeight: 1.6 }}>
              Oficjalny rejestr zajęć dydaktycznych prowadzonych w salach Cytadeli i na Discordzie. Każdy dziennik zawiera zweryfikowany wykaz obecności, przydzielone punkty do Pucharu Zakonów oraz wierne cyfrowe archiwum wątku z mediami i replikami zaklęć.
            </p>
          </div>

          {/* Quick Actions Cluster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minWidth: '220px' }}>
            <button
              onClick={() => setDiscordSimulatorOpen(true)}
              className="btn-durmstrang"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.2rem',
                background: 'linear-gradient(135deg, #5865F2 0%, #3b44a9 100%)',
                borderColor: '#7289da',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(88, 101, 242, 0.35)',
                fontWeight: 700
              }}
            >
              <Radio size={16} /> Symulator Discord / Nowa Lekcja
            </button>

            {hasPermission('canManageLessons') && (
              <button
                onClick={() => {
                  setActiveLessonId(null);
                  setActiveView('professor-journal-editor');
                }}
                className="btn-durmstrang"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.2rem',
                  fontSize: '0.85rem'
                }}
              >
                <PlusCircle size={15} /> Utwórz Dziennik Manualnie
              </button>
            )}
          </div>
        </div>

        {/* Global Statistics Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(197, 159, 78, 0.2)'
          }}
        >
          <div style={{ background: 'rgba(10, 14, 22, 0.7)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zarchiwizowane Lekcje</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
              {publishedCount}
            </div>
          </div>

          <div style={{ background: 'rgba(10, 14, 22, 0.7)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Punkty Zasiliły Zakony</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2ec4b6', fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
              +{totalPointsDistributed} pkt
            </div>
          </div>

          <div style={{ background: 'rgba(10, 14, 22, 0.7)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wpisy Uczestników</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3e8ff', fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
              {totalParticipantsRecorded}
            </div>
          </div>

          <div style={{ background: 'rgba(10, 14, 22, 0.7)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Synchronizacji</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              <CheckCircle2 size={15} /> SQLite & Bot Aktywny
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. ADVANCED FILTERS BAR
          ========================================================================= */}
      <div
        style={{
          background: 'rgba(15, 20, 30, 0.9)',
          border: '1px solid rgba(197, 159, 78, 0.25)',
          borderRadius: '10px',
          padding: '1.2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--gold-ancient)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po temacie lekcji, opisie, Katedrze lub nazwisku profesora..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.8rem',
              background: 'rgba(10, 13, 20, 0.85)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.8rem'
          }}
        >
          {/* Subject Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'block' }}>
              Przedmiot / Katedra
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.7rem',
                background: '#121722',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">Wszystkie Przedmioty</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class Year Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'block' }}>
              Klasa
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.7rem',
                background: '#121722',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">Wszystkie Klasy</option>
              <option value="Klasa I">Klasa I</option>
              <option value="Klasa II">Klasa II</option>
              <option value="Klasa III">Klasa III</option>
              <option value="Klasa IV">Klasa IV</option>
            </select>
          </div>

          {/* House Filter */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'block' }}>
              Uczestnicy z Zakonu
            </label>
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.7rem',
                background: '#121722',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">Wszystkie Zakony</option>
              <option value="reinhall">🦌 Reinhall</option>
              <option value="bjornhall">🐻 Björnhall</option>
              <option value="ravnheim">🐦 Ravnheim</option>
              <option value="otergard">🦦 Otergard</option>
            </select>
          </div>

          {/* Status Filter (Draft / Published) */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'block' }}>
              Status Dziennika
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.7rem',
                background: '#121722',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            >
              <option value="all">Wszystkie Statusy</option>
              <option value="published">📜 Opublikowane (W Kronice)</option>
              <option value="draft">⏳ Szkic (DRAFT — Przed zatwierdzeniem)</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. LESSON CARDS GRID
          ========================================================================= */}
      {filteredLessons.length === 0 ? (
        <div
          style={{
            background: 'rgba(15, 20, 30, 0.7)',
            border: '1px dashed rgba(197, 159, 78, 0.3)',
            borderRadius: '12px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: '#9ca3af'
          }}
        >
          <BookOpen size={48} color="var(--gold-ancient)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
            Brak Dzienników Spełniających Kryteria
          </h3>
          <p style={{ maxWidth: '480px', margin: '0.5rem auto 1.5rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Nie odnaleziono wpisów dla wybranej kombinacji filtrów. Zmień parametry wyszukiwania lub przeprowadź nową lekcję na Discordzie.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setSelectedClass('all');
              setSelectedHouse('all');
              setSelectedStatus('all');
            }}
            className="btn-durmstrang"
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem' }}
          >
            Wyczyść Wszystkie Filtry
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredLessons.map((lesson) => {
            const isDraft = lesson.status === 'draft';
            const participantCount = lesson.participantsCount || lesson.participants?.length || 0;
            const messagesCount = lesson.messages?.length || 0;

            // Calculate points by house for badges
            const housePointsSummary = {};
            (lesson.participants || []).forEach(p => {
              if (p.pointsAwarded > 0 && p.isPresent) {
                housePointsSummary[p.house] = (housePointsSummary[p.house] || 0) + p.pointsAwarded;
              }
            });

            return (
              <div
                key={lesson.id}
                style={{
                  position: 'relative',
                  background: isDraft
                    ? 'linear-gradient(135deg, rgba(30, 24, 15, 0.85) 0%, rgba(15, 18, 26, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(18, 24, 35, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
                  border: isDraft ? '1px dashed #eab308' : '1px solid rgba(197, 159, 78, 0.35)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.65)',
                  padding: '1.5rem',
                  transition: 'all 0.25s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Status Badge */}
                <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isDraft ? (
                    <span
                      style={{
                        background: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid #eab308',
                        color: '#facc15',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Clock size={12} /> SZKIC (DRAFT)
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <CheckCircle2 size={12} /> OPUBLIKOWANY
                    </span>
                  )}
                </div>

                {/* Subject & Class Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--gold-ancient)', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚗️ {lesson.subjectName}
                  </span>
                  <span style={{ color: '#6b7280' }}>•</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {lesson.classYear}
                  </span>
                </div>

                {/* Lesson Topic Title */}
                <h3
                  onClick={() => handleOpenLesson(lesson.id, 'journal')}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.35rem',
                    color: '#ffffff',
                    margin: '0.2rem 0 0.6rem',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold-glow)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
                >
                  {lesson.topic}
                </h3>

                {/* Lesson Description */}
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.2rem', maxWidth: '850px' }}>
                  „{lesson.description || 'Brak opisu lekcji.'}”
                </p>

                {/* Metadata Row: Professor, Date, Stats */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Professor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={lesson.professorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
                        alt={lesson.professorName}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-ancient)' }}
                      />
                      <span style={{ fontSize: '0.84rem', color: '#f1f5f9', fontWeight: 600 }}>
                        {lesson.professorName}
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      <Calendar size={14} color="var(--gold-ancient)" />
                      <span>{lesson.date}</span>
                    </div>

                    {/* Participants & Messages count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      <Users size={14} color="#38bdf8" />
                      <span>{participantCount} uczestników</span>
                    </div>

                    {messagesCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                        <MessageSquare size={14} color="#a78bfa" />
                        <span>{messagesCount} wpisów wątku</span>
                      </div>
                    )}
                  </div>

                  {/* House Points Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {Object.entries(housePointsSummary).map(([hKey, pts]) => {
                      const h = houses[hKey] || { crestIcon: '🛡️', name: hKey, colors: { secondary: '#c59f4e' } };
                      return (
                        <span
                          key={hKey}
                          style={{
                            background: 'rgba(15, 20, 30, 0.8)',
                            border: `1px solid ${h.colors?.secondary || 'rgba(197,159,78,0.5)'}`,
                            color: '#ffffff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span>{h.crestIcon}</span>
                          <span style={{ color: h.colors?.secondary }}>+{pts}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.6rem',
                    marginTop: '1.2rem',
                    paddingTop: '0.8rem',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <button
                    onClick={() => handleOpenLesson(lesson.id, 'journal')}
                    className="btn-durmstrang"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '0.35rem' }}
                  >
                    <BookOpen size={14} /> Otwórz Dziennik
                  </button>

                  <button
                    onClick={() => handleOpenLesson(lesson.id, 'log')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.9rem',
                      background: 'rgba(88, 101, 242, 0.15)',
                      border: '1px solid rgba(88, 101, 242, 0.4)',
                      borderRadius: '6px',
                      color: '#a5b4fc',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <MessageSquare size={14} /> Pokaż Pełny Zapis Lekcji (Discord)
                  </button>

                  {(hasPermission('canManageLessons') || isDraft) && (
                    <button
                      onClick={() => handleEditLesson(lesson.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.9rem',
                        background: 'rgba(234, 179, 8, 0.12)',
                        border: '1px solid rgba(234, 179, 8, 0.4)',
                        borderRadius: '6px',
                        color: '#facc15',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Panel Profesora
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
