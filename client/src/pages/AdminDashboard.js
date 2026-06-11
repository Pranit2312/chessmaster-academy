import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const TABS = ['Overview', 'Users', 'Coaches', 'Courses', 'Payments'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, rev, gro] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/revenue'),
        api.get('/admin/analytics/growth')
      ]);
      setOverview(ov.data?.overview || null);
      setRevenueData(rev.data.revenue || []);
      setGrowthData(gro.data.growth || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function loadUsers(q) {
    try {
      const res = await api.get('/admin/users', { params: { search: q || search, limit: 50 } });
      setUsers(res.data.users || []);
    } catch (e) { console.error(e); }
  }

  async function loadCoaches(q) {
    try {
      const res = await api.get('/admin/coaches', { params: { search: q || search, limit: 50 } });
      setCoaches(res.data.coaches || []);
    } catch (e) { console.error(e); }
  }

  async function loadCourses() {
    try {
      const res = await api.get('/admin/courses', { params: { limit: 50 } });
      setCourses(res.data.courses || []);
    } catch (e) { console.error(e); }
  }

  async function loadWithdrawals() {
    try {
      const res = await api.get('/admin/withdrawals/pending');
      setWithdrawals(res.data.withdrawals || []);
    } catch (e) { console.error(e); }
  }

  function onTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'Users') loadUsers();
    if (tab === 'Coaches') loadCoaches();
    if (tab === 'Courses') loadCourses();
    if (tab === 'Payments') loadWithdrawals();
  }

  async function handleAction(url, method = 'put') {
    try {
      await api[method](url);
      onTabChange(activeTab);
    } catch (e) { alert(e.response?.data?.message || 'Action failed'); }
  }

  if (user?.role !== 'admin') {
    return <div className="admin-dashboard"><h2>Access Denied</h2></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab ${activeTab === t ? 'active' : ''}`} onClick={() => onTabChange(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="admin-overview">
          {loading ? <p>Loading...</p> : (
            <>
              <div className="stats-grid">
                <div className="stat-card"><h3>Students</h3><p>{overview?.totalStudents || 0}</p></div>
                <div className="stat-card"><h3>Coaches</h3><p>{overview?.totalCoaches || 0}</p></div>
                <div className="stat-card"><h3>Courses</h3><p>{overview?.totalCourses || 0}</p></div>
                <div className="stat-card"><h3>Bookings</h3><p>{overview?.totalBookings || 0}</p></div>
                <div className="stat-card"><h3>Total Revenue</h3><p>₹{overview?.totalRevenue?.toLocaleString() || 0}</p></div>
                <div className="stat-card"><h3>Monthly Revenue</h3><p>₹{overview?.monthlyRevenue?.toLocaleString() || 0}</p></div>
              </div>
              <div className="charts-row">
                <div className="chart-box">
                  <h3>Monthly Revenue</h3>
                  <div className="mini-chart">
                    {revenueData.map((r, i) => (
                      <div key={i} className="bar-wrap">
                        <div className="bar" style={{ height: Math.max(4, ((r.amount || 0) / Math.max(...revenueData.map(x => x.amount || 0), 1)) * 120) + 'px' }}></div>
                        <span className="bar-label">{r.month?.slice(5) || r.month || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-box">
                  <h3>User Growth</h3>
                  <div className="mini-chart">
                    {growthData.map((g, i) => (
                      <div key={i} className="bar-wrap">
                        <div className="bar bar-green" style={{ height: Math.max(4, ((g.count || 0) / Math.max(...growthData.map(x => x.count || 0), 1)) * 120) + 'px' }}></div>
                        <span className="bar-label">{g.month?.slice(5) || g.month || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="admin-section">
          <div className="search-bar">
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={() => loadUsers()}>Search</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.isActive ? (u.suspendedUntil && new Date(u.suspendedUntil) > new Date() ? 'Suspended' : 'Active') : 'Banned'}</td>
                  <td className="actions-cell">
                    {u.isActive && !u.bannedAt && <button className="btn-sm btn-danger" onClick={() => handleAction(`/admin/users/${u._id}/ban`)}>Ban</button>}
                    {u.isActive && <button className="btn-sm btn-warning" onClick={() => handleAction(`/admin/users/${u._id}/suspend`, 'put', prompt('Days to suspend:', '7'))}>Suspend</button>}
                    {!u.isActive && <button className="btn-sm btn-success" onClick={() => handleAction(`/admin/users/${u._id}/restore`)}>Restore</button>}
                    <button className="btn-sm btn-danger" onClick={() => { if (window.confirm('Delete this user?')) handleAction(`/admin/users/${u._id}`, 'delete'); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Coaches' && (
        <div className="admin-section">
          <div className="search-bar">
            <input placeholder="Search coaches..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={() => loadCoaches()}>Search</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Title</th><th>Verified</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {coaches.map(c => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.title}</td>
                  <td>{c.isVerified ? '✅' : '❌'}</td>
                  <td>{c.isFeatured ? '⭐' : '—'}</td>
                  <td className="actions-cell">
                    {!c.isVerified ? (
                      <button className="btn-sm btn-success" onClick={() => handleAction(`/admin/coaches/${c._id}/verify`)}>Verify</button>
                    ) : (
                      <button className="btn-sm btn-warning" onClick={() => handleAction(`/admin/coaches/${c._id}/reject`)}>Unverify</button>
                    )}
                    {!c.isFeatured ? (
                      <button className="btn-sm btn-info" onClick={() => handleAction(`/admin/coaches/${c._id}/feature`)}>Feature</button>
                    ) : (
                      <button className="btn-sm btn-secondary" onClick={() => handleAction(`/admin/coaches/${c._id}/unfeature`)}>Unfeature</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Courses' && (
        <div className="admin-section">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Instructor</th><th>Price</th><th>Status</th><th>Enrolled</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td>{c.instructor?.name || '—'}</td>
                  <td>₹{c.pricing?.effectivePrice || c.pricing?.price || 0}</td>
                  <td><span className={`status-badge status-${c.status}`}>{c.status}</span></td>
                  <td>{c.enrollmentCount || 0}</td>
                  <td className="actions-cell">
                    {c.status === 'submitted' && <button className="btn-sm btn-success" onClick={() => handleAction(`/admin/courses/${c._id}/approve`)}>Approve</button>}
                    {c.status === 'submitted' && <button className="btn-sm btn-danger" onClick={() => handleAction(`/admin/courses/${c._id}/reject`)}>Reject</button>}
                    {!c.isFeatured && <button className="btn-sm btn-info" onClick={() => handleAction(`/admin/courses/${c._id}/feature`)}>Feature</button>}
                    <button className="btn-sm btn-danger" onClick={() => { if (window.confirm('Archive this course?')) handleAction(`/admin/courses/${c._id}`, 'delete'); }}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Payments' && (
        <div className="admin-section">
          <h3>Pending Withdrawals</h3>
          <table className="admin-table">
            <thead><tr><th>Coach</th><th>Amount</th><th>Requested</th><th>Actions</th></tr></thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w._id}>
                  <td>{w.coach?.name || '—'}</td>
                  <td>₹{w.amount}</td>
                  <td>{new Date(w.requestedAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-sm btn-success" onClick={() => handleAction(`/admin/withdrawals/${w._id}/approve`)}>Approve</button>
                    <button className="btn-sm btn-danger" onClick={() => handleAction(`/admin/withdrawals/${w._id}/reject`)}>Reject</button>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No pending withdrawals</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
