import React, { useState } from 'react';
import { useSound } from '../context/SoundContext';
import { useSchool } from '../context/SchoolContext';
import {
  Flame,
  RotateCw,
  Sparkles,
  Droplets,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

export const AlchemicalCauldron = () => {
  const { playPotionBubble, playRuneChime, playWandSwoosh } = useSound();
  const { addNotification, awardHousePoints, currentUser, addInventoryItem } = useSchool();

  const [cauldronIngredients, setCauldronIngredients] = useState([]);
  const [heatLevel, setHeatLevel] = useState(2); // 1 to 4
  const [isStirring, setIsStirring] = useState(false);
  const [brewResult, setBrewResult] = useState(null);

  const availableIngredients = [
    { id: 'dragon_blood', name: 'Smocza Krew z Fiordu', color: '#dc2626', icon: '🩸' },
    { id: 'glacial_water', name: 'Woda z Lodowca', color: '#38bdf8', icon: '❄️' },
    { id: 'runic_dust', name: 'Srebrzysty Pył Runiczny', color: '#c084fc', icon: '✨' },
    { id: 'black_moss', name: 'Mech z Czarnego Lasu', color: '#16a34a', icon: '🌿' },
    { id: 'wolf_berries', name: 'Wilcze Jagody Cienia', color: '#7c3aed', icon: '🫐' },
    { id: 'beryl', name: 'Sproszkowany Beryl', color: '#f59e0b', icon: '💎' }
  ];

  const handleAddIngredient = (ing) => {
    if (cauldronIngredients.length >= 3) return;
    playPotionBubble();
    setCauldronIngredients([...cauldronIngredients, ing]);
    setBrewResult(null);
  };

  const handleClearCauldron = () => {
    setCauldronIngredients([]);
    setBrewResult(null);
  };

  const handleStir = () => {
    if (cauldronIngredients.length === 0) return;
    setIsStirring(true);
    playPotionBubble();

    setTimeout(() => {
      setIsStirring(false);
      evaluateBrew();
    }, 1200);
  };

  const evaluateBrew = () => {
    const ids = cauldronIngredients.map(i => i.id).sort().join('+');

    let result = null;

    if (ids.includes('dragon_blood') && ids.includes('beryl')) {
      result = {
        name: 'Eliksir Berserka Północy',
        desc: 'Potężna mikstura wzmagająca siłę woli i odporność na czarną magię.',
        color: '#ef4444',
        points: 15,
        item: {
          id: `brew_berserk_${Date.now()}`,
          name: 'Eliksir Berserka Północy',
          price: 45,
          category: 'potions',
          description: 'Uwarzona własnoręcznie mikstura furii.'
        }
      };
    } else if (ids.includes('glacial_water') && ids.includes('runic_dust')) {
      result = {
        name: 'Płynna Fortuna Cytadeli',
        desc: 'Mistyczny wywar przynoszący szczęście w rzucaniu kości i losowaniu run.',
        color: '#c084fc',
        points: 20,
        item: {
          id: `brew_luck_${Date.now()}`,
          name: 'Płynna Fortuna Cytadeli',
          price: 60,
          category: 'potions',
          description: 'Runiczny eliksir pomyślności.'
        }
      };
    } else if (ids.includes('black_moss') && ids.includes('wolf_berries')) {
      result = {
        name: 'Odwar Niewidzialności Cienia',
        desc: 'Pozwala na bezszelestne przemykanie korytarzami w czasie ciszy nocnej.',
        color: '#10b981',
        points: 10,
        item: {
          id: `brew_invis_${Date.now()}`,
          name: 'Odwar Niewidzialności Cienia',
          price: 35,
          category: 'potions',
          description: 'Kamuflaż w mroku.'
        }
      };
    } else {
      result = {
        name: 'Północny Wywar Wzmacniający',
        desc: 'Podstawowa mikstura rozgrzewająca ciało w czasie arktycznych mrozów.',
        color: '#f59e0b',
        points: 5,
        item: {
          id: `brew_warmth_${Date.now()}`,
          name: 'Północny Wywar Wzmacniający',
          price: 15,
          category: 'potions',
          description: 'Uwarzony odwar ziół.'
        }
      };
    }

    playRuneChime();
    playWandSwoosh();
    setBrewResult(result);

    awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', result.points, `Uwarzenie mikstury: ${result.name}`);
    if (addInventoryItem && result.item) {
      addInventoryItem({
        name: result.name,
        icon: '🧪',
        rarity: 'Warzony Eliksir',
        price: result.item.price || 30,
        desc: result.desc
      });
    }
    addNotification(`🧪 Pomyślnie uwarzono: ${result.name} (+${result.points} pkt dla Zakonu)!`);
  };

  // Cauldron liquid gradient calculation
  const liquidColor = cauldronIngredients.length === 0
    ? '#1e293b'
    : cauldronIngredients[cauldronIngredients.length - 1].color;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #131822 0%, #0c0f16 100%)',
        border: '1px solid rgba(197, 159, 78, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Pracownia Alchemiczna
          </span>
          <h3 style={{ margin: '0.2rem 0 0 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
            Kocioł Warzenia Eliksirów
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Flame size={16} style={{ color: '#f97316' }} />
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Płomień:</span>
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setHeatLevel(lvl)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: 'none',
                background: lvl <= heatLevel ? '#f97316' : 'rgba(255,255,255,0.1)',
                color: lvl <= heatLevel ? '#000000' : '#9ca3af',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        {/* Cauldron Visual Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {/* Iron Cauldron */}
          <div
            style={{
              position: 'relative',
              width: '180px',
              height: '140px',
              borderRadius: '0 0 90px 90px',
              background: 'linear-gradient(180deg, #374151 0%, #111827 100%)',
              border: '3px solid #4b5563',
              boxShadow: `0 10px 30px rgba(0,0,0,0.9), 0 0 ${heatLevel * 10}px rgba(249, 115, 22, 0.4)`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Liquid Surface */}
            <div
              style={{
                width: '150px',
                height: '50px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${liquidColor} 0%, #0f172a 100%)`,
                marginTop: '10px',
                boxShadow: `inset 0 0 15px rgba(0,0,0,0.8), 0 0 20px ${liquidColor}88`,
                position: 'relative',
                transform: isStirring ? 'rotate(180deg) scale(1.05)' : 'none',
                transition: 'all 0.6s ease'
              }}
            >
              {/* Bubbles */}
              <div
                style={{
                  position: 'absolute',
                  top: '15px',
                  left: '30%',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  opacity: 0.6,
                  animation: 'pulse 1s infinite'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '25px',
                  left: '65%',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  opacity: 0.4,
                  animation: 'pulse 1.4s infinite'
                }}
              />
            </div>
          </div>

          {/* Controls Under Cauldron */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleStir}
              disabled={isStirring || cauldronIngredients.length === 0}
              style={{
                background: 'var(--gold-ancient)',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                cursor: cauldronIngredients.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: cauldronIngredients.length === 0 ? 0.5 : 1
              }}
            >
              <RotateCw size={14} className={isStirring ? 'spin' : ''} />
              {isStirring ? 'Mieszanie...' : 'Wymieszaj Wywar'}
            </button>

            <button
              onClick={handleClearCauldron}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '0.5rem 0.8rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Trash2 size={14} /> Wylej
            </button>
          </div>
        </div>

        {/* Ingredients Shelf */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Półka ze Składnikami (Wybierz max 3)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {availableIngredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => handleAddIngredient(ing)}
                disabled={cauldronIngredients.length >= 3}
                style={{
                  background: 'rgba(15, 20, 28, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  cursor: cauldronIngredients.length >= 3 ? 'not-allowed' : 'pointer',
                  opacity: cauldronIngredients.length >= 3 ? 0.4 : 1,
                  textAlign: 'left'
                }}
              >
                <span>{ing.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ing.name}</span>
              </button>
            ))}
          </div>

          {/* Current Ingredients in Pot */}
          <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>W kociołku ({cauldronIngredients.length}/3):</span>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
              {cauldronIngredients.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>Kocioł jest pusty. Dodaj składniki.</span>
              ) : (
                cauldronIngredients.map((ing, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: `${ing.color}22`,
                      border: `1px solid ${ing.color}`,
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    {ing.icon} {ing.name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brew Result Banner */}
      {brewResult && (
        <div
          style={{
            marginTop: '1.2rem',
            background: 'rgba(15, 25, 20, 0.9)',
            border: `2px solid ${brewResult.color}`,
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: `0 0 25px ${brewResult.color}44`
          }}
        >
          <div style={{ fontSize: '2rem' }}>🧪</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', color: brewResult.color, textTransform: 'uppercase', fontWeight: 700 }}>
              ✨ UWARZONO NOWĄ MIKSTURĘ (+{brewResult.points} PKT DLA ZAKONU)
            </span>
            <h4 style={{ margin: '0.1rem 0', color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
              {brewResult.name}
            </h4>
            <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.85rem' }}>
              {brewResult.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
