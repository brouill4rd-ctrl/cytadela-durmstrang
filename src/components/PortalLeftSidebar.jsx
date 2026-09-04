import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { StudentPassportModal } from './StudentPassportModal';
import { ProfileEditorModal } from './ProfileEditorModal';
import { GrimoireBook } from './GrimoireBook';
import { RuneCalligraphyModal } from './RuneCalligraphyModal';
import { RunicDuelModal } from './RunicDuelModal';
import { OracleModal } from './OracleModal';
import { ExpeditionsModal } from './ExpeditionsModal';
import { TargetPracticeModal } from './TargetPracticeModal';
import { DungeonEscapeModal } from './DungeonEscapeModal';
import { HnefataflModal } from './HnefataflModal';
import { IceFishingModal } from './IceFishingModal';
import { BestiaryModal } from './BestiaryModal';
import { BlackMarketModal } from './BlackMarketModal';
import { TournamentGauntletModal } from './TournamentGauntletModal';
import { CustomPageEditorModal } from './CustomPageEditorModal';
import { StudentHomeworkWidget, ProfessorHomeworkWidget } from './HomeworkWidgets';
import { SidebarPanelBanner } from './SidebarPanelBanner';
import {
  Castle,
  UserPlus,
  BookOpen,
  ShoppingBag,
  Award,
  Scroll,
  Shield,
  Key,
  Flame,
  Compass,
  Mail,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Coins,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  User,
  Users,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Swords,
  Download,
  Droplets,
  Crosshair,
  Anchor,
  Skull,
  Eye,
  Crown,
  Edit3,
  Gamepad2,
  Scale,
  Map,
  ShieldAlert,
  ClipboardCheck,
  MessageSquare,
  Plus,
  Landmark
} from 'lucide-react';

export const PortalLeftSidebar = ({ onOpenCreationModal }) => {
  const {
    setActiveView,
    activeView,
    houses,
    currentUser,
    currentRole,
    studentProfile,
    loginUser,
    logoutUser,
    setAuthModalOpen,
    openAuthModal,
    setPasswordRecoveryModalOpen,
    pendingApplications,
    emails,
    setEmailInboxOpen,
    timetable,
    daysOfWeek,
    showNotification,
    navigateToDocumentModule,
    activeDocumentCategory,
    navigateToMemory
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  // Sidebar mini-login form state
  const [sideUsername, setSideUsername] = useState('');
  const [sidePassword, setSidePassword] = useState('');

  // Modals state
  const [profileEditorModalOpen, setProfileEditorModalOpen] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [grimoireModalOpen, setGrimoireModalOpen] = useState(false);
  const [runeCalligraphyModalOpen, setRuneCalligraphyModalOpen] = useState(false);
  const [duelModalOpen, setDuelModalOpen] = useState(false);
  const [oracleModalOpen, setOracleModalOpen] = useState(false);
  const [expeditionsModalOpen, setExpeditionsModalOpen] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [escapeModalOpen, setEscapeModalOpen] = useState(false);
  const [hnefataflModalOpen, setHnefataflModalOpen] = useState(false);
  const [fishingModalOpen, setFishingModalOpen] = useState(false);
  const [bestiaryModalOpen, setBestiaryModalOpen] = useState(false);
  const [blackMarketModalOpen, setBlackMarketModalOpen] = useState(false);
  const [tournamentModalOpen, setTournamentModalOpen] = useState(false);
  const [customPageEditorOpen, setCustomPageEditorOpen] = useState(false);

  const openActivity = (openFn, activityName = 'Gry i aktywności') => {
    playWandSwoosh();
    if (!currentUser) {
      setAuthModalOpen(true);
      showNotification('Wymagane Logowanie', `Zaloguj się do Cytadeli, aby uzyskać dostęp do: ${activityName}.`, 'warning');
      return;
    }
    openFn(true);
  };

  const handleNav = (view) => {
    playWandSwoosh();
    const restrictedViews = ['journals', 'lesson-detail', 'professor-journal-editor', 'ceremony', 'rune-workshop', 'markethall', 'bank', 'profile', 'raven-post', 'admin'];
    if (!currentUser && restrictedViews.includes(view)) {
      setAuthModalOpen(true);
      showNotification('Wymagane Logowanie', 'Dzienniki lekcyjne i prywatne komnaty są dostępne wyłącznie dla zalogowanych adeptów.', 'warning');
      return;
    }
    if (view === 'memory') {
      if (navigateToMemory) navigateToMemory('overview');
      else setActiveView('memory');
      return;
    }
    setActiveView(view);
  };

  const handleSidebarLogin = async (e) => {
    e.preventDefault();
    playWandSwoosh();
    const success = await loginUser(sideUsername, sidePassword);
    if (success) {
      setSideUsername('');
      setSidePassword('');
    }
  };

  const house = currentUser?.house ? houses[currentUser.house] : null;
  const pendingCount = (pendingApplications || []).filter(a => a.status === 'pending').length;

  // Get current day of week and today's classes
  const jsDay = new Date().getDay();
  const todayDayNumber = jsDay === 0 ? 7 : jsDay;
  const todayName = daysOfWeek?.find(d => d.dayNumber === todayDayNumber)?.name || 'Poniedziałek';
  const todayClasses = (timetable || []).filter(t => t.dayOfWeek === todayDayNumber);

  return (
    <aside id="menuContainerLeft">
      {/* =========================================================================
          0. BLOK: KARTA TOŻSAMOŚCI / LOGOWANIE DO CYTADELI
          ========================================================================= */}
      <div className="menuBlock" style={{ border: '1px solid var(--gold-ancient)' }}>
        <SidebarPanelBanner graphicId="identity" icon={Shield} rune="ᛟ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᛞ</span>
          <span>{currentUser ? 'Karta Tożsamości' : 'Kancelaria Logowania'}</span>
          <span className="rune-bracket">ᛞ</span>
        </div>

        <div className="menuBlockContent">
          {currentUser ? (
            /* ================= LOGGED IN USER CARD ================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.username}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--gold-ancient)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.8)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {currentUser.fullName || currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: house ? house.colors.secondary : 'var(--gold-ancient)', fontWeight: 600 }}>
                    {currentUser.role === 'admin' ? `${currentUser.gender === 'czarodziejka' ? 'Arcymistrzyni' : 'Arcymistrz'} • admin` : currentUser.role === 'professor' ? 'Profesor Katedry' : house ? house.name : 'Adept'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                <button
                  onClick={() => setProfileEditorModalOpen(true)}
                  className="btn-durmstrang"
                  style={{ padding: '0.4rem', fontSize: '0.72rem', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Edit3 size={12} />
                  <span>EDYTUJ</span>
                </button>
                <button
                  onClick={() => setPassportModalOpen(true)}
                  className="btn-durmstrang-secondary"
                  style={{ padding: '0.4rem', fontSize: '0.72rem', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Scroll size={12} />
                  <span>PASZPORT</span>
                </button>
              </div>

              <button
                onClick={() => handleNav('profile')}
                className="btn-durmstrang-secondary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.74rem', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Users size={13} />
                <span>MÓJ PROFIL & EKWIPUNEK</span>
              </button>

              <button
                onClick={() => handleNav('absence-chamber')}
                className="btn-durmstrang-secondary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.74rem', justifyContent: 'center', gap: '0.4rem' }}
              >
                <ClipboardCheck size={13} />
                <span>USPRAWIEDLIWIENIA</span>
              </button>

              <button
                onClick={logoutUser}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  textAlign: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                [→ Wyloguj z Cytadeli
              </button>
            </div>
          ) : (
            /* ================= GUEST LOGIN FORM ================= */
            <form onSubmit={handleSidebarLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <label htmlFor="sidebar-login-username" style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Login:
                  </label>
                  <input
                    id="sidebar-login-username"
                    autoComplete="username"
                    type="text"
                    value={sideUsername}
                    onChange={(e) => setSideUsername(e.target.value)}
                    placeholder="np. adept / valgerda"
                    className="gothic-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="sidebar-login-password" style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Hasło:
                  </label>
                  <input
                    id="sidebar-login-password"
                    autoComplete="current-password"
                    type="password"
                    value={sidePassword}
                    onChange={(e) => setSidePassword(e.target.value)}
                    placeholder="••••••••"
                    className="gothic-input"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-durmstrang"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', marginTop: '0.2rem', justifyContent: 'center' }}
                >
                  <LogIn size={13} />
                  <span>Zaloguj się</span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => { playWandSwoosh(); setPasswordRecoveryModalOpen(true); }}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Zapomniałeś hasła?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playWandSwoosh();
                      if (openAuthModal) openAuthModal('register');
                      else setAuthModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-ancient)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Stwórz konto →
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* WIDGETY PRAC DOMOWYCH */}
      <StudentHomeworkWidget />
      <ProfessorHomeworkWidget />

      {/* =========================================================================
          PLAN LEKCJI & HARMONOGRAM DNIA
          ========================================================================= */}
      <div className="menuBlock" style={{ border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : undefined }}>
        <SidebarPanelBanner graphicId="curriculum" icon={Calendar} rune="ᚠ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Plan Lekcji</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          {/* Header Day Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', paddingBottom: '0.45rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--gold-ancient)', fontWeight: 800 }}>
              <Clock size={12} color="var(--gold-ancient)" />
              <span>Dziś: {todayName}</span>
            </div>
            <span style={{ fontSize: '0.68rem', background: 'rgba(197, 159, 78, 0.15)', color: '#f7dca0', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
              {todayClasses.length} {todayClasses.length === 1 ? 'lekcja' : 'lekcji'}
            </span>
          </div>

          <button
            onClick={() => handleNav('timetable')}
            className="btn-durmstrang"
            style={{
              width: '100%',
              padding: '0.45rem',
              fontSize: '0.8rem',
              justifyContent: 'center',
              background: activeView === 'timetable' ? 'linear-gradient(135deg, #c59f4e 0%, #8a6c2f 100%)' : undefined,
              color: activeView === 'timetable' ? '#05070a' : undefined,
              fontWeight: 800
            }}
          >
            <Calendar size={13} />
            <span>Pełny Harmonogram Tygodnia →</span>
          </button>
        </div>
      </div>


      {/* =========================================================================
          1. BLOK: GŁÓWNA STRUKTURA TWIERDZY MAGII
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="locations" icon={Castle} rune="ᛞ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Twierdza Magii (TMD)</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <li>
              <button
                onClick={() => handleNav('home')}
                style={{
                  color: activeView === 'home' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'home' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                  border: activeView === 'home' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Castle size={14} color="var(--gold-ancient)" /> Wrota Wejściowe
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('journals')}
                style={{
                  color: activeView === 'journals' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'journals' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  border: activeView === 'journals' ? '1px solid var(--gold-ancient)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scroll size={14} color="var(--gold-ancient)" /> Dzienniki Lekcyjne
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('timetable')}
                style={{
                  color: activeView === 'timetable' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'timetable' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Calendar size={14} color="var(--gold-ancient)" /> Plan Lekcji & Grafik
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('houses')}
                style={{
                  color: activeView === 'houses' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'houses' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                  border: activeView === 'houses' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Shield size={14} color="var(--gold-ancient)" /> Cztery Zakony
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('documents')}
                style={{
                  color: activeView === 'documents' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  border: activeView === 'documents' ? '1px solid var(--gold-ancient)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scroll size={14} color="var(--gold-ancient)" /> Dekrety, Regulamin DC & Statut
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('memory')}
                style={{
                  color: activeView === 'memory' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'memory' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  border: activeView === 'memory' ? '1px solid var(--gold-ancient)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Landmark size={14} color="var(--gold-ancient)" /> Izba Pamięci & Kroniki
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('rules-guide')}
                style={{
                  color: activeView === 'rules-guide' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'rules-guide' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                  border: activeView === 'rules-guide' ? '1px solid var(--gold-ancient)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scale size={14} color="var(--gold-ancient)" /> Kodeks & Pakt 1294
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          2. BLOK: CENTRUM AKTYWNOŚCI & GIER RPG (FULL SUITE)
          ========================================================================= */}
      <div className="menuBlock" style={{ border: '1px solid rgba(197, 159, 78, 0.4)' }}>
        <SidebarPanelBanner graphicId="activities" icon={Zap} rune="ᛏ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Gry & Aktywności</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <li>
              <button onClick={() => openActivity(setOracleModalOpen, 'Wyrocznia Przeznaczenia (Seidr)')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={14} color="var(--gold-ancient)" /> Wyrocznia Przeznaczenia (Seidr)
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setExpeditionsModalOpen, 'Ekspedycje do Puszczy & Fiordów')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Compass size={14} color="var(--gold-ancient)" /> Ekspedycje do Puszczy & Fiordów
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setTargetModalOpen, 'Runiczna Strzelnica Różdżkowa')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Crosshair size={14} color="var(--gold-ancient)" /> Runiczna Strzelnica Różdżkowa
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setEscapeModalOpen, 'Labirynt Tajemnic: Escape Room')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Key size={14} color="var(--gold-ancient)" /> Labirynt Tajemnic: Escape Room
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setHnefataflModalOpen, 'Hnefatafl (Szachy Wikingów)')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Gamepad2 size={14} color="var(--gold-ancient)" /> Hnefatafl (Szachy Wikingów)
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setFishingModalOpen, 'Połów w Zamarzniętym Fiordzie')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Anchor size={14} color="var(--gold-ancient)" /> Połów w Zamarzniętym Fiordzie
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setTournamentModalOpen, 'Turniej Szermierki')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Award size={14} color="var(--gold-ancient)" /> Turniej Szermierki: Droga Mistrza
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setBestiaryModalOpen, 'Bestiariusz Północy')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Eye size={14} color="var(--gold-ancient)" /> Bestiariusz Północy (Karty Bestii)
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setBlackMarketModalOpen, 'Czarny Rynek')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Skull size={14} color="var(--gold-ancient)" /> Czarny Rynek Przemytników (Svartálfar)
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setDuelModalOpen, 'Sala Pojedynków')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Swords size={14} color="var(--gold-ancient)" /> Wielka Sala Pojedynków (Hólmganga)
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setGrimoireModalOpen, 'Grimuar Zaklęć')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <BookOpen size={14} color="var(--gold-ancient)" /> Grimuar Pradawnych Zaklęć
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button onClick={() => openActivity(setRuneCalligraphyModalOpen, 'Kaligrafia Run')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', fontSize: '0.9rem', color: 'var(--gold-ancient)', fontWeight: 800 }}>ᚠ</span> Akademia Kaligrafii Run
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          2b. BLOK: WIELKA INKWIZYCJA & DEKRETY WŁADZ (DEDYKOWANY MODUŁ PRAWNY)
          ========================================================================= */}
      <div className="menuBlock" style={{ border: '1px solid rgba(239, 68, 68, 0.45)' }}>
        <SidebarPanelBanner
          graphicId="inquisition"
          icon={ShieldAlert}
          rune="ᛏ"
          accent="inquisition"
          onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
          title="Otwórz Obowiązki Władz Twierdzy"
        />

        <div
          className="menuBlockTitle menuBlockTitle--accent-crimson"
          onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
          style={{ cursor: 'pointer' }}
          title="Otwórz Obowiązki Władz Twierdzy"
        >
          <span className="rune-bracket">ᚦ</span>
          <span>Inkwizycja & Dekrety</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
                style={{
                  color: activeView === 'documents' && activeDocumentCategory === 'wladze' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' && activeDocumentCategory === 'wladze' ? 'rgba(197, 159, 78, 0.25)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'wladze' ? 800 : 500
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Crown size={14} color="var(--gold-ancient)" /> Obowiązki Władz Twierdzy
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('dekrety'); }}
                style={{
                  color: '#fca5a5',
                  background: activeView === 'documents' && activeDocumentCategory === 'dekrety' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'dekrety' ? 800 : 600
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldAlert size={14} color="#ef4444" /> Dekrety Władz & Edykty
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('wizytacje'); }}
                style={{
                  color: activeView === 'documents' && activeDocumentCategory === 'wizytacje' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' && activeDocumentCategory === 'wizytacje' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'wizytacje' ? 800 : 500
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ClipboardCheck size={14} color="var(--gold-ancient)" /> Wizytacje Nauczycieli
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('statut'); }}
                style={{
                  color: activeView === 'documents' && activeDocumentCategory === 'statut' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' && activeDocumentCategory === 'statut' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'statut' ? 800 : 500
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scale size={14} color="var(--gold-ancient)" /> Statut Instytutu TMD
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('regulamin-dc'); }}
                style={{
                  color: activeView === 'documents' && activeDocumentCategory === 'regulamin-dc' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' && activeDocumentCategory === 'regulamin-dc' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'regulamin-dc' ? 800 : 500
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <MessageSquare size={14} color="var(--gold-ancient)" /> Regulamin Serwera Discord
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => { playWandSwoosh(); navigateToDocumentModule('zabawy'); }}
                style={{
                  color: activeView === 'documents' && activeDocumentCategory === 'zabawy' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'documents' && activeDocumentCategory === 'zabawy' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                  fontWeight: activeView === 'documents' && activeDocumentCategory === 'zabawy' ? 800 : 500
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Gamepad2 size={14} color="var(--gold-ancient)" /> Opis Zabaw & Gier RPG
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>

          {(currentUser?.role === 'admin' || currentRole === 'admin') && (
            <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => { playWandSwoosh(); setCustomPageEditorOpen(true); }}
                className="btn-durmstrang"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.76rem', justifyContent: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(197, 159, 78, 0.3) 100%)', border: '1px solid var(--gold-ancient)' }}
              >
                <Plus size={13} />
                <span>+ Stwórz Nową Podstronę</span>
              </button>
            </div>
          )}
        </div>
      </div>


      {/* =========================================================================
          3b. BLOK: GRIMUAR ZAKLĘĆ & MAGIA
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="grimoire" icon={BookOpen} rune="ᚨ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Grimuar & Magia</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
            Inkantacje nordyckie, kucie formuł runicznych (Galdr) oraz archiwum wiedzy tajemnej.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={() => openActivity(setGrimoireModalOpen, 'Mroczny Grimuar')}
              className="btn-durmstrang"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Sparkles size={13} />
              <span>Otwórz Mroczny Grimuar</span>
            </button>

            <button
              onClick={() => handleNav('rune-workshop')}
              className="btn-durmstrang-secondary"
              style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Sparkles size={12} color="#2ec4b6" />
              <span>Pracownia Run (Galdr)</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3c. BLOK: RYNEK KAUPANGR (MARKETHALL & KRAMY)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="markethall" icon={ShoppingBag} rune="ᚲ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Rynek Kaupangr</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
            Wyprawki szkolne, kramy różdżkarskie, kociołki, rzadkie składniki alchemiczne i eliksiry.
          </p>

          <button
            onClick={() => handleNav('markethall')}
            className="btn-durmstrang"
            style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.4rem' }}
          >
            <ShoppingBag size={13} />
            <span>Odwiedź Kramy Kaupangr →</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3d. BLOK: BANK SKIRNIRÓW (BANK & SKARBIEC)
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="bank" icon={Coins} rune="ᛒ" />

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Bank Skirnirów</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          {currentUser && studentProfile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(197, 159, 78, 0.1)', border: '1px solid rgba(197, 159, 78, 0.25)', borderRadius: '4px', padding: '0.4rem 0.6rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Stan Sakiewki:</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-glow)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Coins size={13} color="var(--gold-ancient)" /> {studentProfile.currency || 0} Skirnirów
              </span>
            </div>
          )}

          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
            Oficjalny skarbiec Północy. Wymiana Galionów na Skirniry, skrytki depozytowe i depozyty rodowe.
          </p>

          <button
            onClick={() => handleNav('bank')}
            className="btn-durmstrang"
            style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Coins size={13} />
            <span>Otwórz Skarbiec Skirnirów →</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. BLOK: EKSPLORACJA
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="exploration" icon={Compass} rune="ᚱ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Eksploracja</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <li>
              <button
                onClick={() => handleNav('map')}
                style={{
                  color: activeView === 'map' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'map' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                  border: activeView === 'map' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Map size={14} color="var(--gold-ancient)" /> Żywa Mapa Twierdzy
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('gazette')}
                style={{
                  color: activeView === 'gazette' || activeView === 'gazette-reader' || activeView === 'gazette-archive' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'gazette' || activeView === 'gazette-reader' || activeView === 'gazette-archive' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                  border: activeView === 'gazette' || activeView === 'gazette-reader' || activeView === 'gazette-archive' ? '1px solid rgba(197, 159, 78, 0.3)' : '1px solid transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scroll size={14} color="var(--gold-ancient)" /> Żelazne Pióro
                </span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Global Modals for Full Suite of Activities */}
      <ProfileEditorModal isOpen={profileEditorModalOpen} onClose={() => setProfileEditorModalOpen(false)} />
      <StudentPassportModal isOpen={passportModalOpen} onClose={() => setPassportModalOpen(false)} />
      <GrimoireBook isOpen={grimoireModalOpen} onClose={() => setGrimoireModalOpen(false)} />
      <RuneCalligraphyModal isOpen={runeCalligraphyModalOpen} onClose={() => setRuneCalligraphyModalOpen(false)} />
      <RunicDuelModal isOpen={duelModalOpen} onClose={() => setDuelModalOpen(false)} />
      <OracleModal isOpen={oracleModalOpen} onClose={() => setOracleModalOpen(false)} />
      <ExpeditionsModal isOpen={expeditionsModalOpen} onClose={() => setExpeditionsModalOpen(false)} />
      <TargetPracticeModal isOpen={targetModalOpen} onClose={() => setTargetModalOpen(false)} />
      <DungeonEscapeModal isOpen={escapeModalOpen} onClose={() => setEscapeModalOpen(false)} />
      <HnefataflModal isOpen={hnefataflModalOpen} onClose={() => setHnefataflModalOpen(false)} />
      <IceFishingModal isOpen={fishingModalOpen} onClose={() => setFishingModalOpen(false)} />
      <BestiaryModal isOpen={bestiaryModalOpen} onClose={() => setBestiaryModalOpen(false)} />
      <BlackMarketModal isOpen={blackMarketModalOpen} onClose={() => setBlackMarketModalOpen(false)} />
      <TournamentGauntletModal isOpen={tournamentModalOpen} onClose={() => setTournamentModalOpen(false)} />
      <CustomPageEditorModal isOpen={customPageEditorOpen} onClose={() => setCustomPageEditorOpen(false)} />
    </aside>
  );
};
