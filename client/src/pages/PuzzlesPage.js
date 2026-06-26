import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { puzzleAPI } from '../utils/api';
import PuzzleBoard from '../components/puzzles/PuzzleBoard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/PuzzlesPage.css';

const DEBUG = true;
const TABS = ['daily', 'practice', 'themes', 'stats'];

function log(...args) {
  if (DEBUG) console.log('[PuzzlePage]', ...args);
}

function getSideFromFen(fen) {
  if (!fen) return 'w';
  return fen.split(' ')[1] || 'w';
}

function validatePuzzleOnClient(puzzle) {
  if (!puzzle || !puzzle.fen || !puzzle.solution || puzzle.solution.length === 0) return false;
  try {
    const chess = new Chess(puzzle.fen);
    const sideToMove = chess.turn();
    const firstMove = puzzle.solution[0];
    const chess2 = new Chess(puzzle.fen);
    const move = chess2.move(firstMove, { sloppy: true });
    if (!move) return false;
    if (move.color !== sideToMove) return false;
    for (let i = 1; i < puzzle.solution.length; i++) {
      try {
        const m = chess2.move(puzzle.solution[i], { sloppy: true });
        if (!m) return false;
      } catch {
        try {
          const raw = puzzle.solution[i];
          if (raw.length >= 4) {
            const from = raw.slice(0, 2);
            const to = raw.slice(2, 4);
            const prom = raw.length > 4 ? raw[4] : undefined;
            chess2.move({ from, to, promotion: prom || 'q' });
          } else {
            return false;
          }
        } catch {
          return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

const PuzzlesPage = () => {
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [puzzleSource, setPuzzleSource] = useState(null);
  const [result, setResult] = useState(null);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintData, setHintData] = useState(null);
  const [boardWidth, setBoardWidth] = useState(Math.min(480, window.innerWidth - 420 < 480 ? Math.max(320, window.innerWidth - 80) : 480));
  const [profile, setProfile] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [newPuzzleTrigger, setNewPuzzleTrigger] = useState(0);

  const [themeList, setThemeList] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themePuzzles, setThemePuzzles] = useState([]);
  const [themeTotal, setThemeTotal] = useState(0);
  const [themePage, setThemePage] = useState(1);

  const loadingDailyRef = useRef(false);
  const fetchingRef = useRef({ themes: false, stats: false, themePuzzles: {} });
  const forfeitingRef = useRef(false);
  const hintLevelRef = useRef(0);

  useEffect(() => {
    puzzleAPI.getProfile()
      .then(res => setProfile(res.data.profile))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w > 1024) setBoardWidth(480);
      else if (w > 768) setBoardWidth(400);
      else setBoardWidth(Math.max(280, Math.min(w - 40, 380)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDaily = useCallback(async () => {
    if (loadingDailyRef.current) return;
    loadingDailyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await puzzleAPI.getDaily();
      const p = res.data.puzzle;
      if (!p || !validatePuzzleOnClient(p)) {
        log('loadDaily: puzzle rejected by validatePuzzleOnClient');
        setLoading(false);
        loadingDailyRef.current = false;
        return;
      }
      const side = getSideFromFen(p.fen);
      log(`Loaded daily puzzle ${p.puzzleId}: FEN turn=${side}, solution[0]=${p.solution?.[0]}, solution length=${p.solution?.length}`);
      setCurrentPuzzle(p);
      setPuzzleSource('daily');
      setSolved(res.data.dailySolved || false);
      setResult(null);
      setShowSolution(false);
      hintLevelRef.current = 0;
      setHintLevel(0);
      setHintData(null);
      setError(null);
    } catch (err) {
      log('loadDaily error:', err?.message);
      setError(err?.response?.data?.message || err?.message || 'Failed to load daily puzzle');
    }
    setLoading(false);
    loadingDailyRef.current = false;
  }, []);

  const loadThemes = useCallback(async () => {
    if (fetchingRef.current.themes) return;
    fetchingRef.current.themes = true;
    try {
      const res = await puzzleAPI.getThemes();
      setThemeList(res.data.themes || []);
    } catch {
      setThemeList([]);
    }
    fetchingRef.current.themes = false;
  }, []);

  const loadThemePuzzles = useCallback(async (theme, page) => {
    const key = `${theme}-${page}`;
    if (fetchingRef.current.themePuzzles[key]) return;
    fetchingRef.current.themePuzzles[key] = true;
    setLoading(true);
    setError(null);
    try {
      const res = await puzzleAPI.getByTheme(theme, { page, limit: 12 });
      setThemePuzzles(res.data.puzzles || []);
      setThemeTotal(res.data.total || 0);
    } catch {
      setThemePuzzles([]);
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    if (fetchingRef.current.stats) return;
    fetchingRef.current.stats = true;
    setLoading(true);
    try {
      const res = await puzzleAPI.getStats();
      setGlobalStats(res.data.global);
      setProfile(res.data.user);
    } catch {}
    setLoading(false);
    fetchingRef.current.stats = false;
  }, []);

  const initialLoadRef = useRef({ daily: false, practice: false });
  useEffect(() => {
    if (tab === 'daily') {
      if (!initialLoadRef.current.daily) {
        initialLoadRef.current.daily = true;
        loadDaily();
      }
    } else if (tab === 'practice') {
      if (!initialLoadRef.current.practice) {
        initialLoadRef.current.practice = true;
        loadRandom();
      }
    } else if (tab === 'themes') {
      loadThemes();
    } else if (tab === 'stats') {
      loadStats();
    }
  }, [tab, loadDaily, loadRandom, loadStats, loadThemes]);

  useEffect(() => {
    if (selectedTheme && tab === 'themes') loadThemePuzzles(selectedTheme, themePage);
  }, [selectedTheme, themePage, loadThemePuzzles, tab]);

  useEffect(() => {
    setResult(null);
    hintLevelRef.current = 0;
    setHintLevel(0);
    setHintData(null);
    setNewPuzzleTrigger(n => n + 1);
  }, [currentPuzzle]);

  const handleUserMove = useCallback((_move) => {
  }, []);

  const handlePuzzleComplete = useCallback(async (lastMove) => {
    if (!currentPuzzle || solved) return;
    setError(null);
    const puzzleId = currentPuzzle.puzzleId || currentPuzzle._id;
    log(`Puzzle complete: ${puzzleId}, lastMove=${lastMove}`);
    try {
      const res = await puzzleAPI.check({ puzzleId, move: lastMove, timeMs: 0, completed: true });
      const data = res.data;
      log(`Check result: correct=${data.correct}, ratingUpdate=${JSON.stringify(data.ratingUpdate)}`);
      setResult(data);
      if (data.correct) {
        setSolved(true);
        if (puzzleSource === 'daily') {
          puzzleAPI.markDailySolved().catch(() => {});
        }
      }
      puzzleAPI.getProfile()
        .then(r => setProfile(r.data.profile))
        .catch(() => {});
    } catch (err) {
      log('check error:', err?.message);
      setError(err?.response?.data?.message || err?.message || 'Failed to validate move');
    }
  }, [currentPuzzle, solved, puzzleSource]);

  const handleForfeit = useCallback(async () => {
    if (!currentPuzzle || solved || forfeitingRef.current || !window.confirm('Show solution? This will count as an incorrect attempt.')) return;
    forfeitingRef.current = true;
    setError(null);
    const puzzleId = currentPuzzle.puzzleId || currentPuzzle._id;
    log(`Show solution / forfeit: ${puzzleId}`);
    try {
      const res = await puzzleAPI.check({ puzzleId, forfeit: true, timeMs: 0 });
      setResult(res.data);
      setShowSolution(true);
      setSolved(true);
      puzzleAPI.getProfile()
        .then(r => setProfile(r.data.profile))
        .catch(() => {});
    } catch (err) {
      log('forfeit error:', err?.message);
      setError(err?.response?.data?.message || err?.message || 'Failed to submit solution');
    }
    forfeitingRef.current = false;
  }, [currentPuzzle, solved]);

  const getHint = useCallback(async () => {
    if (!currentPuzzle || solved) return;
    const nextLevel = (hintLevelRef.current + 1) % 4;
    hintLevelRef.current = nextLevel;
    setHintLevel(nextLevel);
    if (nextLevel === 0) {
      setHintData(null);
      return;
    }
    try {
      const puzzleId = currentPuzzle.puzzleId || currentPuzzle._id;
      const res = await puzzleAPI.getHint(puzzleId);
      const h = res.data.hint || {};
      const firstMove = h.solution?.[0] || h.move || '';
      const chess = new Chess(currentPuzzle.fen);
      let san, from, to;
      try {
        const m = chess.move(firstMove, { sloppy: true });
        san = m.san;
        from = m.from;
        to = m.to;
      } catch {
        try {
          const raw = firstMove;
          if (raw.length >= 4) {
            from = raw.slice(0, 2);
            to = raw.slice(2, 4);
            const prom = raw.length > 4 ? raw[4] : undefined;
            const m = chess.move({ from, to, promotion: prom || 'q' });
            san = m.san;
          }
        } catch {}
      }
      log(`Hint level ${nextLevel}: from=${from} to=${to} san=${san}`);
      setHintData({ level: nextLevel, san, from, to, text: h.text || '' });
    } catch {
      log('getHint error');
      setError('Unable to load hint. Please try again.');
      setHintData({ level: nextLevel, san: '', from: '', to: '', text: 'Analyze the position' });
    }
  }, [currentPuzzle, solved]);

  const loadRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      for (let i = 0; i < 3; i++) {
        const res = await puzzleAPI.getRandom();
        const p = res.data.puzzle;
        if (p && validatePuzzleOnClient(p)) {
          const side = getSideFromFen(p.fen);
          log(`Loaded random puzzle ${p.puzzleId}: FEN turn=${side}, solution[0]=${p.solution?.[0]}, length=${p.solution?.length}`);
          setCurrentPuzzle(p);
          setPuzzleSource('random');
          setSolved(false);
          setResult(null);
          setShowSolution(false);
          hintLevelRef.current = 0;
          setHintLevel(0);
          setHintData(null);
          setError(null);
          setLoading(false);
          return;
        }
      }
      setError('No valid puzzles found. Try again.');
    } catch (err) {
      log('loadRandom error:', err?.message);
      setError(err?.response?.data?.message || err?.message || 'Failed to load puzzle');
    }
    setLoading(false);
  }, []);

  const nextPuzzle = useCallback(async () => {
    setResult(null);
    setShowSolution(false);
    hintLevelRef.current = 0;
    setHintLevel(0);
    setHintData(null);
    if (themePuzzles.length > 0) {
      const idx = (themePuzzles || []).findIndex(p => p._id === currentPuzzle?._id);
      if (idx >= 0 && idx < themePuzzles.length - 1) {
        const next = themePuzzles[idx + 1];
        if (validatePuzzleOnClient(next)) {
          setSolved(false);
          setCurrentPuzzle(next);
          setPuzzleSource('themes');
          return;
        }
      }
    }
    await loadRandom();
  }, [themePuzzles, currentPuzzle, loadRandom]);

  const formatSolution = (fenStr, moves) => {
    if (!moves || moves.length === 0) return '';
    try {
      const c = new Chess(fenStr);
      const lines = [];
      let pairNum = 1;
      let whiteMove = '';
      for (let i = 0; i < moves.length; i++) {
        let m;
        try {
          m = c.move(moves[i], { sloppy: true });
        } catch {
          try {
            const raw = moves[i];
            if (raw.length >= 4) {
              const from = raw.slice(0, 2);
              const to = raw.slice(2, 4);
              const prom = raw.length > 4 ? raw[4] : undefined;
              m = c.move({ from, to, promotion: prom || 'q' });
            }
          } catch {}
        }
        if (!m) {
          if (i % 2 === 0) lines.push(`${pairNum}. ${moves[i]}`);
          else lines[lines.length - 1] += ` ${moves[i]}`;
          continue;
        }
        if (c.turn() === 'b') {
          whiteMove = m.san;
        } else {
          lines.push(`${pairNum}.${whiteMove ? ' ' + whiteMove : ''}${whiteMove ? ' ' : ' ... '}${m.san}`);
          pairNum++;
          whiteMove = '';
        }
      }
      if (whiteMove) lines.push(`${pairNum}. ${whiteMove}`);
      return lines.join('  ');
    } catch {
      return moves.join(' ');
    }
  };

  if (loading && tab !== 'themes') {
    if (!currentPuzzle) return <LoadingSpinner />;
  }

  return (
    <div className="puzzles-page">
      <div className="puzzles-header">
        <div className="puzzles-header-top">
          <div>
            <h1>Puzzles</h1>
            <p>Train tactics with puzzles from the Lichess database</p>
          </div>
          {profile && (
            <div className="puzzles-header-stats">
              <div className="phs-item">
                <span className="phs-label">Rating</span>
                <span className="phs-value">{profile.puzzleRating}</span>
              </div>
              <div className="phs-divider" />
              <div className="phs-item">
                <span className="phs-label">Streak</span>
                <span className="phs-value">{profile.currentStreak || 0}</span>
              </div>
              <div className="phs-divider" />
              <div className="phs-item">
                <span className="phs-label">Solved</span>
                <span className="phs-value">{profile.solvedCount || 0}</span>
              </div>
              <div className="phs-divider" />
              <div className="phs-item">
                <span className="phs-label">Accuracy</span>
                <span className="phs-value">{profile.accuracy || 0}%</span>
              </div>
            </div>
          )}
        </div>
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

      {(tab === 'daily' || tab === 'practice') && currentPuzzle && (
        <div className="puzzle-solve-view">
          <div className="puzzle-main">
            <PuzzleBoard
              key={currentPuzzle._id || currentPuzzle.puzzleId}
              puzzle={currentPuzzle}
              fen={currentPuzzle.fen}
              solution={currentPuzzle.solution}
              onMove={handleUserMove}
              onComplete={handlePuzzleComplete}
              boardWidth={boardWidth}
              showSolution={showSolution}
              newPuzzleTrigger={newPuzzleTrigger}
              hintData={hintData}
            />
          </div>
          <div className="puzzle-sidebar">
            <div className="puzzle-meta">
              <div className="puzzle-rating-badge">
                <span className="prb-label">Puzzle</span>
                <span className="prb-value">{currentPuzzle.rating || '?'}</span>
              </div>
              <div className="puzzle-user-rating-badge">
                <span className="prb-label">Your rating</span>
                <span className="prb-value">{profile?.puzzleRating || 1200}</span>
              </div>
              <div className="puzzle-theme-tags">
                {(currentPuzzle.themes || []).length > 0 ? (
                  (currentPuzzle.themes || []).slice(0, 3).map(t => (
                    <span key={t} className="theme-tag">{t}</span>
                  ))
                ) : (
                  <span className="theme-tag">tactic</span>
                )}
              </div>
              {solved && (
                <span className="puzzle-side-badge solved">Solved</span>
              )}
            </div>
            {!solved && !showSolution && (
              <div className="puzzle-info-card">
                <div className="pic-row">
                  <span className="pic-label">Moves</span>
                  <span className="pic-value">{currentPuzzle.solution?.length || 0}</span>
                </div>
                <div className="pic-row">
                  <span className="pic-label">Difficulty</span>
                  <span className={`pic-value pic-diff ${(currentPuzzle.rating || 0) < 1200 ? 'easy' : (currentPuzzle.rating || 0) < 1600 ? 'medium' : (currentPuzzle.rating || 0) < 2000 ? 'hard' : 'expert'}`}>
                    {(currentPuzzle.rating || 0) < 1200 ? 'Easy' : (currentPuzzle.rating || 0) < 1600 ? 'Medium' : (currentPuzzle.rating || 0) < 2000 ? 'Hard' : 'Expert'}
                  </span>
                </div>
                <div className="pic-row">
                  <span className="pic-label">Side</span>
                  <span className="pic-value">{currentPuzzle.fen?.split(' ')[1] === 'w' ? 'White' : 'Black'}</span>
                </div>
              </div>
            )}

            {!solved && !showSolution && (
              <div className="puzzle-actions">
                <button className="btn btn-sm btn-outline" onClick={getHint}>
                  {hintLevel === 0 ? 'Hint' : hintLevel === 3 && hintData?.san ? `Hint: ${hintData.san}` : `Hint (${hintLevel}/3)`}
                </button>
                <button className="btn btn-sm btn-outline" onClick={handleForfeit}>
                  Show Solution
                </button>
              </div>
            )}

            {result && (
              <div className={`puzzle-result ${result.correct ? 'correct' : 'incorrect'} ${result.forfeit ? 'forfeit' : ''}`}>
                <p className="result-heading">{result.correct ? 'Solved!' : result.forfeit ? 'Skipped' : 'Failed'}</p>
                {result.ratingUpdate && (
                  <div className="rating-update">
                    <span className={`rating-delta ${result.ratingUpdate.userDelta >= 0 ? 'positive' : 'negative'}`}>
                      {result.ratingUpdate.userDelta >= 0 ? '+' : ''}{result.ratingUpdate.userDelta}
                    </span>
                    <span className="rating-new">{result.ratingUpdate.newUserRating}</span>
                  </div>
                )}
                <div className="result-meta">
                  <span>Streak: {result.profile?.currentStreak || 0}</span>
                  <span>Solved: {result.profile?.solvedCount || 0}</span>
                  <span>Accuracy: {result.profile?.accuracy || 0}%</span>
                </div>
              </div>
            )}

            {result?.correct && puzzleSource === 'daily' && (
              <div className="daily-solved-banner">
                <span className="daily-solved-icon">&#127942;</span>
                <div className="daily-solved-text">
                  <span className="daily-solved-title">Today's puzzle you have solved</span>
                  <span className="daily-solved-sub">Come back tomorrow for a new challenge</span>
                </div>
              </div>
            )}

            {tab === 'practice' && (result?.correct || solved) && (
              <button className="btn btn-primary next-btn" onClick={nextPuzzle}>
                Next Puzzle &rarr;
              </button>
            )}

            {tab === 'daily' && (result?.correct || solved) && (
              <button className="btn btn-primary next-btn" onClick={() => setTab('practice')}>
                Practice More Puzzles &rarr;
              </button>
            )}

            {showSolution && currentPuzzle.solution && (
              <div className="solution-display">
                <h4>Solution</h4>
                <p className="solution-moves">{formatSolution(currentPuzzle.fen, currentPuzzle.solution)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'themes' && !selectedTheme && (
        <div className="puzzles-themes">
          <div className="themes-header">
            <h2>Puzzle Themes</h2>
            <p>Choose a theme to practice specific tactical patterns</p>
          </div>
          <div className="themes-grid">
            {themeList.map(t => (
              <div key={t.name} className="theme-card" onClick={() => { setSelectedTheme(t.name); setThemePage(1); }}>
                <span className="theme-card-count">{t.count.toLocaleString()}</span>
                <span className="theme-card-name">{t.name}</span>
                <span className="theme-card-arrow">&rarr;</span>
              </div>
            ))}
            {themeList.length === 0 && <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center' }}>No themes available. Import puzzles first.</p>}
          </div>
        </div>
      )}

      {tab === 'themes' && selectedTheme && (
        <div className="puzzles-browse">
          <div className="browse-header">
            <button className="btn btn-sm btn-outline" onClick={() => { setSelectedTheme(null); setThemePuzzles([]); }}>
              &larr; All Themes
            </button>
            <h3>{selectedTheme} <span className="text-muted" style={{ fontWeight: 400 }}>({themeTotal.toLocaleString()} puzzles)</span></h3>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="puzzles-grid">
              {themePuzzles.map(p => (
                <div key={p._id || p.puzzleId} className="puzzle-card" onClick={() => {
                  setCurrentPuzzle(p);
                  setPuzzleSource('themes');
                  setSolved(false);
                  setResult(null);
                  setShowSolution(false);
                  hintLevelRef.current = 0;
                  setHintLevel(0);
                  setHintData(null);
                  setTab('daily');
                }}>
                  <div className="puzzle-card-header">
                    <span className="puzzle-rating">{p.rating}</span>
                    <span className="puzzle-plays">{p.nbPlays || 0} plays</span>
                  </div>
                  <div className="puzzle-card-body">
                    <span className="puzzle-themes">{(p.themes || []).slice(0, 3).join(', ') || 'Tactic'}</span>
                    <span className="puzzle-side">{p.fen?.split(' ')[1] === 'w' ? 'White' : 'Black'} to move</span>
                  </div>
                </div>
              ))}
              {themePuzzles.length === 0 && <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center' }}>No puzzles in this theme.</p>}
            </div>
          )}
          {themeTotal > 12 && (
            <div className="pagination">
              <button disabled={themePage <= 1} onClick={() => setThemePage(themePage - 1)}>Prev</button>
              <span>{themePage} / {Math.ceil(themeTotal / 12)}</span>
              <button disabled={themePage >= Math.ceil(themeTotal / 12)} onClick={() => setThemePage(themePage + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="puzzles-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Global Puzzles</h3>
              <span className="stat-number">{globalStats?.totalPuzzles?.toLocaleString() || 0}</span>
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
