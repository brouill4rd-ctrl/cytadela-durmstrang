import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useSchool } from './SchoolContext';
import { describeTarget, targetForView } from '../data/beltTargets';

const BeltContext = createContext(null);

export function BeltProvider({ children }) {
  const { currentUser, activeView, activeSubjectId, subjects, setActiveView, setActiveSubjectId, ravenMessages, homeworkOverview, showNotification } = useSchool();
  const [shortcuts, setShortcuts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);

  const refresh = useCallback(async () => {
    if (!currentUser) { setShortcuts([]); return; }
    setLoading(true);
    const result = await api.getBelt();
    if (result.ok) setShortcuts(result.data);
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { refresh(); }, [refresh]);
  const currentTarget = useMemo(() => targetForView(activeView, activeSubjectId, subjects), [activeView, activeSubjectId, subjects]);
  const isPinned = useCallback(target => !!target && shortcuts.some(x => x.targetType === target.targetType && (x.targetId || '') === (target.targetId || '')), [shortcuts]);

  const pin = useCallback(async (target, replaceSlot) => {
    const result = await api.pinToBelt(target, replaceSlot);
    if (result.ok) {
      setShortcuts(result.data);
      setPendingTarget(null);
      showNotification('Znak przypięty', 'Talizman spoczął przy Pasie Adepta.', 'success');
      return true;
    }
    if (result.data?.code === 'BELT_FULL') { setPendingTarget(target); return false; }
    showNotification('Pas odrzucił znak', result.error, 'warning');
    return false;
  }, [showNotification]);

  const unpin = useCallback(async target => {
    const result = await api.unpinFromBelt(target.targetType, target.targetId || '');
    if (result.ok) { setShortcuts(result.data); showNotification('Znak odpięty', 'Runa przy pasie delikatnie zgasła.', 'info'); }
  }, [showNotification]);

  const reorder = useCallback(async next => {
    setShortcuts(next.map((x, slot) => ({ ...x, slot })));
    const result = await api.reorderBelt(next.map(({ targetType, targetId }) => ({ targetType, targetId })));
    if (result.ok) setShortcuts(result.data); else { showNotification('Pas nie odpowiedział', result.error, 'warning'); refresh(); }
  }, [refresh, showNotification]);

  const move = useCallback((index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= shortcuts.length) return;
    const next = [...shortcuts];
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next);
  }, [shortcuts, reorder]);

  const navigate = useCallback(shortcut => {
    const meta = describeTarget(shortcut, subjects);
    if (!meta.available) return showNotification('Wygaszony talizman', 'To miejsce nie jest już dostępne. Możesz odpiąć znak w trybie edycji.', 'warning');
    if (meta.subjectId) setActiveSubjectId(meta.subjectId);
    setActiveView(meta.view);
  }, [subjects, setActiveSubjectId, setActiveView, showNotification]);

  const badgeFor = useCallback(meta => {
    if (meta.badge === 'raven') return ravenMessages.filter(x => !x.read).length;
    if (meta.badge === 'homework') return homeworkOverview?.dueSoonCount || homeworkOverview?.pendingCount || 0;
    return 0;
  }, [ravenMessages, homeworkOverview]);

  return <BeltContext.Provider value={{ shortcuts, loading, currentTarget, isPinned, pin, unpin, reorder, move, navigate, pendingTarget, setPendingTarget, badgeFor }}>{children}</BeltContext.Provider>;
}

export const useBelt = () => useContext(BeltContext);
