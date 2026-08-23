import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { StudentPassportModal } from './StudentPassportModal';
import { ProfileEditorModal } from './ProfileEditorModal';
import { GrimoireBook } from './GrimoireBook';
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
  Edit3
} from 'lucide-react';

export const PortalLeftSidebar = ({ onOpenCreationModal }) => {
  const {
    setActiveView,
    activeView,
    houses,
    currentUser,
    currentRole,
    loginUser,
    logoutUser,
    setAuthModalOpen,
    setPasswordRecoveryModalOpen,
    pendingApplications,
    emails,
    setEmailInboxOpen,
    timetable,
    daysOfWeek,
    showNotification
  } = useSchool();

  const { playWandSwoosh, playRuneChime } = useSound();

  // Sidebar mini-login form state
  const [sideUsername, setSideUsername] = useState('');
  const [sidePassword, setSidePassword] = useState('');

  // Modals state
  const [profileEditorModalOpen, setProfileEditorModalOpen] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [grimoireModalOpen, setGrimoireModalOpen] = useState(false);
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
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛟ</div>
          <Shield size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.8 }} />
        </div>

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
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.fullName || `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || currentUser.username}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: house ? house.colors?.secondary : 'var(--gold-ancient)' }}>
                    {house ? house.name : currentUser.role === 'admin' ? 'Arcymistrzyni' : 'Adept'} • {currentUser.role || 'Uczeń'}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit Profile, Passport & Profile */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => {
                    playWandSwoosh();
                    setProfileEditorModalOpen(true);
                  }}
                  className="btn-durmstrang"
                  style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.72rem', justifyContent: 'center', background: 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)', color: '#06090e', fontWeight: 700 }}
                  title="Edytuj dane, awatar i płeć postaci"
                >
                  <Edit3 size={11} /> Edytuj
                </button>

                <button
                  onClick={() => {
                    playRuneChime();
                    setPassportModalOpen(true);
                  }}
                  className="btn-durmstrang-secondary"
                  style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.72rem', justifyContent: 'center' }}
                >
                  <Download size={11} /> Paszport
                </button>

                <button
                  onClick={() => handleNav('profile')}
                  className="btn-durmstrang-secondary"
                  style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.72rem', justifyContent: 'center' }}
                >
                  <User size={11} /> Profil
                </button>
              </div>

              <button
                onClick={logoutUser}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  justifyContent: 'center',
                  padding: '0.2rem'
                }}
              >
                <LogOut size={12} /> Wyloguj z Cytadeli
              </button>
            </div>
          ) : (
            /* ================= LOGGED OUT SIDEBAR LOGIN FORM ================= */
            <form onSubmit={handleSidebarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.2rem' }}>
                  Login Adepta / Profesora:
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. valdemar, morana"
                  value={sideUsername}
                  onChange={(e) => setSideUsername(e.target.value)}
                  className="gothic-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.2rem' }}>
                  Hasło:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={sidePassword}
                  onChange={(e) => setSidePassword(e.target.value)}
                  className="gothic-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>

              <button
                type="submit"
                className="btn-durmstrang"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', justifyContent: 'center', marginTop: '0.2rem' }}
              >
                <LogIn size={13} /> Zaloguj do Cytadeli
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontSize: '0.72rem' }}>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-glow)', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  📝 Zarejestruj Adepta / Profesora
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordRecoveryModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  🗝️ Zapomniałeś hasła?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* =========================================================================
          1. BLOK: CENTRUM AKTYWNOŚCI & GIER RPG (FULL SUITE)
          ========================================================================= */}
      <div className="menuBlock" style={{ border: '1px solid rgba(197, 159, 78, 0.4)' }}>
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛏ</div>
          <Zap size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.85 }} />
        </div>

        <div className="menuBlockTitle" style={{ color: 'var(--gold-glow)' }}>
          <span className="rune-bracket">ᚦ</span>
          <span>Gry & Aktywności</span>
          <span className="rune-bracket">ᚦ</span>
        </div>

        <div className="menuBlockContent">
          <ul>
            <li>
              <button
                onClick={() => openActivity(setOracleModalOpen, 'Wyrocznia Przeznaczenia (Seidr)')}
                style={{ color: '#ffe599' }}
              >
                <span>🔮 Wyrocznia Przeznaczenia (Seidr)</span>
                <span style={{ fontSize: '0.62rem', background: 'var(--gold-ancient)', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  BUFF
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setExpeditionsModalOpen, 'Ekspedycje do Puszczy & Fjordów')}
                style={{ color: '#4ade80' }}
              >
                <span>🌲 Ekspedycje do Puszczy & Fjordów</span>
                <span style={{ fontSize: '0.62rem', background: '#22c55e', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  RPG
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setTargetModalOpen, 'Runiczna Strzelnica Różdżkowa')}
                style={{ color: '#38bdf8' }}
              >
                <span>🎯 Runiczna Strzelnica Różdżkowa</span>
                <span style={{ fontSize: '0.62rem', background: '#38bdf8', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  ZRĘCZNOŚĆ
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setEscapeModalOpen, 'Labirynt Tajemnic: Escape Room')}
                style={{ color: '#fcd34d' }}
              >
                <span>🗝️ Labirynt Tajemnic: Escape Room</span>
                <span style={{ fontSize: '0.62rem', background: '#f59e0b', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  ZAGADKI
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setHnefataflModalOpen, 'Hnefatafl (Szachy Wikingów)')}
                style={{ color: '#c084fc' }}
              >
                <span>🎲 Hnefatafl (Szachy Wikingów)</span>
                <span style={{ fontSize: '0.62rem', background: '#a855f7', color: '#ffffff', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  PLANSZA
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setFishingModalOpen, 'Połów w Zamarzniętym Fjordzie')}
                style={{ color: '#93c5fd' }}
              >
                <span>🎣 Połów w Zamarzniętym Fjordzie</span>
                <span style={{ fontSize: '0.62rem', background: '#0284c7', color: '#ffffff', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  RELAKS
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setTournamentModalOpen, 'Turniej Szermierki')}
                style={{ color: '#f87171' }}
              >
                <span>🏆 Turniej Szermierki: Droga Mistrza</span>
                <span style={{ fontSize: '0.62rem', background: '#ef4444', color: '#ffffff', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  TURNIEJ
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setBestiaryModalOpen, 'Bestiariusz Północy')}
                style={{ color: '#fed7aa' }}
              >
                <span>🐉 Bestiariusz Północy (Karty Bestii)</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setBlackMarketModalOpen, 'Czarny Rynek w Lochach')}
                style={{ color: '#e9d5ff' }}
              >
                <span>🏴‍☠️ Czarny Rynek w Lochach</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>

            <li>
              <button
                onClick={() => openActivity(setGrimoireModalOpen, 'Grimoire Zaklęć & Gestów')}
                style={{ color: '#ffe599' }}
              >
                <span>⚡ Grimoire Zaklęć & Gestów</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          2. BLOK: CYTADELA
          ========================================================================= */}
      <div className="menuBlock">
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛞ</div>
          <Castle size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚦ</span>
          <span>Cytadela</span>
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
                <span>🏰 Wrota Wejściowe</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('journals')}
                style={{
                  color: activeView === 'journals' ? '#ffffff' : '#c59f4e',
                  background: activeView === 'journals' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(197, 159, 78, 0.08)',
                  border: activeView === 'journals' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.25)',
                  fontWeight: 700
                }}
              >
                <span>📜 Dzienniki Lekcyjne</span>
                <span style={{ fontSize: '0.6rem', background: 'var(--gold-ancient)', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  DISCORD
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNav('timetable')}
                style={{
                  color: activeView === 'timetable' ? '#ffffff' : '#f7dca0',
                  background: activeView === 'timetable' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(197, 159, 78, 0.06)',
                  border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.2)',
                  fontWeight: 700
                }}
              >
                <span>📅 Plan Lekcji & Grafik</span>
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
                <span>🛡️ Cztery Zakony</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* =========================================================================
          3. BLOK: PLAN LEKCJI & HARMONOGRAM DNIA
          ========================================================================= */}
      <div className="menuBlock" style={{ border: activeView === 'timetable' ? '1px solid var(--gold-ancient)' : undefined }}>
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᚠ</div>
          <Calendar size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.85 }} />
        </div>

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
          4. BLOK: EKSPLORACJA
          ========================================================================= */}
      <div className="menuBlock">
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᚱ</div>
          <Compass size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

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
                <span>🗺️ Żywa Mapa Twierdzy</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            {currentUser && (
              <li>
                <button
                  onClick={() => handleNav('bank')}
                  style={{
                    color: activeView === 'bank' ? '#ffffff' : '#f7dca0',
                    background: activeView === 'bank' ? 'rgba(197, 159, 78, 0.2)' : 'rgba(197, 159, 78, 0.08)',
                    border: activeView === 'bank' ? '1px solid var(--gold-ancient)' : '1px solid rgba(197, 159, 78, 0.25)',
                    fontWeight: 700
                  }}
                >
                  <span>🏦 Bank Skirnirów (Skarbiec)</span>
                  <span style={{ fontSize: '0.62rem', background: 'var(--gold-ancient)', color: '#090d14', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                    GRINGOTT
                  </span>
                </button>
              </li>
            )}
            {currentUser && (
              <li>
                <button
                  onClick={() => handleNav('markethall')}
                  style={{
                    color: activeView === 'markethall' ? '#ffffff' : '#a4b2c9',
                    background: activeView === 'markethall' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                    border: activeView === 'markethall' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                  }}
                >
                  <span>🛍️ Rynek Kaupangr & Wyprawki</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => handleNav('lore')}
                style={{
                  color: activeView === 'lore' ? '#ffffff' : '#a4b2c9',
                  background: activeView === 'lore' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                  border: activeView === 'lore' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                }}
              >
                <span>📜 Kroniki & Bestiariusz</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
              </button>
            </li>
            {currentUser && (
              <li>
                <button
                  onClick={() => handleNav('raven-post')}
                  style={{
                    color: activeView === 'raven-post' ? '#ffffff' : '#a4b2c9',
                    background: activeView === 'raven-post' ? 'rgba(164, 200, 225, 0.15)' : 'transparent',
                    border: activeView === 'raven-post' ? '1px solid rgba(164, 200, 225, 0.3)' : '1px solid transparent'
                  }}
                >
                  <span>✉️ Krucza Poczta</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Global Modals for Full Suite of Activities */}
      <ProfileEditorModal isOpen={profileEditorModalOpen} onClose={() => setProfileEditorModalOpen(false)} />
      <StudentPassportModal isOpen={passportModalOpen} onClose={() => setPassportModalOpen(false)} />
      <GrimoireBook isOpen={grimoireModalOpen} onClose={() => setGrimoireModalOpen(false)} />
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
    </aside>
  );
};
