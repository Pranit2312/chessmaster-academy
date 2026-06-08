import React from 'react';

const STATUS_LABELS = {
  queued: 'Queued for analysis...',
  analyzing: 'Analyzing your game...',
  completed: 'Analysis complete',
  failed: 'Analysis failed'
};

const AnalysisProgressBar = ({ status }) => {
  if (!status || status === 'completed') return null;

  const isActive = status === 'queued' || status === 'analyzing';

  return (
    <div className={`analysis-progress ${status}`}>
      <div className="progress-track">
        {isActive && <div className="progress-indeterminate" />}
      </div>
      <p>{STATUS_LABELS[status] || status}</p>
    </div>
  );
};

export default AnalysisProgressBar;
