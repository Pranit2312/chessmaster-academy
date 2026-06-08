import React from 'react';

const BlunderSummary = ({ summary, whitePlayer, blackPlayer }) => {
  if (!summary) return null;

  return (
    <div className="blunder-summary">
      <div className="summary-card">
        <h4>{whitePlayer || 'White'}</h4>
        <p className="accuracy-value">{summary.whiteAccuracy ?? '—'}%</p>
        <span className="accuracy-label">Accuracy</span>
      </div>

      <div className="summary-stats">
        <div className="stat-pill inaccuracy">
          <strong>{summary.inaccuracies || 0}</strong>
          <span>Inaccuracies</span>
        </div>
        <div className="stat-pill mistake">
          <strong>{summary.mistakes || 0}</strong>
          <span>Mistakes</span>
        </div>
        <div className="stat-pill blunder">
          <strong>{summary.blunders || 0}</strong>
          <span>Blunders</span>
        </div>
        <div className="stat-pill total">
          <strong>{summary.totalMoves || 0}</strong>
          <span>Total Moves</span>
        </div>
      </div>

      <div className="summary-card">
        <h4>{blackPlayer || 'Black'}</h4>
        <p className="accuracy-value">{summary.blackAccuracy ?? '—'}%</p>
        <span className="accuracy-label">Accuracy</span>
      </div>
    </div>
  );
};

export default BlunderSummary;
