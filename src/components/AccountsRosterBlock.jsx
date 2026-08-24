import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { AccountsRosterModal } from './AccountsRosterModal';
import {
  Users,
  Search,
  Crown,
  Sparkles,
  ChevronRight,
  Shield,
  BookOpen,
  Mail,
  Eye,
  Filter,
  X
} from 'lucide-react';

const HOUSE_CONFIG = {
  reinhall: {
    name: 'Reinhall',
    animal: 'Renifer',
    rune: 'ᚦ',
    color: '#c59f4e',
    badgeBg: 'rgba(197, 159, 78, 0.18)',
    border: '1px solid rgba(197, 159, 78, 0.45)',
    glow: 'rgba(197, 159, 78, 0.3)'
  },
  bjornhall: {
    name: 'Björnhall',
    animal: 'Niedźwiedź',
    rune: 'ᛉ',
    color: '#f87171',
    badgeBg: 'rgba(192, 43, 43, 0.22)',
    border: '1px solid rgba(192, 43, 43, 0.45)',
    glow: 'rgba(192, 43, 43, 0.3)'
  },
  ravnheim: {
    name: 'Ravnheim',
    animal: 'Kruk',
    rune: 'ᚱ',
    color: '#c084fc',
    badgeBg: 'rgba(167, 125, 224, 0.22)',
    border: '1px solid rgba(167, 125, 224, 0.45)',
    glow: 'rgba(167, 125, 224, 0.3)'
  },
  otergard: {
    name: 'Otergard',
    animal: 'Wydra',
    rune: 'ᛞ',
    color: '#2ec4b6',
    badgeBg: 'rgba(46, 196, 182, 0.22)',
    border: '1px solid rgba(46, 196, 182, 0.45)',
    glow: 'rgba(46, 196, 182, 0.3)'
  }
};

export const AccountsRosterBlock = () => {
  const {
    users,
    houses,
    blockGraphics,
    currentUser,
    setActiveView,
    setEmailInboxOpen,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'students' | 'staff'
  const [selectedHouse, setSelectedHouse] = useState('all'); // 'all' | 'reinhall' | 'bjornhall' | 'ravnheim' | 'otergard'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getBlockGraphic = (id) => (blockGraphics || []).find(b => b.id === id);

  const userList = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users;
  }, [users]);

  // Headcounts per house and roles
  const stats = useMemo(() => {
    const total = userList.length;
    const students = userList.filter(u => u.role === 'student');
    const staff = userList.filter(u => u.role === 'professor' || u.role === 'teacher' || u.role === 'admin' || u.role === 'headmaster');

    const counts = {
      reinhall: { students: 0 },
      bjornhall: { students: 0 },
      ravnheim: { students: 0 },
      otergard: { students: 0 }
    };

    students.forEach(u => {
      const hKey = (u.house || '').toLowerCase().trim();
      if (counts[hKey]) {
        counts[hKey].students += 1;
      }
    });

    return {
      total,
      studentsCount: students.length,
      staffCount: staff.length,
      counts
    };
  }, [userList]);

  // Filtered list for the sidebar
  const displayedUsers = useMemo(() => {
    return userList.filter(user => {
      // Role filter
      if (activeTab === 'students' && user.role !== 'student') return false;
      if (activeTab === 'staff' && user.role === 'student') return false;

      // House filter (only applies to students since professors have no house)
      if (selectedHouse !== 'all') {
        if (user.role !== 'student') return false;
        const uHouse = (user.house || '').toLowerCase().trim();
        if (uHouse !== selectedHouse) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (user.fullName || `${user.name || ''} ${user.surname || ''}` || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const title = (user.title || '').toLowerCase();
        const dept = (user.departmentName || user.department || '').toLowerCase();
        const houseName = (user.house ? (houses[user.house]?.name || user.house) : '').toLowerCase();

        return fullName.includes(q) || username.includes(q) || title.includes(q) || dept.includes(q) || houseName.includes(q);
      }

      return true;
    }).slice(0, 7); // Show top 7 in compact sidebar block
  }, [userList, activeTab, selectedHouse, searchQuery, houses]);

  const handleHousePillClick = (houseKey) => {
    playWandSwoosh();
    setSelectedHouse(prev => prev === houseKey ? 'all' : houseKey);
  };

  const bgGraphic = getBlockGraphic('roster') || getBlockGraphic('identity');

  return (
    <>
      <div className="menuBlock" style={{ border: '1px solid var(--gold-ancient)' }}>
        {/* Header Image */}
        <div
          className="menuBlockHeaderImage"
          style={bgGraphic?.bgImage ? {
            backgroundImage: `linear-gradient(rgba(4, 7, 12, 0.4), rgba(4, 7, 12, 0.7)), url("${bgGraphic.bgImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="frost-overlay" />
          <div className="runic-watermark">{bgGraphic?.rune || 'ᛗ'}</div>
          <Users size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.9 }} />
        </div>

        {/* Title */}
        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᛗ</span>
          <span>Spis Kont & Zakony</span>
          <span className="rune-bracket">ᛗ</span>
        </div>

        <div className="menuBlockContent">
          {/* =========================================================
              1. ORDER HEADCOUNT CARDS (LICZBA ZAPISANYCH ADEPTÓW DO ZAKONÓW)
              ========================================================= */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Adeptowie w Zakonach:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontWeight: 700 }}>
                {stats.studentsCount} adeptów
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
              {Object.entries(HOUSE_CONFIG).map(([houseKey, cfg]) => {
                const hData = stats.counts[houseKey] || { students: 0 };
                const isSelected = selectedHouse === houseKey;
                const percentage = stats.studentsCount > 0 ? Math.round((hData.students / stats.studentsCount) * 100) : 0;

                return (
                  <div
                    key={houseKey}
                    onClick={() => handleHousePillClick(houseKey)}
                    style={{
                      padding: '0.45rem 0.5rem',
                      borderRadius: '4px',
                      background: isSelected ? cfg.badgeBg : 'rgba(8, 12, 18, 0.7)',
                      border: isSelected ? `1.5px solid ${cfg.color}` : cfg.border,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 10px ${cfg.glow}` : 'none'
                    }}
                    title={`Kliknij, aby przefiltrować adeptów ${cfg.name}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{cfg.rune}</span>
                        <span>{cfg.name}</span>
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                        {hData.students}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      <span>Adeptowie:</span>
                      <strong style={{ color: cfg.color }}>{hData.students}</strong>
                    </div>

                    {/* Mini fill bar */}
                    <div style={{ width: '100%', height: '3px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', marginTop: '0.3rem', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: cfg.color,
                          borderRadius: '2px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              2. SUB-TABS: WSZYSCY / ADEPTOWIE / NAUCZYCIELE
              ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', marginBottom: '0.6rem' }}>
            {[
              { id: 'all', label: `Wszyscy (${stats.total})` },
              { id: 'students', label: `Adepti (${stats.studentsCount})` },
              { id: 'staff', label: `Kadra (${stats.staffCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playWandSwoosh();
                  setActiveTab(tab.id);
                }}
                style={{
                  padding: '0.3rem 0.15rem',
                  borderRadius: '4px',
                  border: activeTab === tab.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.06)',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.25) 0%, rgba(138, 107, 43, 0.15) 100%)' : 'rgba(8, 12, 18, 0.6)',
                  color: activeTab === tab.id ? '#ffe599' : '#9ca3af',
                  fontSize: '0.68rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mini Search & Active Filter Chip */}
          <div style={{ marginBottom: '0.6rem', position: 'relative' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Szukaj adepta / mistrza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.35rem 0.5rem 0.35rem 1.65rem',
                background: 'rgba(5, 8, 14, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '0.72rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {selectedHouse !== 'all' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(197, 159, 78, 0.12)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px', padding: '0.25rem 0.5rem', marginBottom: '0.6rem', fontSize: '0.7rem' }}>
              <span style={{ color: '#ffe599' }}>
                Zakon: <strong>{HOUSE_CONFIG[selectedHouse]?.name || selectedHouse}</strong>
              </span>
              <button
                onClick={() => setSelectedHouse('all')}
                style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, padding: 0 }}
              >
                ✕ Pokaż wszystkie
              </button>
            </div>
          )}

          {/* =========================================================
              3. COMPACT LIST OF ACCOUNTS
              ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {displayedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Brak kont spełniających kryteria.
              </div>
            ) : (
              displayedUsers.map((user, idx) => {
                const isDirector = user.role === 'admin' || user.role === 'headmaster';
                const isProf = user.role === 'professor' || user.role === 'teacher';
                const hKey = (user.house || '').toLowerCase().trim();
                const houseCfg = HOUSE_CONFIG[hKey];
                const fullName = user.fullName || `${user.name || ''} ${user.surname || ''}`.trim() || user.username;

                return (
                  <div
                    key={user.id || idx}
                    onClick={() => {
                      playRuneChime();
                      setIsModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      background: isDirector
                        ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.16) 0%, rgba(15, 20, 30, 0.7) 100%)'
                        : 'rgba(8, 12, 18, 0.65)',
                      borderRadius: 'var(--radius-sm)',
                      border: isDirector
                        ? '1px solid rgba(197, 159, 78, 0.4)'
                        : houseCfg
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(255,255,255,0.04)',
                      fontSize: '0.78rem',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Kliknij, aby otworzyć pełną kartę w Księdze Mieszkańców"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                        alt={fullName}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isDirector
                            ? '1.5px solid var(--gold-ancient)'
                            : isProf
                            ? '1.5px solid #a4c8e1'
                            : houseCfg
                            ? `1.5px solid ${houseCfg.color}`
                            : '1.5px solid rgba(255,255,255,0.15)',
                          flexShrink: 0
                        }}
                      />

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            color: isDirector ? 'var(--gold-glow)' : isProf ? '#a4c8e1' : houseCfg ? houseCfg.color : '#ffffff',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {isDirector && <Crown size={11} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />}
                          {isProf && <BookOpen size={11} color="#a4c8e1" style={{ flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</span>
                        </div>

                        <div style={{ fontSize: '0.64rem', color: isDirector ? '#e2c56a' : isProf ? '#93c5fd' : '#8c95a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isDirector
                            ? 'Dyrekcja Cytadeli'
                            : isProf
                            ? (user.departmentName || user.title || 'Profesor Katedry')
                            : `${houseCfg ? houseCfg.name : 'Adept'} • ${user.classYear || 'Krąg I'}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ color: 'var(--gold-glow)', fontWeight: 700, fontSize: '0.74rem' }}>
                        {user.points || 0} pkt
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* =========================================================
              4. FULL ROSTER BUTTON
              ========================================================= */}
          <hr style={{ margin: '0.75rem 0', borderColor: 'rgba(255,255,255,0.08)' }} />

          <button
            onClick={() => {
              playWandSwoosh();
              setIsModalOpen(true);
            }}
            className="btn-durmstrang"
            style={{
              width: '100%',
              padding: '0.45rem',
              fontSize: '0.76rem',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={13} />
            <span>Pełna Księga Kont & Zakonów →</span>
          </button>
        </div>
      </div>

      {/* Full Modal */}
      <AccountsRosterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialHouseFilter={selectedHouse}
        initialRoleFilter={activeTab === 'students' ? 'student' : activeTab === 'staff' ? 'professor' : 'all'}
      />
    </>
  );
};
