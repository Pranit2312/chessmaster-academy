const { processQueueBatch } = require('../services/analysisQueueService');

module.exports = async function processAnalysisQueue() {
  if (process.env.ENABLE_ANALYSIS_CRON === 'false') {
    return;
  }

  try {
    const results = await processQueueBatch();
    const processed = results.filter((r) => r.processed).length;
    if (processed > 0) {
      console.log(`♟️  Processed ${processed} analysis job(s)`);
    }
  } catch (error) {
    console.error('Analysis cron error:', error.message);
  }
};
