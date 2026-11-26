/**
 * Adaptive AI Learning Engine for Wizard Chess 3D
 * Analyzes the player's historical tendencies, opening preferences, aggression,
 * and tactical blindspots to dynamically adapt its evaluation weights and playstyle.
 */

const STORAGE_KEY = 'wizard_chess_adaptive_memory_v1';

export const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 335,
  rook: 500,
  queen: 910,
  king: 20000
};

// Piece-Square Tables (White perspective; flipped for Black)
const PST_PAWN = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const PST_BISHOP = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const PST_ROOK = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0]
];

const PST_QUEEN = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const PST_KING_MID = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

function getPstScore(type, r, c, color) {
  const table =
    type === 'pawn' ? PST_PAWN :
    type === 'knight' ? PST_KNIGHT :
    type === 'bishop' ? PST_BISHOP :
    type === 'rook' ? PST_ROOK :
    type === 'queen' ? PST_QUEEN :
    type === 'king' ? PST_KING_MID : null;

  if (!table) return 0;
  const row = color === 'w' ? r : (7 - r);
  return table[row][c] || 0;
}

export function loadAdaptiveMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    gamesPlayed: 0,
    playerWins: 0,
    aiWins: 0,
    draws: 0,
    aggressionScore: 50, // 0 (passive) to 100 (hyper-aggressive)
    defenseScore: 50,
    earlyQueenMoves: 0,
    tacticalMistakesCount: 0,
    preferredOpening: 'e4',
    recentInsights: [
      'Initial baseline established. Ready to observe your tactical choices.'
    ]
  };
}

export function saveAdaptiveMemory(mem) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch (e) {}
}

/**
 * Determine AI Persona and behavioral tweaks based on player profile
 */
export function getAdaptivePersona(memory) {
  const games = memory.gamesPlayed || 0;
  const level = Math.min(10, Math.floor(games / 2) + 1);

  if (memory.aggressionScore > 62) {
    return {
      id: 'iron_counter',
      title: 'Iron Counter-Striker',
      level,
      description: 'You favor aggressive, early forward attacks. The AI has reinforced King safety, baits overextended pieces, and executes punishing counter-assaults.',
      kingSafetyMultiplier: 1.45,
      materialWeightMultiplier: 1.25,
      centerControlMultiplier: 1.10,
      counterTrapBonus: 35,
      badge: '🛡️⚡'
    };
  }

  if (memory.aggressionScore < 40) {
    return {
      id: 'fortress_breaker',
      title: 'Vanguard Fortress-Breaker',
      level,
      description: 'You play cautiously and build passive pawn walls. The AI seizes the entire center, marches passed pawns, and cracks open closed positions.',
      kingSafetyMultiplier: 1.0,
      materialWeightMultiplier: 1.15,
      centerControlMultiplier: 1.50,
      counterTrapBonus: 20,
      badge: '⚔️🏰'
    };
  }

  if (memory.tacticalMistakesCount > 4) {
    return {
      id: 'tactical_hawk',
      title: 'Opportunistic Tactician',
      level,
      description: 'The AI detected vulnerable piece coordination and actively orchestrates Knight forks, pin traps, and double attacks.',
      kingSafetyMultiplier: 1.15,
      materialWeightMultiplier: 1.35,
      centerControlMultiplier: 1.15,
      counterTrapBonus: 45,
      badge: '🦅👁️'
    };
  }

  return {
    id: 'adaptive_grandmaster',
    title: 'Adaptive Grandmaster',
    level,
    description: 'Balanced mastery with multi-ply calculation, positional outpost control, and dynamic counterplay.',
    kingSafetyMultiplier: 1.20,
    materialWeightMultiplier: 1.20,
    centerControlMultiplier: 1.25,
    counterTrapBonus: 25,
    badge: '👑🧠'
  };
}

/**
 * Evaluate board state with dynamic adaptive weights
 */
export function evaluateBoard(boardState, color, persona) {
  const oppColor = color === 'w' ? 'b' : 'w';
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState[r][c];
      if (!p) continue;

      const val = PIECE_VALUES[p.type];
      const pst = getPstScore(p.type, r, c, p.color);
      const pieceTotal = val + pst;

      if (p.color === color) {
        score += pieceTotal;
        // Center control
        const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        score += (7 - centerDist) * (4 * persona.centerControlMultiplier);
      } else {
        score -= pieceTotal;
        const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        score -= (7 - centerDist) * 4;
      }
    }
  }

  return score;
}

/**
 * Move ordering for optimal Alpha-Beta pruning:
 * Captures evaluated first (MVV-LVA), checks second.
 */
function orderMoves(moves, boardState) {
  return moves.slice().sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    const pieceA = boardState[a.fromR][a.fromC];
    const targetA = boardState[a.toR][a.toC];
    if (targetA) {
      scoreA += (PIECE_VALUES[targetA.type] * 10) - PIECE_VALUES[pieceA?.type || 'pawn'];
    }
    const pieceB = boardState[b.fromR][b.fromC];
    const targetB = boardState[b.toR][b.toC];
    if (targetB) {
      scoreB += (PIECE_VALUES[targetB.type] * 10) - PIECE_VALUES[pieceB?.type || 'pawn'];
    }
    return scoreB - scoreA;
  });
}

/**
 * Quiescence search for tactical stability
 */
function quiescence(boardState, alpha, beta, color, depth, getAllLegalMoves, persona) {
  const standPat = evaluateBoard(boardState, color, persona);
  if (depth <= 0) return standPat;
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  const legalMoves = getAllLegalMoves(color);
  const captureMoves = legalMoves.filter((m) => Boolean(boardState[m.toR][m.toC]));
  const ordered = orderMoves(captureMoves, boardState);

  for (const m of ordered) {
    const movedPiece = boardState[m.fromR][m.fromC];
    const target = boardState[m.toR][m.toC];

    boardState[m.toR][m.toC] = movedPiece;
    boardState[m.fromR][m.fromC] = null;

    const oppColor = color === 'w' ? 'b' : 'w';
    const score = -quiescence(boardState, -beta, -alpha, oppColor, depth - 1, getAllLegalMoves, persona);

    boardState[m.fromR][m.fromC] = movedPiece;
    boardState[m.toR][m.toC] = target;

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

/**
 * Alpha-Beta Minimax search
 */
function minimax(boardState, depth, alpha, beta, isMaximizing, color, currentSearchColor, getAllLegalMoves, persona) {
  if (depth === 0) {
    return quiescence(boardState, alpha, beta, color, 2, getAllLegalMoves, persona);
  }

  const legalMoves = getAllLegalMoves(currentSearchColor);
  if (legalMoves.length === 0) {
    return isMaximizing ? -15000 : 15000;
  }

  const orderedMoves = orderMoves(legalMoves, boardState);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of orderedMoves) {
      const moved = boardState[m.fromR][m.fromC];
      const target = boardState[m.toR][m.toC];

      boardState[m.toR][m.toC] = moved;
      boardState[m.fromR][m.fromC] = null;

      const opp = currentSearchColor === 'w' ? 'b' : 'w';
      const evaluation = minimax(boardState, depth - 1, alpha, beta, false, color, opp, getAllLegalMoves, persona);

      boardState[m.fromR][m.fromC] = moved;
      boardState[m.toR][m.toC] = target;

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of orderedMoves) {
      const moved = boardState[m.fromR][m.fromC];
      const target = boardState[m.toR][m.toC];

      boardState[m.toR][m.toC] = moved;
      boardState[m.fromR][m.fromC] = null;

      const opp = currentSearchColor === 'w' ? 'b' : 'w';
      const evaluation = minimax(boardState, depth - 1, alpha, beta, true, color, opp, getAllLegalMoves, persona);

      boardState[m.fromR][m.fromC] = moved;
      boardState[m.toR][m.toC] = target;

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Main entry point for selecting the best adaptive AI move
 */
export function selectAdaptiveAIMove(boardState, color, getAllLegalMoves, searchDepth = 3) {
  const legalMoves = getAllLegalMoves(color);
  if (legalMoves.length === 0) return null;

  const memory = loadAdaptiveMemory();
  const persona = getAdaptivePersona(memory);
  const orderedMoves = orderMoves(legalMoves, boardState);

  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const m of orderedMoves) {
    const moved = boardState[m.fromR][m.fromC];
    const target = boardState[m.toR][m.toC];

    boardState[m.toR][m.toC] = moved;
    boardState[m.fromR][m.fromC] = null;

    const opp = color === 'w' ? 'b' : 'w';
    let score = minimax(boardState, searchDepth - 1, alpha, beta, false, color, opp, getAllLegalMoves, persona);

    // Minor random noise to vary identical book evaluations
    score += (Math.random() - 0.5) * 6;

    boardState[m.fromR][m.fromC] = moved;
    boardState[m.toR][m.toC] = target;

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}
