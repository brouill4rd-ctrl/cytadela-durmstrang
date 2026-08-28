import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { Sparkles, Shield, Flame, CheckCircle, ArrowRight } from 'lucide-react';

export const CeremonyView = () => {
  const { houses, ceremonyQuestions, sortIntoHouse, setActiveView, setActiveHouseTab } = useSchool();
  const { playRuneChime, playSortingFanfare, playWandSwoosh } = useSound();

  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1..N = questions, 8 = calculating/reveal, 9 = final
  const [answers, setAnswers] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const startCeremony = () => {
    playRuneChime();
    setCurrentStep(1);
    setAnswers([]);
  };

  const handleSelectOption = (option) => {
    playRuneChime();
    const newAnswers = [...answers, option.house];
    setAnswers(newAnswers);

    if (currentStep < ceremonyQuestions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerCeremonyClimax(newAnswers);
    }
  };

  const triggerCeremonyClimax = (finalAnswers) => {
    setCurrentStep(8);
    setIsRevealing(true);

    // Count house votes
    const counts = { reinhall: 0, bjornhall: 0, ravnheim: 0, otergard: 0 };
    finalAnswers.forEach(h => {
      const normalized = h === 'renifer' ? 'reinhall' : h === 'niedzwiedz' ? 'bjornhall' : h === 'kruk' ? 'ravnheim' : h === 'wydra' ? 'otergard' : h;
      if (counts[normalized] !== undefined) counts[normalized]++;
    });

    let winningHouse = 'reinhall';
    let maxVotes = -1;
    Object.keys(counts).forEach(h => {
      if (counts[h] > maxVotes) {
        maxVotes = counts[h];
        winningHouse = h;
      }
    });

    setSelectedHouse(winningHouse);

    setTimeout(() => {
      setIsRevealing(false);
      setCurrentStep(9);
      playSortingFanfare();
      if (sortIntoHouse) {
        sortIntoHouse(winningHouse);
      }
    }, 3200);
  };

  const houseObj = selectedHouse
    ? (houses && houses[selectedHouse]) ||
      (Array.isArray(houses) ? houses.find(h => h.id === selectedHouse) : null) ||
      (houses && typeof houses === 'object' ? Object.values(houses).find(h => h.id === selectedHouse) : null)
    : null;

  const assignedHouse = houseObj || (houses && typeof houses === 'object' ? Object.values(houses)[0] : null);

  const currentQ = currentStep >= 1 && currentStep <= ceremonyQuestions.length ? ceremonyQuestions[currentStep - 1] : null;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* 1. INTRO SCREEN */}
      {currentStep === 0 && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 30%, rgba(28, 35, 48, 0.95) 0%, rgba(10, 13, 18, 0.98) 100%)',
            border: '1px solid var(--gold-ancient)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(197, 159, 78, 0.15)',
              border: '2px solid var(--gold-ancient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: 'var(--gold-ancient)',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 0 30px rgba(197, 159, 78, 0.3)'
            }}
          >
            ᛞ
          </div>

          <span style={{ color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Pradawny Rytuał Kamienia Przysięgi
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', marginTop: '0.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Ceremonia Przydziału do Zakonu
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-lore)',
              fontStyle: 'italic',
              fontSize: '1.25rem',
              color: 'var(--gold-glow)',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}
          >
            „To nie kapelusz rozstrzyga o twoim losie. To krew, wola i wybory dokonane w mroku nocy polarnej.”
          </p>

          <p style={{ color: '#b0b7c3', fontSize: '0.98rem', lineHeight: 1.7, maxWidth: '620px', margin: '0 auto 2.5rem auto' }}>
            Wkrocz do Kręgu Przysięgi. Odpowiedz na próby moralno-filozoficzne. Kamień Przysięgi zważy twoją determinację i wskaże Zakon, którego dziedzictwo poniesiesz przez lata nauki w Twierdzy Magii (TMD).
          </p>

          <button onClick={startCeremony} className="btn-durmstrang" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
            <Flame size={18} /> Rozpocznij Rytuał Przydziału
          </button>
        </div>
      )}

      {/* 2. QUESTION SCREEN */}
      {currentStep >= 1 && currentStep <= ceremonyQuestions.length && currentQ && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '2.5rem',
            background: 'rgba(12, 15, 22, 0.95)',
            border: '1px solid var(--gold-ancient)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
          }}
        >
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem', borderBottom: '1px solid rgba(197, 159, 78, 0.25)', paddingBottom: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-ancient)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              {currentQ.title || `Próba ${currentStep} z ${ceremonyQuestions.length}`}
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {ceremonyQuestions.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '28px',
                    height: '4px',
                    borderRadius: '2px',
                    background: i + 1 <= currentStep ? 'var(--gold-ancient)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: i + 1 === currentStep ? '0 0 8px var(--gold-glow)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Question Prompt */}
          <h2
            style={{
              fontSize: '1.25rem',
              color: '#ffffff',
              lineHeight: 1.6,
              marginBottom: '2rem',
              fontFamily: 'var(--font-lore)',
              fontStyle: 'italic',
              fontWeight: 500
            }}
          >
            „{currentQ.scenario || currentQ.prompt || currentQ.title}”
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: '1.2rem 1.4rem',
                  background: 'rgba(20, 25, 36, 0.7)',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(197, 159, 78, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--gold-glow)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 25, 36, 0.7)';
                  e.currentTarget.style.borderColor = 'rgba(197, 159, 78, 0.3)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.2rem' }}>{opt.text}</div>
                  {opt.reason && <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>{opt.reason}</div>}
                </div>
                <ArrowRight size={16} color="var(--gold-ancient)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. DRAMATIC SUSPENSE REVEAL SCREEN */}
      {currentStep === 8 && (
        <div
          className="gothic-card"
          style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            background: 'rgba(5, 7, 10, 0.98)',
            border: '2px solid var(--gold-glow)',
            boxShadow: '0 0 50px rgba(197, 159, 78, 0.4)'
          }}
        >
          <div
            className="animate-pulse-glow"
            style={{
              fontSize: '4.5rem',
              color: 'var(--gold-glow)',
              marginBottom: '1.5rem',
              fontFamily: 'serif'
            }}
          >
            ᛞ
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', letterSpacing: '0.15em', marginBottom: '0.8rem', fontFamily: 'var(--font-heading)' }}>
            KAMIENIE PRZYSIĘGI PRZEMAWIAJĄ...
          </h2>
          <p style={{ color: '#a0aec0', fontStyle: 'italic', fontFamily: 'var(--font-lore)', fontSize: '1.2rem' }}>
            Oddechy przodków łączą się z twoją wolą. Cienie układają się w święty znak...
          </p>
        </div>
      )}

      {/* 4. FINAL HOUSE ASSIGNMENT DECREE */}
      {currentStep === 9 && assignedHouse && (
        <div
          className="gothic-card runic-corners"
          style={{
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            background: `radial-gradient(circle at 50% 30%, ${assignedHouse.colors?.primary || '#1c132e'}44 0%, rgba(8, 10, 15, 0.98) 85%)`,
            border: `2px solid ${assignedHouse.colors?.secondary || 'var(--gold-ancient)'}`,
            boxShadow: `0 25px 60px rgba(0,0,0,0.95), 0 0 45px ${assignedHouse.colors?.glow || 'rgba(197, 159, 78, 0.35)'}`
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${assignedHouse.colors?.primary || '#1c132e'}, rgba(10,10,15,0.9))`,
              border: `2px solid ${assignedHouse.colors?.secondary || 'var(--gold-ancient)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.5rem',
              margin: '0 auto 1.5rem auto',
              boxShadow: `0 0 35px ${assignedHouse.colors?.glow || 'rgba(197, 159, 78, 0.35)'}`
            }}
          >
            {assignedHouse.crestIcon || '🛡️'}
          </div>

          <div style={{ color: assignedHouse.colors?.secondary || 'var(--gold-ancient)', letterSpacing: '0.25em', fontSize: '0.9rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            PRZEZNACZENIE PRZEMÓWIŁO
          </div>

          <h1 style={{ fontSize: '2.8rem', color: '#ffffff', marginTop: '0.4rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            ZOSTAJESZ CZŁONKIEM {assignedHouse.name.toUpperCase()}!
          </h1>

          <div style={{ fontSize: '1.1rem', color: assignedHouse.colors?.secondary || 'var(--gold-ancient)', fontStyle: 'italic', fontFamily: 'var(--font-heading)', marginBottom: '1.8rem' }}>
            {assignedHouse.fullName || assignedHouse.latinMotto || assignedHouse.name}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${assignedHouse.colors?.secondary || 'var(--gold-ancient)'}55`, borderRadius: '6px', padding: '1.5rem', maxWidth: '640px', margin: '0 auto 2rem auto' }}>
            <p style={{ fontFamily: 'var(--font-lore)', fontStyle: 'italic', fontSize: '1.25rem', color: '#f3e5c8', marginBottom: '0.8rem' }}>
              {assignedHouse.motto}
            </p>
            <p style={{ color: '#c5cdd9', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {assignedHouse.commonRoom || `Wkrocz do Sali Zakonu ${assignedHouse.name}.`}
            </p>
            <p style={{ color: '#aeb8c7', fontSize: '0.88rem', margin: '.8rem 0 0' }}>
              Opiekun: {assignedHouse.headOfHouse || 'Opiekun Zakonu'}<br />
              Od tej chwili twoje czyny zostaną zapisane w kronice Zakonu.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                playWandSwoosh();
                setActiveHouseTab(assignedHouse.id);
                setActiveView('houses');
              }}
              className="btn-durmstrang"
            >
              <Shield size={18} /> Wejdź do Sali Zakonu
            </button>

            <button
              onClick={() => {
                playWandSwoosh();
                setActiveView('profile');
              }}
              className="btn-durmstrang-secondary"
            >
              <Sparkles size={18} /> Zobacz Swój Profil Adepta
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
