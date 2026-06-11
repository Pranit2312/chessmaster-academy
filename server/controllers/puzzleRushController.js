const Puzzle = require('../models/Puzzle');
const PuzzleRush = require('../models/PuzzleRush');
const PuzzleProfile = require('../models/PuzzleProfile');
const puzzleApi = require('../services/puzzleApiService');
const { Chess } = require('chess.js');

const TIME_LIMITS = { '3min': 180, '5min': 300, 'survival': Infinity };

const RUSH_FALLBACK = [
  { _id: 'rush-fb-1', puzzleId: 'rush-fb-1', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', solution: ['Nxe5'], themes: ['fork'], rating: 800, difficulty: 'easy', playerSide: 'w' },
  { _id: 'rush-fb-2', puzzleId: 'rush-fb-2', fen: 'r1bq1rk1/pppp1ppp/2n5/2b1P3/2B5/5N2/PPPP1PPP/RNBQ1RK1 b - - 0 5', solution: ['Nxe5'], themes: ['checkmate'], rating: 600, difficulty: 'easy', playerSide: 'b' },
  { _id: 'rush-fb-3', puzzleId: 'rush-fb-3', fen: 'rnbqkb1r/pppppppp/5n2/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2', solution: ['Nd5'], themes: ['tactic'], rating: 400, difficulty: 'beginner', playerSide: 'b' },
];

exports.startRush = async (req, res) => {
  try {
    const { mode = '3min' } = req.body;

    if (!TIME_LIMITS[mode]) {
      return res.status(400).json({ success: false, message: 'Invalid mode. Use: 3min, 5min, survival' });
    }

    const active = await PuzzleRush.findOne({ user: req.user._id, status: 'active' });
    if (active) {
      active.status = 'abandoned';
      await active.save();
    }

    const session = await PuzzleRush.create({
      user: req.user._id,
      mode,
      status: 'active',
      startedAt: new Date(),
      timeLimitSeconds: TIME_LIMITS[mode],
      remainingSeconds: TIME_LIMITS[mode]
    });

    const puzzle = await getNextRushPuzzle(1200);
    const timeLeft = mode === 'survival' ? null : TIME_LIMITS[mode];

    res.json({
      success: true,
      session: {
        _id: session._id,
        mode: session.mode,
        score: 0,
        totalPuzzles: 0,
        correctCount: 0,
        status: session.status,
        timeLimitSeconds: session.timeLimitSeconds,
        remainingSeconds: timeLeft
      },
      puzzle: puzzle || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.nextPuzzle = async (req, res) => {
  try {
    const { sessionId, previousResult } = req.body;
    const session = await PuzzleRush.findOne({ _id: sessionId, user: req.user._id });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'active') return res.json({ success: false, message: 'Session ended', ended: true });

    if (previousResult) {
      const puzzle = await Puzzle.findOne({ puzzleId: previousResult.puzzleId }).lean();
      const correct = previousResult.correct;
      const time = previousResult.time || 0;

      session.addPuzzle(puzzle || { puzzleId: previousResult.puzzleId, rating: 1200, themes: ['tactic'] }, correct, time, previousResult.move);

      if (session.mode !== 'survival' && session.remainingSeconds !== undefined) {
        session.remainingSeconds = Math.max(0, session.remainingSeconds - (time / 1000));
        if (session.remainingSeconds <= 0) {
          session.status = 'completed';
          session.completedAt = new Date();
          await session.save();
          await updateProfileBest(req.user._id, session);
          return res.json({ success: true, ended: true, session });
        }
      }

      if (!correct && session.mode === 'survival') {
        session.status = 'completed';
        session.completedAt = new Date();
        await session.save();
        await updateProfileBest(req.user._id, session);
        return res.json({ success: true, ended: true, session });
      }

      await session.save();
    }

    const targetRating = calculateTargetRating(session);
    const puzzle = await getNextRushPuzzle(targetRating);

    if (!puzzle) {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();
      await updateProfileBest(req.user._id, session);
      return res.json({ success: true, ended: true, session });
    }

    res.json({
      success: true,
      puzzle,
      session: {
        _id: session._id,
        mode: session.mode,
        score: session.score,
        totalPuzzles: session.totalPuzzles,
        correctCount: session.correctCount,
        accuracy: session.accuracy,
        status: session.status,
        remainingSeconds: session.remainingSeconds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endRush = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await PuzzleRush.findOne({ _id: sessionId, user: req.user._id });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();
    await updateProfileBest(req.user._id, session);

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { mode = '3min', limit = 20 } = req.query;

    const topScores = await PuzzleRush.aggregate([
      { $match: { mode, status: 'completed' } },
      { $sort: { score: -1 } },
      { $group: { _id: '$user', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          score: 1,
          accuracy: 1,
          totalPuzzles: 1,
          mode: 1,
          'user.name': 1
        }
      }
    ]);

    res.json({ success: true, leaderboard: topScores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const sessions = await PuzzleRush.find({ user: req.user._id, status: 'completed' })
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function getNextRushPuzzle(targetRating) {
  const range = 300;
  const dbPuzzles = await Puzzle.aggregate([
    {
      $match: {
        isActive: true,
        rating: {
          $gte: Math.max(200, targetRating - range),
          $lte: Math.min(3500, targetRating + range)
        }
      }
    },
    { $sample: { size: 1 } },
    { $limit: 1 }
  ]);
  if (dbPuzzles[0]) return dbPuzzles[0];

  const filtered = RUSH_FALLBACK.filter(p =>
    p.rating >= Math.max(200, targetRating - range) &&
    p.rating <= Math.min(3500, targetRating + range)
  );
  if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];

  return RUSH_FALLBACK[Math.floor(Math.random() * RUSH_FALLBACK.length)] || null;
}

function calculateTargetRating(session) {
  const base = 1200;
  const correct = session.correctCount || 0;
  const total = session.totalPuzzles || 1;
  const accuracy = correct / total;

  if (accuracy > 0.8) return base + 400;
  if (accuracy > 0.6) return base + 200;
  if (accuracy < 0.3) return base - 200;
  return base;
}

async function updateProfileBest(userId, session) {
  try {
    const profile = await PuzzleProfile.findOne({ user: userId });
    if (profile) {
      if (session.score > profile.rushBestScore) {
        profile.rushBestScore = session.score;
      }
      if (session.accuracy > profile.rushBestAccuracy) {
        profile.rushBestAccuracy = session.accuracy;
      }
      await profile.save();
    }
  } catch {}
}
