import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Swords,
  Shield,
  Flame,
  Zap,
  X,
  Trophy,
  RotateCcw,
  Sparkles,
  Heart
} from 'lucide-react';

export const RunicDuelModal = ({ isOpen, onClose }) => {
  const { playWandSwoosh, playRuneChime, playSortingFanfare, playCoinSound } = useSound();
  const { awardHousePoints, currentUser, addCurrency, addNotification } = useSchool();

  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [duelLog, setDuelLog] = useState(['Stań w kamiennym kręgu i wybierz pierwszą runę pojedynku!']);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState(null);

  if (!isOpen) return null;

  const opponent = {
    name: 'Widmowy Szermierz Północy',
    title: 'Strażnik Skalnej Areny',
    avatar: '⚔️'
  };

  const moves = [
    {
      id: 'attack',
      name: 'Płomień Thurisaz',
      type: 'Atak',
      beats: 'curse',
      losesTo: 'defense',
      icon: <Flame size={18} style={{ color: '#f87171' }} />,
      color: '#ef4444',
      desc: 'Szkarłatny snop ognia rozbijający klątwy'
    },
    {
      id: 'defense',
      name: 'Lodowa Tarcza Isa',
      type: 'Obrona',
      beats: 'attack',
      losesTo: 'curse',
      icon: <Shield size={18} style={{ color: '#60a5fa' }} />,
      color: '#3b82f6',
      desc: 'Nieprzenikniona bariera z grubego lodu'
    },
    {
      id: 'curse',
      name: 'Przekleństwo Cienia',
      type: 'Podstęp',
      beats: 'defense',
      losesTo: 'attack',
      icon: <Zap size={18} style={{ color: '#c084fc' }} />,
      color: '#a855f7',
      desc: 'Cień przenikający wprost przez lodowe tarcze'
    }
  ];

  const handlePlayerMove = (playerMove) => {
    if (isFinished) return;
    playWandSwoosh();

    const enemyMove = moves[Math.floor(Math.random() * moves.length)];
    let newPlayerHp = playerHp;
    let newEnemyHp = enemyHp;
    let logMsg = '';

    if (playerMove.id === enemyMove.id) {
      logMsg = `Remis! Twoje zaklęcie (${playerMove.name}) zderzyło się z ${enemyMove.name} przeciwnika w rozbłysku iskier!`;
    } else if (playerMove.beats === enemyMove.id) {
      const damage = Math.floor(Math.random() * 15) + 25;
      newEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyHp(newEnemyHp);
      playRuneChime();
      logMsg = `Trafienie! Twoje ${playerMove.name} przełamało ${enemyMove.name} i zadało ${damage} obrażeń!`;
    } else {
      const damage = Math.floor(Math.random() * 15) + 20;
      newPlayerHp = Math.max(0, playerHp - damage);
      setPlayerHp(newPlayerHp);
      logMsg = `Porażka w starciu! ${enemyMove.name} przeciwnika przełamało Twoją obronę i zadało ${damage} obrażeń!`;
    }

    setDuelLog((prev) => [logMsg, ...prev.slice(0, 4)]);

    if (newEnemyHp <= 0) {
      setIsFinished(true);
      setWinner('player');
      playSortingFanfare();
      playCoinSound();
      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 25, 'Zwycięstwo w Runicznym Kręgu Pojedynków');
      if (addCurrency) addCurrency(35, 'Nagroda za wygrany pojedynek');
      if (addNotification) addNotification('⚔️ Zwycięstwo w Kręgu Pojedynków (+25 pkt dla Zakonu, +35 Sk.)!');
    } else if (newPlayerHp <= 0) {
      setIsFinished(true);
      setWinner('enemy');
    }
  };

  const handleRestart = () => {
    setPlayerHp(100);
    setEnemyHp(100);
    setIsFinished(false);
    setWinner(null);
    setDuelLog(['Rozpoczyna się nowe starcie w Kręgu Bazaltowym!']);
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
          background: 'linear-gradient(180deg, #181d28 0%, #0c0f16 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '740px',
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
            <Swords size={22} style={{ color: 'var(--gold-ancient)' }} />
            <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
              Runiczny Krąg Pojedynków • Arena Bazaltowa
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Duel Combatants Header */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
            {/* Player Side */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                  {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username : 'Twój Czarodziej'}
                </span>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>{playerHp} HP</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${playerHp}%`, height: '100%', background: '#4ade80', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* VS Badge */}
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontWeight: 700, fontSize: '1.2rem' }}>
              ⚔️ VS ⚔️
            </div>

            {/* Enemy Side */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#f87171', fontSize: '0.95rem' }}>
                  {opponent.name}
                </span>
                <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>{enemyHp} HP</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${enemyHp}%`, height: '100%', background: '#f87171', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>

          {/* Winner / Victory Box */}
          {isFinished ? (
            <div
              style={{
                background: winner === 'player' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `2px solid ${winner === 'player' ? '#22c55e' : '#ef4444'}`,
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <h3 style={{ margin: 0, color: winner === 'player' ? '#4ade80' : '#f87171', fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                {winner === 'player' ? '🏆 ZWYCIĘSTWO W POJEDYNKU (+25 PKT)' : '💀 PORAŻKA W STALOWYM KRĘGU'}
              </h3>
              <p style={{ color: '#d1d5db', margin: '0.5rem 0 1rem 0', fontSize: '0.9rem' }}>
                {winner === 'player'
                  ? 'Twoja biegłość w posługiwaniu się pradawnymi runami przyniosła chwałę i punkty Twojemu Zakonowi!'
                  : 'Widmowy Szermierz okazał się sprytniejszy. Przestudiuj gesty w Grimoire i spróbuj ponownie.'}
              </p>
              <button
                onClick={handleRestart}
                style={{
                  background: 'var(--gold-ancient)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Rzuć Ponowne Wyzwanie
              </button>
            </div>
          ) : (
            /* Action Buttons */
            <div>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Wybierz Runiczną Formułę Walki:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginTop: '0.6rem' }}>
                {moves.map((move) => (
                  <button
                    key={move.id}
                    onClick={() => handlePlayerMove(move)}
                    style={{
                      background: 'rgba(15, 20, 28, 0.8)',
                      border: `1px solid ${move.color}66`,
                      borderRadius: '8px',
                      padding: '1rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                      textAlign: 'left',
                      transition: 'transform 0.15s ease, background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${move.color}22`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 20, 28, 0.8)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {move.icon}
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
                        {move.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{move.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duel Log */}
          <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 600 }}>
              Kronika Starcia:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              {duelLog.map((log, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: i === 0 ? '#f3f4f6' : '#6b7280' }}>
                  • {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
