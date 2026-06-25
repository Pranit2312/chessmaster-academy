import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './PuzzleBoard.css';

function toSquare(row, col) {
  return 'abcdefgh'[col] + (row + 1);
}

function getSideFromFen(fen) {
  if (!fen) return 'w';
  return fen.split(' ')[1] || 'w';
}

const PuzzleBoard = ({
  puzzle,
  fen: fenProp,
  solution: solutionProp = [],
  onMove,
  onComplete,
  boardWidth = 400,
  showSolution,
  newPuzzleTrigger,
  hintData
}) => {
  // Advance one move so the user plays the winning side (opponent of the FEN's side-to-move)
  const { fen, solution } = useMemo(() => {
    const rawFen = puzzle?.fen ?? fenProp;
    const rawSolution = puzzle?.solution ?? solutionProp;
    if (rawSolution.length > 1) {
      try {
        const g = new Chess(rawFen);
        g.move(rawSolution[0], { sloppy: true });
        return { fen: g.fen(), solution: rawSolution.slice(1) };
      } catch {}
    }
    return { fen: rawFen, solution: rawSolution };
  }, [puzzle, fenProp, solutionProp]);

  const [moveIndex, setMoveIndex] = useState(0);
  const [moveHistory, setMoveHistory] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [inputError, setInputError] = useState(null);
  const [notationPairs, setNotationPairs] = useState([]);
  const onMoveRef = useRef(onMove);
  const onCompleteRef = useRef(onComplete);
  onMoveRef.current = onMove;
  onCompleteRef.current = onComplete;

  function resetBoard() {
    setMoveIndex(0);
    setMoveHistory([]);
    setCompleted(false);
    setSelectedSquare(null);
    setNotationPairs([]);
    setInputError(null);
  }

  // Reset when puzzle changes
  useEffect(() => {
    resetBoard();
  }, [fen, newPuzzleTrigger]);

  // Live game derived from fen + moveIndex (no stale state)
  const liveGame = useMemo(() => {
    try {
      const g = new Chess(fen);
      for (let i = 0; i < moveIndex; i++) {
        try { g.move(solution[i], { sloppy: true }); } catch { break; }
      }
      return g;
    } catch {
      return new Chess();
    }
  }, [fen, solution, moveIndex]);

  const sideToMove = liveGame.turn();
  const boardOrientation = 'white'; // always white at bottom; label shows who is to move
  const inCheck = liveGame.isCheck();
  const inCheckmate = liveGame.isCheckmate();

  // King square for check highlight
  const kingSquare = useMemo(() => {
    if (!inCheck) return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = toSquare(r, c);
        const p = liveGame.get(sq);
        if (p && p.type === 'k' && p.color === sideToMove) return sq;
      }
    }
    return null;
  }, [liveGame, sideToMove, inCheck]);

  // Clear error after 2s
  useEffect(() => {
    if (!inputError) return;
    const t = setTimeout(() => setInputError(null), 2000);
    return () => clearTimeout(t);
  }, [inputError]);

  // Expected SAN at current move index
  const expectedSan = useMemo(() => {
    if (moveIndex >= solution.length) return null;
    try {
      const g = new Chess(liveGame.fen());
      const m = g.move(solution[moveIndex], { sloppy: true });
      return m.san;
    } catch {
      try {
        const raw = solution[moveIndex];
        const g2 = new Chess(liveGame.fen());
        const from = raw.slice(0, 2);
        const to = raw.slice(2, 4);
        const prom = raw.length > 4 ? raw[4] : undefined;
        const m = g2.move({ from, to, promotion: prom || 'q' });
        return m.san;
      } catch {
        return solution[moveIndex];
      }
    }
  }, [liveGame, solution, moveIndex]);

  // Promotion piece from solution at current move index
  const expectedPromotion = useMemo(() => {
    if (moveIndex >= solution.length) return 'q';
    const raw = solution[moveIndex];
    if (raw.length > 4) return raw[4];
    return 'q';
  }, [solution, moveIndex]);

  // Track initial side to determine notation column ordering
  const initialSide = useMemo(() => getSideFromFen(fen), [fen]);

  const addNotationPair = useCallback((userSan, oppSan) => {
    setNotationPairs(prev => {
      const newPairs = prev.map(p => ({ ...p }));
      if (initialSide === 'w') {
        newPairs.push({ white: userSan, black: oppSan || '' });
        return newPairs;
      }
      // Black-first: user plays Black, opp plays White
      if (newPairs.length > 0 && !newPairs[newPairs.length - 1].black) {
        newPairs[newPairs.length - 1].black = userSan;
      } else {
        newPairs.push({ white: '', black: userSan });
      }
      if (oppSan) {
        newPairs.push({ white: oppSan, black: '' });
      }
      return newPairs;
    });
  }, [initialSide]);

  const processMove = useCallback((from, to, promotion) => {
    if (completed) return false;
    if (moveIndex >= solution.length) return false;

    const g = new Chess(liveGame.fen());
    let moveResult;
    try {
      moveResult = g.move({ from, to, promotion: promotion || expectedPromotion });
    } catch {
      setInputError('Illegal move');
      return false;
    }

    const expected = expectedSan;
    if (!expected || moveResult.san !== expected) {
      setInputError('Incorrect move');
      return false;
    }

    console.log(`[PuzzleBoard] Correct: ${moveResult.san} (move ${moveIndex + 1}/${solution.length})`);

    // Correct! Advance game
    let newIndex = moveIndex + 1;
    let newHistory = [...moveHistory, moveResult.san];
    let oppSan = '';

    // Auto-play opponent response
    if (newIndex < solution.length) {
      try {
        const oppGame = new Chess(g.fen());
        const oppResult = oppGame.move(solution[newIndex], { sloppy: true });
        if (oppResult) {
          oppSan = oppResult.san;
          newHistory = [...newHistory, oppSan];
          newIndex++;
          console.log(`[PuzzleBoard] Opponent: ${oppSan} (move ${newIndex}/${solution.length})`);
        }
      } catch {}
    }

    addNotationPair(moveResult.san, oppSan);
    setMoveIndex(newIndex);
    setMoveHistory(newHistory);
    setSelectedSquare(null);

    if (onMoveRef.current) onMoveRef.current(moveResult.san);

    if (newIndex >= solution.length) {
      setCompleted(true);
      if (onCompleteRef.current) onCompleteRef.current(moveResult.san);
    }

    return true;
  }, [completed, moveIndex, liveGame, expectedSan, expectedPromotion, moveHistory, addNotationPair, solution]);

  const handlePieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    return processMove(sourceSquare, targetSquare, 'q');
  }, [processMove]);

  const handleSquareClickLocal = useCallback((square) => {
    if (completed) return;
    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      processMove(selectedSquare, square, 'q');
      return;
    }
    const piece = liveGame.get(square);
    if (piece && piece.color === sideToMove) {
      setSelectedSquare(square);
    }
  }, [liveGame, selectedSquare, sideToMove, completed, processMove]);

  // Custom square styles
  const squareStyles = useMemo(() => {
    const styles = {};

    // Last move highlight
    if (moveHistory.length > 0) {
      try {
        const g = new Chess(fen);
        for (let i = 0; i < moveHistory.length; i++) {
          const m = g.move(moveHistory[i], { sloppy: true });
          if (i === moveHistory.length - 1) {
            styles[m.from] = { backgroundColor: 'rgba(155, 199, 0, 0.41)' };
            styles[m.to] = { backgroundColor: 'rgba(155, 199, 0, 0.41)' };
          }
        }
      } catch {}
    }

    // Selected square + legal moves
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        boxShadow: 'inset 0 0 0 3px #1876d2'
      };
      try {
        const legal = liveGame.moves({ square: selectedSquare, verbose: true });
        for (const m of legal) {
          if (liveGame.get(m.to)) {
            styles[m.to] = {
              boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.3)',
              borderRadius: '0'
            };
          } else {
            styles[m.to] = {
              background: 'radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)'
            };
          }
        }
      } catch {}
    }

    // Check highlight
    if (kingSquare) {
      styles[kingSquare] = {
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        boxShadow: 'inset 0 0 0 3px #ff0000'
      };
    }

    // Solution highlight
    if (showSolution && expectedSan) {
      try {
        const legal = liveGame.moves({ verbose: true });
        const expectedMove = legal.find(m => m.san === expectedSan);
        if (expectedMove) {
          styles[expectedMove.to] = {
            ...(styles[expectedMove.to] || {}),
            backgroundColor: 'rgba(0, 255, 0, 0.3)'
          };
        }
      } catch {}
    }

    // Hint highlights (3-level Lichess-style)
    if (hintData && !completed) {
      if (hintData.level >= 1 && hintData.from) {
        styles[hintData.from] = {
          ...(styles[hintData.from] || {}),
          backgroundColor: 'rgba(255, 215, 0, 0.5)',
          boxShadow: 'inset 0 0 0 3px #ffd700'
        };
      }
      if (hintData.level >= 2 && hintData.to) {
        styles[hintData.to] = {
          ...(styles[hintData.to] || {}),
          backgroundColor: 'rgba(255, 215, 0, 0.3)',
          boxShadow: 'inset 0 0 0 3px rgba(255, 215, 0, 0.6)'
        };
      }
    }

    return styles;
  }, [liveGame, selectedSquare, moveHistory, fen, kingSquare, showSolution, expectedSan, hintData, completed]);

  const isDraggablePiece = useCallback(({ piece }) => {
    if (completed) return false;
    return piece[0] === sideToMove;
  }, [sideToMove, completed]);

  const label = sideToMove === 'w' ? 'White to move' : 'Black to move';

  return (
    <div className="puzzle-board-wrapper">
      <div className="puzzle-board-header">
        {!completed && (
          <span className={`side-to-move ${sideToMove === 'w' ? 'white-turn' : 'black-turn'}`}>
            <span className="turn-pip" />
            {label}
            <span className="turn-indicator">&#9654;</span>
          </span>
        )}
        {inCheck && !completed && <span className="indicator check-badge">&#9888; Check</span>}
        {inCheckmate && !completed && <span className="indicator checkmate-badge">&#10008; Checkmate</span>}
        {completed && <span className="indicator solved-badge">&#10004; Solved</span>}
        {inputError && <span className="indicator error-badge">{inputError}</span>}
      </div>

      <div className="chessboard-container">
        <Chessboard
          id="puzzle-board"
          position={liveGame.fen()}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClickLocal}
          customSquareStyles={squareStyles}
          isDraggablePiece={isDraggablePiece}
          arePiecesDraggable={!completed}
          animationDuration={200}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        />
      </div>

      {notationPairs.length > 0 && (
        <div className="puzzle-notation">
          {notationPairs.map((p, i) => (
            <span key={i} className="notation-row">
              <span className="notation-num">{i + 1}.</span>
              <span className="notation-move white-move">{p.white || '...'}</span>
              <span className="notation-move black-move">{p.black || ''}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PuzzleBoard;
