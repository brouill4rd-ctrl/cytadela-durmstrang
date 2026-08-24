import React from 'react';

// ============================================================================
// 🦌 REINHALL: MAJESTIC NORDIC STAG / REINDEER (CZYTELNY, ELEGANCKI JELEŃ)
// ============================================================================
export const ReinhallCrest = ({ size = 120, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="reinhall-gold-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="80%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>

      <linearGradient id="reinhall-ruby" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>

      <filter id="reinhall-glow-fx" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Runic Shield / Ring */}
    <circle
      cx="100"
      cy="100"
      r="88"
      stroke="url(#reinhall-gold-main)"
      strokeWidth="1.5"
      strokeDasharray="6,4"
      strokeOpacity="0.4"
    />
    <circle cx="100" cy="100" r="82" stroke="url(#reinhall-gold-main)" strokeWidth="0.75" strokeOpacity="0.25" />

    {/* LEFT ANTLERS (Bogate, rozłożyste rogi renifera) */}
    <g filter="url(#reinhall-glow-fx)" stroke="url(#reinhall-gold-main)" strokeLinecap="round" strokeLinejoin="round">
      {/* Main Left Beam */}
      <path d="M 88,68 C 75,45 50,30 28,25" strokeWidth="4.5" />
      {/* Left Brow Tines (Dolne odnogi nad czołem) */}
      <path d="M 82,60 C 65,56 52,62 44,70" strokeWidth="3" />
      <path d="M 72,52 C 55,42 46,45 38,50" strokeWidth="2.5" />
      {/* Upper Left Tines */}
      <path d="M 58,35 C 48,20 34,16 22,18" strokeWidth="3.5" />
      <path d="M 44,28 C 36,12 26,10 16,12" strokeWidth="3" />
      <path d="M 32,25 C 26,15 18,16 12,22" strokeWidth="2.5" />
    </g>

    {/* RIGHT ANTLERS (Bogate, rozłożyste rogi prawe) */}
    <g filter="url(#reinhall-glow-fx)" stroke="url(#reinhall-gold-main)" strokeLinecap="round" strokeLinejoin="round">
      {/* Main Right Beam */}
      <path d="M 112,68 C 125,45 150,30 172,25" strokeWidth="4.5" />
      {/* Right Brow Tines */}
      <path d="M 118,60 C 135,56 148,62 156,70" strokeWidth="3" />
      <path d="M 128,52 C 145,42 154,45 162,50" strokeWidth="2.5" />
      {/* Upper Right Tines */}
      <path d="M 142,35 C 152,20 166,16 178,18" strokeWidth="3.5" />
      <path d="M 156,28 C 164,12 174,10 184,12" strokeWidth="3" />
      <path d="M 168,25 C 174,15 182,16 188,22" strokeWidth="2.5" />
    </g>

    {/* STAG EARS (Wyraźne uszy jelenia) */}
    <path
      d="M 80,72 C 60,68 48,76 42,88 C 56,90 70,84 82,78 Z"
      fill="#171216"
      stroke="url(#reinhall-gold-main)"
      strokeWidth="2"
    />
    <path
      d="M 120,72 C 140,68 152,76 158,88 C 144,90 130,84 118,78 Z"
      fill="#171216"
      stroke="url(#reinhall-gold-main)"
      strokeWidth="2"
    />

    {/* STAG HEAD & NECK SILHOUETTE (Głowa i smukła szyja) */}
    <path
      d="M 100,56 C 88,62 82,75 84,95 C 85,108 90,128 92,142 C 86,155 76,170 65,182 L 135,182 C 124,170 114,155 108,142 C 110,128 115,108 116,95 C 118,75 112,62 100,56 Z"
      fill="#120e14"
      stroke="url(#reinhall-gold-main)"
      strokeWidth="2.5"
    />

    {/* FACIAL CONTOURS & NOSE BRIDGE */}
    <path d="M 94,80 L 96,128 L 100,136 L 104,128 L 106,80" stroke="url(#reinhall-gold-main)" strokeWidth="1.5" opacity="0.7" />
    {/* Muzzle & Nostrils */}
    <path d="M 92,135 C 92,142 108,142 108,135 Z" fill="url(#reinhall-gold-main)" />
    <circle cx="96" cy="137" r="1.5" fill="#000000" />
    <circle cx="104" cy="137" r="1.5" fill="#000000" />

    {/* EXPRESSIVE GLOWING RUBY EYES */}
    <ellipse cx="88" cy="92" rx="4" ry="2.5" fill="url(#reinhall-ruby)" filter="url(#reinhall-glow-fx)" />
    <ellipse cx="112" cy="92" rx="4" ry="2.5" fill="url(#reinhall-ruby)" filter="url(#reinhall-glow-fx)" />
    <circle cx="88" cy="92" r="1" fill="#ffffff" />
    <circle cx="112" cy="92" r="1" fill="#ffffff" />

    {/* FOREHEAD RUNIC STAR */}
    <polygon
      points="100,68 103,75 110,77 104,81 106,88 100,84 94,88 96,81 90,77 97,75"
      fill="url(#reinhall-ruby)"
      filter="url(#reinhall-glow-fx)"
    />
  </svg>
);

// ============================================================================
// 🐻 BJÖRNHALL: FIERCE NORDIC CAVE BEAR (WYRAŹNY, POTĘŻNY NIEDŹWIEDŹ)
// ============================================================================
export const BjornhallCrest = ({ size = 120, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="bjornhall-fire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="35%" stopColor="#eab308" />
        <stop offset="70%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>

      <filter id="bjornhall-glow-fx" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Runic Shield / Ring */}
    <circle cx="100" cy="100" r="88" stroke="url(#bjornhall-fire-grad)" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.4" />
    <circle cx="100" cy="100" r="82" stroke="url(#bjornhall-fire-grad)" strokeWidth="0.75" strokeOpacity="0.25" />

    {/* ROUNDED BEAR EARS (Charakterystyczne okrągłe uszy niedźwiedzia) */}
    <circle cx="52" cy="52" r="18" fill="#171212" stroke="url(#bjornhall-fire-grad)" strokeWidth="3" />
    <circle cx="52" cy="52" r="10" fill="#0d0a0a" stroke="url(#bjornhall-fire-grad)" strokeWidth="1.5" />

    <circle cx="148" cy="52" r="18" fill="#171212" stroke="url(#bjornhall-fire-grad)" strokeWidth="3" />
    <circle cx="148" cy="52" r="10" fill="#0d0a0a" stroke="url(#bjornhall-fire-grad)" strokeWidth="1.5" />

    {/* MASSIVE BEAR HEAD & SHOULDER MANE (Masywna czaszka i kark niedźwiedzia) */}
    <path
      d="M 100,42 C 72,42 45,58 38,82 C 32,102 36,122 45,138 C 40,154 30,168 20,180 L 180,180 C 170,168 160,154 155,138 C 164,122 168,102 162,82 C 155,58 128,42 100,42 Z"
      fill="#141012"
      stroke="url(#bjornhall-fire-grad)"
      strokeWidth="3"
    />

    {/* BROAD BEAR SNOUT & MUZZLE (Szeroki pysk) */}
    <path
      d="M 76,105 C 76,92 124,92 124,105 C 124,128 116,142 100,142 C 84,142 76,128 76,105 Z"
      fill="#0a0809"
      stroke="url(#bjornhall-fire-grad)"
      strokeWidth="2"
    />

    {/* LARGE LEATHER NOSE (Wielki nos niedźwiedzia) */}
    <path
      d="M 88,108 C 88,102 112,102 112,108 C 112,118 100,122 100,122 C 100,122 88,118 88,108 Z"
      fill="url(#bjornhall-fire-grad)"
    />
    <circle cx="94" cy="112" r="2" fill="#000000" />
    <circle cx="106" cy="112" r="2" fill="#000000" />

    {/* ROARING FANGS & JAW (Kły i szczęka) */}
    <path d="M 85,130 Q 100,136 115,130" stroke="url(#bjornhall-fire-grad)" strokeWidth="2" fill="none" />
    {/* Upper Fangs */}
    <polygon points="90,131 93,139 96,131" fill="#fef08a" />
    <polygon points="104,131 107,139 110,131" fill="#fef08a" />

    {/* FIERCE GLOWING EYES & BROW (Groźne brwi i płomienne oczy) */}
    <path d="M 68,76 L 86,84" stroke="url(#bjornhall-fire-grad)" strokeWidth="3" strokeLinecap="round" />
    <path d="M 132,76 L 114,84" stroke="url(#bjornhall-fire-grad)" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="76" cy="88" rx="4.5" ry="3" fill="#fef08a" filter="url(#bjornhall-glow-fx)" />
    <ellipse cx="124" cy="88" rx="4.5" ry="3" fill="#fef08a" filter="url(#bjornhall-glow-fx)" />
    <circle cx="76" cy="88" r="1.5" fill="#7f1d1d" />
    <circle cx="124" cy="88" r="1.5" fill="#7f1d1d" />

    {/* BATTLE CHEEK SCARS (Blizny wojenne) */}
    <line x1="56" y1="98" x2="68" y2="110" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="52" y1="106" x2="62" y2="116" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================================================
// 🐦 RAVNHEIM: ASTRAL NORDIC RAVEN (WYRAŹNY KRUK Z ROZPIĘTYMI SKRZYDŁAMI)
// ============================================================================
export const RavnheimCrest = ({ size = 120, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="ravnheim-sapphire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" />
        <stop offset="35%" stopColor="#60a5fa" />
        <stop offset="75%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>

      <filter id="ravnheim-glow-fx" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Runic Shield / Ring */}
    <circle cx="100" cy="100" r="88" stroke="url(#ravnheim-sapphire-grad)" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.4" />
    <circle cx="100" cy="100" r="82" stroke="url(#ravnheim-sapphire-grad)" strokeWidth="0.75" strokeOpacity="0.25" />

    {/* WIDE SPREAD RAVEN WINGS (Rozpostarte, potężne skrzydła z piórami) */}
    {/* Left Wing */}
    <path
      d="M 100,90 C 80,50 50,30 15,35 C 25,50 35,68 25,85 C 40,88 52,105 45,120 C 60,122 75,130 85,145 Z"
      fill="#0c101d"
      stroke="url(#ravnheim-sapphire-grad)"
      strokeWidth="2.5"
    />
    {/* Wing Feather Ribs Left */}
    <path d="M 75,80 L 25,48 M 80,95 L 35,75 M 85,110 L 48,102" stroke="url(#ravnheim-sapphire-grad)" strokeWidth="1.5" opacity="0.7" />

    {/* Right Wing */}
    <path
      d="M 100,90 C 120,50 150,30 185,35 C 175,50 165,68 175,85 C 160,88 148,105 155,120 C 140,122 125,130 115,145 Z"
      fill="#0c101d"
      stroke="url(#ravnheim-sapphire-grad)"
      strokeWidth="2.5"
    />
    {/* Wing Feather Ribs Right */}
    <path d="M 125,80 L 175,48 M 120,95 L 165,75 M 115,110 L 152,102" stroke="url(#ravnheim-sapphire-grad)" strokeWidth="1.5" opacity="0.7" />

    {/* RAVEN BODY & FAN TAIL (Tułów i rozłożony ogon kruka) */}
    <path
      d="M 88,140 L 70,185 L 100,175 L 130,185 L 112,140 Z"
      fill="#0a0d18"
      stroke="url(#ravnheim-sapphire-grad)"
      strokeWidth="2"
    />

    {/* RAVEN HEAD & POWERFUL CURVED BEAK (Wyraźna głowa i zakrzywiony dziób) */}
    <path
      d="M 90,82 C 90,65 110,65 110,82 L 108,125 C 108,135 92,135 92,125 Z"
      fill="#111624"
      stroke="url(#ravnheim-sapphire-grad)"
      strokeWidth="2"
    />
    {/* Upper and Lower Beak */}
    <path
      d="M 94,68 C 96,46 100,32 100,22 C 100,32 104,46 106,68 Z"
      fill="url(#ravnheim-sapphire-grad)"
      stroke="url(#ravnheim-sapphire-grad)"
      strokeWidth="1.5"
    />

    {/* KEEN GLOWING SAPPHIRE EYE */}
    <circle cx="100" cy="74" r="4.5" fill="url(#ravnheim-sapphire-grad)" filter="url(#ravnheim-glow-fx)" />
    <circle cx="100" cy="74" r="1.5" fill="#ffffff" />

    {/* NECK RUFF FEATHERS (Pióra na gardzieli kruka) */}
    <polygon points="95,95 100,105 105,95" fill="url(#ravnheim-sapphire-grad)" />
    <polygon points="92,108 100,118 108,108" fill="url(#ravnheim-sapphire-grad)" />
  </svg>
);

// ============================================================================
// 🦦 OTERGARD: AGILE ARCTIC OTTER (WYRAŹNA, ZWINNA WYDRA Z WĄSAMI)
// ============================================================================
export const OtergardCrest = ({ size = 120, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="otergard-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="40%" stopColor="#34d399" />
        <stop offset="80%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>

      <filter id="otergard-glow-fx" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Runic Shield / Ring */}
    <circle cx="100" cy="100" r="88" stroke="url(#otergard-emerald-grad)" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.4" />
    <circle cx="100" cy="100" r="82" stroke="url(#otergard-emerald-grad)" strokeWidth="0.75" strokeOpacity="0.25" />

    {/* SWIRLING WATER & ICE STREAM (Lodowe fale fiordu) */}
    <path
      d="M 30,135 C 40,165 75,182 110,178 C 145,174 175,150 178,115"
      stroke="url(#otergard-emerald-grad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.6"
    />

    {/* SLEEK CURVED OTTER BODY & RUDDER TAIL (Zwinne ciało i ogon wydry) */}
    <path
      d="M 148,55 C 158,68 152,95 138,115 C 122,138 95,152 68,146 C 45,142 32,122 36,98 C 40,75 62,60 88,58 C 112,56 135,46 148,55 Z"
      fill="#0c1615"
      stroke="url(#otergard-emerald-grad)"
      strokeWidth="3"
    />

    {/* OTTER HEAD & CUTE SNOUT (Głowa z zaokrąglonym pyszczkiem i uszkami) */}
    {/* Small Rounded Ear */}
    <ellipse cx="152" cy="50" rx="6" ry="5" fill="#132422" stroke="url(#otergard-emerald-grad)" strokeWidth="2" />
    {/* Head Contour */}
    <path
      d="M 135,50 C 148,46 168,52 172,65 C 175,76 165,86 150,85 C 140,84 130,75 135,50 Z"
      fill="#10201e"
      stroke="url(#otergard-emerald-grad)"
      strokeWidth="2.5"
    />

    {/* NOSE & WHISKER PADS (Nos i poduszki wąsów) */}
    <path d="M 166,68 C 170,68 174,72 172,76 C 168,78 164,74 166,68 Z" fill="url(#otergard-emerald-grad)" />

    {/* DISTINCT OTTER WHISKERS (Wyraźne długie wąsy wydry) */}
    <line x1="168" y1="72" x2="190" y2="66" stroke="url(#otergard-emerald-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="168" y1="74" x2="192" y2="75" stroke="url(#otergard-emerald-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="168" y1="76" x2="188" y2="84" stroke="url(#otergard-emerald-grad)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="165" y1="78" x2="180" y2="92" stroke="url(#otergard-emerald-grad)" strokeWidth="1.2" strokeLinecap="round" />

    {/* ALERT GLOWING EMERALD EYE */}
    <circle cx="154" cy="62" r="3.5" fill="url(#otergard-emerald-grad)" filter="url(#otergard-glow-fx)" />
    <circle cx="154" cy="62" r="1.2" fill="#ffffff" />

    {/* FRONT WEBBED PAW (Przednia łapka) */}
    <path
      d="M 125,95 C 132,95 138,102 135,110 C 130,114 122,112 120,105 Z"
      fill="#132422"
      stroke="url(#otergard-emerald-grad)"
      strokeWidth="1.5"
    />
    <circle cx="132" cy="110" r="1" fill="url(#otergard-emerald-grad)" />
    <circle cx="127" cy="112" r="1" fill="url(#otergard-emerald-grad)" />
    <circle cx="122" cy="109" r="1" fill="url(#otergard-emerald-grad)" />
  </svg>
);

// ============================================================================
// UNIFIED ORDER CREST COMPONENT (DYNAMIC DISPATCHER WITH RUNIC ACCENTS)
// ============================================================================
export const normalizeHouseKey = (key) => {
  if (!key) return 'reinhall';
  const s = String(key).toLowerCase().trim();
  if (s === 'renifer' || s === 'reinhall' || s.includes('rein')) return 'reinhall';
  if (s === 'niedzwiedz' || s === 'niedźwiedź' || s === 'bjornhall' || s === 'björnhall' || s.includes('bjorn') || s.includes('björn')) return 'bjornhall';
  if (s === 'kruk' || s === 'ravnheim' || s.includes('ravn')) return 'ravnheim';
  if (s === 'wydra' || s === 'otergard' || s.includes('oter')) return 'otergard';
  return 'reinhall';
};

export const HOUSE_RUNIC_DATA = {
  reinhall: {
    rune: 'ᚦ',
    runeName: 'Thurisaz',
    animal: 'Renifer Północy',
    primaryColor: '#7a1818',
    secondaryColor: '#c59f4e',
    glowColor: 'rgba(197, 159, 78, 0.45)',
    element: 'Krew i Wieczna Zmarzlina'
  },
  bjornhall: {
    rune: 'ᛉ',
    runeName: 'Algiz',
    animal: 'Niedźwiedź Jaskiniowy',
    primaryColor: '#202530',
    secondaryColor: '#c02b2b',
    glowColor: 'rgba(192, 43, 43, 0.45)',
    element: 'Żelazo i Pęknięta Skala'
  },
  ravnheim: {
    rune: 'ᚱ',
    runeName: 'Raidho',
    animal: 'Kruk Mądrości',
    primaryColor: '#1c132e',
    secondaryColor: '#a77de0',
    glowColor: 'rgba(167, 125, 224, 0.45)',
    element: 'Cień i Astralna Noc'
  },
  otergard: {
    rune: 'ᛞ',
    runeName: 'Dagaz',
    animal: 'Wydra Polarna',
    primaryColor: '#0d2d33',
    secondaryColor: '#2ec4b6',
    glowColor: 'rgba(46, 196, 182, 0.45)',
    element: 'Lodowcowe Wody i Toksyny'
  }
};

export const OrderCrest = ({
  houseKey,
  size = 48,
  showRuneBadge = false,
  showFrame = false,
  className = '',
  style = {}
}) => {
  const normKey = normalizeHouseKey(houseKey);
  const data = HOUSE_RUNIC_DATA[normKey] || HOUSE_RUNIC_DATA.reinhall;

  let CrestSvg = ReinhallCrest;
  if (normKey === 'bjornhall') CrestSvg = BjornhallCrest;
  else if (normKey === 'ravnheim') CrestSvg = RavnheimCrest;
  else if (normKey === 'otergard') CrestSvg = OtergardCrest;

  const inner = (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
      className={className}
    >
      <CrestSvg size={size} />
      {showRuneBadge && (
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            background: 'rgba(10, 14, 22, 0.92)',
            border: `1px solid ${data.secondaryColor}`,
            color: data.secondaryColor,
            fontFamily: 'serif',
            fontSize: `${Math.max(10, Math.round(size * 0.26))}px`,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '4px',
            boxShadow: `0 0 8px ${data.glowColor}`
          }}
        >
          {data.rune}
        </span>
      )}
    </div>
  );

  if (!showFrame) return inner;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.4rem',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${data.primaryColor} 0%, rgba(10, 14, 22, 0.95) 80%)`,
        border: `1.5px solid ${data.secondaryColor}`,
        boxShadow: `0 0 15px ${data.glowColor}`,
        ...style
      }}
      className={className}
    >
      {inner}
    </div>
  );
};
