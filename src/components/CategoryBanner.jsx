import React from 'react';
import { getCategoryBanner } from '../data/categoryBanners';
import { useSchool } from '../context/SchoolContext';

export const CategoryBanner = ({ category, customText, height = 140, style = {}, className = '' }) => {
  const school = useSchool?.();
  const dynamicBanners = school?.categoryBanners;

  // Find in dynamic context banners first, else fallback
  const query = (category || '').toLowerCase().trim();
  const matchedDynamic = dynamicBanners?.find(b => b.id === query || b.categoryName?.toLowerCase() === query || b.defaultScript?.toLowerCase() === query) ||
    dynamicBanners?.find(b => query.includes(b.id) || b.categoryName?.toLowerCase().includes(query) || query.includes((b.defaultScript || '').toLowerCase()));

  const bannerConfig = matchedDynamic || getCategoryBanner(category);
  const displayText = customText || bannerConfig?.defaultScript || category;
  const customImg = bannerConfig?.bgImage || bannerConfig?.imageUrl;

  // Render atmospheric silhouette / background elements based on bgType
  const renderBackgroundArt = (type) => {
    switch (type) {
      case 'potions':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="potionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#040810" />
                <stop offset="50%" stopColor="#0b172a" />
                <stop offset="100%" stopColor="#020408" />
              </linearGradient>
              <linearGradient id="tableGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2538" />
                <stop offset="100%" stopColor="#070a10" />
              </linearGradient>
              <radialGradient id="bottleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="800" height="120" fill="url(#potionsGrad)" />
            {/* Wooden table surface */}
            <polygon points="0,85 800,85 800,120 0,120" fill="url(#tableGrad)" opacity="0.9" />
            <line x1="0" y1="85" x2="800" y2="85" stroke="rgba(164, 200, 225, 0.2)" strokeWidth="1" />
            
            {/* Ambient bottle silhouettes left */}
            <circle cx="160" cy="80" r="35" fill="url(#bottleGlow)" />
            {/* Small flask */}
            <path d="M140,85 L140,65 Q140,60 145,55 L145,45 L150,45 L150,55 Q155,60 155,65 L155,85 Z" fill="#0d1828" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            {/* Round beaker */}
            <circle cx="180" cy="72" r="14" fill="#0a1424" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <rect x="177" y="50" width="6" height="10" fill="#0a1424" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <ellipse cx="180" cy="50" rx="4" ry="1.5" fill="#a4c8e1" opacity="0.4" />
            {/* Tall flask */}
            <path d="M220,85 L220,50 L226,50 L226,85 Z" fill="#091220" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Ambient bottle silhouettes center & right */}
            <circle cx="580" cy="78" r="40" fill="url(#bottleGlow)" />
            <path d="M570,85 L570,60 Q570,55 575,50 L575,40 L582,40 L582,50 Q587,55 587,60 L587,85 Z" fill="#0d1828" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <path d="M610,85 L602,68 L605,45 L615,45 L618,68 L626,85 Z" fill="#091422" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <circle cx="645" cy="75" r="10" fill="#0b1626" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Subtle candlelight flecks */}
            <circle cx="390" cy="82" r="1.5" fill="#e0f2fe" opacity="0.6" />
            <circle cx="410" cy="80" r="1" fill="#e0f2fe" opacity="0.4" />
          </svg>
        );

      case 'shadow':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#040208" />
                <stop offset="50%" stopColor="#180c28" />
                <stop offset="100%" stopColor="#030206" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#shadowGrad)" />
            {/* Ancient Grimoire silhouette left */}
            <path d="M120,85 L180,82 L210,86 L150,89 Z" fill="#120820" stroke="rgba(177,140,254,0.3)" strokeWidth="1" />
            <path d="M120,78 L180,75 L210,79 L150,82 Z" fill="#1b0d2e" stroke="rgba(177,140,254,0.25)" strokeWidth="1" />
            {/* Candle flame silhouettes */}
            <rect x="250" y="55" width="8" height="30" fill="#0d0618" stroke="rgba(255,255,255,0.1)" />
            <path d="M254,48 Q257,52 254,55 Q251,52 254,48 Z" fill="#b18cfe" opacity="0.7" />
            <rect x="580" y="50" width="10" height="35" fill="#0d0618" stroke="rgba(255,255,255,0.1)" />
            <path d="M585,42 Q589,47 585,50 Q581,47 585,42 Z" fill="#c084fc" opacity="0.8" />
            <path d="M620,85 L650,70 L670,85 Z" fill="#120820" opacity="0.6" />
          </svg>
        );

      case 'duel':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="duelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#080202" />
                <stop offset="50%" stopColor="#240c0c" />
                <stop offset="100%" stopColor="#040101" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#duelGrad)" />
            {/* Crossed Sword Silhouettes left */}
            <line x1="140" y1="40" x2="200" y2="85" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <line x1="200" y1="40" x2="140" y2="85" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            {/* Ice Pylons right */}
            <polygon points="620,85 635,40 650,85" fill="#180808" stroke="rgba(255,92,92,0.3)" strokeWidth="1" />
            <polygon points="655,85 665,48 675,85" fill="#120505" stroke="rgba(255,92,92,0.25)" strokeWidth="1" />
          </svg>
        );

      case 'runes':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="runesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#020606" />
                <stop offset="50%" stopColor="#081e1c" />
                <stop offset="100%" stopColor="#010303" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#runesGrad)" />
            {/* Runic Monoliths */}
            <polygon points="150,85 155,42 185,45 190,85" fill="#051412" stroke="rgba(46,196,182,0.3)" strokeWidth="1" />
            <text x="163" y="68" fill="#2ec4b6" opacity="0.6" fontSize="18" fontFamily="var(--font-heading)">ᛞ</text>
            <polygon points="630,85 635,38 660,40 668,85" fill="#051412" stroke="rgba(46,196,182,0.3)" strokeWidth="1" />
            <text x="643" y="66" fill="#2ec4b6" opacity="0.6" fontSize="18" fontFamily="var(--font-heading)">ᚦ</text>
          </svg>
        );

      case 'aurora':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="auroraGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#03060a" />
                <stop offset="50%" stopColor="#0a1526" />
                <stop offset="100%" stopColor="#020406" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#auroraGrad)" />
            {/* Waving aurora glow */}
            <path d="M0,50 Q200,25 400,55 T800,35 L800,120 L0,120 Z" fill="none" stroke="rgba(164,200,225,0.2)" strokeWidth="8" filter="blur(6px)" />
            <path d="M0,60 Q300,30 600,65 T800,45" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="4" filter="blur(4px)" />
            {/* Distant mountains silhouette */}
            <polygon points="0,85 80,68 180,85 320,62 450,85 600,60 720,85 800,72 800,120 0,120" fill="#050a12" />
          </svg>
        );

      case 'scrolls':
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="scrollsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#080603" />
                <stop offset="50%" stopColor="#1e180c" />
                <stop offset="100%" stopColor="#040302" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#scrollsGrad)" />
            {/* Rolled parchment left */}
            <path d="M140,75 C140,65 160,65 160,75 L210,75 C210,65 190,65 190,75 Z" fill="#140f06" stroke="rgba(238,207,130,0.3)" strokeWidth="1" />
            <line x1="230" y1="45" x2="245" y2="85" stroke="rgba(238,207,130,0.4)" strokeWidth="1.5" />
            {/* Inkpot right */}
            <path d="M620,85 L622,70 L638,70 L640,85 Z" fill="#0d0a05" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="630" y1="50" x2="630" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          </svg>
        );

      default:
        // Citadel / Default
        return (
          <svg className="cat-banner-svg-bg" viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="citadelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#060504" />
                <stop offset="50%" stopColor="#1a1510" />
                <stop offset="100%" stopColor="#040302" />
              </linearGradient>
            </defs>
            <rect width="800" height="120" fill="url(#citadelGrad)" />
            {/* Gothic fortress battlements left */}
            <polygon points="120,85 120,55 135,55 135,62 145,62 145,55 160,55 160,85" fill="#0d0a07" stroke="rgba(197,159,78,0.25)" strokeWidth="1" />
            {/* Battlements right */}
            <polygon points="640,85 640,55 655,55 655,62 665,62 665,55 680,55 680,85" fill="#0d0a07" stroke="rgba(197,159,78,0.25)" strokeWidth="1" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`category-banner-wrapper ${className}`}
      style={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        borderRadius: '3px',
        overflow: 'hidden',
        background: '#040609',
        borderTop: '2px solid #000000',
        borderBottom: '2px solid #000000',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style
      }}
    >
      {/* Background Atmosphere Art or Custom Image */}
      {customImg ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${customImg}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.6) contrast(1.15)'
          }}
        />
      ) : (
        renderBackgroundArt(bannerConfig?.bgType || 'potions')
      )}

      {/* Cinematic Vignette Left & Right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '18%',
          background: 'linear-gradient(90deg, #000000 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '18%',
          background: 'linear-gradient(270deg, #000000 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Center Fluid Cursive Script Text */}
      <div
        className="category-banner-script-text"
        style={{
          position: 'relative',
          zIndex: 3,
          fontFamily: "'Cinzel Decorative', 'Metamorphous', 'Germania One', serif",
          fontSize: '2.6rem',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
          textShadow: '0 0 12px rgba(255, 255, 255, 0.45), 0 2px 5px rgba(0, 0, 0, 0.95)',
          transform: 'rotate(-1.5deg)',
          display: 'inline-block',
          whiteSpace: 'nowrap'
        }}
      >
        {displayText}
      </div>
    </div>
  );
};
