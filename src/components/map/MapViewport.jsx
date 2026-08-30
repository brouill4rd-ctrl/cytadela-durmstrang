import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 4.0;
const ZOOM_STEP = 0.15;

function clampPan(x, y, zoom, container, img) {
  if (!container || !img) return { x, y };
  const maxX = Math.max(0, (img.w * zoom - container.w) / 2);
  const maxY = Math.max(0, (img.h * zoom - container.h) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

export const MapViewport = forwardRef(function MapViewport(
  { imageSrc, children, onBackgroundClick, initialZoom = 0.7, containerStyle = {} },
  ref
) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const imgDims = useRef(null); // { w, h } rendered size of the image
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragStart = useRef(null);
  const lastPan = useRef({ x: 0, y: 0 });
  const touchState = useRef(null);

  const getContainerDims = useCallback(() => {
    const el = containerRef.current;
    if (!el) return null;
    return { w: el.clientWidth, h: el.clientHeight };
  }, []);

  const clamp = useCallback((x, y, z) => {
    return clampPan(x, y, z ?? zoom, getContainerDims(), imgDims.current);
  }, [zoom, getContainerDims]);

  // Reset zoom/pan po zmianie obrazu
  useEffect(() => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
    setImgLoaded(false);
    imgDims.current = null;
  }, [imageSrc, initialZoom]);

  // Eksport metod do rodzica
  useImperativeHandle(ref, () => ({
    zoomIn:  () => setZoom(z => {
      const nz = Math.min(ZOOM_MAX, z + ZOOM_STEP);
      setPan(p => clampPan(p.x, p.y, nz, getContainerDims(), imgDims.current));
      return nz;
    }),
    zoomOut: () => setZoom(z => {
      const nz = Math.max(ZOOM_MIN, z - ZOOM_STEP);
      setPan(p => clampPan(p.x, p.y, nz, getContainerDims(), imgDims.current));
      return nz;
    }),
    reset:   () => { setZoom(initialZoom); setPan({ x: 0, y: 0 }); },
    panTo:   (xPct, yPct) => {
      const dims = imgDims.current;
      if (!dims) return;
      const rawX = -(xPct / 100 - 0.5) * dims.w * zoom;
      const rawY = -(yPct / 100 - 0.5) * dims.h * zoom;
      setPan(clampPan(rawX, rawY, zoom, getContainerDims(), dims));
    },
    getZoom: () => zoom,
  }), [zoom, initialZoom, getContainerDims]);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(false);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPan.current = pan;
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setIsDragging(true);
    const raw = { x: lastPan.current.x + dx, y: lastPan.current.y + dy };
    setPan(clampPan(raw.x, raw.y, zoom, getContainerDims(), imgDims.current));
  }, [zoom, getContainerDims]);

  const onMouseUp = useCallback((e) => {
    const wasDragging = isDragging;
    dragStart.current = null;
    setIsDragging(false);
    if (!wasDragging) onBackgroundClick?.();
  }, [isDragging, onBackgroundClick]);

  const onMouseLeave = useCallback(() => {
    if (dragStart.current) {
      dragStart.current = null;
      setIsDragging(false);
    }
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────────────────

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;

    setZoom(prevZoom => {
      const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prevZoom + delta));
      const scale = nextZoom / prevZoom;
      setPan(prevPan => {
        const raw = {
          x: cursorX + (prevPan.x - cursorX) * scale,
          y: cursorY + (prevPan.y - cursorY) * scale,
        };
        return clampPan(raw.x, raw.y, nextZoom, getContainerDims(), imgDims.current);
      });
      return nextZoom;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Touch handlers ────────────────────────────────────────────────────────

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      touchState.current = {
        type: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPan: pan,
        moved: false,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      touchState.current = {
        type: 'pinch',
        startDist: Math.hypot(dx, dy),
        startZoom: zoom,
        startPan: pan,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, [pan, zoom]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!touchState.current) return;
    if (touchState.current.type === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchState.current.startX;
      const dy = e.touches[0].clientY - touchState.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) touchState.current.moved = true;
      const raw = { x: touchState.current.startPan.x + dx, y: touchState.current.startPan.y + dy };
      setPan(clampPan(raw.x, raw.y, zoom, getContainerDims(), imgDims.current));
    } else if (touchState.current.type === 'pinch' && e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / touchState.current.startDist;
      const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, touchState.current.startZoom * scale));
      setZoom(nextZoom);
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (touchState.current?.type === 'pan' && !touchState.current.moved) {
      onBackgroundClick?.();
    }
    if (e.touches.length === 0) touchState.current = null;
  }, [onBackgroundClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [onTouchMove]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: '#030508',
        userSelect: 'none',
        touchAction: 'none',
        ...containerStyle,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Transformowany kontener mapy */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        {/* Obraz mapy */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Mapa"
          draggable={false}
          onLoad={(e) => {
            const { offsetWidth: w, offsetHeight: h } = e.currentTarget;
            imgDims.current = { w, h };
            setPan(p => clampPan(p.x, p.y, zoom, getContainerDims(), { w, h }));
            setImgLoaded(true);
          }}
          style={{
            display: 'block',
            maxWidth: 'none',
            width: 'min(90vw, 1400px)',
            height: 'auto',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Warstwa markerów — nakładana na obraz */}
        {imgLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {!imgLoaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(197,159,78,0.6)', fontSize: '0.85rem',
          fontFamily: 'var(--font-heading)', letterSpacing: '0.2em',
        }}>
          ᚱ ŁADOWANIE MAPY ᚱ
        </div>
      )}
    </div>
  );
});
