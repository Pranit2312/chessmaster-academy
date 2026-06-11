import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { puzzleAPI } from '../../utils/api';

const CoachPuzzleWidget = () => {
  const navigate = useNavigate();
  const [coachPuzzles, setCoachPuzzles] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [puzzleRes, statsRes] = await Promise.allSettled([
          puzzleAPI.getMyCoachPuzzles({ limit: 4 }),
          puzzleAPI.getStats()
        ]);
        if (puzzleRes.status === 'fulfilled') setCoachPuzzles(puzzleRes.value.data.puzzles || []);
        if (statsRes.status === 'fulfilled') setGlobalStats(statsRes.value.data.global);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <section className="dashboard-section coach-puzzle-widget">
      <div className="widget-header">
        <h3>Puzzle Platform</h3>
        <button className="btn btn-text" onClick={() => navigate('/coach/puzzles/create')}>
          Create Puzzle →
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="coach-puzzle-stats" style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ textAlign: 'center', flex: 1, padding: 8, background: 'var(--card-bg)', borderRadius: 8 }}>
            <strong style={{ fontSize: 20 }}>{globalStats?.total?.toLocaleString() || 0}</strong>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary)' }}>DB Puzzles</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1, padding: 8, background: 'var(--card-bg)', borderRadius: 8 }}>
            <strong style={{ fontSize: 20 }}>{coachPuzzles.length}</strong>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary)' }}>Your Puzzles</p>
          </div>
        </div>
      )}

      {coachPuzzles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {coachPuzzles.map(p => (
            <div key={p._id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', background: 'var(--card-bg)',
              border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13
            }}>
              <span>{(p.themes || []).join(', ') || 'Tactic'} — {p.difficulty}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                ♥ {p.likes} | 💾 {p.saves}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/puzzles')}>
          Browse All Puzzles
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/puzzles/rush')}>
          Puzzle Rush
        </button>
      </div>
    </section>
  );
};

export default CoachPuzzleWidget;
