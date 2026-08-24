import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  Search,
  Users,
  GraduationCap,
  Crown,
  Shield,
  Filter,
  Sparkles,
  BookOpen,
  Mail,
  Award,
  ChevronRight,
  ExternalLink,
  Zap,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Eye,
  Compass
} from 'lucide-react';

const HOUSE_THEMES = {
  reinhall: {
    name: 'Reinhall',
    animal: 'Renifer Północy',
    rune: 'ᚦ',
    primaryColor: '#7a1818',
    secondaryColor: '#c59f4e',
    glowColor: 'rgba(197, 159, 78, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(122, 24, 24, 0.35) 0%, rgba(20, 10, 15, 0.75) 100%)',
    border: '1px solid rgba(197, 159, 78, 0.45)',
    textColor: '#f7e6c4'
  },
  bjornhall: {
    name: 'Björnhall',
    animal: 'Niedźwiedź Jaskiniowy',
    rune: 'ᛉ',
    primaryColor: '#202530',
    secondaryColor: '#c02b2b',
    glowColor: 'rgba(192, 43, 43, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(192, 43, 43, 0.3) 0%, rgba(15, 18, 26, 0.8) 100%)',
    border: '1px solid rgba(192, 43, 43, 0.45)',
    textColor: '#ffbaba'
  },
  ravnheim: {
    name: 'Ravnheim',
    animal: 'Kruk Mądrości',
    rune: 'ᚱ',
    primaryColor: '#1c132e',
    secondaryColor: '#a77de0',
    glowColor: 'rgba(167, 125, 224, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.35) 0%, rgba(18, 12, 30, 0.8) 100%)',
    border: '1px solid rgba(167, 125, 224, 0.45)',
    textColor: '#e6d8ff'
  },
  otergard: {
    name: 'Otergard',
    animal: 'Wydra Polarna',
    rune: 'ᛞ',
    primaryColor: '#0d2d33',
    secondaryColor: '#2ec4b6',
    glowColor: 'rgba(46, 196, 182, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(13, 94, 100, 0.35) 0%, rgba(10, 22, 28, 0.8) 100%)',
    border: '1px solid rgba(46, 196, 182, 0.45)',
    textColor: '#b2f5ea'
  }
};

export const AccountsRosterModal = ({ isOpen, onClose, initialHouseFilter = 'all', initialRoleFilter = 'all' }) => {
  const {
    users,
    houses,
    currentUser,
    setActiveView,
    setActiveHouseTab,
    setEmailInboxOpen,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter); // 'all' | 'student' | 'professor' | 'admin'
  const [houseFilter, setHouseFilter] = useState(initialHouseFilter); // 'all' | 'reinhall' | 'bjornhall' | 'ravnheim' | 'otergard' | 'neutral'
  const [sortBy, setSortBy] = useState('points-desc'); // 'points-desc' | 'level-desc' | 'name-asc' | 'role'
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  // Sync initial filters when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialHouseFilter) setHouseFilter(initialHouseFilter);
      if (initialRoleFilter) setRoleFilter(initialRoleFilter);
    }
  }, [isOpen, initialHouseFilter, initialRoleFilter]);

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedUserModal) {
          setSelectedUserModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedUserModal, onClose]);

  const userList = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users;
  }, [users]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = userList.length;
    const students = userList.filter(u => u.role === 'student');
    const professors = userList.filter(u => u.role === 'professor' || u.role === 'teacher');
    const admins = userList.filter(u => u.role === 'admin' || u.role === 'headmaster');

    const houseStats = {
      reinhall: { students: 0 },
      bjornhall: { students: 0 },
      ravnheim: { students: 0 },
      otergard: { students: 0 }
    };

    students.forEach(u => {
      const hKey = (u.house || '').toLowerCase().trim();
      if (houseStats[hKey]) {
        houseStats[hKey].students += 1;
      }
    });

    return {
      total,
      studentsCount: students.length,
      professorsCount: professors.length,
      adminsCount: admins.length,
      houseStats
    };
  }, [userList]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return userList.filter(user => {
      // Role match
      if (roleFilter !== 'all') {
        if (roleFilter === 'student' && user.role !== 'student') return false;
        if (roleFilter === 'professor' && user.role !== 'professor' && user.role !== 'teacher') return false;
        if (roleFilter === 'admin' && user.role !== 'admin' && user.role !== 'headmaster') return false;
      }

      // House match (only applies to students, professors have no house)
      if (houseFilter !== 'all') {
        if (user.role !== 'student') return false;
        const uHouse = (user.house || '').toLowerCase().trim();
        if (uHouse !== houseFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (user.fullName || `${user.name || ''} ${user.surname || ''}` || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const title = (user.title || '').toLowerCase();
        const dept = (user.departmentName || user.department || '').toLowerCase();
        const wand = (user.wand || '').toLowerCase();
        const patronus = (user.patronus || '').toLowerCase();
        const houseName = (user.house ? (houses[user.house]?.name || user.house) : '').toLowerCase();

        return (
          fullName.includes(q) ||
          username.includes(q) ||
          title.includes(q) ||
          dept.includes(q) ||
          wand.includes(q) ||
          patronus.includes(q) ||
          houseName.includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'points-desc') {
        return (b.points || 0) - (a.points || 0);
      }
      if (sortBy === 'level-desc') {
        return (b.level || 1) - (a.level || 1);
      }
      if (sortBy === 'name-asc') {
        const nameA = a.fullName || a.name || a.username || '';
        const nameB = b.fullName || b.name || b.username || '';
        return nameA.localeCompare(nameB, 'pl');
      }
      if (sortBy === 'role') {
        const roleOrder = { admin: 1, headmaster: 1, professor: 2, teacher: 2, student: 3 };
        return (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
      }
      return 0;
    });
  }, [userList, roleFilter, houseFilter, searchQuery, sortBy, houses]);

  if (!isOpen) return null;

  const handleHouseClick = (houseKey) => {
    playWandSwoosh();
    setHouseFilter(prev => prev === houseKey ? 'all' : houseKey);
  };

  const handleInspectUser = (user) => {
    playRuneChime();
    setSelectedUserModal(user);
  };

  const handleSendRaven = (user) => {
    playWandSwoosh();
    onClose();
    if (setEmailInboxOpen) {
      setEmailInboxOpen(true);
    } else {
      setActiveView('raven-post');
    }
    showNotification('Poczta Kruków', `Zaadresowano list do: ${user.fullName || user.name}`, 'info');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, #0d131f 0%, #080c14 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(90deg, rgba(20, 28, 42, 0.95) 0%, rgba(13, 19, 31, 0.95) 100%)',
            borderBottom: '1px solid rgba(197, 159, 78, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(20, 28, 42, 0.8) 100%)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(197, 159, 78, 0.3)'
              }}
            >
              <Users size={24} color="var(--gold-ancient)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.35rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--gold-glow)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  Księga Adeptów i Mistrzów
                </h2>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    background: 'rgba(197, 159, 78, 0.15)',
                    border: '1px solid rgba(197, 159, 78, 0.4)',
                    color: '#ffe599',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {stats.total} kont w Cytadeli
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Oficjalny rejestr mieszkańców Twierdzy Durmstrang • Przydział do Czterech Zakonów i Katedr Magii
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playWandSwoosh();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Zamknij (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* =========================================================
              1. SUMMARY: STATYSTYKI ZAPISANYCH DO ZAKONÓW
              ========================================================= */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} color="var(--gold-ancient)" /> Adeptowie w Zakonach Cytadeli:
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Kliknij herb Zakonu, aby przefiltrować adeptów
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(HOUSE_THEMES).map(([houseKey, theme]) => {
                const hData = stats.houseStats[houseKey] || { students: 0 };
                const isSelected = houseFilter === houseKey;
                const percent = stats.studentsCount > 0 ? Math.round((hData.students / stats.studentsCount) * 100) : 0;

                return (
                  <div
                    key={houseKey}
                    onClick={() => handleHouseClick(houseKey)}
                    style={{
                      background: isSelected ? theme.bgGradient : 'rgba(10, 15, 24, 0.75)',
                      border: isSelected ? `2px solid ${theme.secondaryColor}` : theme.border,
                      borderRadius: '8px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? `0 0 20px ${theme.glowColor}` : '0 4px 12px rgba(0,0,0,0.4)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Background Runic Watermark */}
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        bottom: '-10px',
                        fontSize: '3.5rem',
                        opacity: 0.12,
                        fontFamily: 'serif',
                        color: theme.secondaryColor,
                        pointerEvents: 'none'
                      }}
                    >
                      {theme.rune}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '4px',
                            background: theme.primaryColor,
                            border: `1px solid ${theme.secondaryColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            color: theme.textColor
                          }}
                        >
                          {theme.rune}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.secondaryColor, letterSpacing: '0.04em' }}>
                            {theme.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            {theme.animal}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                          {hData.students}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: '0.2rem' }}>
                          ({percent}%)
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                      <span>🧙 Zapisani Adeptowie:</span>
                      <strong style={{ color: theme.textColor }}>{hData.students}</strong>
                    </div>

                    {/* Visual Progress bar */}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: theme.secondaryColor,
                          borderRadius: '2px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              2. SEARCH, ROLE TABS & SORT CONTROLS
              ========================================================= */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'rgba(12, 17, 26, 0.9)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Role Filter Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {[
                { id: 'all', label: `Wszyscy (${stats.total})`, icon: '👥' },
                { id: 'student', label: `🧙 Adeptowie (${stats.studentsCount})`, icon: '🧙' },
                { id: 'professor', label: `👑 Grono Pedagogiczne (${stats.professorsCount})`, icon: '👑' },
                { id: 'admin', label: `🏛️ Dyrekcja (${stats.adminsCount})`, icon: '🏛️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playWandSwoosh();
                    setRoleFilter(tab.id);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: roleFilter === tab.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                    background: roleFilter === tab.id ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(138, 107, 43, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                    color: roleFilter === tab.id ? '#ffe599' : '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: roleFilter === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input & Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Szukaj adepta, mistrza, różdżki..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.42rem 0.6rem 0.42rem 2rem',
                    background: 'rgba(5, 8, 14, 0.8)',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.42rem 0.6rem',
                  background: 'rgba(5, 8, 14, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  fontSize: '0.76rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="points-desc">Punkty: od najwyższych</option>
                <option value="level-desc">Poziom (Krąg): od najwyższego</option>
                <option value="name-asc">Alfabetycznie: A-Z</option>
                <option value="role">Według Rangi (Dyrekcja &gt; Kadra &gt; Adept)</option>
              </select>

              {/* Reset house filter if active */}
              {houseFilter !== 'all' && (
                <button
                  onClick={() => setHouseFilter('all')}
                  style={{
                    padding: '0.42rem 0.6rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title="Wyczyść filtr Zakonu"
                >
                  <span>Filtr: {HOUSE_THEMES[houseFilter]?.name || houseFilter}</span>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* =========================================================
              3. USER CARDS GRID
              ========================================================= */}
          {filteredUsers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'rgba(8, 12, 18, 0.5)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>
                Nie znaleziono żadnych kont spełniających wybrane kryteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setHouseFilter('all');
                }}
                className="btn-durmstrang-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
              >
                Zresetuj wszystkie filtry
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '0.85rem'
              }}
            >
              {filteredUsers.map((user) => {
                const hKey = (user.house || '').toLowerCase().trim();
                const houseTheme = HOUSE_THEMES[hKey];
                const isDirector = user.role === 'admin' || user.role === 'headmaster';
                const isProf = user.role === 'professor' || user.role === 'teacher';
                const fullName = user.fullName || `${user.name || ''} ${user.surname || ''}`.trim() || user.username;

                return (
                  <div
                    key={user.id || user.username}
                    style={{
                      background: isDirector
                        ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.16) 0%, rgba(15, 22, 34, 0.85) 100%)'
                        : houseTheme
                        ? 'rgba(11, 16, 26, 0.85)'
                        : 'rgba(10, 14, 22, 0.7)',
                      border: isDirector
                        ? '1px solid rgba(197, 159, 78, 0.5)'
                        : houseTheme
                        ? houseTheme.border
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Avatar & Basic Info */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={fullName}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isDirector
                              ? '2px solid var(--gold-ancient)'
                              : isProf
                              ? '2px solid #a4c8e1'
                              : houseTheme
                              ? `2px solid ${houseTheme.secondaryColor}`
                              : '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 0 10px rgba(0,0,0,0.8)'
                          }}
                        />
                        {/* House/Role Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            right: '-4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isDirector ? '#7a1818' : isProf ? '#1e293b' : houseTheme ? houseTheme.primaryColor : '#1e293b',
                            border: isDirector ? '1px solid var(--gold-ancient)' : isProf ? '1px solid #a4c8e1' : '1px solid rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: isDirector ? '#ffe599' : isProf ? '#a4c8e1' : houseTheme ? houseTheme.textColor : '#ffffff'
                          }}
                        >
                          {isDirector ? '👑' : isProf ? '📖' : houseTheme ? houseTheme.rune : 'ᛟ'}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: isDirector ? 'var(--gold-glow)' : isProf ? '#a4c8e1' : houseTheme ? houseTheme.textColor : '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={fullName}
                          >
                            {fullName}
                          </span>
                        </div>

                        {/* Subtitle / Role */}
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: isDirector ? '#e2c56a' : isProf ? '#93c5fd' : houseTheme ? houseTheme.secondaryColor : '#94a3b8',
                            fontWeight: 600,
                            marginTop: '0.15rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {isDirector
                            ? 'Arcymistrzyni Cytadeli'
                            : isProf
                            ? user.departmentName || user.title || 'Profesor Katedry'
                            : user.title || (houseTheme ? `Adept Zakonu ${houseTheme.name}` : 'Adept')}
                        </div>

                        {/* House & Year / Office tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                          {user.role === 'student' && houseTheme && (
                            <span
                              style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: houseTheme.primaryColor,
                                border: `1px solid ${houseTheme.secondaryColor}`,
                                color: houseTheme.textColor,
                                fontSize: '0.66rem',
                                fontWeight: 700
                              }}
                            >
                              Zakon {houseTheme.name}
                            </span>
                          )}

                          {isProf && (
                            <span
                              style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(164, 200, 225, 0.15)',
                                border: '1px solid rgba(164, 200, 225, 0.35)',
                                color: '#a4c8e1',
                                fontSize: '0.66rem',
                                fontWeight: 700
                              }}
                            >
                              {user.departmentName || 'Katedra Magii'}
                            </span>
                          )}

                          {user.classYear && (
                            <span
                              style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#94a3b8',
                                fontSize: '0.66rem'
                              }}
                            >
                              {user.classYear}
                            </span>
                          )}

                          {user.office && (
                            <span
                              style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#94a3b8',
                                fontSize: '0.66rem'
                              }}
                            >
                              {user.office.split(',')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stats / Lore detail snippet */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(5, 8, 14, 0.6)',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ color: '#94a3b8' }}>Krąg/Poziom:</span>
                        <strong style={{ color: '#ffffff' }}>{user.level || (isDirector ? 10 : isProf ? 8 : 1)}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: 'var(--gold-ancient)' }}>⭐</span>
                        <span style={{ color: 'var(--gold-glow)', fontWeight: 800 }}>
                          {user.points || 0} pkt
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleInspectUser(user)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#e2e8f0',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Eye size={12} color="var(--gold-ancient)" />
                        <span>Karta Postaci</span>
                      </button>

                      <button
                        onClick={() => handleSendRaven(user)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(88, 28, 135, 0.35) 100%)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          color: '#e9d5ff',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Mail size={12} color="#c084fc" />
                        <span>List Krukiem</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'rgba(10, 15, 24, 0.95)',
            borderTop: '1px solid rgba(197, 159, 78, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}
        >
          <div>
            Wyświetlono <strong style={{ color: '#ffffff' }}>{filteredUsers.length}</strong> z <strong style={{ color: '#ffffff' }}>{stats.total}</strong> zarejestrowanych dusz
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => {
                onClose();
                setActiveView('houses');
              }}
              className="btn-durmstrang-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.76rem' }}
            >
              Komnaty & Puchar Zakonów →
            </button>
            <button
              onClick={onClose}
              className="btn-durmstrang"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.76rem' }}
            >
              Zamknij Księgę
            </button>
          </div>
        </div>

        {/* =========================================================
            USER DETAIL INSPECTION SUB-MODAL
            ========================================================= */}
        {selectedUserModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(3, 6, 12, 0.88)',
              backdropFilter: 'blur(12px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedUserModal(null);
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '650px',
                background: 'linear-gradient(180deg, #101624 0%, #0a0d16 100%)',
                border: '1.5px solid var(--gold-ancient)',
                borderRadius: '10px',
                padding: '1.5rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.95)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setSelectedUserModal(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>

              {/* Profile Card Header */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <img
                  src={selectedUserModal.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedUserModal.fullName || selectedUserModal.name}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--gold-ancient)',
                    boxShadow: '0 0 15px rgba(197, 159, 78, 0.3)'
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)' }}>
                    {selectedUserModal.fullName || selectedUserModal.name}
                  </h3>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    @{selectedUserModal.username} • {selectedUserModal.title || 'Mieszkaniec Cytadeli'}
                  </div>
                  {selectedUserModal.role === 'student' && selectedUserModal.house && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: HOUSE_THEMES[selectedUserModal.house]?.primaryColor || 'rgba(255,255,255,0.1)',
                          border: `1px solid ${HOUSE_THEMES[selectedUserModal.house]?.secondaryColor || 'var(--gold-ancient)'}`,
                          color: HOUSE_THEMES[selectedUserModal.house]?.textColor || '#ffe599',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        Zakon {HOUSE_THEMES[selectedUserModal.house]?.name || selectedUserModal.house}
                      </span>
                    </div>
                  )}
                  {(selectedUserModal.role === 'professor' || selectedUserModal.role === 'teacher') && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: 'rgba(164, 200, 225, 0.15)',
                          border: '1px solid rgba(164, 200, 225, 0.4)',
                          color: '#a4c8e1',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {selectedUserModal.departmentName || 'Katedra Magii • Grono Pedagogiczne'}
                      </span>
                    </div>
                  )}
                  {(selectedUserModal.role === 'admin' || selectedUserModal.role === 'headmaster') && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: 'rgba(197, 159, 78, 0.2)',
                          border: '1px solid var(--gold-ancient)',
                          color: '#ffe599',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        Rada Dyrekcji Cytadeli
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(5, 8, 14, 0.6)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Różdżka & Rdzeń:</div>
                  <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {selectedUserModal.wand || 'Brak danych o rdzeniu'}
                  </div>
                </div>

                <div style={{ background: 'rgba(5, 8, 14, 0.6)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Patronus / Totem:</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ice-crystal)', fontWeight: 600, marginTop: '0.2rem' }}>
                    {selectedUserModal.patronus || 'Niewybudzony'}
                  </div>
                </div>

                <div style={{ background: 'rgba(5, 8, 14, 0.6)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pochodzenie:</div>
                  <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {selectedUserModal.origin || 'Północne Fiordy'}
                  </div>
                </div>

                <div style={{ background: 'rgba(5, 8, 14, 0.6)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Skarbiec & Punkty:</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 600, marginTop: '0.2rem' }}>
                    {selectedUserModal.currency || 0} Skirnirów • {selectedUserModal.points || 0} Pkt
                  </div>
                </div>
              </div>

              {selectedUserModal.specialization && (
                <div style={{ background: 'rgba(5, 8, 14, 0.6)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Specjalizacja Magiczna:</div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                    {selectedUserModal.specialization}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  onClick={() => handleSendRaven(selectedUserModal)}
                  className="btn-durmstrang"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
                >
                  <Mail size={14} />
                  <span>Wyślij List Krukiem</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
