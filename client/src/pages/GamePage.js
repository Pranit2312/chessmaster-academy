import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { gameAPI } from '../utils/api';
import '../styles/PlayPage.css';

export default function GamePage() {
  const { id: gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, on, off } = useSocket();
  const isSpectator = new URLSearchParams(location.search).get('spectate') === '1';

  const [game, setGame] = useState(new Chess());
  const [gameData, setGameData] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [moves, setMoves] = useState([]);
  const [clocks, setClocks] = useState({ white: 0, black: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [ratingChanges, setRatingChanges] = useState(null);
  const [drawOffered, setDrawOffered] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [loadError, setLoadError] = useState(null);

  const opponentName = opponent?.username || opponent?.user?.name || opponent?.name || 'Opponent';
  const opponentRating = opponent?.rating || opponent?.user?.chessRating || null;

  useEffect(() => {
    if (!gameId) return;
    if (location.state?.matchData && !isSpectator) {
      const md = location.state.matchData;
      setPlayerColor(md.color);
      setOpponent(md.opponent);
    }
    loadGame();
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameId) return;
    emit('game:join', { gameId });

    const mf = (data) => handleOpponentMove(data);
    const gover = (data) => handleGameOver(data);
    const doffer = (data) => setDrawOffered(data);
    const ddeclined = () => setDrawOffered(null);
    const gerror = (data) => { console.error('Game error:', data?.message || data); };
    const clockSync = (data) => { setClocks({ white: data.white, black: data.black }); };
    const spectateSync = (data) => {
      if (!isSpectator) return;
      const chess = new Chess(data.fen);
      setGame(chess);
      setMoves(data.moves || []);
      setClocks(data.clocks || { white: 0, black: 0 });
    };

    on('game:move-made', mf);
    on('game:over', gover);
    on('game:draw-offered', doffer);
    on('game:draw-declined', ddeclined);
    on('game:aborted', () => navigate('/play'));
    on('game:error', gerror);
    on('game:clock-sync', clockSync);
    on('spectate:synced', spectateSync);

    if (isSpectator) {
      emit('spectate:join', { gameId });
    }

    return () => {
      emit('game:leave', { gameId });
      off('game:move-made');
      off('game:over');
      off('game:draw-offered');
      off('game:draw-declined');
      off('game:aborted');
      off('game:error');
      off('game:clock-sync');
      off('spectate:synced');
      if (isSpectator) emit('spectate:leave', { gameId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    if (!gameOver && gameData?.status === 'active') {
      const interval = setInterval(() => {
        setClocks(prev => {
          const turn = game.turn();
          if (turn === 'w') return { ...prev, white: Math.max(0, prev.white - 1000) };
          if (turn === 'b') return { ...prev, black: Math.max(0, prev.black - 1000) };
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameOver, gameData, game]);

  async function loadGame() {
    try {
      const res = await gameAPI.getById(gameId);
      const g = res.data.game;
      setGameData(g);
      const chess = new Chess(g.fen);
      g.moves?.forEach(m => { try { chess.move(m.san); } catch {} });
      setGame(chess);
      setMoves(g.moves || []);
      setClocks({ white: g.clocks?.white || 0, black: g.clocks?.black || 0 });

      if (!isSpectator && !location.state?.matchData) {
        const p0 = g.players?.[0];
        const p1 = g.players?.[1];
        if (String(p0?.user?._id) === String(user?._id)) { setPlayerColor(p0.color); setOpponent(p1); }
        else if (String(p1?.user?._id) === String(user?._id)) { setPlayerColor(p1.color); setOpponent(p0); }
      }
      if (g.status === 'completed') { setGameOver(true); setResult({ result: g.result, by: g.termination }); }
    } catch (e) {
      console.error('loadGame error:', e);
      setLoadError(e?.response?.data?.message || e.message || 'Failed to load game');
    }
  }

  function handleOpponentMove(data) {
    if (data.gameOver) return handleGameOver(data);
    if (!data.move && !data.fen) return;
    try {
      if (data.fen) {
        setGame(new Chess(data.fen));
      } else {
        const chess = new Chess(game.fen());
        chess.move(data.move.san);
        setGame(chess);
      }
      if (data.move) setMoves(prev => [...prev, data.move]);
      if (data.move?.playerColor) {
        setClocks(prev => ({ ...prev, [data.move.playerColor === 'w' ? 'white' : 'black']: data.move.clock }));
      }
    } catch (e) { console.error(e); }
  }

  function handleGameOver(data) {
    setGameOver(true);
    setResult(data);
    setRatingChanges(data.ratingChanges);
    if (data.by === 'timeout') {
      setClocks(prev => ({ ...prev, [data.winner === 'white' ? 'black' : 'white']: 0 }));
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    if (gameOver || isSpectator) return false;
    if (game.turn() !== (playerColor === 'white' ? 'w' : 'b')) return false;

    try {
      const chess = new Chess(game.fen());
      const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;

      const chess2 = new Chess(game.fen());
      chess2.move(move.san);
      setGame(chess2);
      setSelectedSquare(null);

      emit('game:move', { gameId, from: sourceSquare, to: targetSquare, promotion: 'q' });
      return true;
    } catch {
      return false;
    }
  }

  function handleResign() {
    if (!window.confirm('Are you sure you want to resign?')) return;
    emit('game:resign', { gameId });
  }

  function handleDrawOffer() {
    emit('game:draw-offer', { gameId });
    setDrawOffered('sent');
  }

  function handleDrawResponse(accept) {
    emit('game:draw-response', { gameId, accepted: accept });
    setDrawOffered(null);
  }

  function handleAbort() {
    if (!window.confirm('Abort game?')) return;
    emit('game:abort', { gameId });
  }

  function handleRematch() {
    emit('game:rematch', { gameId });
  }

  function onSquareClick(square) {
    if (gameOver || isSpectator) return;
    if (game.turn() !== (playerColor === 'white' ? 'w' : 'b')) return;

    if (selectedSquare) {
      onDrop(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      const moves2 = game.moves({ square, verbose: true });
      if (moves2.length > 0) {
        setSelectedSquare(square);
        const opts = {};
        moves2.forEach(m => { opts[m.to] = { background: 'rgba(0, 255, 0, 0.4)' }; });
        setOptionSquares(opts);
      }
    }
  }

  function onSquareRightClick(square) {
    const newSqs = { ...rightClickedSquares };
    if (newSqs[square]) delete newSqs[square];
    else newSqs[square] = { background: 'rgba(255, 0, 0, 0.4)' };
    setRightClickedSquares(newSqs);
  }

  const formatClock = (ms) => {
    if (!ms && ms !== 0) return '—';
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loadError) {
    return (
      <div className="game-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <h2>Failed to load game</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>{loadError}</p>
        <button className="game-action-btn primary" onClick={() => { setLoadError(null); setGameData(null); loadGame(); }}>Retry</button>
        <button className="game-action-btn secondary" onClick={() => navigate('/play')} style={{ marginTop: '0.5rem' }}>Back to Lobby</button>
      </div>
    );
  }

  if (!gameData) return <div className="game-page"><p>Loading game...</p></div>;

  const myClock = playerColor === 'white' ? clocks.white : clocks.black;
  const oppClock = playerColor === 'white' ? clocks.black : clocks.white;

  return (
    <div className="game-page">
      <div className="game-layout">
        <div className="game-board-section">
            <div className="game-player-info opp-info">
            <div className="game-player-avatar">{opponentName?.[0] || '?'}</div>
            <div className="game-player-details">
              <span className="game-player-name">{opponentName}</span>
              <span className="game-player-rating">Rating: {opponentRating ?? '—'}</span>
            </div>
            <div className={`game-clock ${game.turn() === (playerColor === 'white' ? 'b' : 'w') ? 'active' : ''}`}>
              {formatClock(oppClock)}
            </div>
          </div>

          <div className="game-board-wrapper">
            <Chessboard
              id="play-board"
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              boardWidth={Math.min(480, window.innerWidth - 40)}
              boardOrientation={playerColor || 'white'}
              customBoardStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              customDarkSquareStyle={{ backgroundColor: '#b58863' }}
              customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
              customDropSquareStyle={{ boxShadow: 'inset 0 0 0 2px #2563eb' }}
              customSquareStyles={{
                ...optionSquares,
                ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {})
              }}
              animationDuration={200}
              arePiecesDraggable={!gameOver && !isSpectator}
            />
          </div>

          <div className="game-player-info my-info">
            <div className={`game-clock ${game.turn() === (playerColor === 'white' ? 'w' : 'b') ? 'active' : ''}`}>
              {formatClock(myClock)}
            </div>
            <div className="game-player-avatar">{user?.name?.[0] || '?'}</div>
            <div className="game-player-details">
              <span className="game-player-name">{user?.name || 'You'}</span>
            </div>
          </div>

          {!gameOver && !isSpectator && (
            <div className="game-actions">
              <button className="game-action-btn resign" onClick={handleResign}>Resign</button>
              <button className="game-action-btn draw" onClick={handleDrawOffer}>Offer Draw</button>
              {game.moves?.length === 0 && <button className="game-action-btn abort" onClick={handleAbort}>Abort</button>}
            </div>
          )}

          {drawOffered && drawOffered !== 'sent' && (
            <div className="game-draw-overlay">
              <p>{drawOffered.byName} offers a draw</p>
              <button className="game-action-btn accept" onClick={() => handleDrawResponse(true)}>Accept</button>
              <button className="game-action-btn decline" onClick={() => handleDrawResponse(false)}>Decline</button>
            </div>
          )}

          {gameOver && (
            <div className="game-over-overlay">
              <h2>{result?.result === '0.5-0.5' ? 'Draw' : result?.winner === playerColor ? 'You Win!' : 'You Lost'}</h2>
              <p>By {result?.by}</p>
              {ratingChanges && (
                <div className="game-rating-change">
                  <span className={ratingChanges[playerColor === 'white' ? 'whiteChange' : 'blackChange'] >= 0 ? 'rating-up' : 'rating-down'}>
                    {ratingChanges[playerColor === 'white' ? 'whiteChange' : 'blackChange'] >= 0 ? '+' : ''}{ratingChanges[playerColor === 'white' ? 'whiteChange' : 'blackChange']}
                  </span>
                </div>
              )}
              <div className="game-over-actions">
                <button className="game-action-btn primary" onClick={handleRematch}>Rematch</button>
                <button className="game-action-btn secondary" onClick={() => navigate('/play')}>New Game</button>
                <button className="game-action-btn secondary" onClick={() => navigate(`/play/${gameId}/replay`)}>Review</button>
                <button className="game-action-btn secondary" onClick={() => navigate('/play')}>Back</button>
              </div>
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <div className="game-moves-section">
            <h3>Moves</h3>
            <div className="game-moves-list">
              {moves.length === 0 && <p className="game-no-moves">No moves yet</p>}
              {moves.reduce((rows, m, i) => {
                if (i % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(m);
                return rows;
              }, []).map((pair, i) => (
                <div key={i} className="game-move-row">
                  <span className="move-number">{i + 1}.</span>
                  <span className={`move-san ${pair[0]?.san}`}>{pair[0]?.san || ''}</span>
                  <span className={`move-san ${pair[1]?.san}`}>{pair[1]?.san || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
