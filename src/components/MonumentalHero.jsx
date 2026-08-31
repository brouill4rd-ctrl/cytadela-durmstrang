import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { HOUSE_RUNIC_DATA, HOUSE_CREST_IMAGES, normalizeHouseKey } from './HeraldicEmblems';
import { cleanPersonName } from '../context/schoolUtils';
import { DiscordRecruitmentBanner } from './DiscordRecruitmentBanner';
import {
  Flame,
  UserPlus,
  Zap,
  Shield
} from 'lucide-react';

const HOUSE_ORNAMENT_CLASS = {
  reinhall: 'order-ornament-reinhall',
  bjornhall: 'order-ornament-bjornhall',
  ravnheim: 'order-ornament-ravnheim',
  otergard: 'order-ornament-otergard'
};

export const MonumentalHero = ({ onOpenCreationModal }) => {
  const {
    houses,
    houseRankings,
    fortressGuardian,
    setActiveView,
    setActiveHouseTab,
    currentUser,
    openAuthModal
  } = useSchool();

  const { playWandSwoosh } = useSound();

  const handleHouseClick = (houseId) => {
    playWandSwoosh();
    setActiveHouseTab(houseId);
    setActiveView('houses');
  };

  const rankingByHouse = new Map(
    (houseRankings?.standings || []).map((standing) => [standing.houseKey, standing])
  );

  const housesConfig = [
    {
      id: 'reinhall',
      name: rankingByHouse.get('reinhall')?.name || houses?.reinhall?.name || 'Reinhall',
      subtitle: 'Zakon Renifera',
      color: '#7A2632',
      colorLight: '#a8384b',
      colorText: '#e8bfc6',
      colorGlow: 'rgba(122, 38, 50, 0.45)',
      head: houses?.reinhall?.headOfHouse || 'Prof. Sigrid Hällström',
      prefect: houses?.reinhall?.prefect || 'Magnus Blom',
      points: rankingByHouse.get('reinhall')?.totalPoints ?? houses?.reinhall?.startingPoints ?? houses?.reinhall?.points ?? 0
    },
    {
      id: 'bjornhall',
      name: rankingByHouse.get('bjornhall')?.name || houses?.bjornhall?.name || 'Björnhall',
      subtitle: 'Zakon Niedźwiedzia',
      color: '#35536F',
      colorLight: '#5b8aaf',
      colorText: '#c4d8e8',
      colorGlow: 'rgba(53, 83, 111, 0.45)',
      head: houses?.bjornhall?.headOfHouse || 'Prof. Gunnar Vargson',
      prefect: houses?.bjornhall?.prefect || 'Astrid Vargadottir',
      points: rankingByHouse.get('bjornhall')?.totalPoints ?? houses?.bjornhall?.startingPoints ?? houses?.bjornhall?.points ?? 0
    },
    {
      id: 'ravnheim',
      name: rankingByHouse.get('ravnheim')?.name || houses?.ravnheim?.name || 'Ravnheim',
      subtitle: 'Zakon Kruka',
      color: '#42385F',
      colorLight: '#7a6ea0',
      colorText: '#d0c8e2',
      colorGlow: 'rgba(66, 56, 95, 0.45)',
      head: houses?.ravnheim?.headOfHouse || 'Prof. Morana Vane',
      prefect: houses?.ravnheim?.prefect || 'Valdemar Krag-Hansen',
      points: rankingByHouse.get('ravnheim')?.totalPoints ?? houses?.ravnheim?.startingPoints ?? houses?.ravnheim?.points ?? 0
    },
    {
      id: 'otergard',
      name: rankingByHouse.get('otergard')?.name || houses?.otergard?.name || 'Otergard',
      subtitle: 'Zakon Wydry',
      color: '#23615B',
      colorLight: '#3aaa9f',
      colorText: '#b4e0da',
      colorGlow: 'rgba(35, 97, 91, 0.45)',
      head: houses?.otergard?.headOfHouse || 'Prof. Klaus Lindqvist',
      prefect: houses?.otergard?.prefect || 'Sigrun Lindqvist',
      points: rankingByHouse.get('otergard')?.totalPoints ?? houses?.otergard?.startingPoints ?? houses?.otergard?.points ?? 0
    }
  ];

  const maxPoints = Math.max(...housesConfig.map((order) => order.points), 0);

  return (
    <section className="monumental-hero-section" role="banner">
      <div className="hero-aurora-glow" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-center-content">
        <div className="hero-school-emblem">
          <div className="hero-emblem-aura" aria-hidden="true" />
          <img
            src="/tmd_herb.webp"
            alt="Herb Twierdzy Magii Durmstrang"
            className="hero-emblem-img"
            width="105"
            height="105"
          />
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

      </div>

      {/* ===== TABLICA ZAKONÓW ===== */}
      <section className="orders-board" aria-labelledby="orders-board-title">
        <div className="orders-board__inner-line" aria-hidden="true" />

        <header className="orders-board__header">
          <div className="orders-board__title-group">
            <span className="orders-board__eyebrow">ᛞ · Puchar Północy · ᛞ</span>
            <h2 id="orders-board-title">Tablica Zakonów</h2>
            <div className="orders-board__runes" aria-hidden="true">ᚦ ᛉ ᚱ ᛞ · ᛁ ᛋ ᛟ · ᚾ ᛟ ᚱ ᚦ</div>
            {fortressGuardian?.name && (() => {
              const fgKey = normalizeHouseKey(fortressGuardian.house || 'ravnheim');
              const fgRunic = HOUSE_RUNIC_DATA[fgKey] || HOUSE_RUNIC_DATA.ravnheim;
              return (
                <button
                  type="button"
                  onClick={() => { playWandSwoosh(); setActiveView('houses'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: `linear-gradient(135deg, ${fgRunic.primaryColor}55 0%, rgba(8, 11, 16, 0.85) 100%)`,
                    border: `1px solid ${fgRunic.secondaryColor}`,
                    borderRadius: '3px',
                    padding: '0.4rem 1rem',
                    marginTop: '0.6rem',
                    boxShadow: `0 3px 14px rgba(0,0,0,0.7), 0 0 16px ${fgRunic.glowColor}`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  title="Kliknij, aby otworzyć profil Strażnika Twierdzy"
                >
                  <span style={{ fontFamily: 'serif', fontSize: '0.95rem', color: fgRunic.secondaryColor, lineHeight: 1, flexShrink: 0 }}>
                    {fgRunic.rune}
                  </span>
                  <span style={{ width: '1px', height: '16px', background: `${fgRunic.secondaryColor}66`, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.63rem', color: fgRunic.secondaryColor, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
                    Strażnik Twierdzy
                  </span>
                  <span style={{ width: '1px', height: '16px', background: `${fgRunic.secondaryColor}66`, flexShrink: 0 }} />
                  <strong style={{ fontSize: '0.86rem', color: '#ffffff', letterSpacing: '0.02em', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {fortressGuardian.name}
                  </strong>
                  <span style={{
                    fontSize: '0.63rem',
                    color: fgRunic.secondaryColor,
                    background: `${fgRunic.primaryColor}77`,
                    padding: '0.1rem 0.45rem',
                    border: `1px solid ${fgRunic.secondaryColor}77`,
                    borderRadius: '2px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.08em',
                    flexShrink: 0
                  }}>
                    {fortressGuardian.house ? fortressGuardian.house.toUpperCase() : 'CYTADELA'}
                  </span>
                  <span style={{ fontFamily: 'serif', fontSize: '0.95rem', color: fgRunic.secondaryColor, lineHeight: 1, flexShrink: 0 }}>
                    {fgRunic.rune}
                  </span>
                </button>
              );
            })()}
          </div>

          <div className="orders-board__actions">
            {currentUser ? (
              <>
                {currentUser.role === 'student' && (
                  <button
                    type="button"
                    onClick={() => { playWandSwoosh(); setActiveView('ceremony'); }}
                    className="orders-board__action"
                  >
                    <Flame size={13} aria-hidden="true" />
                    <span>Rytuał Kamienia Przysięgi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { playWandSwoosh(); setActiveView('rune-workshop'); }}
                  className="orders-board__action orders-board__action--galdr"
                >
                  <Zap size={13} aria-hidden="true" />
                  <span>Warsztat Run (Galdr)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playWandSwoosh();
                  if (openAuthModal) openAuthModal('register');
                  else if (onOpenCreationModal) onOpenCreationModal();
                }}
                className="orders-board__action"
              >
                <UserPlus size={13} aria-hidden="true" />
                <span>Złóż Podanie Adepta</span>
              </button>
            )}
          </div>
        </header>

        <div className="orders-board__grid" role="list">
          {housesConfig.map((item, index) => {
            const runic = HOUSE_RUNIC_DATA[item.id] || HOUSE_RUNIC_DATA.reinhall;
            const crestSrc = HOUSE_CREST_IMAGES[item.id] || HOUSE_CREST_IMAGES.reinhall;
            const progress = maxPoints > 0
              ? Math.min(100, Math.max(0, (item.points / maxPoints) * 100))
              : 0;
            const markerPosition = Math.min(96, Math.max(4, progress));

            return (
              <article
                key={item.id}
                className={`order-segment ${HOUSE_ORNAMENT_CLASS[item.id] || ''}`}
                role="listitem"
                style={{
                  '--order-color': item.color,
                  '--order-light': item.colorLight,
                  '--order-glow': item.colorGlow,
                  '--order-text': item.colorText,
                  '--progress': `${progress}%`,
                  '--marker-position': `${markerPosition}%`,
                  '--order-index': index
                }}
              >
                <button
                  type="button"
                  className="order-segment__open"
                  onClick={() => handleHouseClick(item.id)}
                  aria-label={`Otwórz Zakon ${item.name}, ${item.points} punktów`}
                />

                <div className="order-segment__ornament" aria-hidden="true" />

                <div className="order-segment__summary">
                  <div className="order-segment__crest">
                    <span className="order-segment__crest-ring" aria-hidden="true" />
                    <img
                      src={crestSrc}
                      alt={`Herb Zakonu ${item.name}`}
                      className="order-segment__crest-img"
                      loading="lazy"
                      width="88"
                      height="88"
                    />
                  </div>

                  <div className="order-segment__identity">
                    <div className="order-segment__name-row">
                      <span className="order-segment__rune" aria-hidden="true">{runic.rune}</span>
                      <h3>{item.name}</h3>
                    </div>
                    <span className="order-segment__subtitle">{item.subtitle}</span>
                  </div>
                </div>

                <div className="order-segment__people">
                  <div className="order-segment__person">
                    <span>Opiekun</span>
                    <strong>{cleanPersonName(item.head)}</strong>
                  </div>
                  <div className="order-segment__person">
                    <span>Strażnik</span>
                    <strong>{cleanPersonName(item.prefect)}</strong>
                  </div>
                </div>

                <div className="order-segment__meter-header">
                  <div className="order-segment__meter-points">
                    <strong>{item.points}</strong>
                    <span>Punktów</span>
                  </div>
                </div>

                <div className="order-meter" aria-label={`Poziom punktów: ${Math.round(progress)}% wyniku lidera`}>
                  <span className="order-meter__cap order-meter__cap--left" aria-hidden="true" />
                  <div className="order-meter__glass" aria-hidden="true">
                    <div className="order-meter__fill" />
                    <div className="order-meter__dust" />
                    <div className="order-meter__shine" />
                  </div>
                  <span className="order-meter__cap order-meter__cap--right" aria-hidden="true" />
                  <span className="order-meter__marker" aria-hidden="true">
                    <span>{runic.rune}</span>
                  </span>
                </div>

              </article>
            );
          })}
        </div>

        <footer className="orders-board__footer">
          <span aria-hidden="true">ᚦ ᛉ ᚱ ᛞ</span>
          <p>Cztery Zakony · Jedna Twierdza · Wiedza i Dyscyplina</p>
          <span aria-hidden="true">ᛞ ᚱ ᛉ ᚦ</span>
        </footer>
      </section>

      <DiscordRecruitmentBanner />
    </section>
  );
};
