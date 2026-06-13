const { processQueueBatch } = require('../services/analysisQueueService');
const logger = require('../utils/logger');

module.exports = async function processAnalysisQueue() {
  if (process.env.ENABLE_ANALYSIS_CRON === 'false') {
    return;
  }

  try {
    const results = await processQueueBatch();
    const processed = results.filter((r) => r.processed).length;
    if (processed > 0) {
      logger.info(`Processed ${processed} analysis job(s)`);
    }
  } catch (error) {
    logger.error('Analysis cron error:', error.message);
  }
};
