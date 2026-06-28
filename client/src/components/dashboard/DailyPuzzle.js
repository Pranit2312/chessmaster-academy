import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import './DailyPuzzle.css';

const PIECE_SYMBOLS = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const DailyPuzzle = () => {
  const [solved, setSolved] = useState(false);
  const [fen] = useState('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
  const [peopleSolved] = useState(1247);
  const [board, setBoard] = useState([]);

  useEffect(() => {
    const chess = new Chess(fen);
    const boardArray = chess.board();
    setBoard(boardArray);
  }, [fen]);

  const handleSolve = () => {
    setSolved(true);
    setTimeout(() => setSolved(false), 3000);
  };

  const getPieceAt = (row, col) => {
    if (board[row] && board[row][col]) {
      return PIECE_SYMBOLS[board[row][col].type] || '';
    }
    return '';
  };

  const getPieceColor = (row, col) => {
    if (board[row] && board[row][col]) {
      return board[row][col].color === 'w' ? 'white' : 'black';
    }
    return '';
  };

  return (
    <div className="daily-puzzle">
      <div className="puzzle-header">
        <h3>Daily Puzzle</h3>
        <span className="puzzle-badge">Daily</span>
      </div>
      
      <div className="puzzle-board">
        <div className="chessboard-mini">
          <div className="board-grid">
            {Array(8).fill(null).map((_, row) =>
              Array(8).fill(null).map((_, col) => {
                const piece = getPieceAt(row, col);
                const pieceColor = getPieceColor(row, col);
                return (
                  <div 
                    key={`${row}-${col}`} 
                    className={`square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`}
                  >
                    {piece && (
                      <span className={`chess-piece ${pieceColor}`}>
                        {piece}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="puzzle-content">
        <p className="puzzle-prompt">Find the best move</p>
        <div className="puzzle-stats">
          <span className="puzzle-stat">
            <span className="stat-icon">👥</span>
            {peopleSolved} solved
          </span>
        </div>
        
        {!solved ? (
          <button className="btn btn-primary btn-block" onClick={handleSolve}>
            Solve Puzzle
          </button>
        ) : (
          <div className="puzzle-success">
            <div className="success-icon">✓</div>
            <span className="success-text">Correct! +17 Great move!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPuzzle;
