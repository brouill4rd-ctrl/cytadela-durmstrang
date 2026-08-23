import React, { useEffect, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Sparkles, Trophy } from 'lucide-react';

export const LivingHourglasses = () => {
  const { houses } = useSchool();

  const maxPoints = Math.max(...(houses || []).map(h => h.points || 0), 100);

  const houseThemes = {
    renifer: {
      name: 'Reinhall',
      gemColor: '#d4af37',
      gemGlow: 'rgba(212, 175, 55, 0.6)',
      symbol: '🦌',
      border: 'rgba(212, 175, 55, 0.4)',
      bgGrad: 'linear-gradient(180deg, rgba(122, 24, 24, 0.4) 0%, rgba(20, 10, 10, 0.85) 100%)'
    },
    niedzwiedz: {
      name: 'Björnhall',
      gemColor: '#e53935',
      gemGlow: 'rgba(229, 57, 53, 0.6)',
      symbol: '🐻',
      border: 'rgba(229, 57, 53, 0.4)',
      bgGrad: 'linear-gradient(180deg, rgba(90, 18, 18, 0.4) 0%, rgba(15, 10, 10, 0.85) 100%)'
    },
    kruk: {
      name: 'Ravnheim',
      gemColor: '#29b6f6',
      gemGlow: 'rgba(41, 182, 246, 0.6)',
      symbol: '🐦',
      border: 'rgba(41, 182, 246, 0.4)',
      bgGrad: 'linear-gradient(180deg, rgba(20, 45, 90, 0.4) 0%, rgba(10, 15, 25, 0.85) 100%)'
    },
    wydra: {
      name: 'Otergard',
      gemColor: '#26a69a',
      gemGlow: 'rgba(38, 166, 154, 0.6)',
      symbol: '🦦',
      border: 'rgba(38, 166, 154, 0.4)',
      bgGrad: 'linear-gradient(180deg, rgba(15, 60, 50, 0.4) 0%, rgba(10, 20, 18, 0.85) 100%)'
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(16, 20, 28, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: '1px solid rgba(197, 159, 78, 0.3)',
        borderRadius: '8px',
        padding: '1.25rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={18} style={{ color: 'var(--gold-ancient)' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            Puchar Północy • Klepsydry Kryształowe
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'var(--font-heading)' }}>
          ᛞ SEZON AKADEMICKI
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
        {(houses || []).map((house) => {
          const theme = houseThemes[house.id] || houseThemes.renifer;
          const fillPercent = Math.min(Math.max(((house.points || 0) / maxPoints) * 100, 15), 100);

          return (
            <div
              key={house.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: theme.bgGrad,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '0.8rem 0.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{theme.symbol}</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f3f4f6', fontFamily: 'var(--font-heading)' }}>
                {theme.name}
              </span>

              {/* 3D Glass Tube / Hourglass Cylinder */}
              <div
                style={{
                  width: '38px',
                  height: '110px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(0, 0, 0, 0.65)',
                  margin: '0.6rem 0',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `inset 0 0 10px rgba(0,0,0,0.8), 0 0 12px ${theme.gemGlow}`
                }}
              >
                {/* Glass Reflection Highlight */}
                <div
                  style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '6px',
                    height: '95px',
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 100%)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}
                />

                {/* Crystal Fluid Fill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${fillPercent}%`,
                    background: `linear-gradient(180deg, ${theme.gemColor} 0%, ${theme.gemColor}99 60%, #1a1a1a 100%)`,
                    transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 0 15px ${theme.gemColor}`
                  }}
                >
                  {/* Floating Runic Gems inside */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: `0 0 8px ${theme.gemColor}`,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                </div>
              </div>

              {/* Points Label */}
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: theme.gemColor,
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  {house.points || 0}
                </span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Punktów
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
