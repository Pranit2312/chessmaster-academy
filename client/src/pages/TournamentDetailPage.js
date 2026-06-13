import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { tournamentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [pairings, setPairings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');

  const loadTournament = useCallback(async () => {
    try {
      const res = await tournamentAPI.getById(id);
      const t = res.data?.tournament;
      if (!t) { setLoading(false); return; }
      setTournament(t);
      if (t.status === 'in_progress' || t.status === 'completed') {
        const [sRes, pRes] = await Promise.all([
          tournamentAPI.getStandings(id),
          tournamentAPI.getPairings(id)
        ]);
        setStandings(sRes.data.standings || []);
        setPairings(pRes.data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadTournament(); }, [loadTournament]);

  // Auto-navigate to game when a tournament match:found arrives
  useEffect(() => {
    if (!id) return;
    const handler = (data) => {
      if (data.tournament && String(data.tournament) === String(id)) {
        navigate(`/play/${data.gameId}`, { state: { matchData: data } });
      }
    };
    on('match:found', handler);
    return () => off('match:found');
  }, [id, on, off, navigate]);

  async function handleRegister() {
    if (!window.confirm('Confirm registration?')) return;
    try {
      await tournamentAPI.register(id);
      alert('Registered!');
      loadTournament();
    } catch (e) { alert(e.response?.data?.message || 'Registration failed'); }
  }

  async function handleUnregister() {
    try {
      await tournamentAPI.unregister(id);
      alert('Unregistered');
      loadTournament();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  }

  async function handleStart() {
    try { await tournamentAPI.start(id); loadTournament(); }
    catch (e) { alert(e.response?.data?.message); }
  }

  async function handleNextRound() {
    try { await tournamentAPI.nextRound(id); loadTournament(); }
    catch (e) { alert(e.response?.data?.message); }
  }

  async function handleArenaPair() {
    try {
      const res = await tournamentAPI.arenaPair(id);
      if (res.data?.game?._id) {
        navigate(`/play/${res.data.game._id}`);
      } else {
        alert('No opponent available right now');
      }
    } catch (e) { alert(e.response?.data?.message || 'Arena pairing failed'); }
  }

  async function handleEnd() {
    if (!window.confirm('End this tournament?')) return;
    try { await tournamentAPI.end(id); loadTournament(); }
    catch (e) { alert(e.response?.data?.message); }
  }

  if (loading) return <div className="tournament-detail"><p>Loading...</p></div>;
  if (!tournament) return <div className="tournament-detail"><p>Tournament not found</p></div>;

  const isRegistered = tournament.registeredPlayers?.some(p => String(p._id) === String(user?._id));
  const isAdmin = user?.role === 'admin';

  return (
    <div className="tournament-detail">
      <div className="td-header">
        <div>
          <h1>{tournament.name}</h1>
          <p className="td-meta">
            <span className="tp-type-badge">{tournament.tournamentType}</span>
            <span>⏱ {tournament.timeControlLabel || `${tournament.timeControl?.initial}+${tournament.timeControl?.increment}`}</span>
            <span>👥 {tournament.registeredCount}/{tournament.maxPlayers}</span>
            {tournament.entryFee > 0 && <span>💰 ₹{tournament.entryFee}</span>}
            <span>🏆 ₹{tournament.prizePool}</span>
            <span className={`tp-status-badge tp-s-${tournament.status}`}>{tournament.status}</span>
          </p>
        </div>
        <div className="td-actions">
          {tournament.status === 'registration_open' && !isRegistered && (
            <button className="tp-btn tp-btn-primary" onClick={handleRegister}>Register</button>
          )}
          {tournament.status === 'registration_open' && isRegistered && (
            <button className="tp-btn tp-btn-secondary" onClick={handleUnregister}>Unregister</button>
          )}
          {isAdmin && tournament.status === 'registration_open' && (
            <button className="tp-btn tp-btn-primary" onClick={handleStart}>Start Tournament</button>
          )}
          {isAdmin && tournament.status === 'in_progress' && tournament.tournamentType !== 'arena' && (
            <button className="tp-btn tp-btn-primary" onClick={handleNextRound}>Next Round</button>
          )}
          {tournament.status === 'in_progress' && tournament.tournamentType === 'arena' && isRegistered && (
            <button className="tp-btn tp-btn-primary" onClick={handleArenaPair}>Find Match</button>
          )}
          {isAdmin && tournament.status === 'in_progress' && (
            <button className="tp-btn tp-btn-danger" onClick={handleEnd}>End Tournament</button>
          )}
        </div>
      </div>

      {tournament.description && <p className="td-desc">{tournament.description}</p>}

      <div className="td-tabs">
        <button className={`td-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Info</button>
        <button className={`td-tab ${tab === 'standings' ? 'active' : ''}`} onClick={() => setTab('standings')}>Standings</button>
        <button className={`td-tab ${tab === 'pairings' ? 'active' : ''}`} onClick={() => setTab('pairings')}>Pairings</button>
        <button className={`td-tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>Players</button>
      </div>

      {tab === 'info' && (
        <div className="td-info">
          <div className="td-info-grid">
            <div><strong>Start:</strong> {new Date(tournament.startDate).toLocaleString()}</div>
            <div><strong>End:</strong> {new Date(tournament.endDate).toLocaleString()}</div>
            <div><strong>Registration Deadline:</strong> {new Date(tournament.registrationDeadline).toLocaleString()}</div>
            <div><strong>Rated:</strong> {tournament.isRated ? 'Yes' : 'No'}</div>
            <div><strong>Created by:</strong> {tournament.createdBy?.name || 'Admin'}</div>
            <div><strong>Current Round:</strong> {tournament.currentRound || 0} / {tournament.totalRounds || '—'}</div>
          </div>
          {tournament.rules && (
            <div className="td-rules">
              <h3>Rules</h3>
              <p>{tournament.rules}</p>
            </div>
          )}
          {tournament.prizes?.length > 0 && (
            <div className="td-prizes">
              <h3>Prize Distribution</h3>
              <table className="tp-table">
                <thead><tr><th>Position</th><th>Amount</th><th>Winner</th></tr></thead>
                <tbody>
                  {tournament.prizes.map((p, i) => (
                    <tr key={i}><td>{p.position}{p.position === 1 ? 'st' : p.position === 2 ? 'nd' : p.position === 3 ? 'rd' : 'th'}</td><td>₹{p.amount}</td><td>{p.winner?.name || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'standings' && (
        <table className="tp-table">
          <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Wins</th><th>Draws</th><th>Losses</th><th>Tie Break</th></tr></thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={i} className={s.player?._id === user?._id ? 'td-highlight' : ''}>
                <td>{s.rank || i + 1}</td>
                <td>{s.player?.name || 'Unknown'}</td>
                <td><strong>{s.points}</strong></td>
                <td>{s.wins}</td>
                <td>{s.draws}</td>
                <td>{s.losses}</td>
                <td>{s.tieBreak?.toFixed(1) || '0.0'}</td>
              </tr>
            ))}
            {standings.length === 0 && <tr><td colSpan="7">No standings yet</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'pairings' && (
        <div>
          {pairings?.pairings?.map((round, ri) => (
            <div key={ri} className="td-round">
              <h3>Round {round.round}</h3>
              <table className="tp-table">
                <thead><tr><th>White</th><th>Result</th><th>Black</th></tr></thead>
                <tbody>
                  {round.matches.map((m, mi) => (
                    <tr key={mi}>
                      <td className={m.player1?._id === user?._id ? 'td-highlight' : ''}>{m.player1?.name || 'BYE'}</td>
                      <td>{m.result === '*' ? '—' : m.result}</td>
                      <td className={m.player2?._id === user?._id ? 'td-highlight' : ''}>{m.player2?.name || 'BYE'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {(!pairings?.pairings || pairings.pairings.length === 0) && <p>No pairings yet</p>}
        </div>
      )}

      {tab === 'players' && (
        <div className="td-players">
          {tournament.registeredPlayers?.map(p => (
            <div key={p._id} className="td-player-card">
              <div className="td-player-avatar">{p.profileImage ? <img src={p.profileImage} alt="" /> : <div className="td-avatar-placeholder">{p.name?.[0]}</div>}</div>
              <div className="td-player-info">
                <strong>{p.name}</strong>
                <span>Rating: {p.chessRating || '—'}</span>
              </div>
            </div>
          ))}
          {(!tournament.registeredPlayers || tournament.registeredPlayers.length === 0) && <p>No players registered</p>}
        </div>
      )}
    </div>
  );
}
