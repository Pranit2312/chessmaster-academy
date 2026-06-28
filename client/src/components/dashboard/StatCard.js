import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, value, label, type, trend }) => {
  const getIconColor = () => {
    switch (type) {
      case 'rating':
        return 'var(--primary-blue)';
      case 'puzzles':
        return 'var(--accent-green)';
      case 'tournaments':
        return 'var(--accent-orange)';
      case 'courses':
        return 'var(--primary-blue)';
      default:
        return 'var(--primary-blue)';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'rating':
        return 'var(--gradient-primary)';
      case 'puzzles':
        return 'var(--gradient-green)';
      case 'tournaments':
        return 'var(--gradient-orange)';
      case 'courses':
        return 'var(--gradient-primary)';
      default:
        return 'var(--gradient-primary)';
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: getGradient() }}>
        <span className="stat-icon-emoji">{icon}</span>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
