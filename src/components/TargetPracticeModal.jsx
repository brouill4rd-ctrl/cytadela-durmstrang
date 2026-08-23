import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Crosshair,
  Target,
  Sparkles,
  Trophy,
  X,
  Play,
  RotateCcw,
  Zap,
  Flame,
  Award
} from 'lucide-react';

export const TargetPracticeModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [targets, setTargets] = useState([]);

  // Timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Target spawner
  useEffect(() => {
    if (!isPlaying) return;

    const spawner = setInterval(() => {
      const types = [
        { id: 'ice', name: 'Lodowa Tarcza', points: 10, icon: '🎯', color: '#38bdf8', size: 48 },
        { id: 'crow', name: 'Widmowy Kruk', points: 25, icon: '🦅', color: '#c084fc', size: 40 },
        { id: 'gold', name: 'Złota Runa', points: 50, icon: 'ᛟ', color: '#facc15', size: 44 },
        { id: 'skull', name: 'Czaszka Pułapka', points: -30, icon: '💀', color: '#ef4444', size: 44 }
      ];

      const chosenType = types[Math.floor(Math.random() * types.length)];
      const newTarget = {
        uid: Date.now() + Math.random(),
        ...chosenType,
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 70) + 15
      };

      setTargets((prev) => [...prev.slice(-6), newTarget]);
    }, 800);

    return () => clearInterval(spawner);
  }, [isPlaying]);

  if (!isOpen) return null;

  const startGame = () => {
    playWandSwoosh();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setCombo(1);
    setTimeLeft(25);
    setTargets([]);
  };

  const finishGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    setTargets([]);
    playSortingFanfare();

    const housePointsEarned = Math.max(5, Math.floor(score / 15));
    const coinsEarned = Math.max(2, Math.floor(score / 10));
    awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', housePointsEarned, `Trening na Runicznej Strzelnicy (Wynik: ${score} pkt)`);
    if (addCurrency) addCurrency(coinsEarned, 'Nagroda za celność na strzelnicy');
    addNotification(`🎯 Zakończono trening! Wynik: ${score} pkt (+${housePointsEarned} pkt dla Zakonu, +${coinsEarned} Sk.)`);
  };

  const handleShootTarget = (target) => {
    playWandSwoosh();

    if (target.id === 'skull') {
      setCombo(1);
      setScore((prev) => Math.max(0, prev + target.points));
    } else {
      playRuneChime();
      const pointsAdded = target.points * combo;
      setScore((prev) => prev + pointsAdded);
      setCombo((prev) => Math.min(prev + 1, 5));
    }

    setTargets((prev) => prev.filter((t) => t.uid !== target.uid));
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
          background: 'linear-gradient(180deg, #161c28 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
          overflow: 'hidden',
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
            <Crosshair size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Runiczna Strzelnica • Dziedziniec Szermierki Różdżkowej
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                TRENING CELNOŚCI & REFLEKSU CZARODZIEJA
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

        {/* Dashboard Banner */}
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Czas do końca</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: timeLeft <= 5 ? '#ef4444' : '#ffffff', fontFamily: 'monospace' }}>
              ⏳ {timeLeft}s
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Punkty Treningu</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
              🎯 {score} pkt
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>Mnożnik Combo</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-heading)' }}>
              ⚡ x{combo}
            </div>
          </div>
        </div>

        {/* Playfield Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            background: 'radial-gradient(circle at center, #1b2434 0%, #080c14 100%)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
            cursor: 'crosshair',
            overflow: 'hidden'
          }}
        >
          {/* Background Grid Lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(197, 159, 78, 0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.4,
              pointerEvents: 'none'
            }}
          />

          {!isPlaying && !gameOver && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
              <Target size={48} color="var(--gold-ancient)" />
              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                Gotowy do Runicznego Treningu?
              </h4>
              <p style={{ margin: 0, color: '#9ca3af', maxWidth: '480px', fontSize: '0.88rem' }}>
                Klikaj w pojawiające się tarcze, kruki i złote runy, aby zdobywać punkty i budować combo. Unikaj czerwonych czaszek pułapek!
              </p>
              <button
                onClick={startGame}
                style={{
                  background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.7rem 1.8rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 20px rgba(197, 159, 78, 0.4)'
                }}
              >
                <Play size={16} /> Rozpocznij Trening (25s)
              </button>
            </div>
          )}

          {gameOver && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(10, 14, 22, 0.9)', padding: '1rem', textAlign: 'center' }}>
              <Trophy size={48} color="var(--gold-ancient)" />
              <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                KONIEC CZASU! TWÓJ WYNIK: {score} PKT
              </h3>
              <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.9rem' }}>
                Przyznano +{Math.max(5, Math.floor(score / 15))} punktów do Pucharu Północy dla Twojego Zakonu!
              </p>
              <button
                onClick={startGame}
                style={{
                  background: 'var(--gold-ancient)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 1.4rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RotateCcw size={15} /> Zagraj Ponownie
              </button>
            </div>
          )}

          {/* Active Targets */}
          {isPlaying &&
            targets.map((target) => (
              <div
                key={target.uid}
                onClick={() => handleShootTarget(target)}
                style={{
                  position: 'absolute',
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${target.color}33 0%, rgba(0,0,0,0.8) 100%)`,
                  border: `2px solid ${target.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  boxShadow: `0 0 15px ${target.color}`,
                  animation: 'pulse 1s infinite',
                  userSelect: 'none'
                }}
              >
                {target.icon}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
