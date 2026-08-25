import React, { useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useWorldState } from '../context/WorldStateContext';

export const SnowCanvas = () => {
  const canvasRef = useRef(null);
  const { snowEnabled } = useSchool();
  const { worldState, effectiveMode } = useWorldState();
  const isSnowWeather = ['SNOWFALL', 'HEAVY_SNOW', 'BLIZZARD'].includes(worldState.weather);
  const active = snowEnabled && isSnowWeather && effectiveMode !== 'QUIET';

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Flake count tailored to screen size
    const multiplier = worldState.weather === 'BLIZZARD' ? 2.2 : worldState.weather === 'HEAVY_SNOW' ? 1.5 : 0.8;
    const modeMultiplier = effectiveMode === 'FULL' ? 1 : 0.55;
    const flakeCount = Math.min(180, Math.floor(window.innerWidth / 18 * multiplier * modeMultiplier));
    const flakes = [];

    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.6,
        speed: (Math.random() * 0.85 + 0.35) * multiplier,
        wind: (Math.random() * 0.5 - 0.2) + (worldState.windIntensity || 0) * 0.18,
        opacity: Math.random() * 0.6 + 0.25,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.005
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        f.y += f.speed;
        f.sway += f.swaySpeed;
        f.x += Math.sin(f.sway) * 0.6 + f.wind;

        if (f.y > height) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 240, 255, ${f.opacity})`;
        ctx.shadowBlur = f.r * 2;
        ctx.shadowColor = 'rgba(197, 220, 255, 0.4)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, worldState.weather, worldState.windIntensity, effectiveMode]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.85
      }}
    />
  );
};
