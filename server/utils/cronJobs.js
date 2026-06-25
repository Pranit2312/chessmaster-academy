const cron = require('node-cron');
const autoCompleteSessions = require('./autoCompleteSessions');
const processAnalysisQueue = require('../jobs/processAnalysisQueue');
const logger = require('./logger');
const { cronTimingWrapper, startupReport } = require('./monitor');

module.exports = () => {
  const jobs = [
    { name: 'autoCompleteSessions', schedule: '*/1 * * * *' },
    { name: 'processAnalysisQueue', schedule: '*/1 * * * *' }
  ];

  cron.schedule('*/1 * * * *', cronTimingWrapper('autoCompleteSessions', autoCompleteSessions));
  cron.schedule('*/1 * * * *', cronTimingWrapper('processAnalysisQueue', processAnalysisQueue));

  startupReport(jobs);
};
