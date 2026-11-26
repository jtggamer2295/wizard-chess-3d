/**
 * Persistent Scoreboard & Material Advantage Calculator for Wizard Chess 3D
 */

const SCOREBOARD_KEY = 'wizard_chess_scoreboard_v1';

export const MATERIAL_POINTS = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};

function defaultScoreboard() {
  return {
    single: { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 },
    pvp: { whiteWins: 0, blackWins: 0, draws: 0 },
    tournament: { wins: 0, losses: 0, draws: 0 },
    recentMatches: []
  };
}

export function loadScoreboard() {
  try {
    const raw = localStorage.getItem(SCOREBOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultScoreboard();
      return {
        single: { ...base.single, ...(parsed.single || {}) },
        pvp: { ...base.pvp, ...(parsed.pvp || {}) },
        tournament: { ...base.tournament, ...(parsed.tournament || {}) },
        recentMatches: Array.isArray(parsed.recentMatches) ? parsed.recentMatches : []
      };
    }
  } catch (e) {}
  return defaultScoreboard();
}

export function saveScoreboard(board) {
  try {
    localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(board));
  } catch (e) {}
}

export function resetScoreboard() {
  const fresh = defaultScoreboard();
  saveScoreboard(fresh);
  return fresh;
}

/**
 * Record a completed match outcome.
 * @param {'single'|'pvp'|'tournament'} mode
 * @param {'w'|'b'|'draw'} winnerColor
 * @param {'w'|'b'} playerColor
 * @param {string} reason - e.g. 'Checkmate' | 'Stalemate'
 * @param {number} moveCount
 */
export function recordMatchScore(mode, winnerColor, playerColor, reason = 'Checkmate', moveCount = 0) {
  const sb = loadScoreboard();
  const isDraw = winnerColor === 'draw';

  if (mode === 'pvp') {
    if (isDraw) {
      sb.pvp.draws += 1;
    } else if (winnerColor === 'w') {
      sb.pvp.whiteWins += 1;
    } else {
      sb.pvp.blackWins += 1;
    }
  } else if (mode === 'tournament') {
    if (isDraw) {
      sb.tournament.draws += 1;
    } else if (winnerColor === playerColor) {
      sb.tournament.wins += 1;
    } else {
      sb.tournament.losses += 1;
    }
  } else {
    // 'single' or fallback
    if (isDraw) {
      sb.single.draws += 1;
      sb.single.streak = 0;
    } else if (winnerColor === playerColor) {
      sb.single.wins += 1;
      sb.single.streak += 1;
      sb.single.bestStreak = Math.max(sb.single.bestStreak, sb.single.streak);
    } else {
      sb.single.losses += 1;
      sb.single.streak = 0;
    }
  }

  let outcomeLabel = 'Draw';
  if (!isDraw) {
    if (mode === 'pvp') {
      outcomeLabel = winnerColor === 'w' ? 'Player 1 (White) Won' : 'Player 2 (Black) Won';
    } else {
      outcomeLabel = winnerColor === playerColor ? 'Victory' : 'Defeat';
    }
  }

  sb.recentMatches.unshift({
    mode,
    outcome: outcomeLabel,
    reason,
    moves: moveCount,
    timestamp: Date.now()
  });
  if (sb.recentMatches.length > 10) {
    sb.recentMatches = sb.recentMatches.slice(0, 10);
  }

  saveScoreboard(sb);
  return sb;
}

/**
 * Calculate current material advantage from the 8x8 boardState.
 * @returns {{ whitePoints: number, blackPoints: number, diff: number, label: string }}
 */
export function computeMaterialScore(boardState) {
  let whitePoints = 0;
  let blackPoints = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState?.[r]?.[c];
      if (!p) continue;
      const pts = MATERIAL_POINTS[p.type] || 0;
      if (p.color === 'w') whitePoints += pts;
      else blackPoints += pts;
    }
  }
  const diff = whitePoints - blackPoints;
  let label = 'Even';
  if (diff > 0) label = `White +${diff}`;
  else if (diff < 0) label = `Black +${Math.abs(diff)}`;
  return { whitePoints, blackPoints, diff, label };
}
