import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../context/SoundContext';
import { useSchool } from '../context/SchoolContext';
import {
  RUNIC_ALPHABETS,
  ANCIENT_RUNES,
  RUNIC_ACHIEVEMENTS
} from '../data/ancientRunesData';
import { evaluateRuneDrawing } from '../utils/runeRecognition';
import {
  Sparkles,
  X,
  RotateCcw,
  Zap,
  CheckCircle,
  Eye,
  EyeOff,
  Award,
  Clock,
  Trophy,
  Scroll,
  Play
} from 'lucide-react';

export const RuneCalligraphyModal = ({ isOpen, onClose }) => {
  const {
    playWandSwoosh,
    playRuneChime,
    playSortingFanfare
  } = useSound();

  const {
    addNotification,
    showNotification,
    awardHousePoints,
    addCurrency,
    addInventoryItem,
    currentUser,
    updateCurrentUser
  } = useSchool();

  // Active Main Navigation Tab: 'runes' | 'speed-trial' | 'achievements'
  const [activeTab, setActiveTab] = useState('runes');

  // ----------------------------------------------------
  // 1. RUNE CALLIGRAPHY STATE
  // ----------------------------------------------------
  const [selectedAlphabet, setSelectedAlphabet] = useState('all');
  const [selectedRuneId, setSelectedRuneId] = useState('futhark-fehu');
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [selectedInk, setSelectedInk] = useState('#f59e0b'); // gold
  const [currentStrokes, setCurrentStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState([]);
  const [runeEvalResult, setRuneEvalResult] = useState(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // ----------------------------------------------------
  // 2. SPEED TRIAL (RUNIC GAUNTLET) STATE
  // ----------------------------------------------------
  const [trialActive, setTrialActive] = useState(false);
  const [trialDifficulty, setTrialDifficulty] = useState('adept'); // 'novice' (3 runes) | 'adept' (5) | 'master' (7)
  const [trialQueue, setTrialQueue] = useState([]);
  const [trialCurrentIdx, setTrialCurrentIdx] = useState(0);
  const [trialTimeLeft, setTrialTimeLeft] = useState(60);
  const [trialScore, setTrialScore] = useState(0);
  const [trialFinished, setTrialFinished] = useState(false);

  // ----------------------------------------------------
  // 3. STATS & ACHIEVEMENTS STATE (Persisted in localStorage)
  // ----------------------------------------------------
  const [runicStats, setRunicStats] = useState(() => {
    try {
      const saved = localStorage.getItem('durmstrang_runic_stats');
      return saved ? JSON.parse(saved) : {
        totalRunesDrawn: 0,
        drawnByAlphabet: {},
        drawnRunesList: [],
        maxAccuracy: 0,
        speedTrialBestScore: 0
      };
    } catch (_) {
      return { totalRunesDrawn: 0, drawnByAlphabet: {}, drawnRunesList: [], maxAccuracy: 0, speedTrialBestScore: 0 };
    }
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('durmstrang_runic_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const canvasRef = useRef(null);
  const autoEvalTimerRef = useRef(null);
  const trialTimerRef = useRef(null);

  // Available Ink Colors
  const INK_PALETTE = [
    { name: 'Złoto Futharku', color: '#f59e0b', glow: '#ffe599' },
    { name: 'Błękit Zmarzliny', color: '#38bdf8', glow: '#7dd3fc' },
    { name: 'Ogień Berserka', color: '#ef4444', glow: '#fca5a5' },
    { name: 'Cień Ravnheimu', color: '#a855f7', glow: '#d8b4fe' },
    { name: 'Szmaragd Puszczy', color: '#22c55e', glow: '#86efac' }
  ];

  // Selected Rune Object
  const selectedRune = ANCIENT_RUNES.find(r => r.id === selectedRuneId) || ANCIENT_RUNES[0];

  // Filtered runes list
  const filteredRunes = selectedAlphabet === 'all'
    ? ANCIENT_RUNES
    : ANCIENT_RUNES.filter(r => r.alphabetId === selectedAlphabet);

  // Re-draw Canvas when state changes
  useEffect(() => {
    if (!isOpen) return;
    renderCanvas();
  }, [isOpen, activeTab, currentStrokes, currentStrokePoints, showGhostGuide, selectedRune, selectedInk]);

  // Speed trial timer tick
  useEffect(() => {
    if (!trialActive) return;
    trialTimerRef.current = setInterval(() => {
      setTrialTimeLeft(t => {
        if (t <= 1) {
          finishSpeedTrial(trialScore);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(trialTimerRef.current);
  }, [trialActive, trialScore]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // CANVAS RENDERING (SMOOTH BEZIER CURVES & CALLIGRAPHY)
  // ----------------------------------------------------
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Runic Grid & Subtle Guides
    ctx.strokeStyle = 'rgba(197, 159, 78, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Draw Authentic Glowing Glyph Backdrop & Dashed Stencil Guide
    if (selectedRune) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 150px "Cinzel Decorative", "Segoe UI Symbol", "Noto Sans", "Times New Roman", serif';

      // 2a. Soft glowing inner body
      ctx.fillStyle = showGhostGuide ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)';
      ctx.shadowColor = showGhostGuide ? 'rgba(245, 158, 11, 0.6)' : 'transparent';
      ctx.shadowBlur = showGhostGuide ? 25 : 0;
      ctx.fillText(selectedRune.symbol, w / 2, h / 2 + 10);

      // 2b. Crisp glowing dashed stencil tracing the EXACT curves of the glyph
      if (showGhostGuide && (activeTab === 'runes' || activeTab === 'speed-trial')) {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.shadowColor = '#ffe599';
        ctx.shadowBlur = 12;
        ctx.strokeText(selectedRune.symbol, w / 2, h / 2 + 10);
      }
      ctx.restore();
    }

    // 4. Helper function to draw smooth fluid strokes using Quadratic Bezier curves
    const drawSmoothStroke = (pts, color, glow, baseWidth = 7) => {
      if (!pts || pts.length === 0) return;
      if (pts.length === 1) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, baseWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = glow;
        ctx.fill();
        ctx.restore();
        return;
      }

      // Outer soft aura
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = baseWidth + 5;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = glow;
      ctx.globalAlpha = 0.45;

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

      // Core vibrant ink stroke
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = baseWidth;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glow;

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

    // 5. Draw All Completed User Strokes
    const inkObj = INK_PALETTE.find(i => i.color === selectedInk) || INK_PALETTE[0];
    currentStrokes.forEach(stroke => {
      drawSmoothStroke(stroke, selectedInk, inkObj.glow, 7);
    });

    // 6. Draw Currently Active Drawing Stroke
    if (currentStrokePoints.length > 0) {
      drawSmoothStroke(currentStrokePoints, selectedInk, inkObj.glow, 7);
    }
  };

  // ----------------------------------------------------
  // DRAWING HANDLERS
  // ----------------------------------------------------
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    if (autoEvalTimerRef.current) clearTimeout(autoEvalTimerRef.current);

    const pos = getCanvasPos(e);
    setIsDrawing(true);
    setCurrentStrokePoints([pos]);
    setRuneEvalResult(null);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const pos = getCanvasPos(e);
    setCurrentStrokePoints(prev => [...prev, pos]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePoints.length > 1) {
      const updatedStrokes = [...currentStrokes, currentStrokePoints];
      setCurrentStrokes(updatedStrokes);
      setCurrentStrokePoints([]);

      // Auto-evaluate after 1.1s of idle
      autoEvalTimerRef.current = setTimeout(() => {
        evaluateCurrentRune(updatedStrokes);
      }, 1100);
    }
  };

  const clearCanvas = () => {
    if (autoEvalTimerRef.current) clearTimeout(autoEvalTimerRef.current);
    setCurrentStrokes([]);
    setCurrentStrokePoints([]);
    setRuneEvalResult(null);
    setSuccessAnimation(false);
    renderCanvas();
  };

  const undoLastStroke = () => {
    if (currentStrokes.length === 0) return;
    if (autoEvalTimerRef.current) clearTimeout(autoEvalTimerRef.current);
    setCurrentStrokes(prev => prev.slice(0, -1));
    setRuneEvalResult(null);
  };

  // ----------------------------------------------------
  // EVALUATION & GAMIFICATION LOGIC
  // ----------------------------------------------------
  const evaluateCurrentRune = (strokesToEval = currentStrokes) => {
    const canvas = canvasRef.current;
    if (!canvas || strokesToEval.length === 0) return;

    const result = evaluateRuneDrawing(strokesToEval, canvas.width, canvas.height, selectedRune);
    setRuneEvalResult(result);

    if (result.isMatch) {
      handleSuccessfulRuneDraw(result);
    } else {
      playWandSwoosh();
    }
  };

  const handleSuccessfulRuneDraw = (evalResult) => {
    playRuneChime();
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 2000);

    const houseKey = currentUser?.house || currentUser?.house_id || null;
    const accuracy = evalResult.accuracy || 75;

    // Base rewards
    const ptsAwarded = accuracy >= 90 ? 20 : 10;
    const currAwarded = accuracy >= 90 ? 15 : 10;

    awardHousePoints(houseKey, ptsAwarded, `Kaligrafia Runy: ${selectedRune.name} (${selectedRune.symbol}) - ${accuracy}% precyzji`);
    addCurrency(currAwarded, `Wyrycie pradawnej runy ${selectedRune.name}`);

    // Update Stats
    const nextStats = {
      totalRunesDrawn: (runicStats.totalRunesDrawn || 0) + 1,
      drawnByAlphabet: {
        ...(runicStats.drawnByAlphabet || {}),
        [selectedRune.alphabetId]: ((runicStats.drawnByAlphabet || {})[selectedRune.alphabetId] || 0) + 1
      },
      drawnRunesList: Array.from(new Set([...(runicStats.drawnRunesList || []), selectedRune.id])),
      maxAccuracy: Math.max(runicStats.maxAccuracy || 0, accuracy),
      speedTrialBestScore: runicStats.speedTrialBestScore || 0
    };

    setRunicStats(nextStats);
    try {
      localStorage.setItem('durmstrang_runic_stats', JSON.stringify(nextStats));
    } catch (_) {}

    // Check & Unlock Achievements
    checkAchievements(nextStats);

    // Speed trial advancement
    if (trialActive) {
      setTrialScore(s => s + 1);
      const nextIdx = trialCurrentIdx + 1;
      if (nextIdx < trialQueue.length) {
        setTrialCurrentIdx(nextIdx);
        setSelectedRuneId(trialQueue[nextIdx].id);
        clearCanvas();
      } else {
        finishSpeedTrial(trialScore + 1);
      }
    }
  };

  const checkAchievements = (stats) => {
    const newlyUnlocked = [];

    RUNIC_ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id)) {
        if (ach.checkUnlocked(stats)) {
          newlyUnlocked.push(ach);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      playSortingFanfare();
      const updatedUnlocked = [...unlockedAchievements, ...newlyUnlocked.map(a => a.id)];
      setUnlockedAchievements(updatedUnlocked);
      try {
        localStorage.setItem('durmstrang_runic_achievements', JSON.stringify(updatedUnlocked));
      } catch (_) {}

      newlyUnlocked.forEach(ach => {
        const houseKey = currentUser?.house || currentUser?.house_id || null;
        awardHousePoints(houseKey, ach.rewardPoints, `🏆 OSIĄGNIĘCIE: ${ach.title}`);
        addCurrency(ach.rewardCurrency, `Nagroda za osiągnięcie: ${ach.title}`);

        if (ach.rewardItem) {
          addInventoryItem({
            id: `item-ach-${ach.id}`,
            name: ach.rewardItem,
            rarity: 'legendary',
            icon: '🖋️',
            price: 200,
            description: `Święty artefakt przyznany za mistrzowskie opanowanie 5 pradawnych alfabetów w Twierdzy Durmstrang.`
          });
        }

        if (showNotification) {
          showNotification(
            `🏆 ODBLOKOWANO OSIĄGNIĘCIE: ${ach.title}!`,
            `Zdobywasz +${ach.rewardPoints} pkt Domu, +${ach.rewardCurrency} Skirnirów oraz Tytuł: „${ach.rewardTitle}”!`,
            'success'
          );
        } else if (addNotification) {
          addNotification(`🏆 Sukces! Odblokowano: ${ach.title} (+${ach.rewardPoints} pkt, Tytuł: ${ach.rewardTitle})`);
        }
      });
    }
  };

  const equipHonoraryTitle = (title) => {
    playRuneChime();
    if (updateCurrentUser) {
      updateCurrentUser({ title });
      showNotification('Założono Tytuł Honorowy', `Twój profil nosi teraz godność: „${title}”!`, 'success');
    }
  };

  // ----------------------------------------------------
  // SPEED TRIAL GAUNTLET LOGIC
  // ----------------------------------------------------
  const startSpeedTrial = () => {
    playWandSwoosh();
    clearCanvas();

    const count = trialDifficulty === 'novice' ? 3 : trialDifficulty === 'adept' ? 5 : 7;
    const time = trialDifficulty === 'novice' ? 45 : trialDifficulty === 'adept' ? 60 : 70;

    const shuffled = [...ANCIENT_RUNES].sort(() => 0.5 - Math.random());
    const queue = shuffled.slice(0, count);

    setTrialQueue(queue);
    setTrialCurrentIdx(0);
    setSelectedRuneId(queue[0].id);
    setTrialTimeLeft(time);
    setTrialScore(0);
    setTrialFinished(false);
    setTrialActive(true);
    if (trialDifficulty === 'master') {
      setShowGhostGuide(false);
    } else {
      setShowGhostGuide(true);
    }
  };

  const finishSpeedTrial = (finalScore) => {
    setTrialActive(false);
    setTrialFinished(true);
    clearInterval(trialTimerRef.current);

    const houseKey = currentUser?.house || currentUser?.house_id || null;
    const bonusPoints = finalScore * 15;
    const bonusCurrency = finalScore * 20;

    if (finalScore >= 1) {
      playSortingFanfare();
      awardHousePoints(houseKey, bonusPoints, `Próba Szybkości Run (Gauntlet): ${finalScore} ukończonych znaków`);
      addCurrency(bonusCurrency, 'Nagroda za Próbę Szybkości Kaligrafii');
      showNotification(
        'Próba Runiczna Ukończona! ⏱️',
        `Wyryłeś ${finalScore} run w limicie czasu! Zdobywasz +${bonusPoints} ${currentUser?.role === 'student' ? 'pkt Zakonu' : 'pkt osobistych'} i +${bonusCurrency} Skirnirów!`,
        'success'
      );

      const nextStats = {
        ...runicStats,
        speedTrialBestScore: Math.max(runicStats.speedTrialBestScore || 0, finalScore)
      };
      setRunicStats(nextStats);
      try {
        localStorage.setItem('durmstrang_runic_stats', JSON.stringify(nextStats));
      } catch (_) {}
      checkAchievements(nextStats);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.92)',
        backdropFilter: 'blur(14px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #131823 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.98), 0 0 35px rgba(197, 159, 78, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.65)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--gold-ancient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-glow)',
                fontSize: '1.4rem'
              }}
            >
              ᚠ
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.28rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Akademia Kaligrafii Run & Pradawnych Alfabetów
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--gold-ancient)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Święte Pismo Północy, Głagolica, Ogham & Alchemia
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#9ca3af',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0,0,0,0.4)',
            overflowX: 'auto'
          }}
        >
          <button
            onClick={() => { playWandSwoosh(); setActiveTab('runes'); clearCanvas(); }}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'runes' ? 'rgba(197, 159, 78, 0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'runes' ? '3px solid var(--gold-ancient)' : '3px solid transparent',
              color: activeTab === 'runes' ? '#ffe599' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>ᚠ</span> Kaligrafia Run (5 Alfabetów)
          </button>

          <button
            onClick={() => { playWandSwoosh(); setActiveTab('speed-trial'); clearCanvas(); }}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'speed-trial' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'speed-trial' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'speed-trial' ? '#7dd3fc' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={16} /> Próba Szybkości (Gauntlet)
          </button>

          <button
            onClick={() => { playWandSwoosh(); setActiveTab('achievements'); }}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'achievements' ? 'rgba(234, 179, 8, 0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'achievements' ? '3px solid #eab308' : '3px solid transparent',
              color: activeTab === 'achievements' ? '#fde047' : '#9ca3af',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Trophy size={16} /> Księga Osiągnięć & Tytułów ({unlockedAchievements.length}/{RUNIC_ACHIEVEMENTS.length})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.4rem', overflowY: 'auto', flex: 1 }}>

          {/* =========================================================================
              TAB 1: RUNE CALLIGRAPHY (5 ALPHABETS)
              ========================================================================= */}
          {activeTab === 'runes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Alphabet Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { playWandSwoosh(); setSelectedAlphabet('all'); }}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: selectedAlphabet === 'all' ? 'var(--gold-ancient)' : 'rgba(255,255,255,0.06)',
                    color: selectedAlphabet === 'all' ? '#000000' : '#d1d5db',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Wszystkie Alfabety ({ANCIENT_RUNES.length})
                </button>
                {RUNIC_ALPHABETS.map(alph => (
                  <button
                    key={alph.id}
                    onClick={() => {
                      playWandSwoosh();
                      setSelectedAlphabet(alph.id);
                      const first = ANCIENT_RUNES.find(r => r.alphabetId === alph.id);
                      if (first) {
                        setSelectedRuneId(first.id);
                        clearCanvas();
                      }
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: selectedAlphabet === alph.id ? alph.color : 'rgba(255,255,255,0.06)',
                      color: selectedAlphabet === alph.id ? '#000000' : '#d1d5db',
                      border: `1px solid ${alph.border}`,
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{alph.icon}</span> {alph.shortName}
                  </button>
                ))}
              </div>

              {/* Main 2-Column Layout: Left Rune Picker & Lore / Right Canvas Slate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '1.2rem' }}>

                {/* Left Column: Rune Selector & Info Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Rune Grid Selector */}
                  <div
                    style={{
                      background: 'rgba(10, 14, 22, 0.8)',
                      border: '1px solid rgba(197, 159, 78, 0.25)',
                      borderRadius: '8px',
                      padding: '0.8rem',
                      maxHeight: '160px',
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '0.5rem' }}>
                      {filteredRunes.map(rune => {
                        const isSel = rune.id === selectedRuneId;
                        const isDrawn = (runicStats.drawnRunesList || []).includes(rune.id);
                        return (
                          <button
                            key={rune.id}
                            onClick={() => {
                              playRuneChime();
                              setSelectedRuneId(rune.id);
                              clearCanvas();
                            }}
                            style={{
                              background: isSel ? 'rgba(197, 159, 78, 0.25)' : 'rgba(255,255,255,0.03)',
                              border: isSel ? '2px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              padding: '0.4rem 0.2rem',
                              color: isSel ? '#ffffff' : '#9ca3af',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ fontSize: '1.4rem', lineHeight: 1.1, color: isSel ? 'var(--gold-glow)' : '#e2e8f0' }}>
                              {rune.symbol}
                            </span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55px' }}>
                              {rune.name}
                            </span>
                            {isDrawn && (
                              <span style={{ position: 'absolute', top: '2px', right: '3px', color: '#22c55e', fontSize: '0.6rem' }}>
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Selected Rune Dossier */}
                  {selectedRune && (
                    <div
                      style={{
                        background: 'rgba(15, 20, 30, 0.9)',
                        border: '1px solid var(--gold-ancient)',
                        borderRadius: '8px',
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '8px',
                              background: 'rgba(197, 159, 78, 0.15)',
                              border: '2px solid var(--gold-ancient)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2.2rem',
                              color: 'var(--gold-glow)',
                              boxShadow: '0 0 15px rgba(197, 159, 78, 0.3)'
                            }}
                          >
                            {selectedRune.symbol}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                              {selectedRune.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                              Fonetyka: „{selectedRune.sound}” • Żywioł: {selectedRune.element}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: selectedRune.difficulty === 'Łatwa' ? 'rgba(34, 197, 94, 0.2)' : selectedRune.difficulty === 'Średnia' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: selectedRune.difficulty === 'Łatwa' ? '#4ade80' : selectedRune.difficulty === 'Średnia' ? '#fde047' : '#f87171',
                            fontWeight: 700
                          }}
                        >
                          {selectedRune.difficulty}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        „{selectedRune.meaning}”
                      </div>

                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem', lineHeight: 1.45 }}>
                        {selectedRune.desc}
                      </p>

                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '0.6rem 0.8rem',
                          marginTop: '0.3rem'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Sparkles size={12} /> Instrukcja Pociągnięć Różdżki:
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                          {selectedRune.guideHint}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Interactive Drawing Slate */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {/* Canvas Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {/* Ink Palette */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Atrament:</span>
                      {INK_PALETTE.map(ink => (
                        <button
                          key={ink.color}
                          onClick={() => { playWandSwoosh(); setSelectedInk(ink.color); }}
                          title={ink.name}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: ink.color,
                            border: selectedInk === ink.color ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.5)',
                            boxShadow: selectedInk === ink.color ? `0 0 10px ${ink.glow}` : 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        />
                      ))}
                    </div>

                    {/* Ghost Guide Toggle & Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setShowGhostGuide(!showGhostGuide)}
                        style={{
                          background: showGhostGuide ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                          border: showGhostGuide ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                          color: showGhostGuide ? '#38bdf8' : '#9ca3af',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {showGhostGuide ? <Eye size={12} /> : <EyeOff size={12} />}
                        {showGhostGuide ? 'Kontur: Włączony' : 'Kontur: Ukryty'}
                      </button>

                      <button
                        onClick={undoLastStroke}
                        disabled={currentStrokes.length === 0}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: currentStrokes.length > 0 ? '#d1d5db' : '#4b5563',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          cursor: currentStrokes.length > 0 ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Cofnij
                      </button>

                      <button
                        onClick={clearCanvas}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: '#9ca3af',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <RotateCcw size={12} /> Wyczyść
                      </button>
                    </div>
                  </div>

                  {/* The Drawing Canvas Box */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '280px',
                      background: 'radial-gradient(circle at center, #161c28 0%, #080b10 100%)',
                      border: `2px solid ${successAnimation ? '#4ade80' : 'rgba(197, 159, 78, 0.4)'}`,
                      borderRadius: '8px',
                      boxShadow: successAnimation
                        ? '0 0 35px rgba(74, 222, 128, 0.4), inset 0 0 30px rgba(74, 222, 128, 0.2)'
                        : 'inset 0 0 30px rgba(0,0,0,0.95), 0 0 15px rgba(197, 159, 78, 0.1)',
                      cursor: 'crosshair',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={280}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                    />

                    {/* Watermark Rune in Background */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '9rem',
                        color: 'rgba(255, 255, 255, 0.02)',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        fontFamily: 'serif'
                      }}
                    >
                      {selectedRune.symbol}
                    </div>

                    {/* Success Sparkle Flash */}
                    {successAnimation && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.25) 0%, transparent 70%)',
                          pointerEvents: 'none',
                          animation: 'pulse 1s infinite'
                        }}
                      />
                    )}
                  </div>

                  {/* Manual Trigger / Evaluation Button */}
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={() => evaluateCurrentRune()}
                      disabled={currentStrokes.length === 0}
                      className="btn-durmstrang"
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        background: currentStrokes.length > 0
                          ? 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)'
                          : 'rgba(255,255,255,0.05)',
                        color: currentStrokes.length > 0 ? '#06090e' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        cursor: currentStrokes.length > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <Zap size={15} /> Sprawdź Wyrycie Runy
                    </button>
                  </div>

                  {/* Evaluation Result Banner */}
                  {runeEvalResult && (
                    <div
                      style={{
                        background: runeEvalResult.isMatch ? 'rgba(15, 30, 20, 0.95)' : 'rgba(35, 15, 15, 0.95)',
                        border: `1.5px solid ${runeEvalResult.isMatch ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        boxShadow: `0 0 20px ${runeEvalResult.isMatch ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        animation: 'fadeIn 0.25s ease-out'
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: runeEvalResult.isMatch ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: runeEvalResult.isMatch ? '#4ade80' : '#f87171'
                        }}
                      >
                        {runeEvalResult.isMatch ? <CheckCircle size={20} /> : <X size={20} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: runeEvalResult.isMatch ? '#4ade80' : '#f87171', textTransform: 'uppercase' }}>
                            {runeEvalResult.isMatch ? `⚡ ZNAK AKTYWOWANY (+${runeEvalResult.accuracy >= 90 ? '20' : '10'} PKT)` : '⚠️ NIEPEŁNE DOPASOWANIE'}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                            Precyzja: {runeEvalResult.accuracy}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#e2e8f0', marginTop: '0.15rem' }}>
                          {runeEvalResult.feedback}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SPEED TRIAL (RUNIC GAUNTLET)
              ========================================================================= */}
          {activeTab === 'speed-trial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {!trialActive && !trialFinished && (
                <div
                  style={{
                    background: 'rgba(15, 20, 30, 0.8)',
                    border: '1px solid var(--gold-ancient)',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.2rem'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '2px solid #38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}
                  >
                    <Clock size={32} />
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 0.4rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
                      Próba Szybkości & Błyskawicznego Wyrycia (Runic Gauntlet)
                    </h3>
                    <p style={{ margin: 0, color: '#9ca3af', maxWidth: '600px', fontSize: '0.9rem' }}>
                      Zgromadź skupienie! Bot wylosuje serię run z różnych pradawnych alfabetów. Twoim zadaniem jest narysowanie jak największej liczby poprawnych znaków przed upływem czasu.
                    </p>
                  </div>

                  {/* Difficulty selector */}
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    {[
                      { id: 'novice', label: 'Nowicjusz (3 Runy • 45s)', hint: 'Z konturem pomocniczym' },
                      { id: 'adept', label: 'Adept Północy (5 Run • 60s)', hint: 'Z konturem pomocniczym' },
                      { id: 'master', label: 'Arcymistrz (7 Run • 70s)', hint: 'BEZ KONTURU • Czysta Pamięć!' }
                    ].map(d => (
                      <button
                        key={d.id}
                        onClick={() => setTrialDifficulty(d.id)}
                        style={{
                          background: trialDifficulty === d.id ? 'rgba(197, 159, 78, 0.25)' : 'rgba(0,0,0,0.4)',
                          border: trialDifficulty === d.id ? '2px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '0.8rem 1.2rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ color: trialDifficulty === d.id ? '#ffffff' : '#9ca3af', fontWeight: 700, fontSize: '0.88rem' }}>
                          {d.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: trialDifficulty === d.id ? 'var(--gold-glow)' : '#6b7280', marginTop: '0.2rem' }}>
                          {d.hint}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={startSpeedTrial}
                    className="btn-durmstrang"
                    style={{
                      padding: '0.8rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      color: '#041019',
                      boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <Play size={18} /> Rozpocznij Wyzwanie Szybkości
                  </button>
                </div>
              )}

              {/* Active Trial Screen */}
              {trialActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Status Bar */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '0.8rem 1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                        Postęp: <strong>{trialCurrentIdx + 1}</strong> / {trialQueue.length}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#4ade80' }}>
                        Trafienia: <strong>{trialScore}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: trialTimeLeft < 15 ? '#ef4444' : '#38bdf8', fontWeight: 800, fontSize: '1.2rem' }}>
                      <Clock size={18} /> {trialTimeLeft}s
                    </div>
                  </div>

                  {/* Target Rune Card & Drawing Slate */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem' }}>
                    <div
                      style={{
                        background: 'rgba(15, 20, 30, 0.9)',
                        border: '1px solid #38bdf8',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                        CEL DO WYRYCIA #{trialCurrentIdx + 1}
                      </span>
                      <div style={{ fontSize: '5rem', lineHeight: 1, color: '#ffffff', textShadow: '0 0 25px rgba(56, 189, 248, 0.6)' }}>
                        {selectedRune.symbol}
                      </div>
                      <h3 style={{ margin: 0, color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
                        {selectedRune.name}
                      </h3>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.82rem' }}>
                        {selectedRune.guideHint}
                      </p>
                    </div>

                    {/* Canvas for trial */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '240px',
                          background: 'radial-gradient(circle at center, #161c28 0%, #080b10 100%)',
                          border: '2px solid rgba(56, 189, 248, 0.5)',
                          borderRadius: '8px',
                          cursor: 'crosshair',
                          overflow: 'hidden'
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={240}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => evaluateCurrentRune()}
                          className="btn-durmstrang"
                          style={{
                            flex: 1,
                            padding: '0.6rem',
                            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                            color: '#05121e',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}
                        >
                          ⚡ Zatwierdź Wyrycie
                        </button>
                        <button
                          onClick={clearCanvas}
                          style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            color: '#9ca3af',
                            padding: '0.6rem 0.9rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Wyczyść
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Finished Summary Screen */}
              {trialFinished && (
                <div
                  style={{
                    background: 'rgba(15, 25, 35, 0.9)',
                    border: '2px solid var(--gold-ancient)',
                    borderRadius: '8px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    animation: 'fadeIn 0.3s ease-out'
                  }}
                >
                  <Trophy size={48} color="var(--gold-glow)" />
                  <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>
                    Próba Zakończona!
                  </h3>
                  <div style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>
                    Twój wynik: <strong style={{ color: 'var(--gold-glow)' }}>{trialScore}</strong> poprawnie wyrytych run
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4ade80' }}>
                    Przyznano: +{trialScore * 15} {currentUser?.role === 'student' ? 'Punktów dla Zakonu' : 'punktów osobistych'} oraz +{trialScore * 20} Skirnirów!
                  </div>

                  <button
                    onClick={() => { setTrialFinished(false); }}
                    className="btn-durmstrang"
                    style={{ marginTop: '0.8rem', padding: '0.7rem 1.8rem' }}
                  >
                    Spróbuj Ponownie
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: ACHIEVEMENTS & HONORARY TITLES
              ========================================================================= */}
          {activeTab === 'achievements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Progress Summary Header */}
              <div
                style={{
                  background: 'rgba(15, 20, 30, 0.8)',
                  border: '1px solid var(--gold-ancient)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                    Kronika Osiągnięć Kaligrafii Run
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    Wyryto łącznie: <strong>{runicStats.totalRunesDrawn || 0}</strong> run • Najwyższa precyzja: <strong>{runicStats.maxAccuracy || 0}%</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Odblokowane:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-glow)' }}>
                      {unlockedAchievements.length} / {RUNIC_ACHIEVEMENTS.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
                {RUNIC_ACHIEVEMENTS.map(ach => {
                  const isUnlocked = unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      style={{
                        background: isUnlocked ? 'rgba(20, 28, 40, 0.9)' : 'rgba(10, 14, 20, 0.6)',
                        border: isUnlocked ? '1.5px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.8rem',
                        boxShadow: isUnlocked ? '0 0 20px rgba(197, 159, 78, 0.15)' : 'none',
                        opacity: isUnlocked ? 1 : 0.75
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: isUnlocked ? 'rgba(197, 159, 78, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: isUnlocked ? '1px solid var(--gold-ancient)' : '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            color: isUnlocked ? 'var(--gold-glow)' : '#6b7280'
                          }}
                        >
                          {ach.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: isUnlocked ? '#4ade80' : '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>
                              {isUnlocked ? '✓ ODBLOKOWANE' : '🔒 ZABLOKOWANE'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#c59f4e' }}>
                              +{ach.rewardPoints} HP • +{ach.rewardCurrency} Skr
                            </span>
                          </div>

                          <h4 style={{ margin: '0.2rem 0', color: isUnlocked ? '#ffffff' : '#9ca3af', fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>
                            {ach.title}
                          </h4>

                          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.78rem', lineHeight: 1.4 }}>
                            {ach.desc}
                          </p>
                        </div>
                      </div>

                      {/* Reward Footer */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          paddingTop: '0.6rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.74rem', color: 'var(--gold-glow)', fontWeight: 600 }}>
                          Tytuł: „{ach.rewardTitle}”
                        </span>

                        {isUnlocked && (
                          <button
                            onClick={() => equipHonoraryTitle(ach.rewardTitle)}
                            style={{
                              background: 'rgba(197, 159, 78, 0.15)',
                              border: '1px solid var(--gold-ancient)',
                              color: 'var(--gold-glow)',
                              borderRadius: '4px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            Załóż Tytuł
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
