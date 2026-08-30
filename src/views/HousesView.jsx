import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { CommonRoomModal } from '../components/CommonRoomModal';
import { OrderCrest, normalizeHouseKey, HOUSE_RUNIC_DATA } from '../components/HeraldicEmblems';
import { cleanPersonName } from '../context/schoolUtils';
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
  Clock,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Lock,
  AlertTriangle
} from 'lucide-react';

const HOUSE_BANNER_IMAGES = {
  reinhall: '/banery_zakony/reinhall-baner.png',
  bjornhall: '/banery_zakony/bjornhall-baner.png',
  ravnheim: '/banery_zakony/baner-ravnheim.png',
  otergard: '/banery_zakony/otergard-baner.png'
};

const POINT_SOURCE_LABELS = {
  LESSON: 'Lekcja',
  HOMEWORK: 'Praca domowa',
  ACTIVITY: 'Aktywność',
  QUEST: 'Zadanie',
  SECRET: 'Odkrycie tajemnicy',
  WORKSHOP: 'Warsztat',
  SHOPPING_LIST: 'Lista zakupów',
  LOTTERY_WIN: 'Loteria',
  EVENT: 'Wydarzenie',
  ADMIN_AWARD: 'Nagroda administracyjna',
  ADMIN_DEDUCTION: 'Kara administracyjna',
  ADMIN_HOUSE_AWARD: 'Nagroda dla Zakonu',
  ADMIN_HOUSE_DEDUCTION: 'Kara dla Zakonu',
  ADMIN_CORRECTION: 'Korekta',
  LEGACY_BALANCE_IMPORT: 'Bilans początkowy',
  MANUAL: 'Przyznanie ręczne',
  LEGACY: 'Wpis archiwalny'
};

export const HousesView = () => {
  const {
    houses,
    activeHouseTab,
    setActiveHouseTab,
    students,
    staffRanking,
    fortressGuardian,
    setActiveView,
    setActiveLessonId,
    pointLedger,
    currentUser,
    setAuthModalOpen
  } = useSchool();

  const { playWandSwoosh, playGateThud } = useSound();

  const [selectedHouseKey, setSelectedHouseKey] = useState(activeHouseTab || 'reinhall');
  const [individualRankingTab, setIndividualRankingTab] = useState('students'); // 'students' | 'staff'
  const [commonRoomOpen, setCommonRoomOpen] = useState(false);
  const [wardAlert, setWardAlert] = useState(null);
  const [showAllPointTransactions, setShowAllPointTransactions] = useState(false);

  useEffect(() => {
    if (activeHouseTab) {
      setSelectedHouseKey(activeHouseTab);
    }
  }, [activeHouseTab]);

  const normSelectedKey = normalizeHouseKey(selectedHouseKey);
  const house = houses[selectedHouseKey] || houses[normSelectedKey] || houses.reinhall || Object.values(houses)[0];
  const houseTheme = HOUSE_RUNIC_DATA[normSelectedKey] || HOUSE_RUNIC_DATA.reinhall;
  const houseBannerImage = HOUSE_BANNER_IMAGES[normSelectedKey] || HOUSE_BANNER_IMAGES.reinhall;
  const houseMembers = (students || []).filter(s => normalizeHouseKey(s.house) === normSelectedKey);

  // Student Dormitory Access Check
  const userHouseRaw = currentUser?.house || currentUser?.house_id || currentUser?.houseId || currentUser?.house_name;
  const userHouseKey = userHouseRaw ? normalizeHouseKey(userHouseRaw) : null;
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'headmaster';
  const hasDormAccess = Boolean(currentUser && (isStaff || (userHouseKey && userHouseKey === normSelectedKey)));
  const userAssignedHouse = userHouseKey ? (houses[userHouseKey] || { name: HOUSE_RUNIC_DATA[userHouseKey]?.animal || userHouseKey }) : null;

  // All active house transactions, regardless of how the points were earned.
  const housePointTransactions = (pointLedger || []).filter(tx => {
    const txH = normalizeHouseKey(tx.house);
    return txH === normSelectedKey && !tx.isRevoked;
  });
  const housePointBalance = housePointTransactions.reduce((sum, tx) => sum + (Number(tx.points) || 0), 0);
  const visiblePointTransactions = showAllPointTransactions
    ? housePointTransactions
    : housePointTransactions.slice(0, 10);
  const hiddenPointTransactionsCount = Math.max(housePointTransactions.length - 10, 0);

  const handleTabChange = (key) => {
    playWandSwoosh();
    setSelectedHouseKey(key);
    setActiveHouseTab(key);
    setWardAlert(null);
    setShowAllPointTransactions(false);
  };

  const handleOpenLesson = (lessonId) => {
    if (lessonId) {
      setActiveLessonId(lessonId);
      setActiveView('lesson-detail');
    }
  };

  const handleOpenCommonRoom = () => {
    if (!currentUser) {
      playGateThud();
      setWardAlert({
        title: 'Wymagane Logowanie',
        message: `Aby przekroczyć próg Dormitorium Zakonu ${house.name}, musisz być zalogowany na konto ucznia przypisanego do tego Zakonu.`
      });
      return;
    }

    if (!hasDormAccess) {
      playGateThud();
      setWardAlert({
        title: 'Strażnik Runiczny Blokuje Wstęp',
        message: `Dormitorium Zakonu ${house.name} jest zastrzeżone wyłącznie dla jego członków. Twoje konto jest przypisane do: ${userAssignedHouse?.name ? `Zakon ${userAssignedHouse.name}` : 'Brak przydziału (wymagana Ceremonia Przydziału)'}.`
      });
      return;
    }

    playGateThud();
    setCommonRoomOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
          Dziedzictwa Twierdzy Magii (TMD)
        </span>
        <h1 style={{ fontSize: '2.6rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.8rem' }}>
          Cztery Zakony Durmstrangu
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem' }}>
          Każdy Zakon ucieleśnia inny filar nordyckiej sztuki magicznej: krew i ród (Reinhall), siłę bojową i żelazo (Björnhall), tajemnicę i cienie (Ravnheim) oraz alchemię i lodowcowe toksyny (Otergard).
        </p>
      </div>

      {/* Individual leaderboard: adepts and staff */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.95) 0%, rgba(10, 14, 22, 0.98) 100%)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          padding: '1.8rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.85)'
        }}
      >

        {/* =========================================================================
            INDIVIDUAL LEADERBOARD: ADEPTOWIE ORAZ KADRA & DYREKCJA
            ========================================================================= */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--gold-glow)" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>
                  INDYWIDUALNA TABLICA SŁAWY CYTADELI
                </h3>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Klasyfikacja punktowa z imieniem i nazwiskiem • Osobne zestawienia dla Adeptów oraz Kadry z Dyrekcją
              </div>
            </div>

            {/* Toggle Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(8, 11, 16, 0.9)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                borderRadius: '20px',
                padding: '0.2rem',
                gap: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  playWandSwoosh();
                  setIndividualRankingTab('students');
                }}
                style={{
                  background: individualRankingTab === 'students' ? 'linear-gradient(135deg, #c59f4e 0%, #9a7629 100%)' : 'transparent',
                  color: individualRankingTab === 'students' ? '#090d14' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.75rem',
                  fontWeight: individualRankingTab === 'students' ? 800 : 500,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>🧙‍♂️</span>
                <span>Ranking Adeptów</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playWandSwoosh();
                  setIndividualRankingTab('staff');
                }}
                style={{
                  background: individualRankingTab === 'staff' ? 'linear-gradient(135deg, #c59f4e 0%, #9a7629 100%)' : 'transparent',
                  color: individualRankingTab === 'staff' ? '#090d14' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.75rem',
                  fontWeight: individualRankingTab === 'staff' ? 800 : 500,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>👑</span>
                <span>Kadra Nauczycielska & Dyrekcja</span>
              </button>
            </div>
          </div>

          {/* Individual Students Ranking List */}
          {individualRankingTab === 'students' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {(students || []).map((stud, idx) => {
                const h = houses[stud.house] || Object.values(houses).find(x => x.id === stud.house);
                const fullName = stud.fullName || `${stud.name} ${stud.surname || ''}`.trim() || stud.name;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={stud.id || idx}
                    style={{
                      background: isTop3 ? 'rgba(20, 26, 38, 0.9)' : 'rgba(12, 16, 24, 0.75)',
                      border: idx === 0 ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      boxShadow: idx === 0 ? '0 0 15px rgba(197, 159, 78, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : idx === 1 ? 'rgba(203, 213, 225, 0.15)' : idx === 2 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255,255,255,0.05)',
                          border: idx === 0 ? '1px solid #f59e0b' : idx === 1 ? '1px solid #cbd5e1' : idx === 2 ? '1px solid #d97706' : '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-heading)',
                          color: idx === 0 ? '#f59e0b' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#94a3b8',
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </div>

                      {stud.avatar && (
                        <img
                          src={stud.avatar}
                          alt={fullName}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${h?.colors?.secondary || 'rgba(197,159,78,0.5)'}`, flexShrink: 0 }}
                        />
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fullName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: h?.colors?.secondary || '#94a3b8', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h ? `Zakon ${h.name}` : 'Adept'} {stud.year ? `• Klasa ${stud.year}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--gold-glow)', fontSize: '1.05rem' }}>
                        {stud.points} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>pkt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Individual Staff Ranking List (Nauczyciele & Dyrekcja) */}
          {individualRankingTab === 'staff' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {(staffRanking || []).map((staff, idx) => {
                const isDirector = staff.role === 'admin' || staff.role === 'headmaster';
                const h = staff.house ? (houses[staff.house] || Object.values(houses).find(x => x.id === staff.house)) : null;
                const fullName = staff.fullName || `${staff.name} ${staff.surname || ''}`.trim() || staff.name;

                return (
                  <div
                    key={staff.id || idx}
                    style={{
                      background: isDirector
                        ? 'linear-gradient(135deg, rgba(35, 28, 15, 0.95) 0%, rgba(15, 20, 30, 0.85) 100%)'
                        : idx === 0
                        ? 'rgba(20, 26, 38, 0.9)'
                        : 'rgba(12, 16, 24, 0.75)',
                      border: isDirector
                        ? '1.5px solid var(--gold-ancient)'
                        : idx === 0
                        ? '1px solid var(--gold-ancient)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      boxShadow: isDirector ? '0 0 20px rgba(197, 159, 78, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isDirector ? 'rgba(245, 158, 11, 0.25)' : idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: isDirector ? '1px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-heading)',
                          color: isDirector ? 'var(--gold-glow)' : '#f59e0b',
                          flexShrink: 0
                        }}
                      >
                        {isDirector ? <Crown size={14} color="var(--gold-glow)" /> : idx + 1}
                      </div>

                      {staff.avatar && (
                        <img
                          src={staff.avatar}
                          alt={fullName}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: isDirector ? '2px solid var(--gold-ancient)' : `1.5px solid ${h?.colors?.secondary || 'rgba(197,159,78,0.5)'}`, flexShrink: 0 }}
                        />
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: isDirector ? 'var(--gold-glow)' : '#ffffff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fullName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isDirector ? '#e2c56a' : h?.colors?.secondary || '#94a3b8', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isDirector ? 'Rada Dyrekcji Cytadeli' : staff.roleLabel || staff.department || (h ? `Opiekun ${h.name}` : 'Katedra')}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--gold-glow)', fontSize: '1.05rem' }}>
                        {staff.points || 0} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>pkt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          KARTA: 🛡️ STRAŻNIK TWIERDZY (ODPOWIEDNIK PREFEKTA NACZELNEGO)
          ========================================================================= */}
      {fortressGuardian?.name && (() => {
        const fgHouseKey = normalizeHouseKey(fortressGuardian.house || 'ravnheim');
        const fgRunic = HOUSE_RUNIC_DATA[fgHouseKey] || HOUSE_RUNIC_DATA.ravnheim;
        const fgHouseObj = houses[fgHouseKey] || { name: fortressGuardian.house || 'Ravnheim' };

        return (
          <div
            className="gothic-card runic-corners"
            style={{
              padding: '1.6rem 2.2rem',
              background: `linear-gradient(135deg, ${fgRunic.primaryColor}22 0%, rgba(10, 14, 22, 0.95) 100%)`,
              border: '1px solid var(--gold-ancient)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.85), 0 0 25px rgba(197, 159, 78, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', right: '20px', top: '-10px', fontSize: '6rem', opacity: 0.05, fontFamily: 'serif', pointerEvents: 'none', color: 'var(--gold-glow)' }}>
              {fgRunic.rune}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 2 }}>
              <div style={{ position: 'relative' }}>
                <OrderCrest houseKey={fgHouseKey} size={68} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    background: 'var(--gold-ancient)',
                    color: '#090d14',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.8)'
                  }}
                  title="Pieczęć Strażnika Twierdzy"
                >
                  🛡️
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.15rem 0.55rem', borderRadius: '4px', border: '1px solid rgba(197, 159, 78, 0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🛡️ STRAŻNIK TWIERDZY
                  </span>
                  <span style={{ fontSize: '0.75rem', color: fgRunic.secondaryColor, fontWeight: 700 }}>
                    Zakon {fgHouseObj.name} {fgRunic.rune}
                  </span>
                </div>

                <h3 style={{ margin: '0.3rem 0 0 0', fontSize: '1.65rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                  {fortressGuardian.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                  {fortressGuardian.title || 'Strażnik Twierdzy Durmstrang (odpowiednik Prefekta Naczelnego)'}
                </div>
              </div>
            </div>

            <div style={{ zIndex: 2, maxWidth: '420px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5 }}>
                „{fortressGuardian.note || 'Reprezentant całej społeczności adeptów, stróż dyscypliny i honoru Twierdzy Magii Durmstrang.'}”
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
                ᛞ Mianowany z mocy Paktu 1294 ᛞ
              </div>
            </div>
          </div>
        );
      })()}

      {/* House Selector Tabs — W JEDNEJ LINII (4 KOLUMNY W 1 RZĘDZIE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem'
        }}
      >
        {Object.values(houses).map((h) => {
          const isSelected = h.id === selectedHouseKey || normalizeHouseKey(h.id) === normSelectedKey;
          const runicData = HOUSE_RUNIC_DATA[normalizeHouseKey(h.id)] || HOUSE_RUNIC_DATA.reinhall;

          return (
            <button
              key={h.id}
              onClick={() => handleTabChange(h.id)}
              style={{
                padding: '1rem',
                background: isSelected
                  ? `linear-gradient(135deg, ${runicData.primaryColor} 0%, rgba(25, 32, 45, 0.95) 100%)`
                  : 'rgba(12, 15, 22, 0.7)',
                border: isSelected ? `2px solid ${runicData.secondaryColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isSelected ? `0 0 25px ${runicData.glowColor}` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <OrderCrest houseKey={h.id} size={42} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.02rem', fontWeight: 800, color: isSelected ? '#ffffff' : '#b0b7c3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.name}
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: 'serif', fontSize: '1.4rem', color: runicData.secondaryColor, marginLeft: '0.3rem', flexShrink: 0 }}>
                {runicData.rune}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ward Alert / Access Denied Notification Banner */}
      {wardAlert && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(35, 15, 20, 0.95) 0%, rgba(20, 10, 15, 0.95) 100%)',
            border: '1.5px solid #ef4444',
            borderRadius: '8px',
            padding: '1.2rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem' }}>
                {wardAlert.title}
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {wardAlert.message}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {!currentUser && setAuthModalOpen && (
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Zaloguj się
              </button>
            )}
            <button
              onClick={() => setWardAlert(null)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#cbd5e1',
                padding: '0.5rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* Selected House Deep Showcase */}
      {house && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            border: `1px solid ${houseTheme.secondaryColor}`,
            backgroundColor: houseTheme.primaryColor,
            backgroundImage: `linear-gradient(180deg, rgba(7, 10, 15, 0.16) 0%, rgba(7, 10, 15, 0.42) 48%, rgba(7, 10, 15, 0.72) 100%), url("${houseBannerImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 22%',
            backgroundRepeat: 'no-repeat',
            boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 35px ${houseTheme.glowColor}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <OrderCrest houseKey={selectedHouseKey} size={78} />
              <div>
                <span style={{ color: houseTheme.secondaryColor, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {house.fullName}
                </span>
                <h2 style={{ fontSize: '2.3rem', color: '#ffffff', marginTop: '0.1rem', marginBottom: '0.2rem' }}>
                  Zakon {house.name} <span style={{ fontFamily: 'serif', color: houseTheme.secondaryColor, fontSize: '1.8rem', marginLeft: '0.3rem' }}>{houseTheme.rune}</span>
                </h2>
                <div style={{ fontStyle: 'italic', color: '#e5e7eb', fontSize: '1.15rem', fontFamily: 'var(--font-lore)', marginTop: '0.2rem' }}>
                  {house.motto}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Dormitory Entrance Button with Strict Access Check */}
              <button
                onClick={handleOpenCommonRoom}
                style={{
                  background: hasDormAccess
                    ? 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)'
                    : 'rgba(30, 41, 59, 0.7)',
                  color: hasDormAccess ? '#000000' : '#94a3b8',
                  border: hasDormAccess ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '0.8rem 1.2rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: hasDormAccess ? '0 4px 15px rgba(197, 159, 78, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                title={
                  hasDormAccess
                    ? 'Wejdź do dormitorium swojego Zakonu'
                    : currentUser
                    ? `Dostęp zablokowany: Twoje konto jest przypisane do Zakonu ${userAssignedHouse?.name || 'Innego'}`
                    : 'Wymagane logowanie'
                }
              >
                {hasDormAccess ? (
                  <>
                    <DoorOpen size={18} /> Wejdź do Dormitorium Zakonu
                  </>
                ) : (
                  <>
                    <Lock size={18} style={{ color: '#ef4444' }} /> Dormitorium Zakonu (Dostęp Zastrzeżony)
                  </>
                )}
              </button>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: `1px solid ${houseTheme.secondaryColor}`,
                  borderRadius: '8px',
                  padding: '0.8rem 1.4rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Puchar Północy
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: houseTheme.secondaryColor, lineHeight: 1.1 }}>
                  {housePointBalance}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: houseTheme.secondaryColor, fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Crown size={16} /> Założyciel & Żywioł
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{house.founder}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.2rem' }}>Żywioł: {house.element}</div>
            </div>

            <div style={{ background: 'rgba(10, 13, 18, 0.7)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: houseTheme.secondaryColor, fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Shield size={16} /> Relikwia Paktu 1294
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem' }}>{house.relic}</div>
            </div>

            <div style={{ background: 'rgba(10, 13, 18, 0.7)', padding: '1.2rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: houseTheme.secondaryColor, fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <User size={16} /> Opiekun & Strażnik Zakonu
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>{cleanPersonName(house.headOfHouse)}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.2rem' }}>Strażnik: {cleanPersonName(house.prefect)}</div>
            </div>
          </div>

          {/* =========================================================================
              SECTION: WSZYSTKIE PUNKTY (HISTORIA ZASILENIA ZAKONU)
              ========================================================================= */}
          <div
            style={{
              background: 'rgba(8, 11, 16, 0.85)',
              border: `1px solid ${houseTheme.secondaryColor}`,
              borderRadius: '8px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color={houseTheme.secondaryColor} />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                  WSZYSTKIE PUNKTY — REJESTR ZAKONU ({housePointTransactions.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: houseTheme.secondaryColor, fontWeight: 700 }}>
                Bilans wszystkich źródeł: {housePointBalance > 0 ? '+' : ''}{housePointBalance} pkt
              </span>
            </div>


            {housePointTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                Brak zarejestrowanych transakcji punktowych dla tego Zakonu.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {visiblePointTransactions.map((tx) => {
                  const points = Number(tx.points) || 0;
                  const isPositive = points >= 0;
                  const sourceLabel = POINT_SOURCE_LABELS[tx.sourceType] || (tx.lessonId ? 'Lekcja' : 'Inne źródło');
                  const recipient = tx.studentName ? `Uczeń: ${tx.studentName}` : `Zakon ${house.name}`;
                  const actor = tx.actorName || tx.professorName;

                  return (
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
                      onMouseEnter={(e) => { if (tx.lessonId) e.currentTarget.style.borderColor = houseTheme.secondaryColor; }}
                      onMouseLeave={(e) => { if (tx.lessonId) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <span
                          style={{
                            background: isPositive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPositive ? '#2ec4b6' : '#ef4444',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-heading)',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '4px'
                          }}
                        >
                          {points > 0 ? '+' : ''}{points}
                        </span>
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem' }}>
                            {tx.source || sourceLabel}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                            {recipient} • {sourceLabel}{actor ? ` • ${actor}` : ''}{tx.date ? ` • ${tx.date}` : ''}
                          </div>
                        </div>
                      </div>

                      {tx.lessonId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: houseTheme.secondaryColor, fontSize: '0.78rem', fontWeight: 600 }}>
                          <span>Zobacz Dziennik</span>
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {hiddenPointTransactionsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPointTransactions(current => !current)}
                    aria-expanded={showAllPointTransactions}
                    style={{
                      alignSelf: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      marginTop: '0.35rem',
                      padding: '0.65rem 1.1rem',
                      border: `1px solid ${houseTheme.secondaryColor}`,
                      borderRadius: '6px',
                      background: 'rgba(15, 20, 30, 0.85)',
                      color: houseTheme.secondaryColor,
                      fontFamily: 'inherit',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {showAllPointTransactions ? (
                      <>
                        Pokaż tylko 10 najnowszych
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Pokaż starsze wpisy ({hiddenPointTransactionsCount})
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                )}
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
