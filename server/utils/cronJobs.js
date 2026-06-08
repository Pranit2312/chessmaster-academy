const cron = require('node-cron');
const autoCompleteSessions = require('./autoCompleteSessions');
const processAnalysisQueue = require('../jobs/processAnalysisQueue');
const { syncPuzzlesFromLichess } = require('../services/lichessService');

module.exports = () => {
  cron.schedule('*/1 * * * *', async () => {
    await autoCompleteSessions();
  });

  cron.schedule('*/1 * * * *', async () => {
    await processAnalysisQueue();
  });

  // Sync puzzles from Lichess every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      await syncPuzzlesFromLichess(50);
    } catch (err) {
      console.error('Lichess puzzle cron sync failed:', err.message);
    }
  });
};