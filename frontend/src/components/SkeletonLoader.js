import React from 'react';

/**
 * SkeletonLoader — lightweight shimmer placeholder
 *
 * Usage:
 *   <SkeletonLoader type="table" rows={5} />
 *   <SkeletonLoader type="card" />
 *   <SkeletonLoader type="stat" count={4} />
 *   <SkeletonLoader type="list" rows={3} />
 */
export default function SkeletonLoader({ type = 'card', rows = 4, count = 3 }) {
  if (type === 'table') {
    return (
      <div className="table-wrap" style={{ padding: 0 }}>
        {/* fake header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 2fr 1fr 1fr 1fr',
          gap: 16,
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}>
          {['40px', '120px', '80px', '80px', '80px'].map((w, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: w, height: 12 }} />
          ))}
        </div>
        {/* fake rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '80px 2fr 1fr 1fr 1fr',
            gap: 16,
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            alignItems: 'center',
          }}>
            <div className="skeleton" style={{ width: 40, height: 12, borderRadius: 4 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 6 }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: 10 }} />
              </div>
            </div>
            {[1, 2, 3].map(j => (
              <div key={j} className="skeleton skeleton-text" style={{ width: '70%' }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 14 }} />
            <div className="skeleton skeleton-title" style={{ width: '40%', height: 32, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '33%', height: 10 }} />
            </div>
            <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 20 }} />
          </div>
        ))}
      </div>
    );
  }

  // Default: card skeleton
  return (
    <div className="skeleton-card" style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
      <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: 20 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${100 - i * 10}%`, marginBottom: 10 }} />
      ))}
    </div>
  );
}
