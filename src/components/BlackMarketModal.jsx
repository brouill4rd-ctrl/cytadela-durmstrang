import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Skull,
  ShoppingBag,
  Coins,
  Shield,
  X,
  Sparkles,
  Award,
  AlertTriangle,
  PackageCheck
} from 'lucide-react';

export const BlackMarketModal = ({ isOpen, onClose }) => {
  const { currentUser, addNotification, deductCurrency, addInventoryItem } = useSchool();
  const { playWandSwoosh, playCoinSound, playRuneChime } = useSound();

  const [blackMarketItems, setBlackMarketItems] = useState([
    { id: 'bm_1', name: 'Jad Lodowego Bazyliszka', price: 95, icon: '🧪', rarity: 'Czarna Magia', desc: 'Nielegalny ekstrakt zdolny przepalić każdą osłonę magiczną.' },
    { id: 'bm_2', name: 'Wytrych Cienia do Dormitoriów', price: 60, icon: '🗝️', rarity: 'Kontrabanda', desc: 'Pozwala na bezszelestne obejście zagadek strażników wrot.' },
    { id: 'bm_3', name: 'Zakazana Pieczęć Nekromancji', price: 130, icon: '💀', rarity: 'Artefakt Przeklęty', desc: 'Pozwala na przyzwanie szeptów pradawnych duchów z zaświatów.' },
    { id: 'bm_4', name: 'Smocze Oko z Głębin', price: 80, icon: '👁️', rarity: 'Rzadki Surowiec', desc: 'Katalizator podwajający siłę warzonych mikstur w kociołku.' }
  ]);

  if (!isOpen) return null;

  const handleBuy = (item) => {
    if (!currentUser) {
      addNotification('Musisz być zalogowany, by dokonywać zakupów w podziemiach.');
      return;
    }
    const success = deductCurrency(item.price, `Zakup z Czarnego Rynku: ${item.name}`);
    if (success) {
      playCoinSound();
      if (addInventoryItem) {
        addInventoryItem(item);
      }
      addNotification(`🏴‍☠️ Zakupiono z Czarnego Rynku: ${item.name} za ${item.price} Skirnirów!`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.94)',
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
          background: 'linear-gradient(180deg, #180d1a 0%, #08040a 100%)',
          border: '2px solid #a855f7',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Skull size={22} style={{ color: '#c084fc' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Czarny Rynek w Lochach • Zaułek Przemytników (Nattmarkadr)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                ZAKAZANE ARTEFAKTY, NIELEGALNA ALCHEMIA & KONTRABANDA
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

        {/* Shady NPC Banner */}
        <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🦹‍♂️</div>
          <div>
            <div style={{ fontWeight: 700, color: '#f3e8ff', fontSize: '0.95rem' }}>Jednooki Ivar (Paser z Podziemi):</div>
            <p style={{ margin: 0, color: '#c084fc', fontStyle: 'italic', fontSize: '0.85rem' }}>
              „Czego prefekci nie wiedzą, za to nie ukarzą... Spójrz na moje towary, adeptcie, ale nie zadawaj pytań skąd je mam.”
            </p>
          </div>
        </div>

        {/* Contraband Grid */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {blackMarketItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'rgba(20, 10, 26, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '1.2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>
                    {item.rarity}
                  </span>
                  <h4 style={{ margin: '0.1rem 0', color: '#ffffff', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                    {item.name}
                  </h4>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.78rem', lineHeight: 1.3 }}>
                    {item.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleBuy(item)}
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 0.9rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Kup ({item.price} Sk.)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
