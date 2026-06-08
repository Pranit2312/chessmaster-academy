const OpeningLibrary = require('../models/OpeningLibrary');

const OPENING_RECOMMENDATIONS = {
  beginner: {
    as_white: [
      { eco: 'C20', name: 'King\'s Pawn Game', reason: 'Simple and principled opening' },
      { eco: 'A00', name: 'Queen\'s Pawn Game', reason: 'Solid and easy to learn' }
    ],
    as_black_vs_e4: [
      { eco: 'B00', name: 'King\'s Pawn Game (Defense)', reason: 'Symmetrical and intuitive' }
    ],
    as_black_vs_d4: [
      { eco: 'A40', name: 'Queen\'s Pawn Game (Defense)', reason: 'Simple development' }
    ]
  },
  intermediate: {
    as_white: [
      { eco: 'C50', name: 'Italian Game', reason: 'Teaches key tactical and positional concepts' },
      { eco: 'D06', name: 'Queen\'s Gambit', reason: 'Strong central control and development' }
    ],
    as_black_vs_e4: [
      { eco: 'B10', name: 'Caro-Kann Defense', reason: 'Solid and counter-attacking' },
      { eco: 'C41', name: 'Philidor Defense', reason: 'Sound and strategic' }
    ],
    as_black_vs_d4: [
      { eco: 'D30', name: 'Queen\'s Gambit Declined', reason: 'Classic and reliable' },
      { eco: 'E00', name: 'Catalan Opening', reason: 'Flexible and modern' }
    ]
  },
  advanced: {
    as_white: [
      { eco: 'C80', name: 'Ruy Lopez', reason: 'Rich strategic battles' },
      { eco: 'E04', name: 'Catalan Opening', reason: 'Deep positional play' }
    ],
    as_black_vs_e4: [
      { eco: 'B90', name: 'Sicilian Najdorf', reason: 'Sharp and ambitious' },
      { eco: 'C11', name: 'French Defense', reason: 'Solid with counterplay' }
    ],
    as_black_vs_d4: [
      { eco: 'E15', name: 'Queen\'s Indian Defense', reason: 'Hypermodern and flexible' },
      { eco: 'D80', name: 'Gruenfeld Defense', reason: 'Dynamic and aggressive' }
    ]
  }
};

async function getOpeningRecommendations(skillLevel) {
  const level = skillLevel?.toLowerCase() || 'beginner';
  const recs = OPENING_RECOMMENDATIONS[level] || OPENING_RECOMMENDATIONS.beginner;

  const result = { as_white: [], as_black_vs_e4: [], as_black_vs_d4: [] };

  for (const [key, openings] of Object.entries(recs)) {
    for (const opening of openings) {
      const full = await OpeningLibrary.findOne({ ecoCode: opening.eco }).lean();
      result[key].push({
        ecoCode: opening.eco,
        name: full?.name || opening.name,
        reason: opening.reason,
        description: full?.description?.slice(0, 200) || '',
        complexity: full?.complexity || 'Moderate',
        popularity: full?.popularity || 'Popular',
        openingType: full?.openingType || '',
        statistics: full?.statistics || null,
        tags: full?.tags || []
      });
    }
  }

  return result;
}

function getSkillLevelFromRating(rating) {
  if (!rating || rating < 800) return 'beginner';
  if (rating < 1400) return 'intermediate';
  if (rating < 2000) return 'advanced';
  return 'expert';
}

async function analyzeUserOpenings(analyses) {
  const openingStats = {};

  for (const analysis of analyses) {
    if (!analysis.opening?.name) continue;
    const name = analysis.opening.name;

    if (!openingStats[name]) {
      openingStats[name] = {
        name,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalAccuracy: 0,
        bestAccuracy: 0
      };
    }

    openingStats[name].gamesPlayed++;
    openingStats[name].totalAccuracy += analysis.summary?.whiteAccuracy || 0;

    const gameResult = analysis.pgn?.match(/\{([^}]*)\}\s*$/)?.[1] || '';
    if (gameResult.includes('1-0')) {
      openingStats[name].wins++;
    } else if (gameResult.includes('0-1')) {
      openingStats[name].losses++;
    } else if (gameResult.includes('1/2')) {
      openingStats[name].draws++;
    }
  }

  for (const key of Object.keys(openingStats)) {
    const stat = openingStats[key];
    stat.averageAccuracy = Math.round(stat.totalAccuracy / stat.gamesPlayed);
    stat.winRate = Math.round((stat.wins / stat.gamesPlayed) * 100);
  }

  return Object.values(openingStats).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}

module.exports = {
  getOpeningRecommendations,
  getSkillLevelFromRating,
  analyzeUserOpenings
};
