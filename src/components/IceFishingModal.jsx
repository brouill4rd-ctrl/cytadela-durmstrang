import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Anchor,
  Sparkles,
  Award,
  X,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const IceFishingModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency, addInventoryItem } = useSchool();
  const { playWandSwoosh, playRuneChime, playCoinSound } = useSound();

  const [state, setState] = useState('idle'); // 'idle' | 'waiting' | 'hooking' | 'caught'
  const [caughtItem, setCaughtItem] = useState(null);

  if (!isOpen) return null;

  const lootTable = [
    { name: 'Świetlisty Łosoś Fiordów', icon: '🐟', type: 'Składnik Alchemii', value: 15, points: 10 },
    { name: 'Złota Płotka Runiczna', icon: '🐠', type: 'Rzadka Ryba', value: 25, points: 15 },
    { name: 'Skrzynia Zatopionego Drakkara', icon: '📦', type: 'Skarb z Głębin', value: 50, points: 25 },
    { name: 'Zgubiony Pierścień Wikinga', icon: '💍', type: 'Pradawna Biżuteria', value: 35, points: 15 }
  ];

  const handleCastLine = () => {
    playWandSwoosh();
    setState('waiting');
    setCaughtItem(null);

    // Random bite time between 2 to 4 seconds
    const biteDelay = Math.floor(Math.random() * 2000) + 2000;
    setTimeout(() => {
      setState('hooking');
      playRuneChime();
    }, biteDelay);
  };

  const handleHook = () => {
    if (state !== 'hooking') return;

    playCoinSound();
    const item = lootTable[Math.floor(Math.random() * lootTable.length)];
    setCaughtItem(item);
    setState('caught');

    awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', item.points, `Połów w zamarzniętym fiordzie: ${item.name}`);
    if (addCurrency) addCurrency(item.value, `Wyłowiono ze skarbów fiordu: ${item.name}`);
    if (addInventoryItem) {
      addInventoryItem({
        name: item.name,
        icon: item.icon,
        rarity: item.type,
        price: item.value,
        desc: 'Wyłowione spod lodu fiordu.'
      });
    }
    addNotification(`🎣 Wyłowiono z lodu: ${item.name} (+${item.points} pkt, +${item.value} Sk.)!`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #141f2e 0%, #080d14 100%)',
          border: '2px solid #38bdf8',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Anchor size={22} style={{ color: '#38bdf8' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Połów w Zamarzniętym Fjordzie • Przystań Drakkarów
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                ARKTYCZNY POŁÓW SKŁADNIKÓW & ZATOPIONYCH SKARBÓW
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Ice Hole Visual */}
          <div
            style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #0284c7 0%, #082f49 70%, #030712 100%)',
              border: '6px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 25px rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {state === 'waiting' && (
              <span style={{ fontSize: '2.5rem', animation: 'bounce 1.5s infinite' }}>🪱</span>
            )}
            {state === 'hooking' && (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', animation: 'pulse 0.4s infinite' }}>⚡</span>
                <div style={{ color: '#facc15', fontWeight: 800, fontSize: '0.85rem' }}>BIERZE!</div>
              </div>
            )}
            {state === 'caught' && (
              <span style={{ fontSize: '3.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                {caughtItem?.icon}
              </span>
            )}
            {state === 'idle' && (
              <span style={{ fontSize: '1rem', color: '#93c5fd', fontStyle: 'italic' }}>Cisza w lodzie...</span>
            )}
          </div>

          {/* Caught Result Banner */}
          {state === 'caught' && (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1.5px solid #22c55e', borderRadius: '8px', padding: '1rem 1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#4ade80', textTransform: 'uppercase', fontWeight: 700 }}>
                ✨ WYŁOWIONO Z GŁĘBIN!
              </span>
              <h4 style={{ margin: '0.2rem 0', color: '#ffffff', fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
                {caughtItem?.name}
              </h4>
              <div style={{ fontSize: '0.85rem', color: '#d1fae5' }}>
                Wartość: {caughtItem?.value} • +{caughtItem?.points} pkt dla Zakonu
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          {state === 'idle' || state === 'caught' ? (
            <button
              onClick={handleCastLine}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.7rem 1.8rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              🎣 Wyrąb Przerębel i Zarzuć Wędkę
            </button>
          ) : state === 'hooking' ? (
            <button
              onClick={handleHook}
              style={{
                background: '#f59e0b',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.8rem 2.2rem',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: 'pointer',
                animation: 'pulse 0.5s infinite',
                boxShadow: '0 0 25px #f59e0b'
              }}
            >
              ⚡ ZATNIJ WĘDKĘ!
            </button>
          ) : (
            <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Czekaj na drgnięcie żyłki w lodowej toni...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
