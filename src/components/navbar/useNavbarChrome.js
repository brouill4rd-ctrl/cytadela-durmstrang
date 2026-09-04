import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chrome-level behaviour for the navbar: which dropdown is open, the mobile
 * drawer toggle, "scrolled" styling, outside-click + Escape dismissal.
 * Kept out of SchoolContext on purpose — this is view-local UI state.
 */
// The navbar rides transparently over the hero until the castle has scrolled
// roughly this far past it; then it condenses into blackened iron.
const HERO_OVERLAP_PX = 120;

export function useNavbarChrome() {
  const [openMenu, setOpenMenu] = useState(null); // menu id | 'user' | null
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const rootRef = useRef(null);

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
  }, []);

  const toggleMenu = useCallback((id) => {
    setOpenMenu((cur) => (cur === id ? null : id));
  }, []);

  // Outside click closes any open dropdown (drawer has its own controls).
  useEffect(() => {
    if (!openMenu) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  // Escape closes dropdowns and the drawer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Scroll-driven chrome: `scrolled` adds the elevated shadow, `atTop` keeps the
  // bar transparent while the hero castle is still behind it. rAF-throttled so a
  // fast scroll never queues more than one state read per frame.
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      setAtTop(y < HERO_OVERLAP_PX);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return {
    rootRef,
    openMenu,
    toggleMenu,
    setOpenMenu,
    drawerOpen,
    setDrawerOpen,
    scrolled,
    atTop,
    closeAll
  };
}
