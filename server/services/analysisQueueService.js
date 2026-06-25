const Game = require('../models/Game');
const { StockfishAnalysis } = require('../models/Analysis');
const { analyzeGame } = require('./stockfishService');
const logger = require('../utils/logger');

let isProcessing = false;
let processorInterval = null;
let shuttingDown = false;
let processingPromiseResolve = null;

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
  if (shuttingDown) return { processed: false, reason: 'shutting_down' };
  if (isProcessing) return { processed: false, reason: 'busy' };

  const job = await StockfishAnalysis.findOne({ status: 'queued' }).sort({ createdAt: 1 });
  if (!job) return { processed: false, reason: 'empty' };

  isProcessing = true;
  const startTime = Date.now();

  try {
    job.status = 'analyzing';
    await job.save();

    const result = await analyzeGame(job.pgn, { depth: job.depth });

    if (shuttingDown) {
      logger.info('Analysis result discarded — shutting down', { analysisId: job._id });
      return { processed: false, reason: 'shutting_down' };
    }

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

    const duration = Date.now() - startTime;
    logger.info(`Analysis completed in ${duration}ms`, { analysisId: job._id, gameId: job.gameId });
    return { processed: true, analysisId: job._id };
  } catch (error) {
    if (shuttingDown) {
      logger.info('Analysis error during shutdown — discarded', { analysisId: job?._id });
      return { processed: false, reason: 'shutting_down' };
    }
    job.status = 'failed';
    job.completedAt = new Date();
    await job.save();
    logger.error('Analysis queue error', error.message);
    return { processed: false, reason: 'failed', error: error.message };
  } finally {
    isProcessing = false;
    if (processingPromiseResolve) {
      processingPromiseResolve();
      processingPromiseResolve = null;
    }
  }
}

async function processQueueBatch(batchSize = 3) {
  const results = [];
  const limit = parseInt(process.env.ANALYSIS_QUEUE_BATCH_SIZE, 10) || batchSize;

  for (let i = 0; i < limit; i++) {
    const result = await processNextInQueue();
    results.push(result);
    if (!result.processed || result.reason === 'empty' || result.reason === 'busy' || result.reason === 'shutting_down') {
      break;
    }
  }

  return results;
}

const POLL_INTERVAL = parseInt(process.env.ANALYSIS_POLL_INTERVAL || '2000', 10);

function startQueueProcessor() {
  if (processorInterval) return;
  shuttingDown = false;
  processorInterval = setInterval(async () => {
    if (shuttingDown) return;
    try {
      const result = await processNextInQueue();
      if (result.processed) {
        logger.info('Queue processor completed job', { analysisId: result.analysisId });
      }
    } catch (err) {
      if (!shuttingDown) {
        logger.error('Queue processor error:', err.message);
      }
    }
  }, POLL_INTERVAL);
  processorInterval.unref();
  logger.info(`Queue processor started (poll every ${POLL_INTERVAL}ms)`);
}

async function stopQueueProcessor() {
  shuttingDown = true;
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
  }
  if (isProcessing) {
    logger.info('Waiting for in-progress analysis to complete...');
    await new Promise((resolve) => {
      processingPromiseResolve = resolve;
    });
  }
  logger.info('Queue processor stopped');
}

module.exports = {
  queueGameAnalysis,
  processNextInQueue,
  processQueueBatch,
  startQueueProcessor,
  stopQueueProcessor
};
