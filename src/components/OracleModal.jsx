import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Sparkles,
  Eye,
  X,
  RotateCcw,
  Award,
  Zap,
  Flame,
  CheckCircle,
  Moon
} from 'lucide-react';

export const OracleModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, setActiveBuff: setGlobalBuff } = useSchool();
  const { playRuneChime, playSortingFanfare, playWandSwoosh } = useSound();

  const [isCasting, setIsCasting] = useState(false);
  const [castDone, setCastDone] = useState(false);
  const [runes, setRunes] = useState(null);
  const [activeBuff, setActiveBuff] = useState(null);

  if (!isOpen) return null;

  const nornRunes = [
    { symbol: 'ᚢ', name: 'Uruz (Pierwotna Siła)', role: 'Przeszłość (Urd)', desc: 'Twoje dawne próby zahartowały Twego ducha jak stal.' },
    { symbol: 'ᚦ', name: 'Thurisaz (Płonący Cierń)', role: 'Teraźniejszość (Verdandi)', desc: 'Obecna chwila wymaga odwagi i przełamania lodowych barier.' },
    { symbol: 'ᛋ', name: 'Sowilo (Słoneczny Triumf)', role: 'Przyszłość (Skuld)', desc: 'Przeznaczenie zwiastuje zwycięstwo i uznanie wśród mistrzów.' },
    { symbol: 'ᚨ', name: 'Ansuz (Głos Bogów)', role: 'Przeszłość (Urd)', desc: 'Mądrość dawnych zaklęć wciąż rozbrzmiewa w Twoich żyłach.' },
    { symbol: 'ᚱ', name: 'Raidho (Wielka Wyprawa)', role: 'Teraźniejszość (Verdandi)', desc: 'Droga przed Tobą jest kręta, lecz każdy krok przynosi wiedzę.' },
    { symbol: 'ᛏ', name: 'Tiwaz (Sprawiedliwy Miecz)', role: 'Przyszłość (Skuld)', desc: 'Honor Twego Zakonu zostanie wywyższony w turnieju.' }
  ];

  const possibleBuffs = [
    { id: 'xp_boost', title: 'Błogosławieństwo Odyna', desc: '+15% więcej Punktów i Doświadczenia (XP) ze wszystkich lekcji dzisiaj', icon: '⚡' },
    { id: 'luck_boost', title: 'Łaska Freyi', desc: 'Podwójna szansa na wyłowienie skrzyń skarbów i rzadkich ryb', icon: '🍀' },
    { id: 'combat_boost', title: 'Męstwo Tyra', desc: '+25 do siły w Runicznym Kręgu Pojedynków', icon: '⚔️' },
    { id: 'alchemy_boost', title: 'Płomień Hephaestusa Północy', desc: 'Gwarantowany sukces w warzeniu rzadkich eliksirów w kociołku', icon: '🧪' }
  ];

  const handleCastRunes = () => {
    if (isCasting) return;
    playWandSwoosh();
    setIsCasting(true);
    setCastDone(false);

    setTimeout(() => {
      // Pick 3 random runes
      const shuffled = [...nornRunes].sort(() => 0.5 - Math.random());
      const selected = [
        { ...shuffled[0], role: 'Przeszłość (Urd)' },
        { ...shuffled[1], role: 'Teraźniejszość (Verdandi)' },
        { ...shuffled[2], role: 'Przyszłość (Skuld)' }
      ];

      const buff = possibleBuffs[Math.floor(Math.random() * possibleBuffs.length)];

      setRunes(selected);
      setActiveBuff(buff);
      if (setGlobalBuff) setGlobalBuff(buff);
      setIsCasting(false);
      setCastDone(true);
      playSortingFanfare();

      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 10, 'Odprawienie Rytuału Wyroczni Norren');
      addNotification(`🔮 Otrzymano Dzienne Błogosławieństwo: ${buff.title}!`);
    }, 1200);
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
          maxWidth: '740px',
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
            <Eye size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Wyrocznia Przeznaczenia • Rytuał Trzech Norren (Seidr)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                CODZIENNE WRÓŻBY & MITYCZNE BŁOGOSŁAWIEŃSTWA
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
        <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Mystical Basin Description */}
          <div style={{ textAlign: 'center', maxWidth: '580px' }}>
            <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Trzy Norny — <em>Urd</em>, <em>Verdandi</em> i <em>Skuld</em> — tkają nici przeznaczenia pod korzeniami Drzewa Świata. Rzuć bazaltowymi kamieniami w dym paleniska, by poznać swój dzisiejszy los i otrzymać błogosławieństwo mocy.
            </p>
          </div>

          {/* Cast Runes Display Area */}
          <div
            style={{
              width: '100%',
              background: 'radial-gradient(circle, rgba(28, 38, 54, 0.8) 0%, rgba(10, 14, 22, 0.95) 100%)',
              border: '1px solid rgba(197, 159, 78, 0.35)',
              borderRadius: '8px',
              padding: '1.8rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              minHeight: '180px',
              flexWrap: 'wrap',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
            }}
          >
            {!castDone ? (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <span style={{ fontSize: '3rem', opacity: 0.3, display: 'block' }}>ᛟ</span>
                <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                  {isCasting ? '✨ Rozsypywanie run w płomieniach...' : 'Kamienie spoczywają w aksamitnym woreczku. Kliknij poniżej, by rzucić runy.'}
                </span>
              </div>
            ) : (
              runes?.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(15, 20, 28, 0.9)',
                    border: '1.5px solid var(--gold-ancient)',
                    borderRadius: '8px',
                    padding: '1rem 1.2rem',
                    width: '180px',
                    textAlign: 'center',
                    boxShadow: '0 0 20px rgba(197, 159, 78, 0.3)',
                    animation: 'fadeIn 0.4s ease-out'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {r.role}
                  </span>
                  <span style={{ fontSize: '3rem', color: '#ffe599', margin: '0.3rem 0', textShadow: '0 0 15px rgba(197, 159, 78, 0.6)' }}>
                    {r.symbol}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                    {r.name}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
                    {r.desc}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Active Buff Box */}
          {activeBuff && (
            <div
              style={{
                width: '100%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1.5px solid #10b981',
                borderRadius: '8px',
                padding: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
                animation: 'slideUp 0.3s ease-out'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>{activeBuff.icon}</div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
                  ⚡ AKTYWNY DZIENNY BUFF POSTACI (+10 PKT DLA ZAKONU)
                </span>
                <h4 style={{ margin: '0.2rem 0', color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                  {activeBuff.title}
                </h4>
                <p style={{ margin: 0, color: '#d1fae5', fontSize: '0.85rem' }}>
                  {activeBuff.desc}
                </p>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleCastRunes}
            disabled={isCasting}
            style={{
              background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              padding: '0.8rem 2rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              fontFamily: 'var(--font-heading)',
              cursor: isCasting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(197, 159, 78, 0.4)'
            }}
          >
            <Sparkles size={16} /> {castDone ? 'Rzuć Runy Ponownie' : 'Rzuć Trzy Runy Norren'}
          </button>
        </div>
      </div>
    </div>
  );
};
