import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { puzzleAPI } from '../utils/api';
import PuzzleBoard from '../components/puzzles/PuzzleBoard';
import LoadingSpinner from '../components/LoadingSpinner';

const MODES = [
  { id: '3min', label: '3 Minutes', desc: 'Race against the clock', time: 180 },
  { id: '5min', label: '5 Minutes', desc: 'More time, more puzzles', time: 300 },
  { id: 'survival', label: 'Survival', desc: 'One wrong move ends it', time: null }
];

const PuzzleRushPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(null);

  const endSession = useCallback(async () => {
    if (!session) return;
    try {
      const res = await puzzleAPI.endRush({ sessionId: session._id });
      setSession(res.data?.session || null);
      setPuzzle(null);
      setEnded(true);
    } catch {
      setEnded(true);
    }
  }, [session]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || ended) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, ended, endSession]);

  const startRush = useCallback(async (modeId) => {
    setLoading(true);
    setError(null);
    setEnded(false);
    try {
      const res = await puzzleAPI.startRush({ mode: modeId });
      const s = res.data?.session;
      const p = res.data?.puzzle;
      if (!s || !p) { setError('Invalid puzzle response'); setLoading(false); return; }
      setSession(s);
      setPuzzle(p);
      if (modeId !== 'survival') {
        setTimeLeft(s.timeLimitSeconds || MODES.find(m => m.id === modeId)?.time || 120);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start rush');
    }
    setLoading(false);
  }, []);

  const handleMove = useCallback(async (move) => {
    if (!puzzle || !session) return;
    try {
      const checkRes = await puzzleAPI.check({ puzzleId: puzzle.puzzleId || puzzle._id, move, timeMs: 0 });
      const nextRes = await puzzleAPI.rushNext({
        sessionId: session._id,
        previousResult: { puzzleId: puzzle.puzzleId || puzzle._id, correct: checkRes.data.correct, time: 3000, move }
      });
      setSession(nextRes.data.session);
      if (nextRes.data.ended) {
        setPuzzle(null);
        setEnded(true);
      } else {
        setPuzzle(nextRes.data.puzzle);
      }
    } catch {
      setError('Rush error');
    }
  }, [puzzle, session]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="puzzle-rush-page" style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Puzzle Rush</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24 }}>
        Solve as many puzzles as you can!
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {!session && !ended && (
        <div className="rush-modes" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <div key={m.id} className="rush-mode-card"
              style={{ flex: '1 1 180px', padding: 24, border: '2px solid var(--border-color)', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}
              onClick={() => startRush(m.id)}>
              <h3 style={{ margin: '0 0 8px' }}>{m.label}</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{m.desc}</p>
            </div>
          ))}
        </div>
      )}

      {session && puzzle && !ended && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontWeight: 600 }}>
            <span>Score: {session.score}</span>
            <span>Puzzles: {session.totalPuzzles}</span>
            <span>Accuracy: {session.accuracy}%</span>
            {timeLeft !== null && (
              <span style={{ color: timeLeft < 30 ? 'red' : 'inherit' }}>Time: {formatTime(timeLeft)}</span>
            )}
          </div>
          <PuzzleBoard fen={puzzle.fen} playerSide={puzzle.playerSide}
            onMove={handleMove} boardWidth={420} />
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={endSession}>End Rush</button>
        </div>
      )}

      {ended && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h2>Rush Complete!</h2>
          <p>Score: {session?.score}</p>
          <p>Puzzles Attempted: {session?.totalPuzzles}</p>
          <p>Accuracy: {session?.accuracy}%</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setSession(null); setPuzzle(null); setEnded(false); setTimeLeft(null); }}>Play Again</button>
            <button className="btn btn-outline" onClick={() => navigate('/puzzles')}>Back to Puzzles</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleRushPage;
