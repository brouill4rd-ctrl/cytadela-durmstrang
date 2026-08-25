import React, { useState, useEffect } from 'react';
import { Shield, Trophy, Users, Award, Star, ChevronRight, Eye } from 'lucide-react';
import { api } from '../../api';

export const MemoryOrderShowcaseTab = ({ houseKey, onSelectHouse, onSelectPerson }) => {
  const [activeHouse, setActiveHouse] = useState(houseKey || 'ravnheim');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (houseKey) {
      setActiveHouse(houseKey);
    }
  }, [houseKey]);

  useEffect(() => {
    const loadOrderShowcase = async () => {
      setLoading(true);
      const res = await api.getMemoryOrderShowcase(activeHouse);
      if (res.ok && res.data) {
        setOrderData(res.data);
      }
      setLoading(false);
    };
    loadOrderShowcase();
  }, [activeHouse]);

  const houseConfigs = {
    reinhall: {
      name: 'Reinhall',
      fullName: 'Zakon Reinhall (Ordo Rangiferi)',
      icon: '🦌',
      color: '#fde047',
      border: '#c59f4e',
      bg: 'rgba(122, 24, 24, 0.25)',
      motto: '„Krew nie kłamie, mróz nie wybacza.”',
      element: 'Krew i Wieczna Zmarzlina'
    },
    bjornhall: {
      name: 'Björnhall',
      fullName: 'Zakon Björnhall (Ordo Ursi)',
      icon: '🐻',
      color: '#f87171',
      border: '#c02b2b',
      bg: 'rgba(32, 37, 48, 0.35)',
      motto: '„Pancerz z woli, miecz z wiedzy.”',
      element: 'Żelazo i Pęknięta Skala'
    },
    ravnheim: {
      name: 'Ravnheim',
      fullName: 'Zakon Ravnheim (Ordo Corvi)',
      icon: '🐦',
      color: '#c084fc',
      border: '#a77de0',
      bg: 'rgba(28, 19, 19, 0.35)',
      motto: '„W ciszy cienia kryje się potęga.”',
      element: 'Cień i Astralna Noc'
    },
    otergard: {
      name: 'Otergard',
      fullName: 'Zakon Otergard (Ordo Lutrae)',
      icon: '🦦',
      color: '#5eead4',
      border: '#2ec4b6',
      bg: 'rgba(13, 45, 51, 0.35)',
      motto: '„Przenikamy każdą szczelinę.”',
      element: 'Lodowcowe Wody i Toksyny'
    }
  };

  const currentHouse = houseConfigs[activeHouse] || houseConfigs.ravnheim;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* House Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {Object.keys(houseConfigs).map((hKey) => {
          const cfg = houseConfigs[hKey];
          const isActive = activeHouse === hKey;
          return (
            <button
              key={hKey}
              onClick={() => {
                setActiveHouse(hKey);
                if (onSelectHouse) onSelectHouse(hKey);
              }}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '6px',
                background: isActive ? cfg.bg : 'rgba(255, 255, 255, 0.04)',
                border: isActive ? `2px solid ${cfg.border}` : '1px solid rgba(255, 255, 255, 0.1)',
                color: isActive ? cfg.color : '#cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{cfg.icon}</span>
              <span>Zakon {cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Showcase Banner */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          border: `2px solid ${currentHouse.border}`,
          background: `radial-gradient(ellipse at top right, ${currentHouse.bg} 0%, rgba(10, 13, 18, 0.98) 75%)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            HISTORYCZNA GABLOTA CHWAŁY
          </div>
          <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.3rem 0' }}>
            {currentHouse.fullName}
          </h1>
          <p style={{ fontSize: '1rem', fontStyle: 'italic', color: currentHouse.color, margin: '0.3rem 0 0' }}>
            {currentHouse.motto}
          </p>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.4rem' }}>
            Żywioł i Rzemiosło: <strong>{currentHouse.element}</strong>
          </div>
        </div>

        {/* Counters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem 1.4rem', borderRadius: '8px', textAlign: 'center', border: `1px solid ${currentHouse.border}55` }}>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: currentHouse.color, fontWeight: 800 }}>
              {orderData?.trophiesCount || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Zdobyte Puchary</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem 1.4rem', borderRadius: '8px', textAlign: 'center', border: `1px solid ${currentHouse.border}55` }}>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
              {orderData?.bestRecord?.points || 2458} pkt
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>
              Rekord Punktowy ({orderData?.bestRecord?.yearName || 'XVII Rok'})
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="gothic-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Wczytywanie gabloty Zakonu...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* 1. Dawni i Obecni Opiekunowie Zakonu */}
          <div className="gothic-card" style={{ padding: '1.8rem', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color={currentHouse.color} /> Oś Czasu Opiekunów Zakonu
            </h3>

            {(orderData?.houseHeadsTimeline || []).length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Brak zapisów w księdze opiekunów.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orderData.houseHeadsTimeline.map((head, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: '6px' }}>
                    <img
                      src={head.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                      alt={head.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${currentHouse.border}` }}
                    />
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {head.yearName}
                      </span>
                      <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800 }}>
                        {head.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{head.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Najlepsi Uczniowie w Historii Zakonu */}
          <div className="gothic-card" style={{ padding: '1.8rem', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color={currentHouse.color} /> Najlepsi Adepci w Historii Zakonu
            </h3>

            {(orderData?.topStudents || []).length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Brak zapisów adeptów.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {orderData.topStudents.map((st, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectPerson && onSelectPerson(st.userId || st.characterName)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.7rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: idx === 0 ? '#fde047' : '#9ca3af' }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>{st.characterName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{st.yearName} ({st.isGraduate ? 'Absolwent' : st.classYear})</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: currentHouse.color }}>
                      {st.points} pkt
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
