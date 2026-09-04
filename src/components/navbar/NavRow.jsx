import React from 'react';

/**
 * One destination row, shared by the desktop dropdown panels and the mobile
 * drawer. `icon` falls back to the emoji glyph when no lucide icon is set.
 */
export const NavRow = React.forwardRef(function NavRow({ item, active, onSelect }, ref) {
  const Icon = item.icon;
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className="tmd-nav__row"
      data-active={active || undefined}
      data-accent={item.accent || undefined}
      onClick={() => onSelect(item)}
    >
      <span className="tmd-nav__row-chip">
        {Icon ? <Icon size={14} /> : <span aria-hidden="true">{item.emoji}</span>}
      </span>
      <span>{item.label}</span>
      {item.badge ? (
        <span className="tmd-nav__badge" data-tone={item.badge.tone}>
          {item.badge.text}
        </span>
      ) : (
        <span />
      )}
    </button>
  );
});
