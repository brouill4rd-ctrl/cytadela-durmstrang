import React from 'react';

const FILTERS = [
  { id: 'all',      label: 'Wszystko',   rune: 'ᚨ' },
  { id: 'location', label: 'Lokacje',    rune: 'ᛚ' },
  { id: 'quest',    label: 'Questy',     rune: 'ᚲ' },
  { id: 'activity', label: 'Aktywności', rune: 'ᛊ' },
  { id: 'event',    label: 'Wydarzenia', rune: 'ᛏ' },
  { id: 'secret',   label: 'Sekrety',    rune: 'ᛟ' },
  { id: 'entrance', label: 'Wejścia',    rune: 'ᚱ' },
];

export function MapFilters({ activeFilter, onChange, discoveredCount, totalDiscoverable }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4rem 0.8rem',
      background: 'rgba(7,10,16,0.9)',
      borderBottom: '1px solid rgba(197,159,78,0.12)',
      overflowX: 'auto',
      flexShrink: 0,
      scrollbarWidth: 'none',
    }}>
      {/* Filtry */}
      {FILTERS.map(f => {
        const active = activeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.65rem',
              background: active ? 'rgba(197,159,78,0.18)' : 'transparent',
              border: `1px solid ${active ? 'rgba(197,159,78,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '4px', cursor: 'pointer',
              color: active ? '#f3d995' : '#6b7280',
              fontSize: '0.76rem', fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em', whiteSpace: 'nowrap',
              transition: 'all 0.12s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; } }}
          >
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{f.rune}</span>
            {f.label}
          </button>
        );
      })}

      {/* Odkrycia */}
      <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{
          height: '4px', width: '60px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${totalDiscoverable > 0 ? (discoveredCount / totalDiscoverable) * 100 : 0}%`,
            background: 'linear-gradient(90deg, rgba(197,159,78,0.8), rgba(243,217,149,0.9))',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: '#4b5563', whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
          {discoveredCount}/{totalDiscoverable}
        </span>
      </div>
    </div>
  );
}
