const { Chess } = require('chess.js');

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/**
 * Normalize shorthand PGN input.
 */
function normalizePgnInput(raw) {
  let pgn = (raw || '').trim();
  if (!pgn) return pgn;

  pgn = pgn.replace(
    /([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)\s*-\s*(?=[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8]|O-O)/gi,
    '$1 '
  );

  if (!/\d+\./.test(pgn) && /[a-h1-8NBRQKOx=+#\s]/i.test(pgn)) {
    pgn = `1. ${pgn}`;
  }

  return pgn;
}

/**
 * Parse PGN and extract game metadata + move list.
 */
function parsePgn(pgn) {
  const trimmed = normalizePgnInput(pgn);
  if (!trimmed) {
    throw new Error('PGN content is required');
  }

  const chess = new Chess();
  try {
    chess.loadPgn(trimmed, { sloppy: true });
  } catch (error) {
    throw new Error(
      `${error.message}. Use standard format like: 1. e4 e5 2. Nf3 Nc6`
    );
  }

  const header = chess.header();
  const history = chess.history({ verbose: true });

  if (history.length === 0) {
    throw new Error('PGN contains no moves');
  }

  return {
    whitePlayer: header.White || 'White',
    blackPlayer: header.Black || 'Black',
    event: header.Event || '',
    site: header.Site || '',
    date: header.Date || '',
    moves: history,
    finalFen: chess.fen()
  };
}

/**
 * Material-based evaluation in centipawns (white perspective).
 */
function evaluateMaterial(fen) {
  const chess = new Chess(fen);
  let score = 0;

  chess.board().forEach((row) => {
    row.forEach((piece) => {
      if (!piece) return;
      const value = PIECE_VALUES[piece.type] || 0;
      score += piece.color === 'w' ? value : -value;
    });
  });

  return score;
}

/**
 * One-ply best move search using material evaluation.
 */
function findBestMove(fen) {
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    return { bestMove: null, bestMoveEval: evaluateMaterial(fen) };
  }

  const isWhite = chess.turn() === 'w';
  let bestMove = null;
  let bestEval = isWhite ? -Infinity : Infinity;

  for (const move of chess.moves({ verbose: true })) {
    chess.move(move);
    const evalScore = evaluateMaterial(chess.fen());
    chess.undo();

    if (isWhite) {
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
    } else if (evalScore < bestEval) {
      bestEval = evalScore;
      bestMove = move;
    }
  }

  return {
    bestMove: bestMove ? bestMove.san : null,
    bestMoveEval: bestEval,
    bestMoveUci: bestMove ? `${moveToUci(bestMove)}` : null
  };
}

function moveToUci(move) {
  const promo = move.promotion ? move.promotion : '';
  return `${move.from}${move.to}${promo}`;
}

/**
 * Classify move quality based on centipawn loss for the side that moved.
 */
function classifyMove(evalBefore, evalAfter, isWhiteMove) {
  const loss = isWhiteMove
    ? evalBefore - evalAfter
    : evalAfter - evalBefore;

  if (loss < 0) {
    return { isMistake: false, mistakeType: null, lossOfEval: 0 };
  }

  if (loss >= 300) {
    return { isMistake: true, mistakeType: 'Blunder', lossOfEval: loss };
  }
  if (loss >= 100) {
    return { isMistake: true, mistakeType: 'Mistake', lossOfEval: loss };
  }
  if (loss >= 50) {
    return { isMistake: true, mistakeType: 'Inaccuracy', lossOfEval: loss };
  }

  return { isMistake: false, mistakeType: null, lossOfEval: loss };
}

/**
 * Accuracy % from average centipawn loss (lichess-style approximation).
 */
function accuracyFromAvgLoss(avgLoss) {
  const accuracy = 103.1668 * Math.exp(-0.04354 * (avgLoss || 0)) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

module.exports = {
  normalizePgnInput,
  parsePgn,
  evaluateMaterial,
  findBestMove,
  classifyMove,
  accuracyFromAvgLoss,
  Chess
};
