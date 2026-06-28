import React from 'react';
import { motion } from 'framer-motion';
import { ChessKingSVG, ChessQueenSVG, ChessKnightSVG, ChessBishopSVG } from './ChessSVGs';
import './AnimatedBackground.css';

const particles = [...Array(30)].map(() => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  w: Math.random() * 4 + 2,
  h: Math.random() * 4 + 2,
  duration: Math.random() * 15 + 10,
  delay: Math.random() * 5,
  drift: Math.random() * -200 - 100,
}));

const AnimatedBackground = () => {
  return (
    <div className="animated-background">
      <div className="background-grid" />
      <div className="particles-container">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{
              y: [0, p.drift],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
            style={{
              left: p.left,
              top: p.top,
              width: p.w,
              height: p.h,
            }}
          />
        ))}
      </div>
      <div className="chess-silhouettes">
        <motion.div className="silhouette-piece piece-king"
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
          <ChessKingSVG size={250} />
        </motion.div>
        <motion.div className="silhouette-piece piece-queen"
          animate={{ y: [0, -25, 0], rotate: [0, -8, 0], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <ChessQueenSVG size={200} />
        </motion.div>
        <motion.div className="silhouette-piece piece-knight"
          animate={{ y: [0, -20, 0], rotate: [0, 12, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <ChessKnightSVG size={180} />
        </motion.div>
        <motion.div className="silhouette-piece piece-bishop"
          animate={{ y: [0, -22, 0], rotate: [0, -6, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}>
          <ChessBishopSVG size={150} />
        </motion.div>
      </div>
      <motion.div className="glow-orb orb-blue"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="glow-orb orb-green"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15], x: [0, -40, 0], y: [0, -25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
      <motion.div className="glow-orb orb-orange"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
      <div className="wave-container">
        <motion.div className="wave wave-1"
          animate={{ x: [0, -50, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="wave wave-2"
          animate={{ x: [0, 50, 0], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      </div>
    </div>
  );
};

export default AnimatedBackground;
