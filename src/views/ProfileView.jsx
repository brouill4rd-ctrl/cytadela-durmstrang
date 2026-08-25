import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import { StudentPassportModal } from '../components/StudentPassportModal';
import { ProfileEditorModal } from '../components/ProfileEditorModal';
import { GrimoireBook } from '../components/GrimoireBook';
import { RuneCalligraphyModal } from '../components/RuneCalligraphyModal';
import { RunicDuelModal } from '../components/RunicDuelModal';
import { OracleModal } from '../components/OracleModal';
import { ExpeditionsModal } from '../components/ExpeditionsModal';
import { TargetPracticeModal } from '../components/TargetPracticeModal';
import { DungeonEscapeModal } from '../components/DungeonEscapeModal';
import { HnefataflModal } from '../components/HnefataflModal';
import { IceFishingModal } from '../components/IceFishingModal';
import { BestiaryModal } from '../components/BestiaryModal';
import { BlackMarketModal } from '../components/BlackMarketModal';
import { TournamentGauntletModal } from '../components/TournamentGauntletModal';
import { DiscordVerificationModal } from '../components/DiscordVerificationModal';
import { RUNIC_ACHIEVEMENTS } from '../data/ancientRunesData';
import {
  User,
  Shield,
  Award,
  Sparkles,
  Wand2,
  BookOpen,
  Feather,
  Coins,
  Package,
  Layers,
  CheckCircle,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
  Download,
  Zap,
  Swords,
  Eye,
  Compass,
  Crosshair,
  Key,
  Crown,
  Anchor,
  Skull,
  Edit3,
  ScrollText
} from 'lucide-react';

export const ProfileView = () => {
  const {
    currentUser,
    studentProfile,
    houses,
    pointLedger,
    lessons,
    setActiveLessonId,
    setActiveView,
    updateCurrentUser,
    showNotification,
    navigateToExamResult,
    navigateToExams,
    navigateToMemoryPerson,
    navigateToMemory
  } = useSchool();

  const [studentExams, setStudentExams] = useState([]);
  const [memoryDossier, setMemoryDossier] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(false);

  const { playWandSwoosh, playRuneChime } = useSound();

  const activeUser = currentUser || studentProfile || {
    id: 1,
    fullName: 'Nowicjusz Północy',
    role: 'student',
    house: 'renifer',
    level: 1,
    points: 0,
    currency: 50,
    xp: 120,
    nextLevelXp: 1000
  };

  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'inventory' | 'grades' | 'lessons' | 'auras'
  const [activeAura, setActiveAura] = useState('frost'); // 'none' | 'frost' | 'flame' | 'shadow' | 'gold'

  // Modals state
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [runeCalligraphyOpen, setRuneCalligraphyOpen] = useState(false);
  const [duelOpen, setDuelOpen] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [expeditionsOpen, setExpeditionsOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [hnefataflOpen, setHnefataflOpen] = useState(false);
  const [fishingOpen, setFishingOpen] = useState(false);
  const [bestiaryOpen, setBestiaryOpen] = useState(false);
  const [blackMarketOpen, setBlackMarketOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [discordModalOpen, setDiscordModalOpen] = useState(false);

  const house = activeUser.house ? houses[activeUser.house] : null;
  const xpPercentage = Math.min(100, Math.round(((activeUser.xp || 0) / (activeUser.nextLevelXp || 1000)) * 100));

  // Gender label helper
  const genderLabel = activeUser.gender === 'czarownica' ? 'Czarownica Północy' : activeUser.gender === 'mistyk' ? 'Mistyk Północy' : 'Czarodziej Północy';

  // Find user's lesson point transactions
  const userLessonTransactions = (pointLedger || []).filter(tx =>
    (tx.studentId === activeUser.id || tx.studentName?.toLowerCase() === activeUser.fullName?.toLowerCase()) && !tx.isRevoked
  );

  const totalLessonPoints = userLessonTransactions.reduce((s, tx) => s + tx.points, 0);

  // Group by department / subject
  const subjectPointsMap = {};
  userLessonTransactions.forEach(tx => {
    const subjName = tx.source.split('—')[0]?.trim() || tx.source;
    subjectPointsMap[subjName] = (subjectPointsMap[subjName] || 0) + tx.points;
  });

  const handleOpenLesson = (lessonId) => {
    if (lessonId) {
      setActiveLessonId(lessonId);
      setActiveView('lesson-detail');
    }
  };

  useEffect(() => {
    (async () => {
      const res = await api.getStudentExamHistory();
      if (res.ok && res.data) setStudentExams(res.data);
    })();
  }, [activeTab]);

  const aurasConfig = {
    none: { name: 'Brak Aury', glow: 'none', border: 'var(--gold-ancient)' },
    frost: { name: 'Aura Lodowego Wichru', glow: '0 0 25px rgba(56, 189, 248, 0.7)', border: '#38bdf8' },
    flame: { name: 'Płomień Berserka', glow: '0 0 25px rgba(239, 68, 68, 0.7)', border: '#ef4444' },
    shadow: { name: 'Cień Ravnheimu', glow: '0 0 25px rgba(168, 85, 247, 0.7)', border: '#a855f7' },
    gold: { name: 'Złoty Blask Założycieli', glow: '0 0 25px rgba(250, 204, 21, 0.8)', border: '#facc15' }
  };

  const currentAura = aurasConfig[activeAura] || aurasConfig.frost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Dossier Header */}
      <div
        className="gothic-card runic-corners"
        style={{
          padding: '2.5rem',
          background: `radial-gradient(circle at 80% 20%, ${house ? house.colors.bgDark : 'rgba(25, 32, 45, 0.9)'} 0%, rgba(10, 13, 18, 0.98) 75%)`,
          border: `2px solid ${currentAura.border}`,
          boxShadow: `0 20px 50px rgba(0,0,0,0.95), ${currentAura.glow}`,
          transition: 'all 0.4s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          {/* Avatar & Core Identity with Cosmic Aura */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', flexWrap: 'wrap' }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => { playWandSwoosh(); setProfileEditorOpen(true); }}
              title="Kliknij, aby zmienić awatar, płeć i dane profilu"
            >
              <img
                src={activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                alt={activeUser.fullName}
                style={{
                  width: '105px',
                  height: '105px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${currentAura.border}`,
                  boxShadow: `0 0 25px rgba(0,0,0,0.8), ${currentAura.glow}`,
                  transition: 'all 0.3s ease'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <Edit3 size={24} color="#ffffff" />
              </div>

              {house && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: house.colors.primary,
                    border: `1px solid ${house.colors.secondary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  {house.crestIcon}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: house ? house.colors.secondary : 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {house ? house.name : activeUser.role === 'admin' ? 'Rada Dyrekcji' : activeUser.role === 'professor' ? (activeUser.departmentName || 'Katedra Magii') : 'Adept Nowicjusz'} • {activeUser.classYear || 'Kadra Durmstrang'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {genderLabel}
                </span>
              </div>

              <h1 style={{ fontSize: '2.2rem', color: '#ffffff', lineHeight: 1.1, marginTop: '0.2rem' }}>
                {activeUser.fullName}
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#a0aec0', marginTop: '0.3rem' }}>
                {activeUser.title || (activeUser.role === 'admin' ? 'Arcymistrzyni Twierdzy (TMD)' : 'Adept')} • {activeUser.origin || activeUser.office || 'Twierdza Magii Durmstrang (TMD)'}
              </div>
              <div style={{ fontSize: '0.78rem', color: currentAura.border, fontWeight: 700, marginTop: '0.3rem' }}>
                ✨ {currentAura.name}
              </div>
            </div>
          </div>

          {/* Quick Metrics (Level, Points, Coins) */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.8rem 1.4rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>{activeUser.role === 'student' ? 'Poziom' : 'Rola'}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                {activeUser.role === 'student' ? `Krąg ${activeUser.level || 1}` : activeUser.role === 'professor' ? 'Profesor' : 'Arcymistrz'}
              </div>
            </div>

            <div style={{ padding: '0.8rem 1.4rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Punkty</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                {activeUser.points || 0}
              </div>
            </div>

            <div style={{ padding: '0.8rem 1.4rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Skirniry</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#f7dca0' }}>
                {activeUser.currency || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launch Suite of Activities + EDIT PROFILE BUTTON */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              playWandSwoosh();
              setProfileEditorOpen(true);
            }}
            className="btn-durmstrang"
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)',
              color: '#06090e',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(197, 159, 78, 0.35)'
            }}
          >
            <Edit3 size={14} /> Edytuj Profil & Awatar
          </button>

          {/* DISCORD VERIFICATION QUICK BUTTON */}
          <button
            onClick={() => {
              playWandSwoosh();
              setDiscordModalOpen(true);
            }}
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.82rem',
              background: activeUser.discordId ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, rgba(88, 101, 242, 0.35) 0%, rgba(59, 71, 196, 0.4) 100%)',
              border: activeUser.discordId ? '1px solid #10b981' : '1px solid #5865F2',
              color: activeUser.discordId ? '#6ee7b7' : '#e0e7ff',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              boxShadow: activeUser.discordId ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(88, 101, 242, 0.3)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {activeUser.discordId ? '✨ Discord Połączony' : '⚡ Połącz Discord (Kodem)'}
          </button>

          <button
            onClick={() => {
              playRuneChime();
              setPassportOpen(true);
            }}
            className="btn-durmstrang"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
          >
            <Download size={13} /> Paszport (PNG)
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setGrimoireOpen(true);
            }}
            style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', color: '#ffe599', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
          >
            <BookOpen size={13} color="var(--gold-ancient)" /> Grimuar Zaklęć
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setRuneCalligraphyOpen(true);
            }}
            style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fde68a', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <span style={{ color: '#f59e0b', fontSize: '0.95rem' }}>ᚠ</span> Kaligrafia Run
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setOracleOpen(true);
            }}
            style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', color: '#ffe599', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Eye size={13} /> Wyrocznia
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setExpeditionsOpen(true);
            }}
            style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#4ade80', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Compass size={13} /> Ekspedycje
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setTargetOpen(true);
            }}
            style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Crosshair size={13} /> Strzelnica
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setEscapeOpen(true);
            }}
            style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fcd34d', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Key size={13} /> Labirynt Zagadek
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setHnefataflOpen(true);
            }}
            style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', color: '#c084fc', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Crown size={13} /> Hnefatafl
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setFishingOpen(true);
            }}
            style={{ background: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', color: '#38bdf8', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Anchor size={13} /> Połów
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setTournamentOpen(true);
            }}
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Swords size={13} /> Turniej Mistrza
          </button>

          <button
            onClick={() => {
              playWandSwoosh();
              setBlackMarketOpen(true);
            }}
            style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #c084fc', color: '#e9d5ff', padding: '0.5rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Skull size={13} /> Czarny Rynek
          </button>
        </div>

        {/* XP Progress Bar */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
            <span>Doświadczenie Magiczne (XP)</span>
            <span><strong>{activeUser.xp || 0}</strong> / {activeUser.nextLevelXp || 1000} XP ({xpPercentage}%)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div
              style={{
                width: `${xpPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #c59f4e 0%, #e6c875 100%)',
                boxShadow: '0 0 10px rgba(197, 159, 78, 0.5)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Dossier, Lessons, Inventory, Aury & Tytuły) */}
      <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('dossier');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'dossier' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'dossier' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'dossier' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} /> Metryka & Osobliwości
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('auras');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'auras' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: activeTab === 'auras' ? '1px solid #f59e0b' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'auras' ? '#fcd34d' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} color="#f59e0b" /> Aury & Tytuły Runiczne
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('lessons');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'lessons' ? 'rgba(46, 196, 182, 0.18)' : 'rgba(46, 196, 182, 0.06)',
            border: activeTab === 'lessons' ? '1px solid #2ec4b6' : '1px solid rgba(46, 196, 182, 0.2)',
            borderRadius: '4px',
            color: activeTab === 'lessons' ? '#2ec4b6' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <BookOpen size={16} color="#2ec4b6" /> Dziennik Lekcji ({userLessonTransactions.length})
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('exams');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'exams' ? 'rgba(197, 159, 78, 0.22)' : 'transparent',
            border: activeTab === 'exams' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'exams' ? '#ffffff' : '#f7dca0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Award size={16} color="var(--gold-ancient)" /> Egzaminy ({studentExams.length})
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('inventory');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'inventory' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
            border: activeTab === 'inventory' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
            borderRadius: '4px',
            color: activeTab === 'inventory' ? '#ffffff' : '#9ca3af',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Package size={16} /> Ekwipunek
        </button>

        <button
          onClick={() => {
            playWandSwoosh();
            setActiveTab('discord');
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'discord' ? 'rgba(88, 101, 242, 0.22)' : 'rgba(88, 101, 242, 0.08)',
            border: activeTab === 'discord' ? '1px solid #5865F2' : '1px solid rgba(88, 101, 242, 0.25)',
            borderRadius: '4px',
            color: activeTab === 'discord' ? '#c7d2fe' : '#94a3b8',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Discord & Role {activeUser.discordId && '✓'}
        </button>

        <button
          onClick={async () => {
            playWandSwoosh();
            setActiveTab('memory');
            setLoadingMemory(true);
            const ident = activeUser.characterName || activeUser.fullName || activeUser.id;
            const res = await api.getMemoryPerson(ident);
            if (res.ok && res.data) {
              setMemoryDossier(res.data);
            }
            setLoadingMemory(false);
          }}
          style={{
            padding: '0.65rem 1.4rem',
            background: activeTab === 'memory' ? 'rgba(197, 159, 78, 0.25)' : 'rgba(197, 159, 78, 0.08)',
            border: activeTab === 'memory' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.2)',
            borderRadius: '4px',
            color: activeTab === 'memory' ? '#ffffff' : '#f7dca0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🏛️</span> Izba Pamięci / Moja Historia
        </button>
      </div>

      {/* 1. DOSSIER TAB CONTENT */}
      {activeTab === 'dossier' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Row: Identity & Wand Cards */}
          <div className="grid-2">
            {/* Identity & Heritage */}
            <div className="gothic-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--gold-ancient)" /> Tożsamość & Płeć Magiczna
                </h3>
                <button
                  onClick={() => { playWandSwoosh(); setProfileEditorOpen(true); }}
                  style={{
                    background: 'rgba(197, 159, 78, 0.15)',
                    border: '1px solid var(--gold-ancient)',
                    color: 'var(--gold-glow)',
                    borderRadius: '4px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600
                  }}
                >
                  <Edit3 size={12} /> Zmień
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Płeć / Archetyp Postaci:</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {genderLabel}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Godność Honorowa & Tytuł:</span>
                  <div style={{ color: 'var(--gold-glow)', fontWeight: 600, marginTop: '0.2rem' }}>
                    {activeUser.title || (activeUser.role === 'admin' ? 'Arcymistrzyni Twierdzy (TMD)' : 'Adept Północy')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Kraj Pochodzenia / Ród:</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {activeUser.origin || 'Skandynawia (Norwegia)'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Siedziba / Dom / Katedra:</span>
                  <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '0.2rem' }}>
                    {house ? `Zakon ${house.name}` : activeUser.role === 'admin' ? (activeUser.office || 'Komnaty Najwyższej Wieży') : (activeUser.departmentName || 'Twierdza Magii Durmstrang (TMD)')}
                  </div>
                </div>
              </div>
            </div>

            {/* Wand & Relics */}
            <div className="gothic-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wand2 size={18} color="var(--gold-ancient)" /> Różdżka & Magiczne Insygnia
                </h3>
                <button
                  onClick={() => { playWandSwoosh(); setProfileEditorOpen(true); }}
                  style={{
                    background: 'rgba(197, 159, 78, 0.15)',
                    border: '1px solid var(--gold-ancient)',
                    color: 'var(--gold-glow)',
                    borderRadius: '4px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600
                  }}
                >
                  <Edit3 size={12} /> Zmień
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Rdzeń i Drewno Różdżki:</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {activeUser.wand || '12½ cala, Czarny Dąb ze Skandów, Włókno ze Skrzydła Smoka Lodowego'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Chowaniec / Towarzysz:</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {activeUser.companion || activeUser.pet || 'Biały Wilk Północny (Ulfr)'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Patronus / Totem Astralny:</span>
                  <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
                    {activeUser.patronus || 'Niedźwiedź Polarny'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Appearance & Backstory */}
          <div className="grid-2">
            {/* Appearance */}
            <div className="gothic-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={17} color="var(--gold-ancient)" /> Wygląd Zewnętrzny & Znaki Szczególne
                </h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid var(--gold-ancient)' }}>
                „{activeUser.appearance || 'Wysoki adept w szacie podbitej wilczym futrem ze srebrną klamrą, o przenikliwym spojrzeniu i runicznym sygnecie na dłoni.'}”
              </p>
            </div>

            {/* Backstory */}
            <div className="gothic-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={17} color="var(--gold-ancient)" /> Kronika Żywota & Historia Postaci
                </h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                {activeUser.backstory || 'Pochodzi z prastarego rodu z północnych krańców Skandynawii. Wezwany przez starożytne runy, przekroczył mgliste wrota Durmstrangu, by zgłębiać arkana magii żywiołów i runicznego kunsztu.'}
              </p>
            </div>
          </div>

          {/* Points by Subject Summary */}
          <div className="gothic-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--gold-ancient)" /> Punkty z Katedr Magii
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {Object.keys(subjectPointsMap).length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Brak punktów przypisanych do przedmiotów.</div>
              ) : (
                Object.entries(subjectPointsMap).map(([subj, pts]) => (
                  <div key={subj} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: '#d1d5db', fontSize: '0.88rem' }}>{subj}</span>
                    <span style={{ color: '#2ec4b6', fontWeight: 700, fontSize: '0.9rem' }}>+{pts} pkt</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. AURAS TAB CONTENT */}
      {activeTab === 'auras' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="gothic-card" style={{ padding: '1.8rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--gold-ancient)" /> Wybierz Swoją Runiczną Aurę Wizualną
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Aura manifestuje Twoją energię magiczną wokół portretu, profilu i osiągnięć w całej Twierdzy Magii Durmstrang (TMD):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {Object.entries(aurasConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    playRuneChime();
                    setActiveAura(key);
                  }}
                  style={{
                    background: activeAura === key ? 'rgba(15, 25, 35, 0.9)' : 'rgba(10, 14, 20, 0.6)',
                    border: activeAura === key ? `2px solid ${cfg.border}` : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '1.2rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: activeAura === key ? cfg.glow : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ color: cfg.border, fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                    {cfg.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                    {activeAura === key ? '● Aktualnie Założona' : 'Kliknij, aby aktywować'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Honorary Titles & Achievements Section */}
          <div className="gothic-card" style={{ padding: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--gold-ancient)" /> Tytuły Honorowe & Osiągnięcia Kaligrafii Run
              </h3>
              <button
                onClick={() => { playWandSwoosh(); setRuneCalligraphyOpen(true); }}
                style={{
                  background: 'rgba(197, 159, 78, 0.15)',
                  border: '1px solid var(--gold-ancient)',
                  color: 'var(--gold-glow)',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ᚠ Akademia Run & Alfabetów
              </button>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Zdobyte tytuły możesz nosić jako swoją oficjalną godność honorową w całej Twierdzy Durmstrang:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
              {RUNIC_ACHIEVEMENTS.map(ach => {
                let unlockedAchs = [];
                try {
                  unlockedAchs = JSON.parse(localStorage.getItem('durmstrang_runic_achievements') || '[]');
                } catch (_) {}
                const isUnlocked = unlockedAchs.includes(ach.id);
                const isEquipped = activeUser.title === ach.rewardTitle;

                return (
                  <div
                    key={ach.id}
                    style={{
                      background: isEquipped ? 'rgba(197, 159, 78, 0.15)' : isUnlocked ? 'rgba(15, 22, 32, 0.8)' : 'rgba(10, 14, 20, 0.5)',
                      border: isEquipped ? '2px solid var(--gold-ancient)' : isUnlocked ? '1px solid rgba(197, 159, 78, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.8rem',
                      opacity: isUnlocked ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ fontSize: '1.6rem' }}>{ach.icon}</div>
                      <div>
                        <div style={{ color: isUnlocked ? '#ffffff' : '#9ca3af', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>
                          „{ach.rewardTitle}”
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                          {ach.title} {isUnlocked ? '• Odblokowane' : '• Zablokowane'}
                        </div>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          playRuneChime();
                          if (updateCurrentUser) {
                            updateCurrentUser({ title: ach.rewardTitle });
                            if (showNotification) showNotification('Założono Tytuł', `Twój tytuł to teraz: „${ach.rewardTitle}”!`, 'success');
                          }
                        }}
                        style={{
                          background: isEquipped ? 'var(--gold-ancient)' : 'rgba(197, 159, 78, 0.15)',
                          border: '1px solid var(--gold-ancient)',
                          color: isEquipped ? '#000000' : 'var(--gold-glow)',
                          borderRadius: '4px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isEquipped ? 'Założony' : 'Załóż'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>🔒</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. LESSONS TAB CONTENT */}
      {activeTab === 'lessons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(8, 11, 16, 0.85)', border: '1px solid var(--gold-ancient)', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
              Historia Uczestnictwa w Lekcjach
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {userLessonTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => handleOpenLesson(tx.lessonId)}
                  style={{
                    background: 'rgba(15, 20, 30, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '0.9rem 1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: tx.lessonId ? 'pointer' : 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <span style={{ background: 'rgba(46, 196, 182, 0.15)', color: '#2ec4b6', fontWeight: 800, padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
                      +{tx.points}
                    </span>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>{tx.source}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{tx.professorName} • {tx.date}</div>
                    </div>
                  </div>
                  {tx.lessonId && (
                    <span style={{ color: 'var(--gold-ancient)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Szczegóły <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3B. EXAMS TAB CONTENT */}
      {activeTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(8, 11, 16, 0.85)', border: '1px solid var(--gold-ancient)', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                Oficjalna Historia Egzaminów i Zaliczeń
              </h3>
              <button
                className="btn-durmstrang-secondary"
                onClick={() => navigateToExams()}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}>
                Centrum Egzaminacyjne →
              </button>
            </div>

            {studentExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <p>Nie zarejestrowano jeszcze żadnych podejść egzaminacyjnych dla tej postaci.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {studentExams.map(ex => {
                  const isPassing = ex.isPassing;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => ex.resultsPublished && navigateToExamResult(ex.id)}
                      style={{
                        background: 'rgba(15, 20, 30, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '1rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: ex.resultsPublished ? 'pointer' : 'default',
                        borderLeft: `3px solid ${ex.resultsPublished ? (isPassing ? '#eab308' : '#ef4444') : '#a855f7'}`
                      }}
                    >
                      <div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>
                          {ex.subjectName || ex.examTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                          {ex.examTitle} • {ex.sessionName} ({ex.schoolYear})
                        </div>
                      </div>

                      {ex.resultsPublished ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: isPassing ? '#eab308' : '#ef4444', fontWeight: 700 }}>
                            {ex.percentage}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isPassing ? '#eab308' : '#ef4444', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
                            {ex.gradeName || (isPassing ? 'ZALICZONY' : 'NIEZALICZONY')}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#a855f7', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
                          OCZEKUJE NA SPRAWDZENIE
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. INVENTORY TAB CONTENT */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {(activeUser.inventory || []).map((item, index) => (
              <div
                key={item.id || index}
                className="gothic-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.2rem',
                  border: item.rarity === 'legendary' ? '1px solid #d97706' : item.rarity === 'epic' ? '1px solid #9333ea' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ fontSize: '2.4rem' }}>{item.icon || '📦'}</div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: item.rarity === 'legendary' ? '#f59e0b' : item.rarity === 'epic' ? '#c084fc' : '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>
                    {item.rarity || 'Artefakt'}
                  </span>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: '0.2rem 0' }}>{item.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)' }}>Wartość: {item.price || 50} Skirnirów</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DISCORD TAB CONTENT */}
      {activeTab === 'discord' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="gothic-card"
            style={{
              padding: '2.5rem',
              background: 'radial-gradient(circle at 80% 20%, rgba(88, 101, 242, 0.15) 0%, rgba(10, 13, 18, 0.98) 80%)',
              border: activeUser.discordId ? '2px solid #10b981' : '2px solid #5865F2'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #5865F2 0%, #3b47c4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 8px 30px rgba(88, 101, 242, 0.4)'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: activeUser.discordId ? '#10b981' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
                    {activeUser.discordId ? '✓ Tożsamość Zweryfikowana' : 'Status: Oczekuje na Weryfikację'}
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '0.2rem 0' }}>
                    Integracja Konta Discord
                  </h2>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                    Połącz konto kodem na oficjalnym Discordzie Cytadeli, aby bot automatycznie nadał Ci role Zakonu, rangi oraz klasy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playWandSwoosh();
                  setDiscordModalOpen(true);
                }}
                className="btn-durmstrang"
                style={{
                  padding: '0.8rem 1.6rem',
                  fontSize: '0.92rem',
                  background: activeUser.discordId ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #5865F2 0%, #3b47c4 100%)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(88, 101, 242, 0.4)'
                }}
              >
                <Sparkles size={16} /> {activeUser.discordId ? 'Zarządzaj Połączeniem & Rolami' : 'Otwórz Kreator Weryfikacji (Kod)'}
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginTop: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Konto Discord</div>
                <div style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700, marginTop: '0.2rem' }}>
                  {activeUser.discordUsername || 'Niepołączone'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                  {activeUser.discordId ? `ID: ${activeUser.discordId}` : 'Użyj /weryfikuj kod: ...'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rola Zakonu</div>
                <div style={{ fontSize: '1.05rem', color: house ? house.colors.secondary : 'var(--gold-ancient)', fontWeight: 700, marginTop: '0.2rem' }}>
                  {house ? `${house.crestIcon} ${house.name}` : (activeUser.house || 'Brak')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.3rem' }}>
                  Automatyczny przydział
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ranga & Klasa</div>
                <div style={{ fontSize: '1.05rem', color: '#fef08a', fontWeight: 700, marginTop: '0.2rem' }}>
                  {activeUser.role === 'admin' ? '⚡ Rada Arcymistrzów' : activeUser.role === 'professor' ? '🧙‍♂️ Profesor' : '📜 Adept'} • {activeUser.classYear || 'Kadra'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.3rem' }}>
                  Synchronizowane z Dziennikiem
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MEMORY TAB CONTENT (IZBA PAMIĘCI / MOJA HISTORIA) */}
      {activeTab === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="gothic-card" style={{ padding: '2rem', border: '1px solid var(--gold-ancient)', background: 'linear-gradient(145deg, rgba(197, 159, 78, 0.08) 0%, rgba(10, 13, 18, 0.95) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                  WIECZNA KSIĘGA CYTADELI
                </span>
                <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
                  Moja Historia w Izbie Pamięci
                </h3>
              </div>

              <button
                onClick={() => {
                  const ident = activeUser.characterName || activeUser.fullName || activeUser.id;
                  navigateToMemoryPerson(ident);
                }}
                className="btn-durmstrang"
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>🏛️</span> Otwórz Moje Dossier w Izbie Pamięci
              </button>
            </div>

            {loadingMemory ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Wyszukiwanie Twoich wpisów w archiwum...</p>
            ) : memoryDossier ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Historical Snapshots */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.6rem' }}>
                    📜 Zamknięte Roczniki & Świadectwa:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {(memoryDossier.snapshots || []).map((s, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '6px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 800, textTransform: 'uppercase' }}>{s.yearName}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{s.classYear} ({s.house?.toUpperCase()})</div>
                        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                          Lokata: <strong>#{s.rankingPosition}</strong> ({s.points} pkt) • Ocena: <strong>{s.finalGrade}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificates */}
                {memoryDossier.certificates?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.6rem' }}>
                      🎓 Zarchiwizowane Świadectwa:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
                      {memoryDossier.certificates.map((c) => (
                        <div key={c.id} style={{ background: 'rgba(46, 196, 182, 0.1)', border: '1px solid #2ec4b6', borderRadius: '4px', padding: '0.8rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#2ec4b6' }}>{c.documentNumber}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>{c.yearName} — {c.finalEvaluation}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Średnia: {c.averageScore}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '6px', textAlign: 'center', color: '#9ca3af' }}>
                <p>Twój profil nie został jeszcze uwzględniony w oficjalnie zamkniętym roczniku archiwalnym.</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>Po zakończeniu semestru i zamrożeniu wyników przez Dyrekcję, Twoje świadectwa i historia pojawią się w tym miejscu.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Activity Modals */}
      <ProfileEditorModal isOpen={profileEditorOpen} onClose={() => setProfileEditorOpen(false)} />
      <StudentPassportModal isOpen={passportOpen} onClose={() => setPassportOpen(false)} />
      <GrimoireBook isOpen={grimoireOpen} onClose={() => setGrimoireOpen(false)} />
      <RuneCalligraphyModal isOpen={runeCalligraphyOpen} onClose={() => setRuneCalligraphyOpen(false)} />
      <RunicDuelModal isOpen={duelOpen} onClose={() => setDuelOpen(false)} />
      <OracleModal isOpen={oracleOpen} onClose={() => setOracleOpen(false)} />
      <ExpeditionsModal isOpen={expeditionsOpen} onClose={() => setExpeditionsOpen(false)} />
      <TargetPracticeModal isOpen={targetOpen} onClose={() => setTargetOpen(false)} />
      <DungeonEscapeModal isOpen={escapeOpen} onClose={() => setEscapeOpen(false)} />
      <HnefataflModal isOpen={hnefataflOpen} onClose={() => setHnefataflOpen(false)} />
      <IceFishingModal isOpen={fishingOpen} onClose={() => setFishingOpen(false)} />
      <BestiaryModal isOpen={bestiaryOpen} onClose={() => setBestiaryOpen(false)} />
      <BlackMarketModal isOpen={blackMarketOpen} onClose={() => setBlackMarketOpen(false)} />
      <TournamentGauntletModal isOpen={tournamentOpen} onClose={() => setTournamentOpen(false)} />
      <DiscordVerificationModal isOpen={discordModalOpen} onClose={() => setDiscordModalOpen(false)} />
    </div>
  );
};
