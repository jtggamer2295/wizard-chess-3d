import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { TOURNAMENT_MASTERS, loadTournamentState } from './engine/tournament.js';
import {
  loadAdaptiveMemory,
  getAdaptivePersona,
  AI_DIFFICULTY_LEVELS,
  loadDifficulty,
  getDifficultyConfig
} from './engine/adaptiveAI.js';
import { loadScoreboard, resetScoreboard } from './engine/scoreboard.js';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [aiMindOpen, setAiMindOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ color: 'w' | 'b' } | null>(null);
  const [gameMode, setGameMode] = useState<'single' | 'pvp' | 'tournament'>('single');
  const [difficulty, setDifficulty] = useState<string>(loadDifficulty());
  const [scoreboard, setScoreboard] = useState(loadScoreboard());
  const [tacticalBadgesOn, setTacticalBadgesOn] = useState(true);
  const [pvpAutoFlipOn, setPvpAutoFlipOn] = useState(true);
  const [tournamentState, setTournamentState] = useState(loadTournamentState());
  const [adaptiveMemory, setAdaptiveMemory] = useState(loadAdaptiveMemory());

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setTournamentOpen(false);
        setAiMindOpen(false);
        setScoreboardOpen(false);
        if (pendingPromotion) {
          const win = window as unknown as { wizardChess?: { cancelPendingPromotion?: () => void } };
          win.wizardChess?.cancelPendingPromotion?.();
          setPendingPromotion(null);
        }
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    const handlePromotionRequired = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPendingPromotion({ color: detail?.color === 'b' ? 'b' : 'w' });
    };
    const handlePromotionCleared = () => {
      setPendingPromotion(null);
    };
    const handleScoreUpdated = () => {
      setScoreboard(loadScoreboard());
    };
    const handleDifficultyChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.difficulty) setDifficulty(detail.difficulty);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('wizardchess:promotion-required', handlePromotionRequired);
    window.addEventListener('wizardchess:promotion-cleared', handlePromotionCleared);
    window.addEventListener('wizardchess:score-updated', handleScoreUpdated);
    window.addEventListener('wizardchess:difficulty-changed', handleDifficultyChanged);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wizardchess:promotion-required', handlePromotionRequired);
      window.removeEventListener('wizardchess:promotion-cleared', handlePromotionCleared);
      window.removeEventListener('wizardchess:score-updated', handleScoreUpdated);
      window.removeEventListener('wizardchess:difficulty-changed', handleDifficultyChanged);
    };
  }, [pendingPromotion]);

  const handleRestoreUI = () => {
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Hide UI [H]';
    }
  };

  const handleSwitchMode = (mode: 'single' | 'pvp' | 'tournament') => {
    setGameMode(mode);
    setMobileSheetOpen(false);
    const win = window as unknown as { wizardChess?: { setGameMode?: (m: string) => void } };
    if (win.wizardChess?.setGameMode) {
      win.wizardChess.setGameMode(mode);
    }
  };

  const handleToggleBadges = () => {
    const nextVal = !tacticalBadgesOn;
    setTacticalBadgesOn(nextVal);
    const win = window as unknown as { wizardChess?: { toggleTacticalBadges?: (v: boolean) => void } };
    if (win.wizardChess?.toggleTacticalBadges) {
      win.wizardChess.toggleTacticalBadges(nextVal);
    }
  };

  const handleTogglePvpAutoFlip = () => {
    const nextVal = !pvpAutoFlipOn;
    setPvpAutoFlipOn(nextVal);
    const win = window as unknown as { wizardChess?: { setPvpAutoFlip?: (v: boolean) => void } };
    if (win.wizardChess?.setPvpAutoFlip) {
      win.wizardChess.setPvpAutoFlip(nextVal);
    }
  };

  const handleOpenTournament = () => {
    setTournamentState(loadTournamentState());
    setTournamentOpen(true);
    setMobileSheetOpen(false);
  };

  const handleOpenAiMind = () => {
    setAdaptiveMemory(loadAdaptiveMemory());
    setAiMindOpen(true);
    setMobileSheetOpen(false);
  };

  const handleStartTournamentMatch = (stageIdx: number) => {
    setTournamentOpen(false);
    setGameMode('tournament');
    const win = window as unknown as { wizardChess?: { startTournamentStage?: (idx: number) => void } };
    if (win.wizardChess?.startTournamentStage) {
      win.wizardChess.startTournamentStage(stageIdx);
    }
  };

  const handleSelectDifficulty = (levelId: string) => {
    setDifficulty(levelId);
    const win = window as unknown as { wizardChess?: { setDifficulty?: (l: string) => void } };
    if (win.wizardChess?.setDifficulty) {
      win.wizardChess.setDifficulty(levelId);
    }
  };

  const handleChoosePromotion = (pieceType: 'queen' | 'rook' | 'bishop' | 'knight') => {
    setPendingPromotion(null);
    const win = window as unknown as {
      wizardChess?: { completePendingPromotion?: (p: string) => void };
    };
    win.wizardChess?.completePendingPromotion?.(pieceType);
  };

  const handleCancelPromotion = () => {
    setPendingPromotion(null);
    const win = window as unknown as {
      wizardChess?: { cancelPendingPromotion?: () => void };
    };
    win.wizardChess?.cancelPendingPromotion?.();
  };

  const handleResetScoreboard = () => {
    setScoreboard(resetScoreboard());
  };

  const persona = getAdaptivePersona(adaptiveMemory);
  const diffConfig = getDifficultyConfig(difficulty);
  const hudScoreText =
    gameMode === 'pvp'
      ? `P1 ${scoreboard.pvp.whiteWins} – P2 ${scoreboard.pvp.blackWins} (D ${scoreboard.pvp.draws})`
      : gameMode === 'tournament'
      ? `W ${scoreboard.tournament.wins} – L ${scoreboard.tournament.losses} – D ${scoreboard.tournament.draws}`
      : `W ${scoreboard.single.wins} – L ${scoreboard.single.losses} – D ${scoreboard.single.draws}`;

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Wizard Chess</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Summoning Sanctum Architecture &amp; Sculpted Pieces...</div>
      </div>

      <div id="canvas-container"></div>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Show HUD Controls"
      >
        Show UI
      </button>

      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <div className="brand-pill">
            <span className="brand-title">Wizard Chess</span>
          </div>

          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">White to Move</span>
            <span className="mode-badge" id="mode-badge">
              {gameMode === 'pvp'
                ? 'Pass & Play (PvP)'
                : gameMode === 'tournament'
                ? 'Cathedral Tournament'
                : 'Playing as White (vs AI)'}
            </span>
          </div>

          <button
            type="button"
            className="ai-mind-pill"
            id="btn-ai-mind-pill"
            onClick={handleOpenAiMind}
            title="Inspect AI Adaptive Memory & Playstyle Analysis"
          >
            <span>{persona.badge}</span>
            <span>{persona.title} (Lvl {persona.level})</span>
          </button>

          <button
            type="button"
            className="ai-mind-pill score-pill"
            id="btn-scoreboard-pill"
            onClick={() => {
              setScoreboard(loadScoreboard());
              setScoreboardOpen(true);
            }}
            title="View Match Scoreboard & History"
          >
            <span>📊</span>
            <span>{hudScoreText}</span>
          </button>
        </div>

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          {mobileSheetOpen ? 'Close' : 'Controls'}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Controls</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Close Controls"
            >
              Close ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Game Mode</div>

          <div className="mode-segmented-group" style={{ gridColumn: 'span 6' }}>
            <button
              type="button"
              className={`mode-segment-btn ${gameMode === 'single' ? 'active' : ''}`}
              id="btn-mode-ai"
              onClick={() => handleSwitchMode('single')}
            >
              Vs Adaptive AI
            </button>
            <button
              type="button"
              className={`mode-segment-btn ${gameMode === 'pvp' ? 'active' : ''}`}
              id="btn-mode-pvp"
              onClick={() => handleSwitchMode('pvp')}
            >
              Pass &amp; Play (PvP)
            </button>
            <button
              type="button"
              className={`mode-segment-btn ${gameMode === 'tournament' ? 'active' : ''}`}
              id="btn-mode-tournament"
              onClick={handleOpenTournament}
            >
              🏆 Tournament
            </button>
          </div>

          {gameMode === 'single' && (
            <>
              <div className="mobile-sheet-section-label">
                <span>AI Difficulty</span>
                <span className="mobile-sheet-section-sub">{diffConfig.description}</span>
              </div>
              <div className="mode-segmented-group difficulty-segmented-group" style={{ gridColumn: 'span 6' }}>
                {AI_DIFFICULTY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    id={`btn-diff-${lvl.id}`}
                    className={`mode-segment-btn ${difficulty === lvl.id ? 'active' : ''}`}
                    title={lvl.description}
                    onClick={() => handleSelectDifficulty(lvl.id)}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mobile-sheet-section-label">Game Actions</div>

          <button
            className="hud-btn"
            id="btn-side-toggle"
            title="Switch between Playing as White and Playing as Black"
            onClick={() => setMobileSheetOpen(false)}
          >
            Play as Black
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title="Let the AI make the next move immediately"
            onClick={() => setMobileSheetOpen(false)}
          >
            AI Move
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Start a fresh game on the altar"
            onClick={() => setMobileSheetOpen(false)}
          >
            New Game
          </button>

          <button
            type="button"
            className={`hud-btn ${tacticalBadgesOn ? 'active' : ''}`}
            id="btn-toggle-badges"
            title="Toggle Tactical Piece Badges & Pedestal Rings"
            onClick={handleToggleBadges}
          >
            {tacticalBadgesOn ? '✦ Badges: ON' : '✦ Badges: OFF'}
          </button>

          {gameMode === 'pvp' && (
            <button
              type="button"
              className={`hud-btn ${pvpAutoFlipOn ? 'active' : ''}`}
              id="btn-pvp-autoflip"
              title="Automatically orbit camera 180° to active player's side each turn"
              onClick={handleTogglePvpAutoFlip}
            >
              {pvpAutoFlipOn ? 'Auto-Flip: ON' : 'Auto-Flip: OFF'}
            </button>
          )}

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Camera Views</span>
            <span className="mobile-sheet-section-sub">Tap active view to flip</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Player Camera (Click again to flip White / Black view)"
          >
            Player Cam
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Overhead Board View (Click again to flip White / Black orientation)"
          >
            Overhead
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Side Profile View (Click again to switch East / West side)"
          >
            Side
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Wide Cathedral View (Click again to switch North Rose / South Narthex)"
          >
            Cathedral
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Display &amp; Gestures</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Toggle HUD visibility (Shortcut: H)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Hide UI [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Touch:</strong> Tap Piece to Move &nbsp;•&nbsp; 1-Finger Drag: Orbit &nbsp;•&nbsp; 2-Finger Drag: Pan &nbsp;•&nbsp; Pinch: Zoom
          </div>
        </div>
      </div>

      <div id="hud-bottom">
        <div id="piece-hover-banner"></div>
        <div className="hint-pill" id="controls-hint">
          <strong>Controls:</strong> Click Piece to Move &nbsp;•&nbsp; Left-Drag: Orbit &nbsp;•&nbsp; Right-Drag: Pan &nbsp;•&nbsp; Scroll: Zoom &nbsp;•&nbsp; H: Hide UI
        </div>
        <div className="captured-pill" id="captured-tray"></div>
      </div>

      {/* Tournament Bracket Modal */}
      <div
        className={`gothic-modal-overlay ${tournamentOpen ? 'open' : ''}`}
        id="tournament-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cathedral Grand Tournament"
        onClick={() => setTournamentOpen(false)}
      >
        <div className="gothic-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="gothic-modal-header">
            <div>
              <div className="gothic-modal-title">
                <span>🏆</span>
                <span>Cathedral Grand Tournament</span>
              </div>
              <div className="gothic-modal-subtitle">
                Ascend the Sanctum Altar by defeating 4 legendary Wizard Masters.
              </div>
            </div>
            <button
              type="button"
              className="gothic-modal-close"
              onClick={() => setTournamentOpen(false)}
              aria-label="Close Tournament"
            >
              ✕
            </button>
          </div>

          <div className="tournament-grid">
            {TOURNAMENT_MASTERS.map((master, idx) => {
              const isDefeated = tournamentState.currentStageIndex > idx;
              const isCurrent = tournamentState.currentStageIndex === idx;
              const isLocked = tournamentState.currentStageIndex < idx;

              return (
                <div
                  key={master.id}
                  className={`tournament-card ${
                    isCurrent ? 'active' : isDefeated ? 'defeated' : 'locked'
                  }`}
                >
                  <div className="master-info-wrap">
                    <div className="master-emblem">{master.emblem}</div>
                    <div className="master-details">
                      <div className="master-stage">{master.stageName}</div>
                      <div className="master-name">
                        {master.name}{' '}
                        <span className="master-rating">({master.rating})</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {master.title} • {master.description}
                      </div>
                      <div className="master-quote">{master.quote}</div>
                    </div>
                  </div>

                  <div>
                    {isDefeated ? (
                      <span style={{ color: '#4ea8de', fontWeight: 700, fontSize: '0.85rem' }}>
                        ✓ DEFEATED
                      </span>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        className="master-action-btn"
                        onClick={() => handleStartTournamentMatch(idx)}
                      >
                        Enter Duel ⚔️
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>🔒 Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Adaptive AI Mind Modal */}
      <div
        className={`gothic-modal-overlay ${aiMindOpen ? 'open' : ''}`}
        id="ai-mind-modal"
        role="dialog"
        aria-modal="true"
        aria-label="AI Adaptive Mind Intel"
        onClick={() => setAiMindOpen(false)}
      >
        <div className="gothic-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="gothic-modal-header">
            <div>
              <div className="gothic-modal-title">
                <span>🧠</span>
                <span>AI Sanctum Mind: {persona.title}</span>
              </div>
              <div className="gothic-modal-subtitle">
                Continuous telemetry analyzing your playstyle, aggression, and tactical blindspots.
              </div>
            </div>
            <button
              type="button"
              className="gothic-modal-close"
              onClick={() => setAiMindOpen(false)}
              aria-label="Close AI Mind"
            >
              ✕
            </button>
          </div>

          <div className="ai-mind-metrics">
            <div className="metric-card">
              <span className="metric-val">{adaptiveMemory.aggressionScore || 50}%</span>
              <span className="metric-label">Aggression Index</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">{adaptiveMemory.defenseScore || 50}%</span>
              <span className="metric-label">Defense Rating</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">{adaptiveMemory.gamesPlayed || 0}</span>
              <span className="metric-label">Matches Observed</span>
            </div>
          </div>

          <div className="ai-mind-insight-box">
            <div className="ai-mind-insight-title">Active AI Strategy &amp; Counter-Measures</div>
            <div className="ai-mind-insight-text">{persona.description}</div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            <strong>How the AI Learns:</strong> Every forward pawn push, early Queen development, king shelter sacrifice, or tactical blunder shifts the AI's internal Minimax weights in real time.
          </div>
        </div>
      </div>

      {/* Pawn Promotion Modal (Standard Chess Rules) */}
      <div
        className={`gothic-modal-overlay ${pendingPromotion ? 'open' : ''}`}
        id="promotion-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose Pawn Promotion Piece"
      >
        <div className="gothic-modal-box promotion-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="gothic-modal-header">
            <div>
              <div className="gothic-modal-title">
                <span>{pendingPromotion?.color === 'b' ? '♛' : '♕'}</span>
                <span>Pawn Promotion</span>
              </div>
              <div className="gothic-modal-subtitle">
                Standard Chess Rules: Choose the piece your pawn ascends into.
              </div>
            </div>
            <button
              type="button"
              className="gothic-modal-close"
              onClick={handleCancelPromotion}
              aria-label="Cancel Move"
              title="Cancel Move (Esc)"
            >
              ✕
            </button>
          </div>

          <div className="promotion-grid">
            {(
              [
                { type: 'queen', label: 'Queen', whiteSym: '♕', blackSym: '♛', pts: '9 pts' },
                { type: 'rook', label: 'Rook', whiteSym: '♖', blackSym: '♜', pts: '5 pts' },
                { type: 'bishop', label: 'Bishop', whiteSym: '♗', blackSym: '♝', pts: '3 pts' },
                { type: 'knight', label: 'Knight', whiteSym: '♘', blackSym: '♞', pts: '3 pts' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.type}
                type="button"
                id={`btn-promote-${opt.type}`}
                className="promotion-choice-btn"
                onClick={() => handleChoosePromotion(opt.type)}
              >
                <span className="promotion-symbol">
                  {pendingPromotion?.color === 'b' ? opt.blackSym : opt.whiteSym}
                </span>
                <span className="promotion-label">{opt.label}</span>
                <span className="promotion-pts">{opt.pts}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scoreboard Modal */}
      <div
        className={`gothic-modal-overlay ${scoreboardOpen ? 'open' : ''}`}
        id="scoreboard-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sanctum Scoreboard"
        onClick={() => setScoreboardOpen(false)}
      >
        <div className="gothic-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="gothic-modal-header">
            <div>
              <div className="gothic-modal-title">
                <span>📊</span>
                <span>Sanctum Scoreboard</span>
              </div>
              <div className="gothic-modal-subtitle">
                Persistent match records across Adaptive AI, Pass &amp; Play PvP, and Tournament duels.
              </div>
            </div>
            <button
              type="button"
              className="gothic-modal-close"
              onClick={() => setScoreboardOpen(false)}
              aria-label="Close Scoreboard"
            >
              ✕
            </button>
          </div>

          <div className="ai-mind-metrics">
            <div className="metric-card">
              <span className="metric-val">
                {scoreboard.single.wins} – {scoreboard.single.losses} – {scoreboard.single.draws}
              </span>
              <span className="metric-label">Vs AI (W – L – D)</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">
                {scoreboard.pvp.whiteWins} – {scoreboard.pvp.blackWins} – {scoreboard.pvp.draws}
              </span>
              <span className="metric-label">PvP (P1 – P2 – D)</span>
            </div>
            <div className="metric-card">
              <span className="metric-val">
                {scoreboard.single.streak} (Best {scoreboard.single.bestStreak})
              </span>
              <span className="metric-label">AI Win Streak</span>
            </div>
          </div>

          <div className="ai-mind-insight-box">
            <div className="ai-mind-insight-title">Recent Matches</div>
            {scoreboard.recentMatches.length === 0 ? (
              <div className="ai-mind-insight-text">No completed matches recorded yet.</div>
            ) : (
              <div className="scoreboard-history-list">
                {scoreboard.recentMatches.map((m, idx) => (
                  <div key={idx} className="scoreboard-history-row">
                    <span>
                      <strong>{m.outcome}</strong> ({m.mode.toUpperCase()})
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                      {m.reason} • {m.moves} moves
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              id="btn-reset-scoreboard"
              className="hud-btn"
              onClick={handleResetScoreboard}
            >
              Reset Scoreboard
            </button>
          </div>
        </div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Sanctum Judgment &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Checkmate</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            White Triumphs • The Black King Has Fallen
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Replay King Fall
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              New Game
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
