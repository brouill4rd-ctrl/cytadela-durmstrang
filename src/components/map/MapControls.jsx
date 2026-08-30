import React from 'react';
import { Plus, Minus, RotateCcw, Layers } from 'lucide-react';

const BtnStyle = {
  width: '32px', height: '32px',
  background: 'rgba(7,10,16,0.92)',
  border: '1px solid rgba(197,159,78,0.25)',
  borderRadius: '5px', cursor: 'pointer',
  color: '#c59f4e', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s, border-color 0.15s',
  flexShrink: 0,
};

function CtrlBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={BtnStyle}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(197,159,78,0.15)'; e.currentTarget.style.borderColor = 'rgba(197,159,78,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = BtnStyle.background; e.currentTarget.style.borderColor = 'rgba(197,159,78,0.25)'; }}
    >
      {children}
    </button>
  );
}

export function MapControls({ onZoomIn, onZoomOut, onReset, currentFloor, floors, onFloorChange }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '14px', right: '14px',
      display: 'flex', flexDirection: 'column', gap: '5px',
      zIndex: 30,
    }}>
      {/* Selektory pięter (tylko dla mapy twierdzy) */}
      {floors && floors.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '3px',
          background: 'rgba(7,10,16,0.92)',
          border: '1px solid rgba(197,159,78,0.25)',
          borderRadius: '5px', padding: '4px',
          marginBottom: '4px',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', padding: '2px 0', fontFamily: 'var(--font-heading)' }}>
            Piętro
          </div>
          {floors.map(f => (
            <button
              key={f.level}
              onClick={() => onFloorChange?.(f.level)}
              title={f.name}
              style={{
                ...BtnStyle,
                width: '100%',
                background: currentFloor === f.level ? 'rgba(197,159,78,0.2)' : 'transparent',
                border: currentFloor === f.level ? '1px solid rgba(197,159,78,0.4)' : '1px solid transparent',
                color: currentFloor === f.level ? '#f3d995' : '#6b7280',
                fontSize: '0.7rem', fontFamily: 'var(--font-heading)',
                padding: '0 6px',
              }}
            >
              {f.shortLabel}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <CtrlBtn onClick={onZoomIn} title="Przybliż (+)"><Plus size={14} /></CtrlBtn>
      <CtrlBtn onClick={onZoomOut} title="Oddal (-)"><Minus size={14} /></CtrlBtn>
      <CtrlBtn onClick={onReset} title="Resetuj widok"><RotateCcw size={12} /></CtrlBtn>
    </div>
  );
}
