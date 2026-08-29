import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crown, Shield, Swords, X, RotateCcw, HelpCircle, ChevronDown, Bot, Users } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { api } from '../api';
import {
  createInitialState,
  getLegalMoves,
  getAllLegalMoves,
  applyMove,
  chooseAiMove,
  isCorner,
  isThrone,
} from '../game/hnefataflRules';

// ── Constants ──────────────────────────────────────────────────────────────────
const DIFF_LABELS = { uczen: 'Uczeń Skalda', einar: 'Skald Einar', jarl: 'Jarl Widmowej Tarczy' };
const DIFF_DELAYS = { uczen: 500, einar: 750, jarl: 1000 };
const COL_LABELS = ['A','B','C','D','E','F','G'];
const ROW_LABELS = ['1','2','3','4','5','6','7'];
const GOLD = '#c59f4e';

function cellLabel(r, c) { return `${COL_LABELS[c]}${ROW_LABELS[r]}`; }

// ── Piece icon ────────────────────────────────────────────────────────────────
function Piece({ type }) {
  if (type === 'K') return <Crown size={18} aria-hidden="true" style={{ color: '#f0c040', filter: 'drop-shadow(0 0 3px #f0c04088)', flexShrink: 0 }} />;
  if (type === 'D') return <Shield size={16} aria-hidden="true" style={{ color: '#60a5fa', flexShrink: 0 }} />;
  if (type === 'A') return <Swords size={16} aria-hidden="true" style={{ color: '#f87171', flexShrink: 0 }} />;
  return null;
}

// ── Rules panel ───────────────────────────────────────────────────────────────
function RulesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ color: '#c9d1de', fontSize: '0.8rem', lineHeight: 1.55 }}>
      <p style={{ margin: '0 0 0.5rem' }}>
        <strong style={{ color: '#f87171' }}>Napastnicy</strong> ruszają pierwsi. Piony przesuwają się o dowolną liczbę
        pustych pól w pionie lub poziomie. Bicie: zaciśnięcie piona między dwoma wrogimi.{' '}
        <strong style={{ color: '#4ade80' }}>Straż wygrywa</strong> gdy król dotrze do narożnika ✦.{' '}
        <strong style={{ color: '#f87171' }}>Cienie wygrywają</strong> gdy pojmą króla. Tylko król wchodzi na Tron i Bramy.
      </p>
      <button onClick={() => setOpen(v => !v)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', borderRadius: 4, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /> Jak pojmać króla?
      </button>
      {open && (
        <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem' }}>
          <li><strong>Na Tronie</strong> — 4 napastników po każdej stronie.</li>
          <li><strong>Obok Tronu</strong> — 3 napastników + pusty Tron jako czwarta strona.</li>
          <li><strong>Gdzie indziej</strong> — zacisk dwóch napastników po przeciwnych stronach.</li>
        </ol>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const HnefataflModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addCurrency, addNotification } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();

  // ── Setup ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]         = useState('setup');
  const [showRules, setShowRules] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [mode, setMode]           = useState('ai');
  const [difficulty, setDifficulty] = useState('einar');
  const [playerSide, setPlayerSide] = useState('defenders');

  // ── Game render state ─────────────────────────────────────────────────────
  const [gameState, setGameState]     = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [legalDests, setLegalDests]   = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [fadingCells, setFadingCells] = useState([]);
  const [lastMove, setLastMove]       = useState(null);
  const [kingThreat, setKingThreat]   = useState(false);
  const [flashResult, setFlashResult] = useState(null);
  const [rewardResult, setRewardResult] = useState(null);
  const [liveMsg, setLiveMsg]         = useState('');

  // ── Refs (mutable, no re-render) ─────────────────────────────────────────
  const gsRef       = useRef(null);   // always-current game state
  const moveLogRef  = useRef([]);     // always-current move log (for server submission)
  const runIdRef    = useRef(null);
  const aiSeedRef   = useRef(42);
  const rewardSentRef = useRef(false);
  const aiTimerRef    = useRef(null);
  const scheduleAiRef = useRef(null); // avoids circular useCallback dependency
  const startTimeRef  = useRef(null);
  const modeRef       = useRef(mode);
  const playerSideRef = useRef(playerSide);
  const difficultyRef = useRef(difficulty);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { playerSideRef.current = playerSide; }, [playerSide]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // ── Cleanup on close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
      gsRef.current = null;
      moveLogRef.current = [];
      runIdRef.current = null;
      rewardSentRef.current = false;
      setPhase('setup');
      setGameState(null);
      setSelectedCell(null);
      setLegalDests([]);
      setMoveHistory([]);
      setFadingCells([]);
      setLastMove(null);
      setKingThreat(false);
      setFlashResult(null);
      setRewardResult(null);
      setLiveMsg('');
      setConfirmNew(false);
      setShowRules(false);
    }
  }, [isOpen]);

  useEffect(() => () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); }, []);

  // ── King threat detection ────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState || gameState.result) { setKingThreat(false); return; }
    const b = gameState.board;
    let kr = -1, kc = -1;
    outer: for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (b[r][c]==='K') { kr=r; kc=c; break outer; }
    if (kr === -1) { setKingThreat(false); return; }
    const atkMoves = getAllLegalMoves(b, 'attackers');
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    let threat = false;
    for (const { to: [tr,tc] } of atkMoves) {
      for (const [dr,dc] of dirs) {
        if (tr+dr===kr && tc+dc===kc) { threat = true; break; }
      }
      if (threat) break;
    }
    setKingThreat(threat);
  }, [gameState]);

  // ── handleGameEnd (uses refs — no stale closures) ─────────────────────────
  const handleGameEnd = useCallback(async (finalState) => {
    playSortingFanfare?.();
    const winner = finalState.result?.winner;
    const isPlayerWin = modeRef.current === 'ai' && winner === playerSideRef.current;
    setFlashResult(isPlayerWin ? 'win' : winner === null ? null : 'lose');
    setLiveMsg(winner === 'defenders' ? 'Straż Króla zwyciężyła!' : winner === 'attackers' ? 'Cienie Skalda zwyciężyły!' : 'Remis!');
    setPhase('result');

    if (modeRef.current === 'ai' && runIdRef.current && !rewardSentRef.current) {
      rewardSentRef.current = true;
      const fullLog = moveLogRef.current.map(e => ({ from: e.from, to: e.to }));
      const resp = await api.completeHnefatafl({ runId: runIdRef.current, moveLog: fullLog });
      if (resp.ok) {
        const d = resp.data;
        setRewardResult({ rewarded: d.rewarded, points: d.rewardPoints, skirnirs: d.rewardSkirnirs, message: d.message });
        if (d.rewarded) {
          if (d.rewardPoints > 0 && currentUser?.house) {
            awardHousePoints(currentUser.house, d.rewardPoints, `Hnefatafl — ${DIFF_LABELS[difficultyRef.current]}`);
          }
          if (d.rewardSkirnirs > 0) addCurrency?.(d.rewardSkirnirs, `Hnefatafl — ${DIFF_LABELS[difficultyRef.current]}`);
          addNotification?.(d.message);
        }
      } else {
        setRewardResult({ rewarded: false, message: 'Nie udało się potwierdzić wyniku na serwerze. Nagroda nie została naliczona.' });
      }
    }
  }, [awardHousePoints, addCurrency, addNotification, currentUser]);

  // ── Core move executor (uses refs) ────────────────────────────────────────
  const executeMoveCore = useCallback((state, move) => {
    const newState = applyMove(state, move);

    // Detect captures for animation
    const capturedCells = [];
    const [tr, tc] = move.to;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const ar = tr+dr, ac = tc+dc;
      if (ar<0||ar>=7||ac<0||ac>=7) continue;
      if (state.board[ar][ac] && !newState.board[ar][ac]) capturedCells.push([ar, ac]);
    }
    const anyCap = capturedCells.length > 0;

    if (anyCap) {
      setFadingCells(capturedCells);
      setTimeout(() => setFadingCells([]), 250);
      playRuneChime?.();
    } else {
      playWandSwoosh?.();
    }

    const capCount = (newState.capturedDefenders + newState.capturedAttackers)
                   - (state.capturedDefenders + state.capturedAttackers);
    const entry = { from: move.from, to: move.to, side: state.turn, captured: capCount };
    moveLogRef.current = [...moveLogRef.current, entry];
    gsRef.current = newState;

    setLastMove(move);
    setGameState(newState);
    setSelectedCell(null);
    setLegalDests([]);
    setMoveHistory(h => [...h, entry]);

    if (newState.result) {
      handleGameEnd(newState);
      return;
    }

    if (modeRef.current === 'ai') {
      const aiSide = playerSideRef.current === 'defenders' ? 'attackers' : 'defenders';
      if (newState.turn === aiSide) {
        setPhase('aiThinking');
        scheduleAiRef.current?.(newState);
      } else {
        setPhase('playing');
      }
    }
    // local mode: just flip — both sides are human
  }, [handleGameEnd, playRuneChime, playWandSwoosh]);

  // ── Schedule AI move ──────────────────────────────────────────────────────
  const scheduleAi = useCallback((state) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    const delay = DIFF_DELAYS[difficultyRef.current] || 600;
    const capturedSeed = aiSeedRef.current;
    const capturedHalf = state.halfMoves;
    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      const cur = gsRef.current;
      if (!cur || cur.result) return;
      const move = chooseAiMove(cur, difficultyRef.current, capturedSeed + capturedHalf);
      if (!move) return;
      executeMoveCore(cur, move);
    }, delay);
  }, [executeMoveCore]);
  // Keep ref up-to-date so executeMoveCore can call it without circular deps
  scheduleAiRef.current = scheduleAi;

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(async () => {
    if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
    const state = createInitialState();
    gsRef.current = state;
    moveLogRef.current = [];
    runIdRef.current = null;
    rewardSentRef.current = false;
    aiSeedRef.current = 42;
    startTimeRef.current = Date.now();

    setGameState(state);
    setSelectedCell(null);
    setLegalDests([]);
    setMoveHistory([]);
    setFadingCells([]);
    setLastMove(null);
    setRewardResult(null);
    setFlashResult(null);
    setConfirmNew(false);
    setLiveMsg('');

    if (modeRef.current === 'ai' && currentUser) {
      const resp = await api.startHnefatafl({ difficulty: difficultyRef.current, playerSide: playerSideRef.current });
      if (resp.ok) {
        runIdRef.current = resp.data.runId;
        aiSeedRef.current = resp.data.aiSeed;
      }
    }

    setPhase('playing');

    // AI goes first if player chose defenders (attackers move first in Brandubh)
    if (modeRef.current === 'ai' && playerSideRef.current === 'defenders') {
      const cur = gsRef.current;
      setPhase('aiThinking');
      scheduleAi(cur);
    }
  }, [currentUser, scheduleAi]);

  // ── Cell click ────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((r, c) => {
    if (phase !== 'playing') return;
    const state = gsRef.current;
    if (!state || state.result) return;

    const board = state.board;
    const piece = board[r][c];

    const isMyTurn = modeRef.current === 'local'
      || (modeRef.current === 'ai' && state.turn === playerSideRef.current);
    if (!isMyTurn) return;

    const ownPiece = piece && (
      (state.turn === 'defenders' && (piece === 'K' || piece === 'D')) ||
      (state.turn === 'attackers' && piece === 'A')
    );

    if (!selectedCell) {
      if (!ownPiece) return;
      playWandSwoosh?.();
      setSelectedCell([r, c]);
      setLegalDests(getLegalMoves(board, r, c));
      return;
    }

    if (ownPiece) {
      setSelectedCell([r, c]);
      setLegalDests(getLegalMoves(board, r, c));
      return;
    }

    const isLegal = legalDests.some(([lr, lc]) => lr===r && lc===c);
    if (!isLegal) {
      setSelectedCell(null);
      setLegalDests([]);
      return;
    }

    executeMoveCore(state, { from: selectedCell, to: [r, c] });
  }, [phase, selectedCell, legalDests, executeMoveCore, playWandSwoosh]);

  const handleCellKey = (e, r, c) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCellClick(r, c); }
    if (e.key === 'Escape') { setSelectedCell(null); setLegalDests([]); }
  };

  const requestNewGame = () => {
    if (phase === 'playing' || phase === 'aiThinking') setConfirmNew(true);
    else setPhase('setup');
  };

  const abandonAndSetup = () => {
    if (aiTimerRef.current) { clearTimeout(aiTimerRef.current); aiTimerRef.current = null; }
    gsRef.current = null;
    setPhase('setup');
    setConfirmNew(false);
  };

  if (!isOpen) return null;

  const gs = gameState;
  const turnLabel = gs ? (gs.turn === 'defenders' ? 'Straż Króla' : 'Cienie Skalda') : '';
  const isAiThinking = phase === 'aiThinking';

  return (
    <div role="dialog" aria-modal="true" aria-label="Hnefatafl Magów" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(3,5,8,0.92)',
      backdropFilter: 'blur(12px)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem',
    }}>
      <div aria-live="polite" aria-atomic="true" style={{ position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)' }}>{liveMsg}</div>

      <div style={{
        background: 'linear-gradient(180deg,#181d29 0%,#0a0d14 100%)',
        border: `2px solid ${GOLD}`,
        boxShadow: '0 12px 60px rgba(0,0,0,0.95), 0 0 30px rgba(197,159,78,0.25)',
        borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '94vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '0.9rem 1.2rem', borderBottom: `1px solid rgba(197,159,78,0.22)`, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={20} style={{ color: GOLD, flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', lineHeight: 1.2 }}>Hnefatafl Magów</h3>
              {gs && (
                <div style={{ fontSize: '0.7rem', color: GOLD, marginTop: 1 }}>
                  {isAiThinking ? 'Duch Skalda rozważa ruch…'
                    : `Tura: ${turnLabel}${mode==='ai' ? (gs.turn===playerSide ? ' (Ty)' : ' (AI)') : ''}`}
                  {mode==='ai' && ` · ${DIFF_LABELS[difficulty]} · ${playerSide==='defenders'?'Straż':'Cienie'}`}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button onClick={() => setShowRules(v=>!v)} aria-pressed={showRules} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#e2e8f0', borderRadius:4, padding:'0.25rem 0.45rem', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontSize:'0.72rem' }}>
              <HelpCircle size={12} /> Zasady
            </button>
            <button onClick={onClose} aria-label="Zamknij Hnefatafl" style={{ background:'transparent', border:'none', color:'#9ca3af', cursor:'pointer', padding:4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {showRules && (
          <div style={{ padding:'0.65rem 1.2rem', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.2)' }}>
            <RulesPanel />
          </div>
        )}

        <div style={{ padding: '0.9rem 1.2rem' }}>

          {/* ── SETUP ── */}
          {phase === 'setup' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
              <h4 style={{ margin:0, color:GOLD, fontFamily:'var(--font-heading)', fontSize:'0.95rem' }}>Nowa Partia</h4>

              <div>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:'0.35rem' }}>Tryb gry</div>
                <div style={{ display:'flex', gap:'0.4rem' }}>
                  {[['ai','🤖 Próba Skalda (vs AI)'],['local','👥 Pojedynek (2 graczy)']].map(([v,l]) => (
                    <button key={v} onClick={() => setMode(v)} style={{ flex:1, padding:'0.45rem 0.5rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', border: mode===v?`1.5px solid ${GOLD}`:'1px solid rgba(255,255,255,0.12)', background: mode===v?'rgba(197,159,78,0.12)':'rgba(255,255,255,0.04)', color: mode===v?GOLD:'#e2e8f0' }}>{l}</button>
                  ))}
                </div>
              </div>

              {mode === 'ai' && (
                <div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:'0.35rem' }}>Twoja strona</div>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    {[['defenders','👑 Straż Króla'],['attackers','🗡️ Cienie Skalda']].map(([v,l]) => (
                      <button key={v} onClick={() => setPlayerSide(v)} style={{ flex:1, padding:'0.45rem 0.5rem', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', border: playerSide===v?`1.5px solid ${GOLD}`:'1px solid rgba(255,255,255,0.12)', background: playerSide===v?'rgba(197,159,78,0.12)':'rgba(255,255,255,0.04)', color: playerSide===v?GOLD:'#e2e8f0' }}>{l}</button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'ai' && (
                <div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:'0.35rem' }}>Poziom trudności</div>
                  {[
                    ['uczen','Uczeń Skalda','Losowe z preferencją bicia.','2 pkt + 2 Sk.'],
                    ['einar','Skald Einar','Analiza 2 półruchów naprzód.','5 pkt + 4 Sk.'],
                    ['jarl','Jarl Widmowej Tarczy','Analiza 3 półruchów, alfa-beta.','8 pkt + 6 Sk.'],
                  ].map(([v,name,desc,rew]) => (
                    <button key={v} onClick={() => setDifficulty(v)} style={{ display:'block', width:'100%', padding:'0.45rem 0.65rem', borderRadius:6, cursor:'pointer', textAlign:'left', marginBottom:'0.3rem', border: difficulty===v?`1.5px solid ${GOLD}`:'1px solid rgba(255,255,255,0.1)', background: difficulty===v?'rgba(197,159,78,0.1)':'rgba(255,255,255,0.03)', color:'#e2e8f0' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:600, color: difficulty===v?GOLD:'#e2e8f0' }}>{name}</span>
                      <span style={{ fontSize:'0.7rem', color:'#94a3b8', marginLeft:8 }}>{desc} <span style={{ color:'#4ade80' }}>Nagroda: {rew}</span></span>
                    </button>
                  ))}
                </div>
              )}

              {mode === 'local' && (
                <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, padding:'0.45rem 0.65rem', fontSize:'0.75rem', color:'#fca5a5' }}>
                  Tryb lokalny jest zawsze treningowy — brak punktów Zakonu i Skirnirów.
                </div>
              )}

              <button onClick={startGame} style={{ background:GOLD, color:'#000', border:'none', borderRadius:6, padding:'0.65rem', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'var(--font-heading)' }}>
                Rozpocznij Próbę
              </button>
            </div>
          )}

          {/* ── RESULT ── */}
          {phase === 'result' && gs?.result && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
              <div style={{ borderRadius:8, padding:'0.85rem 1.1rem', textAlign:'center', background: flashResult==='win'?'rgba(74,222,128,0.1)':flashResult==='lose'?'rgba(248,113,113,0.1)':'rgba(100,116,139,0.1)', border:`1.5px solid ${flashResult==='win'?'#4ade80':flashResult==='lose'?'#f87171':'#64748b'}` }}>
                <div style={{ fontSize:'1.4rem', marginBottom:'0.15rem' }}>{flashResult==='win'?'👑':flashResult==='lose'?'🗡️':'🤝'}</div>
                <h4 style={{ margin:'0 0 0.2rem', color: flashResult==='win'?'#4ade80':flashResult==='lose'?'#f87171':'#94a3b8', fontFamily:'var(--font-heading)', fontSize:'1.05rem' }}>
                  {flashResult==='win'?'Zwycięstwo!':flashResult==='lose'?'Porażka':'Remis'}
                </h4>
                <div style={{ fontSize:'0.77rem', color:'#94a3b8' }}>
                  {gs.result.winner==='defenders'?'Straż Króla':gs.result.winner==='attackers'?'Cienie Skalda':'Żadna strona'}
                  {' — '}{gs.result.reason}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', fontSize:'0.75rem', color:'#94a3b8' }}>
                <div>Półruchów: <strong style={{color:'#e2e8f0'}}>{gs.halfMoves}</strong></div>
                <div>Czas: <strong style={{color:'#e2e8f0'}}>{startTimeRef.current ? `${Math.round((Date.now()-startTimeRef.current)/1000)} s` : '—'}</strong></div>
                <div>Zbici obrońcy: <strong style={{color:'#60a5fa'}}>{gs.capturedDefenders}</strong></div>
                <div>Zbici napastnicy: <strong style={{color:'#f87171'}}>{gs.capturedAttackers}</strong></div>
                {mode==='ai' && <><div>Poziom: <strong style={{color:GOLD}}>{DIFF_LABELS[difficulty]}</strong></div><div>Strona: <strong style={{color:'#e2e8f0'}}>{playerSide==='defenders'?'Straż':'Cienie'}</strong></div></>}
              </div>

              {mode === 'ai' && (
                <div style={{ background:'rgba(0,0,0,0.28)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:6, padding:'0.55rem 0.8rem', fontSize:'0.77rem', color:'#c9d1de' }}>
                  {rewardResult === null ? 'Zapisywanie wyniku…' : rewardResult.message}
                </div>
              )}

              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                <button onClick={startGame} style={{ flex:1, background:GOLD, color:'#000', border:'none', borderRadius:6, padding:'0.5rem', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>Rewanż</button>
                <button onClick={() => setPhase('setup')} style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', color:'#e2e8f0', borderRadius:6, padding:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Zmień ustawienia</button>
              </div>
            </div>
          )}

          {/* ── PLAYING / AI-THINKING ── */}
          {(phase === 'playing' || phase === 'aiThinking') && gs && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.7rem' }}>

              {/* Confirm abandon */}
              {confirmNew && (
                <div style={{ background:'rgba(10,13,20,0.95)', border:`1px solid ${GOLD}`, borderRadius:8, padding:'0.65rem 0.9rem', textAlign:'center', width:'100%', boxSizing:'border-box' }}>
                  <div style={{ color:'#e2e8f0', fontSize:'0.82rem', marginBottom:'0.45rem' }}>Porzucić bieżącą próbę? Nie otrzymasz nagrody.</div>
                  <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center' }}>
                    <button onClick={abandonAndSetup} style={{ background:'#f87171', color:'#000', border:'none', borderRadius:5, padding:'0.35rem 0.75rem', fontWeight:700, cursor:'pointer', fontSize:'0.78rem' }}>Porzuć</button>
                    <button onClick={() => setConfirmNew(false)} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#e2e8f0', borderRadius:5, padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.78rem' }}>Anuluj</button>
                  </div>
                </div>
              )}

              {/* Info bar */}
              <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', fontSize:'0.72rem', color:'#94a3b8', alignSelf:'stretch', alignItems:'center' }}>
                <span style={{ color: gs.turn==='defenders'?'#60a5fa':'#f87171', fontWeight:600 }}>
                  {gs.turn==='defenders'?'👑 Straż':'🗡️ Cienie'}{isAiThinking?' (AI)':''}
                </span>
                <span>Ruch: {gs.halfMoves}</span>
                <span>Zbici: <span style={{color:'#60a5fa'}}>{gs.capturedDefenders}D</span> / <span style={{color:'#f87171'}}>{gs.capturedAttackers}A</span></span>
                {gs.noCaptureCount >= 24 && <span style={{color:'#f59e0b'}}>Bez bicia: {gs.noCaptureCount}/30</span>}
                <button onClick={requestNewGame} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#9ca3af', borderRadius:4, padding:'0.18rem 0.45rem', cursor:'pointer', fontSize:'0.68rem', display:'flex', alignItems:'center', gap:2 }}>
                  <RotateCcw size={10} /> Nowa
                </button>
              </div>

              {/* Board */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {/* Column labels */}
                <div style={{ display:'flex', paddingLeft:20, marginBottom:1 }}>
                  {COL_LABELS.map(l => <div key={l} style={{ width:'clamp(40px,10.5vw,52px)', textAlign:'center', fontSize:'0.62rem', color:'#475569' }}>{l}</div>)}
                </div>
                <div style={{ display:'flex' }}>
                  {/* Row labels */}
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {ROW_LABELS.map(l => <div key={l} style={{ height:'clamp(40px,10.5vw,52px)', width:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', color:'#475569' }}>{l}</div>)}
                  </div>

                  {/* Grid */}
                  <div role="grid" aria-label="Plansza Hnefatafl" style={{ display:'grid', gridTemplateColumns:'repeat(7, clamp(40px,10.5vw,52px))', gridTemplateRows:'repeat(7, clamp(40px,10.5vw,52px))', gap:3, background:'#0c1018', padding:7, border:`2px solid ${GOLD}`, borderRadius:8 }}>
                    {gs.board.map((row, r) => row.map((cell, c) => {
                      const isSel  = selectedCell && selectedCell[0]===r && selectedCell[1]===c;
                      const isLeg  = legalDests.some(([lr,lc]) => lr===r && lc===c);
                      const isC    = isCorner(r, c);
                      const isT    = isThrone(r, c);
                      const isFad  = fadingCells.some(([fr,fc]) => fr===r && fc===c);
                      const isLast = lastMove && ((lastMove.from[0]===r&&lastMove.from[1]===c)||(lastMove.to[0]===r&&lastMove.to[1]===c));
                      const isKing = cell === 'K';
                      const isEscapeHint = isLeg && isC;

                      let bg = 'rgba(20,26,38,0.85)';
                      if (isC)          bg = 'rgba(56,189,248,0.14)';
                      if (isT)          bg = 'rgba(197,159,78,0.11)';
                      if (isSel)        bg = 'rgba(197,159,78,0.32)';
                      if (isEscapeHint) bg = 'rgba(74,222,128,0.22)';
                      else if (isLeg)   bg = 'rgba(255,255,255,0.09)';

                      let borderColor = 'rgba(255,255,255,0.05)';
                      if (isSel)        borderColor = '#fff';
                      else if (isLeg)   borderColor = 'rgba(255,255,255,0.28)';
                      else if (isC)     borderColor = '#38bdf8';
                      else if (isT)     borderColor = GOLD;
                      else if (isLast)  borderColor = `rgba(197,159,78,0.45)`;

                      const boxShadow = isKing && kingThreat ? '0 0 7px 2px rgba(248,113,113,0.55)' : 'none';

                      return (
                        <div
                          key={`${r}-${c}`}
                          role="gridcell"
                          aria-label={`${cellLabel(r,c)}${cell?`: ${cell==='K'?'Król':cell==='D'?'Obrońca':'Napastnik'}`:''}${isSel?' (zaznaczony)':''}${isLeg?' (możliwy ruch)':''}`}
                          tabIndex={isSel ? 0 : (r===0&&c===0 ? 0 : -1)}
                          onClick={() => !isAiThinking && handleCellClick(r, c)}
                          onKeyDown={e => handleCellKey(e, r, c)}
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'center',
                            borderRadius:3, cursor: isAiThinking ? 'default' : 'pointer',
                            userSelect:'none', position:'relative',
                            background: bg, border:`1px solid ${borderColor}`,
                            boxShadow,
                            opacity: isFad ? 0 : 1,
                            transition: isFad ? 'opacity 0.22s ease' : 'background 0.1s',
                            minWidth:44, minHeight:44,
                          }}
                        >
                          {isLeg && !cell && (
                            <div style={{ width: isEscapeHint?9:6, height: isEscapeHint?9:6, borderRadius:'50%', background: isEscapeHint?'#4ade80':'rgba(255,255,255,0.32)', position:'absolute' }} />
                          )}
                          {cell && <Piece type={cell} />}
                          {!cell && isC && <span style={{ fontSize:'0.68rem', color:'#38bdf8', opacity:0.55 }}>✦</span>}
                          {!cell && isT && <span style={{ fontSize:'0.78rem', color:GOLD, opacity:0.35 }}>ᛟ</span>}
                        </div>
                      );
                    }))}
                  </div>
                </div>
              </div>

              {/* Legend + history */}
              <div style={{ display:'flex', gap:'1rem', alignSelf:'stretch', flexWrap:'wrap' }}>
                <div style={{ fontSize:'0.68rem', color:'#475569', lineHeight:1.9 }}>
                  <div><Crown size={10} style={{color:'#f0c040',verticalAlign:'middle',marginRight:2}} /> Król ucieka do narożnika ✦</div>
                  <div><Swords size={10} style={{color:'#f87171',verticalAlign:'middle',marginRight:2}} /> Napastnicy pojmują króla</div>
                </div>
                <div style={{ flex:1, minWidth:130 }}>
                  <div style={{ fontSize:'0.65rem', color:'#475569', marginBottom:2 }}>Ostatnie ruchy</div>
                  {moveHistory.slice(-6).map((e, i) => (
                    <div key={i} style={{ fontSize:'0.7rem', color: e.side==='defenders'?'#60a5fa':'#f87171', lineHeight:1.65 }}>
                      {e.side==='defenders'?'S':'C'}: {cellLabel(...e.from)}→{cellLabel(...e.to)}{e.captured>0?` ×${e.captured}`:''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
