const OpeningLibrary = require('../models/OpeningLibrary');
const { getOpeningRecommendations, getSkillLevelFromRating, analyzeUserOpenings } = require('../services/openingRecommendationService');
const { StockfishAnalysis } = require('../models/Analysis');
const { ensureOpenings } = require('../utils/seedOpenings');
const { deepenOpening, deepenAllOpenings, fetchLichessMoves } = require('../services/openingApiService');

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

exports.deepenOpening = async (req, res) => {
  try {
    const { id } = req.params;
    const targetDepth = parseInt(req.query.depth) || 15;
    const opening = await OpeningLibrary.findById(id).lean();
    if (!opening) return res.status(404).json({ success: false, message: 'Opening not found' });

    const result = await deepenOpening(opening, targetDepth);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    if (result.extended > 0) {
      const newFen = require('../services/openingApiService').fenAfterMoves(opening.startingFen, result.moves);
      await OpeningLibrary.updateOne(
        { _id: opening._id },
        { $set: { moveSequence: result.moves, currentFen: newFen || opening.currentFen, updatedAt: new Date() } }
      );
    }

    res.json({ success: true, extended: result.extended, totalMoves: result.moves.length, moves: result.moves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deepenAllOpenings = async (req, res) => {
  try {
    const targetDepth = parseInt(req.query.depth) || 15;
    const result = await deepenAllOpenings(targetDepth);
    res.json({ success: true, ...result, message: `Deepened ${result.totalOpenings} openings by ${result.totalExtended} total moves` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exploreByFen = async (req, res) => {
  try {
    const { fen } = req.query;
    if (!fen) return res.status(400).json({ success: false, message: 'fen parameter required' });

    const data = await fetchLichessMoves(fen);
    if (!data) return res.status(503).json({ success: false, message: 'Opening explorer unavailable' });

    const chess = new (require('chess.js').Chess)(fen);
    const moves = (data.moves || []).map(m => {
      const uci = m.uci;
      let san = '';
      try {
        const test = new (require('chess.js').Chess)(fen);
        const move = test.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
        san = move?.san || uci;
      } catch { san = uci; }
      return { uci, san, total: m.white + m.draw + m.black, whitePct: ((m.white / (m.white + m.draw + m.black)) * 100).toFixed(1), blackPct: ((m.black / (m.white + m.draw + m.black)) * 100).toFixed(1), drawPct: ((m.draw / (m.white + m.draw + m.black)) * 100).toFixed(1) };
    });

    res.json({ success: true, fen, opening: data.opening || null, moves, totalGames: data.white + data.draw + data.black });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
