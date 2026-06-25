import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { tournamentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

function Countdown({ target }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    function tick() {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [target]);
  return <span className="t-countdown t-countdown-lg">{remaining}</span>;
}

export default function LiveTournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [pairings, setPairings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tRes, sRes, pRes] = await Promise.all([
        tournamentAPI.getById(id).catch(() => null),
        tournamentAPI.getStandings(id).catch(() => ({ data: { standings: [] } })),
        tournamentAPI.getPairings(id).catch(() => ({ data: { pairings: [] } }))
      ]);
      if (tRes?.data?.tournament) setTournament(tRes.data.tournament);
      setStandings(sRes.data.standings || []);
      setPairings(pRes.data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-poll every 10 seconds for live updates
  useEffect(() => {
    pollRef.current = setInterval(loadData, 10000);
    return () => clearInterval(pollRef.current);
  }, [loadData]);

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

  async function handleArenaPair() {
    try {
      const res = await tournamentAPI.arenaPair(id);
      if (res.data?.game?._id) navigate(`/play/${res.data.game._id}`);
      else showToast('No opponent available', 'error');
    } catch (e) { showToast(e.response?.data?.message || 'Arena pairing failed', 'error'); }
  }

  async function handleNextRound() {
    try { await tournamentAPI.nextRound(id); showToast('Next round started!'); loadData(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleEnd() {
    if (!window.confirm('End this tournament?')) return;
    try { await tournamentAPI.end(id); showToast('Tournament ended'); navigate('/tournaments'); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  if (loading) return (
    <div className="t-detail">
      <div className="t-skeleton-card t-detail-skeleton">
        <div className="t-skeleton-line t-skeleton-xl" />
        <div className="t-skeleton-line t-skeleton-lg" />
      </div>
    </div>
  );

  if (!tournament) return <div className="t-detail"><div className="t-empty"><h3>Tournament not found</h3></div></div>;
  if (tournament.status !== 'in_progress') return <div className="t-detail"><div className="t-empty"><h3>Tournament is not live</h3><Link to={`/tournaments/${id}`} className="t-btn t-btn-primary">View Tournament</Link></div></div>;

  const isRegistered = tournament.registeredPlayers?.some(p => String(p._id || p) === String(user?._id));
  const isCreator = String(tournament.createdBy?._id || tournament.createdBy) === String(user?._id);
  const isArena = tournament.tournamentType === 'arena';
  const userStanding = standings.find(s => s.player?._id === user?._id);
  const userRank = standings.findIndex(s => s.player?._id === user?._id) + 1;

  return (
    <div className="t-detail t-live-page">
      {toast && <div className={`t-toast t-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="t-live-header">
        <div className="t-live-title">
          <div className="t-live-indicator"><span className="t-live-dot" /> LIVE</div>
          <h1>{tournament.name}</h1>
          <div className="t-live-subtitle">
            <span className="t-card-type">{tournament.tournamentType}</span>
            <span>⏱ {tournament.timeControlLabel}</span>
            <span>Round {tournament.currentRound}{tournament.totalRounds > 0 ? `/${tournament.totalRounds}` : ''}</span>
          </div>
        </div>
        {tournament.endDate && (
          <div className="t-live-timer">
            <span className="t-timer-label">Remaining</span>
            <Countdown target={tournament.endDate} />
          </div>
        )}
        <div className="t-live-actions">
          {isArena && isRegistered && <button className="t-btn t-btn-primary t-btn-lg" onClick={handleArenaPair}>Find Match</button>}
          {!isArena && isCreator && <button className="t-btn t-btn-primary" onClick={handleNextRound}>Next Round</button>}
          {isCreator && <button className="t-btn t-btn-danger" onClick={handleEnd}>End</button>}
        </div>
      </div>

      {userStanding && (
        <div className="t-live-user-card">
          <div className="t-live-user-rank">#{userRank}</div>
          <div className="t-live-user-info">
            <strong>{user?.name}</strong>
            <span>{userStanding.points} pts · {userStanding.wins}W {userStanding.draws}D {userStanding.losses}L</span>
          </div>
        </div>
      )}

      {/* Standings */}
      <div className="t-section-header">
        <h2>Standings</h2>
      </div>
      {standings.length === 0 && (
        <div className="t-empty"><h3>No games played yet</h3><p>Standings will appear as matches are completed.</p></div>
      )}
      {standings.length > 0 && (
        <div className="t-standings-scroll">
          <table className="t-table t-table-live">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Points</th>
                <th>Wins</th>
                <th>Draws</th>
                <th>Losses</th>
                <th>Games</th>
                <th>Perf</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const totalGames = s.wins + s.draws + s.losses;
                const perf = totalGames > 0 ? ((s.points / totalGames) * 100).toFixed(0) : '-';
                return (
                  <tr key={i} className={`${s.player?._id === user?._id ? 't-row-highlight' : ''} ${i < 3 ? 't-row-top' : ''}`}>
                    <td className="t-rank">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td>
                      <div className="t-player-cell">
                        <div className={`t-avatar-sm ${s.player?._id === user?._id ? 't-avatar-self' : ''}`}>{s.player?.name?.[0] || '?'}</div>
                        <span>{s.player?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="t-bold">{s.points}</td>
                    <td>{s.wins}</td>
                    <td>{s.draws}</td>
                    <td>{s.losses}</td>
                    <td>{totalGames}</td>
                    <td>{perf}{perf !== '-' ? '%' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Round Robin Crosstable */}
      {tournament.tournamentType === 'round_robin' && pairings?.pairings?.length > 0 && (
        <>
          <div className="t-section-header">
            <h2>Crosstable</h2>
          </div>
          <div className="t-standings-scroll">
            <table className="t-table t-table-crosstable">
              <thead>
                <tr>
                  <th>Player</th>
                  {standings.map(s => (
                    <th key={s.player?._id} className="t-crosstable-name">{s.player?.name?.split(' ').map(w => w[0]).join('') || '?'}</th>
                  ))}
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, ri) => (
                  <tr key={row.player?._id} className={row.player?._id === user?._id ? 't-row-highlight' : ''}>
                    <td className="t-crosstable-name">{row.player?.name || 'Unknown'}</td>
                    {standings.map((col, ci) => {
                      if (ri === ci) return <td key={col.player?._id} className="t-crosstable-self">—</td>;
                      const match = pairings.pairings.flatMap(r => r.matches).find(m =>
                        (String(m.player1?._id || m.player1) === String(row.player?._id) && String(m.player2?._id || m.player2) === String(col.player?._id)) ||
                        (String(m.player1?._id || m.player1) === String(col.player?._id) && String(m.player2?._id || m.player2) === String(row.player?._id))
                      );
                      if (!match || !match.result || match.result === '*') return <td key={col.player?._id} className="t-crosstable-none">—</td>;
                      const isRowWhite = String(match.player1?._id || match.player1) === String(row.player?._id);
                      return (
                        <td key={col.player?._id} className={`t-crosstable-cell ${match.result === '1-0' ? (isRowWhite ? 't-crosstable-win' : 't-crosstable-loss') : match.result === '0-1' ? (isRowWhite ? 't-crosstable-loss' : 't-crosstable-win') : 't-crosstable-draw'}`}>
                          {match.result}
                        </td>
                      );
                    })}
                    <td className="t-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Swiss / Round Robin Pairings */}
      {!isArena && pairings?.pairings?.length > 0 && (
        <>
          <div className="t-section-header">
            <h2>Pairings</h2>
          </div>
          {pairings.pairings.filter(r => r.round === tournament.currentRound).map((round, ri) => (
            <div key={ri} className="t-round">
              <h3 className="t-round-title">Round {round.round} <span className="t-badge t-badge-in_progress">Current</span></h3>
              <table className="t-table">
                <thead><tr><th>White</th><th>Result</th><th>Black</th><th>Status</th></tr></thead>
                <tbody>
                  {round.matches.map((m, mi) => (
                    <tr key={mi} className={(m.player1?._id === user?._id || m.player2?._id === user?._id) ? 't-row-highlight' : ''}>
                      <td>{m.player1?.name || 'BYE'}</td>
                      <td className="t-result">{m.result && m.result !== '*' ? m.result : '-'}</td>
                      <td>{m.player2?.name || 'BYE'}</td>
                      <td>
                        {m.gameId && m.status === 'in_progress' ? (
                          <Link to={`/play/${m.gameId}`} className="t-btn t-btn-sm t-btn-primary">Play</Link>
                        ) : (
                          <span className="t-status-text">{m.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {pairings.pairings.filter(r => r.round < tournament.currentRound).map((round, ri) => (
            <div key={ri} className="t-round t-round-past">
              <h3 className="t-round-title">Round {round.round} <span className="t-badge t-badge-completed">Completed</span></h3>
              <table className="t-table">
                <thead><tr><th>White</th><th>Result</th><th>Black</th></tr></thead>
                <tbody>
                  {round.matches.map((m, mi) => (
                    <tr key={mi}>
                      <td>{m.player1?.name || 'BYE'}</td>
                      <td className="t-result">{m.result && m.result !== '*' ? m.result : '-'}</td>
                      <td>{m.player2?.name || 'BYE'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
}