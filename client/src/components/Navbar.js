import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const NAV_ITEMS = [
  { label: 'Courses', path: '/courses', public: true },
  { label: 'Tournaments', path: '/tournaments', auth: true },
  { label: 'Analysis', path: '/analysis', auth: true },
  { label: 'Puzzles', path: '/puzzles', auth: true },
  { label: 'Forum', path: '/forum', auth: true },
];

const STUDENT_ITEMS = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'Find Coach', path: '/browse-coaches' },
  { label: 'My Courses', path: '/my-courses' },
  { label: 'Sessions', path: '/my-bookings' },
];

const COACH_ITEMS = [
  { label: 'Dashboard', path: '/coach/dashboard' },
  { label: 'Create Course', path: '/create-course' },
  { label: 'Bookings', path: '/coach/bookings' },
  { label: 'Create Puzzle', path: '/coach/puzzles/create' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const mobileRef = useRef(null);
  const profileRef = useRef(null);
  const aiRef = useRef(null);
  const sessionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
      if (sessionsRef.current && !sessionsRef.current.contains(e.target)) setSessionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setAiOpen(false);
    setSessionsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">♟</span>
            <span className="brand-text">ChessMaster</span>
          </Link>

          <div className="navbar-links">
            {NAV_ITEMS.map((item) => {
              if (item.auth && !user) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <div className="nav-dropdown-wrapper" ref={sessionsRef}>
                <button
                  className={`nav-link nav-link-sessions ${sessionsOpen ? 'active' : ''}`}
                  onClick={() => setSessionsOpen(!sessionsOpen)}
                >
                  Sessions
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {sessionsOpen && (
                  <div className="nav-dropdown">
                    <Link to={user.role === 'coach' ? '/coach/bookings?tab=upcoming' : '/my-bookings?tab=upcoming'} className="dropdown-item">Upcoming Sessions</Link>
                    <Link to={user.role === 'coach' ? '/coach/bookings?tab=current' : '/my-bookings?tab=current'} className="dropdown-item">Current Sessions</Link>
                    <Link to={user.role === 'coach' ? '/coach/bookings?tab=previous' : '/my-bookings?tab=previous'} className="dropdown-item">Previous Sessions</Link>
                  </div>
                )}
              </div>
            )}
            {user && (
              <div className="nav-dropdown-wrapper" ref={aiRef}>
                <button
                  className={`nav-link nav-link-ai ${aiOpen ? 'active' : ''}`}
                  onClick={() => setAiOpen(!aiOpen)}
                >
                  AI Tools
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {aiOpen && (
                  <div className="nav-dropdown">
                    <Link to="/ai/practice" className="dropdown-item">Practice</Link>
                    <Link to="/ai/coach" className="dropdown-item">AI Coach</Link>
                    <Link to="/ai/openings" className="dropdown-item">Openings</Link>
                    <Link to="/ai/insights" className="dropdown-item">Insights</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="navbar-right">
            {user ? (
              <div className="nav-dropdown-wrapper" ref={profileRef}>
                <button
                  className="nav-user-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="nav-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="nav-username hide-mobile">{user.name}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="nav-dropdown nav-dropdown-right">
                    <Link to="/profile" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Profile
                    </Link>
                    <Link to="/wallet" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                      Wallet
                    </Link>
                    <Link to="/my-games" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      My Games
                    </Link>
                    <Link to="/friends" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Friends
                    </Link>
                    <div className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth">
                <Link to="/login" className="btn btn-ghost nav-auth-btn">Sign In</Link>
                <Link to="/register" className="btn btn-primary nav-auth-btn">Get Started</Link>
              </div>
            )}

            <button
              className={`hamburger ${mobileOpen ? 'active' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-drawer ${mobileOpen ? 'active' : ''}`} ref={mobileRef}>
        <div className="mobile-drawer-header">
          <span className="brand-icon">♟</span>
          <span className="brand-text">ChessMaster</span>
        </div>

        <div className="mobile-drawer-body">
          <div className="mobile-section">
            <div className="mobile-section-title">Navigation</div>
            {NAV_ITEMS.map((item) => {
              if (item.auth && !user) return null;
              return (
                <Link key={item.path} to={item.path} className={`mobile-link ${isActive(item.path) ? 'active' : ''}`}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {user && (
            <>
              {user.role === 'student' && (
                <div className="mobile-section">
                  <div className="mobile-section-title">Student</div>
                  {STUDENT_ITEMS.map((item) => (
                    <Link key={item.path} to={item.path} className={`mobile-link ${isActive(item.path) ? 'active' : ''}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
              {user.role === 'coach' && (
                <div className="mobile-section">
                  <div className="mobile-section-title">Coach</div>
                  {COACH_ITEMS.map((item) => (
                    <Link key={item.path} to={item.path} className={`mobile-link ${isActive(item.path) ? 'active' : ''}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mobile-section">
                <div className="mobile-section-title">Sessions</div>
                <Link to={user.role === 'coach' ? '/coach/bookings?tab=upcoming' : '/my-bookings?tab=upcoming'} className="mobile-link">Upcoming Sessions</Link>
                <Link to={user.role === 'coach' ? '/coach/bookings?tab=current' : '/my-bookings?tab=current'} className="mobile-link">Current Sessions</Link>
                <Link to={user.role === 'coach' ? '/coach/bookings?tab=previous' : '/my-bookings?tab=previous'} className="mobile-link">Previous Sessions</Link>
              </div>

              <div className="mobile-section">
                <div className="mobile-section-title">More</div>
                <Link to="/play" className="mobile-link">Play</Link>
                <Link to="/my-games" className="mobile-link">My Games</Link>
                <Link to="/wallet" className="mobile-link">Wallet</Link>
                <Link to="/profile" className="mobile-link">Profile</Link>
              </div>

              <div className="mobile-section">
                <div className="mobile-section-title">AI Tools</div>
                <Link to="/ai/practice" className="mobile-link">Practice</Link>
                <Link to="/ai/coach" className="mobile-link">AI Coach</Link>
                <Link to="/ai/openings" className="mobile-link">Openings</Link>
                <Link to="/ai/insights" className="mobile-link">Insights</Link>
              </div>
            </>
          )}
        </div>

        <div className="mobile-drawer-footer">
          {user ? (
            <button onClick={handleLogout} className="btn btn-danger btn-block">Sign Out</button>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="btn btn-secondary btn-block">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-block">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
