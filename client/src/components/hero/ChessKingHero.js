import React from 'react';
import { ChessKing } from './ChessIcons';
import './ChessKingHero.css';

const ChessKingHero = ({ title = 'ChessMaster', subtitle = 'Master the game with AI-powered coaching', ctaText = 'Get Started', onCtaClick }) => {
  return (
    <div className="chess-hero">
      <div className="chess-hero-content">
        <div className="hero-text-section">
          <div className="hero-badge">Premium Chess Training</div>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>
          <div className="hero-actions">
            <button className="hero-cta" onClick={onCtaClick}>
              {ctaText}
              <span className="hero-cta-arrow">&rarr;</span>
            </button>
            <button className="hero-secondary-btn">Learn More</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">10K+</span>
              <span className="hero-stat-label">Active Students</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">50K+</span>
              <span className="hero-stat-label">Puzzles Solved</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">500+</span>
              <span className="hero-stat-label">GM Courses</span>
            </div>
          </div>
        </div>
        <div className="hero-visual-section">
          <div className="king-glow-container">
            <div className="king-ambient-glow" />
            <div className="king-orb" />
            <div className="king-orb-2" />
            <div className="king-wrapper">
              <ChessKing size={280} className="hero-king-svg" />
            </div>
            <div className="king-particle-ring">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="ring-particle"
                  style={{
                    '--angle': `${i * 30}deg`,
                    '--delay': `${i * 0.15}s`,
                    '--size': `${4 + Math.random() * 4}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessKingHero;
