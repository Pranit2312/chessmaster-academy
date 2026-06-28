import React from 'react';

export const ChessKingSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M22.5 11.63V6" strokeLinejoin="miter" />
      <path d="M20 8h5" strokeLinecap="square" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="currentColor" strokeLinecap="baseline" strokeWidth={1.2} />
      <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="currentColor" stroke="#fff" strokeWidth={1.2} strokeLinecap="square" />
      <path d="M22.5 35l0 4" stroke="#fff" strokeWidth={1} strokeLinecap="square" />
      <path d="M20.5 38.5l4 0" stroke="#fff" strokeWidth={1} strokeLinecap="square" />
    </g>
  </svg>
);

export const ChessQueenSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M8 12c2 2 5 7 4.5 11.5 0 0-1.5 3-1 3.5s1.5 0 1.5 0-2 4-1 5c1 1 6-1 6-1s7 4 12 4 12-4 12-4 5 2 6 1 0-5 0-5 1 0 1.5 0 .5-3.5.5-3.5C32 19 35 14 37 12" fill="currentColor" />
      <path d="M22.5 10l3-3M22.5 10l-3-3M22.5 10l0-5" strokeLinecap="square" />
      <path d="M17.5 26l5 7 5-7" fill="none" />
      <circle cx="13" cy="12" r={2} fill="currentColor" />
      <circle cx="22.5" cy="9.5" r={2} fill="currentColor" />
      <circle cx="32" cy="12" r={2} fill="currentColor" />
      <path d="M11 38.5h23" fill="none" strokeLinecap="square" />
      <path d="M9.5 38.5c5.5-3.5 20.5-3.5 26 0" fill="none" />
    </g>
  </svg>
);

export const ChessRookSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M9 39h27v-3H9v3z" fill="currentColor" />
      <path d="M12.5 32l1.5-2.5h17l1.5 2.5h-20z" fill="currentColor" />
      <path d="M12 36v-4h21v4H12z" strokeLinecap="square" />
      <path d="M14 29.5v-13h17v13" strokeLinecap="square" />
      <path d="M14 16.5L11 14h23l-3 2.5" fill="currentColor" />
      <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <path d="M12 35.5h21" fill="none" />
    </g>
  </svg>
);

export const ChessKnightSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="currentColor" />
      <path d="M24 18c.38 2.91-2.55 4.03-5.5 4.5-1 .17-2 .1-2.5-.5.5 1 1.5 2 3 2.5 2 1 4.5.5 5.5-1.5 1-2 .5-4.5-.5-5z" fill="currentColor" />
      <path d="M9.5 25.5c1.5 2 3 3.5 5.5 4.5 2.5 1 4 2.5 4 5.5 0 1-.5 2-1.5 2.5-1 .5-2.5.5-3.5-.5-1-1-1-2.5-.5-3.5.5-1 1.5-1.5 2.5-1" />
      <path d="M22.5 10L9.5 17l-1 3.5 3.5.5 1-2 3-1.5" />
      <path d="M12 32.5C10 36 12 39 15 39h18c3 0 5-3 4-6" />
      <path d="M8 15l3 3 2-2" fill="none" strokeLinecap="square" />
    </g>
  </svg>
);

export const ChessBishopSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M15 32c0 0 0 6 7.5 6s7.5-6 7.5-6" fill="none" />
      <path d="M9 39h27" fill="none" strokeLinecap="square" />
      <path d="M22.5 17c-7 3-9 9-8 14 0 0 5-1 8-1s8 1 8 1c1-5-1-11-8-14z" fill="currentColor" />
      <path d="M22.5 13v5" />
      <path d="M22.5 9v4" />
      <path d="M21 10l3 0" />
      <path d="M15.5 20c3.5-2 8-2 12 0" fill="none" />
      <path d="M17.5 27c2.5-2 6-2 9 0" fill="none" />
      <path d="M14 32.5c3-1 8-1 10.5 0" fill="none" />
      <path d="M22.5 17c-7 3-9 9-8 14 0 0 5-1 8-1s8 1 8 1c1-5-1-11-8-14z" fill="none" stroke="#fff" strokeWidth={1.1} />
    </g>
  </svg>
);

export const ChessPawnSVG = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" className={className} fill="currentColor">
    <g style={{ opacity: 1, fill: 'none', fillOpacity: 1, fillRule: 'evenodd', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }}>
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="currentColor" />
    </g>
  </svg>
);
