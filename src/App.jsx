import React, { useState, useEffect } from 'react';
import { useSchool } from './context/SchoolContext';
import { useSound } from './context/SoundContext';
import { Navbar } from './components/Navbar';
import { SnowCanvas } from './components/SnowCanvas';
import { AuroraCanvas } from './components/AuroraCanvas';
import { TorchCursor } from './components/TorchCursor';
import { Footer } from './components/Footer';
import { PortalLeftSidebar } from './components/PortalLeftSidebar';
import { PortalRightSidebar } from './components/PortalRightSidebar';
import { MonumentalHero } from './components/MonumentalHero';
import { CharacterCreationModal } from './views/CharacterCreationModal';
import { AuthModal } from './components/AuthModal';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';
import { EmailInboxModal } from './components/EmailInboxModal';
import { DiscordLessonSimulatorModal } from './components/DiscordLessonSimulatorModal';

// Views
import { HomeView } from './views/HomeView';
import { HousesView } from './views/HousesView';
import { CeremonyView } from './views/CeremonyView';
import { AcademicView } from './views/AcademicView';
import { RuneWorkshopView } from './views/RuneWorkshopView';
import { MapView } from './views/MapView';
import { MarkethallView } from './views/MarkethallView';
import { ProfileView } from './views/ProfileView';
import { LoreArchiveView } from './views/LoreArchiveView';
import { RavenPostView } from './views/RavenPostView';
import { AdminCMSView } from './views/AdminCMSView';
import { JournalsListView } from './views/JournalsListView';
import { LessonDetailView } from './views/LessonDetailView';
import { ProfessorJournalEditor } from './views/ProfessorJournalEditor';
import { SubjectDetailView } from './views/SubjectDetailView';
import { TimetableView } from './views/TimetableView';
import { BankView } from './views/BankView';
import { RestrictedAccessView } from './views/RestrictedAccessView';

import { Sparkles, Info, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

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
  'admin': 'Komnat Najwyższej Rady Dyrekcji'
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
    passwordRecoveryModalOpen,
    setPasswordRecoveryModalOpen,
    emailInboxOpen,
    setEmailInboxOpen,
    discordSimulatorOpen,
    setDiscordSimulatorOpen,
    currentUser
  } = useSchool();

  const { playRuneChime } = useSound();

  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [auroraEnabled, setAuroraEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(true);

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
    // Widoki wymagające logowania (Dzienniki, Gry i Warsztaty, Bank, Rynek, Profil, Poczta, CMS)
    // PUBLICZNE: home, houses, map, lore, academic, subject-detail, timetable
    const isRestricted = ['journals', 'lesson-detail', 'professor-journal-editor', 'ceremony', 'rune-workshop', 'markethall', 'bank', 'profile', 'raven-post', 'admin'].includes(activeView);
    if (!currentUser && isRestricted) {
      return <RestrictedAccessView targetName={RESTRICTED_VIEW_LABELS[activeView] || 'tych komnat'} />;
    }

    // Role-specific view guards
    if (activeView === 'admin' && currentUser?.role !== 'admin') {
      return <RestrictedAccessView targetName="Komnat Najwyższej Rady Dyrekcji (Wymagana rola: Arcymistrz Dyrekcji)" />;
    }
    if (activeView === 'professor-journal-editor' && currentUser?.role !== 'admin' && currentUser?.role !== 'professor') {
      return <RestrictedAccessView targetName="panelu redagowania dziennika (Dostępne dla Profesorów i Dyrekcji)" />;
    }

    switch (activeView) {
      case 'home':
        return <HomeView />;
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
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="durmstrang-app">
      {/* Particle Snow Canvas */}
      <SnowCanvas />

      {/* Dynamic Aurora Borealis Canvas */}
      <AuroraCanvas enabled={auroraEnabled} intensity={0.65} />

      {/* Lumos Torchlight Cursor Trail */}
      <TorchCursor enabled={torchEnabled} size={300} />

      {/* Main 3-Column Portal Container */}
      <div id="portal-wrapper">
        {/* =========================================================================
            1. MONUMENTAL HERO SECTION
            ========================================================================= */}
        <MonumentalHero onOpenCreationModal={() => setCreationModalOpen(true)} />

        {/* Sticky Streamlined Navigation Bar */}
        <Navbar />

        {/* =========================================================================
            2. RUNIC NEWS TICKER / MARQUEE BAR
            ========================================================================= */}
        <div className="portal-ticker-bar">
          <div className="ticker-label">
            <span>ᛞ</span> EDYKT DYREKCJI:
          </div>
          <div className="ticker-content">
            +++ XIX ROK SZKOLNY W TOKU • DZIENNIKI LEKCYJNE & ARCHIWUM DISCORD AKTYWNE • PUCHAR PÓŁNOCY: 🦌 REINHALL • 🐻 BJÖRNHALL • 🐦 RAVNHEIM • 🦦 OTERGARD • WARSZTAT RUNICZNY (GALDRASTOFA) & KOCIOŁ ALCHEMII OTWARTE +++
          </div>
        </div>

        {/* =========================================================================
            3. MAIN 3-COLUMN PORTAL GRID (LEFT MENU, CENTER VIEW, RIGHT MENU)
            ========================================================================= */}
        <div className="portal-main-grid">
          {/* Left Column Sidebar */}
          <PortalLeftSidebar onOpenCreationModal={() => setCreationModalOpen(true)} />

          {/* Center Column (Active View / Scrolls) */}
          <main style={{ minWidth: 0 }}>
            {renderActiveView()}
          </main>

          {/* Right Column Sidebar */}
          <PortalRightSidebar
            auroraEnabled={auroraEnabled}
            setAuroraEnabled={setAuroraEnabled}
            torchEnabled={torchEnabled}
            setTorchEnabled={setTorchEnabled}
          />
        </div>

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

        {/* Global Notification Toast */}
        {notification && (
          <div
            className="toast-notification"
            style={{
              position: 'fixed',
              bottom: '25px',
              right: '25px',
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
              maxWidth: '420px'
            }}
          >
            <Sparkles size={20} color={typeof notification === 'object' && notification?.type === 'success' ? '#10b981' : typeof notification === 'object' && notification?.type === 'warning' ? '#f59e0b' : 'var(--gold-ancient)'} />
            <div style={{ fontSize: '0.88rem', color: '#f3f4f6', lineHeight: 1.4 }}>
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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
