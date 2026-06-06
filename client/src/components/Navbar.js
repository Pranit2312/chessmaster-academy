import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          ♟️ Chess Academy
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/courses" className="nav-links">Courses</Link>
          </li>
          
          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <li className="nav-item">
                    <Link to="/student/dashboard" className="nav-links">Dashboard</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/browse-coaches" className="nav-links">Find Coach</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/my-courses" className="nav-links">My Courses</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/my-bookings" className="nav-links">Sessions</Link>
                  </li>
                </>
              )}

              {user.role === 'coach' && (
                <>
                  <li className="nav-item">
                    <Link to="/coach/dashboard" className="nav-links">Dashboard</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/create-course" className="nav-links">Create Course</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/coach/bookings" className="nav-links">Bookings</Link>
                  </li>
                </>
              )}

              <li className="nav-item">
                <Link to="/wallet" className="nav-links">Wallet</Link>
              </li>

              <li className="nav-item">
                <Link to="/profile" className="nav-links">Profile</Link>
              </li>

              <li className="nav-item">
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links btn-signup">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;