import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Trophy,
  Swords,
  Shield,
  Flame,
  Zap,
  X,
  RotateCcw,
  Sparkles,
  Award,
  Crown
} from 'lucide-react';

export const TournamentGauntletModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency, addInventoryItem } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare, playCoinSound } = useSound();

  const opponents = [
    { name: 'Nowicjusz Sven z Reinhall', role: 'Runda 1: Eliminacje', maxHp: 60, icon: '🦌', color: '#d4af37' },
    { name: 'Berserk Gunnar z Björnhall', role: 'Runda 2: Ćwierćfinał', maxHp: 80, icon: '🐻', color: '#ef4444' },
    { name: 'Mistrzyni Ilona z Ravnheim', role: 'Runda 3: Półfinał', maxHp: 100, icon: '🦅', color: '#38bdf8' },
    { name: 'Alchemik Vidar z Otergard', role: 'Runda 4: Walka o Puchar', maxHp: 120, icon: '🦦', color: '#2dd4bf' },
    { name: 'Arcymistrzyni Valgerda Storm', role: 'FINAŁ: Starcie z Władczynią Cytadeli', maxHp: 150, icon: '👑', color: '#facc15' }
  ];

  const [currentRound, setCurrentRound] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(opponents[0].maxHp);
  const [tournamentWon, setTournamentWon] = useState(false);
  const [duelLog, setDuelLog] = useState(['Rozpoczyna się Turniej o Puchar Północy!']);

  if (!isOpen) return null;

  const currentOpponent = opponents[currentRound];

  const handleFight = (playerAction) => {
    playWandSwoosh();

    const damageToEnemy = Math.floor(Math.random() * 20) + 20;
    const damageToPlayer = Math.floor(Math.random() * 15) + 10;

    const newEnemyHp = Math.max(0, enemyHp - damageToEnemy);
    const newPlayerHp = Math.max(0, playerHp - damageToPlayer);

    setEnemyHp(newEnemyHp);
    setPlayerHp(newPlayerHp);

    setDuelLog([
      `Zadano ${damageToEnemy} obrażeń rywalowi (${currentOpponent.name}). Otrzymano ${damageToPlayer} obrażeń zwrotnych.`,
      ...duelLog.slice(0, 3)
    ]);

    if (newEnemyHp <= 0) {
      playSortingFanfare();
      if (currentRound + 1 < opponents.length) {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setEnemyHp(opponents[nextRound].maxHp);
        setPlayerHp(Math.min(100, playerHp + 30)); // Health recovery between rounds
        setDuelLog([`🏆 Zwycięstwo! Awans do: ${opponents[nextRound].role}!`, ...duelLog]);
      } else {
        setTournamentWon(true);
        playCoinSound();
        awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 100, 'ZWYCIĘSTWO W TURNIEJU TRZECH TWIERDZ (POKONANIE DYREKTORKI)');
        if (addCurrency) addCurrency(150, 'Główna nagroda w Turnieju Trzech Twierdz');
        if (addInventoryItem) {
          addInventoryItem({
            name: 'Puchar Czempiona Północy',
            icon: '🏆',
            rarity: 'Mityczny Relikt',
            price: 300,
            desc: 'Zdobyty po pokonaniu Arcymistrzyni Valgerdy Storm w finale.'
          });
        }
        addNotification('👑 ABSOLUTNY TRIUMF! Zostałeś Czempionem Cytadeli Durmstrang (+100 pkt, +150 Sk. oraz Puchar Czempiona)!');
      }
    }
  };

  const handleReset = () => {
    setCurrentRound(0);
    setPlayerHp(100);
    setEnemyHp(opponents[0].maxHp);
    setTournamentWon(false);
    setDuelLog(['Rozpoczyna się nowy turniej!']);
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
          background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
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
            <Trophy size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Turniej Szermierki Różdżkowej • Droga Czempiona
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                DRABINKA 5 RUND • OD NOWICJUSZA DO DYREKTORKI
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

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Tournament Steps Tracker */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            {opponents.map((opp, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '4px',
                  background: idx === currentRound ? 'rgba(197, 159, 78, 0.25)' : idx < currentRound ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.4)',
                  border: idx === currentRound ? '1.5px solid var(--gold-ancient)' : idx < currentRound ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.2rem' }}>{opp.icon}</div>
                <div style={{ fontSize: '0.65rem', color: idx === currentRound ? '#ffe599' : '#9ca3af', fontWeight: 700 }}>
                  R{idx + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Combat Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
            {/* Player */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>Twój Czarodziej</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{playerHp} HP</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${playerHp}%`, height: '100%', background: '#4ade80', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ fontWeight: 800, color: 'var(--gold-ancient)' }}>VS</div>

            {/* Enemy */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px', border: `1px solid ${currentOpponent.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, color: currentOpponent.color, fontSize: '0.9rem' }}>{currentOpponent.name}</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{enemyHp} HP</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(enemyHp / currentOpponent.maxHp) * 100}%`, height: '100%', background: '#f87171', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* Action Trigger or Victory */}
          {tournamentWon ? (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
              <Crown size={48} color="var(--gold-ancient)" />
              <h3 style={{ margin: '0.4rem 0', color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                👑 POKONANO WSZYSTKICH MISTRZÓW CYTADELI!
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.2rem auto' }}>
                Sama Arcymistrzyni Valgerda Storm złożyła Ci ukłon szacunku. Zostałeś wpisany do Złotej Księgi Czempionów!
              </p>
              <button
                onClick={handleReset}
                style={{
                  background: 'var(--gold-ancient)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 1.4rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Rozpocznij Turniej Ponownie
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <button
                onClick={() => handleFight('strike')}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Flame size={16} /> Potężne Uderzenie Magią Ognia
              </button>

              <button
                onClick={() => handleFight('tactical')}
                style={{
                  background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Zap size={16} /> Błyskawiczna Kontra Runiczna
              </button>
            </div>
          )}

          {/* Duel Log */}
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {duelLog.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', color: idx === 0 ? '#ffe599' : '#9ca3af' }}>
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
