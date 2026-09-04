import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { RunicDuelModal } from './RunicDuelModal';
import { AccountsRosterBlock } from './AccountsRosterBlock';
import { SidebarPanelBanner } from './SidebarPanelBanner';
import {
  Calendar,
  Compass,
  Crown,
  Trophy,
  Dices,
  Mail,
  ChevronRight,
  Flame,
  Award,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Sun,
  Moon,
  Zap,
  Wind,
  ShoppingBag,
  Coins,
  Building,
  Scroll,
  Swords,
  BookOpen,
  Send,
  Shield,
  ClipboardList
} from 'lucide-react';

export const PortalRightSidebar = ({
  auroraEnabled,
  setAuroraEnabled,
  torchEnabled,
  setTorchEnabled
}) => {
  const {
    setActiveView,
    houses,
    students,
    staffRanking,
    events,
    setActiveHouseTab,
    currentUser,
    studentProfile,
    emails,
    setEmailInboxOpen,
    showNotification
  } = useSchool();

  const [duelModalOpen, setDuelModalOpen] = useState(false);
  const [rankingTab, setRankingTab] = useState('students'); // 'students' | 'staff'
  const [enrollmentData, setEnrollmentData] = useState(null);

  useEffect(() => {
    Promise.all([api.getEnrollmentConfig(), api.getEnrollmentStats()]).then(([cfgR, statsR]) => {
      if (cfgR.ok && statsR.ok) {
        setEnrollmentData({ config: cfgR.data, stats: statsR.data });
      }
    }).catch(() => {});
  }, []);

  const {
    soundEnabled,
    setSoundEnabled,
    ambientTrack,
    setAmbientTrack,
    ambientVolume,
    setAmbientVolume,
    playWandSwoosh,
    playRuneChime
  } = useSound();

  const handleNav = (view, houseTab = null) => {
    playWandSwoosh();
    if (houseTab) setActiveHouseTab(houseTab);
    setActiveView(view);
  };

  return (
    <aside id="menuContainerRight">
      {/* =========================================================================
          0. BLOK: AURA & PEJZAŻ DŹWIĘKOWY CYTADELI (ATMOSPHERE & AUDIO CONTROL)
          ========================================================================= */}
      <div className="menuBlock" style={{ border: '1px solid var(--gold-ancient)' }}>
        <SidebarPanelBanner graphicId="atmosphere" icon={Sparkles} rune="ᛋ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᛞ</span>
          <span>Aura & Atmosfera</span>
          <span className="rune-bracket">ᛞ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {/* Audio Master Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Volume2 size={14} color="var(--gold-ancient)" /> Dźwięki Magii:
              </span>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playRuneChime();
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  border: soundEnabled ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                  background: soundEnabled ? 'rgba(197, 159, 78, 0.2)' : 'rgba(0,0,0,0.5)',
                  color: soundEnabled ? '#ffe599' : '#6b7280',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {soundEnabled ? 'WŁĄCZONE' : 'WYCISZONE'}
              </button>
            </div>

            {/* Ambient Soundscape Selector */}
            <div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Pejzaż Dźwiękowy Tła (ASMR):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                {[
                  { id: 'none', label: 'Brak' },
                  { id: 'wind', label: '🌬️ Wiatr' },
                  { id: 'hearth', label: '🔥 Kominek' },
                  { id: 'library', label: '🔮 Biblioteka' }
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      if (!soundEnabled) setSoundEnabled(true);
                      setAmbientTrack(track.id);
                    }}
                    style={{
                      padding: '0.35rem 0.4rem',
                      borderRadius: '4px',
                      border: ambientTrack === track.id ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                      background: ambientTrack === track.id ? 'rgba(197, 159, 78, 0.25)' : 'rgba(8, 12, 18, 0.6)',
                      color: ambientTrack === track.id ? '#ffe599' : '#9ca3af',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {track.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Toggles: Aurora & Lumos Torch */}
            <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
              <button
                onClick={() => setAuroraEnabled && setAuroraEnabled(!auroraEnabled)}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  borderRadius: '4px',
                  border: auroraEnabled ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: auroraEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.4)',
                  color: auroraEnabled ? '#93c5fd' : '#6b7280',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🌌 Zorza Polarna
              </button>

              <button
                onClick={() => setTorchEnabled && setTorchEnabled(!torchEnabled)}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  borderRadius: '4px',
                  border: torchEnabled ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                  background: torchEnabled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.4)',
                  color: torchEnabled ? '#fcd34d' : '#6b7280',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🕯️ Kursor Lumos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. BLOK: WYDARZENIA
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="events" icon={Calendar} rune="ᛃ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Wydarzenia</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', background: 'rgba(8, 12, 18, 0.8)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(164, 200, 225, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                <span>10 Października</span>
                <span style={{ color: 'var(--ice-crystal)' }}>14:00</span>
              </div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>
                Turniej Żelaznego Pazura
              </div>
              <div style={{ color: '#8c95a6', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                — Arena Lodowego Kręgu —
              </div>
            </div>

            <div style={{ padding: '0.65rem', background: 'rgba(8, 12, 18, 0.8)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(164, 200, 225, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                <span>21 Grudnia</span>
                <span style={{ color: 'var(--ice-crystal)' }}>20:00</span>
              </div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>
                Święto Przesilenia (Yule-Blót)
              </div>
              <div style={{ color: '#8c95a6', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                — Wielka Sala Hrafnhöll —
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1.5. BLOK: KANCELARIA ZAPISÓW
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="enrollments" icon={ClipboardList} rune="ᛜ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᛞ</span>
          <span>Kancelaria Zapisów</span>
          <span className="rune-bracket">ᛞ</span>
        </div>

        <div className="menuBlockContent">
          {enrollmentData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.7rem',
                borderRadius: 5,
                border: `1px solid ${enrollmentData.config.enrollmentOpen ? '#4ade8055' : '#ef444455'}`,
                background: enrollmentData.config.enrollmentOpen ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)'
              }}>
                <span style={{ fontSize: '0.65rem', width: 8, height: 8, borderRadius: '50%', background: enrollmentData.config.enrollmentOpen ? '#4ade80' : '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: enrollmentData.config.enrollmentOpen ? '#4ade80' : '#f87171', letterSpacing: '0.05em' }}>
                  {enrollmentData.config.enrollmentOpen ? 'ZAPISY OTWARTE' : 'ZAPISY ZAMKNIĘTE'}
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem' }}>
                {[
                  { label: 'Uczniów', value: enrollmentData.stats.studentsEnrolled, sub: `+${enrollmentData.stats.studentsPending} ocz.`, color: '#e5e7eb' },
                  { label: 'Profesorów', value: enrollmentData.stats.professorsEnrolled, sub: `${enrollmentData.stats.professorsPending} podań`, color: '#e5e7eb' }
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(8,12,18,0.7)', border: '1px solid rgba(197,159,78,0.15)', borderRadius: 4, padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: '#9ca3af', marginTop: '0.15rem' }}>{s.label}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Link */}
              <button
                onClick={() => handleNav('enrollment-chamber')}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: 'rgba(197,159,78,0.08)',
                  border: '1px solid rgba(197,159,78,0.25)',
                  borderRadius: 4,
                  color: 'var(--gold-ancient)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.05em'
                }}
              >
                ✦ Przejdź do Kancelarii Zapisów
              </button>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>Ładowanie...</div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. BLOK: SALE & KOMNATY
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="locations" icon={Compass} rune="ᛏ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚲ</span>
          <span>Sale & Komnaty</span>
          <span className="rune-bracket">ᚲ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
            <button
              onClick={() => handleNav('map')}
              className="btn-durmstrang"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              👑 Wielka Sala Hrafnhöll
            </button>
          </div>
          <hr />
          <ul>
            <li>
              <button onClick={() => handleNav('map')}>
                <span>⚔️ Arena Lodowego Kręgu</span>
                <span style={{ fontSize: '0.7rem', color: '#2ec4b6' }}>● Aktywna</span>
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('map')}>
                <span>📚 Zakazana Biblioteka</span>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Cisza</span>
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('map')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Flame size={13} color="#7a6ea0" /> Krypta Siedmiu Kręgów
                </span>
                <span style={{ fontSize: '0.7rem', color: '#7a6ea0' }}>Rytuał</span>
              </button>
            </li>
          </ul>

          <hr />
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ice-frost)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Dormitoria Zakonów:
          </div>
          <ul>
            <li>
              <button onClick={() => handleNav('houses', 'reinhall')} style={{ color: '#c59f4e' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Crown size={13} color="#c59f4e" /> Sala Skandzy (Renifer)
                </span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'bjornhall')} style={{ color: '#ff9e9e' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Shield size={13} color="#c02b2b" /> Bastion Żelaza (Niedźwiedź)
                </span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'ravnheim')} style={{ color: '#d8c2ff' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Eye size={13} color="#a77de0" /> Wieża Szeptów (Kruk)
                </span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'otergard')} style={{ color: '#8cefe6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={13} color="#2ec4b6" /> Ogrody Cieplic (Wydra)
                </span>
                <ChevronRight size={13} />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          3. BLOK: WŁADZE CYTADELI
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="authorities" icon={Crown} rune="ᛖ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᛉ</span>
          <span>Władze Twierdzy (TMD)</span>
          <span className="rune-bracket">ᛉ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Arcymistrzyni</div>
                <strong style={{ color: 'var(--gold-glow)' }}>Constantine Aguilera</strong>
              </div>
              <Crown size={15} color="var(--gold-ancient)" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Arcymistrz</div>
                <strong style={{ color: 'var(--gold-glow)' }}>Ezra Camhi</strong>
              </div>
              <Crown size={15} color="var(--gold-ancient)" />
            </div>
          </div>
          <hr />
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
            Kruk dyrekcji: <span style={{ color: 'var(--ice-frost)' }}>dyrekcja@durmstrang.magic</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3.5. BLOK: SPIS KONT & ZAKONY (REJESTR ADEPTÓW I MISTRZÓW)
          ========================================================================= */}
      <AccountsRosterBlock />

      {/* =========================================================================
          4. BLOK: TABLICA SŁAWY & RANKING (ADEPTOWIE ORAZ NAUCZYCIELE & DYREKCJA)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="ranking" icon={Trophy} rune="ᚠ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚠ</span>
          <span>{rankingTab === 'staff' ? 'Kadra & Dyrekcja' : 'Ranking Adeptów'}</span>
          <span className="rune-bracket">ᚠ</span>
        </div>

        <div className="menuBlockContent">
          {/* Sub-tabs: Adeptowie vs Nauczyciele & Dyrekcja */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                playWandSwoosh();
                setRankingTab('students');
              }}
              style={{
                padding: '0.35rem 0.25rem',
                borderRadius: '4px',
                border: rankingTab === 'students' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                background: rankingTab === 'students' ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(138, 107, 43, 0.2) 100%)' : 'rgba(8, 12, 18, 0.6)',
                color: rankingTab === 'students' ? '#ffe599' : '#9ca3af',
                fontSize: '0.71rem',
                fontWeight: rankingTab === 'students' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <span>🧙‍♂️</span>
              <span>Adeptowie</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playWandSwoosh();
                setRankingTab('staff');
              }}
              style={{
                padding: '0.35rem 0.25rem',
                borderRadius: '4px',
                border: rankingTab === 'staff' ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                background: rankingTab === 'staff' ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.3) 0%, rgba(138, 107, 43, 0.2) 100%)' : 'rgba(8, 12, 18, 0.6)',
                color: rankingTab === 'staff' ? '#ffe599' : '#9ca3af',
                fontSize: '0.71rem',
                fontWeight: rankingTab === 'staff' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <span>👑</span>
              <span>Kadra & Dyrekcja</span>
            </button>
          </div>

          {/* Tab 1: Adeptowie (Uczniowie) */}
          {rankingTab === 'students' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {(!students || students.length === 0) && (
                  <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.78rem', padding: '0.75rem 0' }}>
                    Brak adeptów w rankingu
                  </div>
                )}
                {(students || []).slice(0, 5).map((stud, idx) => {
                  const h = houses[stud.house] || Object.values(houses).find(x => x.id === stud.house);
                  const rankLabels = ['I', 'II', 'III', 'IV', 'V'];
                  const fullName = stud.fullName || `${stud.name} ${stud.surname || ''}`.trim() || stud.name;
                  const numericPoints = Number(stud.points);
                  const recoveredPoints = typeof stud.points === 'string' ? Number.parseFloat(stud.points) : 0;
                  const displayPoints = Number.isFinite(numericPoints)
                    ? numericPoints
                    : (Number.isFinite(recoveredPoints) ? recoveredPoints : 0);

                  return (
                    <div
                      key={stud.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.55rem',
                        background: idx === 0 ? 'rgba(164, 200, 225, 0.12)' : 'rgba(8, 12, 18, 0.6)',
                        borderRadius: 'var(--radius-sm)',
                        border: idx === 0 ? '1px solid rgba(164, 200, 225, 0.35)' : '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.82rem',
                        gap: '0.45rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '18px', flexShrink: 0, color: idx === 0 ? 'var(--gold-ancient)' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#6b7280', fontFamily: 'var(--font-heading)' }}>
                          {rankLabels[idx] || `${idx + 1}.`}
                        </span>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div
                            title={fullName}
                            style={{
                              color: h ? h.colors?.secondary : '#ffffff',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.82rem'
                            }}
                          >
                            {fullName}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#8c95a6', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {h ? h.name : 'Zakon'} • {stud.classYear || 'Adept'}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--gold-glow)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, textAlign: 'right' }}>
                        {displayPoints} pkt
                      </span>
                    </div>
                  );
                })}
              </div>
              <hr />
              <button
                onClick={() => handleNav('houses')}
                className="btn-durmstrang-secondary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
              >
                Pełny Puchar Zakonów &gt;&gt;
              </button>
            </>
          )}

          {/* Tab 2: Nauczyciele & Dyrekcja */}
          {rankingTab === 'staff' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {(staffRanking || []).slice(0, 5).map((staff, idx) => {
                  const isDirector = staff.role === 'admin' || staff.role === 'headmaster';
                  const h = staff.house ? (houses[staff.house] || Object.values(houses).find(x => x.id === staff.house)) : null;
                  const rankLabels = ['I', 'II', 'III', 'IV', 'V'];
                  const fullName = staff.fullName || `${staff.name} ${staff.surname || ''}`.trim() || staff.name;

                  return (
                    <div
                      key={staff.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.55rem',
                        background: isDirector
                          ? 'linear-gradient(135deg, rgba(197, 159, 78, 0.18) 0%, rgba(15, 20, 30, 0.7) 100%)'
                          : idx === 0
                          ? 'rgba(164, 200, 225, 0.12)'
                          : 'rgba(8, 12, 18, 0.6)',
                        borderRadius: 'var(--radius-sm)',
                        border: isDirector
                          ? '1px solid rgba(197, 159, 78, 0.4)'
                          : idx === 0
                          ? '1px solid rgba(164, 200, 225, 0.35)'
                          : '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.82rem',
                        gap: '0.45rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '18px', flexShrink: 0, color: isDirector ? 'var(--gold-glow)' : idx === 0 ? 'var(--gold-ancient)' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#6b7280', fontFamily: 'var(--font-heading)' }}>
                          {rankLabels[idx] || `${idx + 1}.`}
                        </span>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div
                            title={fullName}
                            style={{
                              color: isDirector ? 'var(--gold-glow)' : '#a4c8e1',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {isDirector && <Crown size={12} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />}
                            {!isDirector && <BookOpen size={11} color="#a4c8e1" style={{ flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</span>
                          </div>
                          <div style={{ fontSize: '0.66rem', color: isDirector ? '#e2c56a' : '#93c5fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isDirector ? 'Rada Dyrekcji Cytadeli' : staff.roleLabel || staff.department || 'Katedra Magii • Grono Pedagogiczne'}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--gold-glow)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, textAlign: 'right' }}>
                        {staff.points || 0} pkt
                      </span>
                    </div>
                  );
                })}
              </div>
              <hr />
              <button
                onClick={() => handleNav('academic')}
                className="btn-durmstrang-secondary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
              >
                Katedry & Grono Pedagogiczne &gt;&gt;
              </button>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          5. BLOK: LIGA BOJOWA & HÓLMGANGA (DUELS)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="duels" icon={Swords} rune="ᛏ" accent="duel" />

        <div className="menuBlockTitle menuBlockTitle--accent-crimson">
          <span className="rune-bracket">ᚦ</span>
          <span>Liga Bojowa Hólmganga</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
            Pojedynki czarodziejów na skutych lodem pylonach. Zdobywaj sławę, chwałę i punkty dla swojego Zakonu!
          </p>

          <button
            onClick={() => {
              playWandSwoosh();
              if (!currentUser) {
                showNotification('Wymagane Logowanie', 'Zaloguj się, aby stanąć do pojedynku.', 'warning');
                return;
              }
              setDuelModalOpen(true);
            }}
            className="btn-durmstrang"
            style={{
              width: '100%',
              padding: '0.45rem',
              fontSize: '0.8rem',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(153, 27, 27, 0.5) 100%)',
              border: '1px solid #ef4444',
              color: '#fecaca',
              gap: '0.4rem'
            }}
          >
            <Swords size={13} color="#f87171" />
            <span>Wejdź na Arenę Bojową ⚔️</span>
          </button>
        </div>
      </div>



      {/* =========================================================================
          8. BLOK: KRONIKI & BESTIARIUSZ (LORE & ARCHIVE)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="lore" icon={Scroll} rune="ᚦ" />

        <div className="menuBlockTitle" style={{ color: '#a4c8e1' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Kroniki & Bestiariusz</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
            Księga Dziejów Twierdzy, 4 Pradawne Zakony, Bestie Morza Północnego i Kodeks Honorowy.
          </p>

          <button
            onClick={() => handleNav('lore')}
            className="btn-durmstrang-secondary"
            style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Scroll size={13} />
            <span>Archiwum Wiedzy Twierdzy →</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          9. BLOK: POCZTA KRUKÓW (RAVEN POST)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="raven" icon={Mail} rune="ᚱ" />

        <div className="menuBlockTitle" style={{ color: '#d8b4fe' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Poczta Kruków</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '4px', padding: '0.4rem 0.6rem', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#e9d5ff' }}>Skrzynka Krucza:</span>
            <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>
              {(emails || []).filter(e => !e.read).length} nowych listów
            </span>
          </div>

          <button
            onClick={() => {
              if (currentUser) {
                setEmailInboxOpen ? setEmailInboxOpen(true) : handleNav('raven-post');
              } else {
                handleNav('raven-post');
              }
            }}
            className="btn-durmstrang"
            style={{
              width: '100%',
              padding: '0.45rem',
              fontSize: '0.8rem',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(88, 28, 135, 0.45) 100%)',
              border: '1px solid #a855f7',
              color: '#f3e8ff',
              gap: '0.4rem'
            }}
          >
            <Send size={13} />
            <span>Napisz List Krukiem ✉️</span>
          </button>
        </div>
      </div>

      {/* Runic Duel Modal */}
      <RunicDuelModal isOpen={duelModalOpen} onClose={() => setDuelModalOpen(false)} />
    </aside>
  );
};
