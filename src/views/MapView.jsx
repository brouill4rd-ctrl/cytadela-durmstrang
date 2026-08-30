import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import api from '../api';

import { MapViewport } from '../components/map/MapViewport';
import { MapMarker } from '../components/map/MapMarker';
import { MapInfoPanel } from '../components/map/MapInfoPanel';
import { MapFilters } from '../components/map/MapFilters';
import { MapControls } from '../components/map/MapControls';
import { MapLayerSelector } from '../components/map/MapLayerSelector';
import { MapQuestTracker } from '../components/map/MapQuestTracker';
import { QuestModal } from '../components/map/QuestModal';

import { ExpeditionsModal } from '../components/ExpeditionsModal';
import { IceFishingModal } from '../components/IceFishingModal';
import { OracleModal } from '../components/OracleModal';
import { TargetPracticeModal } from '../components/TargetPracticeModal';
import { DungeonEscapeModal } from '../components/DungeonEscapeModal';
import { HnefataflModal } from '../components/HnefataflModal';
import { RunicDuelModal } from '../components/RunicDuelModal';
import { BestiaryModal } from '../components/BestiaryModal';

const FORTRESS_FLOORS = [
  { level: 2,  name: 'Wieże (2)',       shortLabel: 'W2' },
  { level: 1,  name: 'Piętro (1)',      shortLabel: 'P1' },
  { level: 0,  name: 'Parter (0)',      shortLabel: 'P0' },
  { level: -1, name: 'Lochy (-1)',      shortLabel: 'L-1' },
];

const ACTIVITY_MODAL_MAP = {
  expedition:     ExpeditionsModal,
  fishing:        IceFishingModal,
  oracle:         OracleModal,
  shooting_range: TargetPracticeModal,
  dungeon_escape: DungeonEscapeModal,
  hnefatafl:      HnefataflModal,
  runic_duel:     RunicDuelModal,
  bestiary:       BestiaryModal,
};

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export const MapView = () => {
  const { currentUser, addNotification, backendAvailable } = useSchool();
  const { playWandSwoosh, playRuneChime } = useSound();
  const isMobile = useIsMobile();
  const viewportRef = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState('world');
  const [mapState, setMapState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentFloor, setCurrentFloor] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // { type, marker }
  const [activeQuest, setActiveQuest] = useState(null); // { questId, autoStart }

  // ── Load layers ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!backendAvailable) return;
    api.getMapLayers().then(res => {
      const list = res?.data ?? res;
      if (Array.isArray(list)) {
        setLayers(list);
        const worldLayer = list.find(l => l.slug === 'world');
        setActiveLayerId(worldLayer ? worldLayer.id : list[0]?.id || 'world');
      }
    }).catch(() => {});
  }, [backendAvailable]);

  // ── Load map state ─────────────────────────────────────────────────────────
  const loadMapState = useCallback(async (layerId) => {
    if (!backendAvailable || !layerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMapState(layerId);
      const payload = res?.data ?? res;
      if (payload?.markers) {
        setMapState(payload);
      } else {
        setError('Nie udało się załadować mapy. Sprawdź połączenie z serwerem.');
      }
      setSelectedMarkerId(null);
    } catch (e) {
      setError('Nie udało się załadować mapy. Sprawdź połączenie z serwerem.');
    } finally {
      setLoading(false);
    }
  }, [backendAvailable]);

  useEffect(() => {
    loadMapState(activeLayerId);
  }, [activeLayerId, loadMapState]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeLayer = useMemo(
    () => layers.find(l => l.id === activeLayerId),
    [layers, activeLayerId]
  );

  const markers = useMemo(() => {
    if (!mapState?.markers) return [];
    let list = mapState.markers;

    // Filtr po piętrze (tylko dla mapy twierdzy)
    if (activeLayerId === 'fortress') {
      list = list.filter(m => (m.floor ?? 0) === currentFloor);
    }

    // Filtr po typie
    if (activeFilter !== 'all') {
      list = list.filter(m => m.markerType === activeFilter);
    }

    return list;
  }, [mapState?.markers, activeFilter, currentFloor, activeLayerId]);

  const selectedMarker = useMemo(
    () => markers.find(m => m.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId]
  );

  const trackedMarker = useMemo(
    () => mapState?.markers?.find(m => m.id === mapState?.trackedLocationId) ?? null,
    [mapState]
  );

  const trackedQuestId = mapState?.trackedQuestId ?? null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLayerChange = useCallback((layerId) => {
    playWandSwoosh?.();
    setActiveLayerId(layerId);
    setSelectedMarkerId(null);
    setActiveFilter('all');
  }, [playWandSwoosh]);

  const handleMarkerClick = useCallback((marker) => {
    playRuneChime?.();
    setSelectedMarkerId(prev => prev === marker.id ? null : marker.id);

    // Automatyczne odkrycie gdy marker jest available
    if (marker.userState === 'available' && !marker.isDiscovered && backendAvailable) {
      api.discoverLocation(marker.id).then(res => {
        const result = res?.data ?? res;
        if (result?.discovered) {
          playRuneChime?.();
          addNotification(
            `✨ Odkryto lokację: ${result.locationName}${result.rewards?.xp ? ` · +${result.rewards.xp} XP` : ''}${result.rewards?.skirniry ? ` · +${result.rewards.skirniry} SKR` : ''}`,
            'success'
          );
          loadMapState(activeLayerId);
        }
      }).catch(() => {});
    }
  }, [playRuneChime, addNotification, backendAvailable, activeLayerId, loadMapState]);

  const handleTrack = useCallback((locationId) => {
    if (!backendAvailable) return;
    const fn = locationId ? api.trackLocation(locationId) : api.untrackLocation();
    fn.then(() => {
      setMapState(prev => prev ? { ...prev, trackedLocationId: locationId || null, trackedQuestId: locationId ? prev.trackedQuestId : null } : prev);
    }).catch(() => {});
  }, [backendAvailable]);

  const handleOpenQuest = useCallback((questId, autoStart = false) => {
    setActiveQuest({ questId, autoStart });
  }, []);

  const handleQuestComplete = useCallback(({ questId, rewards, title }) => {
    loadMapState(activeLayerId);
    addNotification(
      `✨ Quest ukończony: ${title}${rewards?.points ? ` · +${rewards.points} pkt` : ''}${rewards?.xp ? ` · +${rewards.xp} XP` : ''}${rewards?.skirniry ? ` · +${rewards.skirniry} SKR` : ''}`,
      'success'
    );
  }, [activeLayerId, loadMapState, addNotification]);

  const handleStartActivity = useCallback((marker) => {
    // Wejście do innej mapy
    if (marker.markerType === 'entrance') {
      const targetSlug = marker.linkedActivityId || marker.id.replace('wl-', '');
      const targetLayer = layers.find(l => l.slug === targetSlug || l.id === targetSlug);
      if (targetLayer) {
        playWandSwoosh?.();
        setActiveLayerId(targetLayer.id);
        setSelectedMarkerId(null);
        return;
      }
    }
    // Aktywność
    if (marker.linkedActivityType && marker.linkedActivityType !== 'none') {
      setActiveModal({ type: marker.linkedActivityType, marker });
    }
  }, [layers, playWandSwoosh]);

  const handleModalClose = useCallback((result) => {
    setActiveModal(null);
    if (result?.completed) {
      loadMapState(activeLayerId);
      if (result.xp || result.skirniry || result.points) {
        addNotification(
          `⚡ Aktywność ukończona · ${[result.points && `+${result.points} pkt`, result.xp && `+${result.xp} XP`, result.skirniry && `+${result.skirniry} SKR`].filter(Boolean).join(' · ')}`,
          'success'
        );
      }
    }
  }, [activeLayerId, loadMapState, addNotification]);

  const handleFocusTracker = useCallback((marker) => {
    setSelectedMarkerId(marker.id);
    // Przesuń widok na marker
    viewportRef.current?.panTo?.(marker.x, marker.y);
  }, []);

  // ── Image src ──────────────────────────────────────────────────────────────
  const imageSrc = activeLayer?.image_path || '/world_map.webp';
  const initialZoom = activeLayer?.default_zoom || 0.7;

  // ── Active modal component ─────────────────────────────────────────────────
  const ActiveModal = activeModal ? ACTIVITY_MODAL_MAP[activeModal.type] : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* CSS globalny dla animacji markerów */}
      <style>{`
        @keyframes mapPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.25); opacity: 0.2; }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#030508',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Layer selector */}
        <MapLayerSelector
          layers={layers}
          activeLayerId={activeLayerId}
          onChange={handleLayerChange}
        />

        {/* Filters */}
        <MapFilters
          activeFilter={activeFilter}
          onChange={setActiveFilter}
          discoveredCount={mapState?.discoveredCount || 0}
          totalDiscoverable={mapState?.totalDiscoverable || 0}
        />

        {/* Map area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {error ? (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#f87171', fontSize: '0.9rem', textAlign: 'center',
              padding: '2rem',
            }}>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ᛏ</div>
                {error}
              </div>
            </div>
          ) : (
            <MapViewport
              ref={viewportRef}
              imageSrc={imageSrc}
              initialZoom={initialZoom}
              onBackgroundClick={() => setSelectedMarkerId(null)}
            >
              {/* Markers layer */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {markers.map(marker => (
                  <MapMarker
                    key={marker.id}
                    marker={marker}
                    isSelected={selectedMarkerId === marker.id}
                    onClick={() => handleMarkerClick(marker)}
                  />
                ))}
              </div>
            </MapViewport>
          )}

          {/* Quest tracker widget */}
          <MapQuestTracker
            trackedMarker={trackedMarker}
            trackedQuestId={trackedQuestId}
            onUntrack={() => handleTrack(null)}
            onFocus={handleFocusTracker}
            onOpenQuest={handleOpenQuest}
          />

          {/* Info panel */}
          <MapInfoPanel
            marker={selectedMarker}
            onClose={() => setSelectedMarkerId(null)}
            onTrack={handleTrack}
            onStartActivity={handleStartActivity}
            onOpenQuest={handleOpenQuest}
            trackedLocationId={mapState?.trackedLocationId}
            isMobile={isMobile}
          />

          {/* Zoom + floor controls */}
          <MapControls
            onZoomIn={() => viewportRef.current?.zoomIn?.()}
            onZoomOut={() => viewportRef.current?.zoomOut?.()}
            onReset={() => viewportRef.current?.reset?.()}
            currentFloor={currentFloor}
            floors={activeLayerId === 'fortress' ? FORTRESS_FLOORS : null}
            onFloorChange={setCurrentFloor}
          />

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(3,5,8,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(197,159,78,0.7)', fontFamily: 'var(--font-heading)',
              letterSpacing: '0.2em', fontSize: '0.85rem',
              zIndex: 20,
            }}>
              ᚱ ŁADOWANIE ᚱ
            </div>
          )}

          {/* No backend fallback */}
          {!backendAvailable && !loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280', fontSize: '0.9rem', textAlign: 'center',
              padding: '2rem', pointerEvents: 'none',
            }}>
              <div>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.5 }}>🗺️</div>
                <div>Mapa wymaga połączenia z serwerem.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity modal */}
      {ActiveModal && (
        <ActiveModal
          isOpen={true}
          onClose={handleModalClose}
          marker={activeModal?.marker}
        />
      )}

      {/* Quest engine modal */}
      <QuestModal
        questId={activeQuest?.questId}
        isOpen={activeQuest !== null}
        autoStart={activeQuest?.autoStart ?? false}
        onClose={() => setActiveQuest(null)}
        onQuestComplete={handleQuestComplete}
      />
    </>
  );
};
