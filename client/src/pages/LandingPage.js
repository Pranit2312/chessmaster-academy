import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Trusted by 10,000+ chess students
          </div>
          <h1>Master Chess with <span>World-Class</span> Coaches</h1>
          <p>
            Connect with experienced FIDE-rated coaches from around the world.
            Learn, improve, and dominate the board with personalized coaching.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Start Learning Free</Link>
            <Link to="/login" className="btn btn-outline">Sign In</Link>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <div className="metrics-strip">
        <div className="metric-item">
          <div className="metric-value">10K+</div>
          <div className="metric-label">Active Students</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">500+</div>
          <div className="metric-label">Expert Coaches</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">50K+</div>
          <div className="metric-label">Coaching Sessions</div>
        </div>
        <div className="metric-item">
          <div className="metric-value">4.9</div>
          <div className="metric-label">Average Rating</div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section">
        <div className="features-header">
          <h2>Everything you need to improve</h2>
          <p>World-class coaching tools and resources to take your chess to the next level.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">♟</div>
            <h3>Expert Coaches</h3>
            <p>Learn from FIDE-rated coaches and chess masters from around the world.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Platform</h3>
            <p>Connect with coaches and students across the world, anytime, anywhere.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Secure Payments</h3>
            <p>Safe and secure payment processing with industry-leading providers.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Flexible Scheduling</h3>
            <p>Book sessions at times that work for you, across all time zones.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📹</div>
            <h3>Online Sessions</h3>
            <p>Join through Zoom and Google Meet with integrated scheduling.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Verified Reviews</h3>
            <p>Read real student reviews and choose your coach with confidence.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Elevate Your Chess Game?</h2>
        <p>Join thousands of students learning from top-tier chess coaches worldwide.</p>
        <Link to="/register" className="btn">
          Start Learning Today
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
