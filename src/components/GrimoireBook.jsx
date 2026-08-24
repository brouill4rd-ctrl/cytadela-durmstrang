import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../context/SoundContext';
import { useSchool } from '../context/SchoolContext';
import {
  BookOpen,
  Sparkles,
  Flame,
  Shield,
  X,
  RotateCcw,
  Zap,
  CheckCircle,
  Eye
} from 'lucide-react';

export const GrimoireBook = ({ isOpen, onClose }) => {
  const { playWandSwoosh, playRuneChime } = useSound();
  const { addNotification, awardHousePoints, currentUser } = useSchool();

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [castSpellResult, setCastSpellResult] = useState(null);
  const [activeTab, setActiveTab] = useState('gestures'); // 'gestures' | 'spells'

  const spellsCatalog = [
    {
      id: 'lumos',
      name: 'Lumos Borealis',
      incantation: 'LUMOS NORDICA',
      type: 'Magia Światła',
      gesture: 'Okrąg (Koło)',
      desc: 'Przyzywa pasmo zielonkawej zorzy polarnej, rozpraszając nawet najgłębszy mrok korytarzy lochów.',
      color: '#4ade80'
    },
    {
      id: 'ignis',
      name: 'Płomień Berserka',
      incantation: 'IGNIS FUROR',
      type: 'Czarna Magia i Walka',
      gesture: 'Trójkąt (Piramida)',
      desc: 'Wywodzi z rękojeści różdżki szkarłatny snop ognia, zdolny stopić pancerze i spopielić lodowe tarcze.',
      color: '#f87171'
    },
    {
      id: 'protego',
      name: 'Skalny Bastion',
      incantation: 'BASTION BAZALTU',
      type: 'Magia Obronna',
      gesture: 'Pozioma Kreska / Tarcza',
      desc: 'Formuje przed czarodziejem niewidzialną, niewzruszoną barierę z gęstego, nordyckiego powietrza.',
      color: '#60a5fa'
    },
    {
      id: 'galdr',
      name: 'Runiczny Szron',
      incantation: 'IS-GALDR',
      type: 'Rytuały Runiczne',
      gesture: 'Zygzak (Fale)',
      desc: 'Skrapla wilgoć w powietrzu, natychmiastowo zamrażając podłoże pod stopami wrogów.',
      color: '#38bdf8'
    }
  ];

  useEffect(() => {
    if (!isOpen || activeTab !== 'gestures') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#e5c07b';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffe599';
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const renderWandStroke = (pts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pts.length < 2) return;

    // Outer wand aura
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e5c07b';
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#ffe599';
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();

    // Core bright beam
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff2b2';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    const newPts = [{ x, y }];
    setPoints(newPts);
    setCastSpellResult(null);
    renderWandStroke(newPts);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPts = [...points, { x, y }];
    setPoints(newPts);
    renderWandStroke(newPts);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    recognizeGesture(points);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setCastSpellResult(null);
  };

  const recognizeGesture = (pts) => {
    if (pts.length < 10) return;

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    const startPoint = pts[0];
    const endPoint = pts[pts.length - 1];
    const distanceStartEnd = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

    let recognized = null;

    // Check Circle (endpoints close together, good width and height ratio)
    if (distanceStartEnd < 50 && width > 50 && height > 50 && Math.abs(width - height) < 90) {
      recognized = spellsCatalog[0]; // Lumos Borealis
    }
    // Check Horizontal Line (wide, low height)
    else if (width > 90 && height < 40) {
      recognized = spellsCatalog[2]; // Protego
    }
    // Check Triangle / Diagonal (large height, moderate width)
    else if (height > 70 && width > 50) {
      recognized = spellsCatalog[1]; // Ignis
    }
    // Fallback Zig-zag / Galdr
    else if (width > 60) {
      recognized = spellsCatalog[3]; // Galdr
    }

    if (recognized) {
      playWandSwoosh();
      playRuneChime();
      setCastSpellResult(recognized);
      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 5, `Rzucenie czaru ${recognized.name} w Grimoire`);
      if (addNotification) addNotification(`✨ Pomyślnie rzucono zaklęcie: ${recognized.name} (+5 pkt dla Zakonu)!`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #161b26 0%, #0c0f16 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.2)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                Grimoire Czarodzieja • Księga Zaklęć i Gestów
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', letterSpacing: '0.05em' }}>
                ARKANA TWIERDZY MAGII DURMSTRANG (TMD)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.3)' }}>
          <button
            onClick={() => setActiveTab('gestures')}
            style={{
              flex: 1,
              padding: '0.8rem',
              background: activeTab === 'gestures' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'gestures' ? '2px solid var(--gold-ancient)' : 'none',
              color: activeTab === 'gestures' ? '#ffe599' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Zap size={16} /> Tablica Gestów Różdżki
          </button>
          <button
            onClick={() => setActiveTab('spells')}
            style={{
              flex: 1,
              padding: '0.8rem',
              background: activeTab === 'spells' ? 'rgba(197, 159, 78, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'spells' ? '2px solid var(--gold-ancient)' : 'none',
              color: activeTab === 'spells' ? '#ffe599' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <BookOpen size={16} /> Kodeks Zaklęć i Rytuałów
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'gestures' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 0.3rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                  Nakreśl Gest Różdżki na Kamiennej Tablicy
                </h4>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>
                  Przytrzymaj lewy przycisk myszy i narysuj kształt zaklęcia (Koło = Lumos, Kreska = Protego, Trójkąt = Ignis, Zygzak = Szron).
                </p>
              </div>

              {/* Drawing Slate Canvas */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '540px',
                  height: '280px',
                  background: 'radial-gradient(circle, #1c2331 0%, #0b0e14 100%)',
                  border: '2px solid rgba(197, 159, 78, 0.5)',
                  borderRadius: '8px',
                  boxShadow: 'inset 0 0 25px rgba(0,0,0,0.9), 0 0 15px rgba(197, 159, 78, 0.15)',
                  cursor: 'crosshair'
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={540}
                  height={280}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ width: '100%', height: '100%' }}
                />

                {/* Floating Runic Watermark */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '6rem',
                    color: 'rgba(255, 255, 255, 0.03)',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  ᛏ
                </div>

                {/* Clear Canvas Button */}
                <button
                  onClick={clearCanvas}
                  type="button"
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#9ca3af',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RotateCcw size={12} /> Wyczyść
                </button>
              </div>

              {/* Cast Result Box */}
              {castSpellResult && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '540px',
                    background: 'rgba(15, 25, 20, 0.9)',
                    border: `2px solid ${castSpellResult.color}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: `0 0 20px ${castSpellResult.color}44`,
                    animation: 'fadeIn 0.3s ease-out'
                  }}
                >
                  <div
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: `${castSpellResult.color}22`,
                      border: `1px solid ${castSpellResult.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: castSpellResult.color
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: castSpellResult.color, textTransform: 'uppercase', fontWeight: 700 }}>
                      ⚡ SUKCES! ZAKLĘCIE ROZPOZNANE (+5 PKT DLA ZAKONU)
                    </span>
                    <h4 style={{ margin: '0.1rem 0', color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
                      {castSpellResult.name} ({castSpellResult.incantation})
                    </h4>
                    <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.85rem' }}>
                      {castSpellResult.desc}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Spells Catalog Tab */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {spellsCatalog.map((spell) => (
                <div
                  key={spell.id}
                  style={{
                    background: 'rgba(15, 20, 28, 0.7)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    borderRadius: '8px',
                    padding: '1.2rem',
                    borderLeft: `4px solid ${spell.color}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', color: spell.color, textTransform: 'uppercase', fontWeight: 700 }}>
                      {spell.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Gest: {spell.gesture}
                    </span>
                  </div>
                  <h4 style={{ margin: '0.4rem 0 0.2rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                    {spell.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-ancient)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    „{spell.incantation}”
                  </div>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {spell.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
