import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { OrderCrest, normalizeHouseKey, HOUSE_RUNIC_DATA } from './HeraldicEmblems';
import { OrderLifePanel } from './OrderLifePanel';
import {
  X,
  Flame,
  Shield,
  BookOpen,
  Lock,
  Unlock,
  Users,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  AlertOctagon,
  KeyRound
} from 'lucide-react';

export const CommonRoomModal = ({ houseId, isOpen, onClose }) => {
  const { houses, currentUser, setAuthModalOpen } = useSchool();
  const { playGateThud, playRuneChime, playQuillScratch, setAmbientTrack, ambientTrack } = useSound();

  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [guardianError, setGuardianError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [houseNotes, setHouseNotes] = useState([
    {
      id: 1,
      author: 'Einar Thorne',
      role: 'Prefekt',
      text: 'Przypominam: zbiórka w lochach przed turniejem o 20:00. Pamiętajcie o eliksirach odporności.',
      date: 'Wczoraj, 21:40'
    },
    {
      id: 2,
      author: 'Astrid Lindholm',
      role: 'Starszy Uczeń',
      text: 'Odnaleziono zaginiony pergamin z formułą runiczną przy wejściu do biblioteki. Schowano w skrytce.',
      date: 'Dzisiaj, 14:15'
    }
  ]);

  if (!isOpen) return null;

  const targetKey = normalizeHouseKey(houseId);
  const currentHouse = (houses && houses[targetKey])
    || (houses && houseId && houses[houseId])
    || (Array.isArray(houses) ? houses.find(h => normalizeHouseKey(h.id) === targetKey) : null)
    || (houses && typeof houses === 'object' ? Object.values(houses)[0] : null)
    || { name: 'Reinhall', colors: { primary: '#7a1818', secondary: '#c59f4e' } };

  // Authorization check: User must be logged in and assigned to this house (or staff)
  const userHouseRaw = currentUser?.house || currentUser?.house_id || currentUser?.houseId || currentUser?.house_name;
  const userHouseKey = userHouseRaw ? normalizeHouseKey(userHouseRaw) : null;
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'headmaster';
  const hasAccess = Boolean(currentUser && (isStaff || (userHouseKey && userHouseKey === targetKey)));
  const userAssignedHouse = userHouseKey ? (houses[userHouseKey] || { name: HOUSE_RUNIC_DATA[userHouseKey]?.animal || userHouseKey }) : null;

  const houseConfigs = {
    reinhall: {
      name: 'Dormitorium Reinhall (Sala Skandzy)',
      rune: 'ᚦ',
      color: '#d4af37',
      bgDark: '#1c1308',
      riddle: '„Biegnie przez zamieć, a jego poroże rozcina ciemność nocy polarnej. Jaka to runa?”',
      correctRune: 'Fehu',
      runes: ['Fehu', 'Thurisaz', 'Kenaz', 'Wunjo'],
      atmosphere: 'Ciepło wielkiego kominka z bazaltu, zapach sosnowego igliwia, skórzane fotele i złote proporce.',
      relic: 'Kielich Przymierza Krwi (Blóðkálkr)'
    },
    bjornhall: {
      name: 'Dormitorium Björnhall (Bastion Żelaza)',
      rune: 'ᛉ',
      color: '#c02b2b',
      bgDark: '#1a0909',
      riddle: '„Niezłomny jak granitowa grań, uderza z furią północnego sztormu. Jaka runa otwiera wrota?”',
      correctRune: 'Uruz',
      runes: ['Uruz', 'Raidho', 'Hagalaz', 'Isa'],
      atmosphere: 'Kamienne sklepienia, skrzyżowane topory rytualne, niedźwiedzie futra i żarzący się paleniskowy koks.',
      relic: 'Puklerz Pękniętego Żelaza (Járnskjöldr)'
    },
    ravnheim: {
      name: 'Dormitorium Ravnheim (Wieża Nocnych Szeptów)',
      rune: 'ᚱ',
      color: '#a77de0',
      bgDark: '#071524',
      riddle: '„Dwa ptaki szybują nad światem, przynosząc myśl i pamięć. Którą runę wyryto w kamieniu?”',
      correctRune: 'Ansuz',
      runes: ['Ansuz', 'Gebo', 'Eihwaz', 'Perthro'],
      atmosphere: 'Wysoka wieża z widokiem na lodowy fiord, tysiące zwojów, mosiężne astrolabia i szept wiatru.',
      relic: 'Astrolabium Siedmiu Gwiazd (Himinúrfang)'
    },
    otergard: {
      name: 'Dormitorium Otergard (Ogrody Lodowych Cieplic)',
      rune: 'ᛞ',
      color: '#2ec4b6',
      bgDark: '#061a17',
      riddle: '„Przenika przez najgłębsze szczeliny lodu, płynąc wprost ku sercu oceanu. Wskaż runę wody.”',
      correctRune: 'Laguz',
      runes: ['Laguz', 'Sowilo', 'Tiwaz', 'Berkano'],
      atmosphere: 'Podwodna komnata z widokiem na dno zamarzniętego fiordu, szmaragdowe lampy i szum prądów morskich.',
      relic: 'Alembik Nieskończonej Destylacji (Algildi)'
    }
  };

  const config = houseConfigs[targetKey] || houseConfigs.reinhall;

  const handleRuneSubmit = (selectedRune) => {
    if (selectedRune === config.correctRune) {
      playGateThud();
      playRuneChime();
      setIsUnlocked(true);
      setGuardianError('');
    } else {
      setGuardianError('Strażnik wrót odrzuca ten znak! Kamienne wrota pozostają zimne i zaryglowane.');
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    playQuillScratch();
    setHouseNotes([
      {
        id: Date.now(),
        author: currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username : 'Uczeń Północy',
        role: currentUser?.role || 'Adept Zakonu',
        text: newNote,
        date: 'Przed chwilą'
      },
      ...houseNotes
    ]);
    setNewNote('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${config.bgDark} 0%, #0c0f16 100%)`,
          border: `2px solid ${config.color}`,
          boxShadow: `0 10px 40px rgba(0, 0, 0, 0.9), 0 0 25px ${config.color}33`,
          borderRadius: '12px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: `1px solid ${config.color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <OrderCrest houseKey={targetKey} size={38} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                {config.name}
              </h3>
              <span style={{ fontSize: '0.78rem', color: config.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ŚWIĘTE SANKTUARIUM ZAKONU {currentHouse.name} • {config.rune}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ACCESS DENIED WARD IF USER IS NOT IN THIS HOUSE */}
          {!hasAccess ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Lock size={36} />
              </div>

              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                Strażnik Runiczny Odrzuca Dostęp
              </h4>

              <p style={{ color: '#d1d5db', maxWidth: '540px', fontSize: '1rem', lineHeight: 1.6 }}>
                Pradawna pieczęć dormitorium <strong>Zakonu {currentHouse.name}</strong> rozpoznaje krew i duszę wyłącznie swoich współbraci.
              </p>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  padding: '1rem 1.5rem',
                  maxWidth: '520px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  Stan Twojego profilu:
                </div>
                <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '0.3rem' }}>
                  {currentUser ? (
                    <>
                      Uczeń: <span style={{ color: '#fca5a5' }}>{currentUser.fullName || currentUser.username}</span>
                      <br />
                      Przypisany Zakon:{' '}
                      <span style={{ color: config.color }}>
                        {userAssignedHouse?.name ? `Zakon ${userAssignedHouse.name}` : 'Brak przydziału (wymagana Ceremonia Przydziału)'}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#fca5a5' }}>Brak aktywnej sesji logowania w portalu TMD</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                {!currentUser && setAuthModalOpen && (
                  <button
                    onClick={() => {
                      onClose();
                      setAuthModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                      color: '#000000',
                      border: 'none',
                      padding: '0.7rem 1.4rem',
                      borderRadius: '6px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Zaloguj się na konto ucznia
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer'
                  }}
                >
                  Odejdź od Wrót
                </button>
              </div>
            </div>
          ) : !isUnlocked ? (
            /* Locked Gate with Riddle for Authorized Students */
            <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: `2px solid ${config.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.color,
                  boxShadow: `0 0 20px ${config.color}44`
                }}
              >
                <KeyRound size={30} />
              </div>

              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.3rem', fontFamily: 'var(--font-heading)' }}>
                Hasło Runiczne Wrót Zakonu {currentHouse.name}
              </h4>

              <p style={{ color: '#d1d5db', maxWidth: '520px', fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.6 }}>
                {config.riddle}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                {config.runes.map((rune) => (
                  <button
                    key={rune}
                    onClick={() => handleRuneSubmit(rune)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      background: 'rgba(15, 20, 28, 0.8)',
                      border: `1px solid ${config.color}88`,
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = config.color;
                      e.currentTarget.style.color = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 20, 28, 0.8)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                  >
                    ᛟ Runa {rune}
                  </button>
                ))}
              </div>

              {guardianError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {guardianError}
                </div>
              )}
            </div>
          ) : (
            /* Unlocked Dormitorium */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Atmosphere Banner */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${config.color}44`,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: config.color, fontSize: '0.85rem', fontWeight: 600 }}>
                    <Flame size={16} /> KOMINEK DORMITORIUM
                  </div>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#e5e7eb', fontSize: '0.9rem' }}>
                    {config.atmosphere}
                  </p>
                </div>

                <button
                  onClick={() => setAmbientTrack(ambientTrack === 'hearth' ? 'none' : 'hearth')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    border: `1px solid ${config.color}`,
                    background: ambientTrack === 'hearth' ? config.color : 'transparent',
                    color: ambientTrack === 'hearth' ? '#000000' : config.color,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {ambientTrack === 'hearth' ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  {ambientTrack === 'hearth' ? 'Ogień płonie' : 'Rozpal kominek'}
                </button>
              </div>

              {/* Relic & House Status */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Święta Relikwia Zakonu</div>
                  <div style={{ fontSize: '0.98rem', color: config.color, fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} color={config.color} /> {config.relic}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Punkty Pucharu Północy</div>
                  <div style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 700, marginTop: '0.2rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color={config.color} /> {currentHouse?.startingPoints || currentHouse?.points || 0} pkt
                  </div>
                </div>
              </div>

              <OrderLifePanel orderId={targetKey} color={config.color} />

              {/* Secret House Notice Board */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <BookOpen size={18} style={{ color: config.color }} />
                  <h4 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                    Tablica Tajnych Wiadomości Zakonu
                  </h4>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Zostaw wiadomość dla współbraci..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '4px',
                      padding: '0.6rem 0.8rem',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: config.color,
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.6rem 1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Send size={14} /> Przypnij
                  </button>
                </form>

                {/* Notes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {houseNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        background: 'rgba(15, 20, 28, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '0.8rem',
                        borderLeft: `3px solid ${config.color}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6' }}>
                          {note.author} <span style={{ fontSize: '0.72rem', color: config.color }}>({note.role})</span>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{note.date}</span>
                      </div>
                      <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.88rem' }}>{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
