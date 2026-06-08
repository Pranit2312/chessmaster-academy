const AiInsight = require('../models/AiInsight');
const StockfishAnalysis = require('../models/Analysis').StockfishAnalysis;
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const BotGame = require('../models/BotGame');

async function generateWeaknessInsights(userId) {
  const analyses = await StockfishAnalysis.find({ user: userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  if (analyses.length < 2) {
    return [];
  }

  const insights = [];
  const phaseAccuracies = { opening: [], middlegame: [], endgame: [] };
  let totalBlunders = 0;
  let totalMistakes = 0;
  let totalInaccuracies = 0;
  let totalMoves = 0;

  for (const a of analyses) {
    if (a.phaseAnalysis) {
      if (a.phaseAnalysis.openingPhase?.accuracy) phaseAccuracies.opening.push(a.phaseAnalysis.openingPhase.accuracy);
      if (a.phaseAnalysis.middleGamePhase?.accuracy) phaseAccuracies.middlegame.push(a.phaseAnalysis.middleGamePhase.accuracy);
      if (a.phaseAnalysis.endGamePhase?.accuracy) phaseAccuracies.endgame.push(a.phaseAnalysis.endGamePhase.accuracy);
    }
    const summary = a.summary || {};
    totalBlunders += summary.blunders || 0;
    totalMistakes += summary.mistakes || 0;
    totalInaccuracies += summary.inaccuracies || 0;
    totalMoves += summary.totalMoves || 0;
  }

  const avgByPhase = {};
  for (const [phase, accs] of Object.entries(phaseAccuracies)) {
    if (accs.length > 0) {
      avgByPhase[phase] = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
    }
  }

  const weakestPhase = Object.entries(avgByPhase)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => a - b)[0];

  if (weakestPhase) {
    const [phase, accuracy] = weakestPhase;
    const phaseLabel = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' }[phase] || phase;
    insights.push({
      user: userId,
      type: 'weakness',
      category: phase,
      title: `${phaseLabel} Phase Needs Improvement`,
      description: `Your ${phaseLabel.toLowerCase()} accuracy is ${accuracy}% over ${analyses.length} games. Focus on ${phaseLabel.toLowerCase()} principles and patterns to improve.`,
      severity: accuracy < 60 ? 'critical' : accuracy < 75 ? 'major' : 'moderate',
      metric: 'accuracy',
      value: accuracy,
      trend: 'new'
    });
  }

  const totalErrors = totalBlunders + totalMistakes + totalInaccuracies;
  const errorRate = totalMoves > 0 ? Math.round((totalErrors / totalMoves) * 100) : 0;
  if (errorRate > 0) {
    insights.push({
      user: userId,
      type: 'weakness',
      category: 'tactics',
      title: 'Tactical Awareness',
      description: `You make errors in ${errorRate}% of moves (${totalBlunders} blunders, ${totalMistakes} mistakes, ${totalInaccuracies} inaccuracies across ${analyses.length} games). Regular tactical training can reduce this.`,
      severity: errorRate > 20 ? 'critical' : errorRate > 10 ? 'major' : 'moderate',
      metric: 'blunder_rate',
      value: errorRate,
      trend: 'new'
    });
  }

  return await AiInsight.insertMany(insights);
}

async function generateRecommendationInsights(userId) {
  const insights = [];
  const analyses = await StockfishAnalysis.find({ user: userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const enrollments = await Enrollment.find({ student: userId, enrollmentStatus: 'active' })
    .populate('course', 'title category difficulty')
    .lean();

  const enrolledCourseIds = enrollments.map(e => e.course?._id).filter(Boolean);

  if (analyses.length >= 2) {
    const avgAccuracy = analyses.reduce((sum, a) => sum + (a.summary?.whiteAccuracy || 0), 0) / analyses.length;
    const totalBlunders = analyses.reduce((sum, a) => sum + (a.summary?.blunders || 0), 0);

    if (totalBlunders > 5 || avgAccuracy < 70) {
      const tacticCourses = await Course.find({
        _id: { $nin: enrolledCourseIds },
        category: 'Tactics',
        status: 'published',
        isPublished: true
      }).limit(2).select('title _id').lean();

      for (const course of tacticCourses) {
        insights.push({
          user: userId,
          type: 'recommendation',
          category: 'tactics',
          title: 'Improve Your Tactics',
          description: `Based on your game analysis, we recommend "${course.title}" to sharpen your tactical vision.`,
          severity: 'moderate',
          metric: 'tactical_accuracy',
          relatedCourse: course._id,
          actionUrl: `/course/${course._id}`,
          actionLabel: 'View Course',
          trend: 'new'
        });
      }
    }

    const anyEndgame = analyses.some(a => a.phaseAnalysis?.endGamePhase?.accuracy < 70);
    if (anyEndgame) {
      const endgameCourses = await Course.find({
        _id: { $nin: enrolledCourseIds },
        category: 'Endgame',
        status: 'published',
        isPublished: true
      }).limit(1).select('title _id').lean();

      for (const course of endgameCourses) {
        insights.push({
          user: userId,
          type: 'recommendation',
          category: 'endgame',
          title: 'Strengthen Your Endgame',
          description: `Your endgame accuracy needs work. "${course.title}" can help you convert winning positions.`,
          severity: 'moderate',
          metric: 'endgame_performance',
          relatedCourse: course._id,
          actionUrl: `/course/${course._id}`,
          actionLabel: 'View Course',
          trend: 'new'
        });
      }
    }
  }

  const botGames = await BotGame.countDocuments({ user: userId });
  if (botGames > 0) {
    insights.push({
      user: userId,
      type: 'strength',
      category: 'general',
      title: 'AI Practice Engagement',
      description: `You've played ${botGames} games against AI. Regular practice is key to improvement.`,
      severity: botGames < 5 ? 'minor' : 'positive',
      metric: 'rating_progress',
      value: botGames,
      trend: 'improving'
    });
  }

  if (insights.length === 0) {
    insights.push({
      user: userId,
      type: 'milestone',
      category: 'general',
      title: 'Start Your Journey',
      description: 'Analyze a game or take a course to get personalized AI insights about your chess progress.',
      severity: 'minor',
      metric: 'accuracy',
      trend: 'new'
    });
  }

  return await AiInsight.insertMany(insights);
}

async function getSkillAssessment(userId) {
  const analyses = await StockfishAnalysis.find({ user: userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const botGames = await BotGame.find({ user: userId, result: { $ne: 'playing' } })
    .lean();

  const enrollments = await Enrollment.find({ student: userId })
    .populate('course', 'title category difficulty')
    .lean();

  const assessment = {
    overall: { score: 0, label: 'Insufficient Data', color: '#94a3b8' },
    opening: { score: 0, games: 0, label: 'Needs Practice' },
    middlegame: { score: 0, games: 0, label: 'Needs Practice' },
    endgame: { score: 0, games: 0, label: 'Needs Practice' },
    tactics: { score: 0, label: 'Needs Practice' },
    totalGames: analyses.length,
    botGamesPlayed: botGames.length,
    coursesInProgress: enrollments.filter(e => e.enrollmentStatus === 'active').length,
    coursesCompleted: enrollments.filter(e => e.enrollmentStatus === 'completed').length
  };

  if (analyses.length >= 2) {
    let openingAccs = [], middleAccs = [], endgameAccs = [];
    let avgAccuracy = 0;

    for (const a of analyses) {
      if (a.phaseAnalysis) {
        if (a.phaseAnalysis.openingPhase?.accuracy) openingAccs.push(a.phaseAnalysis.openingPhase.accuracy);
        if (a.phaseAnalysis.middleGamePhase?.accuracy) middleAccs.push(a.phaseAnalysis.middleGamePhase.accuracy);
        if (a.phaseAnalysis.endGamePhase?.accuracy) endgameAccs.push(a.phaseAnalysis.endGamePhase.accuracy);
      }
      if (a.summary?.whiteAccuracy) avgAccuracy += a.summary.whiteAccuracy;
    }

    avgAccuracy = Math.round(avgAccuracy / analyses.length);

    if (openingAccs.length > 0) {
      const avg = Math.round(openingAccs.reduce((a, b) => a + b, 0) / openingAccs.length);
      assessment.opening = { score: avg, games: openingAccs.length, label: avg >= 80 ? 'Strong' : avg >= 65 ? 'Developing' : 'Needs Practice' };
    }
    if (middleAccs.length > 0) {
      const avg = Math.round(middleAccs.reduce((a, b) => a + b, 0) / middleAccs.length);
      assessment.middlegame = { score: avg, games: middleAccs.length, label: avg >= 80 ? 'Strong' : avg >= 65 ? 'Developing' : 'Needs Practice' };
    }
    if (endgameAccs.length > 0) {
      const avg = Math.round(endgameAccs.reduce((a, b) => a + b, 0) / endgameAccs.length);
      assessment.endgame = { score: avg, games: endgameAccs.length, label: avg >= 80 ? 'Strong' : avg >= 65 ? 'Developing' : 'Needs Practice' };
    }

    const totalBlunders = analyses.reduce((s, a) => s + (a.summary?.blunders || 0), 0);
    const blunderRate = analyses.reduce((s, a) => s + (a.summary?.totalMoves || 0), 0) > 0
      ? Math.round((totalBlunders / analyses.reduce((s, a) => s + (a.summary?.totalMoves || 0), 0)) * 1000) / 10
      : 0;
    assessment.tactics = {
      score: Math.max(0, 100 - blunderRate * 5),
      label: blunderRate < 2 ? 'Strong' : blunderRate < 5 ? 'Developing' : 'Needs Practice'
    };

    assessment.overall = {
      score: avgAccuracy,
      label: avgAccuracy >= 80 ? 'Advanced' : avgAccuracy >= 65 ? 'Intermediate' : avgAccuracy >= 50 ? 'Beginner' : 'Novice',
      color: avgAccuracy >= 80 ? '#22c55e' : avgAccuracy >= 65 ? '#eab308' : avgAccuracy >= 50 ? '#f97316' : '#ef4444'
    };
  }

  return assessment;
}

module.exports = {
  generateWeaknessInsights,
  generateRecommendationInsights,
  getSkillAssessment
};
