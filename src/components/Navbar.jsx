import React from 'react';
import {
  Search,
  Mail,
  Bell,
  ChevronDown,
  User,
  Building,
  ShoppingBag,
  Settings,
  Volume2,
  VolumeX,
  CloudSnow,
  LogIn,
  X,
  Menu,
  Shield
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { useNavbarChrome } from './navbar/useNavbarChrome';
import { NavItem } from './navbar/NavItem';
import { NavDropdown } from './navbar/NavDropdown';
import { MobileDrawer } from './navbar/MobileDrawer';
import { PRIMARY_NAV, RESTRICTED_VIEWS, isVisible, isActive } from './navbar/navConfig';
import './navbar/Navbar.css';

const ROMAN = 'VIII|VII|XII|XI|IX|VI|IV|III|II|I|X|V';

/** "Rok IV • Semestr Zimowy" / "Klasa II • …" → "Adept Klasy IV". */
function parseClassYear(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.match(new RegExp(`\\b(${ROMAN})\\b`));
  if (m) return `Adept Klasy ${m[1]}`;
  if (/sta[żz]/i.test(raw)) return 'Staż Zawodowy';
  return null;
}

export const Navbar = () => {
  const {
    activeView,
    setActiveView,
    currentUser,
    currentRole,
    houses,
    snowEnabled,
    setSnowEnabled,
    setAuthModalOpen,
    logoutUser,
    emails,
    ravenMessages,
    setEmailInboxOpen,
    showNotification,
    navigateToMemory
  } = useSchool();

  const { soundEnabled, setSoundEnabled, playWandSwoosh } = useSound();
  const {
    rootRef,
    openMenu,
    toggleMenu,
    setOpenMenu,
    drawerOpen,
    setDrawerOpen,
    scrolled,
    atTop,
    closeAll
  } = useNavbarChrome();

  const session = { currentUser, currentRole };
  const userHouse = currentUser?.house ? houses?.[currentUser.house] : null;
  const unreadEmails = emails.filter((e) => !e.read).length;
  const unreadRavens = (ravenMessages || []).filter((m) => !m.read).length;

  const handleNavigate = (item) => {
    playWandSwoosh();

    if (item.view === 'memory') {
      if (navigateToMemory) navigateToMemory(item.memoryTab || 'overview');
      else setActiveView('memory');
      closeAll();
      return;
    }

    if (!currentUser && RESTRICTED_VIEWS.includes(item.view)) {
      setAuthModalOpen(true);
      showNotification(
        'Wymagane Logowanie',
        'Dzienniki lekcyjne i prywatne komnaty są dostępne wyłącznie dla zalogowanych adeptów.',
        'warning'
      );
      closeAll();
      return;
    }

    if (item.view === 'ceremony' && currentRole !== 'student') {
      showNotification(
        'Rytuał Niedostępny',
        'Kamień Przysięgi przydziela wyłącznie adeptów. Kadra i Dyrekcja nie należą do Zakonów.',
        'warning'
      );
      closeAll();
      return;
    }

    setActiveView(item.view);
    if (item.hash) window.location.hash = item.hash;
    closeAll();
  };

  const roleLabel = currentUser?.role === 'admin'
    ? (currentUser?.gender === 'czarodziejka' ? 'Arcymistrzyni Cytadeli' : 'Arcymistrz Cytadeli')
    : currentUser?.role === 'professor'
      ? 'Profesor Katedry'
      : parseClassYear(currentUser?.classYear || currentUser?.class_year)
        || (userHouse ? `Adept ${userHouse.name}` : 'Adept Durmstrang');

  return (
    <header
      ref={rootRef}
      className="tmd-nav"
      data-scrolled={scrolled}
      data-transparent={atTop ? 'true' : undefined}
    >
      <div className="tmd-nav__inner">
        {/* Brand */}
        <button type="button" className="tmd-nav__brand" onClick={() => handleNavigate({ view: 'home' })}>
          <img className="tmd-nav__herb" src="/tmd_herb.webp" alt="Herb Twierdzy Magii Durmstrang" />
          <span className="tmd-nav__wordmark">
            <span className="tmd-nav__wordmark-top">Twierdza Magii</span>
            <b>Durmstrang</b>
          </span>
        </button>

        {/* Primary navigation (desktop) — 6 items */}
        <nav className="tmd-nav__primary" aria-label="Nawigacja główna">
          {PRIMARY_NAV.filter((entry) => isVisible(entry, session)).map((entry) =>
            entry.children ? (
              <NavDropdown
                key={entry.id}
                entry={entry}
                session={session}
                activeView={activeView}
                isOpen={openMenu === entry.id}
                onToggle={toggleMenu}
                onSelect={handleNavigate}
              />
            ) : (
              <NavItem
                key={entry.id}
                entry={entry}
                active={isActive(entry, activeView, session)}
                onClick={() => handleNavigate(entry)}
              />
            )
          )}
        </nav>

        {/* Right cluster */}
        <div className="tmd-nav__cluster">
          <button
            type="button"
            className="tmd-nav__icon"
            title="Magiczny Kompas Cytadeli (Szukaj / Teleportuj — Ctrl + K)"
            aria-label="Szukaj"
            onClick={() => {
              playWandSwoosh();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
          >
            <Search size={17} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            className="tmd-nav__icon"
            title="Skrzynka Poczty & Listów Rekrutacyjnych"
            aria-label="Poczta"
            onClick={() => {
              playWandSwoosh();
              setEmailInboxOpen(true);
            }}
          >
            <Mail size={17} strokeWidth={1.7} />
            {unreadEmails > 0 && <span className="tmd-nav__count">{unreadEmails}</span>}
          </button>

          <button
            type="button"
            className="tmd-nav__icon"
            title="Krucza Poczta & Powiadomienia"
            aria-label="Powiadomienia"
            onClick={() => handleNavigate({ view: 'raven-post' })}
          >
            <Bell size={17} strokeWidth={1.7} />
            <span className="tmd-nav__count" data-zero={unreadRavens === 0 ? 'true' : undefined}>
              {unreadRavens}
            </span>
          </button>

          <span className="tmd-nav__sep" aria-hidden="true" />

          {currentUser ? (
            <div className="tmd-nav__user">
              <button
                type="button"
                className="tmd-nav__user-trigger"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'user'}
                onClick={() => toggleMenu('user')}
                style={userHouse ? { borderColor: userHouse.colors.border } : undefined}
              >
                <img
                  className="tmd-nav__user-avatar"
                  src={currentUser?.avatar || '/tmd_herb.webp'}
                  alt={currentUser?.fullName || 'Adept'}
                />
                <span className="tmd-nav__user-meta">
                  <b>{currentUser?.fullName || currentUser?.name}</b>
                  <span style={userHouse ? { color: userHouse.colors.secondary } : undefined}>
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown size={13} className="tmd-nav__chevron" />
              </button>

              {openMenu === 'user' && (
                <div className="tmd-nav__panel tmd-nav__panel--right" role="menu" aria-label="Konto">
                  <div className="tmd-nav__user-head">
                    <b>{currentUser?.fullName}</b>
                    <span>{currentUser?.title || roleLabel}</span>
                  </div>

                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => handleNavigate({ view: 'profile' })}>
                    <span className="tmd-nav__row-chip"><User size={14} /></span>
                    <span>Mój Profil & Ekwipunek</span><span />
                  </button>
                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => handleNavigate({ view: 'bank' })}>
                    <span className="tmd-nav__row-chip"><Building size={14} /></span>
                    <span>Bank Skirnirów</span><span />
                  </button>
                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => handleNavigate({ view: 'markethall' })}>
                    <span className="tmd-nav__row-chip"><ShoppingBag size={14} /></span>
                    <span>Rynek Kaupangr</span><span />
                  </button>
                  {(currentRole === 'admin' || currentRole === 'professor') && (
                    <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => handleNavigate({ view: 'admin' })}>
                      <span className="tmd-nav__row-chip"><Settings size={14} /></span>
                      <span>Panel CMS</span><span />
                    </button>
                  )}

                  <div className="tmd-nav__panel-divider" />

                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => setSoundEnabled(!soundEnabled)}>
                    <span className="tmd-nav__row-chip">{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</span>
                    <span>Dźwięki Cytadeli</span>
                    <span className="tmd-nav__toggle" data-on={soundEnabled || undefined}>{soundEnabled ? 'WŁ.' : 'WYŁ.'}</span>
                  </button>
                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => setSnowEnabled(!snowEnabled)}>
                    <span className="tmd-nav__row-chip"><CloudSnow size={14} /></span>
                    <span>Śnieżyca Północy</span>
                    <span className="tmd-nav__toggle" data-on={snowEnabled || undefined}>{snowEnabled ? 'WŁ.' : 'WYŁ.'}</span>
                  </button>

                  <div className="tmd-nav__panel-divider" />

                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => { setOpenMenu(null); setAuthModalOpen(true); }}>
                    <span className="tmd-nav__row-chip"><Shield size={14} /></span>
                    <span>Przełącz / Utwórz Konto</span><span />
                  </button>
                  <button type="button" role="menuitem" className="tmd-nav__row" onClick={() => { setOpenMenu(null); logoutUser(); }}>
                    <span className="tmd-nav__row-chip"><X size={14} /></span>
                    <span>Złóż Pieczęć (Wyloguj)</span><span />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="tmd-nav__login"
              onClick={() => {
                playWandSwoosh();
                setAuthModalOpen(true);
              }}
            >
              <LogIn size={15} strokeWidth={1.7} />
              <span>Zaloguj</span>
            </button>
          )}

          <button
            type="button"
            className="tmd-nav__burger"
            aria-label={drawerOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={drawerOpen}
            aria-controls="tmd-nav-drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <MobileDrawer session={session} activeView={activeView} onSelect={handleNavigate} />
      )}
    </header>
  );
};
