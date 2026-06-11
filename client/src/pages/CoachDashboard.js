import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseAPI, bookingAPI, walletAPI } from '../utils/api';
import DailyClassCreation from '../components/DailyClassCreation';
import Wallet from './Wallet';
import ProfilePage from './ProfilePage';
import CoachPuzzleWidget from '../components/dashboard/CoachPuzzleWidget';
import '../styles/Dashboard.css';

const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <span className="stat-icon">{icon}</span>
    <h3>{value}</h3>
    <p>{label}</p>
  </div>
);

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEarnings: 0,
    activeCourses: 0,
    upcomingBookings: 0
  });
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, bookingsRes, walletRes] = await Promise.all([
        courseAPI.getCoachCourses?.() || Promise.resolve({ data: [] }),
        bookingAPI.getCoachBookings?.() || Promise.resolve({ data: [] }),
        walletAPI.getWallet?.() || Promise.resolve({ data: {} })
      ]);

      const coursesArray = Array.isArray(coursesRes.data?.data) ? coursesRes.data.data
        : Array.isArray(coursesRes.data?.courses) ? coursesRes.data.courses
        : Array.isArray(coursesRes.data) ? coursesRes.data
        : [];
      const bookingsArray = Array.isArray(bookingsRes.data?.data) ? bookingsRes.data.data
        : Array.isArray(bookingsRes.data?.bookings) ? bookingsRes.data.bookings
        : Array.isArray(bookingsRes.data) ? bookingsRes.data
        : [];
      const walletData = walletRes.data?.data || walletRes.data?.wallet || walletRes.data;

      setCourses(coursesArray);
      setBookings(bookingsArray);
      setWallet(walletData);

      let totalStudents = 0;
      let totalEarnings = 0;
      coursesArray.forEach(course => {
        totalStudents += course.enrollmentCount || 0;
        totalEarnings += (course.pricing?.effectivePrice || course.pricing?.price || 0) * (course.enrollmentCount || 0);
      });

      const upcomingCount = bookingsArray.filter(b => {
        return b.status === 'confirmed' && new Date(b.date || b.createdAt) > new Date();
      }).length || 0;

      setStats({
        totalStudents,
        totalEarnings,
        activeCourses: coursesArray.length || 0,
        upcomingBookings: upcomingCount
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/create-course');
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h2>Coach Dashboard</h2>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setActiveTab('slots')} className="btn btn-secondary">
            Manage Slots
          </button>
          <button onClick={handleCreateCourse} className="btn btn-primary">
            + Create New Course
          </button>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="stats-grid">
        <StatCard icon="📊" value="Overview" label="Dashboard" onClick={() => setActiveTab('overview')} />
        <StatCard icon="👥" value={stats.totalStudents} label="Total Students" />
        <StatCard icon="💰" value={`₹${stats.totalEarnings.toLocaleString()}`} label="Total Earnings" />
        <StatCard icon="📚" value={stats.activeCourses} label="Active Courses" />
      </div>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          Slots
        </button>
        <button
          className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'puzzles' ? 'active' : ''}`}
          onClick={() => setActiveTab('puzzles')}
        >
          Puzzles
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* WALLET PREVIEW */}
          {wallet && (
            <section className="wallet-overview">
              <div className="wallet-card">
                <h3>💳 Wallet Balance</h3>
                <p className="wallet-amount">₹{wallet.balance?.toLocaleString() || 0}</p>
                <div className="wallet-actions">
                  <button className="btn btn-secondary" onClick={() => setActiveTab('wallet')}>
                    View Wallet
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate('/earnings')}>
                    View Earnings
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="dashboard-grid">
            <section className="dashboard-section">
              <h3>Upcoming Bookings</h3>
              {bookings.length > 0 ? (
                <div className="bookings-list">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking._id} className="booking-item">
                      <div className="booking-info">
                        <strong>{booking.studentName || 'Student'}</strong>
                        <small>{new Date(booking.date || booking.createdAt).toLocaleString()}</small>
                      </div>
                      <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No upcoming bookings.</p>
              )}
            </section>

            <section className="dashboard-section">
              <h3>Recent Courses</h3>
              {courses.length > 0 ? (
                <div className="mini-courses-list">
                  {courses.slice(0, 3).map(course => (
                    <div key={course._id} className="mini-course-item">
                      <img src={course.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23e2e8f0'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ECourse%3C/text%3E%3C/svg%3E"} alt={course.title} />
                      <div className="mini-course-info">
                        <h4>{course.title}</h4>
                        <span>👥 {course.enrollmentCount || 0}</span>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-text" onClick={() => setActiveTab('courses')}>View All Courses</button>
                </div>
              ) : (
                <p>No courses created yet.</p>
              )}
            </section>
          </div>

          {/* PUZZLE PLATFORM WIDGET (Phase 2) */}
          <CoachPuzzleWidget />
        </div>
      )}

      {/* COURSES TAB */}
      {activeTab === 'courses' && (
        <section className="dashboard-section">
          <div className="section-header">
            <h3>My Courses</h3>
            <button onClick={handleCreateCourse} className="btn btn-primary btn-sm">
              + New Course
            </button>
          </div>
          {courses.length > 0 ? (
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course._id} className="course-card-dashboard">
                  <img src={course.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23e2e8f0'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ECourse%3C/text%3E%3C/svg%3E"} alt={course.title} />
                  <h4>{course.title}</h4>
                  <p className="course-category">{course.category}</p>
                  <div className="course-stats">
                    <span>👥 {course.enrollmentCount || 0} students</span>
                    <span>⭐ {course.rating || 'N/A'}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewCourse(course._id)}
                  >
                    Manage Course
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No courses yet.</p>
              <button onClick={handleCreateCourse} className="btn btn-primary">Create Your First Course</button>
            </div>
          )}
        </section>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <section className="dashboard-section">
          <h3>All Bookings</h3>
          {bookings.length > 0 ? (
            <div className="bookings-list">
              {bookings.map(booking => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-info">
                    <strong>{booking.studentName || 'Student'}</strong>
                    <p>{booking.topic || 'General Coaching'}</p>
                    <small>{new Date(booking.date || booking.createdAt).toLocaleString()}</small>
                  </div>
                  <div className="booking-actions">
                    <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                    {booking.meetingLink && (
                      <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No bookings found.</p>
          )}
        </section>
      )}

      {/* SLOTS TAB */}
      {activeTab === 'slots' && (
        <section className="dashboard-section">
          <DailyClassCreation coachId={user?._id} />
        </section>
      )}

      {/* WALLET TAB */}
      {activeTab === 'wallet' && (
        <section className="dashboard-section">
          <Wallet />
        </section>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <section className="dashboard-section">
          <ProfilePage />
        </section>
      )}

      {/* PUZZLES TAB */}
      {activeTab === 'puzzles' && (
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Puzzle Platform</h3>
            <button onClick={() => navigate('/coach/puzzles/create')} className="btn btn-primary btn-sm">
              + Create Puzzle
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Create custom puzzles for your students, manage existing ones, and track engagement.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="wallet-overview" style={{ flex: 1, minWidth: 180 }}>
              <div className="wallet-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/puzzles')}>
                <h3>🧩 Browse Puzzles</h3>
                <p>Access the full Lichess puzzle database</p>
              </div>
            </div>
            <div className="wallet-overview" style={{ flex: 1, minWidth: 180 }}>
              <div className="wallet-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/puzzles/rush')}>
                <h3>⚡ Puzzle Rush</h3>
                <p>Timed puzzle-solving challenge</p>
              </div>
            </div>
            <div className="wallet-overview" style={{ flex: 1, minWidth: 180 }}>
              <div className="wallet-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/coach/puzzles/create')}>
                <h3>✏️ Create Puzzle</h3>
                <p>Design puzzles for your courses</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CoachDashboard;