const OpeningLibrary = require('../models/OpeningLibrary');
const { getOpeningRecommendations, getSkillLevelFromRating, analyzeUserOpenings } = require('../services/openingRecommendationService');
const { StockfishAnalysis } = require('../models/Analysis');
const { ensureOpenings } = require('../utils/seedOpenings');

exports.seedOpenings = async (req, res) => {
  try {
    const count = await ensureOpenings();
    res.json({ success: true, seeded: count, message: `Seeded ${count} openings` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to seed openings', error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const skillLevel = req.query.skillLevel || getSkillLevelFromRating(req.user?.chessRating);
    const recommendations = await getOpeningRecommendations(skillLevel);

    res.json({
      success: true,
      skillLevel,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get recommendations', error: error.message });
  }
};

exports.exploreOpening = async (req, res) => {
  try {
    const { ecoCode } = req.params;

    if (!ecoCode) {
      await ensureOpenings();
      const openings = await OpeningLibrary.find()
        .select('name ecoCode openingType complexity popularity difficulty description')
        .sort({ name: 1 })
        .lean();
      return res.json({ success: true, openings });
    }

    await ensureOpenings();
    const opening = await OpeningLibrary.findOne({ ecoCode: ecoCode.toUpperCase() }).lean();
    if (!opening) {
      return res.status(404).json({ success: false, message: 'Opening not found' });
    }

    res.json({ success: true, opening });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to explore opening', error: error.message });
  }
};

exports.getOpeningMoves = async (req, res) => {
  try {
    const { ecoCode } = req.params;
    const opening = await OpeningLibrary.findOne({ ecoCode: ecoCode.toUpperCase() }).lean();

    if (!opening) {
      return res.status(404).json({ success: false, message: 'Opening not found' });
    }

    res.json({
      success: true,
      name: opening.name,
      ecoCode: opening.ecoCode,
      startFen: opening.startingFen,
      moves: opening.moveSequence,
      variations: opening.variations?.map(v => ({
        name: v.name,
        moves: v.moves,
        assessment: v.assessment
      })) || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get opening moves', error: error.message });
  }
};

exports.searchOpenings = async (req, res) => {
  try {
    const { q, type, difficulty } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { ecoCode: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) query.openingType = type;
    if (difficulty) query.difficulty = difficulty;

    const openings = await OpeningLibrary.find(query)
      .select('name ecoCode openingType complexity popularity difficulty description')
      .sort({ popularity: 1, name: 1 })
      .limit(20)
      .lean();

    res.json({ success: true, openings, count: openings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to search openings', error: error.message });
  }
};

exports.getUserOpeningStats = async (req, res) => {
  try {
    const analyses = await StockfishAnalysis.find({
      user: req.user._id,
      status: 'completed',
      'opening.name': { $exists: true, $ne: '' }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('opening summary pgn')
      .lean();

    const stats = await analyzeUserOpenings(analyses);

    res.json({ success: true, stats, totalGames: analyses.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get opening stats', error: error.message });
  }
};
