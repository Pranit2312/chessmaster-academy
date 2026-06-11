const Game = require('../models/Game');
const { StockfishAnalysis } = require('../models/Analysis');
const { analyzeGame } = require('./stockfishService');
const logger = require('../utils/logger');

let isProcessing = false;

async function queueGameAnalysis(gameId) {
  try {
    const game = await Game.findById(gameId);
    if (!game || !game.pgn) {
      logger.warn('Cannot enqueue analysis: game or PGN missing', { gameId });
      return { processed: false, reason: 'missing_pgn' };
    }

    const existing = await StockfishAnalysis.findOne({
      gameId: String(gameId),
      status: { $in: ['queued', 'analyzing', 'completed'] }
    });
    if (existing) {
      logger.info('Analysis already queued/completed', { gameId });
      return { processed: true, analysisId: existing._id, cached: true };
    }

    const analysis = await StockfishAnalysis.create({
      gameId: String(gameId),
      pgn: game.pgn,
      depth: 22,
      status: 'queued'
    });

    logger.info('Game analysis queued', { gameId, analysisId: analysis._id });
    return { processed: true, analysisId: analysis._id };
  } catch (err) {
    logger.error('Failed to queue game analysis', err.message);
    return { processed: false, reason: err.message };
  }
}

async function processNextInQueue() {
  if (isProcessing) return { processed: false, reason: 'busy' };

  const job = await StockfishAnalysis.findOne({ status: 'queued' }).sort({ createdAt: 1 });
  if (!job) return { processed: false, reason: 'empty' };

  isProcessing = true;

  try {
    job.status = 'analyzing';
    await job.save();

    const result = await analyzeGame(job.pgn, { depth: job.depth });

    job.whitePlayer = result.whitePlayer;
    job.blackPlayer = result.blackPlayer;
    job.event = result.event;
    job.site = result.site;
    job.date = result.date;
    job.engine = result.engine;
    job.moves = result.moves;
    job.summary = result.summary;
    job.phaseAnalysis = result.phaseAnalysis;
    job.opening = result.opening;
    job.analysisTime = result.analysisTime;
    job.status = 'completed';
    job.completedAt = new Date();

    await job.save();

    logger.info('Analysis completed', { analysisId: job._id, gameId: job.gameId });
    return { processed: true, analysisId: job._id };
  } catch (error) {
    job.status = 'failed';
    job.completedAt = new Date();
    await job.save();
    logger.error('Analysis queue error', error.message);
    return { processed: false, reason: 'failed', error: error.message };
  } finally {
    isProcessing = false;
  }
}

async function processQueueBatch(batchSize = 3) {
  const results = [];
  const limit = parseInt(process.env.ANALYSIS_QUEUE_BATCH_SIZE, 10) || batchSize;

  for (let i = 0; i < limit; i++) {
    const result = await processNextInQueue();
    results.push(result);
    if (!result.processed || result.reason === 'empty' || result.reason === 'busy') {
      break;
    }
  }

  return results;
}

module.exports = {
  queueGameAnalysis,
  processNextInQueue,
  processQueueBatch
};
