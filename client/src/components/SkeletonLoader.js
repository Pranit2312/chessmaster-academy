import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  if (type === 'text') {
    return (
      <div style={{ padding: '16px 0' }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text skeleton-text-sm" />
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div style={{ padding: '24px' }}>
        <div className="skeleton skeleton-title" style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div>
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          </div>
          <div>
            <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton skeleton-avatar" style={{ width: 80, height: 80, margin: '0 auto 16px' }} />
        <div className="skeleton skeleton-title" style={{ margin: '0 auto 12px' }} />
        <div className="skeleton skeleton-text skeleton-text-sm" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  // Default: card grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
};

export default SkeletonLoader;
