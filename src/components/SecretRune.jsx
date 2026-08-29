import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3h

const loadState = (secretId) => {
  try {
    const raw = localStorage.getItem(`rune_state_${secretId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveState = (secretId, state) => {
  localStorage.setItem(`rune_state_${secretId}`, JSON.stringify(state));
};

const randomPos = () => ({
  top: (Math.random() * 70 + 10).toFixed(1) + 'vh',
  left: (Math.random() * 78 + 5).toFixed(1) + 'vw',
});

export const SecretRune = ({ secretId }) => {
  const { discoveredSecrets, discoverSecret } = useSchool();
  const { playRuneChime } = useSound();

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: '50vh', left: '50vw' });
  const timerRef = useRef(null);

  useEffect(() => {
    const schedule = () => {
      const state = loadState(secretId);
      const now = Date.now();
      const clickedAt = state?.clickedAt ?? 0;
      const remaining = COOLDOWN_MS - (now - clickedAt);

      if (remaining <= 0) {
        const newPos = state?.pos ?? randomPos();
        setPos(newPos);
        setVisible(true);
      } else {
        setVisible(false);
        timerRef.current = setTimeout(() => {
          const newPos = randomPos();
          saveState(secretId, { clickedAt: 0, pos: newPos });
          setPos(newPos);
          setVisible(true);
        }, remaining);
      }
    };

    schedule();
    return () => clearTimeout(timerRef.current);
  }, [secretId]);

  const handleClick = (e) => {
    e.stopPropagation();
    playRuneChime();
    discoverSecret(secretId);

    const newPos = randomPos();
    saveState(secretId, { clickedAt: Date.now(), pos: newPos });
    setVisible(false);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPos(newPos);
      setVisible(true);
    }, COOLDOWN_MS);
  };

  if (!visible) return null;

  const isDiscovered = discoveredSecrets.includes(secretId);

  return (
    <button
      onClick={handleClick}
      title={isDiscovered ? 'Znana Tajemnica' : 'Prastara runa wibruje pod twoim spojrzeniem...'}
      className="secret-rune-btn animate-rune-float"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        opacity: isDiscovered ? 0.7 : 0.45,
        borderColor: isDiscovered ? 'var(--gold-glow)' : 'rgba(197, 159, 78, 0.3)',
        color: isDiscovered ? '#ffe8aa' : 'var(--gold-ancient)',
        pointerEvents: 'auto',
      }}
    >
      ᚱ
    </button>
  );
};
