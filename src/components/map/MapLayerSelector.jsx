import React from 'react';

const LAYER_ICONS = {
  world:    '🌍',
  fortress: '🏰',
};

export function MapLayerSelector({ layers, activeLayerId, onChange }) {
  if (!layers || layers.length <= 1) return null;

  return (
    <div style={{
      display: 'flex', gap: '0', padding: '0.35rem 0.8rem',
      background: 'rgba(3,5,8,0.95)',
      borderBottom: '1px solid rgba(197,159,78,0.18)',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: '0.65rem', color: '#4b5563', letterSpacing: '0.15em',
        textTransform: 'uppercase', fontFamily: 'var(--font-heading)',
        marginRight: '0.8rem', flexShrink: 0,
      }}>
        Mapa
      </span>
      <div style={{
        display: 'flex', gap: '3px',
        background: 'rgba(15,20,30,0.8)',
        border: '1px solid rgba(197,159,78,0.2)',
        borderRadius: '5px', padding: '3px',
      }}>
        {layers.map(layer => {
          const active = activeLayerId === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onChange(layer.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.28rem 0.7rem',
                background: active ? 'rgba(197,159,78,0.2)' : 'transparent',
                border: active ? '1px solid rgba(197,159,78,0.4)' : '1px solid transparent',
                borderRadius: '3px', cursor: 'pointer',
                color: active ? '#f3d995' : '#6b7280',
                fontSize: '0.78rem', fontFamily: 'var(--font-heading)',
                letterSpacing: '0.05em', transition: 'all 0.12s',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{LAYER_ICONS[layer.slug] || '🗺️'}</span>
              {layer.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
