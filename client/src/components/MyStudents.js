import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MyStudents.css';

/**
 * MyStudents Component
 * Shows coaches all their booked sessions and student management
 */
function MyStudents() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('confirmed');
  const [selectedSession, setSelectedSession] = useState(null);
  const [updateModal, setUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCoachSessions();
  }, [filter]);

  const fetchCoachSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sessions/my-sessions', {
        params: { status: filter !== 'all' ? filter : undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      const response = await axios.put(
        `/api/sessions/${sessionId}/complete`,
        { notes: notes || '' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setSuccess('✅ Session marked as completed');
        setUpdateModal(false);
        setNotes('');
        setTimeout(() => fetchCoachSessions(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update session');
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;

    try {
      const response = await axios.put(
        `/api/sessions/${sessionId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setSuccess('✅ Session cancelled and refunded');
        setTimeout(() => fetchCoachSessions(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel session');
    }
  };

  const handleGenerateZoomLink = async (sessionId) => {
    try {
      setError('');
      const response = await axios.post(
        `/api/sessions/${sessionId}/generate-zoom`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setSuccess('🎥 Zoom meeting link generated!');
        // Update session with new link
        setSessions(sessions.map(s => 
          s._id === sessionId 
            ? { ...s, meetingLink: response.data.meeting.meetingLink, meetingPassword: response.data.meeting.meetingPassword }
            : s
        ));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate Zoom link');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { bg: '#d4edda', color: '#155724', label: '✅ Confirmed' },
      completed: { bg: '#cfe2ff', color: '#084298', label: '✓ Completed' },
      cancelled: { bg: '#f8d7da', color: '#842029', label: '✗ Cancelled' },
      pending: { bg: '#fff3cd', color: '#664d03', label: '⏳ Pending' }
    };

    const badge = badges[status] || badges.pending;
    return <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
      {badge.label}
    </span>;
  };

  if (loading) {
    return <div className="my-students-loading">Loading sessions...</div>;
  }

  return (
    <div className="my-students-container">
      <div className="students-header">
        <h2>👨‍🎓 My Students</h2>
        <p>Manage your coaching sessions</p>
      </div>

      {error && <div className="students-error">{error}</div>}
      {success && <div className="students-success">{success}</div>}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed ({sessions.filter(s => s.status === 'confirmed').length})
        </button>
        <button
          className={`tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({sessions.filter(s => s.status === 'completed').length})
        </button>
        <button
          className={`tab ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({sessions.filter(s => s.status === 'cancelled').length})
        </button>
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Sessions ({sessions.length})
        </button>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>📭 No sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session._id} className="session-card">
              <div className="session-header">
                <div className="student-info">
                  {session.studentId?.profilePicture && (
                    <img
                      src={session.studentId.profilePicture}
                      alt={session.studentId?.firstName}
                      className="student-avatar"
                    />
                  )}
                  <div>
                    <h4>{session.studentId?.firstName} {session.studentId?.lastName}</h4>
                    <p className="chess-rating">
                      Rating: {session.studentId?.chessRating || 'N/A'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="session-details">
                <div className="detail-row">
                  <span className="label">📅 Date:</span>
                  <span className="value">{formatDate(session.sessionDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">⏰ Time:</span>
                  <span className="value">
                    {formatTime(session.startTime)} ({session.duration} min)
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">💰 Amount:</span>
                  <span className="value">₹{session.price}</span>
                </div>
                {session.skillLevel && (
                  <div className="detail-row">
                    <span className="label">📊 Level:</span>
                    <span className="value">{session.skillLevel}</span>
                  </div>
                )}
                {session.meetingLink && (
                  <div className="detail-row">
                    <span className="label">🔗 Platform:</span>
                    <span className="value">{session.meetingPlatform}</span>
                  </div>
                )}
              </div>

              {/* Zoom Meeting Link */}
              {session.status === 'confirmed' && session.meetingLink && (
                <div className="zoom-meeting-box">
                  <div className="meeting-info">
                    <strong>🎥 Zoom Meeting Ready</strong>
                    <p>Meeting ID: {session.meetingLink.split('/').pop().substring(0, 20)}</p>
                    {session.meetingPassword && <p>Password: {session.meetingPassword}</p>}
                  </div>
                  <a 
                    href={session.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-join-zoom"
                  >
                    🎥 Join Zoom
                  </a>
                </div>
              )}

              {/* Actions */}
              {session.status === 'confirmed' && (
                <div className="session-actions">
                  {!session.meetingLink && (
                    <button
                      className="btn-generate-zoom"
                      onClick={() => handleGenerateZoomLink(session._id)}
                    >
                      📹 Generate Zoom Link
                    </button>
                  )}
                  <button
                    className="btn-complete"
                    onClick={() => {
                      setSelectedSession(session._id);
                      setUpdateModal(true);
                    }}
                  >
                    ✓ Mark Complete
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelSession(session._id)}
                  >
                    ✗ Cancel
                  </button>
                </div>
              )}

              {session.coachNotes && (
                <div className="coach-notes">
                  <strong>📝 Notes:</strong> {session.coachNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Complete Session Modal */}
      {updateModal && (
        <div className="modal-overlay" onClick={() => setUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Mark Session as Completed</h3>

            <div className="form-group">
              <label htmlFor="notes">Session Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the session, topics covered, etc."
                rows="4"
              />
            </div>

            <div className="modal-buttons">
              <button
                className="btn-save"
                onClick={() => handleCompleteSession(selectedSession)}
              >
                ✓ Complete Session
              </button>
              <button
                className="btn-cancel-modal"
                onClick={() => setUpdateModal(false)}
              >
                ✗ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyStudents;
