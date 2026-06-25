import React, { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessBoardViewer = ({ fen, orientation = 'white', lastMove }) => {
  const position = useMemo(() => fen || 'start', [fen]);

  const customSquareStyles = useMemo(() => {
    if (!lastMove) return {};
    try {
      const chess = new Chess(fen);
      const history = chess.history({ verbose: true });
      const last = history[history.length - 1];
      if (!last) return {};
      return {
        [last.from]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' },
        [last.to]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' }
      };
    } catch {
      return {};
    }
  }, [fen, lastMove]);

  return (
    <div className="chess-board-viewer">
      <Chessboard
        position={position}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        customSquareStyles={customSquareStyles}
      />
    </div>
  );
};

export default ChessBoardViewer;
