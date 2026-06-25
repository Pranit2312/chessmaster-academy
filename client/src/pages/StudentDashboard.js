import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { enrollmentAPI, bookingAPI, walletAPI, slotAPI } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingCard from "../components/BookingCard";
import SlotCard from "../components/SlotCard";
import StudentAIWidget from "../components/dashboard/StudentAIWidget";
import StudentPuzzleWidget from "../components/dashboard/StudentPuzzleWidget";
import "../styles/StudentDashboard.css";

const StatCard = ({ icon, value, label, type }) => (
  <div className="dash-stat-card">
    <div className={`dash-stat-icon ${type}`}>{icon}</div>
    <div className="dash-stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
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
    navigate(`/coach/${slot.coach?._id || slot.coach}`, { state: { selectedSlot: slot } });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="student-dashboard">
      {/* WELCOME CARD */}
      <div className="welcome-card">
        <div className="welcome-content">
          <h1>Welcome back, {user?.name}</h1>
          <p>Continue your chess learning journey. You have {stats.enrolledCourses} active course{stats.enrolledCourses !== 1 ? 's' : ''} and {stats.upcomingSessions} upcoming session{stats.upcomingSessions !== 1 ? 's' : ''}.</p>
        </div>
        <div className="welcome-actions">
          <button onClick={() => navigate('/courses')} className="btn">
            Browse Courses
          </button>
          <button onClick={handleBrowseCoaches} className="btn btn-primary">
            Book Coaching
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-row">
        <StatCard icon="📈" value={stats.chessRating} label="Your Rating" type="rating" />
        <StatCard icon="📚" value={stats.enrolledCourses} label="Enrolled Courses" type="courses" />
        <StatCard icon="✅" value={stats.completedCourses} label="Completed" type="completed" />
        <StatCard icon="🎯" value={stats.upcomingSessions} label="Upcoming Sessions" type="sessions" />
      </div>

      {/* MAIN GRID */}
      <div className="dash-grid">
        <div className="dash-main">
          {/* CONTINUE LEARNING */}
          {continueLearning.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Continue Learning</h3>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate('/my-courses')}>
                  View All
                </button>
              </div>
              <div className="dash-section-body">
                <div className="continue-grid">
                  {continueLearning.map(enrollment => (
                    <div key={enrollment._id} className="learning-card">
                      <img
                        src={enrollment.course?.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23e2e8f0'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ECourse%3C/text%3E%3C/svg%3E"}
                        alt={enrollment.course?.title}
                      />
                      <div className="learning-card-body">
                        <h4>{enrollment.course?.title}</h4>
                        <div className="progress-row">
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${enrollment.progressPercentage}%` }} />
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
              </div>
            </div>
          )}

          {/* UPCOMING SESSIONS */}
          {recentBookings.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <h3>Upcoming Sessions</h3>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate('/my-bookings')}>
                  View All
                </button>
              </div>
              <div className="dash-section-body">
                {recentBookings.map(booking => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    isCoach={false}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI & PUZZLE WIDGETS */}
          <StudentAIWidget />
          <StudentPuzzleWidget />

          {/* AVAILABLE SLOTS */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3>Available Coaching Slots</h3>
              <button className="btn btn-sm btn-ghost" onClick={handleBrowseCoaches}>
                Browse Coaches
              </button>
            </div>
            <div className="dash-section-body">
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
                <div className="empty-mini">
                  <p>No slots available right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="dash-sidebar">
          {/* MY COURSES */}
          <div className="courses-highlight" onClick={() => navigate('/my-courses')}>
            <div className="courses-highlight-header">
              <h3>My Courses</h3>
              <span className="badge">{stats.enrolledCourses}</span>
            </div>
            <p>Access your purchased courses and track your progress.</p>
            <button className="btn btn-sm btn-block">
              View All Courses
            </button>
          </div>

          {/* WALLET */}
          {wallet && (
            <div className="wallet-card">
              <h3>Wallet</h3>
              <p className="wallet-balance">₹{wallet.balance?.toLocaleString() || 0}</p>
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
          <div className="quick-links-card">
            <h3>Quick Links</h3>
            <div className="quick-link-item" onClick={() => navigate('/profile')}>My Profile</div>
            <div className="quick-link-item" onClick={() => navigate('/my-courses')}>My Courses</div>
            <div className="quick-link-item" onClick={() => navigate('/my-bookings')}>My Bookings</div>
            <div className="quick-link-item" onClick={() => navigate('/wallet')}>Wallet</div>
            <div className="quick-link-item" onClick={() => navigate('/analysis')}>Game Analysis</div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {continueLearning.length === 0 && recentBookings.length === 0 && (
        <div className="dash-section">
          <div className="dash-section-body">
            <div className="empty-state">
              <h3>Ready to Learn?</h3>
              <p>Enroll in courses or book a coaching session to get started!</p>
              <div className="btn-group">
                <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                  Browse Courses
                </button>
                <button className="btn btn-secondary" onClick={handleBrowseCoaches}>
                  Browse Coaches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
