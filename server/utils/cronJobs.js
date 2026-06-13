const cron = require('node-cron');
const autoCompleteSessions = require('./autoCompleteSessions');
const processAnalysisQueue = require('../jobs/processAnalysisQueue');
const puzzleApi = require('../services/puzzleApiService');
const AiPuzzle = require('../models/AiPuzzle');
const logger = require('./logger');

module.exports = () => {
  cron.schedule('*/1 * * * *', async () => {
    await autoCompleteSessions();
  });

  cron.schedule('*/1 * * * *', async () => {
    await processAnalysisQueue();
  });

  cron.schedule('0 */6 * * *', async () => {
    try {
      const batch = await puzzleApi.fetchPuzzleBatch(15);
      let created = 0;
      for (const p of batch) {
        const exists = await AiPuzzle.findOne({ fen: p.fen });
        if (!exists) { await AiPuzzle.create(p); created++; }
      }
      logger.info(`Cron synced ${created} puzzles`);

      const daily = await puzzleApi.fetchDailyPuzzle();
      if (daily) {
        const exists = await AiPuzzle.findOne({ fen: daily.fen });
        if (!exists) { await AiPuzzle.create(daily); created++; }
      }
    } catch (err) {
      logger.warn('Puzzle cron sync failed:', err.message);
    }
  });
};