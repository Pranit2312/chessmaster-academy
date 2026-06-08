import React, { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';

const ChessBoardViewer = ({ fen, orientation = 'white' }) => {
  const position = useMemo(() => fen || 'start', [fen]);

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
      />
    </div>
  );
};

export default ChessBoardViewer;
