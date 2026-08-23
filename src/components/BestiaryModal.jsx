import React, { useState } from 'react';
import { useSound } from '../context/SoundContext';
import {
  Skull,
  Shield,
  Flame,
  Volume2,
  X,
  Sparkles,
  Zap,
  Eye
} from 'lucide-react';

export const BestiaryModal = ({ isOpen, onClose }) => {
  const { playWandSwoosh, playRuneChime } = useSound();
  const [selectedBeast, setSelectedBeast] = useState(null);

  if (!isOpen) return null;

  const beasts = [
    {
      id: 'frost_drake',
      name: 'Smok Lodowych Fiordów (Dreki)',
      danger: 'Klasa Zagrożenia: XXXXX (Śmiertelny)',
      dangerColor: '#ef4444',
      habitat: 'Szczyty Gór Skandynawskich i Lodowce',
      weakness: 'Płomień Berserka (Ignis Furor)',
      icon: '🐉',
      desc: 'Skrzydlaty gad o łuskach twardszych niż diament. Jego lodowy oddech zamraża w kamień całe drakkary w ułamku sekundy.',
      lore: 'Pradawne sagi mówią, że założyciele Durmstrangu zawarli pakt z pierwszym Dreki, oddając mu pieczę nad podziemiami.'
    },
    {
      id: 'shadow_wolf',
      name: 'Widmowy Wilk Północy (Ulfr)',
      danger: 'Klasa Zagrożenia: XXXX (Niebezpieczny)',
      dangerColor: '#f97316',
      icon: '🐺',
      habitat: 'Przeklęta Puszcza Cieni (Myrkviðr)',
      weakness: 'Lumos Borealis (Rozproszenie Cienia)',
      desc: 'Drapieżnik zdolny do stapiania się z mrokiem. Jego wycie wywołuje paraliżujący strach w sercach adeptów.',
      lore: 'Zakonnicy z Reinhall i Björnhall często obłaskawiają młode wilki Ulfr na lojalnych chowańców.'
    },
    {
      id: 'ice_jotun',
      name: 'Lodowy Jotun (Jötunn)',
      danger: 'Klasa Zagrożenia: XXXXX (Monumentalny)',
      dangerColor: '#ef4444',
      icon: '🏔️',
      habitat: 'Jaskinie Jotunheimen',
      weakness: 'Runa Przełamania (Thurisaz)',
      desc: 'Pradawny kolos wykuty z lodowca i bazaltu. Porusza się powoli, lecz jego uderzenie kruszy mury zamkowe.',
      lore: 'Śpią przez stulecia w głębi tundry. Budzą się wyłącznie podczas największych anomalii magicznych Północy.'
    },
    {
      id: 'kraken',
      name: 'Głębinowy Kraken ze Skandów',
      danger: 'Klasa Zagrożenia: XXXXX (Legendarny)',
      dangerColor: '#a855f7',
      icon: '🐙',
      habitat: 'Bezkresne Głębiny Zamarzniętego Fiordu',
      weakness: 'Runiczny Piorun (Tiwaz)',
      desc: 'Wieloramienny potwór morski strzegący dna fiordu przed intruzami z zewnątrz.',
      lore: 'Członkowie Zakonu Otergard czerpią ze śluzu Krakena najsilniejsze odczynniki paraliżujące do alchemii.'
    }
  ];

  const currentBeast = selectedBeast || beasts[0];

  const handlePlayRoar = () => {
    playWandSwoosh();
    playRuneChime();
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
          background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Skull size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Bestiariusz Północy • Archiwum Magicznych Stworzeń
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                KRONIKI BESTII, RYKI & SŁABOŚCI NA CZARY Z GRIMOIRE
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

        {/* Content Grid */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
          {/* Beast Selector List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {beasts.map((beast) => (
              <button
                key={beast.id}
                onClick={() => {
                  playWandSwoosh();
                  setSelectedBeast(beast);
                }}
                style={{
                  background: currentBeast.id === beast.id ? 'rgba(197, 159, 78, 0.2)' : 'rgba(15, 20, 28, 0.7)',
                  border: currentBeast.id === beast.id ? '1.5px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '0.8rem',
                  color: currentBeast.id === beast.id ? '#ffe599' : '#d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{beast.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-heading)' }}>
                    {beast.name.split('(')[0]}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: beast.dangerColor }}>
                    {beast.danger.split(':')[1]?.trim()}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 3D Beast Showcase Card */}
          <div
            style={{
              background: 'radial-gradient(circle at 70% 30%, #1e283b 0%, #0d121c 100%)',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '8px',
              padding: '1.8rem',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: currentBeast.dangerColor, fontWeight: 700, textTransform: 'uppercase' }}>
                  {currentBeast.danger}
                </span>
                <h2 style={{ margin: '0.2rem 0', color: '#ffffff', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                  {currentBeast.name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  Siedlisko: <strong>{currentBeast.habitat}</strong>
                </div>
              </div>

              <button
                onClick={handlePlayRoar}
                style={{
                  background: 'rgba(197, 159, 78, 0.2)',
                  border: '1px solid var(--gold-ancient)',
                  color: '#ffe599',
                  borderRadius: '6px',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Volume2 size={14} /> Odgłos Bestii
              </button>
            </div>

            <p style={{ color: '#e5e7eb', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
              {currentBeast.desc}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>
                ⚡ Słabość na Zaklęcie z Grimoire:
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {currentBeast.weakness}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid var(--gold-ancient)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase' }}>
                📜 Fragment z Kronik Cytadeli:
              </div>
              <p style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.5, margin: '0.2rem 0 0 0' }}>
                „{currentBeast.lore}”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
