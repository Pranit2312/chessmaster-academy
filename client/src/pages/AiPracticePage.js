import React, { useState, useCallback, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import AiBoard from '../components/AiBoard';
import DifficultySelector from '../components/DifficultySelector';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/AiPages.css';

const DIFFICULTY_NAMES = {
  1: 'Beginner', 5: 'Intermediate', 10: 'Candidate Master', 15: 'Super GM', 20: 'Champion'
};

const AiPracticePage = () => {
  const [gameState, setGameState] = useState('idle');
  const [game, setGame] = useState(null);
  const [difficulty, setDifficulty] = useState(5);
  const [playerColor, setPlayerColor] = useState('w');
  const [moves, setMoves] = useState([]);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [engineInfo, setEngineInfo] = useState(null);

  useEffect(() => {
    aiAPI.getEngineStatus().then(r => setEngineInfo(r.data.engine)).catch(() => {});
  }, []);

  const startGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMoves([]);
    setGameResult(null);
    try {
      const res = await aiAPI.startBotGame({ difficulty, playerColor });
      const gameData = res.data?.game;
      if (gameData) {
        setGame(gameData);
        setFen(gameData.fen);
        setMoves(gameData.moves || []);
        if (gameData.moves?.length > 0 && playerColor === 'b') {
          setFen(gameData.moves[gameData.moves.length - 1].fen);
        }
      }
      setGameState('playing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start game');
    }
    setLoading(false);
  }, [difficulty, playerColor]);

  const handlePlayerMove = useCallback(async (san) => {
    if (!game) return;
    setLoading(true);
    try {
      const res = await aiAPI.makeBotMove(game._id, { move: san });
      const data = res.data;
      setFen(data.fen);
      setMoves(data.moves || []);
      if (data.gameOver) { setGameResult(data.result); setGameState('ended'); }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid move');
    }
    setLoading(false);
  }, [game]);

  const resignGame = useCallback(async () => {
    if (!game) return;
    try { const res = await aiAPI.resignBotGame(game._id); setGameResult(res.data.result); setGameState('ended'); }
    catch (err) { setError('Failed to resign'); }
  }, [game]);

  const handleAnalyze = useCallback(async () => {
    if (!game) return;
    try { const res = await aiAPI.analyzeBotGame(game._id); window.location.href = `/analysis/${res.data.analysisId}`; }
    catch (err) { setError('Failed to queue analysis'); }
  }, [game]);

  const toggleHistory = useCallback(async () => {
    if (gameHistory.length === 0) {
      try { const res = await aiAPI.getBotGames({ limit: 10 }); setGameHistory(res.data.games || []); } catch {}
    }
    setShowHistory(prev => !prev);
  }, [gameHistory]);

  const loadGame = useCallback(async (gameId) => {
    try {
      const res = await aiAPI.getBotGame(gameId);
      const g = res.data?.game;
      if (!g) return;
      setGame(g); setFen(g.fen); setMoves(g.moves || []);
      setDifficulty(g.difficulty); setPlayerColor(g.playerColor);
      setGameResult(g.result === 'playing' ? null : g.result);
      setGameState(g.result === 'playing' ? 'playing' : 'ended');
      setShowHistory(false);
    } catch {}
  }, []);

  const getResultText = () => {
    if (gameResult === 'white_win') return playerColor === 'w' ? 'You Won!' : 'AI Won';
    if (gameResult === 'black_win') return playerColor === 'b' ? 'You Won!' : 'AI Won';
    if (gameResult === 'draw') return 'Draw';
    if (gameResult === 'resigned') return 'You Resigned';
    return 'Game Over';
  };

  if (gameState === 'idle') {
    return (
      <div className="ai-page">
        <div className="ai-page-header">
          <h1>🤖 AI Practice</h1>
          <p>Play against Stockfish 16 at any strength — from Beginner to World Champion level</p>
          {engineInfo && (
            <div className="engine-status">
              <span className={`engine-dot engine-${engineInfo.status}`}></span>
              Stockfish {engineInfo.status === 'native' ? '16' : 'WASM'} · {engineInfo.threads} threads · {engineInfo.hash}MB hash
            </div>
          )}
        </div>
        <div className="ai-practice-setup">
          <div className="setup-card">
            <h2>Game Setup</h2>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
            <div className="setup-colors">
              <label>Play as</label>
              <div className="color-options">
                <button className={`color-btn ${playerColor === 'w' ? 'active' : ''}`} onClick={() => setPlayerColor('w')}>⚪ White</button>
                <button className={`color-btn ${playerColor === 'b' ? 'active' : ''}`} onClick={() => setPlayerColor('b')}>⚫ Black</button>
                <button className={`color-btn ${playerColor === 'random' ? 'active' : ''}`} onClick={() => setPlayerColor('random')}>🎲 Random</button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={startGame} disabled={loading} style={{ width: '100%' }}>
              {loading ? <LoadingSpinner /> : 'Start Game'}
            </button>
            {error && <div className="alert alert-error">{error}</div>}
          </div>
          <div className="setup-info">
            <div className="info-card">
              <h3>How it works</h3>
              <ul>
                <li>Choose difficulty — Elo {difficulty * 100} to {difficulty * 150}</li>
                <li>Select your color or random</li>
                <li>Drag pieces to make moves</li>
                <li>AI responds with Stockfish 16</li>
                <li>Analyze completed games</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Game History</h3>
              <button className="btn btn-outline" onClick={toggleHistory} style={{ width: '100%' }}>
                {showHistory ? 'Hide' : 'View History'}
              </button>
              {showHistory && (
                <div className="game-history-list">
                  {gameHistory.map(g => (
                    <div key={g._id} className="history-item" onClick={() => loadGame(g._id)}>
                      <span>Level {g.difficulty} · {g.result?.replace('_', ' ')}</span>
                      <small>{new Date(g.startedAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                  {gameHistory.length === 0 && <p className="text-muted">No games yet</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>🤖 AI Practice {gameState === 'ended' ? '· ' + getResultText() : ''}</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={startGame}>New Game</button>
          {gameState === 'ended' ? (
            <button className="btn btn-primary" onClick={handleAnalyze}>Analyze with Stockfish</button>
          ) : (
            <button className="btn btn-danger" onClick={resignGame}>Resign</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ai-practice-game">
        <div className="game-board-section">
          <AiBoard fen={fen} orientation={playerColor === 'b' ? 'black' : 'white'} onMove={handlePlayerMove} disabled={loading || gameState === 'ended'} boardWidth={500} />
          {loading && <div className="board-loading">Stockfish is thinking...</div>}
          {gameResult && (
            <div className={`game-result-banner result-${gameResult}`}>
              {gameResult === 'white_win' && (playerColor === 'w' ? '🎉 You Won!' : '😞 Stockfish Won')}
              {gameResult === 'black_win' && (playerColor === 'b' ? '🎉 You Won!' : '😞 Stockfish Won')}
              {gameResult === 'draw' && '🤝 Draw'}
              {gameResult === 'resigned' && 'You Resigned'}
            </div>
          )}
        </div>

        <div className="game-info-section">
          <div className="game-info-card">
            <h3>Game Info</h3>
            <div className="game-info-row">
              <span>Difficulty</span>
              <span>{DIFFICULTY_NAMES[difficulty] || `Level ${difficulty}`} · Elo ~{game?.difficultyElo || difficulty * 100}</span>
            </div>
            <div className="game-info-row">
              <span>You</span>
              <span>{playerColor === 'w' ? 'White' : 'Black'}</span>
            </div>
            <div className="game-info-row">
              <span>Moves Played</span>
              <span>{moves.length}</span>
            </div>
            <div className="game-info-row">
              <span>Engine</span>
              <span>Stockfish {engineInfo?.status === 'native' ? '16' : 'WASM'}</span>
            </div>
          </div>

          <div className="move-history-card">
            <h3>Move History ({moves.length})</h3>
            <div className="move-list">
              {moves.length === 0 && <p className="text-muted">Make your first move!</p>}
              {moves.map((m, i) => (
                <div key={i} className={`move-item ${m.by === 'player' ? 'move-player' : 'move-bot'}`}>
                  <span className="move-number">{Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'}</span>
                  <span className="move-san">{m.san}</span>
                  <span className="move-by">{m.by === 'player' ? 'You' : 'AI'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPracticePage;
