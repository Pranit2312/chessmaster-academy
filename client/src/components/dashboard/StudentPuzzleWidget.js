import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { puzzleAPI } from '../../utils/api';

const StudentPuzzleWidget = () => {
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dailyRes, profileRes] = await Promise.allSettled([
          puzzleAPI.getDaily(),
          puzzleAPI.getProfile()
        ]);
        if (dailyRes.status === 'fulfilled') setPuzzle(dailyRes.value.data.puzzle);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.profile);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <section className="dashboard-section puzzle-widget">
      <div className="widget-header">
        <h3>Daily Puzzle</h3>
        <button className="btn btn-text" onClick={() => navigate('/puzzles')}>
          All Puzzles →
        </button>
      </div>

      {loading ? (
        <p>Loading puzzle...</p>
      ) : puzzle ? (
        <div className="puzzle-widget-content">
          <div className="puzzle-widget-board" onClick={() => navigate('/puzzles')} style={{ cursor: 'pointer' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              width: 200, height: 200,
              border: '1px solid var(--border-color)',
              borderRadius: 4, overflow: 'hidden',
              margin: '0 auto'
            }}>
              {(() => {
                const rows = [7, 6, 5, 4, 3, 2, 1, 0];
                const cols = [0, 1, 2, 3, 4, 5, 6, 7];
                const fen = puzzle.fen;
                const positions = {};
                const fenParts = fen.split(' ')[0];
                const fenRows = fenParts.split('/');
                fenRows.forEach((row, ri) => {
                  let ci = 0;
                  for (const ch of row) {
                    if (ch >= '1' && ch <= '8') { ci += parseInt(ch); continue; }
                    positions[FILES[ci] + (8 - ri)] = ch;
                    ci++;
                  }
                });
                return rows.flatMap(row =>
                  cols.map(col => {
                    const sq = FILES[col] + (row + 1);
                    const piece = positions[sq];
                    const isLight = (row + col) % 2 === 0;
                    const pieceUnicode = {
                      'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F',
                      'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659'
                    };
                    return (
                      <div key={sq}
                        style={{
                          background: isLight ? '#f0d9b5' : '#b58863',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18
                        }}>
                        {piece ? pieceUnicode[piece] || '' : ''}
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </div>
          <div className="puzzle-widget-meta" style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="badge" style={{
              background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12
            }}>
              {puzzle.rating || '?'}
            </span>
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              {(puzzle.themes || []).slice(0, 2).join(', ') || 'Tactic'}
            </span>
          </div>
          {profile && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Rating: {profile.puzzleRating}</span>
              <span>Streak: {profile.currentStreak}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="empty-state">
          No puzzle available right now.
          <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/puzzles')}>
            Browse Puzzles
          </button>
        </p>
      )}
    </section>
  );
};

const FILES = 'abcdefgh';
export default StudentPuzzleWidget;
