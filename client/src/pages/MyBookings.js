import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../utils/api';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Bookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await bookingAPI.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bookings-container">
      <header className="bookings-header">
        <h2>📅 My Bookings</h2>
        <p>Manage your coaching sessions</p>
      </header>

      <div className="bookings-grid">
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <BookingCard 
              key={booking._id} 
              booking={booking} 
              isCoach={false} 
              onCancel={fetchBookings}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;