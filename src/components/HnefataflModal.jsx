import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Crown,
  Shield,
  Swords,
  X,
  RotateCcw,
  Sparkles,
  Award,
  Bot,
  User
} from 'lucide-react';

export const HnefataflModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();

  const BOARD_SIZE = 7;
  // Cell contents: null | 'K' (King) | 'D' (Defender) | 'A' (Attacker)
  const initialBoard = [
    [null, null, null, 'A', null, null, null],
    [null, null, null, 'A', null, null, null],
    [null, null, null, 'D', null, null, null],
    ['A', 'A', 'D', 'K', 'D', 'A', 'A'],
    [null, null, null, 'D', null, null, null],
    [null, null, null, 'A', null, null, null],
    [null, null, null, 'A', null, null, null]
  ];

  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('defenders'); // 'defenders' (King side) | 'attackers'
  const [selectedCell, setSelectedCell] = useState(null);
  const [winner, setWinner] = useState(null);
  const [vsAi, setVsAi] = useState(true);

  if (!isOpen) return null;

  const isCorner = (r, c) => (r === 0 && c === 0) || (r === 0 && c === 6) || (r === 6 && c === 0) || (r === 6 && c === 6);
  const isThrone = (r, c) => r === 3 && c === 3;

  const handleCellClick = (r, c) => {
    if (winner) return;

    const piece = board[r][c];

    // If selecting piece
    if (!selectedCell) {
      if (!piece) return;
      const isDef = piece === 'K' || piece === 'D';
      if ((turn === 'defenders' && isDef) || (turn === 'attackers' && piece === 'A')) {
        playWandSwoosh();
        setSelectedCell({ r, c });
      }
      return;
    }

    // If re-selecting own piece
    if (piece) {
      const isDef = piece === 'K' || piece === 'D';
      if ((turn === 'defenders' && isDef) || (turn === 'attackers' && piece === 'A')) {
        setSelectedCell({ r, c });
        return;
      }
    }

    // If moving to empty cell
    if (isValidMove(selectedCell.r, selectedCell.c, r, c)) {
      executeMove(selectedCell.r, selectedCell.c, r, c);
    } else {
      setSelectedCell(null);
    }
  };

  const isValidMove = (fromR, fromC, toR, toC) => {
    if (fromR !== toR && fromC !== toC) return false;
    if (board[toR][toC] !== null) return false;

    // Only King can land on Corners and Throne
    const movingPiece = board[fromR][fromC];
    if (movingPiece !== 'K' && (isCorner(toR, toC) || isThrone(toR, toC))) {
      return false;
    }

    // Path must be clear
    if (fromR === toR) {
      const min = Math.min(fromC, toC) + 1;
      const max = Math.max(fromC, toC);
      for (let c = min; c < max; c++) {
        if (board[fromR][c] !== null) return false;
      }
    } else {
      const min = Math.min(fromR, toR) + 1;
      const max = Math.max(fromR, toR);
      for (let r = min; r < max; r++) {
        if (board[r][fromC] !== null) return false;
      }
    }

    return true;
  };

  const executeMove = (fromR, fromC, toR, toC) => {
    playRuneChime();
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[fromR][fromC];
    newBoard[fromR][fromC] = null;
    newBoard[toR][toC] = piece;

    // Check King Escape Victory
    if (piece === 'K' && isCorner(toR, toC)) {
      setBoard(newBoard);
      setWinner('defenders');
      playSortingFanfare();
      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', 25, 'Zwycięstwo w Hnefatafl Magów (Ucieczka Króla)');
      if (addCurrency) addCurrency(30, 'Zwycięstwo w partii Hnefatafl');
      addNotification('👑 Król uciekł do narożnika! Zwycięstwo w Hnefatafl (+25 pkt, +30 Sk.)!');
      return;
    }

    // Perform captures
    const isDefTurn = piece === 'K' || piece === 'D';
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    directions.forEach(([dr, dc]) => {
      const adjR = toR + dr;
      const adjC = toC + dc;
      const flankR = toR + dr * 2;
      const flankC = toC + dc * 2;

      if (adjR >= 0 && adjR < BOARD_SIZE && adjC >= 0 && adjC < BOARD_SIZE) {
        const adjPiece = newBoard[adjR][adjC];
        if (adjPiece) {
          const isAdjDef = adjPiece === 'K' || adjPiece === 'D';
          if (isDefTurn !== isAdjDef) {
            // Check if flanked
            if (flankR >= 0 && flankR < BOARD_SIZE && flankC >= 0 && flankC < BOARD_SIZE) {
              const flankPiece = newBoard[flankR][flankC];
              const isFlankDef = flankPiece === 'K' || flankPiece === 'D';
              if ((isFlankDef === isDefTurn && flankPiece !== null) || isCorner(flankR, flankC) || isThrone(flankR, flankC)) {
                if (adjPiece === 'K') {
                  // King requires surrounding on all sides or against board
                  setWinner('attackers');
                  playSortingFanfare();
                } else {
                  newBoard[adjR][adjC] = null;
                }
              }
            }
          }
        }
      }
    });

    setBoard(newBoard);
    setSelectedCell(null);
    const nextTurn = turn === 'defenders' ? 'attackers' : 'defenders';
    setTurn(nextTurn);

    // AI Turn trigger if enabled
    if (vsAi && nextTurn === 'attackers' && !winner) {
      setTimeout(() => makeAiMove(newBoard), 600);
    }
  };

  const makeAiMove = (currentB) => {
    // Simple greedy AI: find first valid move that captures or approaches king
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentB[r][c] === 'A') {
          const targets = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1]
          ];
          for (const [tr, tc] of targets) {
            if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && currentB[tr][tc] === null && !isCorner(tr, tc) && !isThrone(tr, tc)) {
              executeMove(r, c, tr, tc);
              return;
            }
          }
        }
      }
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setTurn('defenders');
    setSelectedCell(null);
    setWinner(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.92)',
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
          background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Crown size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Hnefatafl Magów • Królewskie Szachy Wikingów
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                TURA: {turn === 'defenders' ? '👑 OBRONA KRÓLA (GRACZ)' : '🗡️ CIENIE (WIKINGOWIE)'}
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

        {/* Board Display */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {winner && (
            <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1.5px solid #22c55e', borderRadius: '6px', padding: '0.8rem 1.5rem', textAlign: 'center' }}>
              <h4 style={{ margin: 0, color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                {winner === 'defenders' ? '👑 ZWYCIĘSTWO KRÓLA! (+25 PKT DLA ZAKONU)' : '🗡️ CIENIE SCHWYTAŁY KRÓLA!'}
              </h4>
            </div>
          )}

          {/* 7x7 Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 44px)',
              gridTemplateRows: 'repeat(7, 44px)',
              gap: '4px',
              background: '#0c1018',
              padding: '10px',
              border: '2px solid var(--gold-ancient)',
              borderRadius: '8px',
              boxShadow: '0 0 25px rgba(0,0,0,0.8)'
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSel = selectedCell?.r === r && selectedCell?.c === c;
                const isC = isCorner(r, c);
                const isT = isThrone(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '4px',
                      background: isSel
                        ? 'rgba(197, 159, 78, 0.4)'
                        : isC
                        ? 'rgba(56, 189, 248, 0.2)'
                        : isT
                        ? 'rgba(197, 159, 78, 0.15)'
                        : 'rgba(20, 26, 38, 0.8)',
                      border: isSel
                        ? '2px solid #ffffff'
                        : isC
                        ? '1px dashed #38bdf8'
                        : isT
                        ? '1px solid var(--gold-ancient)'
                        : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {cell === 'K' ? '👑' : cell === 'D' ? '🛡️' : cell === 'A' ? '🗡️' : isC ? '🏛️' : isT ? 'ᛟ' : ''}
                  </div>
                );
              })
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              onClick={resetGame}
              style={{
                background: 'var(--gold-ancient)',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <RotateCcw size={14} /> Nowa Partia
            </button>

            <button
              onClick={() => setVsAi(!vsAi)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Tryb: {vsAi ? '🤖 Przeciwko Duchowi Skalda' : '👥 2 Graczy (Lokalnie)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
