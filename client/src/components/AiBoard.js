import React, { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const AiBoard = ({ fen, orientation, onMove, disabled, lastMove, boardWidth }) => {
  const [chess] = useState(() => new Chess(fen));
  const [highlighted, setHighlighted] = useState(null);

  React.useEffect(() => {
    try { chess.load(fen); } catch { }
  }, [fen, chess]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    if (disabled) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        setHighlighted({ from: sourceSquare, to: targetSquare });
        onMove(move.san);
        return true;
      }
    } catch {
      const validMoves = chess.moves({ verbose: true });
      const matchingMove = validMoves.find(
        m => m.from === sourceSquare && m.to === targetSquare
      );
      if (matchingMove) {
        chess.move(matchingMove.san);
        setHighlighted({ from: sourceSquare, to: targetSquare });
        onMove(matchingMove.san);
        return true;
      }
    }

    return false;
  }, [chess, onMove, disabled]);

  const customSquareStyles = {};
  if (highlighted) {
    customSquareStyles[highlighted.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[highlighted.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }

  return (
    <div className="ai-board-container">
      <Chessboard
        id="aiPracticeBoard"
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        boardWidth={boardWidth || 480}
        arePiecesDraggable={!disabled}
        customSquareStyles={customSquareStyles}
        animationDuration={200}
      />
    </div>
  );
};

export default AiBoard;
