import React from 'react';
import { formatEval, mistakeBadgeClass } from '../../utils/pgnHelpers';

const MoveListPanel = ({ moves = [], currentIndex, onSelectMove }) => {
  if (!moves.length) {
    return <p className="empty-state">No moves analyzed yet.</p>;
  }

  return (
    <div className="move-list-panel">
      {moves.map((move, index) => (
        <button
          key={`${move.moveNumber}-${move.san}-${index}`}
          type="button"
          className={`move-item ${index === currentIndex ? 'active' : ''} ${
            move.isMistake ? 'has-mistake' : ''
          }`}
          onClick={() => onSelectMove(index)}
        >
          <span className="move-number">
            {index % 2 === 0 ? `${move.moveNumber}.` : '...'}
          </span>
          <span className="move-san">{move.san}</span>
          <span className="move-eval">{formatEval(move.evaluationAfter)}</span>
          {move.isMistake && (
            <span className={`move-badge ${mistakeBadgeClass(move.mistakeType)}`}>
              {move.mistakeType}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default MoveListPanel;
