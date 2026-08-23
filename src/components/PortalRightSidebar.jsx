import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
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
  Wind
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
    events,
    setActiveHouseTab
  } = useSchool();

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
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛉ</div>
          <Sparkles size={36} color="var(--gold-ancient)" style={{ position: 'relative', zIndex: 2, opacity: 0.8 }} />
        </div>

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
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛃ</div>
          <Calendar size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

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
          2. BLOK: SALE & KOMNATY
          ========================================================================= */}
      <div className="menuBlock">
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛏ</div>
          <Compass size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

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
                <span>🕯️ Krypta Siedmiu Kręgów</span>
                <span style={{ fontSize: '0.7rem', color: '#a77de0' }}>Rytuał</span>
              </button>
            </li>
          </ul>

          <hr />
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ice-frost)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Dormitoria Zakonów:
          </div>
          <ul>
            <li>
              <button onClick={() => handleNav('houses', 'renifer')} style={{ color: '#c59f4e' }}>
                <span>🦌 Sala Skandzy (Renifer)</span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'niedzwiedz')} style={{ color: '#ff9e9e' }}>
                <span>🐻 Bastion Żelaza (Niedźwiedź)</span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'kruk')} style={{ color: '#d8c2ff' }}>
                <span>🦅 Wieża Szeptów (Kruk)</span>
                <ChevronRight size={13} />
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('houses', 'wydra')} style={{ color: '#8cefe6' }}>
                <span>🦦 Ogrody Cieplic (Wydra)</span>
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
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛖ</div>
          <Crown size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᛉ</span>
          <span>Władze Cytadeli</span>
          <span className="rune-bracket">ᛉ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Arcymistrzyni & Dyrektorka</div>
                <strong style={{ color: 'var(--gold-glow)' }}>Valgerda Storm</strong>
              </div>
              <span style={{ fontSize: '1.2rem' }}>👑</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Opiekunka Zakonu Kruka</div>
                <strong style={{ color: '#ffffff' }}>Prof. Morana Vane</strong>
              </div>
              <span style={{ fontSize: '1.2rem' }}>👁️</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Opiekun Zakonu Niedźwiedzia</div>
                <strong style={{ color: '#ffffff' }}>Prof. Gunnar Vargson</strong>
              </div>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            </div>
          </div>
          <hr />
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
            Kruk dyrekcji: <span style={{ color: 'var(--ice-frost)' }}>dyrekcja@durmstrang.magic</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BLOK: RANKING ADEPTÓW
          ========================================================================= */}
      <div className="menuBlock">
        <div className="menuBlockHeaderImage">
          <div className="frost-overlay" />
          <div className="runic-watermark">ᛞ</div>
          <Trophy size={36} color="rgba(164, 200, 225, 0.4)" style={{ position: 'relative', zIndex: 2 }} />
        </div>

        <div className="menuBlockTitle">
          <span className="rune-bracket">ᚠ</span>
          <span>Ranking Adeptów</span>
          <span className="rune-bracket">ᚠ</span>
        </div>

        <div className="menuBlockContent">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {(students || []).slice(0, 5).map((stud, idx) => {
              const h = houses[stud.house];
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

              return (
                <div
                  key={stud.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: idx === 0 ? 'rgba(164, 200, 225, 0.12)' : 'rgba(8, 12, 18, 0.6)',
                    borderRadius: 'var(--radius-sm)',
                    border: idx === 0 ? '1px solid rgba(164, 200, 225, 0.35)' : '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', width: '20px' }}>{medal}</span>
                    <strong style={{ color: h ? h.colors?.secondary : '#ffffff' }}>
                      {stud.name.split(' ')[0]} {stud.name.split(' ')[1]?.[0]}.
                    </strong>
                  </div>
                  <span style={{ color: 'var(--gold-glow)', fontWeight: 700, fontSize: '0.8rem' }}>
                    {stud.points} pkt
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
        </div>
      </div>
    </aside>
  );
};
