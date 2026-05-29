import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">

        {/* LEFT — Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <span className="pawn-icon">♟️</span>
            <span className="brand-text">ChessMaster Academy</span>
          </Link>

          {/* Phase 1 — Wallet */}
          {user && <Link to="/wallet">Wallet</Link>}

          {/* Navigation tabs */}
          {user && (
            <div className="navbar-tabs">
              <Link className="nav-tab" to="/student/dashboard">Dashboard</Link>
              <Link className="nav-tab" to="/browse">Browse Coaches</Link>
              <Link className="nav-tab" to="/student/bookings">My Bookings</Link>
              <Link className="nav-tab" to="/profile">Profile</Link>
            </div>
          )}
        </div>

        {/* RIGHT — Logout */}
        {user && (
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        )}

      </div>
    </nav>
  );
};

export default Navbar;