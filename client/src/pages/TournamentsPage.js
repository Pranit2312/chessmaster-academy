import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 0, label: 'Custom' }
];

const TIME_CONTROL_PRESETS = {
  bullet: [
    { label: '1+0', initial: 1, increment: 0 },
    { label: '2+1', initial: 2, increment: 1 }
  ],
  blitz: [
    { label: '3+0', initial: 3, increment: 0 },
    { label: '3+2', initial: 3, increment: 2 },
    { label: '5+0', initial: 5, increment: 0 },
    { label: '5+3', initial: 5, increment: 3 }
  ],
  rapid: [
    { label: '10+0', initial: 10, increment: 0 },
    { label: '10+5', initial: 10, increment: 5 },
    { label: '15+10', initial: 15, increment: 10 }
  ]
};

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`;
}

function getStatusLabel(status) {
  const labels = {
    registration_open: 'Register',
    registration_closed: 'Starting Soon',
    in_progress: 'Live',
    completed: 'Completed',
    cancelled: 'Cancelled',
    draft: 'Draft'
  };
  return labels[status] || status;
}

function getMinDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

function SkeletonCard() {
  return (
    <div className="t-skeleton-card">
      <div className="t-skeleton-line t-skeleton-lg" />
      <div className="t-skeleton-line t-skeleton-md" />
      <div className="t-skeleton-line t-skeleton-sm" />
    </div>
  );
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('active');
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', tournamentType: 'arena',
    timeCategory: 'rapid', tcPreset: '10+5', tcInitial: 10, tcIncrement: 5,
    duration: 60, durationCustom: '',
    maxPlayers: 100,
    startDate: getMinDateTime(),
    visibility: 'public',
    inviteCode: '',
    allowSpectators: true, allowLateJoin: false,
    ratingMin: '', ratingMax: '',
    rules: '', banner: ''
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async (activeTab) => {
    try {
      const [allRes, statsRes] = await Promise.all([
        tournamentAPI.getAll({ params: { status: activeTab === 'all' ? undefined : activeTab === 'active' ? undefined : activeTab === 'completed' ? 'completed' : undefined } }),
        tournamentAPI.getStats()
      ]);
      let list = allRes.data.tournaments || [];
      if (activeTab === 'active') list = list.filter(t => t.status === 'registration_open' || t.status === 'in_progress');
      if (activeTab === 'upcoming') list = list.filter(t => t.status === 'registration_open' && new Date(t.startDate) > new Date());
      if (activeTab === 'completed') list = list.filter(t => t.status === 'completed');
      setTournaments(list);
      setStats(statsRes.data.stats);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); loadData(tab); }, [tab, loadData]);

  useEffect(() => {
    if (tab === 'my' && user) {
      tournamentAPI.getMy().then(r => setMyTournaments(r.data.tournaments || [])).catch(() => {});
    }
  }, [tab, user]);

  function handleTcPreset(category, label) {
    const preset = TIME_CONTROL_PRESETS[category]?.find(p => p.label === label);
    if (preset) {
      setForm({ ...form, timeCategory: category, tcPreset: label, tcInitial: preset.initial, tcIncrement: preset.increment });
    }
  }

  function handleDuration(val) {
    if (val === '0') {
      setForm({ ...form, duration: 0, durationCustom: '60' });
    } else {
      setForm({ ...form, duration: parseInt(val), durationCustom: '' });
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const startDate = new Date(form.startDate);
      const minStart = new Date(Date.now() + 5 * 60 * 1000);
      if (startDate < minStart) { showToast('Start time must be at least 5 minutes from now', 'error'); return; }
      const duration = form.duration > 0 ? form.duration : parseInt(form.durationCustom);
      if (!duration || duration < 1) { showToast('Duration must be > 0', 'error'); return; }

      const body = {
        name: form.name,
        description: form.description,
        banner: form.banner || undefined,
        tournamentType: form.tournamentType,
        timeControl: { initial: form.tcInitial, increment: form.tcIncrement },
        timeControlLabel: `${form.tcInitial}+${form.tcIncrement}`,
        duration,
        maxPlayers: parseInt(form.maxPlayers),
        startDate: form.startDate,
        visibility: form.visibility,
        allowSpectators: form.allowSpectators,
        allowLateJoin: form.allowLateJoin,
        rules: form.rules,
        isRated: false,
        status: 'registration_open'
      };
      if (form.visibility === 'private') body.inviteCode = '';
      if (form.ratingMin) body.ratingRestriction = { ...body.ratingRestriction, min: parseInt(form.ratingMin) };
      if (form.ratingMax) body.ratingRestriction = { ...body.ratingRestriction, max: parseInt(form.ratingMax) };

      await tournamentAPI.create(body);
      setShowCreate(false);
      setForm({ name: '', description: '', tournamentType: 'arena', timeCategory: 'rapid', tcPreset: '10+5', tcInitial: 10, tcIncrement: 5, duration: 60, durationCustom: '', maxPlayers: 100, startDate: getMinDateTime(), visibility: 'public', inviteCode: '', allowSpectators: true, allowLateJoin: false, ratingMin: '', ratingMax: '', rules: '', banner: '' });
      showToast('Tournament created!');
      loadData(tab);
    } catch (e) { showToast(e.response?.data?.message || 'Failed to create', 'error'); }
  }

  return (
    <div className="t-page">
      {toast && <div className={`t-toast t-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Hero */}
      <div className="t-hero">
        <div className="t-hero-content">
          <h1>Tournaments</h1>
          <p>Compete in practice tournaments. No real-money prizes — just chess.</p>
          <div className="t-hero-stats">
            <div className="t-hero-stat"><span className="t-hero-num">{stats?.active || 0}</span> Active</div>
            <div className="t-hero-stat"><span className="t-hero-num">{stats?.upcoming || 0}</span> Upcoming</div>
            <div className="t-hero-stat"><span className="t-hero-num">{stats?.totalPlayers?.toLocaleString() || 0}</span> Players</div>
          </div>
          {user && (
            <button className="t-btn t-btn-primary t-btn-lg" onClick={() => setShowCreate(true)}>
              + Create Tournament
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="t-tabs">
        {['active', 'upcoming', 'completed', 'my'].map(t => (
          <button key={t} className={`t-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'my' ? 'My Tournaments' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="t-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {tab === 'my' && myTournaments.length === 0 && tournaments.length === 0 && (
            <div className="t-empty">
              <div className="t-empty-icon">🏟️</div>
              <h3>No tournaments yet</h3>
              <p>Create or join a tournament to get started.</p>
              {user && <button className="t-btn t-btn-primary" onClick={() => setShowCreate(true)}>Create Tournament</button>}
            </div>
          )}
          {tab !== 'my' && tournaments.length === 0 && (
            <div className="t-empty">
              <div className="t-empty-icon">🏟️</div>
              <h3>No {tab} tournaments</h3>
              <p>{tab === 'active' ? 'No active tournaments right now. Check upcoming!' : tab === 'upcoming' ? 'No upcoming tournaments. Create one!' : 'No completed tournaments yet.'}</p>
            </div>
          )}
          {(tab === 'my' ? myTournaments : tournaments).length > 0 && (
            <div className="t-grid">
              {(tab === 'my' ? myTournaments : tournaments).map(t => {
                const joined = t.registeredPlayers?.some(p => String(p._id || p) === String(user?._id));
                const isCreator = String(t.createdBy?._id || t.createdBy) === String(user?._id);
                const live = t.status === 'in_progress';
                const canJoin = t.status === 'registration_open' && t.registeredCount < t.maxPlayers && !joined;
                return (
                  <Link to={`/tournaments/${t._id}`} key={t._id} className={`t-card ${live ? 't-card-live' : ''}`}>
                    <div className="t-card-top">
                      <span className={`t-badge t-badge-${t.status}`}>{getStatusLabel(t.status)}</span>
                      <span className="t-card-type">{t.tournamentType}</span>
                      {isCreator && <span className="t-badge t-badge-creator">Creator</span>}
                    </div>
                    {t.banner && <div className="t-card-banner" style={{ backgroundImage: `url(${t.banner})` }} />}
                    <h3 className="t-card-name">{t.name}</h3>
                    <div className="t-card-meta">
                      <span>⏱ {t.timeControlLabel || `${t.timeControl?.initial}+${t.timeControl?.increment}`}</span>
                      <span>🕐 {formatDuration(t.duration)}</span>
                      <span>👥 {t.registeredCount}/{t.maxPlayers}</span>
                    </div>
                    <div className="t-card-footer">
                      <span className="t-card-creator">by {t.createdBy?.name || 'Unknown'}</span>
                      <span className="t-card-start">
                        {live ? 'LIVE' : new Date(t.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    {canJoin && <div className="t-card-join" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>Join</div>}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="t-overlay" onClick={() => setShowCreate(false)}>
          <div className="t-modal" onClick={e => e.stopPropagation()}>
            <div className="t-modal-header">
              <h2>Create Tournament</h2>
              <button className="t-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="t-create-form">
              <div className="t-field">
                <label>Tournament Name *</label>
                <input required maxLength={150} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Saturday Blitz Arena" />
              </div>
              <div className="t-field">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Tournament description, rules, or notes..." />
              </div>
              <div className="t-field">
                <label>Banner Image URL (optional)</label>
                <input type="url" value={form.banner} onChange={e => setForm({ ...form, banner: e.target.value })} placeholder="https://example.com/banner.jpg" />
              </div>
              <div className="t-row">
                <div className="t-field">
                  <label>Type *</label>
                  <select value={form.tournamentType} onChange={e => setForm({ ...form, tournamentType: e.target.value })}>
                    <option value="arena">Arena</option>
                    <option value="swiss">Swiss</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
                <div className="t-field">
                  <label>Max Players</label>
                  <input type="number" min={2} value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: e.target.value })} />
                </div>
              </div>
              <div className="t-field">
                <label>Time Control *</label>
                <div className="t-tc-presets">
                  {Object.entries(TIME_CONTROL_PRESETS).map(([cat, presets]) => (
                    <div key={cat} className="t-tc-group">
                      <span className="t-tc-label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      <div className="t-tc-options">
                        {presets.map(p => (
                          <button key={p.label} type="button" className={`t-tc-option ${form.tcPreset === p.label ? 'active' : ''}`}
                            onClick={() => handleTcPreset(cat, p.label)}>{p.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="t-row">
                <div className="t-field">
                  <label>Duration *</label>
                  <select value={form.duration} onChange={e => handleDuration(e.target.value)}>
                    {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {form.duration === 0 && (
                  <div className="t-field">
                    <label>Custom Duration (min)</label>
                    <input type="number" min={1} value={form.durationCustom} onChange={e => setForm({ ...form, durationCustom: e.target.value })} placeholder="Minutes" />
                  </div>
                )}
                <div className="t-field">
                  <label>Start Date *</label>
                  <input type="datetime-local" required value={form.startDate} min={getMinDateTime()} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
              </div>
              <div className="t-row">
                <div className="t-field">
                  <label>Visibility</label>
                  <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                    <option value="public">Public</option>
                    <option value="private">Private (Invite Code)</option>
                  </select>
                </div>
                <div className="t-field">
                  <label>Min Rating</label>
                  <input type="number" min={0} placeholder="No min" value={form.ratingMin} onChange={e => setForm({ ...form, ratingMin: e.target.value })} />
                </div>
                <div className="t-field">
                  <label>Max Rating</label>
                  <input type="number" min={0} placeholder="No max" value={form.ratingMax} onChange={e => setForm({ ...form, ratingMax: e.target.value })} />
                </div>
              </div>
              <div className="t-field">
                <label>Rules</label>
                <textarea rows={2} value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} />
              </div>
              <div className="t-checkboxes">
                <label className="t-checkbox"><input type="checkbox" checked={form.allowSpectators} onChange={e => setForm({ ...form, allowSpectators: e.target.checked })} /> Allow Spectators</label>
                <label className="t-checkbox"><input type="checkbox" checked={form.allowLateJoin} onChange={e => setForm({ ...form, allowLateJoin: e.target.checked })} /> Allow Late Join</label>
              </div>
              <div className="t-modal-actions">
                <button type="submit" className="t-btn t-btn-primary">Create Tournament</button>
                <button type="button" className="t-btn t-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}