const AiPuzzle = require('../models/AiPuzzle');
const { generatePuzzleFromAnalysis, generateDailyPuzzle } = require('../services/aiEngineService');
const { StockfishAnalysis } = require('../models/Analysis');
const { getDailyPuzzleFromLichess, syncPuzzlesFromLichess } = require('../services/lichessService');
const { Chess } = require('chess.js');
const mongoose = require('mongoose');

exports.getDailyPuzzle = async (req, res) => {
  try {
    let puzzle = await getDailyPuzzleFromLichess();
    if (!puzzle) {
      puzzle = await generateDailyPuzzle();
    }
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'No puzzle available' });
    }
    res.json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get daily puzzle', error: error.message });
  }
};

exports.getPuzzles = async (req, res) => {
  try {
    const { page = 1, limit = 12, difficulty, theme, ratingMin, ratingMax } = req.query;
    const query = { isActive: true };

    if (difficulty) query.difficulty = difficulty;
    if (theme) query.theme = theme;
    if (ratingMin || ratingMax) {
      query.rating = {};
      if (ratingMin) query.rating.$gte = parseInt(ratingMin);
      if (ratingMax) query.rating.$lte = parseInt(ratingMax);
    }

    const puzzles = await AiPuzzle.find(query)
      .sort({ rating: 1, timesSolved: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-solution')
      .lean();

    const total = await AiPuzzle.countDocuments(query);

    res.json({
      success: true,
      puzzles,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get puzzles', error: error.message });
  }
};

exports.getPuzzleById = async (req, res) => {
  try {
    const puzzle = await AiPuzzle.findById(req.params.id).lean();
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'Puzzle not found' });
    }

    res.json({ success: true, puzzle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get puzzle', error: error.message });
  }
};

exports.solvePuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    const { move } = req.body;

    const puzzle = await AiPuzzle.findById(id);
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'Puzzle not found' });
    }

    const chess = new Chess(puzzle.fen);
    const playerSide = puzzle.playerSide || chess.turn();

    let playerMove;
    try {
      playerMove = chess.move(move);
    } catch {
      const match = chess.moves().filter(m => m.toLowerCase().startsWith(move.toLowerCase()));
      if (match.length === 1) {
        playerMove = chess.move(match[0]);
      } else {
        return res.json({
          success: true,
          correct: false,
          message: 'Invalid move',
          hint: puzzle.hint || 'Try a different move'
        });
      }
    }

    const solution = puzzle.solution;
    const isCorrect = solution.length > 0 && playerMove.san === solution[0];

    if (isCorrect) {
      puzzle.timesSolved += 1;
      await puzzle.save();
    }

    res.json({
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Correct! Well done!' : 'Not quite. Try again!',
      san: playerMove.san,
      fen: chess.fen(),
      gameOver: chess.isGameOver(),
      hint: isCorrect ? null : (puzzle.hint || null)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check solution', error: error.message });
  }
};

exports.getPuzzleStats = async (req, res) => {
  try {
    const totalPuzzles = await AiPuzzle.countDocuments({ isActive: true });
    const byDifficulty = await AiPuzzle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    const byTheme = await AiPuzzle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$theme', count: { $sum: 1 } } }
    ]);

    const userSolved = await AiPuzzle.countDocuments({
      isActive: true,
      timesSolved: { $gt: 0 }
    });

    res.json({
      success: true,
      stats: {
        totalPuzzles,
        byDifficulty: byDifficulty.reduce((acc, d) => ({ ...acc, [d._id]: d.count }), {}),
        byTheme: byTheme.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
        userContributed: userSolved
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats', error: error.message });
  }
};

exports.syncLichessPuzzles = async (req, res) => {
  try {
    const count = await syncPuzzlesFromLichess(50);
    res.json({ success: true, synced: count, message: `Synced ${count} puzzles from Lichess` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sync Lichess puzzles', error: error.message });
  }
};

exports.generatePuzzles = async (req, res) => {
  try {
    const { analysisId } = req.body;

    const analysis = await StockfishAnalysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const puzzles = await generatePuzzleFromAnalysis(analysis, req.user._id);

    if (puzzles.length === 0) {
      return res.json({ success: true, puzzles: [], message: 'No tactical opportunities found in this game' });
    }

    const created = await AiPuzzle.insertMany(puzzles);

    res.json({
      success: true,
      puzzles: created,
      message: `Generated ${created.length} puzzles from your game`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate puzzles', error: error.message });
  }
};
