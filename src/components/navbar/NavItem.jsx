import React from 'react';

/**
 * One top-level bar entry: icon over LABEL over sublabel, matching the reference
 * navbar. Used both for plain links and (via NavDropdown) for dropdown triggers.
 */
export const NavItem = React.forwardRef(function NavItem(
  { entry, active, expanded, hasChildren, onClick, onKeyDown },
  ref
) {
  const Icon = entry.icon;
  return (
    <button
      ref={ref}
      type="button"
      className="tmd-nav__item"
      data-active={active || undefined}
      aria-current={active && !hasChildren ? 'page' : undefined}
      aria-haspopup={hasChildren ? 'menu' : undefined}
      aria-expanded={hasChildren ? Boolean(expanded) : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {Icon && <Icon size={18} strokeWidth={1.6} aria-hidden="true" />}
      <span className="tmd-nav__label">{entry.label}</span>
      {entry.sublabel && <span className="tmd-nav__sub">{entry.sublabel}</span>}
    </button>
  );
});
