import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { HOUSE_RUNIC_DATA, HOUSE_CREST_IMAGES } from './HeraldicEmblems';
import { cleanPersonName } from '../context/schoolUtils';
import { UserPlus, GraduationCap, Compass, MessagesSquare } from 'lucide-react';
import './MonumentalHero.css';

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
    setActiveView,
    setActiveHouseTab,
    openAuthModal
  } = useSchool();

  const { playWandSwoosh } = useSound();

  const go = (view) => { playWandSwoosh(); setActiveView(view); };
  const openRegister = () => {
    playWandSwoosh();
    if (openAuthModal) openAuthModal('register');
    else if (onOpenCreationModal) onOpenCreationModal();
  };
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
      color: '#7A2632', colorLight: '#a8384b', colorText: '#e8bfc6', colorGlow: 'rgba(122, 38, 50, 0.45)',
      head: houses?.reinhall?.headOfHouse || 'Prof. Sigrid Hällström',
      prefect: houses?.reinhall?.prefect || 'Magnus Blom',
      points: rankingByHouse.get('reinhall')?.totalPoints ?? houses?.reinhall?.startingPoints ?? houses?.reinhall?.points ?? 0
    },
    {
      id: 'bjornhall',
      name: rankingByHouse.get('bjornhall')?.name || houses?.bjornhall?.name || 'Björnhall',
      subtitle: 'Zakon Niedźwiedzia',
      color: '#35536F', colorLight: '#5b8aaf', colorText: '#c4d8e8', colorGlow: 'rgba(53, 83, 111, 0.45)',
      head: houses?.bjornhall?.headOfHouse || 'Prof. Gunnar Vargson',
      prefect: houses?.bjornhall?.prefect || 'Astrid Vargadottir',
      points: rankingByHouse.get('bjornhall')?.totalPoints ?? houses?.bjornhall?.startingPoints ?? houses?.bjornhall?.points ?? 0
    },
    {
      id: 'ravnheim',
      name: rankingByHouse.get('ravnheim')?.name || houses?.ravnheim?.name || 'Ravnheim',
      subtitle: 'Zakon Kruka',
      color: '#42385F', colorLight: '#7a6ea0', colorText: '#d0c8e2', colorGlow: 'rgba(66, 56, 95, 0.45)',
      head: houses?.ravnheim?.headOfHouse || 'Prof. Morana Vane',
      prefect: houses?.ravnheim?.prefect || 'Valdemar Krag-Hansen',
      points: rankingByHouse.get('ravnheim')?.totalPoints ?? houses?.ravnheim?.startingPoints ?? houses?.ravnheim?.points ?? 0
    },
    {
      id: 'otergard',
      name: rankingByHouse.get('otergard')?.name || houses?.otergard?.name || 'Otergard',
      subtitle: 'Zakon Wydry',
      color: '#23615B', colorLight: '#3aaa9f', colorText: '#b4e0da', colorGlow: 'rgba(35, 97, 91, 0.45)',
      head: houses?.otergard?.headOfHouse || 'Prof. Klaus Lindqvist',
      prefect: houses?.otergard?.prefect || 'Sigrun Lindqvist',
      points: rankingByHouse.get('otergard')?.totalPoints ?? houses?.otergard?.startingPoints ?? houses?.otergard?.points ?? 0
    }
  ];

  const maxPoints = Math.max(...housesConfig.map((order) => order.points), 0);

  return (
    <section className="monumental-hero-section" aria-label="Twierdza Magii Durmstrang">
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-center-content">
        <h1 className="hero-main-title">Twierdza Magii Durmstrang</h1>

        <div className="hero-rule" aria-hidden="true"><span>◇</span></div>

        <p className="hero-motto">Nie każda magia powinna zostać poznana.</p>

        <nav className="hero-shortcuts" aria-label="Skróty Twierdzy">
          <button type="button" className="hero-shortcut" onClick={openRegister}>
            <UserPlus size={20} strokeWidth={1.6} aria-hidden="true" />
            <span><b>Dołącz do nas</b><span>Rozpocznij swoją drogę</span></span>
          </button>
          <button type="button" className="hero-shortcut" onClick={() => go('academic')}>
            <GraduationCap size={20} strokeWidth={1.6} aria-hidden="true" />
            <span><b>Poznaj Akademię</b><span>Katedry i zasady</span></span>
          </button>
          <button type="button" className="hero-shortcut" onClick={() => go('map')}>
            <Compass size={20} strokeWidth={1.6} aria-hidden="true" />
            <span><b>Świat Północy</b><span>Mapa i lokacje</span></span>
          </button>
          <a
            className="hero-shortcut"
            href="/api/discord/invite"
            target="_blank"
            rel="noreferrer"
            onClick={() => playWandSwoosh()}
          >
            <MessagesSquare size={20} strokeWidth={1.6} aria-hidden="true" />
            <span><b>Społeczność</b><span>Discord i wydarzenia</span></span>
          </a>
        </nav>
      </div>

      {/* ===== TABLICA ZAKONÓW ===== */}
      <section className="orders-board" aria-labelledby="orders-board-title">
        <header className="orders-board__header">
          <span className="orders-board__hrule" aria-hidden="true" />
          <span className="orders-board__diamond" aria-hidden="true">◇</span>
          <h2 id="orders-board-title">Tablica Zakonów</h2>
          <span className="orders-board__diamond" aria-hidden="true">◇</span>
          <span className="orders-board__hrule" aria-hidden="true" />
        </header>

        <div className="orders-board__grid" role="list">
          {housesConfig.map((item, index) => {
            const runic = HOUSE_RUNIC_DATA[item.id] || HOUSE_RUNIC_DATA.reinhall;
            const crestSrc = HOUSE_CREST_IMAGES[item.id] || HOUSE_CREST_IMAGES.reinhall;
            const progress = maxPoints > 0
              ? Math.min(100, Math.max(0, (item.points / maxPoints) * 100))
              : 0;
            const markerPosition = Math.min(96, Math.max(4, progress));
            const isLeader = maxPoints > 0 && item.points === maxPoints;

            return (
              <article
                key={item.id}
                className={`order-segment ${HOUSE_ORNAMENT_CLASS[item.id] || ''}`}
                role="listitem"
                data-leader={isLeader || undefined}
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
                  aria-label={`Otwórz Zakon ${item.name}, ${item.points} punktów${isLeader ? ' — obecny lider Pucharu Północy' : ''}`}
                />
                <div className="order-segment__ornament" aria-hidden="true" />
                <span className="order-segment__corner order-segment__corner--l" aria-hidden="true">{runic.rune}</span>
                <span className="order-segment__corner order-segment__corner--r" aria-hidden="true">{runic.rune}</span>

                <img
                  src={crestSrc}
                  alt={`Herb Zakonu ${item.name}`}
                  className="order-segment__crest-img"
                  loading="lazy"
                  width="112"
                  height="112"
                />

                <h3 className="order-segment__name">
                  <span className="order-segment__rune" aria-hidden="true">{runic.rune}</span>
                  {item.name}
                </h3>
                <span className="order-segment__subtitle">{item.subtitle}</span>

                <span className="order-segment__rule" aria-hidden="true" />

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

                <div className="order-segment__points">
                  <strong>{item.points}</strong>
                  <span>Punktów</span>
                </div>

                <div className="order-meter" aria-label={`Poziom punktów: ${Math.round(progress)}% wyniku lidera`}>
                  <div className="order-meter__fill" />
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
    </section>
  );
};
