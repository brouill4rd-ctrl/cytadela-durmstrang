import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';

export const SecretRune = ({ secretId, style, className = '' }) => {
  const { discoveredSecrets, discoverSecret } = useSchool();
  const { playRuneChime } = useSound();

  const isDiscovered = discoveredSecrets.includes(secretId);

  const handleClick = (e) => {
    e.stopPropagation();
    playRuneChime();
    discoverSecret(secretId);
  };

  return (
    <button
      onClick={handleClick}
      title={isDiscovered ? 'Tajemnica odkryta!' : 'Prastara runa wibruje pod twoim spojrzeniem...'}
      className={`secret-rune-btn animate-rune-float ${isDiscovered ? 'discovered' : ''} ${className}`}
      style={{
        opacity: isDiscovered ? 0.9 : 0.45,
        borderColor: isDiscovered ? 'var(--gold-glow)' : 'rgba(197, 159, 78, 0.3)',
        color: isDiscovered ? '#ffe8aa' : 'var(--gold-ancient)',
        ...style
      }}
    >
      ᚱ
    </button>
  );
};
