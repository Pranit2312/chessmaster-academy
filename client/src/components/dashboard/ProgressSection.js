import React from 'react';
import './ProgressSection.css';

const ProgressSection = ({ progress }) => {
  const progressData = progress || [
    { label: 'Puzzles', value: 75, color: 'var(--accent-green)' },
    { label: 'Courses', value: 45, color: 'var(--primary-blue)' },
    { label: 'Tournaments', value: 60, color: 'var(--accent-orange)' },
    { label: 'Analysis', value: 30, color: '#a855f7' },
  ];

  const overallProgress = progress?.overall || 75;

  return (
    <div className="progress-section">
      <div className="progress-header">
        <h3>Your Progress</h3>
        <button className="btn btn-ghost btn-sm">View All</button>
      </div>

      <div className="overall-progress">
        <div className="progress-circle">
          <svg viewBox="0 0 36 36" className="progress-ring">
            <path
              className="progress-ring-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--bg-darker)"
              strokeWidth="3"
            />
            <path
              className="progress-ring-fill"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--gradient-primary)"
              strokeWidth="3"
              strokeDasharray={`${overallProgress}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="progress-value">
            <span className="value-number">{overallProgress}</span>
            <span className="value-percent">%</span>
          </div>
        </div>
        <div className="progress-label">Overall Progress</div>
      </div>

      <div className="progress-bars">
        {progressData.map((item, index) => (
          <div key={index} className="progress-item">
            <div className="progress-item-header">
              <span className="progress-item-label">{item.label}</span>
              <span className="progress-item-value">{item.value}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${item.value}%`, background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressSection;
