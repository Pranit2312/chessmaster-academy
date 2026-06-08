import React from 'react';

const THEME_COLORS = {
  'Open Game': '#3b82f6',
  'Semi-Open Game': '#8b5cf6',
  'Closed Game': '#f97316',
  'Semi-Closed Game': '#06b6d4',
  'Irregular': '#ef4444'
};

const OpeningTreeView = ({ openings, onSelect, selectedEco }) => {
  const grouped = (openings || []).reduce((acc, op) => {
    const type = op.openingType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(op);
    return acc;
  }, {});

  return (
    <div className="opening-tree-view">
      {Object.entries(grouped).map(([type, ops]) => (
        <div key={type} className="opening-group">
          <div className="opening-group-header" style={{ borderLeftColor: THEME_COLORS[type] || '#94a3b8' }}>
            <span className="opening-group-type">{type}</span>
            <span className="opening-group-count">{ops.length} openings</span>
          </div>
          <div className="opening-group-list">
            {ops.map(op => (
              <div
                key={op._id || op.ecoCode}
                className={`opening-item ${selectedEco === op.ecoCode ? 'opening-item-active' : ''}`}
                onClick={() => onSelect && onSelect(op.ecoCode)}
              >
                <div className="opening-item-main">
                  <span className="opening-eco">{op.ecoCode}</span>
                  <span className="opening-name">{op.name}</span>
                </div>
                <div className="opening-item-tags">
                  <span className={`tag tag-${(op.complexity || '').toLowerCase().replace(' ', '-')}`}>
                    {op.complexity || 'N/A'}
                  </span>
                  <span className={`tag tag-${(op.popularity || '').toLowerCase().replace(' ', '-')}`}>
                    {op.popularity || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OpeningTreeView;
