import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI } from '../utils/api';
import PuzzleBoard from '../components/PuzzleBoard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/AiPages.css';

const PUZZLE_THEMES = ['all', 'fork', 'pin', 'skewer', 'checkmate', 'sacrifice', 'discovered_attack', 'tactic'];
const DIFFICULTIES = ['all', 'beginner', 'easy', 'medium', 'hard', 'expert'];

const AiPuzzlesPage = () => {
  const [view, setView] = useState('browse');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const loadPuzzles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (theme !== 'all') params.theme = theme;
      if (difficulty !== 'all') params.difficulty = difficulty;
      const res = await aiAPI.getPuzzles(params);
      setPuzzles(res.data.puzzles || []);
    } catch (err) {
      setError('Failed to load puzzles');
    }
    setLoading(false);
  }, [theme, difficulty]);

  const loadDailyPuzzle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getDailyPuzzle();
      setCurrentPuzzle(res.data.puzzle);
      setView('solve');
      setSolved(false);
      setResult(null);
    } catch (err) {
      setError('Failed to load daily puzzle');
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await aiAPI.getPuzzleStats();
      setStats(res.data.stats);
    } catch {}
  }, []);

  useEffect(() => {
    if (view === 'browse') loadPuzzles();
    if (view === 'stats') loadStats();
  }, [view, loadPuzzles, loadStats]);

  const openPuzzle = useCallback((puzzle) => {
    setCurrentPuzzle(puzzle);
    setView('solve');
    setSolved(false);
    setResult(null);
  }, []);

  const handleSolve = useCallback(async (move) => {
    if (!currentPuzzle || solved) return;
    try {
      const res = await aiAPI.solvePuzzle(currentPuzzle._id, { move });
      setResult(res.data);
      if (res.data.correct) {
        setSolved(true);
      }
    } catch (err) {
      setError('Failed to check solution');
    }
  }, [currentPuzzle, solved]);

  const nextPuzzle = useCallback(() => {
    const idx = puzzles.findIndex(p => p._id === currentPuzzle?._id);
    if (idx < puzzles.length - 1) {
      setCurrentPuzzle(puzzles[idx + 1]);
      setSolved(false);
      setResult(null);
    } else {
      loadPuzzles();
      setView('browse');
    }
  }, [puzzles, currentPuzzle, loadPuzzles]);

  const generateFromAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const { analysisAPI } = require('../utils/api');
      const analyses = await analysisAPI.getMyAnalyses({ limit: 5 });
      const lastAnalysis = analyses.data?.analyses?.[0];
      if (lastAnalysis) {
        await aiAPI.generatePuzzles({ analysisId: lastAnalysis._id });
        loadPuzzles();
      } else {
        setError('No analyzed games found. Analyze a game first!');
      }
    } catch (err) {
      setError('Failed to generate puzzles');
    }
    setLoading(false);
  }, [loadPuzzles]);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>Tactical Puzzles</h1>
        <p>Sharpen your tactics with puzzles from Lichess and AI analysis</p>
        <div className="header-actions">
          <button className={`btn ${view === 'browse' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('browse')}>
            Browse Puzzles
          </button>
          <button className={`btn ${view === 'solve' ? 'btn-primary' : 'btn-outline'}`} onClick={loadDailyPuzzle}>
            Daily Puzzle
          </button>
          <button className={`btn ${view === 'stats' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('stats')}>
            Stats
          </button>
          <button className="btn btn-secondary" onClick={generateFromAnalysis} disabled={loading}>
            From Your Game
          </button>
          <button className="btn btn-secondary" onClick={async () => { try { await aiAPI.syncLichessPuzzles(); loadPuzzles(); } catch { setError('Failed to sync'); } }} disabled={loading}>
            Sync Lichess
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" onClick={() => setError(null)}>{error}</div>}

      {view === 'browse' && (
        <div className="puzzles-browse">
          <div className="puzzles-filters">
            <div className="filter-group">
              <label>Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {PUZZLE_THEMES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="puzzles-grid">
              {puzzles.map(p => (
                  <div key={p._id} className="puzzle-card" onClick={() => openPuzzle(p)}>
                    <div className="puzzle-card-header">
                      <span className={`puzzle-difficulty difficulty-${p.difficulty}`}>{p.difficulty}</span>
                      <span className={`puzzle-source source-${p.source}`}>{p.source === 'lichess' || p.source === 'lichess_daily' ? 'Lichess' : p.source}</span>
                    </div>
                    <div className="puzzle-card-body">
                      <span className="puzzle-theme">{p.theme?.replace(/_/g, ' ')}</span>
                      <span className="puzzle-rating">&#9733; {p.rating}</span>
                      <span className="puzzle-side">{p.playerSide === 'w' ? 'White' : 'Black'} to move</span>
                    </div>
                    <div className="puzzle-card-footer">
                      <span className="puzzle-solved">Solved {p.timesSolved || 0}x</span>
                    </div>
                </div>
              ))}
              {puzzles.length === 0 && <p className="text-muted">No puzzles found matching your filters.</p>}
            </div>
          )}
        </div>
      )}

      {view === 'solve' && currentPuzzle && (
        <div className="puzzle-solve">
          <div className="puzzle-solve-layout">
            <div className="puzzle-board-wrapper">
              <PuzzleBoard
                fen={currentPuzzle.fen}
                playerSide={currentPuzzle.playerSide}
                onSolve={handleSolve}
                boardWidth={460}
              />
            </div>
            <div className="puzzle-info">
              <div className="puzzle-meta">
                <h2>{currentPuzzle.theme?.replace(/_/g, ' ')} Puzzle</h2>
                <div className="puzzle-badges">
                  <span className={`badge badge-${currentPuzzle.difficulty}`}>{currentPuzzle.difficulty}</span>
                  <span className="badge badge-info">&#9733; {currentPuzzle.rating}</span>
                  <span className="badge badge-info">{currentPuzzle.playerSide === 'w' ? 'White' : 'Black'} to move</span>
                  <span className={`badge puzzle-source source-${currentPuzzle.source}`}>{currentPuzzle.source === 'lichess' || currentPuzzle.source === 'lichess_daily' ? 'Lichess' : currentPuzzle.source}</span>
                </div>
                <p className="puzzle-desc">{currentPuzzle.description || 'Find the best move in this position.'}</p>
                {currentPuzzle.hint && !solved && (
                  <div className="puzzle-hint">Hint: {currentPuzzle.hint}</div>
                )}
              </div>
              <div className="puzzle-actions">
                {solved && (
                  <div className="puzzle-success">
                    Correct! Well done!
                  </div>
                )}
                {result && !result.correct && (
                  <div className="puzzle-wrong">
                    {result.message}
                  </div>
                )}
                <div className="puzzle-nav-buttons">
                  <button className="btn btn-outline" onClick={() => setView('browse')}>Back</button>
                  {solved && <button className="btn btn-primary" onClick={nextPuzzle}>Next Puzzle</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'stats' && (
        <div className="puzzles-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Puzzles</h3>
              <span className="stat-number">{stats?.totalPuzzles || 0}</span>
            </div>
            {stats?.byDifficulty && Object.entries(stats.byDifficulty).map(([key, val]) => (
              <div key={key} className="stat-card">
                <h3>{key}</h3>
                <span className="stat-number">{val}</span>
              </div>
            ))}
          </div>
          {stats?.byTheme && (
            <div className="themes-breakdown">
              <h3>Puzzles by Theme</h3>
              <div className="themes-grid">
                {Object.entries(stats.byTheme).map(([key, val]) => (
                  <div key={key} className="theme-stat">
                    <span className="theme-name">{key.replace(/_/g, ' ')}</span>
                    <span className="theme-count">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiPuzzlesPage;
