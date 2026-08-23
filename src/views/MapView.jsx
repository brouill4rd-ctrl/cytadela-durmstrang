import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { SecretRune } from '../components/SecretRune';
import {
  Compass,
  MapPin,
  X,
  Sparkles,
  Users,
  Eye,
  Key,
  Shield,
  Layers,
  Flame,
  Footprints,
  Lock,
  Unlock,
  Radio
} from 'lucide-react';

export const MapView = () => {
  const { locations, houses, awardHousePoints, currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime, playGateThud } = useSound();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterHouse, setFilterHouse] = useState('all');
  const [currentLevel, setCurrentLevel] = useState(0); // -1: Lochy, 0: Parter, 1: Piętro, 2: Wieże
  const [secretPassageUnlocked, setSecretPassageUnlocked] = useState(false);

  // Moving Live Patrols / Footstep Entities
  const [patrols, setPatrols] = useState([
    { id: 1, name: 'Arcymistrz Karkarow', role: 'Patrol Dyrektorski', x: 45, y: 40, icon: '🧙‍♂️', targetX: 60, targetY: 55 },
    { id: 2, name: 'Duch Skalda Einara', role: 'Widmo Północy', x: 70, y: 25, icon: '👻', targetX: 30, targetY: 30 },
    { id: 3, name: 'Uczeń Zakonu Niedźwiedzia', role: 'Warta Nocna', x: 25, y: 65, icon: '🛡️', targetX: 40, targetY: 75 },
    { id: 4, name: 'Kruk Strażniczy', role: 'Zwiad Powietrzny', x: 75, y: 20, icon: '🦅', targetX: 50, targetY: 15 }
  ]);

  // Animate patrols periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPatrols((prev) =>
        prev.map((p) => {
          const deltaX = (Math.random() - 0.5) * 6;
          const deltaY = (Math.random() - 0.5) * 6;
          return {
            ...p,
            x: Math.min(Math.max(p.x + deltaX, 15), 85),
            y: Math.min(Math.max(p.y + deltaY, 15), 85)
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePinClick = (loc) => {
    playWandSwoosh();
    setSelectedLocation(loc);
  };

  const handleUnlockSecret = () => {
    if (secretPassageUnlocked) return;
    playGateThud();
    playRuneChime();
    setSecretPassageUnlocked(true);
    if (currentUser?.house_id) {
      awardHousePoints(currentUser.house_id, 20, 'Odkrycie Sekretnego Korytarza Pradawnych w Mapie Twierdzy');
    }
  };

  const levelConfigs = [
    { level: -1, name: 'Kondygnacja -1: Lochy & Podziemny Skarbiec', desc: 'Podziemne krypty wykute w lodzie, skarbiec Cytadeli oraz alchemiczne katakumby.' },
    { level: 0, name: 'Kondygnacja 0: Parter & Dziedziniec Walki', desc: 'Wielka Aula Hrafnhöll, Brama Bazaltowa, plac ćwiczeń szermierki i sale ceremonialne.' },
    { level: 1, name: 'Kondygnacja 1: Skrzydło Zakonów & Biblioteka', desc: 'Dormitoria czterech Zakonów, Archiwum Zakazanych Ksiąg i pracownie runiczne.' },
    { level: 2, name: 'Kondygnacja 2: Ptaszarnia Kruków & Obserwatorium', desc: 'Najwyższe iglice Skandów, Krucza Poczta, lunety astronomiczne i widok na lodowy fiord.' }
  ];

  const currentLevelInfo = levelConfigs.find(l => l.level === currentLevel) || levelConfigs[1];

  const filteredLocations = (locations || []).filter(l => {
    const matchesHouse = filterHouse === 'all' || l.house === filterHouse || (filterHouse === 'neutral' && !l.house);
    return matchesHouse;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Eksploracja Twierdzy • Żywa Mapa Cytadeli
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
            Architektura & Posterunki Północy
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '680px', fontSize: '0.98rem' }}>
            Przełączaj kondygnacje twierdzy, śledź ślady patrolujących profesorów w czasie rzeczywistym i odkrywaj sekretne korytarze.
          </p>
        </div>

        {/* Level Switcher */}
        <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(15, 20, 28, 0.8)', padding: '0.3rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
          {levelConfigs.map((lvl) => (
            <button
              key={lvl.level}
              onClick={() => {
                playWandSwoosh();
                setCurrentLevel(lvl.level);
              }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: 'none',
                background: currentLevel === lvl.level ? 'var(--gold-ancient)' : 'transparent',
                color: currentLevel === lvl.level ? '#000000' : '#d1d5db',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {lvl.level === -1 ? 'Lochy (-1)' : lvl.level === 0 ? 'Parter (0)' : lvl.level === 1 ? 'Piętro (1)' : 'Wieże (2)'}
            </button>
          ))}
        </div>
      </div>

      {/* Level Info Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(12, 16, 24, 0.8)', borderLeft: '3px solid var(--gold-ancient)', padding: '0.8rem 1.2rem', borderRadius: '4px' }}>
        <div>
          <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
            {currentLevelInfo.name}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>
            {currentLevelInfo.desc}
          </div>
        </div>

        {/* House Filters */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {['all', 'renifer', 'niedzwiedz', 'kruk', 'wydra'].map((h) => (
            <button
              key={h}
              onClick={() => setFilterHouse(h)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: filterHouse === h ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                background: filterHouse === h ? 'rgba(197, 159, 78, 0.2)' : 'rgba(12, 15, 22, 0.7)',
                color: filterHouse === h ? '#ffe8aa' : '#9ca3af',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer'
              }}
            >
              {h === 'all' ? 'Wszystkie' : h === 'renifer' ? '🦌 Reinhall' : h === 'niedzwiedz' ? '🐻 Björnhall' : h === 'kruk' ? '🐦 Ravnheim' : '🦦 Otergard'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Canvas Container */}
      <div
        className="gothic-card runic-corners"
        style={{
          position: 'relative',
          width: '100%',
          height: '620px',
          background: currentLevel === -1
            ? 'radial-gradient(ellipse at center, #0f131a 0%, #050608 100%)'
            : currentLevel === 2
            ? 'radial-gradient(ellipse at center, #1b263b 0%, #080d16 100%)'
            : 'radial-gradient(ellipse at center, #131924 0%, #080a0e 100%)',
          border: '1px solid var(--gold-ancient)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), inset 0 0 40px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Background Grid & Citadel Outline Graphics */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(197, 159, 78, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.35,
            pointerEvents: 'none'
          }}
        />

        {/* Dynamic Architectural Rings */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }}
        >
          <circle cx="50%" cy="45%" r="220" fill="none" stroke="var(--gold-ancient)" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="50%" cy="45%" r="380" fill="none" stroke="var(--gold-ancient)" strokeWidth="1" strokeDasharray="8 8" />
          <rect x="25%" y="25%" width="50%" height="45%" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>

        {/* Compass Rose Ornament */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            color: 'rgba(197, 159, 78, 0.5)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-heading)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <Compass size={38} color="var(--gold-ancient)" opacity={0.6} />
          <div>NORDEN (N)</div>
        </div>

        {/* Secret Passage Interactive Wall Node */}
        <div
          onClick={handleUnlockSecret}
          title="Tajemnicza wypukła runa w murze..."
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '35px',
            zIndex: 25,
            cursor: 'pointer',
            padding: '0.4rem 0.8rem',
            background: secretPassageUnlocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(197, 159, 78, 0.15)',
            border: `1px dashed ${secretPassageUnlocked ? '#22c55e' : 'var(--gold-ancient)'}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: secretPassageUnlocked ? '#4ade80' : '#ffe599',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {secretPassageUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
          {secretPassageUnlocked ? 'Sekretne Przejście Otwarte (+20 pkt)' : 'ᛏ Runa w Bazaltowym Murze'}
        </div>

        {/* Live Moving Patrols (Marauder-style tracking) */}
        {patrols.map((patrol) => (
          <div
            key={patrol.id}
            style={{
              position: 'absolute',
              left: `${patrol.x}%`,
              top: `${patrol.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 22,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              transition: 'left 2.8s ease-in-out, top 2.8s ease-in-out'
            }}
          >
            {/* Footstep trail dot */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#60a5fa',
                boxShadow: '0 0 10px #38bdf8',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <div
              style={{
                background: 'rgba(5, 8, 12, 0.85)',
                border: '1px solid #38bdf8',
                borderRadius: '3px',
                padding: '0.1rem 0.4rem',
                color: '#93c5fd',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-heading)',
                whiteSpace: 'nowrap',
                marginTop: '3px'
              }}
            >
              {patrol.icon} {patrol.name}
            </div>
          </div>
        ))}

        {/* Hotspot Pins */}
        {filteredLocations.map((loc) => {
          const house = loc.house ? houses[loc.house] : null;
          const isSelected = selectedLocation?.id === loc.id;

          return (
            <div
              key={loc.id}
              onClick={() => handlePinClick(loc)}
              style={{
                position: 'absolute',
                left: `${loc.x}%`,
                top: `${loc.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 30 : 20,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Pin Circle */}
                <div
                  style={{
                    width: isSelected ? '42px' : '34px',
                    height: isSelected ? '42px' : '34px',
                    borderRadius: '50%',
                    background: house ? house.colors.bgDark : 'rgba(15, 20, 30, 0.95)',
                    border: isSelected ? '2px solid #ffffff' : `1.5px solid ${house ? house.colors.secondary : 'var(--gold-ancient)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSelected ? '1.2rem' : '0.95rem',
                    boxShadow: isSelected ? '0 0 25px #ffffff' : `0 4px 15px rgba(0,0,0,0.8), 0 0 10px ${house ? house.colors.secondary : 'var(--gold-ancient)'}`,
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loc.icon}
                </div>

                {/* Pin Label */}
                <div
                  style={{
                    marginTop: '4px',
                    background: 'rgba(8, 10, 14, 0.92)',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '3px',
                    padding: '0.15rem 0.5rem',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-heading)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                >
                  {loc.name.split('(')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Location Modal / Drawer */}
      {selectedLocation && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            background: 'radial-gradient(circle at 90% 10%, rgba(25, 32, 45, 0.9) 0%, rgba(10, 13, 18, 0.98) 70%)',
            border: '1px solid var(--gold-ancient)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.95)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>
                {selectedLocation.nordicName} • {selectedLocation.type}
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginTop: '0.2rem' }}>
                {selectedLocation.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ color: '#c5cdd9', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '1.8rem', whiteSpace: 'pre-line' }}>
            {selectedLocation.fullLore}
          </p>

          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            {/* NPCs Present */}
            <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-glow)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                <Users size={15} /> Obecni Profesorowie & NPC
              </div>
              <ul style={{ listStyle: 'none', color: '#e5e7eb', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {selectedLocation.npcs?.map((npc, i) => (
                  <li key={i}>• {npc}</li>
                ))}
              </ul>
            </div>

            {/* Available Actions */}
            <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-glow)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                <Eye size={15} /> Dostępne Interakcje
              </div>
              <ul style={{ listStyle: 'none', color: '#e5e7eb', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {selectedLocation.actions?.map((act, i) => (
                  <li key={i}>⚔️ {act}</li>
                ))}
              </ul>
            </div>

            {/* Secret Clue */}
            <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-ancient)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                <Key size={15} /> Wskazówka do Sekretu
              </div>
              <p style={{ color: '#d8c2ff', fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.5 }}>
                „{selectedLocation.secretClue}”
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
