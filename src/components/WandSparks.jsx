import React, { useEffect, useState } from 'react';

export const WandSparks = ({ enabled = true }) => {
  const [sparks, setSparks] = useState([]);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (e) => {
      // Don't spawn if right-click or middle-click
      if (e.button !== 0) return;

      const clickX = e.clientX;
      const clickY = e.clientY;
      const id = Date.now() + Math.random();

      // Create 3-4 tiny particles flying slightly outward
      const newParticles = Array.from({ length: 4 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 4 + (Math.random() - 0.5) * 0.5;
        const speed = 12 + Math.random() * 16;
        const color = i % 2 === 0 ? '#ffe8aa' : (i % 3 === 0 ? '#5eead4' : '#c084fc');
        const rune = ['✦', '✧', 'ᛟ', 'ᛋ'][i % 4];

        return {
          id: `${id}-${i}`,
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          rune,
          size: 9 + Math.random() * 4
        };
      });

      setSparks((prev) => [...prev, ...newParticles]);

      // Remove particles after 450ms
      setTimeout(() => {
        setSparks((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
      }, 450);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled]);

  if (!enabled || sparks.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {sparks.map((spark) => (
        <span
          key={spark.id}
          style={{
            position: 'absolute',
            left: spark.x,
            top: spark.y,
            color: spark.color,
            fontSize: `${spark.size}px`,
            lineHeight: 1,
            textShadow: `0 0 8px ${spark.color}`,
            transform: 'translate(-50%, -50%)',
            animation: 'wand-sparkle-burst 0.45s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
            userSelect: 'none',
            '--tx': `${spark.vx}px`,
            '--ty': `${spark.vy}px`
          }}
        >
          {spark.rune}
        </span>
      ))}
      <style>{`
        @keyframes wand-sparkle-burst {
          0% {
            transform: translate(-50%, -50%) scale(0.6) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.1) translate(var(--tx), var(--ty));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
