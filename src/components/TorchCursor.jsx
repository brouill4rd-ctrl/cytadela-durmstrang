import React, { useEffect, useState } from 'react';

export const TorchCursor = ({ enabled = false, size = 320, color = 'rgba(197, 159, 78, 0.08)' }) => {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      
      const target = e.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHoveringClickable(true);
      } else {
        setIsHoveringClickable(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  const currentSize = isHoveringClickable ? size * 1.25 : size;
  const glowColor = isHoveringClickable ? 'rgba(230, 190, 100, 0.14)' : color;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, rgba(197, 159, 78, 0.03) 45%, rgba(0, 0, 0, 0) 70%)`,
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
        transition: 'width 0.25s ease, height 0.25s ease, background 0.25s ease',
        willChange: 'transform, left, top'
      }}
    />
  );
};
