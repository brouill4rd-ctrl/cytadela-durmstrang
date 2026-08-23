import React from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Shield,
  Sparkles,
  Scroll,
  Compass,
  Crown,
  Eye,
  FlaskConical,
  BookOpen,
  Map,
  Coins,
  Scale,
  Award,
  HelpCircle,
  ShieldAlert,
  MessageSquare,
  Gamepad2,
  ClipboardCheck
} from 'lucide-react';

export const Footer = () => {
  const { setActiveView, setActiveHouseTab } = useSchool();

  const handleHouseClick = (houseId) => {
    if (setActiveHouseTab) setActiveHouseTab(houseId);
    setActiveView('houses');
  };

  const handleDocClick = (hashRoute) => {
    setActiveView('documents');
    window.location.hash = hashRoute;
  };

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* 1. Official Brand & TMD Herb */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.9rem' }}>
            <img
              src="/tmd_herb.png"
              alt="Herb Twierdzy Magii Durmstrang"
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(197, 159, 78, 0.45))'
              }}
            />
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em', display: 'block', lineHeight: 1.1 }}>
                DURMSTRANG (TMD)
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold-ancient)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Twierdza Magii Północy
              </span>
            </div>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-lore)',
              fontStyle: 'italic',
              fontSize: '1.05rem',
              color: 'var(--gold-glow)',
              marginBottom: '1rem',
              lineHeight: 1.4
            }}
          >
            „Nie każda magia powinna zostać poznana.”
          </p>
          <p style={{ color: '#8c95a6', fontSize: '0.86rem', lineHeight: 1.6 }}>
            Niezależna akademia magii, prastarych rytuałów i dyscypliny wojennej położona w niezdobytych górach Skandynawii.
          </p>
        </div>

        {/* 2. Four Houses Links (Clean Vectors & Runes) */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
            <Shield size={15} color="var(--gold-ancient)" /> Cztery Zakony Północy
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
            <li>
              <button
                onClick={() => handleHouseClick('reinhall')}
                style={{ background: 'none', border: 'none', color: '#c59f4e', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Crown size={14} color="#c59f4e" />
                <span>Zakon Reinhall (Krew & Tradycja)</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleHouseClick('bjornhall')}
                style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Shield size={14} color="#c02b2b" />
                <span>Zakon Björnhall (Siła & Magia Bojowa)</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleHouseClick('ravnheim')}
                style={{ background: 'none', border: 'none', color: '#c4a6f2', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Eye size={14} color="#a77de0" />
                <span>Zakon Ravnheim (Cień & Nekromancja)</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleHouseClick('otergard')}
                style={{ background: 'none', border: 'none', color: '#8cefe6', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <FlaskConical size={14} color="#2ec4b6" />
                <span>Zakon Otergard (Alchemia & Toksyny)</span>
              </button>
            </li>
          </ul>
        </div>

        {/* 3. Portals & Citadel Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
            <Compass size={15} color="var(--gold-ancient)" /> Wrota Twierdzy
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
            <li>
              <button
                onClick={() => setActiveView('ceremony')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Sparkles size={14} color="var(--gold-ancient)" />
                <span>Rytuał Kamienia Przysięgi</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('academic')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <BookOpen size={14} color="var(--gold-ancient)" />
                <span>21 Katedr & Program Nauczania</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('map')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Map size={14} color="var(--gold-ancient)" />
                <span>Eksploracyjna Mapa Twierdzy</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('markethall')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
              >
                <Coins size={14} color="var(--gold-ancient)" />
                <span>Rynek Magiczny Kaupangr & Bank</span>
              </button>
            </li>
          </ul>
        </div>

        {/* 4. Dekrety, Regulamin DC, Statut & Zabawy */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
            <Scroll size={15} color="var(--gold-ancient)" /> Dokumenty & Społeczność
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <li>
              <button
                onClick={() => handleDocClick('#/dekrety')}
                style={{ background: 'none', border: 'none', color: 'var(--gold-glow)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem', padding: 0 }}
              >
                <ShieldAlert size={14} color="var(--gold-ancient)" />
                <span>Dekrety Władz & Edykty</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocClick('#/wizytacje')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: 0 }}
              >
                <ClipboardCheck size={14} color="var(--gold-ancient)" />
                <span>Wizytacje Nauczycieli & Hospitacje</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocClick('#/statut')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: 0 }}
              >
                <Scale size={14} color="var(--gold-ancient)" />
                <span>Statut Twierdzy Durmstrang</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocClick('#/zabawy')}
                style={{ background: 'none', border: 'none', color: '#b0b7c3', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: 0 }}
              >
                <Gamepad2 size={14} color="var(--gold-ancient)" />
                <span>Opis Zabaw, Turniejów i Gier</span>
              </button>
            </li>
          </ul>
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(88, 101, 242, 0.12)',
              border: '1px solid rgba(88, 101, 242, 0.3)',
              borderRadius: '4px',
              color: '#99aab5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Shield size={15} color="#5865F2" />
            <span>Oficjalny Serwer Discord Twierdzy Magii zsynchronizowany z rangami Zakonów.</span>
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
          © {new Date().getFullYear()} Twierdza Magii Durmstrang (TMD) — Wszelkie prawa zastrzeżone. Projekt autorski świata magii.
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
