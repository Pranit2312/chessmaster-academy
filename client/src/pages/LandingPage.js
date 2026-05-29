import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Master Chess with World-Class Coaches</h1>
          <p>
            Connect with experienced chess coaches from around the world.
            Learn, improve, and dominate the board.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">Get Started</Link>
            <Link to="/login" className="btn btn-secondary btn-large">Sign In</Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <h2>Why Choose ChessMaster Academy?</h2>

        <div className="features-grid">

          <div className="feature-card">
            <span className="feature-icon">♟️</span>
            <h3>Expert Coaches</h3>
            <p>Learn from FIDE-rated coaches and chess masters worldwide</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🌍</span>
            <h3>Global Platform</h3>
            <p>Connect with coaches and students across the world</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">💳</span>
            <h3>Secure Payments</h3>
            <p>Safe and secure payment processing with Razorpay</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⏰</span>
            <h3>Flexible Scheduling</h3>
            <p>Book sessions at convenient times</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📹</span>
            <h3>Online Sessions</h3>
            <p>Join through Zoom and Google Meet</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⭐</span>
            <h3>Verified Reviews</h3>
            <p>Read real student reviews and choose confidently</p>
          </div>

        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <h2>Ready to Elevate Your Chess Game?</h2>
        <p>Join thousands of students learning from top-tier chess coaches.</p>
        <Link to="/register" className="btn btn-primary btn-large">
          Start Learning Today
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;