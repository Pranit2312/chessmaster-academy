import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage = () => {
  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>About ChessMaster Academy</h1>
        <p>Empowering chess players worldwide through expert coaching and cutting-edge technology</p>
      </div>

      <div className="static-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            ChessMaster Academy was founded with a singular mission: to make world-class chess coaching 
            accessible to every player, regardless of their location or skill level. We believe that 
            structured guidance from experienced coaches is the fastest path to improvement, and we've 
            built a platform that connects students with the best instructors in the game.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Coaching Philosophy</h2>
          <div className="about-grid">
            <div className="about-card">
              <h3>Personalized Learning</h3>
              <p>Every player has unique strengths and weaknesses. Our coaches create customized training 
              plans that target your specific areas for improvement, whether it's opening repertoire, 
              tactical vision, endgame technique, or positional understanding.</p>
            </div>
            <div className="about-card">
              <h3>Structured Progression</h3>
              <p>We follow a proven progression system that takes players from fundamentals to advanced 
              concepts. Each session builds on the previous one, ensuring steady and measurable improvement.</p>
            </div>
            <div className="about-card">
              <h3>Practical Application</h3>
              <p>Knowledge without practice is quickly forgotten. Our coaches emphasize practical exercises, 
              game analysis, and real-time feedback to cement concepts and develop intuition.</p>
            </div>
            <div className="about-card">
              <h3>Technology-Enhanced</h3>
              <p>We leverage engines like Stockfish for deep analysis, puzzle databases for tactical training, 
              and interactive tools to accelerate learning. Technology amplifies the effectiveness of every session.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Why Online Coaching Works</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <strong>Flexible Scheduling</strong>
              <p>Book sessions at times that work for you. No commuting, no fixed schedules.</p>
            </div>
            <div className="benefit-item">
              <strong>Global Access</strong>
              <p>Learn from top coaches regardless of your location. Our instructors span multiple continents and time zones.</p>
            </div>
            <div className="benefit-item">
              <strong>Recorded Sessions</strong>
              <p>Every session is recorded, building a library of lessons you can review anytime.</p>
            </div>
            <div className="benefit-item">
              <strong>Tool Integration</strong>
              <p>Built-in analysis boards, puzzle trainers, and opening explorers make every lesson interactive and engaging.</p>
            </div>
            <div className="benefit-item">
              <strong>Affordable Options</strong>
              <p>Choose from coaches at various price points. Quality coaching doesn't have to break the bank.</p>
            </div>
            <div className="benefit-item">
              <strong>Measurable Progress</strong>
              <p>Track your rating, puzzle performance, and accuracy over time with detailed analytics.</p>
            </div>
          </div>
        </section>

        <section className="about-section about-stats">
          <h2>By the Numbers</h2>
          <div className="stats-row">
            <div className="stat-block">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Active Students</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">500+</span>
              <span className="stat-label">Expert Coaches</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">50,000+</span>
              <span className="stat-label">Sessions Completed</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">2.5M+</span>
              <span className="stat-label">Tactics Puzzles</span>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Ready to Improve?</h2>
          <p>Join thousands of players who have transformed their game through structured coaching.</p>
          <div className="about-cta">
            <Link to="/register" className="btn btn-primary">Get Started Free</Link>
            <Link to="/browse-coaches" className="btn btn-outline">Find a Coach</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
