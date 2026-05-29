import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { slotAPI, bookingAPI } from "../utils/api";
import SlotCard from "../components/SlotCard";
import BookingCard from "../components/BookingCard";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcomingSlots, setUpcomingSlots] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
      slotAPI.getSlots({ startDate: new Date().toISOString() }),
      bookingAPI.getMyBookings(),
    ]);

    console.log("slotsRes =", slotsRes.data);
    console.log("bookingsRes =", bookingsRes.data);

      setUpcomingSlots((slotsRes.data?.slots || []).slice(0, 6));

      // ✅ FILTER EXPIRED / CANCELLED BOOKINGS
      const now = new Date();
      const activeBookings = (bookingsRes.data?.bookings || []).filter((b) => {
        if (b.sessionStatus === "cancelled") return false;
        if (!b.slot?.endTime) return true;
        return new Date(b.slot.endTime) > now;
      });

      setRecentBookings(activeBookings.slice(0, 3));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CANCEL BOOKING HANDLER (FIXED)
  const handleCancel = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId);
      fetchDashboardData(); // refresh UI
    } catch (error) {
      alert("Failed to cancel booking");
      console.error(error);
    }
  };

  const handleBookSlot = (slot) => {
    navigate(`/coach/${slot.coach._id}`, { state: { selectedSlot: slot } });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="student-dashboard">

      <div className="header-section">
        <h2>Welcome back, {user?.name}! 👋</h2>
        <p className="subtitle">Ready to sharpen your chess skills today?</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="icon">⭐</span>
          <h3>{user?.chessRating}</h3>
          <p>Your Rating</p>
        </div>

        <div className="stat-card">
          <span className="icon">📚</span>
          <h3>{user?.totalSessions || 0}</h3>
          <p>Sessions Completed</p>
        </div>

        <div className="stat-card">
          <span className="icon">🎯</span>
          <h3>{user?.skillLevel}</h3>
          <p>Skill Level</p>
        </div>
      </div>

      {/* ✅ RECENT BOOKINGS */}
      {recentBookings.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h3>Recent Bookings</h3>
            <button
              className="btn small-btn secondary-btn"
              onClick={() => navigate("/student/bookings")}
            >
              View All
            </button>
          </div>

          <div className="booking-list">
            {recentBookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                isCoach={false}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </section>
      )}

      {/* ✅ AVAILABLE SLOTS */}
      <section className="section">
        <div className="section-header">
          <h3>Available Coaching Slots</h3>
          <button
            className="btn small-btn secondary-btn"
            onClick={() => navigate("/browse")}
          >
            View All Coaches
          </button>
        </div>

        {upcomingSlots.length > 0 ? (
          <div className="slot-grid">
            {upcomingSlots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                onBook={handleBookSlot}
                isCoach={false}
              />
            ))}
          </div>
        ) : (
          <div className="empty-box">
            <p>No available slots right now.</p>
            <button
              className="btn primary-btn small-btn"
              onClick={() => navigate("/browse")}
            >
              Browse Coaches
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;