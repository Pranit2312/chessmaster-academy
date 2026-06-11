import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [active, setActive] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', tournamentType: 'swiss',
    initial: 5, increment: 3,
    entryFee: 0, prizePool: 0,
    maxPlayers: 100,
    startDate: '', endDate: '', registrationDeadline: '',
    rules: '', isRated: true, isPublic: true
  });

  const loadData = useCallback(async () => {
    try {
      const [allRes, activeRes, statsRes] = await Promise.all([
        tournamentAPI.getAll({ params: { status: filter || undefined } }),
        tournamentAPI.getActive(),
        tournamentAPI.getStats()
      ]);
      setTournaments(allRes.data.tournaments || []);
      setActive(activeRes.data.tournaments || []);
      setStats(statsRes.data.stats);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await tournamentAPI.create({
        name: form.name,
        description: form.description,
        tournamentType: form.tournamentType,
        timeControl: { initial: Number(form.initial), increment: Number(form.increment) },
        entryFee: Number(form.entryFee),
        prizePool: Number(form.prizePool),
        maxPlayers: Number(form.maxPlayers),
        startDate: form.startDate,
        endDate: form.endDate,
        registrationDeadline: form.registrationDeadline,
        rules: form.rules,
        isRated: form.isRated,
        isPublic: form.isPublic,
        status: 'registration_open'
      });
      setShowCreate(false);
      setForm({ name: '', description: '', tournamentType: 'swiss', initial: 5, increment: 3, entryFee: 0, prizePool: 0, maxPlayers: 100, startDate: '', endDate: '', registrationDeadline: '', rules: '', isRated: true, isPublic: true });
      loadData();
    } catch (e) { alert(e.response?.data?.message || 'Failed to create tournament'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Cancel this tournament?')) return;
    try { await tournamentAPI.remove(id); loadData(); }
    catch (e) { alert(e.response?.data?.message); }
  }

  return (
    <div className="tournaments-page">
      <div className="tp-header">
        <h1>Tournaments</h1>
        <div className="tp-header-actions">
          {user?.role === 'admin' && (
            <button className="tp-create-btn" onClick={() => setShowCreate(true)}>+ Create Tournament</button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="tp-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <h2>Create Tournament</h2>
            <form onSubmit={handleCreate}>
              <div className="tp-form-row">
                <label>Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="tp-form-row">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="tp-form-row tp-form-inline">
                <div>
                  <label>Type *</label>
                  <select value={form.tournamentType} onChange={e => setForm({ ...form, tournamentType: e.target.value })}>
                    <option value="swiss">Swiss</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="knockout">Knockout</option>
                    <option value="arena">Arena</option>
                  </select>
                </div>
                <div>
                  <label>Max Players</label>
                  <input type="number" min="2" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: e.target.value })} />
                </div>
              </div>
              <div className="tp-form-row tp-form-inline">
                <div>
                  <label>Time (min)</label>
                  <input type="number" min="0.1" step="0.1" value={form.initial} onChange={e => setForm({ ...form, initial: e.target.value })} />
                </div>
                <div>
                  <label>Increment (sec)</label>
                  <input type="number" min="0" value={form.increment} onChange={e => setForm({ ...form, increment: e.target.value })} />
                </div>
              </div>
              <div className="tp-form-row tp-form-inline">
                <div>
                  <label>Entry Fee (₹)</label>
                  <input type="number" min="0" value={form.entryFee} onChange={e => setForm({ ...form, entryFee: e.target.value })} />
                </div>
                <div>
                  <label>Prize Pool (₹)</label>
                  <input type="number" min="0" value={form.prizePool} onChange={e => setForm({ ...form, prizePool: e.target.value })} />
                </div>
              </div>
              <div className="tp-form-row tp-form-inline">
                <div>
                  <label>Start Date *</label>
                  <input type="datetime-local" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label>End Date *</label>
                  <input type="datetime-local" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="tp-form-row">
                <label>Registration Deadline *</label>
                <input type="datetime-local" required value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
              </div>
              <div className="tp-form-row">
                <label>Rules</label>
                <textarea rows="3" value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} />
              </div>
              <div className="tp-form-row tp-form-checkbox">
                <label><input type="checkbox" checked={form.isRated} onChange={e => setForm({ ...form, isRated: e.target.checked })} /> Rated</label>
                <label><input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} /> Public</label>
              </div>
              <div className="tp-form-actions">
                <button type="submit" className="tp-create-btn">Create</button>
                <button type="button" className="tp-filter-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stats && (
        <div className="tp-stats-row">
          <div className="tp-stat"><span className="tp-stat-num">{stats.total}</span> Total</div>
          <div className="tp-stat"><span className="tp-stat-num">{stats.active}</span> Active</div>
          <div className="tp-stat"><span className="tp-stat-num">{stats.completed}</span> Completed</div>
          <div className="tp-stat"><span className="tp-stat-num">₹{stats.totalPrizeDistributed?.toLocaleString() || 0}</span> Prizes Given</div>
        </div>
      )}

      {active.length > 0 && (
        <div className="tp-section">
          <h2>Active & Upcoming</h2>
          <div className="tp-cards">
            {active.map(t => (
              <Link to={`/tournaments/${t._id}`} key={t._id} className="tp-card">
                <div className="tp-card-header">
                  <span className={`tp-status tp-status-${t.status === 'in_progress' ? 'live' : 'upcoming'}`}>
                    {t.status === 'in_progress' ? 'LIVE' : 'UPCOMING'}
                  </span>
                  <span className="tp-type">{t.tournamentType}</span>
                </div>
                <h3>{t.name}</h3>
                <div className="tp-card-meta">
                  <span>⏱ {t.timeControlLabel || `${t.timeControl?.initial}+${t.timeControl?.increment}`}</span>
                  <span>👥 {t.registeredCount}/{t.maxPlayers}</span>
                  {t.entryFee > 0 && <span>💰 ₹{t.entryFee}</span>}
                  <span>🏆 ₹{t.prizePool}</span>
                </div>
                <div className="tp-card-footer">
                  <span>Starts: {new Date(t.startDate).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="tp-section">
        <h2>All Tournaments</h2>
        <div className="tp-filters">
          <select value={filter} onChange={e => { setFilter(e.target.value); }}>
            <option value="">All Status</option>
            <option value="registration_open">Registration Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={loadData} className="tp-filter-btn">Filter</button>
        </div>
        {loading ? <p>Loading...</p> : (
          <table className="tp-table">
            <thead><tr><th>Name</th><th>Type</th><th>Time</th><th>Players</th><th>Fee</th><th>Prize</th><th>Status</th><th>Date</th>{user?.role === 'admin' && <th>Actions</th>}</tr></thead>
            <tbody>
              {tournaments.map(t => (
                <tr key={t._id}>
                  <td><Link to={`/tournaments/${t._id}`}>{t.name}</Link></td>
                  <td><span className="tp-type-badge">{t.tournamentType}</span></td>
                  <td>{t.timeControlLabel || `${t.timeControl?.initial}+${t.timeControl?.increment}`}</td>
                  <td>{t.registeredCount}/{t.maxPlayers}</td>
                  <td>{t.entryFee > 0 ? `₹${t.entryFee}` : 'Free'}</td>
                  <td>₹{t.prizePool}</td>
                  <td><span className={`tp-status-badge tp-s-${t.status}`}>{t.status}</span></td>
                  <td>{new Date(t.startDate).toLocaleDateString()}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <button className="tp-filter-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(t._id)}>Cancel</button>
                    </td>
                  )}
                </tr>
              ))}
              {tournaments.length === 0 && <tr><td colSpan={user?.role === 'admin' ? 10 : 9}>No tournaments found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
