// Brandubh 7×7 — pure game-rules engine (no React deps)
// Used by both the frontend modal and the backend validator.

export const BOARD_SIZE = 7;
export const THRONE = [3, 3];
export const CORNERS = [[0,0],[0,6],[6,0],[6,6]];

// Difficulty reward table
export const REWARDS = {
  'uczen':  { points: 2, skirnirs: 2 },
  'einar':  { points: 5, skirnirs: 4 },
  'jarl':   { points: 8, skirnirs: 6 },
};

export const DAILY_REWARD_LIMIT    = 3;
export const DAILY_POINTS_LIMIT    = 24;
export const DAILY_SKIRNIRS_LIMIT  = 18;
export const MIN_GAME_MS           = 8_000;
export const MAX_GAME_MS           = 45 * 60_000;
export const MAX_HALF_MOVES        = 100;
export const NO_CAPTURE_LIMIT      = 30;

export function createInitialState() {
  const b = Array.from({ length: 7 }, () => Array(7).fill(null));
  // King
  b[3][3] = 'K';
  // Defenders
  [[2,3],[4,3],[3,2],[3,4]].forEach(([r,c]) => { b[r][c] = 'D'; });
  // Attackers — 2 per edge midpoint
  [[0,3],[1,3],[5,3],[6,3],[3,0],[3,1],[3,5],[3,6]].forEach(([r,c]) => { b[r][c] = 'A'; });
  return {
    board: b,
    turn: 'attackers', // attackers move first
    halfMoves: 0,
    noCaptureCount: 0,
    positionHistory: [],  // serialized position strings
    capturedDefenders: 0,
    capturedAttackers: 0,
    lastMove: null,       // { from, to }
    result: null,         // null | { winner, reason }
  };
}

export function isCorner(r, c) {
  return (r === 0 || r === 6) && (c === 0 || c === 6);
}
export function isThrone(r, c) {
  return r === 3 && c === 3;
}
export function isSpecial(r, c) {
  return isCorner(r, c) || isThrone(r, c);
}

// A non-king piece cannot land on or pass through a corner or throne.
function canPassThrough(r, c, piece) {
  if (piece === 'K') return true;
  return !isSpecial(r, c);
}
function canLandOn(r, c, piece) {
  if (piece === 'K') return true;
  return !isSpecial(r, c);
}

export function getLegalMoves(board, fromR, fromC) {
  const piece = board[fromR][fromC];
  if (!piece) return [];
  const moves = [];

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    let r = fromR + dr;
    let c = fromC + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (board[r][c] !== null) break; // blocked by piece
      if (!canPassThrough(r, c, piece)) {
        // Non-king cannot pass through special; if it can't land, also can't continue
        break;
      }
      if (canLandOn(r, c, piece)) {
        moves.push([r, c]);
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

export function getAllLegalMoves(board, side) {
  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const isDefSide = p === 'K' || p === 'D';
      if (side === 'defenders' && !isDefSide) continue;
      if (side === 'attackers' && isDefSide) continue;
      const dests = getLegalMoves(board, r, c);
      for (const [tr, tc] of dests) {
        moves.push({ from: [r, c], to: [tr, tc] });
      }
    }
  }
  return moves;
}

// Returns true if square (r,c) is hostile to the given piece
function isHostile(board, r, c, piece) {
  const isDefPiece = piece === 'K' || piece === 'D';
  const occupant = board[r][c];
  if (occupant) {
    // Friendly pieces are never hostile; enemy pieces are hostile
    const isOccDef = occupant === 'K' || occupant === 'D';
    return isOccDef !== isDefPiece;
  }
  // Empty special squares: throne and corners are hostile to any non-king piece
  if (isThrone(r, c) || isCorner(r, c)) return true;
  return false;
}

function resolveCaptures(board, toR, toC) {
  const movedPiece = board[toR][toC];
  const isMovedDef = movedPiece === 'K' || movedPiece === 'D';
  const captured = [];

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const adjR = toR + dr;
    const adjC = toC + dc;
    if (adjR < 0 || adjR >= BOARD_SIZE || adjC < 0 || adjC >= BOARD_SIZE) continue;
    const adj = board[adjR][adjC];
    if (!adj) continue;

    const isAdjDef = adj === 'K' || adj === 'D';
    if (isAdjDef === isMovedDef) continue; // same side — friendly

    const flankR = adjR + dr;
    const flankC = adjC + dc;

    if (adj === 'K') continue; // king has special capture rules, handled separately

    // Ordinary capture: flanked by moved piece + flank
    if (flankR >= 0 && flankR < BOARD_SIZE && flankC >= 0 && flankC < BOARD_SIZE) {
      if (isHostile(board, flankR, flankC, adj)) {
        captured.push([adjR, adjC]);
      }
    }
  }
  return captured;
}

function isKingCaptured(board) {
  let kr = -1, kc = -1;
  for (let r = 0; r < BOARD_SIZE && kr === -1; r++)
    for (let c = 0; c < BOARD_SIZE && kr === -1; c++)
      if (board[r][c] === 'K') { kr = r; kc = c; }
  if (kr === -1) return true; // king already removed

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const adj = dirs.map(([dr,dc]) => [kr+dr, kc+dc]);

  const isAtThrone = isThrone(kr, kc);
  const adjToThrone = adj.some(([r,c]) => isThrone(r, c));

  const attackerCount = adj.filter(([r,c]) =>
    r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 'A'
  ).length;

  if (isAtThrone) {
    return attackerCount === 4;
  }
  if (adjToThrone) {
    // throne counts as 4th surrounding; need 3 attackers on other 3 sides
    const nonThroneAdj = adj.filter(([r,c]) => !isThrone(r,c));
    const attackersOnOtherSides = nonThroneAdj.filter(([r,c]) =>
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 'A'
    ).length;
    return attackersOnOtherSides === 3;
  }
  // Normal case: flanked on two opposite sides
  const pairs = [[dirs[0], dirs[1]], [dirs[2], dirs[3]]];
  for (const [d1, d2] of pairs) {
    const [r1,c1] = [kr+d1[0], kc+d1[1]];
    const [r2,c2] = [kr+d2[0], kc+d2[1]];
    const h1 = r1>=0&&r1<BOARD_SIZE&&c1>=0&&c1<BOARD_SIZE && board[r1][c1]==='A';
    const h2 = r2>=0&&r2<BOARD_SIZE&&c2>=0&&c2<BOARD_SIZE && board[r2][c2]==='A';
    if (h1 && h2) return true;
  }
  return false;
}

export function serializePosition(state) {
  return state.board.map(row => row.map(c => c || '.').join('')).join('|') + ':' + state.turn;
}

export function applyMove(state, move) {
  const { from: [fromR, fromC], to: [toR, toC] } = move;
  const board = state.board.map(row => [...row]);
  const piece = board[fromR][fromC];
  board[fromR][fromC] = null;
  board[toR][toC] = piece;

  // King escape
  if (piece === 'K' && isCorner(toR, toC)) {
    return {
      ...state,
      board,
      lastMove: move,
      halfMoves: state.halfMoves + 1,
      result: { winner: 'defenders', reason: 'Król dotarł do Bramy Ucieczki' },
    };
  }

  // Resolve captures
  const capturedCells = resolveCaptures(board, toR, toC);
  let newCapDef = state.capturedDefenders;
  let newCapAtk = state.capturedAttackers;
  for (const [cr, cc] of capturedCells) {
    const cp = board[cr][cc];
    board[cr][cc] = null;
    if (cp === 'D') newCapDef++;
    else if (cp === 'A') newCapAtk++;
  }

  const anyCaptured = capturedCells.length > 0;

  // King capture check
  if (isKingCaptured(board)) {
    return {
      ...state,
      board,
      lastMove: move,
      halfMoves: state.halfMoves + 1,
      capturedDefenders: newCapDef,
      capturedAttackers: newCapAtk,
      result: { winner: 'attackers', reason: 'Król został otoczony' },
    };
  }

  const nextTurn = state.turn === 'attackers' ? 'defenders' : 'attackers';
  const newHalfMoves = state.halfMoves + 1;
  const newNoCap = anyCaptured ? 0 : state.noCaptureCount + 1;

  const newState = {
    ...state,
    board,
    turn: nextTurn,
    halfMoves: newHalfMoves,
    noCaptureCount: newNoCap,
    capturedDefenders: newCapDef,
    capturedAttackers: newCapAtk,
    lastMove: move,
    result: null,
  };

  // Draw: no-capture limit
  if (newNoCap >= NO_CAPTURE_LIMIT) {
    return { ...newState, result: { winner: null, reason: `${NO_CAPTURE_LIMIT} półruchów bez bicia` } };
  }
  // Draw: half-move limit
  if (newHalfMoves >= MAX_HALF_MOVES) {
    return { ...newState, result: { winner: null, reason: 'Przekroczono limit 100 półruchów' } };
  }

  // Draw: no legal moves for next side
  if (getAllLegalMoves(board, nextTurn).length === 0) {
    const winnerOther = nextTurn === 'defenders' ? 'attackers' : 'defenders';
    return { ...newState, result: { winner: winnerOther, reason: 'Brak legalnego ruchu' } };
  }

  // Draw: position repetition (3x same position+turn)
  const posKey = serializePosition(newState);
  const newHistory = [...state.positionHistory, posKey];
  const occurrences = newHistory.filter(k => k === posKey).length;
  if (occurrences >= 3) {
    return { ...newState, positionHistory: newHistory, result: { winner: null, reason: 'Trzykrotne powtórzenie pozycji' } };
  }

  return { ...newState, positionHistory: newHistory };
}

// ── AI ─────────────────────────────────────────────────────────────────────────

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function scorePosition(state, aiSide) {
  if (state.result) {
    if (state.result.winner === aiSide) return 100000;
    if (state.result.winner === null) return 0;
    return -100000;
  }
  const s = aiSide === 'attackers' ? 1 : -1;

  // Material
  let score = s * (state.capturedDefenders - state.capturedAttackers) * 10;

  // Find king
  let kr = -1, kc = -1;
  for (let r = 0; r < BOARD_SIZE && kr === -1; r++)
    for (let c = 0; c < BOARD_SIZE && kr === -1; c++)
      if (state.board[r][c] === 'K') { kr = r; kc = c; }

  if (kr === -1) return s * 100000; // king gone

  // King distance to nearest corner
  const minDist = Math.min(
    Math.abs(kr) + Math.abs(kc),
    Math.abs(kr) + Math.abs(kc - 6),
    Math.abs(kr - 6) + Math.abs(kc),
    Math.abs(kr - 6) + Math.abs(kc - 6)
  );
  score += s * -1 * minDist * 5; // defenders want short distance, attackers want long

  // King mobility
  const kingMoves = getLegalMoves(state.board, kr, kc).length;
  score += s * -1 * kingMoves * 3;

  // Attackers surrounding king
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const surrounding = dirs.filter(([dr,dc]) => {
    const r = kr+dr, c = kc+dc;
    return r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE && state.board[r][c]==='A';
  }).length;
  score += s * surrounding * 8;

  // Mobility of both sides
  const atkMoves = getAllLegalMoves(state.board, 'attackers').length;
  const defMoves = getAllLegalMoves(state.board, 'defenders').length;
  score += s * (atkMoves - defMoves);

  return score;
}

function minimax(state, depth, alpha, beta, maximizing, aiSide, rng, deadline) {
  if (Date.now() > deadline) return scorePosition(state, aiSide);
  if (depth === 0 || state.result) return scorePosition(state, aiSide);

  const side = maximizing
    ? aiSide
    : (aiSide === 'attackers' ? 'defenders' : 'attackers');
  let moves = getAllLegalMoves(state.board, side);
  if (moves.length === 0) return scorePosition(state, aiSide);

  // Shuffle for variety
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [moves[i], moves[j]] = [moves[j], moves[i]];
  }

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const next = applyMove(state, m);
      const val = minimax(next, depth - 1, alpha, beta, false, aiSide, rng, deadline);
      if (val > best) best = val;
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const next = applyMove(state, m);
      const val = minimax(next, depth - 1, alpha, beta, true, aiSide, rng, deadline);
      if (val < best) best = val;
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function chooseAiMove(state, difficulty, seed) {
  const rng = seededRng(typeof seed === 'number' ? seed : 42);
  const aiSide = state.turn;
  const moves = getAllLegalMoves(state.board, aiSide);
  if (moves.length === 0) return null;

  // Budget and depth by difficulty
  const cfg = {
    uczen:  { depth: 1, budget: 120 },
    einar:  { depth: 2, budget: 300 },
    jarl:   { depth: 3, budget: 600 },
  }[difficulty] || { depth: 1, budget: 120 };

  const deadline = Date.now() + cfg.budget;

  // Check immediate win
  for (const m of moves) {
    const next = applyMove(state, m);
    if (next.result?.winner === aiSide) return m;
  }

  // Block immediate opponent win (medium/hard only)
  if (difficulty !== 'uczen') {
    const oppSide = aiSide === 'attackers' ? 'defenders' : 'attackers';
    for (const m of getAllLegalMoves(state.board, oppSide)) {
      const next = applyMove(state, m);
      if (next.result?.winner === oppSide) {
        // Opponent wins with m — try to find blocking move
        const blocking = moves.find(myM => {
          const s2 = applyMove(state, myM);
          const oppMovesAfter = getAllLegalMoves(s2.board, oppSide);
          return !oppMovesAfter.some(om => applyMove(s2, om).result?.winner === oppSide);
        });
        if (blocking) return blocking;
        break;
      }
    }
  }

  // Evaluate all moves
  let scored = moves.map(m => {
    if (Date.now() > deadline) return { m, score: scorePosition(applyMove(state, m), aiSide) };
    const next = applyMove(state, m);
    const score = minimax(next, cfg.depth - 1, -Infinity, Infinity, false, aiSide, rng, deadline);
    return { m, score };
  });

  const best = scored.reduce((a, b) => b.score > a.score ? b : a).score;
  const bestMoves = scored.filter(s => s.score >= best - 0.001);
  return bestMoves[Math.floor(rng() * bestMoves.length)].m;
}
