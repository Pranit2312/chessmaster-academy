import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { enrollmentAPI, bookingAPI, walletAPI, slotAPI } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingCard from "../components/BookingCard";
import SlotCard from "../components/SlotCard";
import "../styles/StudentDashboard.css";

const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <span className="stat-icon">{icon}</span>
    <h3>{value}</h3>
    <p>{label}</p>
  </div>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    upcomingSessions: 0,
    chessRating: 0
  });
  const [continueLearning, setContinueLearning] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingSlots, setUpcomingSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, bookingsRes, walletRes, slotsRes] = await Promise.all([
        enrollmentAPI.getMyEnrollments?.() || Promise.resolve({ data: [] }),
        bookingAPI.getMyBookings?.() || Promise.resolve({ data: [] }),
        walletAPI.getWallet?.() || Promise.resolve({ data: {} }),
        slotAPI.getSlots?.({ status: 'available', limit: 6 }) || Promise.resolve({ data: [] })
      ]);

      const enrollments = enrollmentsRes.data?.data || [];
      const bookings = bookingsRes.data?.bookings || [];
      const slots = slotsRes.data?.slots || [];

      setContinueLearning(
        enrollments.filter(e => e.progressPercentage < 100).slice(0, 3)
      );
      
      const now = new Date();
      const activeBookings = bookings.filter(b => 
        b.sessionStatus === 'scheduled' && 
        new Date(b.slot?.startTime) > now
      );
      
      setRecentBookings(activeBookings.slice(0, 3));
      setUpcomingSlots(slots.slice(0, 6));
      setWallet(walletRes.data?.data || walletRes.data?.wallet || null);

      const completed = enrollments.filter(e => e.progressPercentage === 100).length;

      setStats({
        enrolledCourses: enrollments.length,
        completedCourses: completed,
        upcomingSessions: activeBookings.length,
        chessRating: user?.chessRating || 0
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.chessRating]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleContinueLearning = (courseId) => {
    navigate(`/course-player/${courseId}`);
  };

  const handleBrowseCoaches = () => {
    navigate('/browse-coaches');
  };

  const handleViewWallet = () => {
    navigate('/wallet');
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await bookingAPI.cancelBooking(bookingId);
        fetchDashboardData();
      } catch (err) {
        alert("Failed to cancel booking");
      }
    }
  };

  const handleBookSlot = (slot) => {
    navigate(`/coach/${slot.coach._id}`, { state: { selectedSlot: slot } });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="student-dashboard">
      {/* WELCOME HEADER */}
      <header className="dashboard-header">
        <div>
          <h2>Welcome back, {user?.name}! 👋</h2>
          <p>Continue your chess learning journey</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/courses')} className="btn btn-secondary">
            Browse Courses
          </button>
          <button onClick={handleBrowseCoaches} className="btn btn-primary">
            Book Coaching
          </button>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="stats-grid">
        <StatCard 
          icon="📈" 
          value={stats.chessRating} 
          label="Your Rating" 
        />
        <StatCard 
          icon="📚" 
          value={stats.enrolledCourses} 
          label="Enrolled Courses" 
        />
        <StatCard 
          icon="✅" 
          value={stats.completedCourses} 
          label="Completed Courses" 
        />
        <StatCard 
          icon="🎯" 
          value={stats.upcomingSessions} 
          label="Upcoming Sessions" 
        />
      </div>

      <div className="dashboard-content-grid">
        <div className="main-content">
          {/* CONTINUE LEARNING SECTION */}
          {continueLearning.length > 0 && (
            <section className="dashboard-section">
              <h3>Continue Learning</h3>
              <div className="continue-learning-grid">
                {continueLearning.map(enrollment => (
                  <div key={enrollment._id} className="learning-card">
                    <img 
                      src={enrollment.course?.thumbnail || '/default-course.png'} 
                      alt={enrollment.course?.title}
                    />
                    <div className="learning-card-info">
                      <h4>{enrollment.course?.title}</h4>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${enrollment.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span>{enrollment.progressPercentage}%</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm btn-block"
                        onClick={() => handleContinueLearning(enrollment.course?._id)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RECENT BOOKINGS */}
          {recentBookings.length > 0 && (
            <section className="dashboard-section">
              <div className="section-header">
                <h3>Upcoming Sessions</h3>
                <button 
                  className="btn btn-text"
                  onClick={() => navigate('/my-bookings')}
                >
                  View All
                </button>
              </div>
              <div className="bookings-list">
                {recentBookings.map(booking => (
                  <BookingCard 
                    key={booking._id} 
                    booking={booking} 
                    isCoach={false}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            </section>
          )}

          {/* AVAILABLE SLOTS */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>Available Slots</h3>
              <button 
                className="btn btn-text"
                onClick={handleBrowseCoaches}
              >
                Browse Coaches
              </button>
            </div>
            {upcomingSlots.length > 0 ? (
              <div className="slot-grid">
                {upcomingSlots.map(slot => (
                  <SlotCard 
                    key={slot._id} 
                    slot={slot} 
                    isCoach={false}
                    onBook={handleBookSlot}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state-mini">
                <p>No slots available right now.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="sidebar-content">
          {/* MY COURSES CARD */}
          <div className="my-courses-card-highlight" onClick={() => navigate('/my-courses')}>
            <div className="card-header">
              <h3>🎓 My Courses</h3>
              <span className="badge">{stats.enrolledCourses}</span>
            </div>
            <p>Access your purchased courses and track your progress.</p>
            <button className="btn btn-primary btn-sm btn-block">
              View All Courses
            </button>
          </div>

          {/* WALLET SECTION */}
          {wallet && (
            <div className="wallet-card-compact">
              <h3>💳 My Wallet</h3>
              <p className="wallet-amount">₹{wallet.balance?.toLocaleString() || 0}</p>
              <div className="wallet-actions">
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/wallet')}>
                  Add Funds
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleViewWallet}>
                  History
                </button>
              </div>
            </div>
          )}

          {/* QUICK LINKS */}
          <div className="quick-links">
            <h3>Quick Links</h3>
            <ul>
              <li onClick={() => navigate('/profile')}>👤 My Profile</li>
              <li onClick={() => navigate('/my-courses')}>🎓 My Courses</li>
              <li onClick={() => navigate('/my-bookings')}>📅 My Bookings</li>
              <li onClick={() => navigate('/wallet')}>💰 Wallet</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* EMPTY STATE */}
      {continueLearning.length === 0 && recentBookings.length === 0 && (
        <section className="dashboard-section empty-state">
          <h3>Ready to Learn?</h3>
          <p>Enroll in courses or book a coaching session to get started!</p>
          <div className="empty-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleBrowseCoaches}
            >
              Browse Coaches
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentDashboard;
