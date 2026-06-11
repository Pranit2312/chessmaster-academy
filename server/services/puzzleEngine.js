const Puzzle = require('../models/Puzzle');
const PuzzleProfile = require('../models/PuzzleProfile');

const K_FACTOR = 32;
const INITIAL_RATING = 1200;
const RATING_UPDATE_WIN = 1;
const RATING_UPDATE_LOSS = 0;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateRating(currentRating, opponentRating, score) {
  const expected = expectedScore(currentRating, opponentRating);
  return Math.round(currentRating + K_FACTOR * (score - expected));
}

function calculatePuzzleRatingUpdate(userRating, puzzleRating, correct) {
  const expected = expectedScore(userRating, puzzleRating);
  const score = correct ? RATING_UPDATE_WIN : RATING_UPDATE_LOSS;
  const delta = Math.round(K_FACTOR * (score - expected));
  return {
    userDelta: delta,
    puzzleDelta: correct ? -Math.round(delta / 2) : Math.round(delta / 2),
    newUserRating: userRating + delta,
    expectedScore: expected
  };
}

async function getOrCreateProfile(userId) {
  let profile = await PuzzleProfile.findOne({ user: userId });
  if (!profile) {
    profile = await PuzzleProfile.create({
      user: userId,
      puzzleRating: INITIAL_RATING
    });
  }
  return profile;
}

async function recordSolve(userId, puzzleObj, correct, timeMs) {
  const profile = await getOrCreateProfile(userId);

  const ratingUpdate = calculatePuzzleRatingUpdate(
    profile.puzzleRating,
    puzzleObj.rating,
    correct
  );

  profile.puzzleRating = Math.max(200, Math.min(3500, ratingUpdate.newUserRating));
  profile.recordSolve(puzzleObj, correct, timeMs);
  await profile.save();

  if (puzzleObj._id) {
    await Puzzle.updateOne(
      { _id: puzzleObj._id },
      { $inc: { solvedCount: correct ? 1 : 0 } }
    ).catch(() => {});
  }

  return {
    correct,
    ratingUpdate,
    profile: {
      puzzleRating: profile.puzzleRating,
      solvedCount: profile.solvedCount,
      accuracy: profile.accuracy,
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      averageSolveTime: profile.averageSolveTime
    }
  };
}

async function getRecommended(userId, limit = 10) {
  const profile = await getOrCreateProfile(userId);
  const weakThemes = profile.weakThemes || [];
  const targetRating = profile.puzzleRating;
  const range = 250;

  const match = { isActive: true };
  const orConditions = [];

  if (weakThemes.length > 0) {
    orConditions.push({ themes: { $in: weakThemes } });
  }

  const ratingRange = {
    rating: {
      $gte: Math.max(200, targetRating - range),
      $lte: Math.min(3500, targetRating + range)
    }
  };

  if (orConditions.length > 0) {
    match.$or = orConditions;
  }
  Object.assign(match, ratingRange);

  const solvedIds = (profile.puzzleHistory || [])
    .slice(-100)
    .map(h => h.puzzle);

  if (solvedIds.length > 0) {
    match._id = { $nin: solvedIds };
  }

  let puzzles = await Puzzle.aggregate([
    { $match: match },
    { $sample: { size: limit * 2 } },
    { $limit: limit * 2 }
  ]);

  if (puzzles.length < limit && weakThemes.length > 0) {
    const fallback = await Puzzle.aggregate([
      { $match: { isActive: true, ...ratingRange } },
      { $sample: { size: limit } },
      { $limit: limit }
    ]);
    puzzles = [...puzzles, ...fallback];
  }

  return puzzles.slice(0, limit);
}

async function getPuzzleOfTheDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seed = today.toISOString().slice(0, 10);

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const skip = Math.abs(hash);

  const count = await Puzzle.countDocuments({ isActive: true });
  if (count === 0) return null;

  const idx = skip % count;
  const puzzle = await Puzzle.findOne({ isActive: true }).skip(idx).lean();
  return puzzle;
}

async function getThemeStats(userId) {
  const profile = await getOrCreateProfile(userId);
  const stats = {};

  for (const [theme, data] of profile.themeStats) {
    stats[theme] = {
      attempted: data.attempted,
      correct: data.correct,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
      rating: data.rating
    };
  }

  return stats;
}

async function getGlobalStats() {
  const [total, byDifficulty, byTheme] = await Promise.all([
    Puzzle.countDocuments({ isActive: true }),
    Puzzle.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$rating', 1000] }, then: 'beginner' },
                { case: { $lte: ['$rating', 1300] }, then: 'easy' },
                { case: { $lte: ['$rating', 1700] }, then: 'medium' },
                { case: { $lte: ['$rating', 2100] }, then: 'hard' }
              ],
              default: 'expert'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Puzzle.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$themes' },
      { $group: { _id: '$themes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])
  ]);

  return {
    total,
    byDifficulty: byDifficulty.reduce((acc, d) => ({ ...acc, [d._id]: d.count }), {}),
    byTheme: byTheme.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {})
  };
}

async function getHint(fen) {
  try {
    const { analyzeFen } = require('./stockfishEngine');
    const result = await analyzeFen(fen, 18);
    if (result && result.bestMoveSan) {
      return {
        move: result.bestMoveSan,
        evaluation: result.evalCp,
        isMate: result.isMate,
        mateIn: result.mateIn
      };
    }
  } catch {}
  return null;
}

module.exports = {
  getOrCreateProfile,
  recordSolve,
  getRecommended,
  getPuzzleOfTheDay,
  getThemeStats,
  getGlobalStats,
  getHint,
  calculatePuzzleRatingUpdate,
  expectedScore,
  updateRating,
  INITIAL_RATING
};
