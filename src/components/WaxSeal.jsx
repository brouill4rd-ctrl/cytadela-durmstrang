import React, { useState } from 'react';
import { useSound } from '../context/SoundContext';

export const WaxSeal = ({
  label = 'DURMSTRANG',
  sublabel = 'OFICJALNA PIECZĘĆ',
  color = '#6b1818',
  onBreak = () => {},
  broken = false
}) => {
  const { playWaxCrack } = useSound();
  const [isCracking, setIsCracking] = useState(false);
  const [isBroken, setIsBroken] = useState(broken);

  const handleClick = () => {
    if (isBroken || isCracking) return;
    setIsCracking(true);
    playWaxCrack();

    setTimeout(() => {
      setIsCracking(false);
      setIsBroken(true);
      onBreak();
    }, 450);
  };

  if (isBroken) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          border: '1px dashed rgba(197, 159, 78, 0.4)',
          background: 'rgba(107, 24, 24, 0.15)',
          color: '#e5c07b',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.05em'
        }}
      >
        <span>⚡</span> PIECZĘĆ ZŁAMANA (OTWARTE)
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      title="Kliknij, aby przełamać pieczęć woskową"
      style={{
        position: 'relative',
        width: '74px',
        height: '74px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #8b2020 0%, ${color} 60%, #3a0d0d 100%)`,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.8)',
        border: '2px solid rgba(218, 165, 32, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transform: isCracking ? 'scale(1.15) rotate(8deg)' : 'scale(1)',
        filter: isCracking ? 'brightness(1.4) drop-shadow(0 0 10px #c59f4e)' : 'none',
        transition: 'transform 0.2s ease, filter 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {/* Runic Double Ring Emboss */}
      <div
        style={{
          position: 'absolute',
          inset: '4px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 215, 0, 0.45)',
          pointerEvents: 'none'
        }}
      />

      <span
        style={{
          fontSize: '1.25rem',
          color: '#ffe599',
          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
          lineHeight: 1
        }}
      >
        ᛞ
      </span>
      <span
        style={{
          fontSize: '0.52rem',
          fontWeight: 700,
          color: '#ffe599',
          letterSpacing: '0.08em',
          marginTop: '2px',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {label}
      </span>
    </button>
  );
};
