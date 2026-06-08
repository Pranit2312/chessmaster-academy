import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../utils/api';
import SkillRadar from '../components/SkillRadar';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/AiPages.css';

const AiInsightsPage = () => {
  const [activeTab, setActiveTab] = useState('assessment');
  const [assessment, setAssessment] = useState(null);
  const [weaknesses, setWeaknesses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessmentRes, weaknessRes, recRes, summaryRes] = await Promise.all([
        aiAPI.getSkillAssessment().catch(() => ({ data: { assessment: null } })),
        aiAPI.getWeaknessAnalysis().catch(() => ({ data: { insights: [] } })),
        aiAPI.getRecommendations().catch(() => ({ data: { insights: [] } })),
        aiAPI.getInsightsSummary().catch(() => ({ data: { summary: null } }))
      ]);
      setAssessment(assessmentRes.data.assessment);
      setWeaknesses(weaknessRes.data.insights || []);
      setRecommendations(recRes.data.insights || []);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      setError('Failed to load insights. Analyze some games first!');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const dismissInsight = useCallback(async (id) => {
    try {
      await aiAPI.dismissInsight(id);
      setWeaknesses(prev => prev.filter(w => w._id !== id));
      setRecommendations(prev => prev.filter(r => r._id !== id));
    } catch {}
  }, []);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>📊 AI Insights</h1>
        <p>Personalized analysis of your chess progress and recommendations</p>
        <div className="header-actions">
          <button className={`btn ${activeTab === 'assessment' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('assessment')}>
            Skill Assessment
          </button>
          <button className={`btn ${activeTab === 'weaknesses' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('weaknesses')}>
            Weaknesses ({weaknesses.length})
          </button>
          <button className={`btn ${activeTab === 'recommendations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('recommendations')}>
            Recommendations ({recommendations.length})
          </button>
          <button className="btn btn-outline" onClick={loadAll}>Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <LoadingSpinner />}

      {summary && activeTab === 'assessment' && (
        <div className="insights-summary-bar">
          <div className="summary-item">
            <span className="summary-label">Overall Score</span>
            <span className="summary-value" style={{ color: summary.overallColor }}>{summary.overallScore ?? '--'}</span>
            <span className="summary-sub">{summary.overallLabel}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Weaknesses Found</span>
            <span className="summary-value">{summary.weaknesses}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Recommendations</span>
            <span className="summary-value">{summary.recommendations}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">New Insights</span>
            <span className="summary-value">{summary.unreadCount}</span>
          </div>
        </div>
      )}

      {activeTab === 'assessment' && (
        <div className="insights-assessment">
          {assessment ? (
            <SkillRadar assessment={assessment} />
          ) : !loading ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Assessment Data Yet</h3>
              <p>Analyze at least 2 games to get your personalized skill assessment.</p>
              <Link to="/analysis" className="btn btn-primary">Go to Analysis</Link>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'weaknesses' && (
        <div className="insights-list">
          {weaknesses.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>No Weaknesses Detected</h3>
              <p>Great job! No specific weaknesses identified yet. Play more games and analyze them to get insights.</p>
            </div>
          ) : (
            weaknesses.map((insight) => (
              <div key={insight._id} className={`insight-card insight-${insight.severity}`}>
                <div className="insight-header">
                  <span className="insight-category">{insight.category}</span>
                  <span className={`insight-severity severity-${insight.severity}`}>{insight.severity}</span>
                </div>
                <h3 className="insight-title">{insight.title}</h3>
                <p className="insight-description">{insight.description}</p>
                {insight.metric && (
                  <div className="insight-metric">
                    <span className="metric-label">{insight.metric.replace(/_/g, ' ')}</span>
                    <span className="metric-value">{insight.value}</span>
                  </div>
                )}
                <button className="btn btn-text" onClick={() => dismissInsight(insight._id)}>Dismiss</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="insights-list">
          {recommendations.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon">💡</div>
              <h3>No Recommendations Yet</h3>
              <p>We'll suggest courses and coaches based on your playing style once you analyze more games.</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec._id} className={`insight-card insight-${rec.severity} insight-rec`}>
                <div className="insight-header">
                  <span className="insight-category">{rec.category}</span>
                  <span className={`insight-severity severity-${rec.severity}`}>{rec.severity}</span>
                </div>
                <h3 className="insight-title">{rec.title}</h3>
                <p className="insight-description">{rec.description}</p>
                <div className="insight-actions">
                  {rec.actionUrl && (
                    <Link to={rec.actionUrl} className="btn btn-primary btn-sm">
                      {rec.actionLabel || 'View'}
                    </Link>
                  )}
                  <button className="btn btn-text btn-sm" onClick={() => dismissInsight(rec._id)}>Dismiss</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AiInsightsPage;
