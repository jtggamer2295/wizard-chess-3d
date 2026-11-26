import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECE_TACTICAL_CONFIG } from '../src/engine/tacticalBadges.js';
import {
  PIECE_VALUES,
  loadAdaptiveMemory,
  getAdaptivePersona,
  evaluateBoard,
  AI_DIFFICULTY_LEVELS,
  getDifficultyConfig
} from '../src/engine/adaptiveAI.js';
import {
  TOURNAMENT_MASTERS,
  loadTournamentState,
  advanceTournamentStage,
  getCurrentMaster
} from '../src/engine/tournament.js';
import {
  recordMatchScore,
  loadScoreboard,
  resetScoreboard,
  computeMaterialScore
} from '../src/engine/scoreboard.js';
import fs from 'node:fs';
import path from 'node:path';

test('Tactical Piece Badges configuration covers all 6 piece types with distinct colors & symbols', () => {
  const pieceTypes = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  const colorsUsed = new Set();
  const symbolsUsed = new Set();

  for (const type of pieceTypes) {
    const cfg = PIECE_TACTICAL_CONFIG[type];
    assert.ok(cfg, `Missing tactical configuration for piece ${type}`);
    assert.ok(cfg.symbol, `Missing symbol for piece ${type}`);
    assert.ok(cfg.color, `Missing color for piece ${type}`);
    assert.ok(cfg.ringRadius > 0.25, `Invalid ring radius for ${type}`);

    assert.ok(!colorsUsed.has(cfg.color), `Duplicate color found for ${type}`);
    assert.ok(!symbolsUsed.has(cfg.symbol), `Duplicate symbol found for ${type}`);

    colorsUsed.add(cfg.color);
    symbolsUsed.add(cfg.symbol);
  }
});

test('Adaptive AI adjusts persona based on player aggression and tactical profile', () => {
  // Baseline profile
  const defaultMemory = {
    gamesPlayed: 0,
    aggressionScore: 50,
    defenseScore: 50,
    tacticalMistakesCount: 0
  };
  const basePersona = getAdaptivePersona(defaultMemory);
  assert.equal(basePersona.id, 'adaptive_grandmaster');

  // Aggressive player profile -> triggers Iron Counter-Striker
  const aggressiveMemory = {
    gamesPlayed: 6,
    aggressionScore: 78,
    defenseScore: 40,
    tacticalMistakesCount: 1
  };
  const counterPersona = getAdaptivePersona(aggressiveMemory);
  assert.equal(counterPersona.id, 'iron_counter');
  assert.ok(counterPersona.kingSafetyMultiplier > 1.2);

  // Passive player profile -> triggers Vanguard Fortress-Breaker
  const passiveMemory = {
    gamesPlayed: 8,
    aggressionScore: 30,
    defenseScore: 70,
    tacticalMistakesCount: 0
  };
  const breakerPersona = getAdaptivePersona(passiveMemory);
  assert.equal(breakerPersona.id, 'fortress_breaker');
  assert.ok(breakerPersona.centerControlMultiplier > 1.3);

  // Error-prone player profile -> triggers Opportunistic Tactician
  const errorProneMemory = {
    gamesPlayed: 5,
    aggressionScore: 50,
    defenseScore: 50,
    tacticalMistakesCount: 7
  };
  const hawkPersona = getAdaptivePersona(errorProneMemory);
  assert.equal(hawkPersona.id, 'tactical_hawk');
});

test('Cathedral Grand Tournament contains 4 progressive stages culminating in Archmage Ignis', () => {
  assert.equal(TOURNAMENT_MASTERS.length, 4);

  const expectedIds = ['calder', 'morwenna', 'thorne', 'ignis'];
  for (let i = 0; i < TOURNAMENT_MASTERS.length; i++) {
    const master = TOURNAMENT_MASTERS[i];
    assert.equal(master.id, expectedIds[i]);
    assert.equal(master.stageIndex, i);
    assert.ok(master.rating > 1000, `Rating too low for ${master.name}`);
    assert.ok(master.depth >= 2, `Search depth too low for ${master.name}`);
    assert.ok(master.quote.length > 5, `Missing quote for ${master.name}`);
  }

  // Test stage progression
  let state = { currentStageIndex: 0, isComplete: false };
  assert.equal(getCurrentMaster(state).id, 'calder');

  state = advanceTournamentStage(state);
  assert.equal(getCurrentMaster(state).id, 'morwenna');

  state = advanceTournamentStage(state);
  assert.equal(getCurrentMaster(state).id, 'thorne');

  state = advanceTournamentStage(state);
  assert.equal(getCurrentMaster(state).id, 'ignis');

  state = advanceTournamentStage(state);
  assert.ok(state.isComplete);
});


test('AI Difficulty Levels span easy through grandmaster with increasing search depth', () => {
  assert.equal(AI_DIFFICULTY_LEVELS.length, 4);
  const depths = AI_DIFFICULTY_LEVELS.map((d) => d.depth);
  assert.deepEqual(depths, [1, 2, 3, 4]);
  assert.equal(getDifficultyConfig('easy').label, 'Novice');
  assert.equal(getDifficultyConfig('grandmaster').depth, 4);
  assert.equal(getDifficultyConfig('unknown_id').id, 'medium');
});

test('Scoreboard records wins, losses, draws, and material advantage accurately', () => {
  // Mock localStorage in Node
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  };

  resetScoreboard();
  let sb = recordMatchScore('single', 'w', 'w', 'Checkmate', 24);
  assert.equal(sb.single.wins, 1);
  assert.equal(sb.single.streak, 1);
  assert.equal(sb.single.bestStreak, 1);

  sb = recordMatchScore('single', 'b', 'w', 'Checkmate', 31);
  assert.equal(sb.single.losses, 1);
  assert.equal(sb.single.streak, 0);
  assert.equal(sb.single.bestStreak, 1);

  sb = recordMatchScore('pvp', 'b', 'w', 'Checkmate', 40);
  assert.equal(sb.pvp.blackWins, 1);

  sb = recordMatchScore('pvp', 'draw', 'w', 'Stalemate', 52);
  assert.equal(sb.pvp.draws, 1);
  assert.equal(loadScoreboard().recentMatches.length, 4);

  // Material advantage calculation
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][0] = { type: 'queen', color: 'w' }; // 9
  board[7][0] = { type: 'rook', color: 'b' };  // 5
  const mat = computeMaterialScore(board);
  assert.equal(mat.whitePoints, 9);
  assert.equal(mat.blackPoints, 5);
  assert.equal(mat.diff, 4);
  assert.equal(mat.label, 'White +4');
});

test('Standard Chess Pawn Promotion supports queen, rook, bishop, and knight', () => {
  const engineSrc = fs.readFileSync(path.resolve('src/wizardChessEngine.js'), 'utf8');
  assert.ok(engineSrc.includes("const validPromotions = ['queen', 'rook', 'bishop', 'knight']"));
  assert.ok(engineSrc.includes('completePendingPromotion'));
  assert.ok(engineSrc.includes('wizardchess:promotion-required'));

  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  assert.ok(appSrc.includes('id="promotion-modal"'));
  assert.ok(appSrc.includes('btn-promote-${opt.type}'));
  assert.ok(appSrc.includes("type: 'knight'"));
  assert.ok(appSrc.includes("type: 'rook'"));
  assert.ok(appSrc.includes("type: 'bishop'"));
  assert.ok(appSrc.includes("type: 'queen'"));
});
