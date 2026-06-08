import React from 'react';

const DIFFICULTY_LEVELS = [
  { level: 1,  label: 'Beginner',       elo: 200,  description: 'Perfect for new players',          color: '#22c55e' },
  { level: 3,  label: 'Casual',         elo: 600,  description: 'Good for learning basics',         color: '#84cc16' },
  { level: 5,  label: 'Intermediate',   elo: 1000, description: 'Club-level play',                  color: '#eab308' },
  { level: 8,  label: 'Advanced',       elo: 1600, description: 'Challenging for most players',     color: '#f97316' },
  { level: 12, label: 'International',  elo: 2200, description: 'IM-strength opponent',             color: '#ef4444' },
  { level: 16, label: 'Elite',          elo: 2600, description: 'World-class competition',           color: '#8b5cf6' },
  { level: 20, label: 'Champion',       elo: 3000, description: 'Maximum Stockfish strength',       color: '#dc2626' }
];

const DifficultySelector = ({ value, onChange, label = 'AI Difficulty' }) => {
  const current = DIFFICULTY_LEVELS.reduce((prev, curr) =>
    Math.abs(curr.level - value) < Math.abs(prev.level - value) ? curr : prev
  );

  return (
    <div className="difficulty-selector">
      <label className="difficulty-label">{label}</label>
      <div className="difficulty-slider-container">
        <input
          type="range"
          min="1"
          max="20"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="difficulty-slider"
          style={{ accentColor: current.color }}
        />
        <div className="difficulty-info">
          <span className="difficulty-name" style={{ color: current.color }}>
            {current.label}
          </span>
          <span className="difficulty-level">Level {value} · Elo ~{current.elo}</span>
        </div>
        <p className="difficulty-desc">{current.description}</p>
        <div className="difficulty-labels">
          {[1, 5, 10, 15, 20].map(l => (
            <span key={l} className="difficulty-tick" onClick={() => onChange(l)}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DifficultySelector;
