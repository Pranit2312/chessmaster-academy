import React from 'react';
import { motion } from 'framer-motion';
import { ChessKingSVG, ChessQueenSVG, ChessKnightSVG, ChessBishopSVG, ChessRookSVG, ChessPawnSVG } from './ChessSVGs';
import './ChessVisuals.css';

const PIECE_SVGS = {
  king: ChessKingSVG,
  queen: ChessQueenSVG,
  knight: ChessKnightSVG,
  bishop: ChessBishopSVG,
  rook: ChessRookSVG,
  pawn: ChessPawnSVG,
};

export const ChessDivider = ({ variant = 'king' }) => {
  const PieceSVG = PIECE_SVGS[variant] || ChessKingSVG;

  return (
    <div className="chess-divider">
      <motion.div className="divider-line"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }} />
      <motion.div className="divider-piece"
        animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <PieceSVG size={24} />
      </motion.div>
      <motion.div className="divider-line"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} />
    </div>
  );
};

export const ChessIllustration = ({ piece = '♔', size = 'large', animated = true }) => {
  const sizeMap = { small: 32, medium: 48, large: 72, xlarge: 96 };
  const s = sizeMap[size] || 72;

  const PieceSVG = PIECE_SVGS[piece];
  const content = PieceSVG ? <PieceSVG size={s} /> : <span style={{ fontSize: s }}>{piece}</span>;

  return (
    <motion.div className={`chess-illustration`}
      animate={animated ? { y: [0, -10, 0], rotate: [0, 3, 0], scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      {content}
    </motion.div>
  );
};

export const ChessBoardPattern = () => (
  <div className="chess-board-pattern">
    {[...Array(64)].map((_, i) => {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const isLight = (row + col) % 2 === 0;
      return <div key={i} className={`pattern-square ${isLight ? 'light' : 'dark'}`} />;
    })}
  </div>
);

export const FloatingPieces = ({ count = 5 }) => {
  const pieceKeys = Object.keys(PIECE_SVGS);
  const items = [...Array(count)].map(() => ({
    Component: PIECE_SVGS[pieceKeys[Math.floor(Math.random() * pieceKeys.length)]],
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 40 + 20,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 3,
    drift: Math.random() * -50 - 25,
    spin: Math.random() * 20 - 10,
  }));

  return (
    <div className="floating-pieces">
      {items.map((item, i) => (
        <motion.div key={i} className="floating-piece"
          initial={{ opacity: 0.1, rotate: 0 }}
          animate={{
            y: [0, item.drift],
            rotate: [0, item.spin],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay,
          }}
          style={{ left: item.left, top: item.top }}>
          <item.Component size={item.size} />
        </motion.div>
      ))}
    </div>
  );
};

export const ChessGlow = ({ color = 'blue', size = 'medium' }) => {
  const colors = { blue: 'glow-blue', green: 'glow-green', orange: 'glow-orange', purple: 'glow-purple' };
  const sizes = { small: 'glow-small', medium: 'glow-medium', large: 'glow-large' };

  return (
    <motion.div className={`chess-glow ${colors[color] || ''} ${sizes[size] || ''}`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
  );
};

export const ChessBorder = ({ variant = 'primary' }) => {
  const variants = { primary: 'border-primary', secondary: 'border-secondary', accent: 'border-accent' };

  return (
    <div className={`chess-border ${variants[variant] || ''}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="border-piece"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}>
          {i % 2 === 0 ? <ChessKingSVG size={20} /> : <ChessQueenSVG size={20} />}
        </motion.div>
      ))}
    </div>
  );
};

export const ChessBackground = ({ opacity = 0.03 }) => (
  <div className="chess-background" style={{ opacity }}>
    <div className="chess-grid" />
    <FloatingPieces count={8} />
    <ChessBoardPattern />
  </div>
);

export default ChessDivider;
