import React from 'react';

export const ChessKing = ({ size = 80, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,7)">
      <path d="M 22.5,2 L 22.5,7 M 20,5 L 25,5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 22.5,11 C 20.5,11 19,12.5 19,14.5 C 19,15.5 19.5,16.5 20,17 C 18.5,18.5 17,21 17,24 C 17,26 19,28 22.5,28 C 26,28 28,26 28,24 C 28,21 26.5,18.5 25,17 C 25.5,16.5 26,15.5 26,14.5 C 26,12.5 24.5,11 22.5,11 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11,29 C 15.5,33 29.5,33 34,29 L 34,23 C 34,23 40,19 37,14 C 34,10 27,11 24,16 L 22.5,22 L 21,16 C 18,11 11,10 8,14 C 5,19 11,23 11,23 L 11,29 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11.5,32 C 16.5,28.5 28.5,28.5 33.5,32" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </g>
  </svg>
);

export const ChessQueen = ({ size = 60, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,4)">
      <path d="M 22.5,2 L 22.5,6 M 20,4 L 25,4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 9,22 C 9,22 12,6 12,6 L 16,12 L 22.5,6 L 29,12 L 33,6 C 33,6 36,22 36,22 C 36,24 34,25 34,25 L 11,25 C 11,25 9,24 9,22 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11,26 C 15.5,30 29.5,30 34,26 L 34,30 C 34,32 32,33 32,33 L 13,33 C 13,33 11,32 11,30 L 11,26 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11,34 C 15.5,37.5 29.5,37.5 34,34" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </g>
  </svg>
);

export const ChessRook = ({ size = 50, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,5)">
      <path d="M 9,34 L 36,34 L 36,30 L 9,30 L 9,34 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11,30 L 11,12 L 16,12 L 16,17 L 22,17 L 22,12 L 28,12 L 28,17 L 34,17 L 34,12 L 36,12 L 36,30" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 11,10 L 11,6 L 34,6 L 34,10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </g>
  </svg>
);

export const ChessKnight = ({ size = 50, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,4)">
      <path d="M 22,8 C 30,9 35,13 35,22 C 35,24 34,25 33,26 L 30,30 L 12,30 L 12,28 C 12,28 16,26 17,24 C 18,22 17,20 16,18 C 15,16 14,15 14,13 C 14,11 15,9 17,8 C 19,7 21,7 22,8 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 16,10 C 15,12 14,14 14,16 C 14,18 15,20 17,21 L 22,18 L 20,14 L 16,10 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 10,34 L 35,34 L 35,30 L 10,30 L 10,34 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </g>
  </svg>
);

export const ChessBishop = ({ size = 50, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,5)">
      <path d="M 22.5,2 L 22.5,6 M 20,4 L 25,4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 15,22 C 15,24 17,25 19,25 C 21,25 21,22 22,22 C 23,22 24,25 26,25 C 28,25 30,24 30,22 C 30,20 27,14 24,10 C 23,8 22,6 22,6 C 22,6 22,8 21,10 C 18,14 15,20 15,22 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 12,27 C 16,31 29,31 33,27 L 33,30 C 33,32 30,34 30,34 L 15,34 C 15,34 12,32 12,30 L 12,27 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 12,35 C 16.5,38.5 28.5,38.5 33,35" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </g>
  </svg>
);

export const ChessPawn = ({ size = 40, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <g transform="translate(0,7)">
      <path d="M 22.5,2 C 20,2 18,4 18,7 C 18,9 19,10 20,11 C 18,13 16,16 16,19 C 16,22 18,24 22.5,24 C 27,24 29,22 29,19 C 29,16 27,13 25,11 C 26,10 27,9 27,7 C 27,4 25,2 22.5,2 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 12,30 L 33,30 L 33,26 L 12,26 L 12,30 z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </g>
  </svg>
);

export const ChessBoard = ({ size = 60, className = '' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
    <rect x="5" y="5" width="35" height="35" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <g stroke="currentColor" strokeWidth="0.5" opacity="0.6">
      {[0,1,2,3,4,5,6,7].map(r => 
        [0,1,2,3,4,5,6,7].map(c => 
          (r+c) % 2 === 0 ? null : (
            <rect key={`${r}-${c}`} x={5 + c*4.375} y={5 + r*4.375} width="4.375" height="4.375" fill="currentColor"/>
          )
        )
      )}
    </g>
  </svg>
);
