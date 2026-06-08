import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from '../utils/chessEngine';
import LoadingSpinner from '../components/LoadingSpinner';
import ChessBoardViewer from '../components/analysis/ChessBoardViewer';
import MoveListPanel from '../components/analysis/MoveListPanel';
import EvaluationGraph from '../components/analysis/EvaluationGraph';
import BlunderSummary from '../components/analysis/BlunderSummary';
import AnalysisProgressBar from '../components/analysis/AnalysisProgressBar';
import { useAnalysisDetail } from '../hooks/useAnalysis';
import { formatEval } from '../utils/pgnHelpers';
import '../styles/GameAnalysisPage.css';

const AnalysisResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { analysis, loading, error } = useAnalysisDetail(id);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  const boardState = useMemo(() => {
    if (!analysis?.pgn) return { fen: 'start', orientation: 'white' };

    try {
      const chess = new Chess();
      chess.loadPgn(analysis.pgn, { sloppy: true });
      const history = chess.history({ verbose: true });
      chess.reset();

      if (currentMoveIndex < 0) {
        return { fen: chess.fen(), orientation: 'white' };
      }

      for (let i = 0; i <= currentMoveIndex && i < history.length; i++) {
        chess.move(history[i]);
      }

      const orientation = currentMoveIndex >= 0 && history[currentMoveIndex]?.color === 'b'
        ? 'black'
        : 'white';

      return { fen: chess.fen(), orientation };
    } catch {
      const move = analysis.moves?.[currentMoveIndex];
      return { fen: move?.fen || 'start', orientation: 'white' };
    }
  }, [analysis, currentMoveIndex]);

  const currentMove = analysis?.moves?.[currentMoveIndex];

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="game-analysis-page">
        <div className="error-banner">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/analysis')}>
          Back to Analysis
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="game-analysis-page analysis-result-page">
      <header className="analysis-page-header">
        <div>
          <button className="btn btn-text" onClick={() => navigate('/analysis')}>
            ← Back
          </button>
          <h1>
            {analysis.whitePlayer} vs {analysis.blackPlayer}
          </h1>
          <p>
            {analysis.opening?.name && <span>{analysis.opening.name} · </span>}
            Engine: {analysis.engine || 'Stockfish'} · Depth {analysis.depth || analysis.summary?.averageDepth}
            {analysis.analysisTime ? ` · ${analysis.analysisTime}s` : ''}
          </p>
        </div>
        <span className={`status-badge badge-${analysis.status}`}>{analysis.status}</span>
      </header>

      <AnalysisProgressBar status={analysis.status} />

      {analysis.status === 'completed' && (
        <>
          <BlunderSummary
            summary={analysis.summary}
            whitePlayer={analysis.whitePlayer}
            blackPlayer={analysis.blackPlayer}
          />

          <div className="analysis-result-grid">
            <div className="board-column">
              <ChessBoardViewer fen={boardState.fen} orientation={boardState.orientation} />

              {currentMove && (
                <div className="move-detail-card">
                  <h4>Move {currentMove.san}</h4>
                  <p>Eval after: <strong>{formatEval(currentMove.evaluationAfter)}</strong></p>
                  {currentMove.bestMove && (
                    <p>Best move: <strong>{currentMove.bestMove}</strong></p>
                  )}
                  {currentMove.isMistake && (
                    <p className="mistake-detail">
                      {currentMove.mistakeType} — lost {currentMove.lossOfEval} cp
                    </p>
                  )}
                </div>
              )}

              <div className="board-nav">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentMoveIndex < 0}
                  onClick={() => setCurrentMoveIndex((i) => i - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentMoveIndex >= (analysis.moves?.length || 0) - 1}
                  onClick={() => setCurrentMoveIndex((i) => i + 1)}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="moves-column">
              <EvaluationGraph moves={analysis.moves} />
              <MoveListPanel
                moves={analysis.moves}
                currentIndex={currentMoveIndex}
                onSelectMove={setCurrentMoveIndex}
              />
            </div>
          </div>
        </>
      )}

      {analysis.status === 'failed' && (
        <div className="error-banner">
          Analysis failed. Please try submitting the game again.
        </div>
      )}
    </div>
  );
};

export default AnalysisResultPage;
