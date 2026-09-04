import React from 'react';
import { useSchool } from '../context/SchoolContext';

/**
 * SidebarPanelBanner — jedyne źródło renderu nagłówkowego bannera bloku
 * w lewym i prawym pasku bocznym oraz w podglądzie CMS.
 *
 * Wszystkie bannery przechodzą przez ten sam system CSS (.sidebarPanelBanner*):
 * jeden color grading (filter + steel blend), jeden overlay i jedno przejście
 * do nagłówka panelu. Kolor/rozmiar/stroke ikony pochodzą z CSS, nie z propsów,
 * żeby cała kolekcja wyglądała jak jedna biblioteka wizualna.
 *
 * Props:
 *  - graphicId    : klucz do blockGraphics (SchoolContext)
 *  - icon         : komponent lucide-react (renderowany bez `color=`)
 *  - rune         : fallback glifu runicznego, gdy brak w danych bloku
 *  - accent       : undefined | 'inquisition' | 'duel' — subtelny akcent ikony/winiety
 *  - fallbackImage: opcjonalny src, gdy wpis bloku nie ma bgImage
 *  - onClick,title: przekazywane na kontener (np. Inkwizycja klika w dokument)
 */
export const SidebarPanelBanner = ({
  graphicId,
  icon: Icon,
  rune,
  accent,
  fallbackImage,
  onClick,
  title
}) => {
  const { blockGraphics } = useSchool();
  const g = (blockGraphics || []).find(b => b.id === graphicId);
  const src = g?.bgImage || fallbackImage || '';
  const glyph = g?.rune || rune || 'ᛟ';

  const className = [
    'sidebarPanelBanner',
    accent ? `sidebarPanelBanner--${accent}` : '',
    onClick ? 'is-clickable' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      style={src ? { '--sb-src': `url("${src}")` } : undefined}
      onClick={onClick}
      title={title}
    >
      {src && <div className="sidebarPanelBanner__img" />}
      <div className="sidebarPanelBanner__rune">{glyph}</div>
      {Icon && <Icon size={30} strokeWidth={1.75} className="sidebarPanelBanner__icon" />}
    </div>
  );
};
