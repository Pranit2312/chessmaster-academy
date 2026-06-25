import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingAPI } from '../utils/api';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Bookings.css';

const SESSION_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'current', label: 'Current' },
  { key: 'previous', label: 'Previous' },
];

const CoachBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get('tab') || 'upcoming';
  const activeTab = SESSION_TABS.find(t => t.key === tabParam) ? tabParam : 'upcoming';

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
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

  const now = new Date();

  const { upcoming, current, previous } = useMemo(() => {
    const u = [], c = [], p = [];
    for (const b of bookings) {
      const startTime = b.slot?.startTime ? new Date(b.slot?.startTime) : null;
      if (b.sessionStatus === 'scheduled' && startTime && startTime > now) {
        u.push(b);
      } else if (b.sessionStatus === 'scheduled' && startTime && startTime <= now) {
        c.push(b);
      } else {
        p.push(b);
      }
    }
    return { upcoming: u, current: c, previous: p };
  }, [bookings, now]);

  const filteredBookings = activeTab === 'upcoming' ? upcoming : activeTab === 'current' ? current : previous;

  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bookings-container">
      <header className="bookings-header">
        <h2>My Students</h2>
        <p>Manage your coaching sessions</p>
      </header>

      <div className="bookings-tabs">
        {SESSION_TABS.map(tab => (
          <button
            key={tab.key}
            className={`bookings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
            {tab.key === 'upcoming' && upcoming.length > 0 && (
              <span className="bookings-tab-count">{upcoming.length}</span>
            )}
            {tab.key === 'current' && current.length > 0 && (
              <span className="bookings-tab-count">{current.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bookings-grid">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isCoach={true}
              onCancel={handleCancel}
              onComplete={handleComplete}
            />
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              {activeTab === 'upcoming' ? '📅' : activeTab === 'current' ? '⏳' : '✅'}
            </span>
            <h3>No {activeTab} sessions</h3>
            <p>
              {activeTab === 'upcoming'
                ? 'Upcoming sessions from students will appear here.'
                : activeTab === 'current'
                ? 'Ongoing sessions will appear here.'
                : 'Completed and cancelled sessions will be listed here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachBookings;
