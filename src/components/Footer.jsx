import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { Shield, Sparkles, Scroll, Compass } from 'lucide-react';

export const Footer = () => {
  const { setActiveView } = useSchool();

  return (
    <footer
      style={{
        background: 'rgba(6, 8, 11, 0.98)',
        borderTop: '1px solid rgba(197, 159, 78, 0.25)',
        position: 'relative',
        zIndex: 20,
        padding: '3.5rem 1.5rem 2rem 1.5rem',
        marginTop: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '1380px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* Brand & Slogan */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '1.6rem', color: 'var(--gold-ancient)' }}>ᛞ</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.1em' }}>
              CYTADELA DURMSTRANG
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-lore)',
              fontStyle: 'italic',
              fontSize: '1.1rem',
              color: 'var(--gold-glow)',
              marginBottom: '1rem',
              lineHeight: 1.4
            }}
          >
            „Nie każda magia powinna zostać poznana.”
          </p>
          <p style={{ color: '#8c95a6', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Niezależna akademia magii, prastarych rytuałów i dyscypliny wojennej położona w niezdobytych górach Skandynawii.
          </p>
        </div>

        {/* Four Houses Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} color="var(--gold-ancient)" /> Cztery Zakony
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
            <li>
              <button
                onClick={() => setActiveView('houses')}
                style={{ background: 'none', border: 'none', color: '#c59f4e', cursor: 'pointer', textAlign: 'left' }}
              >
                👑 Zakon Renifera (Magia Krwi & Tradycja)
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('houses')}
                style={{ background: 'none', border: 'none', color: '#c02b2b', cursor: 'pointer', textAlign: 'left' }}
              >
                🛡️ Zakon Niedźwiedzia (Siła & Magia Bojowa)
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('houses')}
                style={{ background: 'none', border: 'none', color: '#a77de0', cursor: 'pointer', textAlign: 'left' }}
              >
                👁️ Zakon Kruka (Tajemnice & Nekromancja)
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('houses')}
                style={{ background: 'none', border: 'none', color: '#2ec4b6', cursor: 'pointer', textAlign: 'left' }}
              >
                🧪 Zakon Wydry (Alchemia & Transmutacja)
              </button>
            </li>
          </ul>
        </div>

        {/* Portals & Navigation */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Compass size={14} color="var(--gold-ancient)" /> Wrota Cytadeli
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
            <li>
              <button
                onClick={() => setActiveView('ceremony')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left' }}
              >
                ✨ Rytuał Przydziału do Zakonu
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('academic')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left' }}
              >
                📖 15 Katedr & Program Nauczania
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('map')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left' }}
              >
                🗺️ Eksploracyjna Mapa Twierdzy
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('markethall')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left' }}
              >
                🪙 Rynek Magiczny & Inwentarz
              </button>
            </li>
          </ul>
        </div>

        {/* Discord & Community Notice */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Scroll size={14} color="var(--gold-ancient)" /> Społeczność
          </h4>
          <p style={{ color: '#8c95a6', fontSize: '0.85rem', marginBottom: '0.8rem', lineHeight: 1.5 }}>
            Główna komunikacja kadetów i profesorów odbywa się poprzez Kruczą Pocztę oraz oficjalną społeczność Discord.
          </p>
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(88, 101, 242, 0.12)',
              border: '1px solid rgba(88, 101, 242, 0.3)',
              borderRadius: '4px',
              color: '#99aab5',
              fontSize: '0.82rem'
            }}
          >
            🛡️ Oficjalny Serwer Discord Cytadeli zsynchronizowany z rangami Zakonów.
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.5rem',
          maxWidth: '1380px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#656d7d'
        }}
      >
        <div>
          © {new Date().getFullYear()} Cytadela Durmstrang — Wszelkie prawa zastrzeżone. Projekt autorski świata magii.
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>Klasa I & II</span>
          <span>•</span>
          <span>Katedra Północy</span>
          <span>•</span>
          <span>XIX Rok Szkolny</span>
        </div>
      </div>
    </footer>
  );
};
