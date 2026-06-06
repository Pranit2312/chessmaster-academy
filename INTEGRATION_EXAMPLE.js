/**
 * INTEGRATION EXAMPLE: How to Add Daily Class Creation to Coach Dashboard
 * 
 * File: client/src/pages/CoachDashboard.js
 * This shows how to integrate the DailyClassCreation component
 */

import React, { useState, useEffect } from 'react';
import DailyClassCreation from '../components/DailyClassCreation';
import { useAuth } from '../hooks/useAuth';
import '../styles/CoachDashboard.css';

/**
 * Coach Dashboard - Main interface for coaches
 * Includes:
 * - Dashboard overview
 * - Daily class creation
 * - Earnings & bookings summary
 * - Student reviews
 */
function CoachDashboard() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data on mount
  useEffect(() => {
    if (user && user._id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Example: Fetch coach's earnings, bookings, etc.
      // const response = await axios.get('/api/coaches/dashboard', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setDashboardData(response.data);
      
      // For now, set mock data
      setDashboardData({
        totalEarnings: 5400,
        weeklyBookings: 12,
        studentReviews: 4.8,
        totalSessions: 156
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (!user || user.role !== 'coach') {
    return (
      <div className="coach-dashboard-container">
        <div className="access-denied">
          <h2>⚠️ Access Denied</h2>
          <p>This page is only available for coaches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-dashboard-container">
      {/* Header Section */}
      <div className="coach-header">
        <h1>👨‍🏫 Coach Dashboard</h1>
        <p>Welcome back, {user.firstName}! Manage your classes and bookings here.</p>
      </div>

      {/* Quick Stats */}
      {dashboardData && (
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Total Earnings</span>
              <span className="stat-value">${dashboardData.totalEarnings}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <span className="stat-label">Weekly Bookings</span>
              <span className="stat-value">{dashboardData.weeklyBookings}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <span className="stat-label">Average Rating</span>
              <span className="stat-value">{dashboardData.studentReviews}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-label">Total Sessions</span>
              <span className="stat-value">{dashboardData.totalSessions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          📅 Daily Classes
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Bookings
        </button>
        <button
          className={`tab-button ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          💸 Earnings
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <h2>Dashboard Overview</h2>
            <div className="overview-grid">
              <div className="overview-section">
                <h3>Quick Links</h3>
                <div className="quick-links">
                  <a href="#" className="quick-link">
                    📅 Create Daily Classes
                  </a>
                  <a href="#" className="quick-link">
                    📊 View Earnings
                  </a>
                  <a href="#" className="quick-link">
                    ⭐ Read Reviews
                  </a>
                  <a href="#" className="quick-link">
                    ⚙️ Edit Profile
                  </a>
                </div>
              </div>
              <div className="overview-section">
                <h3>Recent Activity</h3>
                <ul className="activity-list">
                  <li>✅ 3 new bookings for this week</li>
                  <li>⭐ Got a 5-star review from Sarah</li>
                  <li>💰 Earned $450 this week</li>
                  <li>📅 10 slots available for next week</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Daily Classes Tab - MAIN INTEGRATION POINT */}
        {activeTab === 'classes' && (
          <div className="tab-pane">
            {/* ===================================== */}
            {/* DAILY CLASS CREATION COMPONENT HERE */}
            {/* ===================================== */}
            <DailyClassCreation coachId={user._id} />
            
            {/* Optional: Additional instructions or information */}
            <div className="classes-info">
              <h3>📌 How to Use Daily Classes</h3>
              <ol>
                <li>Select a date for which you want to create classes</li>
                <li>Choose the time slots you're available</li>
                <li>Click "Create Slots" to make them available for booking</li>
                <li>Students will see your available slots and can book them</li>
                <li>You'll receive a notification when a student books a slot</li>
              </ol>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="tab-pane">
            <h2>My Bookings</h2>
            <div className="bookings-container">
              <p>Your upcoming bookings will appear here...</p>
              {/* Add bookings list component here */}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="tab-pane">
            <h2>Earnings & Payments</h2>
            <div className="earnings-container">
              <p>Your earnings summary will appear here...</p>
              {/* Add earnings chart component here */}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>
          💡 <strong>Tip:</strong> Create your daily slots at the beginning of each week to maximize bookings!
        </p>
      </div>
    </div>
  );
}

export default CoachDashboard;


/**
 * ========================================
 * MINIMAL CSS STYLES (Add to CoachDashboard.css)
 * ========================================
 */

/*
.coach-dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.coach-header {
  text-align: center;
  margin-bottom: 2rem;
}

.coach-header h1 {
  font-size: 2.5rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.coach-header p {
  font-size: 1.1rem;
  color: #4a5568;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.dashboard-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #2d3748;
}

.tab-button.active {
  color: #3182ce;
  border-bottom-color: #3182ce;
}

.dashboard-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;
}

.overview-section h3 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-link {
  padding: 0.75rem 1rem;
  background: #f7fafc;
  border-radius: 6px;
  text-decoration: none;
  color: #3182ce;
  transition: all 0.2s;
}

.quick-link:hover {
  background: #e6fffa;
  transform: translateX(4px);
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.activity-list li:last-child {
  border-bottom: none;
}

.classes-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0fff4;
  border-radius: 6px;
  border-left: 4px solid #48bb78;
}

.classes-info h3 {
  color: #22543d;
  margin-bottom: 1rem;
}

.classes-info ol {
  color: #22543d;
  line-height: 1.8;
  padding-left: 1.5rem;
}

.dashboard-footer {
  margin-top: 2rem;
  padding: 1rem;
  background: #edf2f7;
  border-radius: 6px;
  text-align: center;
  color: #2d3748;
}

.access-denied {
  text-align: center;
  padding: 3rem;
  background: #fed7d7;
  border-radius: 8px;
  color: #742a2a;
}

@media (max-width: 768px) {
  .coach-dashboard-container {
    padding: 1rem;
  }

  .coach-header h1 {
    font-size: 1.75rem;
  }

  .quick-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .dashboard-tabs {
    flex-wrap: wrap;
  }

  .dashboard-content {
    padding: 1rem;
  }
}
*/

/**
 * ========================================
 * USAGE INSTRUCTIONS
 * ========================================
 * 
 * 1. Copy this file structure to CoachDashboard.js
 * 2. Import DailyClassCreation component
 * 3. Add it to the 'classes' tab (as shown above)
 * 4. Copy the CSS styles to CoachDashboard.css
 * 5. Test by navigating to Coach Dashboard
 * 6. Click on "Daily Classes" tab
 * 7. Create slots and verify they appear
 * 
 * The DailyClassCreation component handles:
 * - All slot creation logic
 * - Backend API calls
 * - UI interactions
 * - Error handling
 * - Success notifications
 * 
 * You just need to import it and include it!
 */
