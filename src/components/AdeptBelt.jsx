import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Link2, Pencil, Plus, Unlink, X } from 'lucide-react';
import { useBelt } from '../context/BeltContext';
import { useSchool } from '../context/SchoolContext';
import { describeTarget } from '../data/beltTargets';

export function AdeptBelt({ hidden = false }) {
  const { currentUser, subjects } = useSchool();
  const { shortcuts, loading, currentTarget, isPinned, pin, unpin, reorder, move, navigate, pendingTarget, setPendingTarget, badgeFor } = useBelt();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dragged, setDragged] = useState(null);
  if (!currentUser || hidden) return null;

  const toggleCurrent = () => currentTarget && (isPinned(currentTarget) ? unpin(currentTarget) : pin(currentTarget));
  const dropAt = index => {
    if (dragged === null || dragged === index) return setDragged(null);
    const next = [...shortcuts];
    const [item] = next.splice(dragged, 1);
    next.splice(index, 0, item);
    setDragged(null);
    reorder(next);
  };
  const totalBadges = shortcuts.reduce((sum, s) => {
    const meta = describeTarget(s, subjects);
    return sum + (badgeFor(meta) || 0);
  }, 0);

  return <>
    {currentTarget && <button className={`belt-pin-page ${isPinned(currentTarget) ? 'is-pinned' : ''}`} onClick={toggleCurrent} aria-label={isPinned(currentTarget) ? 'Odepnij bieżące miejsce od Pasa Adepta' : 'Przypnij bieżące miejsce do Pasa Adepta'}>
      {isPinned(currentTarget) ? <Unlink size={14} /> : <Link2 size={14} />}
      <span>{isPinned(currentTarget) ? 'Odepnij od pasa' : 'Przypnij do pasa'}</span>
    </button>}

    <section className={`adept-belt ${open ? 'is-open' : ''} ${editing ? 'is-editing' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Pas Adepta">
      <button className="belt-collapse-tab" onClick={() => { setCollapsed(x => !x); setEditing(false); }} aria-expanded={!collapsed} aria-controls="adept-belt-panel">
        <span className="belt-tab-rune">ᛞ</span>
        <span className="belt-tab-label">Pas Adepta</span>
        {totalBadges > 0 && <span className="talisman-badge belt-tab-badge">{totalBadges > 9 ? '9+' : totalBadges}</span>}
        <span className="belt-tab-chevron">{collapsed ? '▲' : '▼'}</span>
      </button>
      <button className="belt-mobile-toggle" onClick={() => setOpen(x => !x)} aria-expanded={open} aria-controls="adept-belt-panel">
        <span>ᛞ</span> Pas Adepta <span className="belt-mobile-count">{shortcuts.length}/5</span>
      </button>
      <div id="adept-belt-panel" className="belt-panel">
        <header className="belt-header">
          <span className="belt-title">ᛞ Pas Adepta</span>
          <button onClick={() => setEditing(x => !x)} aria-pressed={editing}><Pencil size={13} /> {editing ? 'Gotowe' : 'Dostosuj pas'}</button>
          <button className="belt-close-mobile" onClick={() => setOpen(false)} aria-label="Zamknij Pas Adepta"><X size={17} /></button>
        </header>
        <div className="belt-slots" aria-busy={loading}>
          {shortcuts.map((shortcut, index) => {
            const meta = describeTarget(shortcut, subjects);
            const badge = badgeFor(meta);
            return <div className="belt-slot-wrap" key={`${shortcut.targetType}:${shortcut.targetId}`}>
              <button
                className={`belt-talisman talisman-${meta.kind} ${!meta.available ? 'is-dormant' : ''}`}
                onClick={() => editing ? undefined : navigate(shortcut)}
                draggable={editing}
                onDragStart={() => setDragged(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dropAt(index)}
                aria-label={`${meta.object}: ${meta.label}. ${meta.description}`}
                aria-describedby={`belt-tip-${index}`}
              >
                {editing && <GripVertical className="belt-grip" size={13} aria-hidden="true" />}
                <span className="talisman-glyph" aria-hidden="true">{meta.glyph}</span>
                {badge > 0 && <span className="talisman-badge" aria-label={`${badge} nowych`}>{badge > 9 ? '9+' : badge}</span>}
              </button>
              <span className="belt-mobile-label">{meta.label}</span>
              <span role="tooltip" id={`belt-tip-${index}`} className="belt-tooltip"><b>{meta.object}</b><span>{meta.label}</span><small>{meta.description}</small></span>
              {editing && <div className="belt-edit-actions">
                <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Przesuń ${meta.label} w lewo`}><ChevronLeft size={14} /></button>
                <button onClick={() => unpin(shortcut)} aria-label={`Odepnij ${meta.label}`}><X size={14} /></button>
                <button onClick={() => move(index, 1)} disabled={index === shortcuts.length - 1} aria-label={`Przesuń ${meta.label} w prawo`}><ChevronRight size={14} /></button>
              </div>}
            </div>;
          })}
          {Array.from({ length: 5 - shortcuts.length }, (_, i) => <div className="belt-empty-slot" key={`empty-${i}`} aria-label="Wolne miejsce przy pasie"><span>᛫</span>{editing && <Plus size={12} />}</div>)}
        </div>
        {!loading && shortcuts.length === 0 && <p className="belt-empty-copy">Twój pas jest jeszcze pusty. Przejdź do widoku (np. Plan zajęć, Bank) i kliknij <em>Przypnij do pasa</em> w prawym dolnym rogu.</p>}
      </div>
    </section>

    {pendingTarget && <div className="belt-modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setPendingTarget(null)}>
      <div className="belt-modal" role="dialog" aria-modal="true" aria-labelledby="belt-full-title">
        <button className="belt-modal-close" onClick={() => setPendingTarget(null)} aria-label="Zamknij"><X /></button>
        <span className="belt-modal-rune">ᛞ</span>
        <h2 id="belt-full-title">Przy pasie nie pozostało już wolne miejsce.</h2>
        <p>Wybierz znak, który chcesz zastąpić.</p>
        <div className="belt-replace-list">{shortcuts.map((shortcut, index) => {
          const meta = describeTarget(shortcut, subjects);
          return <button key={`${shortcut.targetType}:${shortcut.targetId}`} onClick={() => pin(pendingTarget, index)}><span>{meta.glyph}</span><b>{meta.label}</b><ChevronRight size={16} /></button>;
        })}</div>
      </div>
    </div>}
  </>;
}
