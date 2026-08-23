import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  AlertCircle,
  HelpCircle,
  Castle
} from 'lucide-react';

export const TimetableView = () => {
  const {
    timetable,
    subjects,
    users,
    daysOfWeek,
    timeSlots,
    currentUser,
    currentRole,
    addTimetableEntry,
    updateTimetableEntry,
    substituteTimetableEntry,
    cancelTimetableEntry,
    restoreTimetableEntry,
    deleteTimetableEntry,
    setActiveView,
    setActiveSubjectId,
    houses
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  // Active view layout: 'grid' (siatka tygodniowa) | 'agenda' (lista dni) | 'rooms' (matryca sal)
  const [activeLayout, setActiveLayout] = useState('grid');

  // Filters
  const [selectedClassYear, setSelectedClassYear] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'scheduled' | 'substitution' | 'cancelled'
  const [selectedProfessor, setSelectedProfessor] = useState('all');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // null if new, object if editing

  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [selectedForSub, setSelectedForSub] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState(null);

  const isStaffOrAdmin = currentRole === 'professor' || currentRole === 'admin';

  // Get current day of week (1 = Monday, ..., 7 = Sunday)
  const todayDayNumber = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return jsDay === 0 ? 7 : jsDay;
  }, []);

  // Filtered timetable entries
  const filteredTimetable = useMemo(() => {
    return timetable.filter(entry => {
      if (selectedClassYear !== 'all' && entry.classYear !== selectedClassYear && entry.classYear !== 'Wszyscy') {
        return false;
      }
      if (selectedDay !== 'all') {
        const dayNum = parseInt(selectedDay, 10);
        if (entry.dayOfWeek !== dayNum) return false;
      }
      if (selectedStatus !== 'all' && entry.status !== selectedStatus) {
        return false;
      }
      if (selectedProfessor !== 'all') {
        const matchProf = entry.professorName.toLowerCase().includes(selectedProfessor.toLowerCase()) ||
          (entry.substituteProfessorName && entry.substituteProfessorName.toLowerCase().includes(selectedProfessor.toLowerCase()));
        if (!matchProf) return false;
      }
      if (selectedClassroom !== 'all' && !entry.classroom.toLowerCase().includes(selectedClassroom.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          entry.subjectName?.toLowerCase().includes(q) ||
          entry.subjectCode?.toLowerCase().includes(q) ||
          entry.classroom?.toLowerCase().includes(q) ||
          entry.professorName?.toLowerCase().includes(q) ||
          entry.substituteProfessorName?.toLowerCase().includes(q) ||
          entry.topic?.toLowerCase().includes(q) ||
          entry.notes?.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [timetable, selectedClassYear, selectedDay, selectedStatus, selectedProfessor, selectedClassroom, searchQuery]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = timetable.length;
    const substitutions = timetable.filter(t => t.status === 'substitution').length;
    const cancellations = timetable.filter(t => t.status === 'cancelled').length;
    const scheduled = timetable.filter(t => t.status === 'scheduled').length;
    const uniqueRooms = new Set(timetable.map(t => t.classroom)).size;
    return { total, substitutions, cancellations, scheduled, uniqueRooms };
  }, [timetable]);

  // Extract unique professors & classrooms for dropdown filters
  const uniqueProfessorsList = useMemo(() => {
    const names = new Set();
    timetable.forEach(t => {
      if (t.professorName) names.add(t.professorName);
      if (t.substituteProfessorName) names.add(t.substituteProfessorName);
    });
    return Array.from(names).sort();
  }, [timetable]);

  const uniqueClassroomsList = useMemo(() => {
    const rooms = new Set(timetable.map(t => t.classroom).filter(Boolean));
    return Array.from(rooms).sort();
  }, [timetable]);

  // Handle opening Subject Detail
  const handleJumpToSubject = (subjectId) => {
    if (!subjectId) return;
    playWandSwoosh();
    setActiveSubjectId(subjectId);
    setActiveView('subject-detail');
  };

  // Handlers for quick actions
  const handleOpenAddModal = () => {
    playWandSwoosh();
    setEditingEntry(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    playWandSwoosh();
    setEditingEntry(entry);
    setAddEditModalOpen(true);
  };

  const handleOpenSubModal = (entry) => {
    playWandSwoosh();
    setSelectedForSub(entry);
    setSubstitutionModalOpen(true);
  };

  const handleOpenCancelModal = (entry) => {
    playWandSwoosh();
    setSelectedForCancel(entry);
    setCancelModalOpen(true);
  };

  const handleRestore = async (entry) => {
    playRuneChime();
    await restoreTimetableEntry(entry.id);
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Czy na pewno usunąć zajęcia „${entry.subjectName}” z planu lekcji?`)) {
      playWandSwoosh();
      await deleteTimetableEntry(entry.id);
    }
  };

  return (
    <div className="durmstrang-timetable-module" style={{ paddingBottom: '3.5rem' }}>
      {/* =========================================================================
          1. MONUMENTAL GOTHIC HEADER & LIVE METRICS
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(197, 159, 78, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255,255,255,0.08)',
          padding: '1.8rem 2rem',
          marginBottom: '1.8rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient background rune watermarks */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-25px',
            fontSize: '9rem',
            color: 'rgba(197, 159, 78, 0.04)',
            fontFamily: 'serif',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1
          }}
        >
          ᚱ
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--gold-glow)', fontSize: '1.1rem' }}>ᛞ</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  color: 'var(--gold-ancient)',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Katedry • Sale • Kadra Profesorska
              </span>
              <span style={{ color: 'var(--gold-glow)', fontSize: '1.1rem' }}>ᛞ</span>
            </div>

            <h1
              style={{
                fontSize: '2.3rem',
                margin: '0.1rem 0 0.4rem',
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.04em',
                textShadow: '0 0 20px rgba(197, 159, 78, 0.3)'
              }}
            >
              Plan Lekcji & Grafik Katedr
            </h1>

            <p style={{ color: '#a0aec0', fontSize: '0.92rem', maxWidth: '680px', lineHeight: 1.55 }}>
              Oficjalny harmonogram zajęć w Twierdzy Magii Durmstrang (TMD). Przeglądaj siatkę godzinową sal, sprawdzaj bieżące zastępstwa mistrzów i komunikaty o odwołaniach lekcji w fiordach.
            </p>
          </div>

          {/* Quick Actions & Add Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
            <button
              onClick={handleOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.4rem',
                background: 'linear-gradient(135deg, #c59f4e 0%, #8a6c2f 100%)',
                color: '#05070a',
                border: '1px solid #f7dca0',
                borderRadius: '8px',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.98rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(197, 159, 78, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={18} strokeWidth={3} />
              <span>+ Dodaj Zajęcia do Planu</span>
            </button>

            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={13} color="var(--gold-ancient)" />
              <span>Dzisiaj: <strong>{daysOfWeek.find(d => d.dayNumber === todayDayNumber)?.name || 'Poniedziałek'}</strong> • XIX Rok Szkolny</span>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Badges Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            marginTop: '1.4rem',
            paddingTop: '1.2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(164, 200, 225, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wszystkich lekcji
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d8b4fe', fontFamily: 'var(--font-heading)' }}>
                {stats.substitutions}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Zastępstwa aktywne
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fca5a5', fontFamily: 'var(--font-heading)' }}>
                {stats.cancellations}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Odwołane z powodu anomalii
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(197, 159, 78, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'rgba(197, 159, 78, 0.12)', border: '1px solid rgba(197, 159, 78, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Castle size={18} color="var(--gold-ancient)" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)' }}>
                {stats.uniqueRooms}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Komnat & Sal w użyciu
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. VIEW SWITCHER & RICH FILTER CONTROLS BAR
          ========================================================================= */}
      <div
        style={{
          background: 'rgba(12, 16, 24, 0.92)',
          borderRadius: '10px',
          border: '1px solid rgba(164, 200, 225, 0.18)',
          padding: '1.2rem 1.4rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Top bar: Layout Switcher + Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          {/* Layout Mode Tabs */}
          <div style={{ display: 'flex', background: 'rgba(5, 7, 10, 0.8)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => { playWandSwoosh(); setActiveLayout('grid'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: activeLayout === 'grid' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                color: activeLayout === 'grid' ? '#ffffff' : '#94a3b8',
                fontWeight: activeLayout === 'grid' ? 700 : 500,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeLayout === 'grid' ? 'inset 0 0 0 1px var(--gold-ancient)' : 'none'
              }}
            >
              <Calendar size={15} color={activeLayout === 'grid' ? 'var(--gold-glow)' : '#94a3b8'} />
              <span>Siatka Tygodniowa</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setActiveLayout('agenda'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: activeLayout === 'agenda' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                color: activeLayout === 'agenda' ? '#ffffff' : '#94a3b8',
                fontWeight: activeLayout === 'agenda' ? 700 : 500,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeLayout === 'agenda' ? 'inset 0 0 0 1px var(--gold-ancient)' : 'none'
              }}
            >
              <Layers size={15} color={activeLayout === 'agenda' ? 'var(--gold-glow)' : '#94a3b8'} />
              <span>Lista Dni (Agenda)</span>
            </button>

            <button
              onClick={() => { playWandSwoosh(); setActiveLayout('rooms'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: activeLayout === 'rooms' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                color: activeLayout === 'rooms' ? '#ffffff' : '#94a3b8',
                fontWeight: activeLayout === 'rooms' ? 700 : 500,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeLayout === 'rooms' ? 'inset 0 0 0 1px var(--gold-ancient)' : 'none'
              }}
            >
              <MapPin size={15} color={activeLayout === 'rooms' ? 'var(--gold-glow)' : '#94a3b8'} />
              <span>Komnaty & Sale</span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Szukaj przedmiotu, sali, nauczyciela..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.4rem',
                background: 'rgba(6, 8, 12, 0.85)',
                border: '1px solid rgba(164, 200, 225, 0.25)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Class Year */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              Klasa / Rok:
            </label>
            <select
              value={selectedClassYear}
              onChange={(e) => setSelectedClassYear(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(164, 200, 225, 0.2)',
                borderRadius: '5px',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="all">Wszystkie Klasy</option>
              <option value="Klasa I">Klasa I • Fundamenty</option>
              <option value="Klasa II">Klasa II • Zaawansowana</option>
              <option value="Klasa III">Klasa III • Specjalizacje</option>
              <option value="Klasa IV">Klasa IV • Krąg Mistrzowski</option>
              <option value="Wszyscy">Dla Wszystkich Adeptów</option>
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              Dzień tygodnia:
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(164, 200, 225, 0.2)',
                borderRadius: '5px',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="all">Cały Tydzień (Pn - Nd)</option>
              {daysOfWeek.map(d => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  {d.rune} {d.name} {d.dayNumber === todayDayNumber ? '★ (Dzisiaj)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              Status zajęć:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(164, 200, 225, 0.2)',
                borderRadius: '5px',
                color: selectedStatus === 'substitution' ? '#d8b4fe' : selectedStatus === 'cancelled' ? '#fca5a5' : '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
                fontWeight: selectedStatus !== 'all' ? 700 : 400
              }}
            >
              <option value="all">Wszystkie statusy</option>
              <option value="scheduled">🟢 Według Planu (Aktywne)</option>
              <option value="substitution">🔁 Tylko Zastępstwa</option>
              <option value="cancelled">❌ Tylko Odwołane</option>
            </select>
          </div>

          {/* Professor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              Profesor / Wykładowca:
            </label>
            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(164, 200, 225, 0.2)',
                borderRadius: '5px',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="all">Wszyscy Wykładowcy</option>
              {uniqueProfessorsList.map(prof => (
                <option key={prof} value={prof}>{prof}</option>
              ))}
            </select>
          </div>

          {/* Classroom */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              Komnata / Sala:
            </label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(164, 200, 225, 0.2)',
                borderRadius: '5px',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="all">Wszystkie Sale</option>
              {uniqueClassroomsList.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Clear Button if any filter active */}
        {(selectedClassYear !== 'all' || selectedDay !== 'all' || selectedStatus !== 'all' || selectedProfessor !== 'all' || selectedClassroom !== 'all' || searchQuery) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--gold-glow)' }}>
              Znaleziono: <strong>{filteredTimetable.length}</strong> lekcji spełniających kryteria
            </span>
            <button
              onClick={() => {
                setSelectedClassYear('all');
                setSelectedDay('all');
                setSelectedStatus('all');
                setSelectedProfessor('all');
                setSelectedClassroom('all');
                setSearchQuery('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'underline'
              }}
            >
              <X size={12} /> Wyczyść wszystkie filtry
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. MAIN CONTENT: SIATKA TYGODNIOWA (WEEKLY MATRIX GRID)
          ========================================================================= */}
      {activeLayout === 'grid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Days Columns Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.2rem',
              alignItems: 'start'
            }}
          >
            {daysOfWeek
              .filter(d => selectedDay === 'all' || d.dayNumber === parseInt(selectedDay, 10))
              .map(day => {
                const dayEntries = filteredTimetable.filter(t => t.dayOfWeek === day.dayNumber);
                const isToday = day.dayNumber === todayDayNumber;

                return (
                  <div
                    key={day.dayNumber}
                    style={{
                      background: isToday ? 'rgba(16, 24, 38, 0.95)' : 'rgba(10, 14, 22, 0.88)',
                      borderRadius: '10px',
                      border: isToday ? '1.5px solid var(--gold-ancient)' : '1px solid rgba(164, 200, 225, 0.18)',
                      boxShadow: isToday ? '0 10px 30px rgba(197, 159, 78, 0.2)' : '0 8px 25px rgba(0, 0, 0, 0.6)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Day Column Header */}
                    <div
                      style={{
                        padding: '0.85rem 1.1rem',
                        background: isToday
                          ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(12, 16, 24, 0.8) 100%)'
                          : 'rgba(6, 8, 12, 0.9)',
                        borderBottom: isToday ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.2rem', color: isToday ? 'var(--gold-glow)' : 'var(--ice-frost)', fontFamily: 'serif' }}>
                          {day.rune}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, color: isToday ? '#ffffff' : '#e2e8f0', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                            {day.name}
                          </div>
                          {isToday && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              ★ Dzisiaj w Twierdzy
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: dayEntries.length > 0 ? '#cbd5e1' : '#64748b',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        {dayEntries.length} {dayEntries.length === 1 ? 'lekcja' : 'lekcji'}
                      </span>
                    </div>

                    {/* Lessons list inside day column */}
                    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {dayEntries.length === 0 ? (
                        <div
                          style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '0.82rem',
                            fontStyle: 'italic'
                          }}
                        >
                          Brak zaplanowanych zajęć dla tego dnia lub filtrów.
                        </div>
                      ) : (
                        dayEntries.map(entry => (
                          <TimetableCard
                            key={entry.id}
                            entry={entry}
                            onJumpToSubject={() => handleJumpToSubject(entry.subjectId)}
                            onEdit={() => handleOpenEditModal(entry)}
                            onSubstitute={() => handleOpenSubModal(entry)}
                            onCancel={() => handleOpenCancelModal(entry)}
                            onRestore={() => handleRestore(entry)}
                            onDelete={() => handleDelete(entry)}
                            isStaffOrAdmin={isStaffOrAdmin}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. CHRONOLOGICAL AGENDA / DAY LIST VIEW
          ========================================================================= */}
      {activeLayout === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {daysOfWeek
            .filter(d => selectedDay === 'all' || d.dayNumber === parseInt(selectedDay, 10))
            .map(day => {
              const dayEntries = filteredTimetable.filter(t => t.dayOfWeek === day.dayNumber);
              const isToday = day.dayNumber === todayDayNumber;

              return (
                <div
                  key={day.dayNumber}
                  style={{
                    background: 'rgba(10, 14, 22, 0.92)',
                    borderRadius: '10px',
                    border: isToday ? '1.5px solid var(--gold-ancient)' : '1px solid rgba(164, 200, 225, 0.18)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.5rem',
                      background: isToday
                        ? 'linear-gradient(90deg, rgba(197, 159, 78, 0.25) 0%, rgba(12, 16, 24, 0.8) 100%)'
                        : 'rgba(6, 8, 12, 0.95)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(197, 159, 78, 0.15)',
                          border: '1px solid var(--gold-ancient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                          color: 'var(--gold-glow)'
                        }}
                      >
                        {day.rune}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                          {day.name}
                        </div>
                        {isToday && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold-glow)', fontWeight: 700 }}>
                            ★ DZISIAJ W TWIERDZY
                          </div>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {dayEntries.length} {dayEntries.length === 1 ? 'zajęcia' : 'zajęć'}
                    </span>
                  </div>

                  <div style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {dayEntries.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        Brak zajęć w tym dniu.
                      </div>
                    ) : (
                      dayEntries.map(entry => (
                        <TimetableCard
                          key={entry.id}
                          entry={entry}
                          onJumpToSubject={() => handleJumpToSubject(entry.subjectId)}
                          onEdit={() => handleOpenEditModal(entry)}
                          onSubstitute={() => handleOpenSubModal(entry)}
                          onCancel={() => handleOpenCancelModal(entry)}
                          onRestore={() => handleRestore(entry)}
                          onDelete={() => handleDelete(entry)}
                          isStaffOrAdmin={isStaffOrAdmin}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* =========================================================================
          5. ROOMS & CLASSROOM MATRIX VIEW
          ========================================================================= */}
      {activeLayout === 'rooms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {uniqueClassroomsList
            .filter(room => selectedClassroom === 'all' || room.toLowerCase().includes(selectedClassroom.toLowerCase()))
            .map(roomName => {
              const roomEntries = filteredTimetable.filter(t => t.classroom === roomName);

              return (
                <div
                  key={roomName}
                  style={{
                    background: 'rgba(10, 14, 22, 0.9)',
                    borderRadius: '10px',
                    border: '1px solid rgba(164, 200, 225, 0.18)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.4rem',
                      background: 'rgba(6, 8, 12, 0.95)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <MapPin size={18} color="var(--gold-ancient)" />
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                        {roomName}
                      </div>
                    </div>

                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      {roomEntries.length} zaplanowanych bloków
                    </span>
                  </div>

                  <div style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
                    {roomEntries.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        Brak zajęć w tej sali według bieżących filtrów.
                      </div>
                    ) : (
                      roomEntries.map(entry => (
                        <TimetableCard
                          key={entry.id}
                          entry={entry}
                          onJumpToSubject={() => handleJumpToSubject(entry.subjectId)}
                          onEdit={() => handleOpenEditModal(entry)}
                          onSubstitute={() => handleOpenSubModal(entry)}
                          onCancel={() => handleOpenCancelModal(entry)}
                          onRestore={() => handleRestore(entry)}
                          onDelete={() => handleDelete(entry)}
                          isStaffOrAdmin={isStaffOrAdmin}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* =========================================================================
          6. MODAL 1: DODAJ / EDYTUJ ZAJĘCIA (ADD / EDIT LESSON)
          ========================================================================= */}
      {addEditModalOpen && (
        <AddEditLessonModal
          isOpen={addEditModalOpen}
          editingEntry={editingEntry}
          subjects={subjects}
          users={users}
          daysOfWeek={daysOfWeek}
          timeSlots={timeSlots}
          onClose={() => setAddEditModalOpen(false)}
          onSave={async (data) => {
            if (editingEntry) {
              await updateTimetableEntry(editingEntry.id, data);
            } else {
              await addTimetableEntry(data);
            }
            setAddEditModalOpen(false);
          }}
        />
      )}

      {/* =========================================================================
          7. MODAL 2: USTAWIENIE ZASTĘPSTWA (SUBSTITUTION MODAL)
          ========================================================================= */}
      {substitutionModalOpen && selectedForSub && (
        <SubstitutionModal
          isOpen={substitutionModalOpen}
          entry={selectedForSub}
          users={users}
          onClose={() => setSubstitutionModalOpen(false)}
          onConfirm={async (subData) => {
            await substituteTimetableEntry(selectedForSub.id, subData);
            setSubstitutionModalOpen(false);
          }}
        />
      )}

      {/* =========================================================================
          8. MODAL 3: ODWOŁANIE ZAJĘĆ (CANCELLATION MODAL)
          ========================================================================= */}
      {cancelModalOpen && selectedForCancel && (
        <CancellationModal
          isOpen={cancelModalOpen}
          entry={selectedForCancel}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={async (reason) => {
            await cancelTimetableEntry(selectedForCancel.id, reason);
            setCancelModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: TIMETABLE CARD (KARTA ZAJĘĆ W GRAFIKU)
// =========================================================================
const TimetableCard = ({
  entry,
  onJumpToSubject,
  onEdit,
  onSubstitute,
  onCancel,
  onRestore,
  onDelete,
  isStaffOrAdmin
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const isSub = entry.status === 'substitution';
  const isCancelled = entry.status === 'cancelled';

  // Border & Glow styling based on status
  const cardBorder = isCancelled
    ? '1px solid rgba(239, 68, 68, 0.45)'
    : isSub
    ? '1px solid rgba(192, 132, 252, 0.5)'
    : '1px solid rgba(164, 200, 225, 0.18)';

  const cardBg = isCancelled
    ? 'rgba(28, 12, 14, 0.92)'
    : isSub
    ? 'rgba(22, 14, 34, 0.92)'
    : 'rgba(8, 12, 18, 0.88)';

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: '8px',
        padding: '0.95rem',
        boxShadow: isSub
          ? '0 6px 20px rgba(168, 85, 247, 0.15)'
          : isCancelled
          ? '0 6px 20px rgba(239, 68, 68, 0.12)'
          : '0 4px 15px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}
    >
      {/* Top row: Time + Year Badge + Status Badge + Action Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Time Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              color: '#f7dca0',
              fontWeight: 800,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-heading)'
            }}
          >
            <Clock size={12} color="var(--gold-glow)" />
            {entry.startTime} - {entry.endTime}
          </span>

          {/* Class Year Badge */}
          <span
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.7rem',
              fontWeight: 700
            }}
          >
            {entry.classYear}
          </span>
        </div>

        {/* Status Pill & Action dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isSub && (
            <span
              style={{
                padding: '0.18rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid #c084fc',
                color: '#e9d5ff',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              🔁 Zastępstwo
            </span>
          )}

          {isCancelled && (
            <span
              style={{
                padding: '0.18rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #ef4444',
                color: '#fecaca',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              ❌ Odwołane
            </span>
          )}

          {/* Settings / Action Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Zarządzaj zajęciami"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                color: '#cbd5e1',
                padding: '0.2rem 0.4rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              •••
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.3rem',
                  width: '210px',
                  background: 'rgba(12, 16, 24, 0.98)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '6px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
                  zIndex: 20,
                  padding: '0.4rem 0',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {entry.subjectId && (
                  <button
                    onClick={() => { setMenuOpen(false); onJumpToSubject(); }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#cbd5e1',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <BookOpen size={13} color="var(--gold-ancient)" />
                    <span>Otwórz Katedrę</span>
                  </button>
                )}

                <button
                  onClick={() => { setMenuOpen(false); onSubstitute(); }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#d8b4fe',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <RefreshCw size={13} color="#c084fc" />
                  <span>Ustaw Zastępstwo</span>
                </button>

                {!isCancelled ? (
                  <button
                    onClick={() => { setMenuOpen(false); onCancel(); }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#fca5a5',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <XCircle size={13} color="#ef4444" />
                    <span>Odwołaj Zajęcia</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); onRestore(); }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#86efac',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Przywróć do Planu</span>
                  </button>
                )}

                {isSub && (
                  <button
                    onClick={() => { setMenuOpen(false); onRestore(); }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#86efac',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Cofnij Zastępstwo</span>
                  </button>
                )}

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.3rem 0' }} />

                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Edit3 size={13} color="#94a3b8" />
                  <span>Edytuj Szczegóły</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Trash2 size={13} color="#ef4444" />
                  <span>Usuń z Grafiku</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Subject Title & Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
        <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>{entry.subjectIcon || '📚'}</div>
        <div>
          <div
            onClick={onJumpToSubject}
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: isCancelled ? '#fca5a5' : '#ffffff',
              textDecoration: isCancelled ? 'line-through' : 'none',
              fontFamily: 'var(--font-heading)',
              cursor: entry.subjectId ? 'pointer' : 'default',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}
          >
            {entry.subjectName}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
            {entry.subjectCode ? `${entry.subjectCode} • ` : ''}{entry.subjectCategory || 'Katedra Magii'}
          </div>
        </div>
      </div>

      {/* Classroom / Sala badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.78rem',
          color: '#cbd5e1',
          background: 'rgba(0,0,0,0.4)',
          padding: '0.35rem 0.6rem',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <MapPin size={13} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{entry.classroom}</span>
      </div>

      {/* Professor Row (Regular vs Substitution) */}
      <div style={{ marginTop: '0.2rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!isSub ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <img
              src={entry.professorAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
              alt={entry.professorName}
              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(197, 159, 78, 0.4)' }}
            />
            <div style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
              {entry.professorName}
            </div>
          </div>
        ) : (
          /* Substitution display */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{ fontSize: '0.9rem' }}>🔁</span>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#e9d5ff', fontWeight: 800 }}>
                  {entry.substituteProfessorName} <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>(Zastępca)</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  Pierwotnie: {entry.originalProfessorName || entry.professorName}
                </div>
              </div>
            </div>

            {entry.substitutionReason && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#d8b4fe',
                  background: 'rgba(168, 85, 247, 0.1)',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  borderLeft: '2px solid #c084fc',
                  fontStyle: 'italic'
                }}
              >
                „{entry.substitutionReason}”
              </div>
            )}
          </div>
        )}

        {/* Cancellation reason box */}
        {isCancelled && entry.cancellationReason && (
          <div
            style={{
              marginTop: '0.4rem',
              fontSize: '0.72rem',
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '0.35rem 0.55rem',
              borderRadius: '4px',
              borderLeft: '2px solid #ef4444'
            }}
          >
            <strong>Powód odwołania:</strong> {entry.cancellationReason}
          </div>
        )}
      </div>

      {/* Topic / Notes preview if present */}
      {entry.topic && !isCancelled && (
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
          Temat: <span style={{ color: '#cbd5e1' }}>{entry.topic}</span>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MODAL 1: ADD / EDIT LESSON MODAL
// =========================================================================
const AddEditLessonModal = ({
  isOpen,
  editingEntry,
  subjects,
  users,
  daysOfWeek,
  timeSlots,
  onClose,
  onSave
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(editingEntry?.subjectId || '');
  const [subjectName, setSubjectName] = useState(editingEntry?.subjectName || '');
  const [subjectCode, setSubjectCode] = useState(editingEntry?.subjectCode || '');
  const [subjectIcon, setSubjectIcon] = useState(editingEntry?.subjectIcon || '📚');
  const [subjectCategory, setSubjectCategory] = useState(editingEntry?.subjectCategory || 'Magia Praktyczna');

  const [dayOfWeek, setDayOfWeek] = useState(editingEntry?.dayOfWeek || 1);
  const [startTime, setStartTime] = useState(editingEntry?.startTime || '08:30');
  const [endTime, setEndTime] = useState(editingEntry?.endTime || '10:00');
  const [classroom, setClassroom] = useState(editingEntry?.classroom || 'Krypta Szeptów (Poziom -3)');

  const [professorName, setProfessorName] = useState(editingEntry?.professorName || 'Prof. Morana Vane');
  const [professorId, setProfessorId] = useState(editingEntry?.professorId || '');
  const [professorAvatar, setProfessorAvatar] = useState(editingEntry?.professorAvatar || '');

  const [classYear, setClassYear] = useState(editingEntry?.classYear || 'Klasa I');
  const [houseTarget, setHouseTarget] = useState(editingEntry?.houseTarget || 'all');
  const [topic, setTopic] = useState(editingEntry?.topic || '');
  const [notes, setNotes] = useState(editingEntry?.notes || '');

  // When subject dropdown changes, automatically auto-fill room, professor, code, and icon!
  const handleSubjectChange = (e) => {
    const sId = e.target.value;
    setSelectedSubjectId(sId);

    const match = subjects.find(s => s.id === sId);
    if (match) {
      setSubjectName(match.name);
      setSubjectCode(match.code || '');
      setSubjectIcon(match.icon || '📚');
      setSubjectCategory(match.category || 'Magia');
      if (match.classroom) setClassroom(match.classroom);
      if (match.professorName) setProfessorName(match.professorName);
      if (match.professorId) setProfessorId(match.professorId);
      if (match.classYears && match.classYears[0]) setClassYear(match.classYears[0]);
    }
  };

  // Quick preset time slots
  const handleTimeSlotSelect = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dayObj = daysOfWeek.find(d => d.dayNumber === parseInt(dayOfWeek, 10));
    onSave({
      subjectId: selectedSubjectId,
      subjectName,
      subjectCode,
      subjectIcon,
      subjectCategory,
      dayOfWeek: parseInt(dayOfWeek, 10),
      dayName: dayObj ? dayObj.name : 'Poniedziałek',
      startTime,
      endTime,
      classroom,
      professorId,
      professorName,
      professorAvatar,
      classYear,
      houseTarget,
      topic,
      notes,
      status: editingEntry?.status || 'scheduled'
    });
  };

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #101622 0%, #080c12 100%)',
          borderRadius: '12px',
          border: '1px solid var(--gold-ancient)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.2)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.8rem',
          color: '#e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '1.3rem' }}>ᛞ</span>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              {editingEntry ? 'Edytuj Zajęcia w Grafiku' : 'Dodaj Nowe Zajęcia do Planu'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Quick Select from existing Subjects */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-glow)', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Wybierz z oficjalnego katalogu Katedr (Auto-uzupełnianie sali i profesora):
            </label>
            <select
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'rgba(5, 7, 10, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="">-- Wybierz Katedrę lub wpisz ręcznie --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name} ({s.code || s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Name & Icon Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Ikona</label>
              <input
                type="text"
                value={subjectIcon}
                onChange={(e) => setSubjectIcon(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  textAlign: 'center',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Nazwa Przedmiotu *</label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="np. Czarna Magia i Wiązanie Cieni"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Day & Time Slot Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Dzień Tygodnia *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                {daysOfWeek.map(d => (
                  <option key={d.dayNumber} value={d.dayNumber}>{d.rune} {d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Początek *</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="08:30"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Koniec *</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="10:00"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', alignSelf: 'center' }}>Szybkie bloki:</span>
            {timeSlots.map(ts => (
              <button
                key={ts.slot}
                type="button"
                onClick={() => handleTimeSlotSelect(ts)}
                style={{
                  padding: '0.2rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                {ts.start} - {ts.end}
              </button>
            ))}
          </div>

          {/* Classroom / Komnata & Professor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Sala / Komnata Lekcyjna *</label>
              <input
                type="text"
                required
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="np. Krypta Szeptów (Poziom -3)"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Profesor Prowadzący *</label>
              <input
                type="text"
                required
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                placeholder="np. Prof. Morana Vane"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Class Year & Target House */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Klasa / Rok</label>
              <select
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Klasa I">Klasa I • Fundamenty</option>
                <option value="Klasa II">Klasa II • Zaawansowana</option>
                <option value="Klasa III">Klasa III • Specjalizacje</option>
                <option value="Klasa IV">Klasa IV • Mistrzowska</option>
                <option value="Wszyscy">Dla Wszystkich Adeptów</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Dedykowany Zakon / Dom</label>
              <select
                value={houseTarget}
                onChange={(e) => setHouseTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(5, 7, 10, 0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="all">Wszystkie Zakony (Wspólne)</option>
                <option value="ravnheim">🐦 Zakon Ravnheim</option>
                <option value="bjornhall">🐻 Zakon Björnhall</option>
                <option value="reinhall">🦌 Zakon Reinhall</option>
                <option value="otergard">🦦 Zakon Otergard</option>
              </select>
            </div>
          </div>

          {/* Topic & Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Temat Przewodni / Cel Zajęć</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="np. Wiązanie cieni i konstrukcja tarczy eterycznej"
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem',
                background: 'rgba(5, 7, 10, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Wymagany Ekwipunek / Uwagi</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. Rękawice ze skóry salamandry, własne kociołki"
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem',
                background: 'rgba(5, 7, 10, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.6rem',
                background: 'linear-gradient(135deg, #c59f4e 0%, #8a6c2f 100%)',
                border: '1px solid #f7dca0',
                borderRadius: '6px',
                color: '#05070a',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(197, 159, 78, 0.3)'
              }}
            >
              {editingEntry ? 'Zapisz Zmiany w Planie' : 'Wpisz Zajęcia do Planu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 2: USTAWIENIE ZASTĘPSTWA (SUBSTITUTION MODAL)
// =========================================================================
const SubstitutionModal = ({
  isOpen,
  entry,
  users,
  onClose,
  onConfirm
}) => {
  const professorsList = useMemo(() => {
    const profs = users.filter(u => u.role === 'professor' || u.role === 'admin');
    return profs.length > 0 ? profs : [
      { id: 'usr-morana', fullName: 'Prof. Morana Vane' },
      { id: 'usr-gunnar', fullName: 'Prof. Gunnar Vargson' },
      { id: 'usr-astrid-vinter', fullName: 'Prof. Astrid Vinter' },
      { id: 'usr-valgerda', fullName: 'Arcymistrzyni Valgerda Storm' }
    ];
  }, [users]);

  const [substituteProfName, setSubstituteProfName] = useState(
    entry.substituteProfessorName || (professorsList.find(p => p.fullName !== entry.professorName)?.fullName || 'Prof. Morana Vane')
  );
  const [substituteProfId, setSubstituteProfId] = useState(entry.substituteProfessorId || '');
  const [classroom, setClassroom] = useState(entry.classroom);
  const [reason, setReason] = useState(entry.substitutionReason || '');

  const quickReasons = [
    'Ekspedycja badawcza na Lodowiec Jostedal i fiordy zachodnie.',
    'Wielki Wiec Völv i odczytywanie znaków w Uppsale.',
    'Badania anomalii krystalicznej w Głębi Niflheimu.',
    'Sędziowanie eliminacji turnieju pojedynkowego Hólmganga.'
  ];

  const handleProfChange = (e) => {
    const name = e.target.value;
    setSubstituteProfName(name);
    const match = professorsList.find(p => p.fullName === name);
    if (match) setSubstituteProfId(match.id);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      substituteProfessorId: substituteProfId,
      substituteProfessorName: substituteProfName,
      substitutionReason: reason || 'Zastępstwo zarządzone przez Dyrekcję.',
      classroom
    });
  };

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #181226 0%, #0c0816 100%)',
          borderRadius: '12px',
          border: '1px solid #c084fc',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(168, 85, 247, 0.25)',
          width: '100%',
          maxWidth: '540px',
          padding: '1.8rem',
          color: '#e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(192, 132, 252, 0.3)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔁</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              Wprowadź Zastępstwo dla Lekcji
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Selected Lesson Info pill */}
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.2rem' }}>
          <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.98rem' }}>
            {entry.subjectIcon} {entry.subjectName}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Termin: <strong>{entry.dayName}, {entry.startTime} - {entry.endTime}</strong> • Pierwotny Wykładowca: <strong style={{ color: '#fca5a5' }}>{entry.originalProfessorName || entry.professorName}</strong>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Pick Substitute Professor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#d8b4fe', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Wybierz Profesora Zastępującego *
            </label>
            <select
              value={substituteProfName}
              onChange={handleProfChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'rgba(5, 7, 10, 0.9)',
                border: '1px solid #c084fc',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              {professorsList.map(prof => (
                <option key={prof.id || prof.fullName} value={prof.fullName}>
                  {prof.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Classroom Change */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Sala Lekcyjna (możliwość zmiany na czas zastępstwa):
            </label>
            <input
              type="text"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              placeholder="np. Arena Żelaznego Kręgu"
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem',
                background: 'rgba(5, 7, 10, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Reason for substitution */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Oficjalny Powód Zastępstwa / Notatka Katedry:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="np. Wyjazd na badania zórz polarnych..."
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem',
                background: 'rgba(5, 7, 10, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Quick Clickable Presets */}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Gotowe szablony powodów:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {quickReasons.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '4px',
                    color: '#e9d5ff',
                    fontSize: '0.74rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  • {r}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.6rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              style={{
                padding: '0.55rem 1.4rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                border: '1px solid #d8b4fe',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              Zatwierdź Zastępstwo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 3: ODWOŁANIE ZAJĘĆ (CANCELLATION MODAL)
// =========================================================================
const CancellationModal = ({
  isOpen,
  entry,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');

  const quickCancellationReasons = [
    'Huragan śnieżny kategorii IV nad fiordami — zakaz lotów i opuszczania wież.',
    'Nieszczelność filtrów i skażenie alchemiczne w laboratorium — kwarantanna.',
    'Anomalia magiczna w krypcie i uszkodzenie barier ochronnych.',
    'Święto Przesilenia Zimowego i Wiec Mistrzów Cytadeli.'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason || 'Zajęcia odwołane decyzją Dyrekcji Cytadeli.');
  };

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1c0e12 0%, #0c0406 100%)',
          borderRadius: '12px',
          border: '1px solid #ef4444',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(239, 68, 68, 0.25)',
          width: '100%',
          maxWidth: '520px',
          padding: '1.8rem',
          color: '#e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>❌</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              Odwołaj Zajęcia w Grafiku
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Selected Lesson Info pill */}
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.2rem' }}>
          <div style={{ fontWeight: 800, color: '#fca5a5', fontSize: '0.98rem' }}>
            {entry.subjectIcon} {entry.subjectName}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Termin: <strong>{entry.dayName}, {entry.startTime} - {entry.endTime}</strong> • Sala: {entry.classroom}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#fca5a5', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Podaj Oficjalny Powód Odwołania Lekcji *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="np. Skrajne warunki pogodowe, zawieja lodowa..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'rgba(5, 7, 10, 0.9)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Szablony powodów:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {quickCancellationReasons.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '4px',
                    color: '#fca5a5',
                    fontSize: '0.74rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  • {r}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.6rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Wróć
            </button>
            <button
              type="submit"
              style={{
                padding: '0.55rem 1.4rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              Potwierdź Odwołanie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
