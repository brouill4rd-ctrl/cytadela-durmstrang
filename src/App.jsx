import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useSchool } from './context/SchoolContext';
import { useSound } from './context/SoundContext';
import { Navbar } from './components/Navbar';
import { SnowCanvas } from './components/SnowCanvas';
import { AuroraCanvas } from './components/AuroraCanvas';
import { CitadelAstrolabe } from './components/CitadelAstrolabe';
import { useWorldState } from './context/WorldStateContext';
import { TorchCursor } from './components/TorchCursor';
import { WandSparks } from './components/WandSparks';
import { Footer } from './components/Footer';
import { PortalLeftSidebar } from './components/PortalLeftSidebar';
import { PortalRightSidebar } from './components/PortalRightSidebar';
import { MonumentalHero } from './components/MonumentalHero';
import { CharacterCreationModal } from './views/CharacterCreationModal';
import { AuthModal } from './components/AuthModal';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';
import { EmailInboxModal } from './components/EmailInboxModal';
import { DiscordLessonSimulatorModal } from './components/DiscordLessonSimulatorModal';

import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AdeptBelt } from './components/AdeptBelt';

// Views
import { HomeView } from './views/HomeView';
import { RestrictedAccessView } from './views/RestrictedAccessView';
import { api } from './api';

import { Sparkles, Info, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

const lazyNamed = (loader, exportName) => lazy(() =>
  loader().then(module => ({ default: module[exportName] }))
);

const HousesView = lazyNamed(() => import('./views/HousesView'), 'HousesView');
const CeremonyView = lazyNamed(() => import('./views/CeremonyView'), 'CeremonyView');
const AcademicView = lazyNamed(() => import('./views/AcademicView'), 'AcademicView');
const RuneWorkshopView = lazyNamed(() => import('./views/RuneWorkshopView'), 'RuneWorkshopView');
const MapView = lazyNamed(() => import('./views/MapView'), 'MapView');
const MarkethallView = lazyNamed(() => import('./views/MarkethallView'), 'MarkethallView');
const ProfileView = lazyNamed(() => import('./views/ProfileView'), 'ProfileView');
const LoreArchiveView = lazyNamed(() => import('./views/LoreArchiveView'), 'LoreArchiveView');
const RavenPostView = lazyNamed(() => import('./views/RavenPostView'), 'RavenPostView');
const AdminCMSView = lazyNamed(() => import('./views/AdminCMSView'), 'AdminCMSView');
const JournalsListView = lazyNamed(() => import('./views/JournalsListView'), 'JournalsListView');
const LessonDetailView = lazyNamed(() => import('./views/LessonDetailView'), 'LessonDetailView');
const ProfessorJournalEditor = lazyNamed(() => import('./views/ProfessorJournalEditor'), 'ProfessorJournalEditor');
const SubjectDetailView = lazyNamed(() => import('./views/SubjectDetailView'), 'SubjectDetailView');
const TimetableView = lazyNamed(() => import('./views/TimetableView'), 'TimetableView');
const BankView = lazyNamed(() => import('./views/BankView'), 'BankView');
const RulesGuideView = lazyNamed(() => import('./views/RulesGuideView'), 'RulesGuideView');
const DocumentsCodexView = lazyNamed(() => import('./views/DocumentsCodexView'), 'DocumentsCodexView');
const GazetteView = lazyNamed(() => import('./views/GazetteView'), 'GazetteView');
const GazetteFlipbook = lazyNamed(() => import('./views/GazetteFlipbook'), 'GazetteFlipbook');
const GazettePanelView = lazyNamed(() => import('./views/GazettePanelView'), 'GazettePanelView');
const GazetteArchiveView = lazyNamed(() => import('./views/GazetteArchiveView'), 'GazetteArchiveView');
const ExamCenterView = lazyNamed(() => import('./views/ExamCenterView'), 'ExamCenterView');
const ExamTakingView = lazyNamed(() => import('./views/ExamTakingView'), 'ExamTakingView');
const ExamResultView = lazyNamed(() => import('./views/ExamResultView'), 'ExamResultView');
const ExamCreatorView = lazyNamed(() => import('./views/ExamCreatorView'), 'ExamCreatorView');
const ExamGradingView = lazyNamed(() => import('./views/ExamGradingView'), 'ExamGradingView');
const ExamBankView = lazyNamed(() => import('./views/ExamBankView'), 'ExamBankView');
const HomeworkCenterView = lazyNamed(() => import('./views/HomeworkCenterView'), 'HomeworkCenterView');
const HomeworkDetailView = lazyNamed(() => import('./views/HomeworkDetailView'), 'HomeworkDetailView');
const HomeworkCreatorView = lazyNamed(() => import('./views/HomeworkCreatorView'), 'HomeworkCreatorView');
const HomeworkGradingView = lazyNamed(() => import('./views/HomeworkGradingView'), 'HomeworkGradingView');
const MemoryMainView = lazyNamed(() => import('./views/MemoryMainView'), 'MemoryMainView');
const PrologueView = lazyNamed(() => import('./views/PrologueView'), 'PrologueView');
const TeacherPrologueView = lazyNamed(() => import('./views/TeacherPrologueView'), 'TeacherPrologueView');
const AbsenceChamberView = lazyNamed(() => import('./views/AbsenceChamberView'), 'AbsenceChamberView');
const EnrollmentChamberView = lazyNamed(() => import('./views/EnrollmentChamberView'), 'EnrollmentChamberView');

const viewLoadingFallback = (
  <div role="status" aria-live="polite" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
    Ładowanie komnaty…
  </div>
);

const RESTRICTED_VIEW_LABELS = {
  'journals': 'Dzienników Lekcyjnych Cytadeli',
  'lesson-detail': 'szczegółowych zapisów z lekcji',
  'professor-journal-editor': 'panelu redagowania dziennika',
  'ceremony': 'Ceremonii Przydziału do Zakonu',
  'rune-workshop': 'Warsztatu Runicznego (Galdrastofa)',
  'markethall': 'Rynku Magicznego Kaupangr',
  'bank': 'Skarbca Banku Skirnirów',
  'profile': 'Karty Tożsamości i Ekwipunku',
  'raven-post': 'Poczty Kruków',
  'admin': 'Komnat Najwyższej Rady Dyrekcji',
  'exams': 'Centrum Egzaminacyjnego Twierdzy',
  'exam-taking': 'arkusza egzaminacyjnego',
  'exam-result': 'protokołu wyników egzaminu',
  'exam-creator': 'kreatora arkuszy egzaminacyjnych',
  'exam-grading': 'panelu sprawdzania prac egzaminacyjnych',
  'exam-bank': 'Banku Pytań Egzaminacyjnych',
  'homework': 'Centrum Prac Domowych Cytadeli',
  'homework-detail': 'Karty Pracy Domowej',
  'homework-creator': 'Kreatora Prac Domowych',
  'homework-grading': 'Panelu Oceniania Prac Domowych'
};

export const App = () => {
  const {
    activeView,
    setActiveView,
    notification,
    houses,
    setActiveHouseTab,
    authModalOpen,
    setAuthModalOpen,
    openAuthModal,
    passwordRecoveryModalOpen,
    setPasswordRecoveryModalOpen,
    emailInboxOpen,
    setEmailInboxOpen,
    discordSimulatorOpen,
    setDiscordSimulatorOpen,
    currentUser
  } = useSchool();

  const { playRuneChime } = useSound();
  const { worldState, effectiveMode } = useWorldState();

  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [auroraEnabled, setAuroraEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(true);
  // null = status Prologu jeszcze nieznany; Pas pozostaje wtedy schowany.
  const [prologueRequired, setPrologueRequired] = useState(null);

  useEffect(() => {
    let active = true;
    const PROLOGUE_ROLES = ['student', 'teacher', 'professor'];
    if (!currentUser || !PROLOGUE_ROLES.includes(currentUser.role)) {
      setPrologueRequired(false);
      return () => { active = false; };
    }
    api.getMyPrologue().then(result => {
      if (active && result.ok) setPrologueRequired(!result.data.completed);
    });
    return () => { active = false; };
  }, [currentUser?.id]);

  // Global Keyboard Shortcuts (Ctrl+K or / for Magiczny Kompas Cytadeli)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playRuneChime();
        setCommandPaletteOpen(prev => !prev);
      }
      // Pressing '/' when not in input/textarea/select/editable
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
        e.preventDefault();
        playRuneChime();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [playRuneChime]);

  // Escape zamyka mapę
  useEffect(() => {
    if (activeView !== 'map') return;
    const handler = (e) => { if (e.key === 'Escape') setActiveView('home'); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeView, setActiveView]);

  // Sound on notification
  useEffect(() => {
    if (notification) {
      playRuneChime();
    }
  }, [notification]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  const renderActiveView = () => {
    // Widoki wymagające logowania (Dzienniki, Gry i Warsztaty, Bank, Rynek, Profil, Poczta, CMS, Egzaminy)
    // PUBLICZNE: home, houses, map, lore, academic, subject-detail, timetable, exams
    const isRestricted = ['lesson-detail', 'professor-journal-editor', 'ceremony', 'rune-workshop', 'markethall', 'bank', 'profile', 'raven-post', 'admin', 'gazette-panel', 'exam-taking', 'exam-result', 'exam-creator', 'exam-grading', 'exam-bank'].includes(activeView);
    if (!currentUser && isRestricted) {
      return <RestrictedAccessView targetName={RESTRICTED_VIEW_LABELS[activeView] || 'tych komnat'} />;
    }

    // Role-specific view guards
    if (activeView === 'ceremony' && currentUser?.role !== 'student') {
      return <RestrictedAccessView targetName="Ceremonii Przydziału (wyłącznie dla adeptów — kadra i Dyrekcja nie należą do Zakonów)" />;
    }
    if (activeView === 'admin' && currentUser?.role !== 'admin') {
      return <RestrictedAccessView targetName="Komnat Najwyższej Rady Dyrekcji (Wymagana rola: Arcymistrz Dyrekcji)" />;
    }
    if (activeView === 'professor-journal-editor' && currentUser?.role !== 'admin' && currentUser?.role !== 'professor') {
      return <RestrictedAccessView targetName="panelu redagowania dziennika (Dostępne dla Profesorów i Dyrekcji)" />;
    }
    if (['exam-creator', 'exam-grading', 'exam-bank', 'homework-creator', 'homework-grading'].includes(activeView) && currentUser?.role !== 'admin' && currentUser?.role !== 'professor') {
      return <RestrictedAccessView targetName="panelu profesorskiego (Wymagane uprawnienia Profesora lub Dyrekcji)" />;
    }

    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'rules-guide':
        return <RulesGuideView />;
      case 'documents':
        return <DocumentsCodexView />;
      case 'timetable':
        return <TimetableView />;
      case 'journals':
        return <JournalsListView />;
      case 'lesson-detail':
        return <LessonDetailView />;
      case 'professor-journal-editor':
        return <ProfessorJournalEditor />;
      case 'subject-detail':
        return <SubjectDetailView />;
      case 'houses':
        return <HousesView />;
      case 'ceremony':
        return <CeremonyView />;
      case 'academic':
        return <AcademicView />;
      case 'rune-workshop':
        return <RuneWorkshopView />;
      case 'map':
        return <MapView />;
      case 'markethall':
        return <MarkethallView />;
      case 'bank':
        return <BankView />;
      case 'profile':
        return <ProfileView />;
      case 'lore':
        return <LoreArchiveView />;
      case 'raven-post':
        return <RavenPostView />;
      case 'admin':
        return <AdminCMSView />;
      case 'gazette':
        return <GazetteView />;
      case 'gazette-reader':
        return <GazetteFlipbook />;
      case 'gazette-archive':
        return <GazetteArchiveView />;
      case 'gazette-panel':
        return <GazettePanelView />;
      case 'exams':
        return <ExamCenterView />;
      case 'exam-taking':
        return <ExamTakingView />;
      case 'exam-result':
        return <ExamResultView />;
      case 'exam-creator':
        return <ExamCreatorView />;
      case 'exam-grading':
        return <ExamGradingView />;
      case 'exam-bank':
        return <ExamBankView />;
      case 'homework':
        return <HomeworkCenterView />;
      case 'homework-detail':
        return <HomeworkDetailView />;
      case 'homework-creator':
        return <HomeworkCreatorView />;
      case 'homework-grading':
        return <HomeworkGradingView />;
      case 'memory':
        return <MemoryMainView />;
      case 'absence-chamber':
        return <AbsenceChamberView />;
      case 'enrollment-chamber':
        return <EnrollmentChamberView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className={`durmstrang-app world-${worldState.weather.toLowerCase()} citadel-${worldState.citadelState.toLowerCase()} presentation-${effectiveMode.toLowerCase()}`}>
      {prologueRequired && (
        <Suspense fallback={viewLoadingFallback}>
          {['teacher', 'professor'].includes(currentUser?.role)
            ? <TeacherPrologueView onComplete={() => setPrologueRequired(false)} />
            : <PrologueView onComplete={() => setPrologueRequired(false)} />}
        </Suspense>
      )}
      {/* Particle Snow Canvas */}
      <SnowCanvas />

      {/* Dynamic Aurora Borealis Canvas */}
      <AuroraCanvas
        enabled={auroraEnabled && effectiveMode !== 'QUIET' && worldState.weather !== 'STORM' && worldState.weather !== 'BLIZZARD'}
        intensity={(() => {
          if (worldState.weather === 'HEAVY_SNOW') return 0.12;
          if (worldState.weather === 'FOG') return 0.08;
          const base = worldState.skyState === 'AURORA' ? (effectiveMode === 'FULL' ? 1 : 0.55) : 0.18;
          const moonBonus = worldState.moonPhase === 'FULL_MOON' ? 1.35 : worldState.moonPhase === 'WAXING_GIBBOUS' || worldState.moonPhase === 'WANING_GIBBOUS' ? 1.1 : 1;
          return Math.min(1, base * moonBonus);
        })()}
      />
      <CitadelAstrolabe hidden={activeView === 'map'} />

      {/* Global Notification Toast — kept above the Magiczna Północ indicator */}
      {notification && (
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            bottom: '82px',
            right: '18px',
            background: 'rgba(10, 14, 22, 0.96)',
            border: typeof notification === 'object' && notification?.type === 'success' ? '1px solid #10b981' : typeof notification === 'object' && notification?.type === 'warning' ? '1px solid #f59e0b' : '1px solid var(--gold-ancient)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.85), 0 0 15px rgba(197, 159, 78, 0.3)',
            borderRadius: '8px',
            padding: '1rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            zIndex: 99999,
            animation: 'slideUp 0.3s ease-out',
            boxSizing: 'border-box',
            maxWidth: 'min(420px, calc(100vw - 36px))'
          }}
        >
          <Sparkles size={20} color={typeof notification === 'object' && notification?.type === 'success' ? '#10b981' : typeof notification === 'object' && notification?.type === 'warning' ? '#f59e0b' : 'var(--gold-ancient)'} />
          <div style={{ minWidth: 0, fontSize: '0.88rem', color: '#f3f4f6', lineHeight: 1.4 }}>
            {typeof notification === 'string' ? (
              notification
            ) : (
              <>
                {notification.title && <div style={{ fontWeight: 700, color: 'var(--gold-ancient)', marginBottom: '0.2rem' }}>{notification.title}</div>}
                <div>{notification.message || ''}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lumos Torchlight Cursor Trail */}
      <TorchCursor enabled={torchEnabled} size={300} />

      {/* Nordic Wand Micro-Sparks Click Effect */}
      <WandSparks enabled={true} />

      {/* Main 3-Column Portal Container */}
      <div id="portal-wrapper">
        {/* =========================================================================
            1. STICKY NAVIGATION — sits at the very top of the page, transparent
               over the hero castle, condensing to blackened iron on scroll.
            ========================================================================= */}
        <Navbar />

        {/* =========================================================================
            2. MONUMENTAL HERO SECTION (castle backdrop rises behind the navbar)
            ========================================================================= */}
        <MonumentalHero onOpenCreationModal={() => openAuthModal('register')} />

        {/* =========================================================================
            3. RUNIC NEWS TICKER / MARQUEE BAR
            ========================================================================= */}
        <div className="portal-ticker-bar">
          <div className="ticker-label-badge">
            <span className="ticker-rune">ᛞ</span>
            <span className="ticker-title">EDYKT DYREKCJI:</span>
          </div>
          <div className="ticker-track-container">
            <div className="ticker-content">
              +++ XIX ROK SZKOLNY W TOKU • DZIENNIKI LEKCYJNE & ARCHIWUM DISCORD AKTYWNE • PUCHAR PÓŁNOCY: ᚦ REINHALL • ᛉ BJÖRNHALL • ᚱ RAVNHEIM • ᛞ OTERGARD • WARSZTAT RUNICZNY (GALDRASTOFA) & KOCIOŁ ALCHEMII OTWARTE +++
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. MAIN 3-COLUMN PORTAL GRID (LEFT MENU, CENTER VIEW, RIGHT MENU)
            ========================================================================= */}
        {activeView === 'map' ? (
          /* Mapa — pełny viewport, przykrywa navbar i stopkę */
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 200,
            background: '#030508',
          }}>
            <Suspense fallback={viewLoadingFallback}>
              {renderActiveView()}
            </Suspense>
            <button
              onClick={() => setActiveView('home')}
              title="Opuść mapę (Escape)"
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                zIndex: 201,
                background: 'rgba(7,10,16,0.88)',
                border: '1px solid rgba(197,159,78,0.5)',
                borderRadius: '6px',
                color: 'var(--gold-ancient)',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                padding: '6px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(197,159,78,0.15)';
                e.currentTarget.style.borderColor = 'var(--gold-ancient)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(7,10,16,0.88)';
                e.currentTarget.style.borderColor = 'rgba(197,159,78,0.5)';
              }}
            >
              ✕ OPUŚĆ MAPĘ
            </button>
          </div>
        ) : (
          <div className="portal-main-grid">
            {/* Left Column Sidebar */}
            <PortalLeftSidebar onOpenCreationModal={() => openAuthModal('register')} />

            {/* Center Column (Active View / Scrolls) */}
            <main style={{ minWidth: 0 }}>
              <Suspense fallback={viewLoadingFallback}>
                {renderActiveView()}
              </Suspense>
            </main>

            {/* Right Column Sidebar */}
            <PortalRightSidebar
              auroraEnabled={auroraEnabled}
              setAuroraEnabled={setAuroraEnabled}
              torchEnabled={torchEnabled}
              setTorchEnabled={setTorchEnabled}
            />
          </div>
        )}

        {/* Character Creation Modal */}
        <CharacterCreationModal
          isOpen={creationModalOpen}
          onClose={() => setCreationModalOpen(false)}
        />

        {/* Global Identity & Auth Modal (Users DB & Accounts) */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Password Recovery Modal */}
        <PasswordRecoveryModal
          isOpen={passwordRecoveryModalOpen}
          onClose={() => setPasswordRecoveryModalOpen(false)}
        />

        {/* Email / Raven Inbox Modal */}
        <EmailInboxModal
          isOpen={emailInboxOpen}
          onClose={() => setEmailInboxOpen(false)}
        />

        {/* Discord Lesson Simulator Modal */}
        <DiscordLessonSimulatorModal
          isOpen={discordSimulatorOpen}
          onClose={() => setDiscordSimulatorOpen(false)}
        />

        {/* Global Arcane Command Palette & Teleporter Modal (Ctrl+K) */}
        <CommandPaletteModal
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        <AdeptBelt hidden={prologueRequired !== false || activeView === 'map'} />

        {/* Floating Quick Arcane Compass Trigger Button */}
        <button
          onClick={() => {
            playRuneChime();
            setCommandPaletteOpen(true);
          }}
          title="Magiczny Kompas Cytadeli (Naciśnij Ctrl + K lub /)"
          style={{
            position: 'fixed',
            bottom: '25px',
            left: '25px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(28, 35, 48, 0.95), rgba(10, 14, 22, 0.98))',
            border: '2px solid var(--gold-ancient)',
            color: 'var(--gold-ancient)',
            fontSize: '1.4rem',
            fontFamily: 'serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 99990,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.85), 0 0 15px rgba(197, 159, 78, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12) rotate(15deg)';
            e.currentTarget.style.borderColor = 'var(--gold-glow)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.95), 0 0 25px rgba(243, 217, 149, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.borderColor = 'var(--gold-ancient)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.85), 0 0 15px rgba(197, 159, 78, 0.4)';
          }}
        >
          ᛞ
        </button>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
