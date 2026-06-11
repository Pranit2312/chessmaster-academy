import React, { useState, useEffect, useCallback } from 'react';
import { puzzleAPI } from '../utils/api';
import PuzzleBoard from '../components/puzzles/PuzzleBoard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/PuzzlesPage.css';

const TABS = ['daily', 'browse', 'stats'];
const THEMES = ['all', 'fork', 'pin', 'skewer', 'checkmate', 'sacrifice', 'discoveredAttack', 'deflection', 'endgame'];

const PuzzlesPage = () => {
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Puzzle state
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [puzzleSource, setPuzzleSource] = useState(null);
  const [result, setResult] = useState(null);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hint, setHint] = useState(null);
  const [profile, setProfile] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

  // Browse state
  const [puzzles, setPuzzles] = useState([]);
  const [browseTheme, setBrowseTheme] = useState('all');
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await puzzleAPI.getDaily();
      setCurrentPuzzle(res.data.puzzle);
      setPuzzleSource('daily');
      setSolved(res.data.dailySolved);
      setResult(null);
      setShowSolution(false);
      setHint(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily puzzle');
    }
    setLoading(false);
  }, []);

  const loadBrowse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: browsePage, limit: 12 };
      if (browseTheme !== 'all') params.theme = browseTheme;
      const res = await puzzleAPI.getByTheme(browseTheme === 'all' ? 'tactic' : browseTheme, params);
      setPuzzles(res.data.puzzles || []);
      setBrowseTotal(res.data.total || 0);
    } catch (err) {
      setPuzzles([]);
    }
    setLoading(false);
  }, [browseTheme, browsePage]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await puzzleAPI.getProfile();
      setProfile(res.data.profile);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await puzzleAPI.getStats();
      setGlobalStats(res.data.global);
      setProfile(res.data.user);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'daily') loadDaily();
    else if (tab === 'browse') loadBrowse();
    else if (tab === 'stats') loadStats();
    loadProfile();
  }, [tab, loadDaily, loadBrowse, loadStats, loadProfile]);

  useEffect(() => {
    if (tab === 'browse') loadBrowse();
  }, [tab, browseTheme, browsePage, loadBrowse]);

  const handleSolve = useCallback(async (move) => {
    if (!currentPuzzle || solved) return;

    try {
      const puzzleId = currentPuzzle.puzzleId || currentPuzzle._id;
      const res = await puzzleAPI.check({ puzzleId, move, timeMs: 0 });

      setResult(res.data);

      if (res.data.correct) {
        setSolved(true);
        if (puzzleSource === 'daily') {
          puzzleAPI.markDailySolved().catch(() => {});
        }
        loadProfile();
      }
    } catch (err) {
      setError('Failed to check solution');
    }
  }, [currentPuzzle, solved, puzzleSource, loadProfile]);

  const getHint = useCallback(async () => {
    if (!currentPuzzle) return;
    try {
      const puzzleId = currentPuzzle.puzzleId || currentPuzzle._id;
      const res = await puzzleAPI.getHint(puzzleId);
      setHint(res.data.hint?.move || 'Look for a tactical opportunity');
    } catch {
      setHint('Analyze the position carefully');
    }
  }, [currentPuzzle]);

  const loadRandom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await puzzleAPI.getRandom();
      setCurrentPuzzle(res.data.puzzle);
      setPuzzleSource('random');
      setSolved(false);
      setResult(null);
      setShowSolution(false);
      setHint(null);
      setTab('daily');
    } catch { setError('Failed to load puzzle'); }
    setLoading(false);
  }, []);

  const nextPuzzle = useCallback(() => {
    if (puzzles.length > 0) {
      const idx = (puzzles || []).findIndex(p => p._id === currentPuzzle?._id);
      if (idx < puzzles.length - 1) {
        setCurrentPuzzle(puzzles[idx + 1]);
        setPuzzleSource('browse');
      } else {
        loadRandom();
      }
    } else {
      loadRandom();
    }
    setSolved(false);
    setResult(null);
    setShowSolution(false);
    setHint(null);
  }, [puzzles, currentPuzzle, loadRandom]);



  if (loading && tab !== 'browse') return <LoadingSpinner />;

  return (
    <div className="puzzles-page">
      <div className="puzzles-header">
        <h1>Puzzles</h1>
        <p>Train tactics with puzzles from the Lichess database</p>
        <div className="puzzles-tabs">
          {TABS.map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" onClick={() => setError(null)}>{error}</div>}

      {tab === 'daily' && currentPuzzle && (
        <div className="puzzle-solve-view">
          <div className="puzzle-main">
            <PuzzleBoard fen={currentPuzzle.fen} playerSide={currentPuzzle.playerSide}
              onMove={handleSolve} boardWidth={400}
              showSolution={showSolution} solution={currentPuzzle.solution} />
          </div>
          <div className="puzzle-sidebar">
            <div className="puzzle-meta">
              <h3>Daily Puzzle</h3>
              <div className="puzzle-badges">
                <span className={`badge difficulty-${currentPuzzle.difficulty || 'medium'}`}>
                  {currentPuzzle.rating || '?'}
                </span>
                <span className="badge badge-info">
                  {currentPuzzle.themes?.slice(0, 3).join(', ') || 'Tactic'}
                </span>
              </div>
              {currentPuzzle.openingFamily && (
                <p className="puzzle-opening">{currentPuzzle.openingFamily}</p>
              )}
            </div>

            {!solved && !showSolution && (
              <div className="puzzle-actions">
                <button className="btn btn-sm btn-outline" onClick={getHint}>
                  {hint ? hint : 'Hint'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => setShowSolution(true)}>
                  Show Solution
                </button>
              </div>
            )}

            {showSolution && (
              <div className="solution-display">
                <h4>Solution</h4>
                <p>{currentPuzzle.solution?.join(' ') || 'N/A'}</p>
              </div>
            )}

            {result && (
              <div className={`puzzle-result ${result.correct ? 'correct' : 'incorrect'}`}>
                <p>{result.message}</p>
                {result.result && (
                  <div className="rating-update">
                    <span>Rating: {result.result.profile?.puzzleRating}</span>
                    <span>Streak: {result.result.profile?.currentStreak}</span>
                  </div>
                )}
              </div>
            )}

            <div className="puzzle-nav">
              <button className="btn btn-primary" onClick={nextPuzzle}>Next Puzzle</button>
              {profile && (
                <div className="puzzle-user-stats">
                  <span>Rating: {profile.puzzleRating}</span>
                  <span>Solved: {profile.solvedCount}</span>
                  <span>Streak: {profile.currentStreak}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'browse' && (
        <div className="puzzles-browse">
          <div className="browse-filters">
            <select value={browseTheme} onChange={e => { setBrowseTheme(e.target.value); setBrowsePage(1); }}>
              {THEMES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="puzzles-grid">
              {puzzles.map(p => (
                <div key={p._id || p.puzzleId} className="puzzle-card" onClick={() => {
                  setCurrentPuzzle(p);
                  setPuzzleSource('browse');
                  setSolved(false);
                  setResult(null);
                  setShowSolution(false);
                  setHint(null);
                  setTab('daily');
                }}>
                  <div className="puzzle-card-header">
                    <span className="puzzle-rating">{p.rating}</span>
                    <span className="puzzle-plays">{p.nbPlays || 0} plays</span>
                  </div>
                  <div className="puzzle-card-body">
                    <span className="puzzle-themes">{(p.themes || []).slice(0, 3).join(', ') || 'Tactic'}</span>
                    <span className="puzzle-side">{p.playerSide === 'w' ? 'White' : 'Black'} to move</span>
                  </div>
                </div>
              ))}
              {puzzles.length === 0 && <p className="text-muted">No puzzles match your filter. Import puzzles first.</p>}
            </div>
          )}
          {browseTotal > 12 && (
            <div className="pagination">
              <button disabled={browsePage <= 1} onClick={() => setBrowsePage(browsePage - 1)}>Prev</button>
              <span>{browsePage} / {Math.ceil(browseTotal / 12)}</span>
              <button disabled={browsePage >= Math.ceil(browseTotal / 12)} onClick={() => setBrowsePage(browsePage + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="puzzles-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Global Puzzles</h3>
              <span className="stat-number">{globalStats?.total?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-card">
              <h3>Your Rating</h3>
              <span className="stat-number">{profile?.puzzleRating || 1200}</span>
            </div>
            <div className="stat-card">
              <h3>Solved</h3>
              <span className="stat-number">{profile?.solvedCount || 0}</span>
            </div>
            <div className="stat-card">
              <h3>Best Streak</h3>
              <span className="stat-number">{profile?.bestStreak || 0}</span>
            </div>
          </div>
          {profile?.weakThemes?.length > 0 && (
            <div className="weak-themes">
              <h3>Needs Work</h3>
              <div className="theme-tags">
                {profile.weakThemes.map(t => <span key={t} className="tag tag-warning">{t}</span>)}
              </div>
            </div>
          )}
          {profile?.strongThemes?.length > 0 && (
            <div className="strong-themes">
              <h3>Strong Areas</h3>
              <div className="theme-tags">
                {profile.strongThemes.map(t => <span key={t} className="tag tag-success">{t}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PuzzlesPage;
