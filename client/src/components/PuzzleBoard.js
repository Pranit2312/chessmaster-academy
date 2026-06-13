import React, { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const PuzzleBoard = ({ fen, playerSide, onSolve, boardWidth }) => {
  const [chess] = useState(() => {
    try { return new Chess(fen); } catch { return new Chess(); }
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [currentFen, setCurrentFen] = useState(fen);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    try {
      chess.load(fen);
      setCurrentFen(fen);
      setMessage(null);
      setMessageType(null);
      setAttempts(0);
    } catch (e) {
      console.warn('Invalid puzzle FEN:', e);
    }
  }, [fen, chess]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    try {
      const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move) {
        setCurrentFen(chess.fen());
        setAttempts(prev => prev + 1);
        onSolve(move.san);
        return true;
      }
    } catch {}

    setMessage('Invalid move! Try again.');
    setMessageType('error');
    setTimeout(() => { setMessage(null); setMessageType(null); }, 2000);
    return false;
  }, [chess, onSolve]);

  const customStyles = {};
  if (messageType === 'success') {
    try {
      customStyles[chess.turn() === 'w' ? 'e1' : 'e8'] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' };
    } catch {}
  }

  return (
    <div className="puzzle-board-container">
      <Chessboard
        id="puzzleBoard"
        position={currentFen}
        onPieceDrop={onDrop}
        boardOrientation={playerSide === 'b' ? 'black' : 'white'}
        boardWidth={boardWidth || 420}
        customSquareStyles={customStyles}
        animationDuration={200}
        arePiecesDraggable={!messageType}
      />
      {message && (
        <div className={`puzzle-message puzzle-message-${messageType}`}>
          {message}
        </div>
      )}
      <div className="puzzle-attempts">
        Attempts: {attempts}
      </div>
    </div>
  );
};

export default PuzzleBoard;
