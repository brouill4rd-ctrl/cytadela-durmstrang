import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { AccountsRosterModal } from './AccountsRosterModal';
import {
  Users,
  BookOpen
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
    blockGraphics
  } = useSchool();

  const { playWandSwoosh } = useSound();

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

  const handleHousePillClick = (houseKey) => {
    playWandSwoosh();
    setIsModalOpen(true);
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
                const percentage = stats.studentsCount > 0 ? Math.round((hData.students / stats.studentsCount) * 100) : 0;

                return (
                  <div
                    key={houseKey}
                    onClick={() => handleHousePillClick(houseKey)}
                    style={{
                      padding: '0.45rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(8, 12, 18, 0.7)',
                      border: cfg.border,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title={`Kliknij, aby otworzyć Pełną Księgę`}
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
              2. FULL ROSTER BUTTON
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
        initialHouseFilter="all"
        initialRoleFilter="all"
      />
    </>
  );
};
