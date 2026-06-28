import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  const navItems = [
    { icon: '📊', label: 'Dashboard', path: user?.role === 'coach' ? '/coach/dashboard' : '/student/dashboard' },
    { icon: '🧩', label: 'Puzzles', path: '/puzzles' },
    { icon: '🏆', label: 'Tournaments', path: '/tournaments' },
    { icon: '📚', label: 'Courses', path: '/courses' },
    { icon: '🔍', label: 'Analysis', path: '/analysis' },
    { icon: '💬', label: 'Forum', path: '/forum' },
    { icon: '📈', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">♟</span>
          <div className="logo-text">
            <span className="logo-title">ChessMaster</span>
            <span className="logo-tagline">Learn. Practice. Master.</span>
          </div>
        </div>
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-rating">{user?.chessRating || 1200}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
