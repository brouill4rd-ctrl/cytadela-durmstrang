import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { AlchemicalCauldron } from '../components/AlchemicalCauldron';
import { GrimoireBook } from '../components/GrimoireBook';
import { RuneCalligraphyModal } from '../components/RuneCalligraphyModal';
import {
  Sparkles,
  Flame,
  Shield,
  Award,
  Layers,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  BookOpen,
  Plus,
  Droplets
} from 'lucide-react';

export const RuneWorkshopView = () => {
  const {
    userRunes,
    runeFormulas,
    craftedFormulas,
    craftRuneFormula,
    houses
  } = useSchool();

  const { playRuneChime, playSortingFanfare, playWandSwoosh } = useSound();

  const [activeTab, setActiveTab] = useState('runes'); // 'runes' | 'alchemy'
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [runeCalligraphyOpen, setRuneCalligraphyOpen] = useState(false);

  // Altar slots (up to 3 runes)
  const [altarRunes, setAltarRunes] = useState([]);
  const [selectedCatalyst, setSelectedCatalyst] = useState('Krew Renifera');
  const [isForging, setIsForging] = useState(false);
  const [lastForgedResult, setLastForgedResult] = useState(null);

  const catalysts = [
    { name: 'Krew Renifera', house: 'renifer', icon: 'ᚦ', desc: 'Wzmacnia więzi rodowe i pieczęcie krwi' },
    { name: 'Pył Meteorytowy', house: 'niedzwiedz', icon: 'ᛉ', desc: 'Zwiększa siłę uderzenia i penetrację tarcz' },
    { name: 'Cień Kruka', house: 'kruk', icon: 'ᚱ', desc: 'Przenika zasłonę zaświatów i odkrywa sekrety' },
    { name: 'Woda Lodowcowa', house: 'wydra', icon: 'ᛞ', desc: 'Stabilizuje transmutację i reakcje alchemiczne' },
    { name: 'Pył Zorzy Polarnej', house: null, icon: 'ᛋ', desc: 'Najrzadszy katalizator zdejmujący pradawne klątwy' }
  ];

  const handleAddRuneToAltar = (rune) => {
    if (rune.count <= 0) return;
    if (altarRunes.length >= 3) return;

    playRuneChime();
    setAltarRunes([...altarRunes, rune]);
  };

  const handleRemoveRuneFromAltar = (index) => {
    playWandSwoosh();
    setAltarRunes(altarRunes.filter((_, i) => i !== index));
  };

  const handleClearAltar = () => {
    playWandSwoosh();
    setAltarRunes([]);
    setLastForgedResult(null);
  };

  const handleForge = () => {
    if (altarRunes.length < 2) return;

    playRuneChime();
    setIsForging(true);

    setTimeout(() => {
      setIsForging(false);
      const runeIds = altarRunes.map(r => r.id);
      const result = craftRuneFormula(runeIds, selectedCatalyst);

      if (result) {
        playSortingFanfare();
        setLastForgedResult(result);
        setAltarRunes([]);
      } else {
        setLastForgedResult({ error: true });
      }
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Katedra Starożytnych Run & Alchemii
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
            Warsztat Rzemiosła Magicznego
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '750px', fontSize: '1rem' }}>
            Łącz prastare znaki Futharku na ołtarzu galdrów lub warz eliksiry północy w alchemicznym kociołku.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 20, 28, 0.8)', padding: '0.3rem', borderRadius: '8px', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
          <button
            onClick={() => {
              playWandSwoosh();
              setActiveTab('runes');
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'runes' ? 'var(--gold-ancient)' : 'transparent',
              color: activeTab === 'runes' ? '#000000' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={16} /> Ołtarz Runiczny (Galdrastofa)
          </button>
          <button
            onClick={() => {
              playWandSwoosh();
              setActiveTab('alchemy');
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'alchemy' ? 'var(--gold-ancient)' : 'transparent',
              color: activeTab === 'alchemy' ? '#000000' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Droplets size={16} /> Kocioł Alchemiczny
          </button>
          <button
            onClick={() => {
              playWandSwoosh();
              setRuneCalligraphyOpen(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#ffe599',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span style={{ fontSize: '1rem', color: '#f59e0b' }}>ᚠ</span> Akademia Kaligrafii Run
          </button>
          <button
            onClick={() => {
              playWandSwoosh();
              setGrimoireOpen(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              background: 'rgba(0,0,0,0.4)',
              color: '#d1d5db',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={16} color="var(--gold-ancient)" /> Grimuar Zaklęć
          </button>
        </div>
      </div>

      {activeTab === 'alchemy' ? (
        /* Alchemy Lab */
        <AlchemicalCauldron />
      ) : (
        /* Main Grid: Altar (Center/Left) & Discovered Formulas (Right) */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
          {/* Left: Interactive Altar & Rune Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* =========================================================================
                1. SACRED ALTAR (OŁTARZ FUZJI)
                ========================================================================= */}
            <div
              className="gothic-card runic-corners"
              style={{
                padding: '2.5rem 2rem',
                background: 'radial-gradient(circle at 50% 30%, rgba(28, 35, 48, 0.95) 0%, rgba(10, 13, 18, 0.98) 85%)',
                border: '1px solid var(--gold-ancient)',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                  Bazaltowy Ołtarz Trzech Kręgów
                </span>
                {altarRunes.length > 0 && (
                  <button
                    onClick={handleClearAltar}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <RotateCcw size={12} /> Wyczyść Ołtarz
                  </button>
                )}
              </div>

              {/* 3 Rune Basalt Slots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[0, 1, 2].map((slotIdx) => {
                  const rune = altarRunes[slotIdx];

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => rune && handleRemoveRuneFromAltar(slotIdx)}
                      style={{
                        width: '90px',
                        height: '110px',
                        borderRadius: '8px',
                        background: rune ? 'radial-gradient(circle, #253043 0%, #0d121a 100%)' : 'rgba(8, 10, 15, 0.7)',
                        border: rune ? '2px solid var(--gold-ancient)' : '2px dashed rgba(197, 159, 78, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: rune ? 'pointer' : 'default',
                        boxShadow: rune ? '0 0 20px rgba(197, 159, 78, 0.3)' : 'inset 0 0 15px rgba(0,0,0,0.8)',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {rune ? (
                        <>
                          <span style={{ fontSize: '2.5rem', color: '#ffe8aa', textShadow: '0 0 10px rgba(197, 159, 78, 0.5)' }}>
                            {rune.symbol}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#d1d5db', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                            {rune.name}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#4b5563', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Slot {slotIdx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Catalyst Selector */}
              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                  Wybierz Katalizator Północy:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  {catalysts.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        playWandSwoosh();
                        setSelectedCatalyst(cat.name);
                      }}
                      style={{
                        padding: '0.6rem 0.5rem',
                        background: selectedCatalyst === cat.name ? 'rgba(197, 159, 78, 0.2)' : 'rgba(12, 16, 24, 0.6)',
                        border: selectedCatalyst === cat.name ? '1px solid var(--gold-ancient)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        color: selectedCatalyst === cat.name ? '#ffe8aa' : '#9ca3af',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forge Trigger Button */}
              <button
                onClick={handleForge}
                disabled={altarRunes.length < 2 || isForging}
                style={{
                  background: altarRunes.length >= 2 ? 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: altarRunes.length >= 2 ? '#000000' : '#4b5563',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.9rem 2rem',
                  fontWeight: 800,
                  fontSize: '1rem',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.05em',
                  cursor: altarRunes.length >= 2 ? 'pointer' : 'not-allowed',
                  boxShadow: altarRunes.length >= 2 ? '0 4px 20px rgba(197, 159, 78, 0.4)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {isForging ? '⚡ INKANTACJA W TOKU...' : 'ᛟ WYKUJ PIECZĘĆ RUNICZNĄ'}
              </button>

              {/* Forge Result Message */}
              {lastForgedResult && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '6px', background: lastForgedResult.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', border: `1px solid ${lastForgedResult.error ? '#ef4444' : '#22c55e'}` }}>
                  {lastForgedResult.error ? (
                    <span style={{ color: '#f87171', fontSize: '0.85rem' }}>⚠️ Brak stabilnego rezonansu! Te runy nie łączą się w trwałą pieczęć.</span>
                  ) : (
                    <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✨ Wykuto pomyślnie nową pieczęć: <strong>{lastForgedResult.name}</strong>!</span>
                  )}
                </div>
              )}
            </div>

            {/* Runes Inventory Tray */}
            <div className="gothic-card runic-corners" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--gold-ancient)" /> Twoja Sakiewka z Runami
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.8rem' }}>
                {(userRunes || []).map((rune) => (
                  <button
                    key={rune.id}
                    onClick={() => handleAddRuneToAltar(rune)}
                    disabled={rune.count <= 0 || altarRunes.length >= 3}
                    style={{
                      background: 'rgba(15, 20, 28, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '0.6rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: rune.count > 0 && altarRunes.length < 3 ? 'pointer' : 'not-allowed',
                      opacity: rune.count > 0 ? 1 : 0.4,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.6rem', color: '#ffe8aa' }}>{rune.symbol}</span>
                    <span style={{ fontSize: '0.72rem', color: '#d1d5db', marginTop: '2px' }}>{rune.name}</span>
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>x{rune.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Discovered Formulas & Secret Clues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Grimoire of Formulas */}
            <div className="gothic-card runic-corners" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="var(--gold-ancient)" /> Grimuar Odkrytych Pieczęci
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '1.4rem' }}>
                Odkryto {craftedFormulas?.length || 0} z {runeFormulas?.length || 0} pradawnych formuł Północy.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(runeFormulas || []).map(f => {
                  const isCrafted = (craftedFormulas || []).includes(f.id);

                  return (
                    <div
                      key={f.id}
                      style={{
                        padding: '1.2rem',
                        background: isCrafted ? 'rgba(20, 26, 38, 0.9)' : 'rgba(10, 12, 17, 0.6)',
                        border: isCrafted ? '1px solid var(--gold-ancient)' : '1px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        opacity: isCrafted ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '0.98rem', color: isCrafted ? '#ffffff' : '#9ca3af' }}>
                          {isCrafted ? f.name : '??? Nieodkryta Pieczęć'}
                        </h4>
                        {isCrafted && (
                          <span style={{ fontSize: '0.72rem', color: '#2ec4b6', background: 'rgba(46, 196, 182, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '3px' }}>
                            Wykuta
                          </span>
                        )}
                      </div>

                      {isCrafted ? (
                        <>
                          <p style={{ color: '#b0b7c3', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                            {f.description}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 600 }}>
                            Wymagane: {f.runes?.map(r => r.replace('rune-', '').toUpperCase()).join(' + ')} + {f.catalyst}
                          </div>
                        </>
                      ) : (
                        <p style={{ color: '#6b7280', fontSize: '0.78rem', fontStyle: 'italic' }}>
                          Eksperymentuj na ołtarzu łącząc runy o przeciwstawnych lub komplementarnych żywiołach.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lore Tip from Prof. Sigrid */}
            <div style={{ padding: '1.5rem', background: 'rgba(122, 24, 24, 0.15)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f7dca0', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <Zap size={16} /> Wskazówka Katedry Starożytnych Run:
              </div>
              <p style={{ color: '#cfd7e4', fontSize: '0.85rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                „Nigdy nie łącz runy Isa (Lód) z Kaunan (Ogień) bez stabilizatora w postaci Wody Lodowcowej. W przeciwnym razie fala parowa rozproszy Twoje skupienie. Pamiętaj: triada Tiwaz i Algiz z Krwią Renifera to fundament każdej nienaruszalnej tarczy.”
              </p>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--gold-ancient)', marginTop: '0.4rem' }}>
                — Prof. Sigrid Hällström
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Separate Modals: Grimoire & Rune Calligraphy */}
      <GrimoireBook isOpen={grimoireOpen} onClose={() => setGrimoireOpen(false)} />
      <RuneCalligraphyModal isOpen={runeCalligraphyOpen} onClose={() => setRuneCalligraphyOpen(false)} />
    </div>
  );
};
