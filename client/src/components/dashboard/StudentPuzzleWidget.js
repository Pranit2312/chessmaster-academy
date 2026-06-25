import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { puzzleAPI } from '../../utils/api';

function validatePuzzle(puzzle) {
  if (!puzzle || !puzzle.fen || !puzzle.solution || puzzle.solution.length === 0) return false;
  try {
    const chess = new Chess(puzzle.fen);
    const sideToMove = chess.turn();
    const firstMove = puzzle.solution[0];
    const chess2 = new Chess(puzzle.fen);
    const move = chess2.move(firstMove, { sloppy: true });
    if (!move || move.color !== sideToMove) return false;
    return true;
  } catch { return false; }
}

const StudentPuzzleWidget = () => {
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sideToMove, setSideToMove] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [dailyRes, profileRes] = await Promise.allSettled([
          puzzleAPI.getDaily(),
          puzzleAPI.getProfile()
        ]);
        const p = dailyRes.status === 'fulfilled' ? dailyRes.value.data.puzzle : null;
        if (p && validatePuzzle(p)) {
          setPuzzle(p);
          try {
            const c = new Chess(p.fen);
            setSideToMove(c.turn() === 'w' ? 'White' : 'Black');
          } catch {}
        }
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.profile);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h3>Daily Puzzle</h3>
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/puzzles')}>
          All Puzzles
        </button>
      </div>
      <div className="dash-section-body" style={{ textAlign: 'center' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><div className="spinner" /></div>
        ) : puzzle ? (
          <>
            <div onClick={() => navigate('/puzzles')} style={{ cursor: 'pointer', display: 'inline-block' }}>
              <Chessboard
                id="dashboard-puzzle"
                position={puzzle.fen}
                boardWidth={220}
                arePiecesDraggable={false}
                animationDuration={200}
                customBoardStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span className="badge badge-primary">{puzzle.rating || '?'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {sideToMove} to move
              </span>
              <span className="badge badge-neutral">
                {(puzzle.themes || []).slice(0, 2).join(', ') || 'Tactic'}
              </span>
            </div>
            {profile && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Rating: <strong>{profile.puzzleRating}</strong></span>
                <span>Streak: <strong>{profile.currentStreak}</strong></span>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No puzzle available right now.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/puzzles')}>
              Browse Puzzles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPuzzleWidget;
