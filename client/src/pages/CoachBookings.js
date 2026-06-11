import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../utils/api';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Bookings.css';

const CoachBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await bookingAPI.getCoachBookings();
      setBookings(data?.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await bookingAPI.updateBookingStatus(bookingId, {
        sessionStatus: 'completed'
      });
      fetchBookings();
    } catch (error) {
      alert('Failed to update booking status');
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(bookingId, {
          cancellationReason: 'Coach cancelled'
        });
        fetchBookings();
      } catch (error) {
        alert('Failed to cancel booking');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bookings-container">
      <h2>My Students</h2>
      <p>Manage your coaching sessions</p>

      {bookings.length > 0 ? (
        <div className="booking-list">
          {bookings.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isCoach={true}
              onCancel={handleCancel}
              onComplete={handleComplete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No bookings yet</p>
        </div>
      )}
    </div>
  );
};

export default CoachBookings;