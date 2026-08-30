import React, { useState, useEffect } from 'react';
import { X, MapPin, Scroll, ChevronRight } from 'lucide-react';
import api from '../../api';

export function MapQuestTracker({ trackedMarker, trackedQuestId, onUntrack, onFocus, onOpenQuest }) {
  const [questState, setQuestState] = useState(null);

  useEffect(() => {
    if (!trackedQuestId) { setQuestState(null); return; }
    api.getQuestState(trackedQuestId)
      .then(res => setQuestState(res?.data ?? res))
      .catch(() => setQuestState(null));
  }, [trackedQuestId]);

  if (!trackedMarker) return null;

  const hasActiveQuest = trackedQuestId && questState?.status === 'active';

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px', left: '12px',
        zIndex: 30,
        background: 'rgba(7,10,16,0.94)',
        border: `1px solid ${hasActiveQuest ? 'rgba(245,158,11,0.4)' : 'rgba(197,159,78,0.35)'}`,
        borderRadius: '7px',
        padding: '0.6rem 0.8rem',
        maxWidth: '220px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
        cursor: 'pointer',
      }}
      onClick={() => onFocus?.(trackedMarker)}
      title="Kliknij aby wycentrować"
    >
      <div style={{
        fontSize: '0.6rem', color: hasActiveQuest ? '#f59e0b' : '#c59f4e',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: 'var(--font-heading)',
        marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>{hasActiveQuest ? 'Quest aktywny' : 'Śledzone'}</span>
        <button
          onClick={e => { e.stopPropagation(); onUntrack?.(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }}
          aria-label="Odśledź"
        >
          <X size={11} />
        </button>
      </div>

      {/* Nazwa questa lub lokacji */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
        {hasActiveQuest
          ? <Scroll size={11} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          : <MapPin size={12} color="#c59f4e" style={{ flexShrink: 0, marginTop: '2px' }} />
        }
        <span style={{
          fontSize: '0.82rem', color: hasActiveQuest ? '#fbbf24' : '#f3d995',
          fontFamily: 'var(--font-heading)', lineHeight: 1.3,
        }}>
          {hasActiveQuest ? (questState?.title || 'Quest') : trackedMarker.name}
        </span>
      </div>

      {/* Cel questowy */}
      {hasActiveQuest && questState?.stage?.objective && (
        <div style={{
          marginTop: '0.3rem', fontSize: '0.72rem', color: '#9ca3af',
          lineHeight: 1.4, display: 'flex', gap: '0.3rem', alignItems: 'flex-start',
        }}>
          <ChevronRight size={10} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
          <span>{questState.stage.objective.slice(0, 70)}{questState.stage.objective.length > 70 ? '…' : ''}</span>
        </div>
      )}

      {/* Opis lokacji gdy brak questa */}
      {!hasActiveQuest && trackedMarker.descriptionShort && (
        <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0.3rem 0 0', lineHeight: 1.4 }}>
          {trackedMarker.descriptionShort.slice(0, 60)}
          {trackedMarker.descriptionShort.length > 60 ? '…' : ''}
        </p>
      )}

      {/* Przycisk kontynuacji */}
      {hasActiveQuest && (
        <button
          onClick={e => { e.stopPropagation(); onOpenQuest?.(trackedQuestId); }}
          style={{
            marginTop: '0.45rem', width: '100%', padding: '0.35rem',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '4px', cursor: 'pointer',
            color: '#f59e0b', fontSize: '0.7rem',
            fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
          }}
        >
          Kontynuuj →
        </button>
      )}
    </div>
  );
}
