import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { slotAPI, bookingAPI } from '../utils/api';
import SlotCard from '../components/SlotCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from "../components/Modal";
import '../styles/Dashboard.css';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    slotId: null,
    startTime: "",
    duration: 60,
    price: 0,
    meetingLink: "",
    meetingPlatform: "Zoom",
    notes: ""
  });

  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        slotAPI.getMySlots({ page: 1, limit: 10 }),
        bookingAPI.getCoachBookings()
      ]);

      setSlots(slotsRes.data.slots);

      const uniqueBookings = Array.from(
        new Map(
          bookingsRes.data.bookings.map(b => [b.slot?._id, b])
        ).values()
      );

      setUpcomingBookings(
        uniqueBookings
          .filter((b) => b.sessionStatus === "scheduled")
          .slice(0, 5)
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 👉 CREATE OR UPDATE SLOT
  const handleCreateOrUpdateSlot = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const startTime = new Date(formData.startTime + ":00");
      const endTime = new Date(startTime.getTime() + formData.duration * 60000);

      const slotData = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        price: Number(formData.price),
        duration: Number(formData.duration),
        meetingLink: formData.meetingLink,
        meetingPlatform: formData.meetingPlatform,
        notes: formData.notes,
      };

      if (formData.slotId) {
        // UPDATE SLOT
        await slotAPI.updateSlot(formData.slotId, slotData);
      } else {
        // CREATE SLOT
        await slotAPI.createSlot(slotData);
      }

      // Reset & Refresh
      setShowSlotForm(false);
      setFormData({
        slotId: null,
        startTime: '',
        duration: 60,
        price: 0,
        meetingLink: '',
        meetingPlatform: 'Zoom',
        notes: ''
      });

      fetchDashboardData();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to save slot");
    }
  };

  // 👉 DELETE SLOT
  const handleDeleteSlot = async (slotId) => {
    if (window.confirm("Are you sure you want to delete this slot?")) {
      try {
        await slotAPI.deleteSlot(slotId);
        fetchDashboardData();
      } catch {
        alert("Failed to delete slot");
      }
    }
  };

  // 👉 EDIT SLOT
  const handleEditSlot = (slot) => {
    setShowSlotForm(true);

    setFormData({
      slotId: slot._id,
      startTime: slot.startTime.slice(0, 16), // correct format for datetime-local
      duration: slot.duration,
      price: slot.price,
      meetingLink: slot.meetingLink,
      meetingPlatform: slot.meetingPlatform,
      notes: slot.notes || "",
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h2>Coach Dashboard</h2>
          <p>Manage your coaching sessions</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              slotId: null,
              startTime: "",
              duration: 60,
              price: 0,
              meetingLink: "",
              meetingPlatform: "Zoom",
              notes: ""
            });
            setShowSlotForm(true);
          }}
          className="btn btn-primary"
        >
          + Create New Slot
        </button>
      </header>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="emoji">⭐</span>
          <h3>{user?.chessRating}</h3>
          <p>Your Rating</p>
        </div>

        <div className="stat-card">
          <span className="emoji">📚</span>
          <h3>{user?.totalSessions || 0}</h3>
          <p>Sessions Completed</p>
        </div>

        <div className="stat-card">
          <span className="emoji">💰</span>
          <h3>₹{user?.hourlyRate}</h3>
          <p>Avg Hourly Rate</p>
        </div>

        <div className="stat-card">
          <span className="emoji">⭐</span>
          <h3>{user?.averageRating?.toFixed(1) || "N/A"}</h3>
          <p>Average Rating</p>
        </div>
      </div>

      {/* SLOT CREATE / UPDATE MODAL */}
      <Modal open={showSlotForm} onClose={() => setShowSlotForm(false)}>
        <h2>{formData.slotId ? "Edit Slot" : "Create New Time Slot"}</h2>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleCreateOrUpdateSlot} className="slot-form">
          <label>Start Date & Time *</label>
          <input
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />

          <label>Duration *</label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>

          <label>Price (₹) *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <label>Meeting Platform *</label>
          <select
            name="meetingPlatform"
            value={formData.meetingPlatform}
            onChange={handleChange}
          >
            <option>Zoom</option>
            <option>Google Meet</option>
            <option>Microsoft Teams</option>
            <option>Other</option>
          </select>

          <label>Meeting Link *</label>
          <input
            name="meetingLink"
            value={formData.meetingLink}
            onChange={handleChange}
            required
          />

          <label>Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />

          <button className="btn btn-primary" type="submit">
            {formData.slotId ? "Update Slot" : "Create Slot"}
          </button>
        </form>
      </Modal>

      {/* UPCOMING BOOKINGS */}
      {upcomingBookings.length > 0 && (
        <section className="dashboard-section">
          <h3>Upcoming Sessions</h3>

          <div className="booking-list">
            {upcomingBookings.map((booking) => (
              <div key={booking._id} className="booking-item">
                <strong>{booking.student?.name}</strong>
                <small>{new Date(booking.slot?.startTime).toLocaleString()}</small>
                <span className="badge badge-info">Scheduled</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SLOT LIST */}
      <section className="dashboard-section">
        <h3>My Time Slots</h3>

        {slots.length > 0 ? (
          <div className="slot-grid">
            {slots.map((slot) => (
              <SlotCard
                key={slot._id}
                slot={slot}
                isCoach={true}
                onEdit={() => handleEditSlot(slot)}
                onDelete={() => handleDeleteSlot(slot._id)}
              />
            ))}
          </div>
        ) : (
          <p>No slots created yet. Create your first slot to start teaching!</p>
        )}
      </section>
    </div>
  );
};

export default CoachDashboard;