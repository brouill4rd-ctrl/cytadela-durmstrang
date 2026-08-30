import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Footprints,
  Sparkles,
  Eye,
  Crosshair,
  Shield,
  Layers,
  MapPin,
  Award
} from 'lucide-react';

export const MaraudersMapCanvas = ({
  locations = [],
  currentLevel = 0,
  filterHouse = 'all',
  onSelectLocation,
  selectedLocationId = null,
  houses = {},
  isRevealed = true
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Map Background Image Ref
  const mapImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pan and Zoom Camera State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Load the High-Fantasy Illustrated Cartographic Map Image
  useEffect(() => {
    const img = new Image();
    img.src = '/durmstrang_fantasy_map.webp';
    img.onload = () => {
      mapImageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  // Roaming Patrols with Waypoints on the Illustrated Map Paths (Slowed down to realistic walking pace)
  const patrolsRef = useRef([
    {
      id: 'karkarow',
      name: 'Arcymistrz Karkarow',
      title: 'Patrol Dyrektorski',
      icon: '🧙‍♂️',
      floor: 0,
      color: '#6d28d9',
      path: [
        { x: 500, y: 440 },
        { x: 480, y: 550 },
        { x: 440, y: 400 },
        { x: 500, y: 300 },
        { x: 500, y: 440 }
      ],
      currentWaypoint: 0,
      x: 500,
      y: 440,
      speed: 0.18, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    },
    {
      id: 'varg',
      name: 'Gajowy Stellan Varg',
      title: 'Strażnik Boru Jötunskógr',
      icon: '🐺',
      floor: 0,
      color: '#15803d',
      path: [
        { x: 280, y: 340 },
        { x: 180, y: 480 },
        { x: 120, y: 350 },
        { x: 220, y: 220 },
        { x: 280, y: 340 }
      ],
      currentWaypoint: 0,
      x: 280,
      y: 340,
      speed: 0.2, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    },
    {
      id: 'einar',
      name: 'Duch Skalda Einara',
      title: 'Widmo Szczytów Skandów',
      icon: '👻',
      floor: 2,
      color: '#0284c7',
      path: [
        { x: 520, y: 150 },
        { x: 680, y: 160 },
        { x: 880, y: 220 },
        { x: 580, y: 360 },
        { x: 520, y: 150 }
      ],
      currentWaypoint: 0,
      x: 520,
      y: 150,
      speed: 0.22, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    },
    {
      id: 'kruk',
      name: 'Kruk Strażniczy Huginn',
      title: 'Zwiad Powietrzny',
      icon: '🦅',
      floor: 2,
      color: '#1e293b',
      path: [
        { x: 580, y: 360 },
        { x: 820, y: 560 },
        { x: 880, y: 220 },
        { x: 500, y: 300 },
        { x: 580, y: 360 }
      ],
      currentWaypoint: 0,
      x: 580,
      y: 360,
      speed: 0.28, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    },
    {
      id: 'straznik-niedzwiedz',
      name: 'Warta Zakonu Niedźwiedzia',
      title: 'Straż Południowych Mostów',
      icon: '🛡️',
      floor: 0,
      color: '#b91c1c',
      path: [
        { x: 680, y: 680 },
        { x: 480, y: 550 },
        { x: 350, y: 620 },
        { x: 680, y: 680 }
      ],
      currentWaypoint: 0,
      x: 680,
      y: 680,
      speed: 0.16, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    },
    {
      id: 'sven-drakkar',
      name: 'Magiczny Drakkar & Sven',
      title: 'Nawigacja Fiordów',
      icon: '⛵',
      floor: -1,
      color: '#0284c7',
      path: [
        { x: 240, y: 760 },
        { x: 380, y: 840 },
        { x: 620, y: 880 },
        { x: 420, y: 780 },
        { x: 240, y: 760 }
      ],
      currentWaypoint: 0,
      x: 240,
      y: 760,
      speed: 0.14, // Slowed down
      footsteps: [],
      footstepCounter: 0,
      lastFoot: 'left'
    }
  ]);

  // Wand trail ink particles
  const inkParticlesRef = useRef([]);

  // Resize canvas to container
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Center camera initially to fit the full map artfully
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const initialScale = Math.min(rect.width / 1024, rect.height / 1024) * 0.95;
      setTransform({
        x: (rect.width - 1024 * initialScale) / 2,
        y: (rect.height - 1024 * initialScale) / 2,
        scale: initialScale || 0.8
      });
    }
  }, [imageLoaded]);

  // Non-passive Native Wheel Event Listener to guarantee page scroll is 100% prevented
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentT = transformRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.min(Math.max(currentT.scale * zoomFactor, 0.45), 3.2);

      const mouseWorldX = (mouseX - currentT.x) / currentT.scale;
      const mouseWorldY = (mouseY - currentT.y) / currentT.scale;

      const newTransform = {
        scale: newScale,
        x: mouseX - mouseWorldX * newScale,
        y: mouseY - mouseWorldY * newScale
      };

      setTransform(newTransform);
      transformRef.current = newTransform;
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Filter locations by house
  const visibleLocations = locations.filter((loc) => {
    const matchesHouse =
      filterHouse === 'all' ||
      loc.house === filterHouse ||
      (filterHouse === 'neutral' && !loc.house);
    return matchesHouse;
  });

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // 1. Clear Canvas & Draw Outer Background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // 2. Apply Camera Transform (Pan & Zoom)
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      // 3. Draw Illustrated Map Master Artwork (1024x1024)
      if (mapImageRef.current && mapImageRef.current.complete) {
        ctx.drawImage(mapImageRef.current, 0, 0, 1024, 1024);
      } else {
        ctx.fillStyle = '#e8d8b8';
        ctx.fillRect(0, 0, 1024, 1024);
      }

      // 4. Update & Draw Roaming Patrols with Animated Footstep Trails
      updateAndDrawPatrols(ctx, currentLevel);

      // 5. Draw Cartographic Illustrated Location Markers & Labels
      drawIllustratedLocations(ctx, visibleLocations, selectedLocationId, hoveredLocation, houses);

      // 6. Draw Wand Trail Ink Sparkles
      drawWandSparkles(ctx);

      ctx.restore(); // Restore Camera Transform

      ctx.restore(); // Restore DPR scale
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [transform, currentLevel, visibleLocations, selectedLocationId, hoveredLocation, filterHouse, houses, imageLoaded]);

  // === CANVAS DRAWING ROUTINES ===

  // Draw Illustrated Location Markers & Names
  const drawIllustratedLocations = (ctx, locs, selectedId, hoveredLoc, housesData) => {
    locs.forEach((loc) => {
      const cx = (loc.x / 100) * 1024;
      const cy = (loc.y / 100) * 1024;
      const isSelected = selectedId === loc.id;
      const isHovered = hoveredLoc?.id === loc.id;
      const house = loc.house ? housesData[loc.house] : null;

      ctx.save();
      ctx.translate(cx, cy);

      // Dynamic Pulsing Halo for selected/hovered POI
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 34 : 28, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(217, 169, 78, 0.45)'
          : 'rgba(56, 189, 248, 0.35)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffd700' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Cartographic Pin Base (Aged Parchment Badge with Metal Rim)
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = house ? house.colors.bgDark : 'rgba(25, 20, 15, 0.92)';
      ctx.fill();
      ctx.strokeStyle = isSelected
        ? '#ffffff'
        : house
        ? house.colors.primary
        : '#d4af37';
      ctx.lineWidth = isSelected ? 2.8 : 2;
      ctx.stroke();

      // Inner Rune/House Ring
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // POI Icon / Emoji
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loc.icon || '📍', 0, 1);

      // Quest Available Red Gem Indicator
      if (loc.quests && loc.quests.length > 0) {
        ctx.beginPath();
        ctx.arc(14, -14, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', 14, -13);
      }

      // Cartographic Calligraphic Name Label (Parchment Box with Serif Typography)
      const nameText = loc.name.split('(')[0].trim();
      ctx.font = 'bold 12px "Cinzel", "Georgia", "Times New Roman", serif';
      const textWidth = ctx.measureText(nameText).width;
      const boxWidth = textWidth + 16;
      const boxHeight = 22;

      ctx.save();
      ctx.translate(0, 30);

      // Label Parchment Background with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = 'rgba(253, 248, 237, 0.95)';
      ctx.strokeStyle = isSelected ? '#d4af37' : '#5c3a1d';
      ctx.lineWidth = isSelected ? 1.8 : 1.2;

      ctx.beginPath();
      ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 3);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';

      // Label Text
      ctx.fillStyle = isSelected ? '#8a2b0d' : '#2d1807';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, 0, 1);

      ctx.restore();

      ctx.restore();
    });
  };

  // Roaming Patrols with Walking Footprints on Map Roads
  const updateAndDrawPatrols = (ctx, currentFloor) => {
    const patrols = patrolsRef.current;

    patrols.forEach((patrol) => {
      // Waypoint Pathfinding
      const target = patrol.path[patrol.currentWaypoint];
      const dx = target.x - patrol.x;
      const dy = target.y - patrol.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        patrol.currentWaypoint = (patrol.currentWaypoint + 1) % patrol.path.length;
      } else {
        const angle = Math.atan2(dy, dx);
        patrol.x += Math.cos(angle) * patrol.speed;
        patrol.y += Math.sin(angle) * patrol.speed;

        // Leave Footprint every 12 pixels traveled
        patrol.footstepCounter += patrol.speed;
        if (patrol.footstepCounter >= 12) {
          patrol.footstepCounter = 0;
          const nextFoot = patrol.lastFoot === 'left' ? 'right' : 'left';
          patrol.lastFoot = nextFoot;

          const sideOffset = nextFoot === 'left' ? -5 : 5;
          const fx = patrol.x + Math.cos(angle + Math.PI / 2) * sideOffset;
          const fy = patrol.y + Math.sin(angle + Math.PI / 2) * sideOffset;

          patrol.footsteps.push({
            x: fx,
            y: fy,
            angle: angle,
            foot: nextFoot,
            opacity: 1.0,
            bornAt: Date.now()
          });
        }
      }

      // Draw and Fade Footsteps (persistent 24 seconds)
      const now = Date.now();
      patrol.footsteps = patrol.footsteps.filter((fs) => {
        const age = now - fs.bornAt;
        const maxAge = 24000;
        if (age >= maxAge) return false;
        fs.opacity = 1 - age / maxAge;

        drawFootprintSole(ctx, fs.x, fs.y, fs.angle, fs.foot, fs.opacity, patrol.color);
        return true;
      });

      // Draw Floating Character Ribbon
      drawCharacterRibbon(ctx, patrol.x, patrol.y, patrol.name, patrol.title, patrol.icon, patrol.color);
    });
  };

  // Footprint Sole drawing
  const drawFootprintSole = (ctx, x, y, angle, foot, opacity, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(40, 20, 10, ${opacity * 0.85})`;

    // Front sole
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heel
    ctx.beginPath();
    ctx.ellipse(-5.5, 0, 2.7, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Floating Character Banner
  const drawCharacterRibbon = (ctx, x, y, name, title, icon, color) => {
    ctx.save();
    ctx.translate(x, y - 22);

    ctx.font = 'bold 11px "Cinzel", "Times New Roman", serif';
    const textWidth = ctx.measureText(name).width;
    const bannerWidth = Math.max(textWidth + 28, 85);
    const bannerHeight = 22;

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = 'rgba(253, 248, 237, 0.95)';
    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.rect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    // Banner tails
    ctx.beginPath();
    ctx.moveTo(-bannerWidth / 2, -bannerHeight / 2);
    ctx.lineTo(-bannerWidth / 2 - 6, 0);
    ctx.lineTo(-bannerWidth / 2, bannerHeight / 2);
    ctx.fillStyle = '#e8d8b8';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bannerWidth / 2, -bannerHeight / 2);
    ctx.lineTo(bannerWidth / 2 + 6, 0);
    ctx.lineTo(bannerWidth / 2, bannerHeight / 2);
    ctx.fillStyle = '#e8d8b8';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3a1805';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon} ${name}`, 0, 1);

    // Pin line
    ctx.beginPath();
    ctx.moveTo(0, bannerHeight / 2);
    ctx.lineTo(0, 20);
    ctx.strokeStyle = 'rgba(74, 40, 16, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Wand Sparks
  const drawWandSparkles = (ctx) => {
    const now = Date.now();
    inkParticlesRef.current = inkParticlesRef.current.filter((p) => {
      const age = now - p.bornAt;
      if (age > p.maxAge) return false;
      const opacity = 1 - age / p.maxAge;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * opacity, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(197, 159, 78, ${opacity * 0.7})`;
      ctx.fill();
      return true;
    });
  };

  // === MOUSE & CAMERA CONTROLS (PAN, HOVER, CLICK) ===

  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    });
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasMousePos(e);
    setMousePos(pos);

    if (isDragging) {
      const newT = {
        ...transform,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setTransform(newT);
      transformRef.current = newT;
    }

    // World coordinates (0-1024)
    const worldX = (pos.x - transform.x) / transform.scale;
    const worldY = (pos.y - transform.y) / transform.scale;

    // Spawn wand spark
    if (Math.random() < 0.2) {
      inkParticlesRef.current.push({
        x: worldX,
        y: worldY,
        radius: Math.random() * 3 + 1,
        bornAt: Date.now(),
        maxAge: 1200
      });
    }

    // Hit-testing locations
    let found = null;
    for (const loc of visibleLocations) {
      const lx = (loc.x / 100) * 1024;
      const ly = (loc.y / 100) * 1024;
      const dist = Math.sqrt((worldX - lx) ** 2 + (worldY - ly) ** 2);
      if (dist <= 36) {
        found = loc;
        break;
      }
    }
    setHoveredLocation(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    const pos = getCanvasMousePos(e);
    const worldX = (pos.x - transform.x) / transform.scale;
    const worldY = (pos.y - transform.y) / transform.scale;

    for (const loc of visibleLocations) {
      const lx = (loc.x / 100) * 1024;
      const ly = (loc.y / 100) * 1024;
      const dist = Math.sqrt((worldX - lx) ** 2 + (worldY - ly) ** 2);
      if (dist <= 36) {
        if (onSelectLocation) onSelectLocation(loc);
        break;
      }
    }
  };

  const handleZoomIn = () => {
    setTransform((prev) => {
      const next = {
        ...prev,
        scale: Math.min(prev.scale * 1.3, 3.2)
      };
      transformRef.current = next;
      return next;
    });
  };

  const handleZoomOut = () => {
    setTransform((prev) => {
      const next = {
        ...prev,
        scale: Math.max(prev.scale * 0.77, 0.45)
      };
      transformRef.current = next;
      return next;
    });
  };

  const handleResetView = () => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const fitScale = Math.min(rect.width / 1024, rect.height / 1024) * 0.95;
      const next = {
        x: (rect.width - 1024 * fitScale) / 2,
        y: (rect.height - 1024 * fitScale) / 2,
        scale: fitScale || 0.85
      };
      setTransform(next);
      transformRef.current = next;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '720px',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow:
          '0 25px 60px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(0, 0, 0, 0.8)',
        border: '2px solid var(--gold-ancient)',
        cursor: isDragging ? 'grabbing' : hoveredLocation ? 'pointer' : 'crosshair',
        userSelect: 'none',
        background: '#0a0d14',
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Hover Location Card Preview Tooltip */}
      {hoveredLocation && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max(mousePos.x + 20, 20), (containerRef.current?.clientWidth || 800) - 320)}px`,
            top: `${Math.min(Math.max(mousePos.y - 120, 20), (containerRef.current?.clientHeight || 600) - 180)}px`,
            width: '300px',
            background: 'rgba(12, 16, 24, 0.96)',
            border: '1.5px solid var(--gold-ancient)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.9), 0 0 20px rgba(197, 159, 78, 0.2)',
            pointerEvents: 'none',
            zIndex: 40,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{hoveredLocation.icon}</span>
            <div>
              <div style={{ color: 'var(--gold-ancient)', fontSize: '0.7rem', letterSpacing: '0.1em', fontFamily: 'var(--font-heading)' }}>
                {hoveredLocation.nordicName} • {hoveredLocation.region || hoveredLocation.type}
              </div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: 0, lineHeight: 1.2 }}>
                {hoveredLocation.name}
              </h4>
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.4, margin: '0.5rem 0' }}>
            {hoveredLocation.shortDesc}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(197, 159, 78, 0.2)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.72rem' }}>
            <span style={{ color: '#94a3b8' }}>⚔️ Side Questy: <strong style={{ color: '#4ade80' }}>{hoveredLocation.quests?.length || 0} dostępne</strong></span>
            <span style={{ color: 'var(--gold-ancient)', fontWeight: 700 }}>Kliknij, by otworzyć →</span>
          </div>
        </div>
      )}

      {/* Floating Canvas Camera Controls (Right-Bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          right: '25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          zIndex: 20,
          background: 'rgba(15, 20, 30, 0.92)',
          padding: '0.4rem',
          borderRadius: '8px',
          border: '1.5px solid var(--gold-ancient)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Przybliż Mapę (+)"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffe599',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(197, 159, 78, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Oddal Mapę (-)"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffe599',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(197, 159, 78, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={handleResetView}
          title="Wyśrodkuj Widok Regionu"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffe599',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(197, 159, 78, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Top-Left Region Banner */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(10, 14, 22, 0.9)',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '6px',
          padding: '0.5rem 0.9rem',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        <Compass size={18} color="var(--gold-ancient)" />
        <div>
          <div style={{ color: 'var(--gold-ancient)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            Region Cytadeli Durmstrang & Fiordów
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
            Przeciągaj myszą i powiększaj kółkiem • Spokojny marsz patroli
          </div>
        </div>
      </div>
    </div>
  );
};
