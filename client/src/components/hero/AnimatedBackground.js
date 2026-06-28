import React from 'react';
import { ChessQueen, ChessRook, ChessKnight, ChessBishop, ChessPawn, ChessBoard } from './ChessIcons';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="hero-bg">
      <div className="hero-bg-gradient" />
      <div className="hero-bg-grid" />
      <div className="hero-bg-waves">
        <svg className="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.03)" />
              <stop offset="50%" stopColor="rgba(6,182,212,0.05)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.03)" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.02)" />
              <stop offset="50%" stopColor="rgba(37,99,235,0.04)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
            </linearGradient>
          </defs>
          <path className="wave-path wave-1" fill="url(#waveGrad1)"
            d="M0,96L48,117.3C96,139,192,181,288,176C384,171,480,117,576,101.3C672,85,768,107,864,138.7C960,171,1056,213,1152,208C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          <path className="wave-path wave-2" fill="url(#waveGrad2)"
            d="M0,160L48,181.3C96,203,192,245,288,224C384,203,480,117,576,106.7C672,96,768,160,864,176C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>
      <div className="hero-light-beam beam-1" />
      <div className="hero-light-beam beam-2" />
      <div className="hero-light-beam beam-3" />
      <div className="hero-floating-pieces">
        <div className="floating-piece fp-queen">
          <ChessQueen size={80} />
        </div>
        <div className="floating-piece fp-rook">
          <ChessRook size={60} />
        </div>
        <div className="floating-piece fp-knight">
          <ChessKnight size={65} />
        </div>
        <div className="floating-piece fp-bishop">
          <ChessBishop size={55} />
        </div>
        <div className="floating-piece fp-pawn-1">
          <ChessPawn size={45} />
        </div>
        <div className="floating-piece fp-pawn-2">
          <ChessPawn size={38} />
        </div>
        <div className="floating-piece fp-board">
          <ChessBoard size={120} />
        </div>
        <div className="floating-piece fp-knight-2">
          <ChessKnight size={50} />
        </div>
      </div>
    </div>
  );
};

export default AnimatedBackground;
