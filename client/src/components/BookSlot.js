import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/BookSlot.css';

/**
 * BookSlot Component
 * Allows students to book available coaching slots
 */
function BookSlot({ slotId, coachId, onBookingSuccess }) {
  const [slot, setSlot] = useState(null);
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookedSession, setBookedSession] = useState(null);

  useEffect(() => {
    fetchSlotDetails();
    fetchCoachDetails();
  }, [slotId, coachId]);

  const fetchSlotDetails = async () => {
    try {
      // Fetch slot from your API or pass as prop
      setLoading(false);
    } catch (err) {
      setError('Failed to load slot details');
      setLoading(false);
    }
  };

  const fetchCoachDetails = async () => {
    try {
      const response = await axios.get(`/api/users/${coachId}`);
      setCoach(response.data.user);
    } catch (err) {
      console.error('Error fetching coach:', err);
    }
  };

  const handleBookSlot = async () => {
    try {
      setBooking(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        '/api/sessions/book',
        {
          slotId,
          notes,
          skillLevel
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setSuccess('✅ Session booked successfully!');
        setBookedSession(response.data.booking);
        setNotes('');
        setSkillLevel('intermediate');
        
        setTimeout(() => {
          if (onBookingSuccess) {
            onBookingSuccess(response.data.booking);
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="book-slot-loading">Loading slot details...</div>;
  }

  return (
    <div className="book-slot-container">
      <div className="book-slot-header">
        <h3>📅 Book Coaching Session</h3>
        {coach && <p>with {coach.firstName} {coach.lastName}</p>}
      </div>

      {error && <div className="book-slot-error">{error}</div>}
      {success && <div className="book-slot-success">{success}</div>}

      <div className="book-slot-content">
        {/* Slot Details */}
        <div className="slot-info-box">
          <h4>Session Details</h4>
          <div className="slot-detail">
            <span className="label">Date:</span>
            <span className="value">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="slot-detail">
            <span className="label">Time:</span>
            <span className="value">Session Time</span>
          </div>
          <div className="slot-detail">
            <span className="label">Duration:</span>
            <span className="value">60 minutes</span>
          </div>
          <div className="slot-detail">
            <span className="label">Price:</span>
            <span className="value price">₹500</span>
          </div>
        </div>

        {/* Coach Info */}
        {coach && (
          <div className="coach-info-box">
            <h4>Coach Information</h4>
            <div className="coach-details">
              {coach.profilePicture && (
                <img src={coach.profilePicture} alt={coach.firstName} />
              )}
              <div>
                <p><strong>{coach.firstName} {coach.lastName}</strong></p>
                <p>Rating: ⭐ {coach.ratingAverage || 4.8}</p>
                {coach.title && <p>{coach.title}</p>}
                {coach.specialization && <p>Specialization: {coach.specialization}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <div className="booking-form">
          <div className="form-group">
            <label htmlFor="skillLevel">Your Skill Level</label>
            <select
              id="skillLevel"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focus on openings, middlegame strategy, etc."
              rows="3"
            />
          </div>

          <button
            className="book-button"
            onClick={handleBookSlot}
            disabled={booking}
          >
            {booking ? '⏳ Booking...' : '✅ Book Session'}
          </button>
        </div>

        {/* Booking Confirmation with Meeting Details */}
        {bookedSession && (
          <div className="booking-confirmation">
            <div className="confirmation-header">✅ Session Confirmed!</div>
            <div className="confirmation-details">
              <p><strong>Session ID:</strong> {bookedSession._id.substring(0, 8)}...</p>
              <p><strong>Coach:</strong> {coach?.firstName} {coach?.lastName}</p>
              <p><strong>Status:</strong> Awaiting coach to generate Zoom link</p>
            </div>
            <div className="confirmation-note">
              <p>🎥 <strong>Your coach will generate the Zoom meeting link shortly.</strong></p>
              <p>You'll receive the meeting details via email once the link is ready.</p>
              <p>Check back here or your email for the Zoom meeting link.</p>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="booking-terms">
          <p>✅ Payment will be deducted from your wallet</p>
          <p>📧 You'll receive confirmation via email</p>
          <p>🔗 Meeting link will be provided by coach</p>
          <p>💰 Cancellation allowed up to 24 hours before session</p>
        </div>
      </div>
    </div>
  );
}

export default BookSlot;
