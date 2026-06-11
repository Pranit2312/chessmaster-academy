import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { puzzleAPI } from '../utils/api';
import PuzzleBoard from '../components/puzzles/PuzzleBoard';

const CoachPuzzleCreator = () => {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moves, setMoves] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('tactic');
  const [fenError, setFenError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [playerSide, setPlayerSide] = useState('w');

  const validateFen = useCallback((val) => {
    try {
      new Chess(val);
      setFenError(null);
      return true;
    } catch {
      setFenError('Invalid FEN position');
      return false;
    }
  }, []);

  const handleFenChange = (e) => {
    const val = e.target.value;
    setFen(val);
    if (val.trim()) validateFen(val);
    else setFenError(null);
  };

  const handleSave = async () => {
    if (!validateFen(fen)) return;
    if (!moves.trim()) {
      setError('Solution moves are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const solution = moves.trim().split(/\s+/);
      await puzzleAPI.createCoachPuzzle({
        fen, solution, explanation, difficulty, theme: theme.split(',').map(t => t.trim()),
        playerSide
      });
      setSaved(true);
      setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      setMoves('');
      setExplanation('');
      setDifficulty('medium');
      setTheme('tactic');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save puzzle');
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: 8 }}>Create Puzzle</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Create a chess puzzle for your students</p>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && <div className="alert alert-success">Puzzle created successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <PuzzleBoard fen={fen} playerSide={playerSide} boardWidth={400} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>FEN</label>
            <textarea value={fen} onChange={handleFenChange} rows={3}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, padding: 8, border: fenError ? '1px solid red' : '1px solid var(--border-color)', borderRadius: 6 }} />
            {fenError && <p style={{ color: 'red', fontSize: 12, margin: '4px 0 0' }}>{fenError}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Side to Move</label>
            <select value={playerSide} onChange={e => setPlayerSide(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid var(--border-color)', borderRadius: 6 }}>
              <option value="w">White</option>
              <option value="b">Black</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Solution (space-separated SAN moves)</label>
            <input value={moves} onChange={e => setMoves(e.target.value)} placeholder="e.g. Nf3 g6 Bg7"
              style={{ width: '100%', padding: 8, border: '1px solid var(--border-color)', borderRadius: 6 }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Explanation</label>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={3} placeholder="Explain the tactical idea..."
              style={{ width: '100%', padding: 8, border: '1px solid var(--border-color)', borderRadius: 6 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <option value="beginner">Beginner</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Theme(s)</label>
              <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="tactic, fork, pin"
                style={{ width: '100%', padding: 8, border: '1px solid var(--border-color)', borderRadius: 6 }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving || fenError}
            style={{ width: '100%' }}>
            {saving ? 'Saving...' : 'Create Puzzle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachPuzzleCreator;
