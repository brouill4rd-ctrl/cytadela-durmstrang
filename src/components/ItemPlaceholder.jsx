import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

/**
 * ItemPlaceholder — Visual fantasy artwork and image renderer for Durmstrang store artifacts.
 * Renders user-provided photographs/artworks with gothic runic frames, or fallback stylized SVG illustrations.
 */
export const ItemPlaceholder = ({ item, size = 'normal', showDetails = false }) => {
  const { placeholderType, rarity, name, icon, imageUrl, image } = item || {};
  const [imageError, setImageError] = useState(false);

  const finalImageUrl = imageUrl || image || '';

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [finalImageUrl]);

  // Rarity color palette
  const getRarityGlow = (rar) => {
    switch (rar) {
      case 'Legendarne':
        return {
          glow: 'rgba(255, 215, 0, 0.45)',
          border: 'rgba(218, 165, 32, 0.85)',
          bg: 'radial-gradient(circle at center, rgba(80, 55, 10, 0.75) 0%, rgba(15, 20, 30, 0.95) 100%)',
          accent: '#ffe8aa'
        };
      case 'Epicki':
        return {
          glow: 'rgba(168, 85, 247, 0.45)',
          border: 'rgba(168, 85, 247, 0.85)',
          bg: 'radial-gradient(circle at center, rgba(50, 20, 80, 0.75) 0%, rgba(15, 20, 30, 0.95) 100%)',
          accent: '#d8b4fe'
        };
      case 'Rzadki':
        return {
          glow: 'rgba(46, 196, 182, 0.45)',
          border: 'rgba(46, 196, 182, 0.75)',
          bg: 'radial-gradient(circle at center, rgba(15, 55, 60, 0.75) 0%, rgba(15, 20, 30, 0.95) 100%)',
          accent: '#8cefe6'
        };
      case 'Niezbędny':
        return {
          glow: 'rgba(197, 159, 78, 0.4)',
          border: 'rgba(197, 159, 78, 0.7)',
          bg: 'radial-gradient(circle at center, rgba(40, 45, 60, 0.75) 0%, rgba(15, 20, 30, 0.95) 100%)',
          accent: '#c59f4e'
        };
      default:
        return {
          glow: 'rgba(156, 163, 175, 0.25)',
          border: 'rgba(107, 114, 128, 0.55)',
          bg: 'radial-gradient(circle at center, rgba(25, 30, 40, 0.75) 0%, rgba(12, 16, 22, 0.95) 100%)',
          accent: '#9ca3af'
        };
    }
  };

  const styleConfig = getRarityGlow(rarity);

  const containerHeight = size === 'large' ? '230px' : size === 'small' ? '90px' : '160px';

  // SVG art templates based on placeholderType
  const renderArt = () => {
    switch (placeholderType) {
      // 1. Wands
      case 'wand_dark':
      case 'wand_ancient':
      case 'wand_runic':
      case 'wand_bone':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ filter: 'drop-shadow(0 0 10px rgba(197,159,78,0.4))' }}>
            <defs>
              <linearGradient id="wandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a1510" />
                <stop offset="50%" stopColor="#4a3728" />
                <stop offset="100%" stopColor="#8a6c42" />
              </linearGradient>
              <filter id="runeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Sparkles / Aura */}
            <circle cx="165" cy="35" r="22" fill="url(#wandGrad)" opacity="0.15" />
            <circle cx="165" cy="35" r="8" fill={styleConfig.accent} opacity="0.6" filter="url(#runeGlow)" />
            {/* Wand shaft */}
            <line x1="30" y1="170" x2="165" y2="35" stroke="url(#wandGrad)" strokeWidth="9" strokeLinecap="round" />
            <line x1="28" y1="172" x2="65" y2="135" stroke="#120d09" strokeWidth="13" strokeLinecap="round" />
            {/* Runic engravings */}
            <text x="75" y="125" fill="#f7dca0" fontSize="13" fontFamily="serif" transform="rotate(-45 75,125)">ᚦ ᚱ ᛉ</text>
            {/* Magic Sparks */}
            <circle cx="178" cy="22" r="2" fill="#fff" />
            <circle cx="152" cy="20" r="3" fill="#ffe8aa" />
            <circle cx="180" cy="48" r="2.5" fill="#8cefe6" />
          </svg>
        );

      // 2. Robes & Armor
      case 'robe_fur':
      case 'robe_reindeer':
      case 'robe_armor':
      case 'robe_shadow':
      case 'robe_alchemist':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <linearGradient id="robeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2c1818" />
                <stop offset="60%" stopColor="#151b26" />
                <stop offset="100%" stopColor="#0a0e14" />
              </linearGradient>
            </defs>
            {/* Cape Silhouette */}
            <path d="M60 40 Q100 25 140 40 L165 170 Q100 185 35 170 Z" fill="url(#robeGrad)" stroke={styleConfig.border} strokeWidth="2" />
            {/* Fur Collar */}
            <path d="M50 40 Q100 65 150 40 Q160 70 145 80 Q100 95 55 80 Q40 65 50 40 Z" fill="#4b3f36" stroke="#c59f4e" strokeWidth="1.5" />
            {/* Nordic Brooch */}
            <circle cx="100" cy="65" r="10" fill="#c59f4e" stroke="#fff" strokeWidth="1" />
            <text x="100" y="70" fill="#090d14" fontSize="12" fontWeight="bold" textAnchor="middle">ᛟ</text>
            {/* Cloak Fold Lines */}
            <line x1="85" y1="85" x2="70" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <line x1="115" y1="85" x2="130" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          </svg>
        );

      // 3. Books & Grimoires
      case 'book_shadow':
      case 'book_runic':
      case 'book_alchemy':
      case 'book_parchment':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2d1b38" />
                <stop offset="100%" stopColor="#0f1118" />
              </linearGradient>
            </defs>
            {/* Book Body */}
            <rect x="45" y="35" width="110" height="135" rx="8" fill="url(#bookCover)" stroke={styleConfig.border} strokeWidth="3" />
            {/* Book Spine */}
            <rect x="38" y="35" width="14" height="135" rx="4" fill="#1b1220" stroke="rgba(255,255,255,0.15)" />
            {/* Corner Metal Ornaments */}
            <path d="M52 38 L72 38 L52 58 Z" fill="#c59f4e" />
            <path d="M148 38 L128 38 L148 58 Z" fill="#c59f4e" />
            <path d="M148 165 L128 165 L148 145 Z" fill="#c59f4e" />
            {/* Central Runic Symbol */}
            <circle cx="100" cy="100" r="26" fill="rgba(0,0,0,0.5)" stroke="var(--gold-ancient)" strokeWidth="1.5" />
            <text x="100" y="108" fill={styleConfig.accent} fontSize="24" fontFamily="serif" textAnchor="middle">ᛞ</text>
            <text x="100" y="145" fill="#a4b2c9" fontSize="9" letterSpacing="2" textAnchor="middle">GRIMOIRE</text>
          </svg>
        );

      // 4. Potions & Alchemy
      case 'potion_cauldron':
      case 'potion_phials':
      case 'potion_frost':
      case 'potion_berserk':
      case 'potion_shadow':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <linearGradient id="potionLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8cefe6" />
                <stop offset="100%" stopColor="#0d5c58" />
              </linearGradient>
            </defs>
            {/* Potion Flask */}
            <path d="M90 35 L110 35 L110 65 L145 140 Q150 165 100 165 Q50 165 55 140 L90 65 Z" fill="rgba(255,255,255,0.07)" stroke={styleConfig.border} strokeWidth="2.5" />
            {/* Cork */}
            <rect x="88" y="22" width="24" height="15" rx="3" fill="#8a5a36" stroke="#4a2e18" strokeWidth="1.5" />
            {/* Liquid Level */}
            <path d="M62 135 Q100 145 138 135 L143 145 Q145 160 100 160 Q55 160 57 145 Z" fill="url(#potionLiquid)" opacity="0.85" />
            {/* Bubbles */}
            <circle cx="90" cy="140" r="4" fill="#ffffff" opacity="0.7" />
            <circle cx="110" cy="130" r="3" fill="#ffffff" opacity="0.6" />
            <circle cx="102" cy="100" r="2.5" fill="#8cefe6" opacity="0.8" />
            {/* Magic Seal Tag */}
            <circle cx="100" cy="85" r="12" fill="rgba(0,0,0,0.6)" stroke="#c59f4e" />
            <text x="100" y="90" fill="#f7dca0" fontSize="13" textAnchor="middle">ᚲ</text>
          </svg>
        );

      // 5. Equipment & Armory
      case 'equipment_gauntlets':
      case 'equipment_boots':
      case 'equipment_belt':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a5568" />
                <stop offset="50%" stopColor="#2d3748" />
                <stop offset="100%" stopColor="#1a202c" />
              </linearGradient>
            </defs>
            {/* Shield / Plate Badge */}
            <path d="M100 30 L155 55 L140 135 L100 170 L60 135 L45 55 Z" fill="url(#metalGrad)" stroke={styleConfig.border} strokeWidth="3" />
            {/* Crossed Swords / Runes */}
            <line x1="75" y1="75" x2="125" y2="125" stroke="#c59f4e" strokeWidth="4" strokeLinecap="round" />
            <line x1="125" y1="75" x2="75" y2="125" stroke="#c59f4e" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="100" r="14" fill="#111827" stroke="#ffffff" strokeWidth="1.5" />
            <text x="100" y="106" fill={styleConfig.accent} fontSize="15" textAnchor="middle">ᛏ</text>
          </svg>
        );

      // 6. Companions / Beasts
      case 'pet_raven':
      case 'pet_fox':
      case 'pet_owl':
      case 'pet_wolf':
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a4c8e1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0a0e17" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Full Moon Background */}
            <circle cx="100" cy="95" r="55" fill="url(#moonGlow)" />
            <circle cx="100" cy="95" r="42" fill="none" stroke="rgba(164,200,225,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Central Companion Silhouette Icon */}
            <text x="100" y="115" fontSize="56" textAnchor="middle" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}>
              {icon || '🦅'}
            </text>
            {/* Nordic Aura Rings */}
            <text x="100" y="165" fill="var(--gold-ancient)" fontSize="10" letterSpacing="3" textAnchor="middle">HRAFN • NORDIC</text>
          </svg>
        );

      // 7. Artifacts & Jewelry
      case 'artifact_ring':
      case 'artifact_pendant':
      case 'artifact_compass':
      default:
        return (
          <svg viewBox="0 0 200 200" width="100%" height="100%">
            <defs>
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe8aa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8a6c2f" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Sacred Geometry / Outer Runic Circle */}
            <circle cx="100" cy="100" r="60" fill="none" stroke={styleConfig.border} strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="100" cy="100" r="46" fill="rgba(10, 15, 25, 0.85)" stroke="var(--gold-ancient)" strokeWidth="1.5" />
            {/* Glowing Gem Center */}
            <circle cx="100" cy="100" r="28" fill="url(#ringGlow)" />
            <polygon points="100,78 118,92 112,115 88,115 82,92" fill={styleConfig.accent} stroke="#ffffff" strokeWidth="1" />
            <text x="100" y="104" fill="#000" fontSize="13" fontWeight="bold" textAnchor="middle">ᛉ</text>
          </svg>
        );
    }
  };

  const hasValidImage = finalImageUrl && !imageError;

  return (
    <div
      className="item-placeholder-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: containerHeight,
        background: styleConfig.bg,
        border: `1px solid ${styleConfig.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 25px rgba(0,0,0,0.6), inset 0 0 20px ${styleConfig.glow}`,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Corner Runic Brackets */}
      <div style={{ position: 'absolute', top: '6px', left: '8px', fontSize: '0.65rem', color: styleConfig.accent, opacity: 0.7, fontFamily: 'serif', zIndex: 3, pointerEvents: 'none' }}>ᚠ</div>
      <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '0.65rem', color: styleConfig.accent, opacity: 0.7, fontFamily: 'serif', zIndex: 3, pointerEvents: 'none' }}>ᛞ</div>
      <div style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '0.65rem', color: styleConfig.accent, opacity: 0.7, fontFamily: 'serif', zIndex: 3, pointerEvents: 'none' }}>ᛟ</div>
      <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '0.65rem', color: styleConfig.accent, opacity: 0.7, fontFamily: 'serif', zIndex: 3, pointerEvents: 'none' }}>ᛉ</div>

      {hasValidImage ? (
        <>
          {/* Custom Photograph / Artwork with Gothic Ambient Glow */}
          <img
            src={finalImageUrl}
            alt={name || 'Artefakt'}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease'
            }}
          />
          {/* Vignette & Runic Frame Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8,11,17,0.2) 0%, rgba(8,11,17,0.1) 40%, rgba(8,11,17,0.85) 100%)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
        </>
      ) : (
        /* Fallback SVG Art / Placeholder Frame */
        <div style={{ width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderArt()}
        </div>
      )}

      {/* Rarity & Placeholder Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '6px',
          background: 'rgba(4, 7, 12, 0.85)',
          backdropFilter: 'blur(6px)',
          padding: '0.2rem 0.65rem',
          borderRadius: '4px',
          border: `1px solid ${styleConfig.border}`,
          fontSize: '0.68rem',
          fontWeight: 700,
          color: styleConfig.accent,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.7)'
        }}
      >
        <span>{icon || '💎'}</span>
        <span>{rarity || 'Artefakt'}</span>
      </div>
    </div>
  );
};
