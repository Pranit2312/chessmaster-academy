import React, { useRef, useEffect } from 'react';
import './ChessCinematicBg.css';

const ChessCinematicBg = ({ children, className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, animId;
    let time = 0;

    const particles = [];
    const trailNodes = [];

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 3 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.05,
        size: Math.random() * 2.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const gridCols = 8;
    const gridRows = 8;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (Math.random() < 0.3) {
          trailNodes.push({
            gx: c, gy: r,
            phase: Math.random() * Math.PI * 2,
            connections: [],
          });
        }
      }
    }
    for (let i = 0; i < trailNodes.length; i++) {
      const count = Math.floor(Math.random() * 3) + 1;
      const available = trailNodes.filter((_, j) => j !== i);
      for (let k = 0; k < count && available.length; k++) {
        const idx = Math.floor(Math.random() * available.length);
        trailNodes[i].connections.push(available[idx]);
        available.splice(idx, 1);
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.01;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      const scaleX = 1 + Math.sin(time * 0.1) * 0.004;
      const scaleY = 1 + Math.cos(time * 0.08 + 0.5) * 0.004;
      ctx.scale(scaleX, scaleY);
      ctx.translate(-w / 2, -h / 2);

      trailNodes.forEach((node) => {
        const px = (node.gx + 0.5) / gridCols * w;
        const py = (node.gy + 0.5) / gridRows * h;
        node.connections.forEach((conn) => {
          const cx = (conn.gx + 0.5) / gridCols * w;
          const cy = (conn.gy + 0.5) / gridRows * h;
          const pulse = Math.sin(time * 1.2 + node.phase) * 0.5 + 0.5;
          const alpha = pulse * 0.35 + 0.05;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx, cy);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = pulse * 2 + 0.5;
          ctx.stroke();

          const glowAlpha = pulse * 0.15;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx, cy);
          ctx.strokeStyle = `rgba(147, 197, 253, ${glowAlpha})`;
          ctx.lineWidth = pulse * 5 + 2;
          ctx.stroke();
        });
      });

      const trailPoints = [];
      for (let i = 0; i < 12; i++) {
        const phase = time * 0.5 + i * 1.2;
        const t = (phase % 1 + 1) % 1;
        trailPoints.push({
          x: t * w,
          y: Math.sin(t * Math.PI * 4 + i) * 80 + h * 0.5,
          alpha: Math.sin(t * Math.PI) * 0.6,
        });
      }
      for (let i = 1; i < trailPoints.length; i++) {
        ctx.beginPath();
        ctx.moveTo(trailPoints[i - 1].x, trailPoints[i - 1].y);
        ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
        ctx.strokeStyle = `rgba(59, 130, 246, ${trailPoints[i].alpha * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      particles.forEach((p) => {
        const pulse = Math.sin(time * p.pulseSpeed + p.phase) * 0.5 + 0.5;
        const alpha = pulse * 0.7 + 0.1;
        const size = p.size * (pulse * 0.5 + 0.7);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha * 0.8})`;
        ctx.fill();

        if (pulse > 0.6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.15})`;
          ctx.fill();
        }

        p.x += p.vx + Math.sin(time * 0.5 + p.phase) * 0.1;
        p.y += p.vy + Math.cos(time * 0.3 + p.phase) * 0.05;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      });

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`cinematic-bg ${className}`}>
      <canvas ref={canvasRef} className="cinematic-canvas" />
      <div className="cinematic-void" />
      <div className="cinematic-board">
        <div className="board-perspective">
          {Array.from({ length: 64 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isDark = (row + col) % 2 === 1;
            return (
              <div
                key={i}
                className={`board-cell ${isDark ? 'cell-dark' : 'cell-light'}`}
                style={{
                  animationDelay: `${(row * 8 + col) * 0.02}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="cinematic-pieces">
        <div className="piece piece-king" style={{ bottom: '38%', left: '42%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <path d="M12 2l1.5 3.5L17 6l-2.5 2.5L16 13l-4-1-4 1 1.5-4.5L7 6l3.5-0.5L12 2z" fill="currentColor"/>
            <rect x="9" y="13" width="6" height="2" rx="0.5" fill="currentColor"/>
            <rect x="8" y="15" width="8" height="2" rx="0.5" fill="currentColor"/>
            <rect x="10" y="17" width="4" height="3" rx="0.5" fill="currentColor"/>
            <rect x="7" y="20" width="10" height="1.5" rx="0.5" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>

        <div className="piece piece-queen" style={{ bottom: '35%', left: '52%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <circle cx="9" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="6" cy="7" r="1.5" fill="currentColor"/>
            <circle cx="18" cy="7" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="5" r="1.8" fill="currentColor"/>
            <path d="M8 9l-2 9h12l-2-9-2 3-4-3-2 3z" fill="currentColor"/>
            <rect x="7" y="18" width="10" height="1.5" rx="0.5" fill="currentColor"/>
            <rect x="8" y="19.5" width="8" height="1.5" rx="0.5" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>

        <div className="piece piece-rook" style={{ bottom: '30%', left: '32%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <rect x="7" y="2" width="3" height="3" rx="0.5" fill="currentColor"/>
            <rect x="14" y="2" width="3" height="3" rx="0.5" fill="currentColor"/>
            <rect x="7" y="6" width="3" height="3" rx="0.5" fill="currentColor"/>
            <rect x="14" y="6" width="3" height="3" rx="0.5" fill="currentColor"/>
            <rect x="6" y="10" width="12" height="2" rx="0.5" fill="currentColor"/>
            <rect x="7" y="12" width="10" height="2" rx="0.5" fill="currentColor"/>
            <rect x="8" y="14" width="8" height="2" rx="0.5" fill="currentColor"/>
            <rect x="9" y="16" width="6" height="3" rx="0.5" fill="currentColor"/>
            <rect x="6" y="19" width="12" height="1.5" rx="0.5" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>

        <div className="piece piece-knight" style={{ bottom: '25%', right: '30%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <path d="M16 2c-1 1-2 3-2 5l-3 2c-2 1-4 3-4 6h14c0-3-1-5-3-7l-2-6z" fill="currentColor"/>
            <path d="M7 15c-2 1-4 2-4 4h18c0-2-2-3-4-4H7z" fill="currentColor"/>
            <rect x="8" y="18" width="8" height="2" rx="1" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>

        <div className="piece piece-bishop" style={{ bottom: '28%', right: '42%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <path d="M12 2c-1 2-2 4-2 6 0 2 1 4 2 5s2-3 2-5c0-2-1-4-2-6z" fill="currentColor"/>
            <path d="M10 13c-2 1-3 3-3 5h10c0-2-1-4-3-5h-4z" fill="currentColor"/>
            <rect x="7" y="18" width="10" height="2" rx="1" fill="currentColor"/>
            <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>

        <div className="piece piece-pawn" style={{ bottom: '22%', left: '56%' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="piece-icon">
            <circle cx="12" cy="5" r="3" fill="currentColor"/>
            <path d="M9 8c-1 2-2 4-2 6h10c0-2-1-4-2-6H9z" fill="currentColor"/>
            <rect x="8" y="14" width="8" height="2" rx="0.5" fill="currentColor"/>
            <rect x="7" y="16" width="10" height="2" rx="0.5" fill="currentColor"/>
            <rect x="8" y="18" width="8" height="3" rx="0.5" fill="currentColor"/>
          </svg>
          <div className="piece-glow" />
        </div>
      </div>

      {children && <div className="cinematic-content">{children}</div>}
    </div>
  );
};

export default ChessCinematicBg;
