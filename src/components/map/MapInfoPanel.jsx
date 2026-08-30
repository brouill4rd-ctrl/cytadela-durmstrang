import React, { useState, useEffect } from 'react';
import { X, Lock, Clock, Star, Zap, Coins, Package, MapPin, ChevronRight, Bookmark, BookmarkCheck, Scroll, CheckCircle, PlayCircle } from 'lucide-react';
import api from '../../api';

const ACTIVITY_LABELS = {
  expedition:    { name: 'Wyprawa',         color: '#c59f4e' },
  fishing:       { name: 'Połów',           color: '#8ecae6' },
  oracle:        { name: 'Wyrocznia',       color: '#a78bfa' },
  shooting_range:{ name: 'Strzelnica',      color: '#f87171' },
  dungeon_escape:{ name: 'Labirynt',        color: '#fb923c' },
  hnefatafl:     { name: 'Hnefatafl',       color: '#34d399' },
  runic_duel:    { name: 'Pojedynek Runiczny', color: '#60a5fa' },
  bestiary:      { name: 'Bestiariusz',     color: '#a3e635' },
  wand_fencing:  { name: 'Szermierka',      color: '#f472b6' },
  none:          { name: 'Lokacja',         color: '#9ca3af' },
};

const STATE_MSGS = {
  locked:      'Ta lokacja jest zablokowana. Spełnij wymagania, aby ją odblokować.',
  time_locked: 'Ta lokacja jest tymczasowo niedostępna.',
  completed:   'Aktywność ukończona.',
};

function RewardRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
      <span style={{ color: color || 'var(--gold-ancient)', fontSize: '0.9rem' }}>{icon}</span>
      <span style={{ color: '#9ca3af', fontSize: '0.82rem', flexGrow: 1 }}>{label}</span>
      <span style={{ color: color || '#f3d995', fontSize: '0.88rem', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const QUEST_STATUS_BADGE = {
  available:  { label: 'Dostępny',   color: '#22c55e',  bg: 'rgba(34,197,94,0.1)'  },
  active:     { label: 'W trakcie',  color: '#f59e0b',  bg: 'rgba(245,158,11,0.1)' },
  completed:  { label: 'Ukończony',  color: '#6b7280',  bg: 'rgba(107,114,128,0.1)'},
  locked:     { label: 'Zablokowany',color: '#4b5563',  bg: 'rgba(75,85,99,0.07)'  },
};

export function MapInfoPanel({ marker, onClose, onTrack, onStartActivity, onOpenQuest, trackedLocationId, isMobile }) {
  const [activeTab, setActiveTab] = useState('info');
  const [locationQuests, setLocationQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(false);

  useEffect(() => {
    setActiveTab('info');
    if (!marker?.id) { setLocationQuests([]); return; }
    setQuestsLoading(true);
    api.getLocationQuests(marker.id)
      .then(res => {
        const data = res?.data ?? res;
        const quests = Array.isArray(data) ? data : (data?.quests ?? []);
        setLocationQuests(quests);
        // Auto-przełącz na zakładkę Questy jeśli są dostępne lub aktywne questy
        if (quests.some(q => q.status === 'available' || q.status === 'active')) {
          setActiveTab('questy');
        }
      })
      .catch(() => setLocationQuests([]))
      .finally(() => setQuestsLoading(false));
  }, [marker?.id]);

  if (!marker) return null;

  const activityInfo = ACTIVITY_LABELS[marker.linkedActivityType] || ACTIVITY_LABELS.none;
  const isTracked = trackedLocationId === marker.id;
  const isLocked = marker.userState === 'locked' || marker.userState === 'time_locked';
  const hasActivity = marker.linkedActivityType && marker.linkedActivityType !== 'none' && marker.linkedActivityType !== '';
  const activeOrAvailableQuests = locationQuests.filter(q => q.status !== 'locked' && q.status !== 'completed');
  const hasQuests = locationQuests.length > 0;

  const panelStyle = isMobile ? {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    height: '65vh',
    borderRadius: '16px 16px 0 0',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  } : {
    position: 'absolute',
    top: '12px', right: '12px',
    width: '320px',
    maxHeight: 'calc(100% - 24px)',
    borderRadius: '8px',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={{
      ...panelStyle,
      background: 'rgba(7,10,16,0.97)',
      border: '1px solid rgba(197,159,78,0.3)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1rem 0.75rem',
        borderBottom: '1px solid rgba(197,159,78,0.15)',
        flexShrink: 0,
      }}>
        {/* Typ markera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{
            fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: activityInfo.color, fontFamily: 'var(--font-heading)',
          }}>
            {activityInfo.name}
            {marker.markerType === 'entrance' && ' — Wejście'}
            {marker.markerType === 'secret' && ' — Sekret'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nazwa */}
        <h2 style={{
          fontSize: '1.1rem', color: '#ffffff', margin: '0 0 0.2rem',
          fontFamily: 'var(--font-heading)', lineHeight: 1.2,
        }}>
          {marker.name}
        </h2>
        {marker.nordicName && (
          <p style={{ fontSize: '0.75rem', color: '#5a6a7a', fontStyle: 'italic', margin: 0 }}>
            {marker.nordicName}
          </p>
        )}

        {/* State badge */}
        {isLocked && (
          <div style={{
            marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: '#f87171', fontSize: '0.78rem',
          }}>
            <Lock size={12} />
            <span>{STATE_MSGS[marker.userState]}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      {!isLocked && (
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {['info', (hasQuests || questsLoading) && 'questy'].filter(Boolean).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '0.5rem', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.76rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontFamily: 'var(--font-heading)',
                color: activeTab === tab ? '#f3d995' : '#4b5563',
                borderBottom: activeTab === tab ? '2px solid var(--gold-ancient)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab === 'info' ? 'Informacje' : questsLoading ? 'Questy…' : `Questy (${locationQuests.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {activeTab === 'info' && (
          <>
            {/* Opis */}
            {(marker.descriptionShort || marker.shortDesc) && (
              <p style={{
                fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.6,
                margin: '0 0 1rem', fontFamily: 'var(--font-lore)',
                fontStyle: 'italic',
              }}>
                „{marker.descriptionShort || marker.shortDesc}"
              </p>
            )}

            {/* Lore */}
            {marker.fullLore && (
              <p style={{
                fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6,
                margin: '0 0 1rem',
              }}>
                {marker.fullLore.slice(0, 200)}{marker.fullLore.length > 200 ? '…' : ''}
              </p>
            )}

            {/* Nagrody za odkrycie */}
            {(marker.discoveryRewardXp > 0 || marker.discoveryRewardSkirniry > 0) && (
              <div style={{
                background: 'rgba(197,159,78,0.07)', border: '1px solid rgba(197,159,78,0.2)',
                borderRadius: '6px', padding: '0.7rem', marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Nagroda za odkrycie
                </div>
                {marker.discoveryRewardXp > 0 && <RewardRow icon={<Zap size={14}/>} label="Doświadczenie" value={`+${marker.discoveryRewardXp} XP`} color="#a78bfa" />}
                {marker.discoveryRewardSkirniry > 0 && <RewardRow icon={<Coins size={14}/>} label="Skirniry" value={`+${marker.discoveryRewardSkirniry} SKR`} color="#f3d995" />}
              </div>
            )}

            {/* NPCs */}
            {marker.npcs?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Postacie
                </div>
                {marker.npcs.map((npc, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#9ca3af', padding: '0.2rem 0' }}>
                    · {npc}
                  </div>
                ))}
              </div>
            )}

            {/* Akcje */}
            {marker.actions?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Działania
                </div>
                {marker.actions.map((action, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#9ca3af', padding: '0.2rem 0', display: 'flex', gap: '0.4rem' }}>
                    <ChevronRight size={12} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--gold-dim)' }} />
                    {action}
                  </div>
                ))}
              </div>
            )}

            {/* Status odkrycia */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <MapPin size={12} color={marker.isDiscovered ? '#22c55e' : '#6b7280'} />
              <span style={{ fontSize: '0.75rem', color: marker.isDiscovered ? '#4ade80' : '#6b7280' }}>
                {marker.isDiscovered ? 'Odkryta' : 'Nieodkryta'}
              </span>
            </div>
          </>
        )}

        {activeTab === 'questy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {questsLoading && (
              <div style={{ fontSize: '0.8rem', color: '#4b5563', textAlign: 'center', padding: '1rem' }}>Ładowanie…</div>
            )}
            {!questsLoading && locationQuests.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#4b5563', textAlign: 'center', padding: '1rem' }}>
                Brak questów w tej lokacji.
              </div>
            )}
            {locationQuests.map((quest) => {
              const badge = QUEST_STATUS_BADGE[quest.status] || QUEST_STATUS_BADGE.locked;
              const canInteract = quest.status === 'available' || quest.status === 'active';
              return (
                <div key={quest.id} style={{
                  background: badge.bg,
                  border: `1px solid ${badge.color}33`,
                  borderRadius: '6px', padding: '0.75rem',
                  opacity: quest.status === 'locked' ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <div style={{ fontSize: '0.82rem', color: '#f3d995', fontFamily: 'var(--font-heading)', lineHeight: 1.3, flexGrow: 1, paddingRight: '0.5rem' }}>
                      {quest.title}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: badge.color, background: `${badge.color}22`, borderRadius: '4px', padding: '2px 6px', flexShrink: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
                      {badge.label}
                    </span>
                  </div>
                  {quest.category && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.3rem' }}>{quest.category}</div>
                  )}
                  {quest.status === 'active' && quest.currentStageObjective && (
                    <div style={{ fontSize: '0.76rem', color: '#f59e0b', marginBottom: '0.35rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <ChevronRight size={10} /> {quest.currentStageObjective}
                    </div>
                  )}
                  {quest.description && quest.status !== 'active' && (
                    <div style={{ fontSize: '0.76rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                      {quest.description.slice(0, 100)}{quest.description.length > 100 ? '…' : ''}
                    </div>
                  )}
                  {quest.rewards && (
                    <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: '#6b7280', marginBottom: canInteract ? '0.5rem' : 0 }}>
                      {quest.rewards.points > 0 && <span>⚡ {quest.rewards.points} pkt</span>}
                      {quest.rewards.xp > 0 && <span>✨ {quest.rewards.xp} XP</span>}
                      {quest.rewards.skirniry > 0 && <span>🪙 {quest.rewards.skirniry} SKR</span>}
                    </div>
                  )}
                  {canInteract && (
                    <button
                      onClick={() => onOpenQuest?.(quest.id, quest.status === 'available')}
                      style={{
                        width: '100%', padding: '0.45rem',
                        background: quest.status === 'active' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)',
                        border: `1px solid ${quest.status === 'active' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius: '4px', cursor: 'pointer',
                        color: quest.status === 'active' ? '#f59e0b' : '#4ade80',
                        fontSize: '0.75rem', fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.07em', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.4rem',
                      }}
                    >
                      {quest.status === 'active'
                        ? <><PlayCircle size={12} /> KONTYNUUJ QUEST</>
                        : <><Scroll size={12} /> ROZPOCZNIJ QUEST</>
                      }
                    </button>
                  )}
                  {quest.status === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#4b5563' }}>
                      <CheckCircle size={11} /> Ukończony
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer akcje */}
      {!isLocked && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(197,159,78,0.12)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          flexShrink: 0,
        }}>
          {/* Śledź quest */}
          <button
            onClick={() => onTrack?.(isTracked ? null : marker.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: isTracked ? 'rgba(197,159,78,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isTracked ? 'rgba(197,159,78,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '5px', padding: '0.5rem 0.8rem', cursor: 'pointer',
              color: isTracked ? '#f3d995' : '#9ca3af', fontSize: '0.8rem',
              fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
              transition: 'all 0.15s',
            }}
          >
            {isTracked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {isTracked ? 'Śledzone — kliknij aby odśledź' : 'Śledź lokację'}
          </button>

          {/* Rozpocznij aktywność */}
          {hasActivity && (
            <button
              onClick={() => onStartActivity?.(marker)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, rgba(197,159,78,0.9) 0%, rgba(140,109,59,0.9) 100%)',
                border: 'none', borderRadius: '5px', padding: '0.65rem 1rem',
                cursor: 'pointer', color: '#000', fontSize: '0.85rem', fontWeight: 700,
                fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
                boxShadow: '0 4px 16px rgba(197,159,78,0.3)',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <Zap size={15} />
              ROZPOCZNIJ — {activityInfo.name.toUpperCase()}
            </button>
          )}

          {/* Wejście do innej mapy */}
          {marker.markerType === 'entrance' && (
            <button
              onClick={() => onStartActivity?.(marker)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, rgba(142,202,230,0.2) 0%, rgba(90,130,170,0.2) 100%)',
                border: '1px solid rgba(142,202,230,0.4)', borderRadius: '5px',
                padding: '0.65rem 1rem', cursor: 'pointer',
                color: '#8ecae6', fontSize: '0.85rem', fontWeight: 700,
                fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <ChevronRight size={15} />
              WEJDŹ DO {marker.name.toUpperCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
