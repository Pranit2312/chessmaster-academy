const axios = require('axios');
const { Chess } = require('chess.js');
const OpeningLibrary = require('../models/OpeningLibrary');
const logger = require('../utils/logger');

const LICHESS_MASTERS_URL = 'https://explorer.lichess.ovh/masters';
const REQUEST_TIMEOUT = 10000;

async function fetchLichessMoves(fen) {
  try {
    const { data } = await axios.get(LICHESS_MASTERS_URL, {
      params: { fen, topGames: 0, moves: 15 },
      timeout: REQUEST_TIMEOUT
    });
    return data;
  } catch (err) {
    logger.warn(`Lichess API error for fen=${fen}: ${err.message}`);
    return null;
  }
}

function fenAfterMoves(startingFen, moves) {
  const chess = new Chess(startingFen);
  for (const m of moves) {
    try { chess.move(m, { sloppy: true }); } catch { return null; }
  }
  return chess.fen();
}

async function deepenOpening(opening, targetDepth = 15) {
  const currentMoves = [...opening.moveSequence];
  if (currentMoves.length >= targetDepth) return { extended: 0, moves: currentMoves };

  let fen = opening.startingFen;
  let added = 0;

  for (let i = 0; i < currentMoves.length; i++) {
    const chess = new Chess(fen);
    try {
      chess.move(currentMoves[i], { sloppy: true });
      fen = chess.fen();
    } catch {
      return { extended: 0, moves: currentMoves, error: `Invalid move at index ${i}: ${currentMoves[i]}` };
    }
  }

  while (currentMoves.length < targetDepth) {
    const data = await fetchLichessMoves(fen);
    if (!data || !data.moves || data.moves.length === 0) break;

    const topMove = data.moves[0];
    if (!topMove || !topMove.uci) break;

    const chess = new Chess(fen);
    try {
      const uci = topMove.uci;
      const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
      if (!move) break;
      currentMoves.push(move.san);
      fen = chess.fen();
      added++;
    } catch {
      break;
    }
  }

  return { extended: added, moves: currentMoves };
}

async function deepenAllOpenings(targetDepth = 15) {
  const openings = await OpeningLibrary.find({}).lean();
  let totalExtended = 0;
  let totalOpenings = 0;

  for (const opening of openings) {
    const result = await deepenOpening(opening, targetDepth);
    if (result.extended > 0) {
      const newFen = fenAfterMoves(opening.startingFen, result.moves);
      await OpeningLibrary.updateOne(
        { _id: opening._id },
        {
          $set: {
            moveSequence: result.moves,
            currentFen: newFen || opening.currentFen,
            updatedAt: new Date()
          }
        }
      );
      totalExtended += result.extended;
      totalOpenings++;
    }
  }

  return { totalOpenings, totalExtended };
}

module.exports = { fetchLichessMoves, deepenOpening, deepenAllOpenings, fenAfterMoves };