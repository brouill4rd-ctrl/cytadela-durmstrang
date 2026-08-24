import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { MaraudersMapCanvas } from '../components/MaraudersMapCanvas';
import { MarauderQuestModal } from '../components/MarauderQuestModal';
import { SecretRune } from '../components/SecretRune';
import {
  Compass,
  Sparkles,
  Layers,
  Footprints,
  Lock,
  Unlock,
  Eye,
  Award,
  Search,
  Zap,
  Flame,
  Radio,
  BookOpen
} from 'lucide-react';

export const MapView = () => {
  const { locations, houses, awardHousePoints, currentUser } = useSchool();
  const { playWandSwoosh, playRuneChime, playGateThud } = useSound();

  // Marauder's Map State
  const [isRevealed, setIsRevealed] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterHouse, setFilterHouse] = useState('all');
  const [currentLevel, setCurrentLevel] = useState(0); // -1: Lochy, 0: Parter, 1: Piętro, 2: Wieże
  const [secretPassageUnlocked, setSecretPassageUnlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ceremonial Oath Handlers
  const handleRevealMap = () => {
    playGateThud();
    playRuneChime();
    playWandSwoosh();
    setIsRevealed(true);
  };

  const handleConcealMap = () => {
    playWandSwoosh();
    setIsRevealed(false);
    setSelectedLocation(null);
  };

  const handleUnlockSecret = () => {
    if (secretPassageUnlocked) return;
    playGateThud();
    playRuneChime();
    setSecretPassageUnlocked(true);
    if (currentUser?.house_id) {
      awardHousePoints(currentUser.house_id, 25, 'Odkrycie Runicznego Sekretnego Korytarza Pradawnych w Mapie Twierdzy');
    }
  };

  const levelConfigs = [
    { level: -1, name: 'Kondygnacja -1: Lochy & Podziemny Skarbiec', desc: 'Podziemne krypty wykute w lodzie, podziemne kanały drakkarów oraz alchemiczne katakumby.' },
    { level: 0, name: 'Kondygnacja 0: Parter & Dziedziniec Wilków', desc: 'Wielka Sala Hrafnhöll, Brama Bazaltowa, plac ćwiczeń szermierki i sale ceremonialne.' },
    { level: 1, name: 'Kondygnacja 1: Skrzydło Zakonów & Biblioteka', desc: 'Dormitoria Zakonów, Archiwum Runicznych Ksiąg i pracownie szamańskie.' },
    { level: 2, name: 'Kondygnacja 2: Ptaszarnia Kruków & Obserwatorium', desc: 'Najwyższe iglice Skandów, Krucza Poczta, lunety astronomiczne i widok na zorzę.' }
  ];

  const currentLevelInfo = levelConfigs.find((l) => l.level === currentLevel) || levelConfigs[1];

  const filteredLocations = (locations || []).filter((l) => {
    const matchesHouse =
      filterHouse === 'all' ||
      l.house === filterHouse ||
      (filterHouse === 'neutral' && !l.house);
    const matchesSearch =
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nordicName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHouse && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      {/* Header with Title & Marauder Spell Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Eksploracja Twierdzy • Żywa Mapa Pergaminowa
            </span>
            <span
              style={{
                background: isRevealed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isRevealed ? '#4ade80' : '#f87171',
                border: `1px solid ${isRevealed ? '#22c55e' : '#ef4444'}`,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)'
              }}
            >
              {isRevealed ? '⚡ Runiczny Tusz Aktywny' : '🔒 Pergamin Ukryty'}
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.4rem' }}>
            Architektura & Posterunki Północy
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '720px', fontSize: '0.96rem' }}>
            Dotknij różdżką pergaminu, śledź ślady patroli w czasie rzeczywistym i podejmuj interaktywne side questy w kanałach bota RPG.
          </p>
        </div>

        {/* Action Oath Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {isRevealed ? (
            <button
              onClick={handleConcealMap}
              className="gothic-btn"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#ef4444',
                color: '#fca5a5',
                fontSize: '0.82rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Lock size={14} /> Koniec psot! (Zwiń Mapę)
            </button>
          ) : (
            <button
              onClick={handleRevealMap}
              className="gothic-btn"
              style={{
                background: 'linear-gradient(135deg, #c59f4e 0%, #8c6d3b 100%)',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.6rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 20px rgba(197, 159, 78, 0.4)'
              }}
            >
              <Sparkles size={16} /> „Uroczyście przysięgam, że knuję coś niedobrego...”
            </button>
          )}
        </div>
      </div>

      {!isRevealed ? (
        /* Blank Sealed Parchment State */
        <div
          className="gothic-card runic-corners"
          style={{
            height: '480px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'radial-gradient(ellipse at center, #f4ecd8 0%, #d8c39e 100%)',
            border: '3px solid #8c6d3b',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 50px rgba(58, 30, 18, 0.4)',
            padding: '2rem'
          }}
        >
          <div style={{ color: '#4a2810', fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
          <h2 style={{ color: '#3a1e12', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
            Pusty Pergamin Cytadeli Durmstrang
          </h2>
          <p style={{ color: '#5c3a21', maxWidth: '500px', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '1.8rem' }}>
            Na pożółkłej karcie nie widać ani śladu atramentu... Wypowiedz formułę adepcką, aby obudzić magiczne ślady twierdzy.
          </p>
          <button
            onClick={handleRevealMap}
            className="gothic-btn"
            style={{
              background: '#3a1e12',
              borderColor: '#241208',
              color: '#ffe599',
              padding: '0.8rem 1.6rem',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 15px rgba(58, 30, 18, 0.4)'
            }}
          >
            <Sparkles size={18} /> Uroczyście przysięgam, że knuję coś niedobrego...
          </button>
        </div>
      ) : (
        /* Full Revealed Marauder Canvas Interface */
        <>
          {/* Level Switcher & Search & House Filters */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.8rem',
              background: 'rgba(12, 16, 24, 0.85)',
              borderLeft: '4px solid var(--gold-ancient)',
              padding: '0.8rem 1.2rem',
              borderRadius: '6px',
              border: '1px solid rgba(197, 159, 78, 0.2)'
            }}
          >
            {/* Floors */}
            <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(15, 20, 28, 0.8)', padding: '0.25rem', borderRadius: '6px', border: '1px solid rgba(197, 159, 78, 0.25)' }}>
              {levelConfigs.map((lvl) => (
                <button
                  key={lvl.level}
                  onClick={() => {
                    playWandSwoosh();
                    setCurrentLevel(lvl.level);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: currentLevel === lvl.level ? 'var(--gold-ancient)' : 'transparent',
                    color: currentLevel === lvl.level ? '#000000' : '#d1d5db',
                    fontSize: '0.78rem',
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

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 20, 30, 0.8)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px', padding: '0.2rem 0.6rem', width: '220px' }}>
              <Search size={14} color="#9ca3af" />
              <input
                type="text"
                placeholder="Szukaj lokacji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  marginLeft: '0.4rem',
                  width: '100%'
                }}
              />
            </div>

            {/* House Filters */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {['all', 'renifer', 'niedzwiedz', 'kruk', 'wydra'].map((h) => (
                <button
                  key={h}
                  onClick={() => setFilterHouse(h)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: filterHouse === h ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                    background: filterHouse === h ? 'rgba(197, 159, 78, 0.2)' : 'rgba(12, 15, 22, 0.7)',
                    color: filterHouse === h ? '#ffe8aa' : '#9ca3af',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer'
                  }}
                >
                  {h === 'all' ? 'Wszystkie' : h === 'renifer' ? 'ᚦ Reinhall' : h === 'niedzwiedz' ? 'ᛉ Björnhall' : h === 'kruk' ? 'ᚱ Ravnheim' : 'ᛞ Otergard'}
                </button>
              ))}
            </div>
          </div>

          {/* Level Info Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.8rem', background: 'rgba(18, 24, 36, 0.6)', borderRadius: '4px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span>🏛️ <strong style={{ color: '#ffffff' }}>{currentLevelInfo.name}</strong> — {currentLevelInfo.desc}</span>
            <span style={{ color: 'var(--gold-ancient)', fontSize: '0.75rem' }}>Kliknij dowolny węzeł na mapie, by otworzyć Side Questy</span>
          </div>

          {/* Core Interactive HTML5 Canvas Map Engine */}
          <MaraudersMapCanvas
            locations={filteredLocations}
            currentLevel={currentLevel}
            filterHouse={filterHouse}
            onSelectLocation={(loc) => {
              playWandSwoosh();
              setSelectedLocation(loc);
            }}
            selectedLocationId={selectedLocation?.id}
            houses={houses}
            isRevealed={isRevealed}
          />

          {/* Secret Runic Passage Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div
              onClick={handleUnlockSecret}
              title="Tajemnicza wypukła runa w murze..."
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                background: secretPassageUnlocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(197, 159, 78, 0.12)',
                border: `1px dashed ${secretPassageUnlocked ? '#22c55e' : 'var(--gold-ancient)'}`,
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: secretPassageUnlocked ? '#4ade80' : '#ffe599',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {secretPassageUnlocked ? <Unlock size={15} /> : <Lock size={15} />}
              {secretPassageUnlocked ? 'Sekretne Przejście Otwarte (+25 pkt dla Zakonu)' : 'ᛏ Runa w Bazaltowym Murze (Dotknij Różdżką)'}
            </div>

            <div style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Footprints size={14} color="var(--gold-ancient)" />
              <span>Patrole przemieszczają się zgodnie z procedurą straży Twierdzy</span>
            </div>
          </div>
        </>
      )}

      {/* Selected Location Quest & Discord Bot Modal */}
      {selectedLocation && (
        <MarauderQuestModal
          location={selectedLocation}
          isOpen={Boolean(selectedLocation)}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};
