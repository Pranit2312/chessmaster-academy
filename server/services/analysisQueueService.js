const { StockfishAnalysis } = require('../models/Analysis');
const { analyzeGame } = require('./stockfishService');

let isProcessing = false;

/**
 * Process the next queued analysis job.
 */
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

    return { processed: true, analysisId: job._id };
  } catch (error) {
    job.status = 'failed';
    job.completedAt = new Date();
    await job.save();
    console.error('Analysis queue error:', error.message);
    return { processed: false, reason: 'failed', error: error.message };
  } finally {
    isProcessing = false;
  }
}

/**
 * Process multiple queued jobs (used by cron).
 */
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
  processNextInQueue,
  processQueueBatch
};
