import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gameAPI } from '../utils/api';
import '../styles/PlayPage.css';

export default function MyGamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGames(); }, []);

  async function loadGames() {
    try {
      const res = await gameAPI.getMy();
      setGames(res.data.games || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div className="play-page">
      <h1>My Games</h1>
      {loading ? <p>Loading...</p> : (
        <table className="play-table">
          <thead><tr><th>Opponent</th><th>Result</th><th>Termination</th><th>Time Control</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {games.map(g => {
              const opp = g.players?.find(p => p.user?._id !== user?._id);
              const myRatingChange = g.players?.find(p => p.user?._id === user?._id)?.ratingChange || 0;
              return (
                <tr key={g._id}>
                  <td><Link to={`/coach/${opp?.user?._id}`}>{opp?.user?.name || 'Unknown'}</Link></td>
                  <td><span className={`game-result-${g.result === '1-0' ? 'white' : g.result === '0-1' ? 'black' : 'draw'}`}>{g.result}</span></td>
                  <td>{g.termination}</td>
                  <td>{g.timeControlLabel}</td>
                  <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td>
                    {g._id ? <Link to={`/play/${g._id}/replay`} className="play-watch-btn">Review</Link> : <span className="text-muted">N/A</span>}
                    <span className={`rating-change ${myRatingChange >= 0 ? 'rating-up' : 'rating-down'}`}>
                      {myRatingChange >= 0 ? '+' : ''}{myRatingChange}
                    </span>
                  </td>
                </tr>
              );
            })}
            {games.length === 0 && <tr><td colSpan="6">No games played yet. <Link to="/play">Play now!</Link></td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
