import React, { useRef } from 'react';
import { NavItem } from './NavItem';
import { NavRow } from './NavRow';
import { isActive, isVisible } from './navConfig';

/**
 * A top-level bar entry (NavItem) plus its dropdown panel of sub-links.
 * Keyboard: Enter/Space/ArrowDown opens + focuses the first row; ArrowUp/Down
 * roam the rows; Home/End jump; Escape/Tab close (Escape restores the trigger).
 */
export function NavDropdown({ entry, session, activeView, isOpen, onToggle, onSelect, alignRight }) {
  const triggerRef = useRef(null);
  const rowRefs = useRef([]);

  const rows = (entry.children || []).filter((it) => isVisible(it, session));

  const focusRow = (idx) => {
    if (!rows.length) return;
    const clamped = (idx + rows.length) % rows.length;
    rowRefs.current[clamped]?.focus();
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) onToggle(entry.id);
      requestAnimationFrame(() => focusRow(0));
    }
  };

  const onPanelKeyDown = (e) => {
    const current = rowRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(current + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusRow(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusRow(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusRow(rows.length - 1);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      onToggle(entry.id);
      if (e.key === 'Escape') triggerRef.current?.focus();
    }
  };

  return (
    <div className="tmd-nav__item-wrap">
      <NavItem
        ref={triggerRef}
        entry={entry}
        hasChildren
        active={isActive(entry, activeView, session)}
        expanded={isOpen}
        onClick={() => onToggle(entry.id)}
        onKeyDown={onTriggerKeyDown}
      />

      {isOpen && (
        <div
          className={`tmd-nav__panel${alignRight ? ' tmd-nav__panel--right' : ''}`}
          role="menu"
          aria-label={entry.label}
          onKeyDown={onPanelKeyDown}
        >
          {rows.map((it, idx) => (
            <NavRow
              key={it.id}
              ref={(el) => {
                rowRefs.current[idx] = el;
              }}
              item={it}
              active={(it.match || []).includes(activeView)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
