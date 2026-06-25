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

const MyBookings = () => {
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
      const { data } = await bookingAPI.getMyBookings();
      const list = data?.bookings || [];
      setBookings(list);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
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
        <h2>My Sessions</h2>
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
          </button>
        ))}
      </div>

      <div className="bookings-grid">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isCoach={false}
              onCancel={fetchBookings}
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
                ? 'Book a coaching session to see it here.'
                : activeTab === 'current'
                ? 'Your ongoing sessions will appear here.'
                : 'Completed and cancelled sessions will be listed here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
