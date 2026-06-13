const {
  normalizePgnInput,
  parsePgn,
  classifyMove,
  accuracyFromAvgLoss,
  Chess
} = require('./pgnParserService');
const { analyzeFen } = require('./stockfishEngine');
const logger = require('../utils/logger');

const DEFAULT_DEPTH = parseInt(process.env.ANALYSIS_MAX_DEPTH, 10) || 10;
const MAX_ANALYSIS_TIME = parseInt(process.env.MAX_ANALYSIS_TIME || '180000', 10);

/**
 * Analyze a full game with Stockfish WASM engine.
 */
async function analyzeGame(pgn, options = {}) {
  const startTime = Date.now();
  const requestedDepth = options.depth || DEFAULT_DEPTH;
  const normalizedPgn = normalizePgnInput(pgn);
  parsePgn(pgn);

  const chess = new Chess();
  chess.loadPgn(normalizedPgn, { sloppy: true });
  const verboseMoves = chess.history({ verbose: true });
  chess.reset();

  // Cap depth for long games to keep analysis practical
  const depth = verboseMoves.length > 50
    ? Math.min(requestedDepth, 8)
    : Math.min(requestedDepth, 12);

  const analyzedMoves = [];
  let whiteLossTotal = 0;
  let blackLossTotal = 0;
  let whiteMoveCount = 0;
  let blackMoveCount = 0;
  let inaccuracies = 0;
  let mistakes = 0;
  let blunders = 0;

  for (let i = 0; i < verboseMoves.length; i++) {
    if (Date.now() - startTime > MAX_ANALYSIS_TIME) {
      logger.warn(`Analysis timed out after ${MAX_ANALYSIS_TIME}ms at move ${i}/${verboseMoves.length}`);
      break;
    }
    const move = verboseMoves[i];
    const fenBefore = chess.fen();
    const isWhiteMove = move.color === 'w';

    const beforeAnalysis = await analyzeFen(fenBefore, depth);
    const evalBefore = beforeAnalysis.evalCp;

    chess.move(move);
    const fenAfter = chess.fen();

    const afterAnalysis = await analyzeFen(fenAfter, depth);
    const evalAfter = afterAnalysis.evalCp;

    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;
    const isBestMove = beforeAnalysis.bestMoveUci === playedUci;

    const classification = isBestMove
      ? { isMistake: false, mistakeType: null, lossOfEval: 0 }
      : classifyMove(evalBefore, evalAfter, isWhiteMove);

    if (classification.isMistake) {
      if (classification.mistakeType === 'Blunder') blunders++;
      else if (classification.mistakeType === 'Mistake') mistakes++;
      else inaccuracies++;
    }

    if (isWhiteMove) {
      whiteLossTotal += Math.max(0, classification.lossOfEval);
      whiteMoveCount++;
    } else {
      blackLossTotal += Math.max(0, classification.lossOfEval);
      blackMoveCount++;
    }

    analyzedMoves.push({
      moveNumber: Math.ceil((i + 1) / 2),
      move: move.san,
      san: move.san,
      uci: playedUci,
      fen: fenAfter,
      evaluationBefore: evalBefore,
      evaluationAfter: evalAfter,
      bestMove: beforeAnalysis.bestMoveSan,
      bestMoveEval: beforeAnalysis.evalCp,
      isMistake: classification.isMistake,
      mistakeType: classification.mistakeType,
      lossOfEval: classification.lossOfEval,
      depth: beforeAnalysis.depth,
      topVariations: beforeAnalysis.pv.length
        ? [{ variation: beforeAnalysis.pv.slice(0, 5), evaluation: beforeAnalysis.evalCp }]
        : []
    });
  }

  const parsed = parsePgn(pgn);
  const totalMoves = analyzedMoves.length;
  const openingEnd = Math.min(20, totalMoves);
  const middleEnd = Math.min(60, totalMoves);

  const phaseAccuracy = (start, end, isWhite) => {
    const slice = analyzedMoves.slice(start, end);
    if (slice.length === 0) return 100;

    let lossSum = 0;
    let count = 0;
    slice.forEach((m, idx) => {
      const globalIdx = start + idx;
      const whiteMove = globalIdx % 2 === 0;
      if (whiteMove === isWhite) {
        lossSum += Math.max(0, m.lossOfEval || 0);
        count++;
      }
    });

    return accuracyFromAvgLoss(count ? lossSum / count : 0);
  };

  const whiteAccuracy = accuracyFromAvgLoss(
    whiteMoveCount ? whiteLossTotal / whiteMoveCount : 0
  );
  const blackAccuracy = accuracyFromAvgLoss(
    blackMoveCount ? blackLossTotal / blackMoveCount : 0
  );

  return {
    whitePlayer: parsed.whitePlayer,
    blackPlayer: parsed.blackPlayer,
    event: parsed.event,
    site: parsed.site,
    date: parsed.date,
    depth,
    engine: 'Stockfish 15',
    moves: analyzedMoves,
    summary: {
      totalMoves,
      inaccuracies,
      mistakes,
      blunders,
      whiteAccuracy,
      blackAccuracy,
      averageDepth: depth
    },
    phaseAnalysis: {
      openingPhase: {
        moves: openingEnd,
        accuracy: (phaseAccuracy(0, openingEnd, true) + phaseAccuracy(0, openingEnd, false)) / 2
      },
      middleGamePhase: {
        moves: Math.max(0, middleEnd - openingEnd),
        accuracy: (phaseAccuracy(openingEnd, middleEnd, true) + phaseAccuracy(openingEnd, middleEnd, false)) / 2
      },
      endGamePhase: {
        moves: Math.max(0, totalMoves - middleEnd),
        accuracy: (phaseAccuracy(middleEnd, totalMoves, true) + phaseAccuracy(middleEnd, totalMoves, false)) / 2
      }
    },
    opening: {
      name: detectOpeningName(analyzedMoves),
      ecoCode: '',
      moves: Math.min(10, totalMoves)
    },
    analysisTime: Math.round((Date.now() - startTime) / 1000)
  };
}

function detectOpeningName(moves) {
  if (!moves.length) return 'Unknown';
  const firstMoves = moves.slice(0, 4).map((m) => m.san).join(' ');

  const openings = {
    'e4 e5': 'Open Game (Ruy Lopez family)',
    'e4 c5': 'Sicilian Defense',
    'e4 e6': 'French Defense',
    'e4 c6': 'Caro-Kann Defense',
    'd4 d5': "Queen's Gambit Declined",
    'd4 Nf6': 'Indian Defense',
    'Nf3 Nf6': 'Reti / Kings Indian setup'
  };

  for (const [prefix, name] of Object.entries(openings)) {
    if (firstMoves.startsWith(prefix)) return name;
  }

  return `Opening: ${firstMoves}`;
}

module.exports = {
  analyzeGame,
  DEFAULT_DEPTH
};
