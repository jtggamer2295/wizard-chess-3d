/**
 * Cathedral Grand Tournament Manager for Wizard Chess 3D
 * Provides 4 progressive championship stages against unique Wizard Masters
 * with distinct ratings, personalities, depths, and lore dialogue.
 */

const TOURNAMENT_KEY = 'wizard_chess_tournament_state_v1';

export const TOURNAMENT_MASTERS = [
  {
    id: 'calder',
    stageIndex: 0,
    stageName: 'Quarterfinals',
    name: 'Apprentice Calder',
    title: 'Novice of the Lower Nave',
    rating: 1150,
    depth: 2,
    emblem: '🕯️',
    colorHex: '#88a0b8',
    description: 'Cautious and deliberate. Builds tight pawn structures and avoids speculative sacrifices.',
    quote: '“I have memorized the ancient scripts. Tread carefully, traveler.”',
    winDialogue: '“You breached my wall... perhaps the Sanctum chose well.”'
  },
  {
    id: 'morwenna',
    stageIndex: 1,
    stageName: 'Semifinals',
    name: 'Sorceress Morwenna',
    title: 'Mistress of the Flank Gambits',
    rating: 1480,
    depth: 3,
    emblem: '🔮',
    colorHex: '#c850f0',
    description: 'Volatile and aggressive. Unleashes early Queen attacks, Knight outposts, and tactical sacrifices.',
    quote: '“Let us see if your pieces can survive the flames of my gambit!”',
    winDialogue: '“A sharp parry! My flames could not consume your king.”'
  },
  {
    id: 'thorne',
    stageIndex: 2,
    stageName: 'Championship Finals',
    name: 'Grand Inquisitor Thorne',
    title: 'Guardian of the High Altar',
    rating: 1820,
    depth: 3,
    emblem: '⚖️',
    colorHex: '#ffd700',
    description: 'Master of deep positional squeeze. Dominates central files and coordinates lethal piece pins.',
    quote: '“Order cannot be broken by mere ambition. Show me your discipline.”',
    winDialogue: '“Remarkable fortitude. You have earned passage to the Archmage.”'
  },
  {
    id: 'ignis',
    stageIndex: 3,
    stageName: 'Sanctum Champion Challenge',
    name: 'Archmage Ignis',
    title: 'The Living Core of Wizard Chess',
    rating: 2150,
    depth: 4,
    emblem: '👑',
    colorHex: '#ff4444',
    description: 'The supreme adaptive intelligence. Counters your exact habits using deep search and learned player memory.',
    quote: '“I have observed every match you have ever fought. Your mind is an open scroll.”',
    winDialogue: '“Magnificent! The Altar bows before the new Grand Champion!”'
  }
];

export function loadTournamentState() {
  try {
    const raw = localStorage.getItem(TOURNAMENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    currentStageIndex: 0,
    isComplete: false,
    victories: [],
    trophies: []
  };
}

export function saveTournamentState(state) {
  try {
    localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(state));
  } catch (e) {}
}

export function getCurrentMaster(state) {
  const idx = Math.min(state.currentStageIndex, TOURNAMENT_MASTERS.length - 1);
  return TOURNAMENT_MASTERS[idx];
}

export function advanceTournamentStage(state) {
  if (state.currentStageIndex < TOURNAMENT_MASTERS.length - 1) {
    state.currentStageIndex += 1;
  } else {
    state.isComplete = true;
  }
  saveTournamentState(state);
  return state;
}

export function resetTournament() {
  const state = {
    currentStageIndex: 0,
    isComplete: false,
    victories: [],
    trophies: []
  };
  saveTournamentState(state);
  return state;
}
