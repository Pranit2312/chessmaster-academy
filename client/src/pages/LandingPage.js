import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChessKingHero, AnimatedBackground, ParticleField } from '../components/hero';
import '../styles/LandingPage.css';

const AnimatedCounter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let current = 0;
    const duration = 1500;
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      current = Math.floor(eased * target);
      el.textContent = current + suffix;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, suffix]);
  return <span ref={ref}>0</span>;
};

const LandingPage = () => {
  return (
    <div className="landing-page">
      <AnimatedBackground />
      <ParticleField count={50} color="37, 99, 235" />

      <ChessKingHero
        title="Master Chess with AI-Powered Coaching"
        subtitle="Connect with FIDE-rated coaches, solve thousands of tactical puzzles, and dominate the board with personalized training."
        ctaText="Start Learning Free"
        onCtaClick={() => window.location.href = '/register'}
      />

      <div className="metrics-strip">
        <div className="metric-item fade-in-up">
          <div className="metric-value">
            <AnimatedCounter target={10} suffix="K+" />
          </div>
          <div className="metric-label">Active Students</div>
        </div>
        <div className="metric-item fade-in-up" style={{animationDelay: '0.1s'}}>
          <div className="metric-value">
            <AnimatedCounter target={500} suffix="+" />
          </div>
          <div className="metric-label">Expert Coaches</div>
        </div>
        <div className="metric-item fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="metric-value">
            <AnimatedCounter target={50} suffix="K+" />
          </div>
          <div className="metric-label">Coaching Sessions</div>
        </div>
        <div className="metric-item fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="metric-value">4.9</div>
          <div className="metric-label">Average Rating</div>
        </div>
      </div>

      <section className="features-section">
        <div className="features-header fade-in-up">
          <div className="section-badge">Features</div>
          <h2>Everything you need to improve</h2>
          <p>World-class coaching tools and resources to take your chess to the next level.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card card fade-in-up" style={{animationDelay: '0s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 45 45"><path d="M22.5 11.63V6M20 8h5" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="currentColor"/><path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="currentColor"/></svg>
            </div>
            <h3>Expert Coaches</h3>
            <p>Learn from FIDE-rated coaches and chess masters from around the world.</p>
          </div>
          <div className="feature-card card fade-in-up" style={{animationDelay: '0.05s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            </div>
            <h3>Global Platform</h3>
            <p>Connect with coaches and students across the world, anytime, anywhere.</p>
          </div>
          <div className="feature-card card fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <h3>Secure Payments</h3>
            <p>Safe and secure payment processing with industry-leading providers.</p>
          </div>
          <div className="feature-card card fade-in-up" style={{animationDelay: '0.15s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Flexible Scheduling</h3>
            <p>Book sessions at times that work for you, across all time zones.</p>
          </div>
          <div className="feature-card card fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <h3>Online Sessions</h3>
            <p>Join through Zoom and Google Meet with integrated scheduling.</p>
          </div>
          <div className="feature-card card fade-in-up" style={{animationDelay: '0.25s'}}>
            <div className="feature-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h3>Verified Reviews</h3>
            <p>Read real student reviews and choose your coach with confidence.</p>
          </div>
        </div>
      </section>

      <section className="cta-section fade-in-up">
        <div className="cta-card">
          <h2>Ready to Elevate Your Chess Game?</h2>
          <p>Join thousands of students learning from top-tier chess coaches worldwide.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Learning Today
            <span style={{marginLeft: 8}}>&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
