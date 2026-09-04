import React from 'react';
import { NavRow } from './NavRow';
import { PRIMARY_NAV, isVisible } from './navConfig';

/**
 * Mobile navigation — the full tree from PRIMARY_NAV. Each top entry is a row
 * (navigates on tap); its visible children follow as indented rows.
 */
export function MobileDrawer({ session, activeView, onSelect }) {
  return (
    <div className="tmd-nav__drawer" id="tmd-nav-drawer">
      {PRIMARY_NAV.filter((entry) => isVisible(entry, session)).map((entry) => {
        const children = (entry.children || []).filter((it) => isVisible(it, session));
        return (
          <React.Fragment key={entry.id}>
            <NavRow
              item={entry}
              active={(entry.match || []).includes(activeView)}
              onSelect={onSelect}
            />
            {children.map((it) => (
              <div className="tmd-nav__drawer-sub" key={it.id}>
                <NavRow
                  item={it}
                  active={(it.match || []).includes(activeView)}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
