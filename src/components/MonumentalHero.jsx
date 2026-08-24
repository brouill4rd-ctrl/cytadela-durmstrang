import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { OrderCrest, normalizeHouseKey, HOUSE_RUNIC_DATA } from './HeraldicEmblems';
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
    currentUser,
    openAuthModal
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
      prefect: 'Magnus Blom'
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
      prefect: 'Astrid Vargadottir'
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
      prefect: 'Valdemar Krag-Hansen'
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
      prefect: 'Sigrun Lindqvist'
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
              onClick={() => {
                playWandSwoosh();
                if (openAuthModal) openAuthModal('register');
                else if (onOpenCreationModal) onOpenCreationModal();
              }}
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
              {/* Mascot Emblem Sitting on Top of the Card */}
              <div className="card-top-mascot-anchor">
                <OrderCrest houseKey={item.id} size={52} showFrame={true} />
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
