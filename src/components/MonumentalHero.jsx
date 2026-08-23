import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Flame,
  UserPlus,
  Zap
} from 'lucide-react';

export const MonumentalHero = ({ onOpenCreationModal }) => {
  const {
    houses,
    addHousePoints,
    setActiveView,
    setActiveHouseTab,
    currentUser
  } = useSchool();

  const { playWandSwoosh, playCoinClink } = useSound();

  const handleHouseClick = (houseId) => {
    playWandSwoosh();
    setActiveHouseTab(houseId);
    setActiveView('houses');
  };

  const housesConfig = [
    {
      id: 'reinhall',
      house: houses.reinhall || { startingPoints: 480 },
      name: 'Reinhall',
      runeTitle: 'ᚦ REINHALL ᚦ',
      color: '#c59f4e', // Ancient Gold & Blood
      colorText: '#f7e6c4',
      sandColor: '#c59f4e',
      gemColor: '#7a1818',
      head: 'Prof. Sigrid Hällström',
      prefect: 'Magnus Blom',
      // Stag Antlers & Ears Sitting on top of the card
      mascotSvg: (
        <svg viewBox="0 0 120 70" className="perched-mascot-svg" fill="none">
          <path
            d="M 60,65 C 56,52 50,42 42,32 M 42,32 C 32,22 18,16 8,14 M 32,26 C 22,20 12,22 4,28 M 38,34 C 26,35 16,42 10,48 M 60,65 C 64,52 70,42 78,32 M 78,32 C 88,22 102,16 112,14 M 88,26 C 98,20 108,22 116,28 M 82,34 C 94,35 104,42 110,48"
            stroke="#c59f4e"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(197, 159, 78, 0.5))' }}
          />
          <path d="M 52,48 C 42,48 38,52 36,58 C 44,60 50,56 54,54" fill="#1c1618" stroke="#c59f4e" strokeWidth="1.5" />
          <path d="M 68,48 C 78,48 82,52 84,58 C 76,60 70,56 66,54" fill="#1c1618" stroke="#c59f4e" strokeWidth="1.5" />
          <path d="M 60,44 C 54,50 50,58 52,68 L 68,68 C 70,58 66,50 60,44 Z" fill="#1a1416" stroke="#c59f4e" strokeWidth="2" />
          <circle cx="56" cy="58" r="1.5" fill="#ef4444" />
          <circle cx="64" cy="58" r="1.5" fill="#ef4444" />
        </svg>
      )
    },
    {
      id: 'bjornhall',
      house: houses.bjornhall || { startingPoints: 520 },
      name: 'Björnhall',
      runeTitle: 'ᛉ BJÖRNHALL ᛉ',
      color: '#c02b2b', // Battle Crimson & Dark Iron
      colorText: '#ffbaba',
      sandColor: '#c02b2b',
      gemColor: '#dc2626',
      head: 'Prof. Gunnar Vargson',
      prefect: 'Astrid Vargadottir',
      // Bear Head & Paws Sitting on top of the card
      mascotSvg: (
        <svg viewBox="0 0 120 70" className="perched-mascot-svg" fill="none">
          <circle cx="38" cy="28" r="11" fill="#181210" stroke="#c02b2b" strokeWidth="2.5" />
          <circle cx="82" cy="28" r="11" fill="#181210" stroke="#c02b2b" strokeWidth="2.5" />
          <path
            d="M 60,20 C 44,20 32,32 30,50 C 28,62 34,68 60,68 C 86,68 92,62 90,50 C 88,32 76,20 60,20 Z"
            fill="#181210"
            stroke="#c02b2b"
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(192, 43, 43, 0.4))' }}
          />
          <ellipse cx="60" cy="52" rx="14" ry="10" fill="#0d0908" stroke="#c02b2b" strokeWidth="1.5" />
          <path d="M 54,48 C 54,44 66,44 66,48 C 66,54 60,56 60,56 C 60,56 54,54 54,48 Z" fill="#c02b2b" />
          <circle cx="48" cy="40" r="2.5" fill="#fca5a5" />
          <circle cx="72" cy="40" r="2.5" fill="#fca5a5" />
        </svg>
      )
    },
    {
      id: 'ravnheim',
      house: houses.ravnheim || { startingPoints: 510 },
      name: 'Ravnheim',
      runeTitle: 'ᚱ RAVNHEIM ᚱ',
      color: '#a77de0', // Astral Violet & Night Obsidian
      colorText: '#e6d8ff',
      sandColor: '#a77de0',
      gemColor: '#9333ea',
      head: 'Prof. Morana Vane',
      prefect: 'Valdemar Krag-Hansen',
      // Raven Outstretched Wings Sitting on top of the card
      mascotSvg: (
        <svg viewBox="0 0 160 70" className="perched-mascot-svg raven-wide" fill="none">
          <path
            d="M 80,45 C 65,25 40,12 8,15 C 20,28 32,44 22,58 C 40,56 55,62 65,68 C 80,68 80,68 80,68 C 80,68 80,68 95,68 C 105,62 120,56 138,58 C 128,44 140,28 152,15 C 120,12 95,25 80,45 Z"
            fill="#0f1626"
            stroke="#a77de0"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(167, 125, 224, 0.4))' }}
          />
          <path d="M 74,38 C 74,28 86,28 86,38 L 84,56 L 80,62 L 76,56 Z" fill="#151e33" stroke="#a77de0" strokeWidth="1.5" />
          <polygon points="80,18 76,32 84,32" fill="#a77de0" />
          <circle cx="80" cy="36" r="2" fill="#ffffff" />
        </svg>
      )
    },
    {
      id: 'otergard',
      house: houses.otergard || { startingPoints: 495 },
      name: 'Otergard',
      runeTitle: 'ᛞ OTERGARD ᛞ',
      color: '#2ec4b6', // Glacial Teal & Emerald Waters
      colorText: '#b2f5ea',
      sandColor: '#2ec4b6',
      gemColor: '#0d9488',
      head: 'Prof. Klaus Lindqvist',
      prefect: 'Sigrun Lindqvist',
      // Otter Head & Whiskers Sitting on top of the card
      mascotSvg: (
        <svg viewBox="0 0 120 70" className="perched-mascot-svg" fill="none">
          <ellipse cx="80" cy="26" rx="6" ry="5" fill="#0d1f1c" stroke="#2ec4b6" strokeWidth="1.5" />
          <path
            d="M 35,68 C 40,48 55,30 75,26 C 92,24 105,34 104,48 C 103,58 92,66 78,68 Z"
            fill="#0f221f"
            stroke="#2ec4b6"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(46, 196, 182, 0.4))' }}
          />
          <path d="M 98,46 C 102,46 104,49 102,52 C 99,53 96,50 98,46 Z" fill="#2ec4b6" />
          <line x1="99" y1="49" x2="114" y2="44" stroke="#2ec4b6" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="99" y1="51" x2="116" y2="52" stroke="#2ec4b6" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="98" y1="53" x2="112" y2="60" stroke="#2ec4b6" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="88" cy="38" r="2.5" fill="#b2f5ea" />
        </svg>
      )
    }
  ];

  return (
    <section className="monumental-hero-section">
      {/* Aurora Borealis & Blizzard Backdrop */}
      <div className="hero-aurora-glow" />
      <div className="hero-vignette" />

      {/* Main Monumental Title & Hero Content */}
      <div className="hero-center-content">
        {/* Official Durmstrang Crest Emblem */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '0.9rem',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '105px',
              height: '105px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Pulsing Magical Aura behind the Herb */}
            <div
              style={{
                position: 'absolute',
                inset: '-15px',
                background: 'radial-gradient(circle, rgba(197, 159, 78, 0.4) 0%, rgba(197, 159, 78, 0) 70%)',
                borderRadius: '50%',
                filter: 'blur(10px)',
                animation: 'pulse 3s infinite alternate'
              }}
            />
            <img
              src="/tmd_herb.png"
              alt="Herb Twierdzy Magii Durmstrang"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 15px rgba(197, 159, 78, 0.4))'
              }}
            />
          </div>
        </div>

        <div className="hero-crest-badge">
          <span className="rune-sign">ᛞ</span>
          <span>AKADEMIA CIEMNYCH SZTUK & MAGII PÓŁNOCY</span>
          <span className="rune-sign">ᛞ</span>
        </div>

        <h1 className="hero-main-title">
          TWIERDZA MAGII DURMSTRANG
        </h1>

        <p className="hero-motto">
          „Nie każda magia powinna zostać poznana.”
        </p>

        {/* Quick CTA Action Buttons */}
        <div className="hero-cta-group">
          {currentUser && (
            <button
              onClick={() => { playWandSwoosh(); setActiveView('ceremony'); }}
              className="btn-durmstrang"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
            >
              <Flame size={16} /> Rytuał Kamienia Przysięgi
            </button>
          )}

          {!currentUser && (
            <button
              onClick={onOpenCreationModal}
              className="btn-durmstrang"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
            >
              <UserPlus size={16} /> Złóż Podanie Adepta
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => { playWandSwoosh(); setActiveView('rune-workshop'); }}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(46, 196, 182, 0.18)',
                border: '1px solid #2ec4b6',
                color: '#8cefe6',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.88rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(46, 196, 182, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={16} /> Warsztat Run (Galdr)
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          PUCHAR PÓŁNOCY: 4 NORDYCKIE ZAKONY (REINHALL, BJÖRNHALL, RAVNHEIM, OTERGARD)
          ========================================================================= */}
      <div className="ramesville-hourglasses-container">
        {housesConfig.map((item) => {
          const pts = item.house?.startingPoints || 0;
          const fillPercent = Math.min(85, Math.max(18, (pts / 650) * 100));

          return (
            <div
              key={item.id}
              onClick={() => handleHouseClick(item.id)}
              className="ramesville-house-card"
              style={{
                '--theme-color': item.color
              }}
            >
              {/* Mascot Sitting on Top of the Card */}
              <div className="card-top-mascot-anchor">
                {item.mascotSvg}
              </div>

              {/* Glass Hourglass on Left */}
              <div className="card-glass-hourglass">
                {/* Metallic Top Ring */}
                <div className="hg-metal-cap top-cap" />

                {/* Glass Chamber */}
                <div className="hg-glass-chamber">
                  {/* Top Bulb */}
                  <div className="hg-bulb-top">
                    <div
                      className="hg-liquid-top"
                      style={{ background: item.sandColor }}
                    />
                  </div>

                  {/* Pinched Waist Neck */}
                  <div className="hg-waist-neck">
                    <div
                      className="hg-flow-stream"
                      style={{ background: item.color }}
                    />
                  </div>

                  {/* Bottom Bulb with Falling Gems/Sand */}
                  <div className="hg-bulb-bottom">
                    <div
                      className="hg-liquid-bottom"
                      style={{
                        height: `${fillPercent}%`,
                        background: `linear-gradient(180deg, ${item.color} 0%, ${item.gemColor} 100%)`
                      }}
                    >
                      <div className="liquid-glow-top" />
                    </div>
                  </div>
                </div>

                {/* Metallic Bottom Ring */}
                <div className="hg-metal-cap bottom-cap" />
              </div>

              {/* Right Content: Nordycka Nazwa Domu, Opiekun, Prefekt, Punkty */}
              <div className="card-house-details">
                {/* Prominent Nordic House Header */}
                <div
                  className="card-nordic-house-name"
                  style={{ color: item.color }}
                >
                  {item.runeTitle}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Opiekun:</span>
                  <span
                    className="detail-value"
                    style={{ color: item.colorText }}
                  >
                    {item.head}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Prefekt:</span>
                  <span
                    className="detail-value"
                    style={{ color: item.colorText }}
                  >
                    {item.prefect}
                  </span>
                </div>

                {/* Bottom Inset Points Pill */}
                <div className="card-bottom-pill">
                  <span
                    className="points-digit"
                    style={{ color: item.color }}
                  >
                    {pts}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
