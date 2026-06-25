import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { tournamentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getStatusLabel(status) {
  const labels = { registration_open: 'Open', registration_closed: 'Closing', in_progress: 'Live', completed: 'Completed', cancelled: 'Cancelled', draft: 'Draft' };
  return labels[status] || status;
}

function Countdown({ target }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    function tick() {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setRemaining('Started'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s`);
      else setRemaining(`${m}m ${s}s`);
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [target]);
  return <span className="t-countdown">{remaining}</span>;
}

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
  const [toast, setToast] = useState(null);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const loadRef = useRef(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

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
    } catch (e) {
      if (e.response?.status === 403) {
        setTournament({ needsInvite: true });
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { if (!loadRef.current) { loadRef.current = true; loadTournament(); } }, [loadTournament]);

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
    try {
      await tournamentAPI.register(id);
      showToast('Registered!');
      loadTournament();
    } catch (e) { showToast(e.response?.data?.message || 'Registration failed', 'error'); }
  }

  async function handleUnregister() {
    try {
      await tournamentAPI.unregister(id);
      showToast('Unregistered');
      loadTournament();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleStart() {
    try { await tournamentAPI.start(id); showToast('Tournament started!'); loadTournament(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed to start', 'error'); }
  }

  async function handleNextRound() {
    try { await tournamentAPI.nextRound(id); showToast('Next round started!'); loadTournament(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleEnd() {
    if (!window.confirm('End this tournament?')) return;
    try { await tournamentAPI.end(id); showToast('Tournament ended'); loadTournament(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this tournament? Players will be notified.')) return;
    try { await tournamentAPI.cancel(id); showToast('Tournament cancelled'); loadTournament(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleArenaPair() {
    try {
      const res = await tournamentAPI.arenaPair(id);
      if (res.data?.game?._id) navigate(`/play/${res.data.game._id}`);
      else showToast('No opponent available', 'error');
    } catch (e) { showToast(e.response?.data?.message || 'Arena pairing failed', 'error'); }
  }

  async function handleRemovePlayer(playerId) {
    try { await tournamentAPI.removePlayer(id, playerId); showToast('Player removed'); loadTournament(); }
    catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  }

  function handleEdit() {
    setEditName(tournament?.name || '');
    setEditDescription(tournament?.description || '');
    setEditing(true);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    try {
      await tournamentAPI.update(id, { name: editName, description: editDescription });
      showToast('Tournament updated!');
      setEditing(false);
      loadTournament();
    } catch (err) { showToast(err.response?.data?.message || 'Update failed', 'error'); }
  }

  async function handleJoinByInvite(e) {
    e.preventDefault();
    try {
      await tournamentAPI.joinByInvite({ inviteCode: inviteInput });
      showToast('Joined tournament!');
      setInviteInput('');
      setInviteError('');
      loadTournament();
    } catch (err) { setInviteError(err.response?.data?.message || 'Invalid invite code'); }
  }

  function copyInviteCode() {
    if (tournament?.inviteCode) {
      navigator.clipboard.writeText(tournament.inviteCode).then(() => showToast('Invite code copied!')).catch(() => {});
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/tournaments/${id}?inviteCode=${tournament?.inviteCode || ''}`;
    navigator.clipboard.writeText(link).then(() => showToast('Invite link copied!')).catch(() => {});
  }

  if (loading) return (
    <div className="t-detail">
      <div className="t-skeleton-card t-detail-skeleton"><div className="t-skeleton-line t-skeleton-xl" /><div className="t-skeleton-line t-skeleton-lg" /><div className="t-skeleton-line t-skeleton-md" /></div>
    </div>
  );

  if (tournament?.needsInvite) {
    return (
      <div className="t-detail">
        <div className="t-invite-gate">
          <div className="t-invite-icon">🔒</div>
          <h2>Private Tournament</h2>
          <p>Enter the invite code to view this tournament.</p>
          <form onSubmit={handleJoinByInvite} className="t-invite-form">
            <input placeholder="Enter invite code" value={inviteInput} onChange={e => setInviteInput(e.target.value.toUpperCase())} />
            <button type="submit" className="t-btn t-btn-primary">Join</button>
          </form>
          {inviteError && <p className="t-error">{inviteError}</p>}
        </div>
      </div>
    );
  }

  if (!tournament) return <div className="t-detail"><div className="t-empty"><h3>Tournament not found</h3></div></div>;

  const isRegistered = tournament.registeredPlayers?.some(p => String(p._id || p) === String(user?._id));
  const isCreator = String(tournament.createdBy?._id || tournament.createdBy) === String(user?._id);
  const canJoin = tournament.status === 'registration_open' && tournament.registeredCount < tournament.maxPlayers && !isRegistered;
  const canStart = isCreator && (tournament.status === 'registration_open') && tournament.registeredCount >= 2;
  const canNextRound = isCreator && tournament.status === 'in_progress' && tournament.tournamentType !== 'arena';
  const canEnd = isCreator && tournament.status === 'in_progress';
  const canCancel = isCreator && tournament.status !== 'completed' && tournament.status !== 'cancelled';
  const canEdit = isCreator && tournament.status === 'registration_open';
  const isLive = tournament.status === 'in_progress';

  return (
    <div className="t-detail">
      {toast && <div className={`t-toast t-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header / Lobby */}
      <div className={`t-lobby ${isLive ? 't-lobby-live' : ''}`}>
        {tournament.banner && <div className="t-lobby-banner" style={{ backgroundImage: `url(${tournament.banner})` }} />}
        <div className="t-lobby-header">
          <div className="t-lobby-info">
            <div className="t-lobby-badges">
              <span className={`t-badge t-badge-${tournament.status}`}>{getStatusLabel(tournament.status)}</span>
              <span className="t-card-type">{tournament.tournamentType}</span>
              {tournament.visibility === 'private' && <span className="t-badge t-badge-private">Private</span>}
            </div>
            <h1>{tournament.name}</h1>
            {tournament.description && <p className="t-lobby-desc">{tournament.description}</p>}
            <div className="t-lobby-meta">
              <div className="t-lobby-meta-item"><span className="t-meta-label">Time Control</span><span className="t-meta-value">{tournament.timeControlLabel || `${tournament.timeControl?.initial}+${tournament.timeControl?.increment}`}</span></div>
              <div className="t-lobby-meta-item"><span className="t-meta-label">Duration</span><span className="t-meta-value">{formatDuration(tournament.duration)}</span></div>
              <div className="t-lobby-meta-item"><span className="t-meta-label">Players</span><span className="t-meta-value">{tournament.registeredCount}/{tournament.maxPlayers}</span></div>
              <div className="t-lobby-meta-item"><span className="t-meta-label">Created by</span><span className="t-meta-value">{tournament.createdBy?.name || 'Unknown'}</span></div>
              {tournament.ratingRestriction?.min && <div className="t-lobby-meta-item"><span className="t-meta-label">Min Rating</span><span className="t-meta-value">{tournament.ratingRestriction.min}</span></div>}
              {tournament.ratingRestriction?.max && <div className="t-lobby-meta-item"><span className="t-meta-label">Max Rating</span><span className="t-meta-value">{tournament.ratingRestriction.max}</span></div>}
            </div>
          </div>
          <div className="t-lobby-status">
            {tournament.status === 'registration_open' && (
              <div className="t-lobby-countdown">
                <span className="t-countdown-label">Starts in</span>
                <Countdown target={tournament.startDate} />
              </div>
            )}
            {isLive && (
              <div className="t-lobby-countdown t-lobby-live-indicator">
                <span className="t-live-dot" /> LIVE
              </div>
            )}
            {tournament.status === 'completed' && (
              <div className="t-lobby-completed">Tournament completed</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="t-lobby-actions">
          {canJoin && <button className="t-btn t-btn-primary t-btn-lg" onClick={handleRegister}>Join Tournament</button>}
          {isRegistered && tournament.status === 'registration_open' && !isCreator && <button className="t-btn t-btn-secondary" onClick={handleUnregister}>Leave</button>}
          {isRegistered && tournament.status === 'registration_open' && isCreator && <span className="t-badge t-badge-creator">You are the creator</span>}
          {canEdit && !editing && <button className="t-btn t-btn-secondary" onClick={handleEdit}>Edit</button>}
          {canStart && <button className="t-btn t-btn-success t-btn-lg" onClick={handleStart}>Start Tournament</button>}
          {isLive && <Link to={`/tournaments/${id}/live`} className="t-btn t-btn-primary t-btn-lg">View Live</Link>}
          {isLive && tournament.tournamentType === 'arena' && isRegistered && <button className="t-btn t-btn-primary t-btn-lg" onClick={handleArenaPair}>Find Match</button>}
          {canNextRound && <button className="t-btn t-btn-primary" onClick={handleNextRound}>Next Round</button>}
          {canEnd && <button className="t-btn t-btn-danger" onClick={handleEnd}>End Tournament</button>}
          {canCancel && <button className="t-btn t-btn-ghost" onClick={handleCancel}>Cancel Tournament</button>}
        </div>

        {/* Invite */}
        {isCreator && tournament.inviteCode && (
          <div className="t-lobby-invite">
            <div className="t-invite-row">
              <span className="t-invite-label">Invite Code:</span>
              <code className="t-invite-code">{tournament.inviteCode}</code>
              <button className="t-btn t-btn-sm" onClick={copyInviteCode}>Copy</button>
              <button className="t-btn t-btn-sm" onClick={copyInviteLink}>Copy Link</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="t-tabs t-detail-tabs">
        {['info', 'standings', 'pairings', 'players'].map(t => (
          <button key={t} className={`t-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && editing && (
        <form onSubmit={handleEditSave} className="t-edit-form">
          <h4>Edit Tournament</h4>
          <label>Name</label>
          <input value={editName} onChange={e => setEditName(e.target.value)} required maxLength={150} />
          <label>Description</label>
          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} maxLength={5000} rows={3} />
          <div className="t-edit-actions">
            <button type="submit" className="t-btn t-btn-primary">Save</button>
            <button type="button" className="t-btn t-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
      {tab === 'info' && !editing && (
        <div className="t-info-grid">
          <div className="t-info-card">
            <h4>Tournament Type</h4>
            <p className="t-capitalize">{tournament.tournamentType}</p>
          </div>
          <div className="t-info-card">
            <h4>Time Control</h4>
            <p>{tournament.timeControlLabel || `${tournament.timeControl?.initial}+${tournament.timeControl?.increment}`}</p>
          </div>
          <div className="t-info-card">
            <h4>Duration</h4>
            <p>{formatDuration(tournament.duration)}</p>
          </div>
          <div className="t-info-card">
            <h4>Start Date</h4>
            <p>{new Date(tournament.startDate).toLocaleString()}</p>
          </div>
          <div className="t-info-card">
            <h4>Spectators</h4>
            <p>{tournament.allowSpectators ? 'Allowed' : 'Not allowed'}</p>
          </div>
          <div className="t-info-card">
            <h4>Late Join</h4>
            <p>{tournament.allowLateJoin ? 'Allowed' : 'Not allowed'}</p>
          </div>
          {tournament.rules && (
            <div className="t-info-card t-info-card-full">
              <h4>Rules</h4>
              <p>{tournament.rules}</p>
            </div>
          )}
        </div>
      )}

      {/* Standings */}
      {tab === 'standings' && (
        <div className="t-standings">
          {standings.length === 0 && tournament.status === 'in_progress' && tournament.tournamentType === 'arena' && (
            <div className="t-empty"><h3>No games played yet</h3><p>Find an opponent to appear in standings.</p></div>
          )}
          {standings.length === 0 && tournament.status !== 'in_progress' && (
            <div className="t-empty"><h3>No standings yet</h3></div>
          )}
          {standings.length > 0 && (
            <table className="t-table">
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
                    <tr key={i} className={s.player?._id === user?._id ? 't-row-highlight' : ''}>
                      <td className="t-rank">{i + 1}</td>
                      <td>
                        <div className="t-player-cell">
                          <div className="t-avatar-sm">{s.player?.name?.[0] || '?'}</div>
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
          )}
        </div>
      )}

      {/* Pairings */}
      {tab === 'pairings' && (
        <div className="t-pairings">
          {(!pairings?.pairings || pairings.pairings.length === 0) && (
            <div className="t-empty"><h3>No pairings yet</h3></div>
          )}
          {pairings?.pairings?.map((round, ri) => (
            <div key={ri} className="t-round">
              <h3 className="t-round-title">
                Round {round.round}
                {round.round === pairings.currentRound && tournament.status === 'in_progress' && <span className="t-badge t-badge-in_progress">Current</span>}
              </h3>
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
                          <span className="t-status-text">{m.status === 'bye' ? 'Bye' : m.status === 'completed' ? 'Done' : m.status === 'scheduled' ? 'Ready' : m.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Players */}
      {tab === 'players' && (
        <div className="t-players-grid">
          {(!tournament.registeredPlayers || tournament.registeredPlayers.length === 0) && (
            <div className="t-empty"><h3>No players registered</h3></div>
          )}
          {tournament.registeredPlayers?.map(p => (
            <div key={p._id} className="t-player-card">
              <div className="t-player-avatar">{p.name?.[0] || '?'}</div>
              <div className="t-player-body">
                <strong>{p.name}</strong>
                <span>Rating: {p.chessRating || '—'}</span>
              </div>
              {isCreator && tournament.status === 'registration_open' && String(p._id) !== String(tournament.createdBy?._id) && (
                <button className="t-btn t-btn-sm t-btn-ghost t-remove-btn" onClick={() => handleRemovePlayer(p._id)} title="Remove player">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}