import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChessKingSVG } from './ChessSVGs';
import './HeroSection.css';

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.section
      className="hero-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="hero-background">
        <div className="hero-grid" />
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{ x: '50%', y: '50%', opacity: 0.4 }}
              animate={{
                y: [0, Math.random() * -100 - 50],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        <motion.div className="glow-orb orb-1"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="glow-orb orb-2"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <motion.div className="glow-orb orb-3"
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
      </div>

      <div className="chess-silhouettes">
        <motion.div className="silhouette king-silhouette"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="silhouette knight-silhouette"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-king-container"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        >
          <motion.div
            className="glowing-king"
            animate={{
              scale: [1, 1.05, 1],
              filter: [
                "drop-shadow(0 0 20px rgba(37, 99, 235, 0.5))",
                "drop-shadow(0 0 40px rgba(37, 99, 235, 0.8))",
                "drop-shadow(0 0 20px rgba(37, 99, 235, 0.5))",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChessKingSVG size={200} />
          </motion.div>

          <div className="light-rays">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="ray"
                style={{ transform: `rotate(${i * 30}deg)` }}
                animate={{ opacity: [0.1, 0.3, 0.1], height: [100, 150, 100] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="hero-title">
            Master the Game of<br />
            <span className="gradient-text">Kings</span>
          </h1>
          <p className="hero-subtitle">
            Professional chess training with world-class coaches,
            interactive puzzles, and competitive tournaments
          </p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button className="btn btn-primary btn-lg">Start Learning</button>
            <button className="btn btn-secondary btn-lg">Play Puzzles</button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
