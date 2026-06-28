import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BookingCard from '../components/BookingCard';
import AnimatedCounter from '../components/AnimatedCounter';
import { courseAPI, bookingAPI, walletAPI, slotAPI, userAPI } from '../utils/api';
import '../styles/CoachDashboard.css';

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return '₹' + n.toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function isFuture(d) {
  if (!d) return false;
  return new Date(d) > new Date();
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);

  // Bookings sub-tab
  const [bookingTab, setBookingTab] = useState('upcoming');

  // Slots state
  const [slotForm, setSlotForm] = useState({ startTime: '', price: '', meetingLink: '', meetingPlatform: 'Zoom', duration: '60' });
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        coursesRes, bookingsRes, slotsRes, walletRes, txRes
      ] = await Promise.all([
        courseAPI.getCoachCourses?.() || Promise.resolve({ data: [] }),
        bookingAPI.getCoachBookings?.() || Promise.resolve({ data: [] }),
        slotAPI.getMySlots?.() || Promise.resolve({ data: [] }),
        walletAPI.getWallet?.() || Promise.resolve({ data: {} }),
        walletAPI.getTransactions?.() || Promise.resolve({ data: [] })
      ]);

      const coursesArray = coursesRes.data?.data || coursesRes.data?.courses || coursesRes.data || [];
      const bookingsArray = bookingsRes.data?.bookings || bookingsRes.data?.data || bookingsRes.data || [];
      const slotsArray = slotsRes.data?.slots || slotsRes.data?.data || slotsRes.data || [];
      const walletData = walletRes.data?.data || walletRes.data?.wallet || walletRes.data;
      const txArray = txRes.data?.data || txRes.data?.transactions || txRes.data || [];

      setCourses(Array.isArray(coursesArray) ? coursesArray : []);
      setBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
      setSlots(Array.isArray(slotsArray) ? slotsArray : []);
      setWallet(walletData);
      setTransactions(Array.isArray(txArray) ? txArray : []);

      // Fetch coach profile
      try {
        const meRes = await userAPI.getMe();
        setCoachProfile(meRes.data?.data || meRes.data?.user || meRes.data);
      } catch {}
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancelBooking(bookingId, { cancellationReason: 'Coach cancelled' });
      fetchDashboardData();
    } catch { alert('Failed to cancel booking'); }
  }, [fetchDashboardData]);

  const handleCompleteBooking = useCallback(async (bookingId) => {
    try {
      await bookingAPI.updateBookingStatus(bookingId, { sessionStatus: 'completed' });
      fetchDashboardData();
    } catch { alert('Failed to complete booking'); }
  }, [fetchDashboardData]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Compute derived stats
  const safeBookings = useMemo(() => Array.isArray(bookings) ? bookings : [], [bookings]);
  const safeCourses = useMemo(() => Array.isArray(courses) ? courses : [], [courses]);
  const safeSlots = useMemo(() => Array.isArray(slots) ? slots : [], [slots]);
  const safeTx = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  const upcomingBookings = useMemo(() =>
    safeBookings.filter(b =>
      b.sessionStatus === 'scheduled' &&
      b.slot?.startTime &&
      isFuture(b.slot.startTime)
    ), [safeBookings]);

  const completedBookings = useMemo(() =>
    safeBookings.filter(b => b.sessionStatus === 'completed'), [safeBookings]);

  const cancelledBookings = useMemo(() =>
    safeBookings.filter(b => b.sessionStatus === 'cancelled'), [safeBookings]);

  const totalStudents = useMemo(() => {
    const set = new Set();
    safeBookings.forEach(b => { if (b.student) set.add(typeof b.student === 'object' ? b.student._id : b.student); });
    return set.size;
  }, [safeBookings]);

  const totalEarnings = useMemo(() =>
    safeBookings.filter(b => b.sessionStatus === 'completed')
      .reduce((sum, b) => sum + (b.coachEarning || b.amount || 0), 0)
  , [safeBookings]);

  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return safeBookings.filter(b =>
      b.sessionStatus === 'completed' && new Date(b.updatedAt || b.createdAt) >= start
    ).reduce((sum, b) => sum + (b.coachEarning || b.amount || 0), 0);
  }, [safeBookings]);

  const totalSessions = useMemo(() =>
    safeBookings.filter(b => b.sessionStatus === 'completed').length
  , [safeBookings]);

  const activeCourses = useMemo(() =>
    safeCourses.filter(c => c.status !== 'archived' && c.status !== 'draft').length
  , [safeCourses]);

  // Today's schedule
  const todaySchedule = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000);
    return upcomingBookings.filter(b => {
      const d = new Date(b.slot.startTime);
      return d >= start && d < end;
    }).sort((a, b) => new Date(a.slot.startTime) - new Date(b.slot.startTime));
  }, [upcomingBookings]);

  const nextSession = useMemo(() =>
    upcomingBookings.sort((a, b) => new Date(a.slot.startTime) - new Date(b.slot.startTime))[0] || null
  , [upcomingBookings]);

  // Wallet balance
  const walletBalance = useMemo(() =>
    wallet?.balance || safeTx.reduce((sum, t) => {
      if (t.type === 'credit') return sum + (t.amount || 0);
      if (t.type === 'debit') return sum - (t.amount || 0);
      return sum;
    }, 0) || 0
  , [wallet, safeTx]);

  if (loading) return <div className="cd-loading"><LoadingSpinner /></div>;

  return (
    <div className="cd-container">
      {/* HEADER */}
      <header className="cd-header">
        <div className="cd-header-left">
          <div className="cd-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h1>Welcome, {user?.name || 'Coach'}</h1>
            <p className="cd-header-sub">
              {coachProfile?.title && coachProfile.title !== 'None' ? coachProfile.title + ' · ' : ''}
              {coachProfile?.chessRating ? 'Rating: ' + coachProfile.chessRating + ' · ' : ''}
              {totalSessions} sessions completed
            </p>
          </div>
        </div>
        <div className="cd-header-actions">
          <button className="cd-btn cd-btn-secondary" onClick={() => navigate('/coach/earnings')}>Earnings</button>
          <button className="cd-btn cd-btn-primary" onClick={() => navigate('/create-course')}>+ New Course</button>
        </div>
      </header>

      {/* STATS ROW */}
      <div className="cd-stats">
        <div className="cd-stat-card">
          <span className="cd-stat-icon">💰</span>
          <div>
            <p className="cd-stat-value">{formatCurrency(thisMonthEarnings)}</p>
            <p className="cd-stat-label">Earnings this month</p>
          </div>
        </div>
        <div className="cd-stat-card">
          <span className="cd-stat-icon">📅</span>
          <div>
          <p className="cd-stat-value"><AnimatedCounter target={upcomingBookings.length} /></p>
          <p className="cd-stat-label">Upcoming Sessions</p>
          </div>
        </div>
        <div className="cd-stat-card">
          <span className="cd-stat-icon">👥</span>
          <div>
          <p className="cd-stat-value"><AnimatedCounter target={totalStudents} /></p>
          <p className="cd-stat-label">Active Students</p>
          </div>
        </div>
        <div className="cd-stat-card">
          <span className="cd-stat-icon">📚</span>
          <div>
          <p className="cd-stat-value"><AnimatedCounter target={activeCourses} /></p>
          <p className="cd-stat-label">Active Courses</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="cd-tabs">
        {['overview','courses','bookings','slots','wallet','profile','puzzles'].map(t => (
          <button key={t} className={`cd-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ======================================================================== */}
      {/* OVERVIEW TAB                                                             */}
      {/* ======================================================================== */}
      {activeTab === 'overview' && (
        <div className="cd-overview">
          <div className="cd-overview-grid">
            <section className="cd-section cd-section-full">
              <div className="cd-section-header">
                <h3>Today's Schedule</h3>
                <button className="cd-btn cd-btn-text" onClick={() => setActiveTab('bookings')}>View All</button>
              </div>
              {todaySchedule.length > 0 ? (
                <div className="cd-today-list">
                  {todaySchedule.slice(0, 4).map(b => {
                    const s = b.student || {};
                    const studentName = typeof s === 'object' ? (s.name || 'Student') : 'Student';
                    const studentRating = typeof s === 'object' ? (s.chessRating || '') : '';
                    return (
                      <div key={b._id} className="cd-today-item">
                        <div className="cd-today-time">{formatTime(b.slot?.startTime)}</div>
                        <div className="cd-today-info">
                          <strong>{studentName}</strong>
                          {studentRating ? <span className="cd-badge cd-badge-rating">{studentRating}</span> : null}
                          <span className="cd-today-duration">{b.slot?.duration || 60} min</span>
                        </div>
                        {b.meetingLink || b.slot?.meetingLink ? (
                          <a href={b.meetingLink || b.slot?.meetingLink} target="_blank" rel="noopener noreferrer" className="cd-btn cd-btn-sm cd-btn-primary">Join</a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cd-empty cd-empty-sm"><p>No sessions scheduled for today</p></div>
              )}
            </section>

            <section className="cd-section">
              <div className="cd-section-header"><h3>Wallet Balance</h3></div>
              <div className="cd-wallet-mini">
                <p className="cd-wallet-amount">{formatCurrency(walletBalance)}</p>
                <p className="cd-wallet-sub">Available balance</p>
                <div className="cd-wallet-actions">
                  <button className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => setActiveTab('wallet')}>View Wallet</button>
                  <button className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => navigate('/coach/earnings')}>Earnings</button>
                </div>
              </div>
            </section>

            <section className="cd-section">
              <div className="cd-section-header"><h3>Next Session</h3></div>
              {nextSession ? (
                <div className="cd-next-session">
                  <div className="cd-next-date">{formatDate(nextSession.slot?.startTime)}</div>
                  <div className="cd-next-time">{formatTime(nextSession.slot?.startTime)}</div>
                  <p className="cd-next-student">
                    {typeof nextSession.student === 'object' ? nextSession.student.name : 'Student'}
                  </p>
                </div>
              ) : (
                <div className="cd-empty cd-empty-sm"><p>No upcoming sessions</p></div>
              )}
            </section>

            <section className="cd-section">
              <div className="cd-section-header"><h3>Revenue</h3></div>
              <div style={{ padding: 'var(--4) 0' }}>
                <p className="cd-stat-value" style={{ fontSize: 'var(--text-3xl)' }}>{formatCurrency(totalEarnings)}</p>
                <p className="cd-stat-label">Lifetime earnings</p>
              </div>
              <hr className="cd-divider" />
              <div style={{ padding: 'var(--4) 0' }}>
                <p className="cd-stat-value" style={{ fontSize: 'var(--text-3xl)' }}>{completedBookings.length}</p>
                <p className="cd-stat-label">Completed sessions</p>
              </div>
            </section>
          </div>

          <section className="cd-section">
            <div className="cd-section-header"><h3>Recent Courses</h3></div>
            {safeCourses.length > 0 ? (
              <div className="cd-mini-courses">
                {safeCourses.slice(0, 3).map(c => (
                  <div key={c._id} className="cd-mini-course" onClick={() => navigate('/course/' + c._id)}>
                    <div className="cd-mini-course-thumb">
                      {c.thumbnail ? <img src={c.thumbnail} alt="" /> : <span>📚</span>}
                    </div>
                    <div className="cd-mini-course-info">
                      <h4>{c.title}</h4>
                      <p>{c.enrollmentCount || 0} students · {formatCurrency((c.pricing?.effectivePrice || c.pricing?.price || 0) * (c.enrollmentCount || 0))}</p>
                    </div>
                  </div>
                ))}
                <button className="cd-btn cd-btn-text" onClick={() => setActiveTab('courses')}>View All Courses</button>
              </div>
            ) : (
              <div className="cd-empty"><p>You haven't created any courses yet</p><button className="cd-btn cd-btn-primary" onClick={() => navigate('/create-course')}>Create Your First Course</button></div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================================== */}
      {/* COURSES TAB                                                             */}
      {/* ======================================================================== */}
      {activeTab === 'courses' && (
        <section className="cd-section">
          <div className="cd-section-header">
            <h3>My Courses</h3>
            <button className="cd-btn cd-btn-primary cd-btn-sm" onClick={() => navigate('/create-course')}>+ New Course</button>
          </div>
          {safeCourses.length > 0 ? (
            <div className="cd-courses-grid">
              {safeCourses.map(c => {
                const revenue = (c.pricing?.effectivePrice || c.pricing?.price || 0) * (c.enrollmentCount || 0);
                return (
                  <div key={c._id} className="cd-course-card">
                    <div className="cd-course-thumb">
                      {c.thumbnail ? <img src={c.thumbnail} alt="" /> : <div className="cd-course-thumb-placeholder">📚</div>}
                    </div>
                    <div className="cd-course-body">
                      <h4>{c.title}</h4>
                      <p className="cd-course-meta">{c.category || 'General'}</p>
                      <div className="cd-course-stats-row">
                        <span>👥 {c.enrollmentCount || 0}</span>
                        <span>💰 {formatCurrency(revenue)}</span>
                        <span>⭐ {c.rating || '—'}</span>
                      </div>
                      <span className={`cd-badge cd-badge-${c.status || 'draft'}`}>{c.status || 'draft'}</span>
                    </div>
                    <div className="cd-course-actions">
                      <button className="cd-btn cd-btn-sm cd-btn-secondary" onClick={() => navigate('/course/' + c._id)}>Manage</button>
                      <button className="cd-btn cd-btn-sm cd-btn-secondary" onClick={() => navigate('/my-courses')}>Students</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cd-empty">
              <div className="cd-empty-icon">📚</div>
              <h3>Create Your First Course</h3>
              <p>Share your chess knowledge by creating a structured course for your students.</p>
              <button className="cd-btn cd-btn-primary" onClick={() => navigate('/create-course')}>Get Started</button>
            </div>
          )}
        </section>
      )}

      {/* ======================================================================== */}
      {/* BOOKINGS TAB                                                            */}
      {/* ======================================================================== */}
      {activeTab === 'bookings' && (
        <section className="cd-section">
          <div className="cd-section-header"><h3>Bookings</h3></div>
          <div className="cd-booking-tabs">
            {['upcoming','completed','cancelled'].map(t => (
              <button key={t} className={`cd-booking-tab ${bookingTab === t ? 'active' : ''}`} onClick={() => setBookingTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="cd-booking-count">
                  {t === 'upcoming' ? upcomingBookings.length : t === 'completed' ? completedBookings.length : cancelledBookings.length}
                </span>
              </button>
            ))}
          </div>

          {bookingTab === 'upcoming' && (
            upcomingBookings.length > 0 ? (
              <div className="cd-booking-list">
                {upcomingBookings.map(b => (
                  <BookingCard key={b._id} booking={b} isCoach={true} onCancel={handleCancelBooking} onComplete={handleCompleteBooking} />
                ))}
              </div>
            ) : <div className="cd-empty"><p>No upcoming bookings</p></div>
          )}

          {bookingTab === 'completed' && (
            completedBookings.length > 0 ? (
              <div className="cd-booking-list">
                {completedBookings.map(b => (
                  <BookingCard key={b._id} booking={b} isCoach={true} />
                ))}
              </div>
            ) : <div className="cd-empty"><p>No completed bookings yet</p></div>
          )}

          {bookingTab === 'cancelled' && (
            cancelledBookings.length > 0 ? (
              <div className="cd-booking-list">
                {cancelledBookings.map(b => (
                  <BookingCard key={b._id} booking={b} isCoach={true} />
                ))}
              </div>
            ) : <div className="cd-empty"><p>No cancelled bookings</p></div>
          )}
        </section>
      )}

      {/* ======================================================================== */}
      {/* SLOTS TAB                                                               */}
      {/* ======================================================================== */}
      {activeTab === 'slots' && (
        <div className="cd-slots-page">
          <section className="cd-slot-create-section">
            <div className="cd-slot-create-accent"></div>
            <div className="cd-slot-create-body">
              <div className="cd-section-header">
                <div className="cd-slot-create-title">
                  <span className="cd-slot-create-icon">&#128197;</span>
                  <h3>Create Availability Slot</h3>
                </div>
              </div>
              <form className="cd-slot-form" onSubmit={async (e) => {
              e.preventDefault();
              setSlotLoading(true);
              setSlotError('');
              try {
                const startDate = new Date(slotForm.startTime);
                const endDate = new Date(startDate.getTime() + parseInt(slotForm.duration) * 60000);
                await slotAPI.createSlot({
                  startTime: slotForm.startTime,
                  endTime: endDate.toISOString(),
                  duration: parseInt(slotForm.duration),
                  price: parseFloat(slotForm.price),
                  meetingLink: slotForm.meetingLink || 'https://meet.google.com/new',
                  meetingPlatform: slotForm.meetingPlatform
                });
                setSlotForm({ startTime: '', price: '', meetingLink: '', meetingPlatform: 'Zoom', duration: '60' });
                const res = await slotAPI.getMySlots();
                setSlots(res.data?.slots || res.data?.data || []);
              } catch (err) {
                setSlotError(err.response?.data?.message || 'Failed to create slot');
              } finally {
                setSlotLoading(false);
              }
            }}>
              <div className="cd-slot-form-grid">
                <div className="cd-form-group">
                  <label>Start Date & Time</label>
                  <input type="datetime-local" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="cd-form-group">
                  <label>Duration</label>
                  <select value={slotForm.duration} onChange={e => setSlotForm(f => ({ ...f, duration: e.target.value }))}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
                <div className="cd-form-group">
                  <label>Price (&#x20B9;)</label>
                  <input type="number" min="0" step="1" value={slotForm.price} onChange={e => setSlotForm(f => ({ ...f, price: e.target.value }))} required placeholder="500" />
                </div>
                <div className="cd-form-group">
                  <label>Meeting Platform</label>
                  <select value={slotForm.meetingPlatform} onChange={e => setSlotForm(f => ({ ...f, meetingPlatform: e.target.value }))}>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="cd-form-group cd-form-group-wide">
                  <label>Meeting Link</label>
                  <input type="url" value={slotForm.meetingLink} onChange={e => setSlotForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." />
                </div>
              </div>
              {slotForm.startTime && slotForm.duration && (
                <div className="cd-slot-summary">
                  <span className="cd-slot-summary-icon">&#9200;</span>
                  <span>
                    {new Date(slotForm.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}
                    {new Date(slotForm.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(new Date(slotForm.startTime).getTime() + parseInt(slotForm.duration) * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' ('}{slotForm.duration} min{')'}
                  </span>
                </div>
              )}
              {slotError && <p className="cd-error">{slotError}</p>}
              <button type="submit" className="cd-btn cd-slot-create-btn" disabled={slotLoading}>
                <span className="cd-slot-create-btn-icon">&#43;</span>
                {slotLoading ? 'Creating...' : 'Create Slot'}
              </button>
            </form>
            </div>
          </section>

          <section className="cd-section">
            <div className="cd-section-header"><h3>Your Slots ({safeSlots.length})</h3></div>
            {safeSlots.length > 0 ? (
              <div className="cd-slots-grid">
                {safeSlots.map(s => (
                  <div key={s._id} className={`cd-slot-card cd-slot-${s.status}`}>
                    <div className="cd-slot-date">{formatDate(s.startTime)}</div>
                    <div className="cd-slot-time">{formatTime(s.startTime)} — {formatTime(s.endTime)}</div>
                    <div className="cd-slot-meta">
                      <span>{s.duration} min</span>
                      <span>{formatCurrency(s.price)}</span>
                    </div>
                    <span className={`cd-badge cd-badge-${s.status}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cd-empty"><p>No slots created yet. Set your availability above.</p></div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================================== */}
      {/* WALLET TAB                                                              */}
      {/* ======================================================================== */}
      {activeTab === 'wallet' && (
        <div className="cd-wallet-page">
          <section className="cd-section">
            <div className="cd-section-header"><h3>Wallet</h3></div>
            <div className="cd-wallet-cards">
              <div className="cd-wallet-card-main">
                <p className="cd-wallet-label">Current Balance</p>
                <p className="cd-wallet-amount-main">{formatCurrency(walletBalance)}</p>
                <button className="cd-btn cd-btn-secondary cd-btn-sm" onClick={() => alert('Withdrawal request submitted.')}>Withdraw Funds</button>
              </div>
              <div className="cd-wallet-mini-card">
                <p className="cd-wallet-label">Lifetime Earnings</p>
                <p className="cd-wallet-value">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="cd-wallet-mini-card">
                <p className="cd-wallet-label">This Month</p>
                <p className="cd-wallet-value">{formatCurrency(thisMonthEarnings)}</p>
              </div>
              <div className="cd-wallet-mini-card">
                <p className="cd-wallet-label">Pending</p>
                <p className="cd-wallet-value">{formatCurrency(wallet?.pendingWithdrawal || 0)}</p>
              </div>
            </div>
          </section>

          <section className="cd-section">
            <div className="cd-section-header"><h3>Transaction History</h3></div>
            {safeTx.length > 0 ? (
              <div className="cd-tx-table-wrapper">
                <table className="cd-tx-table">
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {safeTx.slice(0, 20).map(t => (
                      <tr key={t._id}>
                        <td>{formatDate(t.createdAt)}</td>
                        <td>{t.description || t.reason || t.type}</td>
                        <td className={t.type === 'credit' ? 'cd-tx-credit' : 'cd-tx-debit'}>
                          {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td><span className={`cd-badge cd-badge-${t.status || 'completed'}`}>{t.status || 'completed'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="cd-empty"><p>No transactions yet</p></div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================================== */}
      {/* PROFILE TAB                                                             */}
      {/* ======================================================================== */}
      {activeTab === 'profile' && (
        <section className="cd-section">
          <div className="cd-section-header"><h3>Coach Profile</h3></div>
          <div className="cd-profile">
            <div className="cd-profile-avatar-section">
              <div className="cd-profile-avatar-lg">{user?.name ? user.name.charAt(0).toUpperCase() : 'C'}</div>
              <div>
                <h2>{user?.name || 'Coach'}</h2>
                <p>{user?.email || ''}</p>
                {coachProfile?.title && coachProfile.title !== 'None' && <span className="cd-badge cd-badge-title">{coachProfile.title}</span>}
              </div>
            </div>
            <div className="cd-profile-grid">
              <div className="cd-profile-field">
                <label>Chess Rating</label>
                <p>{coachProfile?.chessRating || user?.chessRating || '—'}</p>
              </div>
              <div className="cd-profile-field">
                <label>Experience</label>
                <p>{coachProfile?.experience || user?.experience || 0} years</p>
              </div>
              <div className="cd-profile-field">
                <label>Hourly Rate</label>
                <p>{formatCurrency(coachProfile?.hourlyRate || user?.hourlyRate || 0)}/hr</p>
              </div>
              <div className="cd-profile-field">
                <label>Country</label>
                <p>{coachProfile?.country || user?.country || '—'}</p>
              </div>
              <div className="cd-profile-field cd-profile-field-full">
                <label>Bio</label>
                <p>{coachProfile?.bio || user?.bio || 'No bio added yet.'}</p>
              </div>
              <div className="cd-profile-field cd-profile-field-full">
                <label>Specializations</label>
                <p>{(coachProfile?.specializations || user?.specializations || []).join(', ') || 'None specified'}</p>
              </div>
              <div className="cd-profile-field">
                <label>Average Rating</label>
                <p>⭐ {coachProfile?.averageRating || user?.averageRating || 0} ({coachProfile?.totalReviews || user?.totalReviews || 0} reviews)</p>
              </div>
              <div className="cd-profile-field">
                <label>Total Sessions</label>
                <p>{totalSessions}</p>
              </div>
            </div>
            <button className="cd-btn cd-btn-secondary" onClick={() => navigate('/profile')}>Edit Profile</button>
          </div>
        </section>
      )}

      {/* ======================================================================== */}
      {/* PUZZLES TAB                                                             */}
      {/* ======================================================================== */}
      {activeTab === 'puzzles' && (
        <section className="cd-section">
          <div className="cd-section-header">
            <h3>Puzzle Platform</h3>
            <button className="cd-btn cd-btn-primary cd-btn-sm" onClick={() => navigate('/coach/puzzles/create')}>+ Create Puzzle</button>
          </div>
          <div className="cd-puzzle-cards">
            <div className="cd-puzzle-card" onClick={() => navigate('/puzzles')}>
              <span className="cd-puzzle-icon">🧩</span>
              <h4>Browse Puzzles</h4>
              <p>Access the full Lichess puzzle database with 2.5M+ tactics</p>
            </div>
            <div className="cd-puzzle-card" onClick={() => navigate('/puzzles/rush')}>
              <span className="cd-puzzle-icon">⚡</span>
              <h4>Puzzle Rush</h4>
              <p>Timed puzzle-solving challenge to test your tactical speed</p>
            </div>
            <div className="cd-puzzle-card" onClick={() => navigate('/coach/puzzles/create')}>
              <span className="cd-puzzle-icon">✏️</span>
              <h4>Create Puzzle</h4>
              <p>Design custom puzzles for your courses and students</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CoachDashboard;
