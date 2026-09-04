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

/**
 * SidebarNavRow — jeden wzorzec kutego wiersza nawigacji dla całego lewego paska.
 * Wygląd (kolor ikony/chevrona, separator, hover, active) pochodzi z CSS
 * (.menuBlockContent ul li button / .is-active / .is-danger), nie z inline style.
 */
const SidebarNavRow = ({ icon: Icon, glyph, label, onClick, active = false, danger = false }) => {
  const cls = [active && 'is-active', danger && 'is-danger'].filter(Boolean).join(' ');
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cls || undefined}
        aria-current={active ? 'page' : undefined}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {Icon ? <Icon size={15} /> : glyph ? <span className="sb-glyph">{glyph}</span> : null}
          {label}
        </span>
        <ChevronRight size={13} />
      </button>
    </li>
  );
};

const GAMES_COLLAPSED_COUNT = 7;

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

  // Games & Activities collapse/expand (local view state only)
  const [gamesExpanded, setGamesExpanded] = useState(false);

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
  const todayLessons = [...todayClasses]
    .filter(t => t && t.startTime)
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const scheduleUnavailable = !Array.isArray(timetable);

  // Gry & Aktywności — pełna lista (kolejność zachowana z poprzedniej wersji)
  const GAME_ITEMS = [
    { icon: Sparkles, label: 'Wyrocznia Przeznaczenia (Seidr)', setter: setOracleModalOpen, name: 'Wyrocznia Przeznaczenia (Seidr)' },
    { icon: Compass, label: 'Ekspedycje do Puszczy & Fiordów', setter: setExpeditionsModalOpen, name: 'Ekspedycje do Puszczy & Fiordów' },
    { icon: Crosshair, label: 'Runiczna Strzelnica Różdżkowa', setter: setTargetModalOpen, name: 'Runiczna Strzelnica Różdżkowa' },
    { icon: Key, label: 'Labirynt Tajemnic: Escape Room', setter: setEscapeModalOpen, name: 'Labirynt Tajemnic: Escape Room' },
    { icon: Gamepad2, label: 'Hnefatafl (Szachy Wikingów)', setter: setHnefataflModalOpen, name: 'Hnefatafl (Szachy Wikingów)' },
    { icon: Anchor, label: 'Połów w Zamarzniętym Fiordzie', setter: setFishingModalOpen, name: 'Połów w Zamarzniętym Fiordzie' },
    { icon: Award, label: 'Turniej Szermierki: Droga Mistrza', setter: setTournamentModalOpen, name: 'Turniej Szermierki' },
    { icon: Eye, label: 'Bestiariusz Północy (Karty Bestii)', setter: setBestiaryModalOpen, name: 'Bestiariusz Północy' },
    { icon: Skull, label: 'Czarny Rynek Przemytników (Svartálfar)', setter: setBlackMarketModalOpen, name: 'Czarny Rynek' },
    { icon: Swords, label: 'Wielka Sala Pojedynków (Hólmganga)', setter: setDuelModalOpen, name: 'Sala Pojedynków' },
    { icon: BookOpen, label: 'Grimuar Pradawnych Zaklęć', setter: setGrimoireModalOpen, name: 'Grimuar Zaklęć' },
    { glyph: 'ᚠ', label: 'Akademia Kaligrafii Run', setter: setRuneCalligraphyModalOpen, name: 'Kaligrafia Run' }
  ];
  const visibleGames = gamesExpanded ? GAME_ITEMS : GAME_ITEMS.slice(0, GAMES_COLLAPSED_COUNT);

  const roleLabel = currentUser
    ? (currentUser.role === 'admin'
      ? `${currentUser.gender === 'czarodziejka' ? 'Arcymistrzyni' : 'Arcymistrz'} • admin`
      : currentUser.role === 'professor'
        ? 'Profesor Katedry'
        : house ? house.name : 'Adept')
    : '';

  return (
    <aside id="menuContainerLeft">
      {/* =========================================================================
          0. BLOK: KARTA TOŻSAMOŚCI / LOGOWANIE DO CYTADELI
          ========================================================================= */}
      <div
        className="menuBlock"
        style={house ? { '--house-accent': house.colors?.secondary } : undefined}
      >
        <SidebarPanelBanner graphicId="identity" icon={Shield} rune="ᛟ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᛞ</span>
          <span>{currentUser ? 'Karta Tożsamości' : 'Kancelaria Logowania'}</span>
          <span className="rune-bracket">ᛞ</span>
        </div>

        <div className="menuBlockContent">
          {currentUser ? (
            /* ================= LOGGED IN USER CARD ================= */
            <div className="menuBlockIdentity">
              <div className="menuBlockIdentity__row">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.username}
                  className="menuBlockIdentity__avatar"
                />
                <div className="menuBlockIdentity__ident">
                  <div className="menuBlockIdentity__name">
                    {currentUser.fullName || currentUser.name}
                  </div>
                  <div className="menuBlockIdentity__sub">{roleLabel}</div>
                </div>
                <div className="menuBlockIdentity__crest" title={house ? house.name : 'Twierdza Magii Durmstrang'}>
                  <Shield size={22} />
                </div>
              </div>

              <div className="menuBlockIdentity__crestline" />

              {/* Action Buttons */}
              <div className="menuBlockIdentity__actions">
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
                className="menuBlockIdentity__logout"
              >
                [→ Wyloguj z Cytadeli
              </button>
            </div>
          ) : (
            /* ================= GUEST LOGIN FORM ================= */
            <form onSubmit={handleSidebarLogin}>
              <div className="menuBlockLogin">
                <div className="menuBlockLogin__field">
                  <label htmlFor="sidebar-login-username">
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

                <div className="menuBlockLogin__field">
                  <label htmlFor="sidebar-login-password">
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

                <div className="menuBlockLogin__links">
                  <button
                    type="button"
                    onClick={() => { playWandSwoosh(); setPasswordRecoveryModalOpen(true); }}
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
      <div className={activeView === 'timetable' ? 'menuBlock is-active-panel' : 'menuBlock'}>
        <SidebarPanelBanner graphicId="curriculum" icon={Calendar} rune="ᚠ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Plan Lekcji</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <div className="menuBlockSchedule">
            <div className="menuBlockSchedule__head">
              <span><Clock size={12} /> Dziś: {todayName}</span>
              <span className="menuBlockSchedule__count">
                {todayLessons.length} {todayLessons.length === 1 ? 'lekcja' : 'lekcji'}
              </span>
            </div>

            {todayLessons.length > 0 ? (
              <div className="menuBlockSchedule__list">
                {todayLessons.map((t, i) => (
                  <div
                    key={t.id || `${t.startTime}-${i}`}
                    className={[
                      'menuBlockSchedule__row',
                      t.status === 'cancelled' && 'is-cancelled',
                      t.status === 'substitution' && 'is-substitution'
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="menuBlockSchedule__time">{t.startTime}</span>
                    <span className="menuBlockSchedule__subject">
                      {t.subjectIcon ? `${t.subjectIcon} ` : ''}{t.subjectName || 'Zajęcia'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="menuBlockSchedule__empty">
                {scheduleUnavailable
                  ? 'Plan lekcji chwilowo niedostępny — spróbuj ponownie później.'
                  : `Brak zajęć na dziś (${todayName}). Ciesz się wolnym dniem.`}
              </div>
            )}
          </div>

          <button
            type="button"
            className="menuBlockCta"
            onClick={() => handleNav('timetable')}
            style={{ marginTop: '0.6rem' }}
          >
            <Calendar size={12} />
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
            <SidebarNavRow icon={Castle} label="Wrota Wejściowe" onClick={() => handleNav('home')} active={activeView === 'home'} />
            <SidebarNavRow icon={Scroll} label="Dzienniki Lekcyjne" onClick={() => handleNav('journals')} active={activeView === 'journals'} />
            <SidebarNavRow icon={Calendar} label="Plan Lekcji & Grafik" onClick={() => handleNav('timetable')} active={activeView === 'timetable'} />
            <SidebarNavRow icon={Shield} label="Cztery Zakony" onClick={() => handleNav('houses')} active={activeView === 'houses'} />
            <SidebarNavRow icon={Scroll} label="Dekrety, Regulamin DC & Statut" onClick={() => handleNav('documents')} active={activeView === 'documents'} />
            <SidebarNavRow icon={Landmark} label="Izba Pamięci & Kroniki" onClick={() => handleNav('memory')} active={activeView === 'memory'} />
            <SidebarNavRow icon={Scale} label="Kodeks & Pakt 1294" onClick={() => handleNav('rules-guide')} active={activeView === 'rules-guide'} />
          </ul>
        </div>
      </div>

      {/* =========================================================================
          2. BLOK: CENTRUM AKTYWNOŚCI & GIER RPG (FULL SUITE)
          ========================================================================= */}
      <div className="menuBlock menuBlockGames">
        <SidebarPanelBanner graphicId="activities" icon={Zap} rune="ᛏ" />

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Gry & Aktywności</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul id="sidebar-games-list">
            {visibleGames.map((g) => (
              <SidebarNavRow
                key={g.label}
                icon={g.icon}
                glyph={g.glyph}
                label={g.label}
                onClick={() => openActivity(g.setter, g.name)}
              />
            ))}
          </ul>

          {GAME_ITEMS.length > GAMES_COLLAPSED_COUNT && (
            <button
              type="button"
              className="menuBlockCta"
              aria-expanded={gamesExpanded}
              aria-controls="sidebar-games-list"
              onClick={() => { playWandSwoosh(); setGamesExpanded(v => !v); }}
              style={{ marginTop: '0.5rem' }}
            >
              {gamesExpanded ? 'Zwiń listę' : `Pokaż wszystkie (${GAME_ITEMS.length})`}
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2b. BLOK: WIELKA INKWIZYCJA & DEKRETY WŁADZ (DEDYKOWANY MODUŁ PRAWNY)
          ========================================================================= */}
      <div className="menuBlock menuBlock--danger">
        <SidebarPanelBanner
          graphicId="inquisition"
          icon={ShieldAlert}
          rune="ᛏ"
          accent="inquisition"
          onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
          title="Otwórz Obowiązki Władz Twierdzy"
        />

        <div
          className="menuBlockTitle menuBlockTitle--accent-crimson is-clickable"
          onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
          title="Otwórz Obowiązki Władz Twierdzy"
        >
          <span className="rune-bracket">ᚦ</span>
          <span>Inkwizycja & Dekrety</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <SidebarNavRow
              icon={Crown}
              label="Obowiązki Władz Twierdzy"
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('wladze', 'obowiazki-i-kompetencje-wladz-twierdzy'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'wladze'}
            />
            <SidebarNavRow
              icon={ShieldAlert}
              label="Dekrety Władz & Edykty"
              danger
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('dekrety'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'dekrety'}
            />
            <SidebarNavRow
              icon={ClipboardCheck}
              label="Wizytacje Nauczycieli"
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('wizytacje'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'wizytacje'}
            />
            <SidebarNavRow
              icon={Scale}
              label="Statut Instytutu TMD"
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('statut'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'statut'}
            />
            <SidebarNavRow
              icon={MessageSquare}
              label="Regulamin Serwera Discord"
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('regulamin-dc'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'regulamin-dc'}
            />
            <SidebarNavRow
              icon={Gamepad2}
              label="Opis Zabaw & Gier RPG"
              onClick={() => { playWandSwoosh(); navigateToDocumentModule('zabawy'); }}
              active={activeView === 'documents' && activeDocumentCategory === 'zabawy'}
            />
          </ul>

          {(currentUser?.role === 'admin' || currentRole === 'admin') && (
            <button
              type="button"
              onClick={() => { playWandSwoosh(); setCustomPageEditorOpen(true); }}
              className="menuBlockCta"
              style={{ marginTop: '0.6rem' }}
            >
              <Plus size={12} />
              <span>Stwórz Nową Podstronę</span>
            </button>
          )}
        </div>
      </div>


      {/* =========================================================================
          3b. BLOK: GRIMUAR ZAKLĘĆ & MAGIA
          ========================================================================= */}
      <div className="menuBlock">
        <SidebarPanelBanner graphicId="grimoire" icon={BookOpen} rune="ᚨ" />

        <div className="menuBlockTitle">
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

        <div className="menuBlockTitle">
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

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Bank Skirnirów</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          {currentUser && studentProfile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(181, 138, 58, 0.1)', border: '1px solid rgba(181, 138, 58, 0.25)', borderRadius: '2px', padding: '0.4rem 0.6rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#aeb8c7' }}>Stan Sakiewki:</span>
              <span style={{ fontSize: '0.85rem', color: '#d0a84d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Coins size={13} color="#b58a3a" /> {studentProfile.currency || 0} Skirnirów
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
            <SidebarNavRow
              icon={Map}
              label="Żywa Mapa Twierdzy"
              onClick={() => handleNav('map')}
              active={activeView === 'map'}
            />
            <SidebarNavRow
              icon={Scroll}
              label="Żelazne Pióro"
              onClick={() => handleNav('gazette')}
              active={activeView === 'gazette' || activeView === 'gazette-reader' || activeView === 'gazette-archive'}
            />
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
