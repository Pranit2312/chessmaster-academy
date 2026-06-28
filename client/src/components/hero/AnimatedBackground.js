import React, { useRef, useEffect } from 'react';
import { ChessQueen, ChessRook, ChessKnight, ChessBishop, ChessPawn, ChessBoard } from './ChessIcons';
import './AnimatedBackground.css';

const BgParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let lastTime = 0;
    let animId;
    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 16, 3);
      lastTime = time;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.pulse += 0.02 * dt;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        const pa = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${pa})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const a = (1 - dist / 100) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="bg-particle-canvas" />;
};

const AnimatedBackground = () => {
  return (
    <div className="hero-bg">
      <div className="hero-bg-gradient" />
      <div className="hero-bg-grid" />
      <BgParticles />
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
          <ChessQueen />
        </div>
        <div className="floating-piece fp-rook">
          <ChessRook />
        </div>
        <div className="floating-piece fp-knight">
          <ChessKnight />
        </div>
        <div className="floating-piece fp-bishop">
          <ChessBishop />
        </div>
        <div className="floating-piece fp-pawn-1">
          <ChessPawn />
        </div>
        <div className="floating-piece fp-pawn-2">
          <ChessPawn />
        </div>
        <div className="floating-piece fp-board">
          <ChessBoard />
        </div>
        <div className="floating-piece fp-knight-2">
          <ChessKnight />
        </div>
      </div>
    </div>
  );
};

export default AnimatedBackground;
