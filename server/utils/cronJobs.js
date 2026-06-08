const cron = require('node-cron');
const autoCompleteSessions = require('./autoCompleteSessions');
const processAnalysisQueue = require('../jobs/processAnalysisQueue');

module.exports = () => {
  cron.schedule('*/1 * * * *', async () => {
    await autoCompleteSessions();
  });

  cron.schedule('*/1 * * * *', async () => {
    await processAnalysisQueue();
  });
};