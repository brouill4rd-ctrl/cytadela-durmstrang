import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { LivingHourglasses } from '../components/LivingHourglasses';
import { CommonRoomModal } from '../components/CommonRoomModal';
import {
  Shield,
  Sparkles,
  User,
  Award,
  Flame,
  Feather,
  Compass,
  BookOpen,
  Crown,
  TrendingUp,
  Clock,
  Calendar,
  ExternalLink,
  ChevronRight,
  DoorOpen
} from 'lucide-react';

export const HousesView = () => {
  const {
    houses,
    activeHouseTab,
    setActiveHouseTab,
    students,
    setActiveView,
    setActiveLessonId,
    houseRankings,
    rankingPeriod,
    fetchRankings,
    pointLedger
  } = useSchool();

  const { playWandSwoosh, playGateThud } = useSound();

  const [selectedHouseKey, setSelectedHouseKey] = useState(activeHouseTab || 'renifer');
  const [activePeriod, setActivePeriod] = useState(rankingPeriod || 'overall');
  const [commonRoomOpen, setCommonRoomOpen] = useState(false);

  useEffect(() => {
    if (activeHouseTab) {
      setSelectedHouseKey(activeHouseTab);
    }
  }, [activeHouseTab]);

  const house = houses[selectedHouseKey] || houses.renifer || Object.values(houses)[0];
  const houseMembers = (students || []).filter(s => s.house === selectedHouseKey);

  // Filter house point transactions from ledger (Single Source of Truth)
  const houseLessonPoints = (pointLedger || []).filter(tx => tx.house?.toLowerCase() === selectedHouseKey.toLowerCase() && !tx.isRevoked);

  const handleTabChange = (key) => {
    playWandSwoosh();
    setSelectedHouseKey(key);
    setActiveHouseTab(key);
  };

  const handlePeriodChange = async (period) => {
    playWandSwoosh();
    setActivePeriod(period);
    if (fetchRankings) {
      await fetchRankings(period);
    }
  };

  const handleOpenLesson = (lessonId) => {
    if (lessonId) {
      setActiveLessonId(lessonId);
      setActiveView('lesson-detail');
    }
  };

  const handleOpenCommonRoom = () => {
    playGateThud();
    setCommonRoomOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
          Dziedzictwa Cytadeli
        </span>
        <h1 style={{ fontSize: '2.6rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.8rem' }}>
          Cztery Zakony Durmstrangu
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem' }}>
          Każdy Zakon ucieleśnia inny filar nordyckiej sztuki magicznej: krew i ród (Reinhall), siłę bojową i żelazo (Björnhall), tajemnicę i cienie (Ravnheim) oraz alchemię i lodowcowe toksyny (Otergard).
        </p>
      </div>

      {/* =========================================================================
          1. 3D LIVING HOURGLASSES (KRYSZTAŁY PUNKTÓW PUCHARU PÓŁNOCY)
          ========================================================================= */}
      <LivingHourglasses />

      {/* =========================================================================
          2. DYNAMIC PUCHAR CYTADELI LEADERBOARD (SINGLE SOURCE OF TRUTH)
          ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          padding: '1.8rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.85)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} color="var(--gold-glow)" />
              <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                🏆 PUCHAR CYTADELI — RANKING ZAKONÓW
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {houseRankings?.schoolYear || 'XIX Rok Szkolny'} • {houseRankings?.term || 'Semestr Zimowy'} • Wyliczany w czasie rzeczywistym z zatwierdzonych dzienników
            </div>
          </div>

          {/* Temporal Ranking Selector Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(8, 11, 16, 0.9)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              borderRadius: '20px',
              padding: '0.2rem',
              gap: '0.2rem'
            }}
          >
            {[
              { id: 'overall', label: 'Ogólny' },
              { id: 'school_year', label: 'Rok Szkolny' },
              { id: 'monthly', label: 'Miesięczny' },
              { id: 'weekly', label: 'Tygodniowy' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                style={{
                  background: activePeriod === p.id ? 'linear-gradient(135deg, #c59f4e 0%, #9a7629 100%)' : 'transparent',
                  color: activePeriod === p.id ? '#090d14' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: activePeriod === p.id ? 800 : 500,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Standings Podium Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {(houseRankings?.standings || []).map((st) => {
            const h = houses[st.houseKey] || { name: st.name, crestIcon: st.crestIcon, colors: { primary: '#151b26', secondary: '#c59f4e', border: 'rgba(197,159,78,0.4)', glow: 'none' } };
            const isFirst = st.rank === 1;

            return (
              <div
                key={st.houseKey}
                onClick={() => handleTabChange(st.houseKey)}
                style={{
                  background: isFirst
                    ? 'linear-gradient(135deg, rgba(40, 32, 15, 0.95) 0%, rgba(15, 20, 30, 0.95) 100%)'
                    : 'rgba(12, 16, 24, 0.85)',
                  border: isFirst ? '1.5px solid var(--gold-glow)' : `1px solid ${h.colors?.border || 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  padding: '1.2rem',
                  cursor: 'pointer',
                  boxShadow: isFirst ? '0 0 25px rgba(197, 159, 78, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isFirst ? 'var(--gold-glow)' : '#9ca3af' }}>
                    {st.rank === 1 ? '🥇 1.' : st.rank === 2 ? '🥈 2.' : st.rank === 3 ? '🥉 3.' : '4.'}
                  </span>
                  {st.momentum > 0 && (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <TrendingUp size={12} /> +{st.momentum}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{st.crestIcon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: h.colors?.secondary || 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', marginTop: '0.1rem' }}>
                      {st.totalPoints} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pkt</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Z lekcji: +{st.lessonPoints} pkt</span>
                  <span>{st.txCount} wpisów</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* House Selector Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {Object.values(houses).map((h) => {
          const isSelected = h.id === selectedHouseKey;

          return (
            <button
              key={h.id}
              onClick={() => handleTabChange(h.id)}
              style={{
                padding: '1.2rem',
                background: isSelected
                  ? `linear-gradient(135deg, ${h.colors?.primary || '#131822'} 0%, rgba(25, 32, 45, 0.95) 100%)`
                  : 'rgba(12, 15, 22, 0.7)',
                border: isSelected ? `2px solid ${h.colors?.secondary || 'var(--gold-ancient)'}` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isSelected ? `0 0 25px ${h.colors?.glow || 'none'}` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{h.crestIcon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: isSelected ? '#ffffff' : '#b0b7c3' }}>
                    {h.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: h.colors?.secondary || 'var(--gold-ancient)', fontWeight: 600 }}>
                    {h.startingPoints || h.points || 0} pkt Północy
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: 'serif', fontSize: '1.5rem', color: h.colors?.secondary || 'var(--gold-ancient)' }}>
                ᛞ
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected House Deep Showcase */}
      {house && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            border: `1px solid ${house.colors?.border || 'rgba(197,159,78,0.3)'}`,
            background: `radial-gradient(circle at 80% 20%, ${house.colors?.primary || '#10141d'} 0%, rgba(10, 13, 18, 0.98) 80%)`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 35px ${house.colors?.glow || 'none'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <span style={{ color: house.colors?.secondary || 'var(--gold-ancient)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {house.fullName}
              </span>
              <h2 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.2rem' }}>
                Zakon {house.name} {house.crestIcon}
              </h2>
              <div style={{ fontStyle: 'italic', color: '#e5e7eb', fontSize: '1.2rem', fontFamily: 'var(--font-lore)', marginTop: '0.4rem' }}>
                {house.motto}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleOpenCommonRoom}
                style={{
                  background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.8rem 1.2rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(197, 159, 78, 0.4)'
                }}
              >
                <DoorOpen size={18} /> Wejdź do Dormitorium Zakonu
              </button>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: `1px solid ${house.colors?.secondary || 'var(--gold-ancient)'}`,
                  borderRadius: '8px',
                  padding: '0.8rem 1.4rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Puchar Północy
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: house.colors?.secondary || 'var(--gold-ancient)', lineHeight: 1.1 }}>
                  {house.startingPoints || house.points || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>
                  Punktów Zakonu
                </div>
              </div>
            </div>
          </div>

          {/* Core House Attributes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}
          >
            <div style={{ background: 'rgba(10, 13, 18, 0.7)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: house.colors?.secondary || 'var(--gold-ancient)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Crown size={16} /> Założyciel & Żywioł
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{house.founder}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.2rem' }}>Żywioł: {house.element}</div>
            </div>

            <div style={{ background: 'rgba(10, 13, 18, 0.7)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: house.colors?.secondary || 'var(--gold-ancient)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Shield size={16} /> Relikwia Paktu 1294
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem' }}>{house.relic}</div>
            </div>

            <div style={{ background: 'rgba(10, 13, 18, 0.7)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: house.colors?.secondary || 'var(--gold-ancient)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <User size={16} /> Opiekun & Prefekt
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{house.headOfHouse}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.2rem' }}>Prefekt: {house.prefect}</div>
            </div>
          </div>

          {/* =========================================================================
              SECTION: 🏆 PUNKTY Z LEKCJI (HISTORIA ZASILENIA ZAKONU)
              ========================================================================= */}
          <div
            style={{
              background: 'rgba(8, 11, 16, 0.85)',
              border: `1px solid ${house.colors?.border || 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color={house.colors?.secondary || 'var(--gold-ancient)'} />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                  🏆 PUNKTY Z LEKCJI — REJESTR ZASILENIA ({houseLessonPoints.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: house.colors?.secondary || 'var(--gold-ancient)', fontWeight: 700 }}>
                Łącznie z zajęć: +{houseLessonPoints.reduce((s, tx) => s + tx.points, 0)} pkt
              </span>
            </div>

            {houseLessonPoints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                Brak zarejestrowanych transakcji punktowych z lekcji dla tego Zakonu.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {houseLessonPoints.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleOpenLesson(tx.lessonId)}
                    style={{
                      background: 'rgba(15, 20, 30, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: tx.lessonId ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { if (tx.lessonId) e.currentTarget.style.borderColor = house.colors?.secondary || 'var(--gold-ancient)'; }}
                    onMouseLeave={(e) => { if (tx.lessonId) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <span
                        style={{
                          background: 'rgba(46, 196, 182, 0.15)',
                          color: '#2ec4b6',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-heading)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px'
                        }}
                      >
                        +{tx.points}
                      </span>
                      <div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem' }}>
                          {tx.source}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                          Uczeń: <strong>{tx.studentName}</strong> • {tx.professorName} • {tx.date}
                        </div>
                      </div>
                    </div>

                    {tx.lessonId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: house.colors?.secondary || 'var(--gold-ancient)', fontSize: '0.78rem', fontWeight: 600 }}>
                        <span>Zobacz Dziennik</span>
                        <ChevronRight size={14} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Common Room Modal */}
      <CommonRoomModal
        houseId={selectedHouseKey}
        isOpen={commonRoomOpen}
        onClose={() => setCommonRoomOpen(false)}
      />
    </div>
  );
};
