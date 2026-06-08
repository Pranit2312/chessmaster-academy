import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisAPI } from '../../utils/api';

const StudentAIWidget = () => {
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await analysisAPI.getMyAnalyses({ limit: 3 });
        setRecent(data.data || []);
      } catch {
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="dashboard-section ai-analysis-widget">
      <div className="widget-header">
        <h3>AI Game Analysis</h3>
        <button className="btn btn-text" onClick={() => navigate('/analysis')}>
          Analyze Game →
        </button>
      </div>

      {loading ? (
        <p>Loading analyses...</p>
      ) : recent.length === 0 ? (
        <p className="empty-state">
          Upload a PGN to get blunder detection and accuracy scores.
          <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/analysis')}>
            Start Analysis
          </button>
        </p>
      ) : (
        <div className="analysis-list">
          {recent.map((item) => (
            <div
              key={item._id}
              className="analysis-list-item"
              onClick={() => navigate(`/analysis/${item._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/analysis/${item._id}`)}
            >
              <strong>{item.whitePlayer || 'White'} vs {item.blackPlayer || 'Black'}</strong>
              <span className={`status-badge badge-${item.status}`}>{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default StudentAIWidget;
