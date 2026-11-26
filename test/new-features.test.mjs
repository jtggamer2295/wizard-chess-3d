import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECE_TACTICAL_CONFIG } from '../src/engine/tacticalBadges.js';
import {
  PIECE_VALUES,
  loadAdaptiveMemory,
  getAdaptivePersona,
  evaluateBoard
} from '../src/engine/adaptiveAI.js';
import {
  TOURNAMENT_MASTERS,
  loadTournamentState,
  advanceTournamentStage,
  getCurrentMaster
} from '../src/engine/tournament.js';

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
