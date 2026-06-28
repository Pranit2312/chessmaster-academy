import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './TopNavigation.css';

const TopNavigation = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: 'Tournament starting in 10 minutes', time: '10m ago', unread: true },
    { id: 2, message: 'Your puzzle streak reached 10!', time: '1h ago', unread: true },
    { id: 3, message: 'New course available: Endgame Mastery', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="top-navigation">
      <div className="nav-left">
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-actions">
          <button 
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notifications</h4>
                <button className="mark-read-btn">Mark all as read</button>
              </div>
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                    <div className="notification-content">
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    {notification.unread && <div className="notification-dot" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
