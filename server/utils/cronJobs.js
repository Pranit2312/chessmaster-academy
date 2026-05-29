const cron = require('node-cron');
const autoCompleteSessions = require('./autoCompleteSessions');

module.exports = () => {
  cron.schedule('*/1 * * * *', async () => {
    await autoCompleteSessions();
  });
};