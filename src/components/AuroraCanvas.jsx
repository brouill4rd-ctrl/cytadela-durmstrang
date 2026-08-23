import React, { useEffect, useRef } from 'react';

export const AuroraCanvas = ({ enabled = true, intensity = 0.6 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = Math.min(window.innerHeight * 0.7, 500));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.min(window.innerHeight * 0.7, 500);
    };
    window.addEventListener('resize', handleResize);

    let step = 0;

    const render = () => {
      step += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Create Aurora wave ribbons
      const numWaves = 3;
      const colors = [
        { r: 24, g: 168, b: 120, a: 0.15 * intensity }, // Emerald Green
        { r: 88, g: 50, b: 168, a: 0.12 * intensity },  // Mystic Violet
        { r: 197, g: 159, b: 78, a: 0.08 * intensity }   // Ancient Runic Gold
      ];

      for (let w = 0; w < numWaves; w++) {
        ctx.beginPath();
        const baseColor = colors[w];

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
        grad.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${baseColor.a})`);
        grad.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);

        ctx.fillStyle = grad;

        const waveHeight = height * 0.6;
        ctx.moveTo(0, 0);

        for (let x = 0; x <= width; x += 15) {
          const sin1 = Math.sin(x * 0.003 + step + w * 1.5);
          const sin2 = Math.sin(x * 0.007 - step * 0.8 + w);
          const y = waveHeight + sin1 * 60 + sin2 * 35;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, 0);
        ctx.closePath();
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, intensity]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '450px',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.75,
        mixBlendMode: 'screen',
        filter: 'blur(25px)'
      }}
    />
  );
};
