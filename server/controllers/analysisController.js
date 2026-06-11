const { StockfishAnalysis } = require('../models/Analysis');
const { asyncHandler, NotFoundError, AuthorizationError } = require('../utils/errors');
const { processNextInQueue } = require('../services/analysisQueueService');
const { parsePgn, normalizePgnInput } = require('../services/pgnParserService');

/**
 * @route POST /api/analysis/submit
 */
exports.submitAnalysis = asyncHandler(async (req, res) => {
  const { pgn, depth } = req.body;

  try {
    parsePgn(pgn);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  const normalizedPgn = normalizePgnInput(pgn);

  const analysis = await StockfishAnalysis.create({
    user: req.user._id,
    pgn: normalizedPgn,
    depth: depth || 12,
    status: 'queued'
  });

  processNextInQueue().catch((err) => {
    console.error('Background analysis kickoff failed:', err.message);
  });

  res.status(201).json({
    success: true,
    message: 'Game submitted for analysis',
    data: {
      id: analysis._id,
      status: analysis.status,
      createdAt: analysis.createdAt
    }
  });
});

/**
 * @route GET /api/analysis/my-analyses
 */
exports.getMyAnalyses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    StockfishAnalysis.find({ user: req.user._id })
      .select('-pgn -moves')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StockfishAnalysis.countDocuments({ user: req.user._id })
  ]);

  res.json({
    success: true,
    data: analyses,
    meta: { total, page, limit, pages: Math.ceil(total / limit) }
  });
});

/**
 * @route GET /api/analysis/:analysisId
 */
exports.getAnalysisById = asyncHandler(async (req, res) => {
  const analysis = await StockfishAnalysis.findById(req.params.analysisId);

  if (!analysis) {
    throw new NotFoundError('Analysis');
  }

  if (analysis.user.toString() !== req.user._id.toString()) {
    throw new AuthorizationError('Not authorized to view this analysis');
  }

  res.json({
    success: true,
    data: analysis
  });
});

/**
 * @route GET /api/analysis/:analysisId/status
 */
exports.getAnalysisStatus = asyncHandler(async (req, res) => {
  const analysis = await StockfishAnalysis.findById(req.params.analysisId)
    .select('user status summary whitePlayer blackPlayer createdAt completedAt analysisTime');

  if (!analysis) {
    throw new NotFoundError('Analysis');
  }

  if (analysis.user && analysis.user.toString() !== req.user._id.toString()) {
    throw new AuthorizationError('Not authorized to view this analysis');
  }

  res.json({
    success: true,
    data: {
      id: analysis._id,
      status: analysis.status,
      summary: analysis.summary,
      whitePlayer: analysis.whitePlayer,
      blackPlayer: analysis.blackPlayer,
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt,
      analysisTime: analysis.analysisTime
    }
  });
});

/**
 * @route DELETE /api/analysis/:analysisId
 */
exports.deleteAnalysis = asyncHandler(async (req, res) => {
  const analysis = await StockfishAnalysis.findById(req.params.analysisId);

  if (!analysis) {
    throw new NotFoundError('Analysis');
  }

  if (analysis.user.toString() !== req.user._id.toString()) {
    throw new AuthorizationError('Not authorized to delete this analysis');
  }

  await analysis.deleteOne();

  res.json({
    success: true,
    message: 'Analysis deleted successfully'
  });
});
