import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Lock,
  Unlock,
  Key,
  Flame,
  Sparkles,
  X,
  RotateCw,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const DungeonEscapeModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency, addInventoryItem } = useSchool();
  const { playWandSwoosh, playRuneChime, playGateThud, playSortingFanfare } = useSound();

  const [currentStage, setCurrentStage] = useState(1); // 1: Cipher, 2: Stars, 3: Crucible
  const [isEscaped, setIsEscaped] = useState(false);

  // Puzzle 1: Rune Cipher Rings
  const [ring1, setRing1] = useState(0);
  const [ring2, setRing2] = useState(1);
  const [ring3, setRing3] = useState(2);
  const runeSet = ['ᚦ (Thurisaz)', 'ᚨ (Ansuz)', 'ᛉ (Algiz)', 'ᛞ (Dagaz)'];

  // Puzzle 2: Constellation Stars
  const [starSequence, setStarSequence] = useState([]);
  const correctStars = ['polaris', 'crow', 'wolf', 'shield'];

  // Puzzle 3: Crucible
  const [crucibleItem1, setCrucibleItem1] = useState(null);
  const [crucibleItem2, setCrucibleItem2] = useState(null);

  if (!isOpen) return null;

  const handleRotateRing = (ringNum) => {
    playWandSwoosh();
    if (ringNum === 1) setRing1((prev) => (prev + 1) % runeSet.length);
    if (ringNum === 2) setRing2((prev) => (prev + 1) % runeSet.length);
    if (ringNum === 3) setRing3((prev) => (prev + 1) % runeSet.length);
  };

  const handleCheckCipher = () => {
    // Correct combo: ring1 = 0 (Thurisaz), ring2 = 2 (Algiz), ring3 = 3 (Dagaz)
    if (ring1 === 0 && ring2 === 2 && ring3 === 3) {
      playGateThud();
      playRuneChime();
      setCurrentStage(2);
    } else {
      playWandSwoosh();
    }
  };

  const handleStarClick = (starKey) => {
    playRuneChime();
    const newSeq = [...starSequence, starKey];
    setStarSequence(newSeq);

    if (newSeq.length === correctStars.length) {
      if (newSeq.join(',') === correctStars.join(',')) {
        playGateThud();
        setCurrentStage(3);
      } else {
        setStarSequence([]);
      }
    }
  };

  const handleDissolveLock = () => {
    if (crucibleItem1 === 'dragon' && crucibleItem2 === 'beryl') {
      playSortingFanfare();
      playGateThud();
      setIsEscaped(true);

      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 35, 'Rozwiązanie zagadek i ucieczka z Labiryntu Lochów');
      if (addCurrency) addCurrency(40, 'Nagroda za ucieczkę z Labiryntu Zagadek');
      if (addInventoryItem) {
        addInventoryItem({
          name: 'Złoty Klucz Pradawnych',
          icon: '🗝️',
          rarity: 'Legendarny Artefakt',
          price: 75,
          desc: 'Zdobyty podczas ucieczki z Labiryntu Lochów.'
        });
      }
      addNotification('🗝️ Gratulacje! Uciekłeś z Komnaty Zagadek (+35 pkt, +40 Sk. oraz Złoty Klucz Pradawnych)!');
    } else {
      playWandSwoosh();
      setCrucibleItem1(null);
      setCrucibleItem2(null);
    }
  };

  const handleReset = () => {
    setCurrentStage(1);
    setIsEscaped(false);
    setRing1(0);
    setRing2(1);
    setRing3(2);
    setStarSequence([]);
    setCrucibleItem1(null);
    setCrucibleItem2(null);
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
            borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Labirynt Tajemnic • Komnata Zagadek w Podziemiach
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                ETAP {currentStage} / 3 • UCIECZKA Z BAZALTOWYCH LOCHÓW
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
        <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isEscaped ? (
            <div>
              {/* STAGE 1: RUNE CIPHER */}
              {currentStage === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center', textAlign: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                      Zagadka 1: Runiczne Pierścienie Szyfrowe Wrót
                    </h4>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', maxWidth: '520px' }}>
                      Obracaj trzy kamienne pierścienie. Wskazówka wyryta na posadzce głosi: <em>„Cierń Ognia (Thurisaz) otwiera początek, Ochrona (Algiz) strzeże serca, a Przełom Dnia (Dagaz) pieczętuje kres.”</em>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { num: 1, val: ring1 },
                      { num: 2, val: ring2 },
                      { num: 3, val: ring3 }
                    ].map((ring) => (
                      <div
                        key={ring.num}
                        style={{
                          background: 'rgba(15, 20, 28, 0.85)',
                          border: '2px solid var(--gold-ancient)',
                          borderRadius: '8px',
                          padding: '1rem',
                          width: '140px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.6rem'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Pierścień {ring.num}</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffe599', minHeight: '35px', display: 'flex', alignItems: 'center' }}>
                          {runeSet[ring.val]}
                        </div>
                        <button
                          onClick={() => handleRotateRing(ring.num)}
                          style={{
                            background: 'rgba(197, 159, 78, 0.2)',
                            border: '1px solid var(--gold-ancient)',
                            color: '#ffe599',
                            borderRadius: '4px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <RotateCw size={12} /> Obróć
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCheckCipher}
                    style={{
                      background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.7rem 1.5rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    Dociśnij Kamienne Pierścienie →
                  </button>
                </div>
              )}

              {/* STAGE 2: STAR CONSTELLATION */}
              {currentStage === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center', textAlign: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#38bdf8', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                      Zagadka 2: Astrarium Skandynawskich Gwiazd
                    </h4>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', maxWidth: '520px' }}>
                      Połącz gwiazdozbiory we właściwej kolejności sagi: <em>Gwiazda Polarna ➔ Kruk ➔ Wilk ➔ Tarcza</em>.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '420px' }}>
                    {[
                      { id: 'polaris', name: '⭐ Gwiazda Polarna' },
                      { id: 'crow', name: '🦅 Gwiazdozbiór Kruka' },
                      { id: 'wolf', name: '🐺 Gwiazdozbiór Wilka' },
                      { id: 'shield', name: '🛡️ Gwiazdozbiór Tarczy' }
                    ].map((star) => (
                      <button
                        key={star.id}
                        onClick={() => handleStarClick(star.id)}
                        disabled={starSequence.includes(star.id)}
                        style={{
                          padding: '1rem',
                          background: starSequence.includes(star.id) ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 20, 28, 0.8)',
                          border: starSequence.includes(star.id) ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: starSequence.includes(star.id) ? 'default' : 'pointer'
                        }}
                      >
                        {star.name}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Wybrano: {starSequence.length} z 4 gwiazd (Błędna sekwencja resetuje układ)
                  </span>
                </div>
              )}

              {/* STAGE 3: ALCHEMICAL CRUCIBLE */}
              {currentStage === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center', textAlign: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#f59e0b', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                      Zagadka 3: Kwasowy Tykiel Rozpuszczający Rygiel
                    </h4>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', maxWidth: '520px' }}>
                      Wybierz dwa odczynniki chemiczne zdolne stopić pradawny stop mroźnego żelaza (Wskazówka: <em>Smocza Krew</em> + <em>Sproszkowany Beryl</em>).
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { id: 'dragon', name: '🩸 Smocza Krew' },
                      { id: 'beryl', name: '💎 Sproszkowany Beryl' },
                      { id: 'water', name: '❄️ Zwykła Woda' },
                      { id: 'moss', name: '🌿 Wilgotny Mech' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          playRuneChime();
                          if (!crucibleItem1) setCrucibleItem1(item.id);
                          else if (!crucibleItem2) setCrucibleItem2(item.id);
                        }}
                        style={{
                          padding: '0.6rem 1rem',
                          background: crucibleItem1 === item.id || crucibleItem2 === item.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 20, 28, 0.8)',
                          border: crucibleItem1 === item.id || crucibleItem2 === item.id ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleDissolveLock}
                    disabled={!crucibleItem1 || !crucibleItem2}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.7rem 1.5rem',
                      fontWeight: 700,
                      cursor: crucibleItem1 && crucibleItem2 ? 'pointer' : 'not-allowed',
                      opacity: crucibleItem1 && crucibleItem2 ? 1 : 0.4
                    }}
                  >
                    Wlej do Zamka i Przełam Rygiel!
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Escape Success Screen */
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '2px solid #22c55e',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                animation: 'slideUp 0.3s ease-out'
              }}
            >
              <span style={{ fontSize: '3rem' }}>🗝️</span>
              <h3 style={{ margin: '0.4rem 0', color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                WROTA ROZWARTE! UCIECZKA Z LABIRYNTU ZAKOŃCZONA
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.2rem auto' }}>
                Twoja błyskotliwość i znajomość run, konstelacji oraz alchemii pozwoliły wydostać się z pułapki pradawnych lochów.
              </p>
              <div style={{ color: 'var(--gold-ancient)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.2rem' }}>
                ✨ +35 Punktów dla Zakonu & Złoty Klucz Pradawnych
              </div>
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
                Rozegraj Labirynt Ponownie
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
