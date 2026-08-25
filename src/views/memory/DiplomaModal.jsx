import React from 'react';
import { X, Printer, Award, Sparkles, Shield, Bookmark, Star } from 'lucide-react';

export const DiplomaModal = ({ diploma, onClose }) => {
  if (!diploma) return null;

  const handlePrint = () => {
    window.print();
  };

  const houseSealColors = {
    reinhall: { border: '#c59f4e', bg: 'rgba(122, 24, 24, 0.25)', text: '#fde047', rune: 'ᚦ', label: 'Zakon Reinhall' },
    bjornhall: { border: '#c02b2b', bg: 'rgba(32, 37, 48, 0.35)', text: '#f87171', rune: 'ᛉ', label: 'Zakon Björnhall' },
    ravnheim: { border: '#a77de0', bg: 'rgba(28, 19, 46, 0.35)', text: '#c084fc', rune: 'ᚱ', label: 'Zakon Ravnheim' },
    otergard: { border: '#2ec4b6', bg: 'rgba(13, 45, 51, 0.35)', text: '#5eead4', rune: 'ᛞ', label: 'Zakon Otergard' }
  };

  const houseStyle = houseSealColors[diploma.house?.toLowerCase()] || houseSealColors.ravnheim;

  const placeBadges = {
    'I': { color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', label: 'I MIEJSCE • LAUR ZŁOTA' },
    'I Miejsce': { color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', label: 'I MIEJSCE • LAUR ZŁOTA' },
    'II': { color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.15)', label: 'II MIEJSCE • SREBRO PÓŁNOCY' },
    'II Miejsce': { color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.15)', label: 'II MIEJSCE • SREBRO PÓŁNOCY' },
    'III': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', label: 'III MIEJSCE • BRĄZ TWIERDZY' },
    'III Miejsce': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', label: 'III MIEJSCE • BRĄZ TWIERDZY' },
    'Wyróżnienie': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', label: 'WYRÓŻNIENIE SPECJALNE' },
    'Wyróżnienie Specjalne': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', label: 'WYRÓŻNIENIE SPECJALNE' }
  };

  const currentBadge = placeBadges[diploma.place] || { color: 'var(--gold-ancient)', bg: 'rgba(197, 159, 78, 0.15)', label: diploma.place || 'WYRÓŻNIENIE' };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #18130d 0%, #0a0c10 100%)',
          border: '2px solid var(--gold-ancient)',
          borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(197, 159, 78, 0.25)',
          padding: '2.5rem',
          position: 'relative',
          color: '#e2d7be'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Buttons */}
        <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handlePrint}
            style={{
              background: 'rgba(197, 159, 78, 0.15)',
              border: '1px solid var(--gold-ancient)',
              color: 'var(--gold-ancient)',
              padding: '0.45rem 0.85rem',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <Printer size={14} /> Drukuj / Zapisz
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '0.45rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Ornate Frame */}
        <div
          style={{
            border: '2px solid rgba(197, 159, 78, 0.35)',
            borderRadius: '4px',
            padding: '2rem',
            textAlign: 'center',
            background: 'radial-gradient(ellipse at center, rgba(197, 159, 78, 0.05) 0%, transparent 75%)',
            position: 'relative'
          }}
        >
          {/* Top Crest / Badge */}
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c59f4e 0%, #856118 100%)',
              color: '#090d14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(197, 159, 78, 0.4)'
            }}
          >
            {diploma.badgeIcon || '📜'}
          </div>

          <div style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
            TWIERDZA MAGII DURMSTRANG
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.5rem',
              letterSpacing: '0.1em',
              margin: '0.4rem 0 0.5rem',
              color: '#ffffff',
              textShadow: '0 2px 12px rgba(197, 159, 78, 0.35)'
            }}
          >
            DYPLOM HONOROWY
          </h1>

          {/* Place Badge */}
          <div
            style={{
              display: 'inline-block',
              background: currentBadge.bg,
              border: `1px solid ${currentBadge.color}`,
              color: currentBadge.color,
              padding: '0.35rem 1.2rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem'
            }}
          >
            {currentBadge.label}
          </div>

          {/* Recipient */}
          <div style={{ margin: '1rem 0' }}>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', marginBottom: '0.3rem' }}>
              Niniejszym zaświadcza się, że
            </div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff' }}>
              {diploma.recipientName}
            </div>
            <div style={{ fontSize: '0.9rem', color: houseStyle.text, fontWeight: 700 }}>
              {houseStyle.label}
            </div>
          </div>

          {/* Diploma Title and Description */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(197, 159, 78, 0.2)',
              borderRadius: '6px',
              padding: '1.2rem 1.5rem',
              margin: '1.5rem auto',
              maxWidth: '560px'
            }}
          >
            <div style={{ fontSize: '1.15rem', color: 'var(--gold-ancient)', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
              {diploma.title}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.6 }}>
              {diploma.description || 'Za wybitną postawę, mistrzostwo magiczne i rozsławienie imienia Twierdzy Magii Durmstrang.'}
            </div>
          </div>

          {/* Footer: Date, Issuer, Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>
                Wydano w Cytadeli:
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                {diploma.date || '2026-10-31'} ({diploma.yearName || 'XVII Rok Szkolny'})
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Brush Script MT, cursive, serif', fontSize: '1.5rem', color: 'var(--gold-ancient)', transform: 'rotate(-2deg)' }}>
                {diploma.issuer || 'Dyrekcja Cytadeli Durmstrang'}
              </div>
              <div style={{ borderTop: '1px solid rgba(197, 159, 78, 0.4)', paddingTop: '0.2rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af' }}>
                Pieczęć i Podpis Władz
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
