import React from 'react';
import { useNavigate } from 'react-router-dom';
import PgnUploader from '../components/analysis/PgnUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAnalysisList, useSubmitAnalysis } from '../hooks/useAnalysis';
import '../styles/GameAnalysisPage.css';

const GameAnalysisPage = () => {
  const navigate = useNavigate();
  const { analyses, loading, refetch } = useAnalysisList();
  const { submit, submitting, error } = useSubmitAnalysis();

  const handleSubmit = async (pgn, depth) => {
    const result = await submit(pgn, depth);
    if (!result) return;
    await refetch();
    navigate(`/analysis/${result.id}`);
  };

  const statusBadge = (status) => {
    const classes = {
      completed: 'badge-success',
      analyzing: 'badge-warning',
      queued: 'badge-info',
      failed: 'badge-danger'
    };
    return `status-badge ${classes[status] || ''}`;
  };

  return (
    <div className="game-analysis-page">
      <header className="analysis-page-header">
        <div>
          <h1>AI Game Analysis</h1>
          <p>Upload a PGN to get move-by-move evaluation, blunder detection, and accuracy scores.</p>
        </div>
      </header>

      <div className="analysis-layout">
        <section className="analysis-upload-section">
          <h2>Analyze a New Game</h2>
          <PgnUploader onSubmit={handleSubmit} submitting={submitting} error={error} />
        </section>

        <section className="analysis-history-section">
          <h2>Your Analyses</h2>
          {loading ? (
            <LoadingSpinner />
          ) : (analyses || []).length === 0 ? (
            <p className="empty-state">No analyses yet. Submit your first game!</p>
          ) : (
            <div className="analysis-list">
              {analyses.map((item) => (
                <div
                  key={item._id}
                  className="analysis-list-item"
                  onClick={() => navigate(`/analysis/${item._id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/analysis/${item._id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="analysis-list-meta">
                    <strong>
                      {item.whitePlayer || 'White'} vs {item.blackPlayer || 'Black'}
                    </strong>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                  <span className={statusBadge(item.status)}>{item.status}</span>
                  {item.summary && item.status === 'completed' && (
                    <div className="analysis-list-stats">
                      <span>⚪ {item.summary.whiteAccuracy}%</span>
                      <span>⚫ {item.summary.blackAccuracy}%</span>
                      {item.summary.blunders > 0 && (
                        <span className="blunder-count">{item.summary.blunders} blunders</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GameAnalysisPage;
