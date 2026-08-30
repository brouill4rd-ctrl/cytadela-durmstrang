import React, { memo } from 'react';

// SVG ikony dla każdego typu markera
const MARKER_ICONS = {
  location: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.9"/>
      <circle cx="12" cy="9" r="2.5" fill="var(--bg-deep)"/>
    </svg>
  ),
  quest: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <path d="M12 2L3 7l9 5 9-5-9-5z" fill="currentColor"/>
      <path d="M3 12l9 5 9-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>
    </svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="currentColor"/>
    </svg>
  ),
  secret: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" fill="currentColor" opacity="0.3"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <path d="M12 2v2M12 20v2M2 12H0M24 12h-2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  npc: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <circle cx="12" cy="8" r="4" fill="currentColor"/>
      <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  entrance: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 12h8M13 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  poi: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2"/>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{display:'block'}}>
      <path d="M3 9l1-5h16l1 5" fill="currentColor" opacity="0.3"/>
      <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" fill="currentColor"/>
      <path d="M9 9v2a3 3 0 006 0V9" stroke="var(--bg-deep)" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
};

const STATE_COLORS = {
  available:    { bg: 'rgba(197,159,78,0.25)', border: '#c59f4e', icon: '#f3d995', glow: 'rgba(197,159,78,0.4)' },
  discovered:   { bg: 'rgba(142,202,230,0.2)',  border: '#8ecae6', icon: '#d0eaf8', glow: 'rgba(142,202,230,0.3)' },
  locked:       { bg: 'rgba(60,60,80,0.3)',      border: '#4a4a6a', icon: '#6a6a8a', glow: 'none' },
  time_locked:  { bg: 'rgba(100,60,60,0.3)',     border: '#7a4040', icon: '#9a6060', glow: 'none' },
  undiscovered: { bg: 'rgba(20,20,30,0.6)',      border: '#2a2a3a', icon: '#3a3a4a', glow: 'none' },
  completed:    { bg: 'rgba(34,197,94,0.15)',    border: '#22c55e', icon: '#4ade80', glow: 'rgba(34,197,94,0.25)' },
};

const TYPE_SIZES = {
  entrance: 44,
  quest:    36,
  activity: 32,
  event:    34,
  secret:   28,
  location: 30,
  npc:      28,
  poi:      26,
  shop:     28,
};

export const MapMarker = memo(function MapMarker({ marker, isSelected, onClick }) {
  const { userState = 'available', markerType = 'location', name, isTracked } = marker;
  const colors = STATE_COLORS[userState] || STATE_COLORS.available;
  const size = TYPE_SIZES[markerType] || 30;
  const icon = MARKER_ICONS[markerType] || MARKER_ICONS.location;

  const isInteractable = userState !== 'undiscovered' && userState !== 'locked';

  const style = {
    position: 'absolute',
    left: `${marker.x}%`,
    top: `${marker.y}%`,
    width: `${size}px`,
    height: `${size}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: isSelected ? 20 : markerType === 'entrance' ? 15 : 10,
    cursor: isInteractable ? 'pointer' : 'not-allowed',
    transition: 'transform 0.15s ease, filter 0.15s ease',
    filter: isSelected ? 'brightness(1.4)' : 'brightness(1)',
    pointerEvents: 'auto',
  };

  const innerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: markerType === 'entrance' ? '6px' : '50%',
    background: isSelected
      ? colors.bg.replace('0.', '0.5').replace(/0\.\d+/, m => String(Math.min(0.8, parseFloat(m) * 2)))
      : colors.bg,
    border: `${isSelected ? 2 : 1.5}px solid ${colors.border}`,
    boxShadow: colors.glow !== 'none'
      ? `0 0 ${isSelected ? 14 : 8}px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
      : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.icon,
    transition: 'all 0.15s ease',
    overflow: 'hidden',
  };

  const iconSize = `${Math.round(size * 0.52)}px`;

  if (userState === 'undiscovered') {
    return (
      <div style={style}>
        <div style={{ ...innerStyle, opacity: 0.4 }}>
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} style={{ display: 'block' }}>
            <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.3"/>
            <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.5">?</text>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      onClick={isInteractable ? onClick : undefined}
      title={isInteractable ? name : 'Zablokowane'}
      role={isInteractable ? 'button' : undefined}
      aria-label={isInteractable ? name : `${name} — zablokowane`}
      tabIndex={isInteractable ? 0 : -1}
      onKeyDown={isInteractable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div style={innerStyle}>
        <div style={{ width: iconSize, height: iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>

      {/* Tracked quest indicator */}
      {isTracked && (
        <div style={{
          position: 'absolute', top: '-4px', right: '-4px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: '#f3d995', border: '1px solid #c59f4e',
          boxShadow: '0 0 6px rgba(243,217,149,0.8)',
        }} />
      )}

      {/* Selected pulse */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: '-6px', borderRadius: 'inherit',
          border: `1px solid ${colors.border}`,
          opacity: 0.5, animation: 'mapPulse 1.5s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Label — tylko gdy selected */}
      {isSelected && userState !== 'undiscovered' && (
        <div style={{
          position: 'absolute',
          top: `calc(100% + 5px)`,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(7,10,16,0.92)',
          border: `1px solid ${colors.border}`,
          borderRadius: '3px',
          padding: '2px 6px',
          fontSize: '11px',
          color: colors.icon,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.04em',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
      )}
    </div>
  );
});
