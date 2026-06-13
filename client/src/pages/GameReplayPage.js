import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { gameAPI } from '../utils/api';
import '../styles/PlayPage.css';

export default function GameReplayPage() {
  const { gameId: id } = useParams();
  const [game, setGame] = useState(null);
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [currentMove, setCurrentMove] = useState(-1);
  const [moves, setMoves] = useState([]);
  const [pgn, setPgn] = useState('');

  useEffect(() => {
    loadGame();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadGame() {
    if (!id || id === 'undefined' || id === 'null') {
      setGame({ error: true });
      return;
    }
    try {
      const res = await gameAPI.getReplay(id);
      const g = res.data.game;
      setGame(g);
      setMoves(g.moves || []);
      setPgn(res.data.pgn || g.pgn || '');
    } catch (e) { console.error(e); }
  }

  function goToMove(index) {
    chess.reset();
    for (let i = 0; i <= index && i < moves.length; i++) {
      try { chess.move(moves[i].san); } catch {}
    }
    setFen(chess.fen());
    setCurrentMove(index);
  }

  function downloadPgn() {
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${id}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!game) return <div className="game-page"><p>Loading...</p></div>;
  if (game.error) return <div className="game-page"><p>Invalid game ID. <a href="/my-games">Back to My Games</a></p></div>;

  return (
    <div className="game-page">
      <div className="game-layout">
        <div className="game-board-section">
          <div className="game-player-info">
            <div className="game-player-avatar">{game.players?.[0]?.user?.name?.[0] || 'W'}</div>
            <div className="game-player-details">
              <span className="game-player-name">{game.players?.[0]?.user?.name || 'White'}</span>
              <span className="game-player-rating">Rating: {game.players?.[0]?.ratingBefore || '—'}</span>
            </div>
            <span className="game-replay-result">{game.result}</span>
            <div className="game-player-details" style={{ textAlign: 'right' }}>
              <span className="game-player-name">{game.players?.[1]?.user?.name || 'Black'}</span>
              <span className="game-player-rating">Rating: {game.players?.[1]?.ratingBefore || '—'}</span>
            </div>
            <div className="game-player-avatar">{game.players?.[1]?.user?.name?.[0] || 'B'}</div>
          </div>

          <div className="game-board-wrapper">
            <Chessboard
              id="replay-board"
              position={fen}
              boardWidth={Math.min(480, window.innerWidth - 40)}
              customBoardStyle={{ borderRadius: '8px' }}
              customDarkSquareStyle={{ backgroundColor: '#b58863' }}
              customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
              arePiecesDraggable={false}
            />
          </div>

          <div className="game-replay-controls">
            <button onClick={() => goToMove(-1)}>⏮</button>
            <button onClick={() => goToMove(Math.max(-1, currentMove - 1))}>◀</button>
            <span>{currentMove + 1} / {moves.length}</span>
            <button onClick={() => goToMove(Math.min(moves.length - 1, currentMove + 1))}>▶</button>
            <button onClick={() => goToMove(moves.length - 1)}>⏭</button>
            <button className="game-action-btn secondary" onClick={downloadPgn}>Download PGN</button>
          </div>
        </div>

        <div className="game-sidebar">
          <div className="game-moves-section">
            <h3>Moves</h3>
            <div className="game-moves-list">
              {moves.reduce((rows, m, i) => {
                if (i % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(m);
                return rows;
              }, []).map((pair, i) => (
                <div key={i} className={`game-move-row ${currentMove >= i * 2 + (pair[1] ? 1 : 0) ? 'active' : ''}`}>
                  <span className="move-number">{i + 1}.</span>
                  <span className={`move-san ${currentMove === i * 2 ? 'highlight' : ''}`} onClick={() => goToMove(i * 2)}>{pair[0]?.san || ''}</span>
                  <span className={`move-san ${currentMove === i * 2 + 1 ? 'highlight' : ''}`} onClick={() => pair[1] && goToMove(i * 2 + 1)}>{pair[1]?.san || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
