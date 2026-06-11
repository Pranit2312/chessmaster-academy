import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import './PuzzleBoard.css';

const PIECE_UNICODE = {
  wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
  bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F'
};

const FILES = 'abcdefgh';

const PuzzleBoard = ({ fen, playerSide, onMove, boardWidth = 420, showSolution, solution, flipped }) => {
  const chess = useMemo(() => {
    const c = new Chess(fen);
    return c;
  }, [fen]);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState(flipped || false);

  const boardState = useMemo(() => {
    const board = [];
    const rows = boardOrientation ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    for (const row of rows) {
      const rank = [];
      const cols = boardOrientation ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
      for (const col of cols) {
        const square = chess.board()[row][col];
        const sqName = FILES[col] + (row + 1);
        rank.push({ square: sqName, piece: square });
      }
      board.push(rank);
    }
    return board;
  }, [chess, boardOrientation]);

  const squareSize = Math.floor(boardWidth / 8);

  const handleSquareClick = useCallback((square) => {
    const piece = chess.get(square);

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const move = chess.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (move) {
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalMoves([]);
        if (onMove) onMove(move.san);
        return;
      }
    }

    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [chess, selectedSquare, onMove]);

  const isLightSquare = (row, col) => {
    const r = boardOrientation ? 7 - row : row;
    const c = boardOrientation ? 7 - col : col;
    return (r + c) % 2 === 0;
  };

  return (
    <div className="puzzle-board-container" style={{ width: boardWidth }}>
      <div className="puzzle-board" style={{ width: boardWidth, height: boardWidth }}>
        {boardState.map((rank, ri) =>
          rank.map(({ square, piece }, ci) => {
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);
            const isLastMove = lastMove && (square === lastMove.from || square === lastMove.to);
            const isSolution = showSolution && solution && solution[0] && (() => {
              const chess2 = new Chess(fen);
              try {
                const m = chess2.move(solution[0]);
                return square === m.to;
              } catch { return false; }
            })();

            return (
              <div
                key={square}
                className={`puzzle-square ${isLightSquare(ri, ci) ? 'light' : 'dark'}
                  ${isSelected ? 'selected' : ''}
                  ${isLegal ? 'legal' : ''}
                  ${isLastMove ? 'last-move' : ''}
                  ${isSolution ? 'solution' : ''}`}
                style={{ width: squareSize, height: squareSize }}
                onClick={() => handleSquareClick(square)}
              >
                {piece && (
                  <span className="puzzle-piece" style={{ fontSize: squareSize * 0.8 }}>
                    {PIECE_UNICODE[piece.color + piece.type.toUpperCase()] || ''}
                  </span>
                )}
                {isLegal && !piece && (
                  <span className="legal-dot" />
                )}
                {ri === (boardOrientation ? 7 : 0) && (
                  <span className="file-label">{square[0]}</span>
                )}
                {ci === (boardOrientation ? 0 : 7) && (
                  <span className="rank-label">{square[1]}</span>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="puzzle-board-controls">
        <button className="btn btn-sm btn-outline" onClick={() => setBoardOrientation(!boardOrientation)}>
          Flip Board
        </button>
      </div>
    </div>
  );
};

export default PuzzleBoard;
