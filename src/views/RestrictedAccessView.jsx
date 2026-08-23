import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  ShieldAlert,
  Sparkles,
  Lock,
  UserPlus,
  LogIn,
  ArrowLeft,
  Scroll,
  Zap,
  Castle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const RestrictedAccessView = ({ targetName = 'tych komnat i dzienników' }) => {
  const { setActiveView, setAuthModalOpen } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();

  const handleOpenRegister = () => {
    playWandSwoosh();
    setAuthModalOpen(true);
  };

  const handleOpenLogin = () => {
    playWandSwoosh();
    setAuthModalOpen(true);
  };

  const handleGoHome = () => {
    playWandSwoosh();
    setActiveView('home');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '65vh',
        padding: '2rem 1rem'
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          background: 'linear-gradient(180deg, rgba(14, 18, 26, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%)',
          border: '1.5px solid var(--gold-ancient)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(197, 159, 78, 0.15)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Frost and rune background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            fontSize: '8rem',
            color: 'rgba(197, 159, 78, 0.03)',
            fontFamily: 'serif',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          ᛟ
        </div>

        {/* Central Glowing Seal Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197, 159, 78, 0.2) 0%, rgba(0, 0, 0, 0.6) 70%)',
            border: '2px solid var(--gold-ancient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(197, 159, 78, 0.35)',
            position: 'relative'
          }}
        >
          <Lock size={36} color="var(--gold-glow)" />
          <span
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              background: '#ef4444',
              borderRadius: '50%',
              padding: '4px',
              border: '2px solid #080b10',
              display: 'flex'
            }}
          >
            <ShieldAlert size={14} color="#ffffff" />
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--gold-ancient)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)',
            marginBottom: '0.4rem'
          }}
        >
          ᛞ BARIERA PRZYMIERZA PÓŁNOCY ᛞ
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            color: '#ffffff',
            marginBottom: '1rem',
            letterSpacing: '0.04em',
            lineHeight: 1.25
          }}
        >
          O nie, nie masz dostępu do tej komnaty!
        </h2>

        <p
          style={{
            color: '#c5cdd9',
            fontSize: '0.96rem',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: '0 auto 1.8rem'
          }}
        >
          Wstęp do <strong>{targetName}</strong> posiadają wyłącznie osoby, które <span style={{ color: 'var(--gold-glow)', fontWeight: 700 }}>zapisały się do Twierdzy Magii Durmstrang (TMD)</span> i zostały wpisane do Księgi Paktu.
        </p>

        {/* Benefits Box */}
        <div
          style={{
            background: 'rgba(8, 12, 18, 0.7)',
            border: '1px solid rgba(197, 159, 78, 0.25)',
            borderRadius: '8px',
            padding: '1.1rem 1.3rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--gold-ancient)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={14} /> Co zyskujesz zapisując się do szkoły?
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              fontSize: '0.82rem',
              color: '#d1d5db'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Dzienniki lekcyjne & zapisy z Discorda</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Przydział do 1 z 4 Zakonów</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Gry RPG, Turnieje & Wyrocznia Seidr</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Skrytka Banku Skirnirów & Ekwipunek</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '420px',
            margin: '0 auto'
          }}
        >
          {/* Primary CTA: Zapisz się */}
          <button
            onClick={handleOpenRegister}
            className="btn-durmstrang"
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 800,
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)',
              color: '#06090e',
              boxShadow: '0 4px 20px rgba(197, 159, 78, 0.4)',
              border: '1px solid #f7dca0'
            }}
          >
            <UserPlus size={18} /> Zapisz się do Twierdzy Magii!
          </button>

          {/* Secondary CTA: Zaloguj się */}
          <button
            onClick={handleOpenLogin}
            className="btn-durmstrang-secondary"
            style={{
              width: '100%',
              padding: '0.7rem 1.2rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              justifyContent: 'center',
              border: '1px solid rgba(197, 159, 78, 0.4)'
            }}
          >
            <LogIn size={15} /> Masz już konto? Zaloguj się
          </button>

          {/* Back Home */}
          <button
            onClick={handleGoHome}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginTop: '0.4rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.target.style.color = '#9ca3af')}
          >
            <ArrowLeft size={13} /> Wróć do Wrót Twierdzy (TMD)
          </button>
        </div>
      </div>
    </div>
  );
};
