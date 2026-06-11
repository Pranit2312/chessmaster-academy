import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import '../styles/PlayPage.css';

const TIME_CONTROLS = [
  { label: 'Bullet (1+0)', category: 'bullet', initial: 1, increment: 0 },
  { label: 'Bullet (2+1)', category: 'bullet', initial: 2, increment: 1 },
  { label: 'Blitz (3+0)', category: 'blitz', initial: 3, increment: 0 },
  { label: 'Blitz (3+2)', category: 'blitz', initial: 3, increment: 2 },
  { label: 'Blitz (5+0)', category: 'blitz', initial: 5, increment: 0 },
  { label: 'Blitz (5+3)', category: 'blitz', initial: 5, increment: 3 },
  { label: 'Rapid (10+0)', category: 'rapid', initial: 10, increment: 0 },
  { label: 'Rapid (10+5)', category: 'rapid', initial: 10, increment: 5 },
  { label: 'Rapid (15+10)', category: 'rapid', initial: 15, increment: 10 },
  { label: 'Classical (30+0)', category: 'classical', initial: 30, increment: 0 },
  { label: 'Classical (45+15)', category: 'classical', initial: 45, increment: 15 }
];

export default function PlayPage() {
  const { user } = useAuth();
  const { emit, on, off, queueSizes } = useSocket();
  const navigate = useNavigate();
  const [selectedTc, setSelectedTc] = useState(TIME_CONTROLS[3]);
  const [inQueue, setInQueue] = useState(false);
  const [rated, setRated] = useState(true);
  const [tab, setTab] = useState('play');

  React.useEffect(() => {
    const handler = (data) => {
      navigate(`/play/${data.gameId}`, { state: { matchData: data } });
    };
    on('match:found', handler);
    const qerr = (data) => { console.error('Queue error:', data?.message || data); setInQueue(false); };
    on('queue:error', qerr);
    return () => { off('match:found'); off('queue:error'); };
  }, [on, off, navigate]);

  function handleJoinQueue() {
    emit('queue:join', {
      category: selectedTc.category,
      rating: user?.chessRating || 1200,
      ratingRange: 200,
      rated,
      timeControlLabel: `${selectedTc.initial}+${selectedTc.increment}`
    });
    setInQueue(true);
  }

  function handleLeaveQueue() {
    emit('queue:leave', { category: selectedTc.category });
    setInQueue(false);
  }

  function handlePlayFriend() {
    navigate('/friends');
  }

  function handlePlayBot() {
    navigate('/ai/practice');
  }

  return (
    <div className="play-page">
      <div className="play-header">
        <h1>Play Chess</h1>
      </div>

      <div className="play-tabs">
        <button className={`play-tab ${tab === 'play' ? 'active' : ''}`} onClick={() => setTab('play')}>Play</button>
        <button className={`play-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>Live Games</button>
        <button className={`play-tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
      </div>

      {tab === 'play' && (
        <div className="play-content">
          <div className="play-sidebar">
            <h3>Quick Play</h3>
            {TIME_CONTROLS.filter((_, i) => [0, 3, 8, 9].includes(i)).map(tc => (
              <button
                key={tc.label}
                className={`play-quick-btn ${selectedTc.label === tc.label ? 'selected' : ''}`}
                onClick={() => setSelectedTc(tc)}
              >
                {tc.label}
              </button>
            ))}

            <h3 style={{ marginTop: 24 }}>All Time Controls</h3>
            <div className="play-tc-list">
              {TIME_CONTROLS.map(tc => (
                <label key={tc.label} className={`play-tc-option ${selectedTc.label === tc.label ? 'selected' : ''}`}>
                  <input type="radio" name="tc" checked={selectedTc.label === tc.label} onChange={() => setSelectedTc(tc)} />
                  <span className="play-tc-label">{tc.label}</span>
                  <span className="play-tc-queue">Queue: {queueSizes[tc.category] || 0}</span>
                </label>
              ))}
            </div>

            <div className="play-options">
              <label className="play-toggle">
                <input type="checkbox" checked={rated} onChange={e => setRated(e.target.checked)} />
                <span>Rated</span>
              </label>
            </div>

            {inQueue ? (
              <div className="play-queue-status">
                <div className="play-spinner"></div>
                <p>Searching for opponent...</p>
                <p className="play-queue-info">Category: {selectedTc.label}</p>
                <button className="play-cancel-btn" onClick={handleLeaveQueue}>Cancel</button>
              </div>
            ) : (
              <button className="play-find-btn" onClick={handleJoinQueue}>Find Opponent</button>
            )}
          </div>

          <div className="play-main">
            <div className="play-actions">
              <div className="play-action-card" onClick={handlePlayBot}>
                <div className="play-action-icon">🤖</div>
                <h3>Play Bot</h3>
                <p>Practice against AI</p>
              </div>
              <div className="play-action-card" onClick={handlePlayFriend}>
                <div className="play-action-icon">👤</div>
                <h3>Play Friend</h3>
                <p>Challenge a friend</p>
              </div>
              <div className="play-action-card" onClick={() => navigate('/tournaments')}>
                <div className="play-action-icon">🏆</div>
                <h3>Tournaments</h3>
                <p>Join a tournament</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'live' && (
        <div className="play-live">
          <LiveGamesList onSelect={(id) => navigate(`/play/${id}?spectate=1`)} />
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="play-leaderboard">
          <LeaderboardView />
        </div>
      )}
    </div>
  );
}

function LiveGamesList({ onSelect }) {
  const [games, setGames] = useState([]);
  React.useEffect(() => {
    fetch('/api/games/live').then(r => r.json()).then(d => setGames(d.games || [])).catch(() => {});
  }, []);
  return (
    <div>
      <h3>Live Games</h3>
      <table className="play-table">
        <thead><tr><th>White</th><th>Black</th><th>Time</th><th>Action</th></tr></thead>
        <tbody>
          {games.map(g => (
            <tr key={g._id}>
              <td>{g.players?.[0]?.user?.name || '—'}</td>
              <td>{g.players?.[1]?.user?.name || '—'}</td>
              <td>{g.timeControlLabel}</td>
              <td><button onClick={() => onSelect(g._id)} className="play-watch-btn">Watch</button></td>
            </tr>
          ))}
          {games.length === 0 && <tr><td colSpan="4">No live games</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardView() {
  const [data, setData] = useState([]);
  const [cat, setCat] = useState('blitz');
  React.useEffect(() => {
    fetch(`/api/games/leaderboard?category=${cat}`).then(r => r.json()).then(d => setData(d.leaderboard || [])).catch(() => {});
  }, [cat]);
  return (
    <div>
      <div className="play-lb-tabs">
        {['bullet', 'blitz', 'rapid', 'classical'].map(c => (
          <button key={c} className={`play-lb-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <table className="play-table">
        <thead><tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>D</th><th>L</th><th>Games</th></tr></thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={i}><td>{i + 1}</td><td>{p.user?.name || '—'}</td><td><strong>{p.rating}</strong></td><td>{p.wins}</td><td>{p.draws}</td><td>{p.losses}</td><td>{p.gamesPlayed}</td></tr>
          ))}
          {data.length === 0 && <tr><td colSpan="7">No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
