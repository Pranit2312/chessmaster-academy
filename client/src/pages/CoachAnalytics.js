import React, { useState, useEffect } from 'react';
import { walletAPI, bookingAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

export default function CoachAnalytics() {
  const [earnings, setEarnings] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      walletAPI.getCoachEarnings().catch(() => null),
      bookingAPI.getCoachBookings().catch(() => null)
    ]).then(([eRes, bRes]) => {
      setEarnings(eRes?.data);
      setBookings(bRes?.data?.bookings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="tournaments-page"><p>Loading...</p></div>;

  const totalSessions = bookings.length;
  const completedSessions = bookings.filter(b => b.sessionStatus === 'completed').length;
  const totalEarnings = earnings?.totalEarnings || earnings?.total || 0;

  return (
    <div className="tournaments-page">
      <h1>Coach Analytics</h1>
      <div className="tp-stats-row">
        <div className="tp-stat"><span className="tp-stat-num">{totalSessions}</span> Total Sessions</div>
        <div className="tp-stat"><span className="tp-stat-num">{completedSessions}</span> Completed</div>
        <div className="tp-stat"><span className="tp-stat-num">₹{totalEarnings.toLocaleString()}</span> Total Earnings</div>
      </div>
    </div>
  );
}
