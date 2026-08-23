import React, { useState, useRef, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Compass,
  Shield,
  BookOpen,
  ShoppingBag,
  Scroll,
  Mail,
  User,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  CloudSnow,
  ChevronDown,
  Menu,
  X,
  Coins,
  Flame,
  Zap,
  MapPin,
  LogIn,
  Calendar,
  Building,
  Search
} from 'lucide-react';

export const Navbar = () => {
  const {
    activeView,
    setActiveView,
    currentUser,
    currentRole,
    studentProfile,
    houses,
    snowEnabled,
    setSnowEnabled,
    ravenMessages,
    setActiveHouseTab,
    setAuthModalOpen,
    logoutUser,
    emails,
    setEmailInboxOpen,
    showNotification
  } = useSchool();

  const { soundEnabled, setSoundEnabled, playWandSwoosh } = useSound();

  // Dropdowns state
  const [openDropdown, setOpenDropdown] = useState(null); // 'academy' | 'explore' | 'settings' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadMessagesCount = ravenMessages.filter(m => !m.read).length;
  const userHouse = currentUser?.house ? houses[currentUser.house] : null;

  const handleNavClick = (view, houseTab = null) => {
    playWandSwoosh();
    const restrictedViews = ['journals', 'lesson-detail', 'professor-journal-editor', 'ceremony', 'rune-workshop', 'markethall', 'bank', 'profile', 'raven-post', 'admin'];
    if (!currentUser && restrictedViews.includes(view)) {
      setAuthModalOpen(true);
      showNotification('Wymagane Logowanie', 'Dzienniki lekcyjne i prywatne komnaty są dostępne wyłącznie dla zalogowanych adeptów.', 'warning');
      setOpenDropdown(null);
      setMobileMenuOpen(false);
      return;
    }
    if (houseTab) setActiveHouseTab(houseTab);
    setActiveView(view);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header
      ref={navRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(8, 11, 16, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85)'
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0.45rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem'
        }}
      >
        {/* =========================================================================
            1. CLEAN BRAND LOGO WITH OFFICIAL TMD HERB
            ========================================================================= */}
        <div
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          <img
            src="/tmd_herb.png"
            alt="Herb Twierdzy Magii Durmstrang"
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(197, 159, 78, 0.45))'
            }}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#ffffff',
                lineHeight: 1.1
              }}
            >
              DURMSTRANG
            </div>
            <div
              style={{
                fontSize: '0.62rem',
                color: 'var(--gold-ancient)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Twierdza Magii (TMD)
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. STREAMLINED CORE NAVIGATION (CLEAN & SPACIOUS)
            ========================================================================= */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'nowrap'
          }}
        >
          {/* Main Home Link */}
          <button
            onClick={() => handleNavClick('home')}
            style={{
              padding: '0.4rem 0.7rem',
              background: activeView === 'home' ? 'rgba(197, 159, 78, 0.18)' : 'transparent',
              border: activeView === 'home' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
              borderRadius: '5px',
              color: activeView === 'home' ? '#ffffff' : '#b0b7c3',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              fontWeight: activeView === 'home' ? 700 : 500,
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            Wrota Cytadeli
          </button>

          {/* Dzienniki Lekcyjne Link (Public) */}
          <button
            onClick={() => handleNavClick('journals')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.7rem',
              background: ['journals', 'lesson-detail', 'professor-journal-editor'].includes(activeView) ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              border: ['journals', 'lesson-detail', 'professor-journal-editor'].includes(activeView) ? '1px solid var(--gold-ancient)' : '1px solid transparent',
              borderRadius: '5px',
              color: ['journals', 'lesson-detail', 'professor-journal-editor'].includes(activeView) ? '#ffffff' : '#f7dca0',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Scroll size={13} color="var(--gold-glow)" />
            <span>Dzienniki</span>
          </button>

          {/* Plan Lekcji Link (Public) */}
          <button
            onClick={() => handleNavClick('timetable')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.7rem',
              background: activeView === 'timetable' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : '1px solid transparent',
              borderRadius: '5px',
              color: activeView === 'timetable' ? '#ffffff' : '#e2e8f0',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={13} color="var(--gold-ancient)" />
            <span>Plan Lekcji</span>
          </button>

          {/* Academy Dropdown Hub */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'academy' ? null : 'academy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.7rem',
                background: ['academic', 'houses', 'ceremony', 'rune-workshop', 'rules-guide'].includes(activeView) ? 'rgba(197, 159, 78, 0.18)' : 'transparent',
                border: ['academic', 'houses', 'ceremony', 'rune-workshop', 'rules-guide'].includes(activeView) ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                borderRadius: '5px',
                color: ['academic', 'houses', 'ceremony', 'rune-workshop', 'rules-guide'].includes(activeView) ? '#ffffff' : '#b0b7c3',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.88rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={13} color="var(--gold-ancient)" />
              <span>Akademia</span>
              <ChevronDown size={12} style={{ transform: openDropdown === 'academy' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === 'academy' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.5rem',
                  width: '240px',
                  background: 'rgba(12, 16, 24, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '8px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.9)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                {currentUser && (
                  <button
                    onClick={() => handleNavClick('academic')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: activeView === 'academic' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                      borderRadius: '4px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={14} color="var(--gold-ancient)" /> 15 Katedr & Lekcje
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('timetable')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'timetable' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                    borderRadius: '4px',
                    border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="var(--gold-glow)" /> Plan Lekcji & Sale
                  </span>
                  <span style={{ fontSize: '0.62rem', background: 'var(--gold-ancient)', color: '#090c12', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    GRAFIK
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('houses')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'houses' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    borderRadius: '4px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={14} color="var(--gold-ancient)" /> Cztery Zakony
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleNavClick('documents');
                    window.location.hash = '#/dekrety';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'documents' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                    borderRadius: '4px',
                    border: activeView === 'documents' ? '1px solid var(--gold-ancient)' : 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scroll size={14} color="var(--gold-ancient)" /> Dekrety & Wizytacje
                  </span>
                  <span style={{ fontSize: '0.62rem', background: 'var(--gold-ancient)', color: '#090c12', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                    KODEKS
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('rules-guide')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'rules-guide' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    borderRadius: '4px',
                    border: activeView === 'rules-guide' ? '1px solid var(--gold-ancient)' : 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={14} color="var(--gold-glow)" /> Pakt 1294 & Taryfikator
                  </span>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(197, 159, 78, 0.2)', color: 'var(--gold-glow)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    PAKT
                  </span>
                </button>

                {currentUser && (
                  <>
                    <button
                      onClick={() => handleNavClick('rune-workshop')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        background: activeView === 'rune-workshop' ? 'rgba(46, 196, 182, 0.18)' : 'rgba(46, 196, 182, 0.08)',
                        borderRadius: '4px',
                        border: '1px solid rgba(46, 196, 182, 0.25)',
                        color: '#2ec4b6',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} color="#2ec4b6" /> Warsztat Run (Galdr)
                      </span>
                      <span style={{ fontSize: '0.62rem', background: '#2ec4b6', color: '#090c12', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        NOWOŚĆ
                      </span>
                    </button>

                    <button
                      onClick={() => handleNavClick('ceremony')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        background: activeView === 'ceremony' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                        borderRadius: '4px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Flame size={14} color="var(--gold-ancient)" /> Kamień Przysięgi
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Exploration Dropdown Hub */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'explore' ? null : 'explore')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.7rem',
                background: ['map', 'markethall', 'lore', 'bank'].includes(activeView) ? 'rgba(197, 159, 78, 0.18)' : 'transparent',
                border: ['map', 'markethall', 'lore', 'bank'].includes(activeView) ? '1px solid var(--gold-ancient)' : '1px solid transparent',
                borderRadius: '5px',
                color: ['map', 'markethall', 'lore', 'bank'].includes(activeView) ? '#ffffff' : '#b0b7c3',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.88rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Compass size={13} color="var(--gold-ancient)" />
              <span>Eksploracja</span>
              <ChevronDown size={12} style={{ transform: openDropdown === 'explore' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === 'explore' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.5rem',
                  width: '230px',
                  background: 'rgba(12, 16, 24, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '8px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.9)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <button
                  onClick={() => handleNavClick('map')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'map' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    borderRadius: '4px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <MapPin size={14} color="var(--gold-ancient)" /> Mapa Twierdzy (16 Sal)
                </button>

                {currentUser && (
                  <button
                    onClick={() => handleNavClick('bank')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.8rem',
                      background: activeView === 'bank' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
                      borderRadius: '4px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <Building size={14} color="var(--gold-ancient)" /> Bank Skirnirów (Skarbiec)
                  </button>
                )}

                {currentUser && (
                  <button
                    onClick={() => handleNavClick('markethall')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.8rem',
                      background: activeView === 'markethall' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                      borderRadius: '4px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <ShoppingBag size={14} color="var(--gold-ancient)" /> Rynek Kaupangr & Wyprawki
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('lore')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.8rem',
                    background: activeView === 'lore' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
                    borderRadius: '4px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Scroll size={14} color="var(--gold-ancient)" /> Kroniki i Bestiariusz
                </button>
              </div>
            )}
          </div>

          {/* Admin CMS (Only for Prof/Admin) */}
          {(currentRole === 'admin' || currentRole === 'professor') && (
            <button
              onClick={() => handleNavClick('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                background: activeView === 'admin' ? 'rgba(197, 159, 78, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: activeView === 'admin' ? '1px solid var(--gold-glow)' : '1px solid rgba(197, 159, 78, 0.3)',
                borderRadius: '5px',
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Settings size={12} color="var(--gold-glow)" />
              <span>Panel CMS</span>
            </button>
          )}
        </nav>

        {/* =========================================================================
            3. CLEAN PROFILE & UTILITY CLUSTER
            ========================================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Quick Arcane Search / Command Palette Button */}
          <button
            onClick={() => {
              playWandSwoosh();
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            title="Magiczny Kompas Cytadeli (Szukaj / Teleportuj - Ctrl + K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(20, 26, 38, 0.85)',
              border: '1px solid rgba(197, 159, 78, 0.35)',
              borderRadius: '20px',
              padding: '0.3rem 0.65rem',
              color: '#f3e5c8',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-glow)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(197, 159, 78, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(197, 159, 78, 0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Search size={13} color="var(--gold-ancient)" />
            <span className="hidden-mobile">Szukaj</span>
            <kbd style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '3px', padding: '0.08rem 0.3rem', color: '#9ca3af' }}>
              Ctrl K
            </kbd>
          </button>

          {/* Quick Sound & Snow Compact Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 20, 30, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '0.15rem 0.3rem',
              gap: '0.15rem',
              flexShrink: 0
            }}
          >
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Dźwięki włączone' : 'Włącz dźwięki'}
              style={{
                background: 'none',
                border: 'none',
                color: soundEnabled ? 'var(--gold-glow)' : '#6b7280',
                padding: '0.2rem 0.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
            <button
              onClick={() => setSnowEnabled(!snowEnabled)}
              title={snowEnabled ? 'Śnieg aktywny' : 'Włącz śnieg'}
              style={{
                background: 'none',
                border: 'none',
                color: snowEnabled ? '#a4c8e1' : '#6b7280',
                padding: '0.2rem 0.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CloudSnow size={13} />
            </button>
          </div>

          {/* Student Currency Pill */}
          {currentRole === 'student' && (
            <div
              onClick={() => handleNavClick('markethall')}
              title="Twoje Skirniry (Waluta Cytadeli)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(20, 26, 38, 0.8)',
                border: '1px solid rgba(197, 159, 78, 0.35)',
                borderRadius: '20px',
                padding: '0.3rem 0.65rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <Coins size={13} color="var(--gold-ancient)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#f7dca0', fontSize: '0.82rem' }}>
                {studentProfile.currency}
              </span>
            </div>
          )}

          {/* Email / Raven Inbox Button with Unread Badge */}
          <button
            onClick={() => {
              playWandSwoosh();
              setEmailInboxOpen(true);
            }}
            title="Skrzynka Poczty & Listów Rekrutacyjnych"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(16, 21, 30, 0.85)',
              border: '1px solid rgba(197, 159, 78, 0.35)',
              color: 'var(--gold-glow)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <Mail size={15} />
            {emails.filter(e => !e.read).length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: 'var(--ruby-blood)',
                  color: '#ffffff',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {emails.filter(e => !e.read).length}
              </span>
            )}
          </button>

          {/* Profile Pill (if logged in) OR Login Button (if guest) */}
          {currentUser ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(16, 21, 30, 0.85)',
                  border: userHouse ? `1px solid ${userHouse.colors.border}` : '1px solid rgba(197, 159, 78, 0.35)',
                  borderRadius: '24px',
                  padding: '0.2rem 0.65rem 0.2rem 0.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: openDropdown === 'user' ? '0 0 15px rgba(197, 159, 78, 0.35)' : 'none'
                }}
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser?.fullName}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--gold-ancient)'
                  }}
                />
                <div style={{ lineHeight: 1.1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)', maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.name || currentUser?.fullName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: userHouse ? userHouse.colors.secondary : currentUser?.role === 'admin' ? '#ff9e9e' : currentUser?.role === 'professor' ? '#d8c2ff' : 'var(--gold-ancient)', maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.role === 'admin' ? '🛡️ Arcymistrz' : currentUser?.role === 'professor' ? '📖 Profesor' : userHouse ? userHouse.name : '🎓 Adept'}
                  </div>
                </div>
                <ChevronDown size={11} color="var(--gold-ancient)" style={{ transform: openDropdown === 'user' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </div>

            {/* User Dropdown Menu */}
            {openDropdown === 'user' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '240px',
                  background: 'rgba(10, 14, 22, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '8px',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.95)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  zIndex: 200,
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                {/* User Info Header */}
                <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.2rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {currentUser?.fullName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-glow)' }}>
                    {currentUser?.title || (currentUser?.role === 'admin' ? 'Arcymistrzyni Cytadeli' : 'Adept Durmstrang')}
                  </div>
                </div>

                <button
                  onClick={() => handleNavClick('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.8rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#f1f5f9',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <User size={14} color="var(--gold-ancient)" /> Mój Profil & Ekwipunek
                </button>

                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    setAuthModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.8rem',
                    background: 'rgba(197, 159, 78, 0.1)',
                    border: '1px solid rgba(197, 159, 78, 0.2)',
                    borderRadius: '4px',
                    color: 'var(--gold-glow)',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Shield size={14} color="var(--gold-glow)" /> Przełącz / Utwórz Konto
                </button>

                <button
                  onClick={() => {
                    setOpenDropdown(null);
                    logoutUser();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.8rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#9ca3af',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} /> Złóż Pieczęć (Wyloguj)
                </button>
              </div>
            )}
          </div>
          ) : (
            <button
              onClick={() => {
                playWandSwoosh();
                setAuthModalOpen(true);
              }}
              className="btn-durmstrang"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
            >
              <LogIn size={14} /> Zaloguj do Cytadeli
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            className="mobile-burger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.3rem'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(8, 10, 14, 0.98)',
            borderBottom: '1px solid var(--gold-ancient)',
            padding: '1.2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}
        >
          <button
            onClick={() => handleNavClick('home')}
            style={{
              padding: '0.65rem 0.8rem',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🏰 Wrota Cytadeli
          </button>
          <button
            onClick={() => handleNavClick('timetable')}
            style={{
              padding: '0.65rem 0.8rem',
              background: activeView === 'timetable' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : 'none',
              borderRadius: '4px',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📅 Plan Lekcji & Sale
          </button>
          <button
            onClick={() => handleNavClick('journals')}
            style={{
              padding: '0.65rem 0.8rem',
              background: activeView === 'journals' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              border: activeView === 'journals' ? '1px solid var(--gold-ancient)' : 'none',
              borderRadius: '4px',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📜 Dzienniki Lekcyjne
          </button>
          <button
            onClick={() => handleNavClick('rules-guide')}
            style={{
              padding: '0.65rem 0.8rem',
              background: activeView === 'rules-guide' ? 'rgba(197, 159, 78, 0.2)' : 'transparent',
              border: activeView === 'rules-guide' ? '1px solid var(--gold-ancient)' : 'none',
              borderRadius: '4px',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🛡️ Zasady & Kodeks Północy
          </button>
          {currentUser && (
            <button
              onClick={() => handleNavClick('academic')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              📚 15 Katedr & Lekcje
            </button>
          )}
          {currentUser && (
            <button
              onClick={() => handleNavClick('rune-workshop')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'rgba(46, 196, 182, 0.15)',
                border: '1px solid #2ec4b6',
                borderRadius: '4px',
                color: '#2ec4b6',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚡ Warsztat Run (Galdr)
            </button>
          )}
          <button
            onClick={() => handleNavClick('houses')}
            style={{
              padding: '0.65rem 0.8rem',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🛡️ Cztery Zakony
          </button>
          {currentUser && (
            <button
              onClick={() => handleNavClick('ceremony')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ✨ Kamień Przysięgi
            </button>
          )}
          <button
            onClick={() => handleNavClick('map')}
            style={{
              padding: '0.65rem 0.8rem',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🗺️ Mapa Twierdzy
          </button>
          {currentUser && (
            <button
              onClick={() => handleNavClick('bank')}
              style={{
                padding: '0.65rem 0.8rem',
                background: activeView === 'bank' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(197, 159, 78, 0.08)',
                border: activeView === 'bank' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.2)',
                borderRadius: '4px',
                color: '#f7dca0',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🏦 Bank Skirnirów (Skarbiec)
            </button>
          )}
          {currentUser && (
            <button
              onClick={() => handleNavClick('markethall')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🛍️ Rynek Kaupangr & Wyprawki
            </button>
          )}
          {currentUser && (
            <button
              onClick={() => handleNavClick('raven-post')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                textAlign: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ✉️ Krucza Poczta
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1040px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-burger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
