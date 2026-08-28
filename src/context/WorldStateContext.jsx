import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { api } from '../api';

const Context = createContext(null);

const FALLBACK = {
  timeOfDay:       'NIGHT',
  seasonalCycle:   'NORMAL',
  weather:         'SNOWFALL',
  temperature:     -11,
  windDirection:   'NE',
  windIntensity:   2,
  moonPhase:       'WAXING_GIBBOUS',
  skyState:        'AURORA',
  runeOfTheDay:    { name: 'ISA', symbol: 'ᛁ' },
  citadelState:    'NORMAL',
  threatLevel:     'I',
  activeEvents:    [],
  activeEffects:   [],
  worldScars:      [],
  narrativeReport: 'Nad murami trwa spokojna, śnieżna warta.',
};

const REFRESH_INTERVAL = 60_000; // 1 min

export function WorldStateProvider({ children }) {
  const [worldState, setWorldState]           = useState(FALLBACK);
  const [loading, setLoading]                 = useState(true);
  const [presentationMode, setPresentationMode] = useState(
    () => localStorage.getItem('tmd_world_presentation') || 'BALANCED',
  );

  const refresh = useCallback(async () => {
    const r = await api.getWorldState();
    if (r.ok) setWorldState(r.data);
    setLoading(false);
    return r;
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem('tmd_world_presentation', presentationMode);
  }, [presentationMode]);

  const reducedMotion = typeof window !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const effectiveMode = reducedMotion ? 'QUIET' : presentationMode;

  // Group active effects by type for easy consumption by other modules
  const effectsByType = useMemo(() => {
    return (worldState.activeEffects || []).reduce((acc, effect) => {
      (acc[effect.type] ??= []).push(effect);
      return acc;
    }, {});
  }, [worldState.activeEffects]);

  const value = {
    worldState,
    loading,
    refresh,
    presentationMode,
    setPresentationMode,
    effectiveMode,
    reducedMotion,
    effectsByType,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useWorldState = () => useContext(Context);
