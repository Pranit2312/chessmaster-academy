import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { aiAPI } from '../utils/api';
import OpeningTreeView from '../components/OpeningTreeView';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/AiPages.css';

const AiOpeningExplorerPage = () => {
  const [view, setView] = useState('overview');
  const [openings, setOpenings] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [chess] = useState(() => new Chess());
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);
  const [openingMoves, setOpeningMoves] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (view === 'overview') {
        setLoading(true);
        try {
          const res = await aiAPI.exploreOpening();
          setOpenings(res.data.openings || []);
        } catch { setError('Failed to load openings'); }
        setLoading(false);
      } else if (view === 'recommendations') {
        setLoading(true);
        try {
          const res = await aiAPI.getOpeningRecommendations();
          setRecommendations(res.data.recommendations);
        } catch { setError('Failed to load recommendations'); }
        setLoading(false);
      } else if (view === 'stats') {
        setLoading(true);
        try {
          const res = await aiAPI.getUserOpeningStats();
          setUserStats(res.data.stats || []);
        } catch { setError('Failed to load stats'); }
        setLoading(false);
      }
    };
    loadData();
  }, [view]);

  const selectOpening = useCallback(async (ecoCode) => {
    setLoading(true);
    try {
      const res = await aiAPI.getOpeningMoves(ecoCode);
      const data = res.data;
      setSelectedOpening(data);
      setOpeningMoves(data.moves || []);
      setCurrentMoveIdx(-1);
      chess.reset();
      setBoardFen(chess.fen());

      const fullRes = await aiAPI.exploreOpening(ecoCode);
      if (fullRes.data.opening) {
        setSelectedOpening(prev => ({ ...prev, ...fullRes.data.opening }));
      }
    } catch { setError('Failed to load opening details'); }
    setLoading(false);
    setView('detail');
  }, [chess]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.searchOpenings({ q: searchQuery });
      setSearchResults(res.data.openings || []);
    } catch { setError('Search failed'); }
    setLoading(false);
  }, [searchQuery]);

  const playMove = useCallback((direction) => {
    if (!openingMoves.length) return;
    let newIdx;
    if (direction === 'next') {
      newIdx = Math.min(currentMoveIdx + 1, openingMoves.length - 1);
    } else {
      newIdx = Math.max(currentMoveIdx - 1, -1);
    }

    setCurrentMoveIdx(newIdx);
    chess.reset();
    for (let i = 0; i <= newIdx; i++) {
      try { chess.move(openingMoves[i]); } catch {}
    }
    setBoardFen(chess.fen());
  }, [currentMoveIdx, openingMoves, chess]);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>📚 Opening Explorer</h1>
        <p>Explore chess openings, get personalized recommendations</p>
        <div className="header-actions">
          <button className={`btn ${view === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('overview')}>
            All Openings
          </button>
          <button className={`btn ${view === 'recommendations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('recommendations')}>
            Recommendations
          </button>
          <button className={`btn ${view === 'stats' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('stats')}>
            My Openings
          </button>
          {view === 'detail' && (
            <button className="btn btn-outline" onClick={() => setView('overview')}>← Back</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <LoadingSpinner />}

      {view === 'overview' && !loading && (
        <div className="openings-overview">
          <div className="openings-search">
            <input
              type="text"
              placeholder="Search openings by name, ECO code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="form-input"
            />
            <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          </div>
          {searchResults.length > 0 ? (
            <OpeningTreeView openings={searchResults} onSelect={selectOpening} />
          ) : (
            <OpeningTreeView openings={openings} onSelect={selectOpening} />
          )}
        </div>
      )}

      {view === 'recommendations' && recommendations && !loading && (
        <div className="opening-recommendations">
          {recommendations.as_white?.length > 0 && (
            <div className="rec-section">
              <h2>🎯 As White</h2>
              <div className="rec-cards">
                {recommendations.as_white.map((rec, i) => (
                  <div key={i} className="rec-card" onClick={() => selectOpening(rec.ecoCode)}>
                    <h3>{rec.name}</h3>
                    <span className="rec-eco">{rec.ecoCode}</span>
                    <p>{rec.reason}</p>
                    {rec.description && <p className="rec-desc">{rec.description}</p>}
                    <div className="rec-tags">
                      <span className="tag">{rec.complexity}</span>
                      <span className="tag">{rec.popularity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recommendations.as_black_vs_e4?.length > 0 && (
            <div className="rec-section">
              <h2>🛡️ As Black vs e4</h2>
              <div className="rec-cards">
                {recommendations.as_black_vs_e4.map((rec, i) => (
                  <div key={i} className="rec-card" onClick={() => selectOpening(rec.ecoCode)}>
                    <h3>{rec.name}</h3>
                    <span className="rec-eco">{rec.ecoCode}</span>
                    <p>{rec.reason}</p>
                    <div className="rec-tags">
                      <span className="tag">{rec.complexity}</span>
                      <span className="tag">{rec.popularity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recommendations.as_black_vs_d4?.length > 0 && (
            <div className="rec-section">
              <h2>🛡️ As Black vs d4</h2>
              <div className="rec-cards">
                {recommendations.as_black_vs_d4.map((rec, i) => (
                  <div key={i} className="rec-card" onClick={() => selectOpening(rec.ecoCode)}>
                    <h3>{rec.name}</h3>
                    <span className="rec-eco">{rec.ecoCode}</span>
                    <p>{rec.reason}</p>
                    <div className="rec-tags">
                      <span className="tag">{rec.complexity}</span>
                      <span className="tag">{rec.popularity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'detail' && selectedOpening && (
        <div className="opening-detail">
          <div className="detail-board-section">
            <Chessboard
              id="openingBoard"
              position={boardFen}
              boardWidth={460}
              arePiecesDraggable={false}
            />
            <div className="move-navigation">
              <button className="btn btn-sm btn-outline" onClick={() => playMove('prev')} disabled={currentMoveIdx < 0}>
                ← Prev
              </button>
              <span className="move-counter">
                {currentMoveIdx + 1} / {openingMoves.length}
              </span>
              <button className="btn btn-sm btn-outline" onClick={() => playMove('next')} disabled={currentMoveIdx >= openingMoves.length - 1}>
                Next →
              </button>
            </div>
          </div>
          <div className="detail-info-section">
            <h2>{selectedOpening.name}</h2>
            <span className="detail-eco">ECO: {selectedOpening.ecoCode}</span>
            {selectedOpening.description && <p className="detail-desc">{selectedOpening.description}</p>}
            <div className="detail-moves">
              <h3>Move Sequence</h3>
              <div className="moves-list">
                {openingMoves.map((m, i) => (
                  <span key={i} className={`move-chip ${i === currentMoveIdx ? 'move-active' : ''}`}
                    onClick={() => { setCurrentMoveIdx(i); chess.reset(); for (let j = 0; j <= i; j++) { try { chess.move(openingMoves[j]); } catch {} } setBoardFen(chess.fen()); }}>
                    {Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'} {m}
                  </span>
                ))}
              </div>
            </div>
            {selectedOpening.variations?.length > 0 && (
              <div className="detail-variations">
                <h3>Variations</h3>
                {selectedOpening.variations.map((v, i) => (
                  <div key={i} className="variation-item">
                    <strong>{v.name}</strong>
                    <span className="variation-assessment">{v.assessment}</span>
                    <div className="variation-moves">{v.moves?.join(' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'stats' && !loading && (
        <div className="user-opening-stats">
          {userStats?.length > 0 ? (
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Opening</th>
                    <th>Games</th>
                    <th>Win Rate</th>
                    <th>Avg Accuracy</th>
                    <th>W/L/D</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td>{s.gamesPlayed}</td>
                      <td>{s.winRate}%</td>
                      <td>{s.averageAccuracy}%</td>
                      <td>{s.wins}/{s.losses}/{s.draws}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No opening data yet. Analyze some games to see your opening statistics!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiOpeningExplorerPage;
