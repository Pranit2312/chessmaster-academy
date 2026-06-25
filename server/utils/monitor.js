const logger = require('./logger');

const LAG_WARN_MS = 50;
const LAG_ERROR_MS = 200;
const METRICS_INTERVAL = 30000;

const MEM_WARN_MB = 500;
const MEM_CRITICAL_MB = 1024;

let lagInterval = null;
let memoryInterval = null;
let lastCheck = Date.now();

function startEventLoopMonitor() {
  if (lagInterval) return;
  lastCheck = Date.now();
  lagInterval = setInterval(() => {
    const now = Date.now();
    const lag = now - lastCheck - METRICS_INTERVAL;
    lastCheck = now;
    if (lag > LAG_ERROR_MS) {
      logger.error(`Event loop lag detected: ${lag}ms (threshold: ${LAG_ERROR_MS}ms)`);
    } else if (lag > LAG_WARN_MS) {
      logger.warn(`Event loop lag: ${lag}ms`);
    }
  }, METRICS_INTERVAL);
  lagInterval.unref();
  logger.debug(`Event loop monitor started (check every ${METRICS_INTERVAL}ms)`);
}

function stopEventLoopMonitor() {
  if (lagInterval) {
    clearInterval(lagInterval);
    lagInterval = null;
  }
}

function startMemoryMonitor() {
  if (memoryInterval) return;
  memoryInterval = setInterval(() => {
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    const heapTotalMB = mem.heapTotal / 1024 / 1024;
    const rssMB = mem.rss / 1024 / 1024;

    if (heapUsedMB > MEM_CRITICAL_MB) {
      logger.error(`Memory critical: heap ${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB, RSS: ${rssMB.toFixed(0)}MB`);
    } else if (heapUsedMB > MEM_WARN_MB) {
      logger.warn(`Memory high: heap ${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB, RSS: ${rssMB.toFixed(0)}MB`);
    }
    logger.debug(`Memory: heap ${heapUsedMB.toFixed(1)}/${heapTotalMB.toFixed(1)}MB, RSS: ${rssMB.toFixed(1)}MB`);
  }, 60000);
  memoryInterval.unref();
  logger.debug('Memory monitor started');
}

function stopMemoryMonitor() {
  if (memoryInterval) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
}

function reportMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(1),
    heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(1),
    rssMB: +(mem.rss / 1024 / 1024).toFixed(1)
  };
}

function cronTimingWrapper(name, fn) {
  return async () => {
    const start = Date.now();
    logger.info(`[Cron:${name}] started`);
    try {
      await fn();
      const duration = Date.now() - start;
      if (duration > 15000) {
        logger.error(`[Cron:${name}] took ${duration}ms — EXCEEDS 15s threshold`);
      } else if (duration > 5000) {
        logger.warn(`[Cron:${name}] took ${duration}ms — exceeds 5s warning threshold`);
      } else {
        logger.info(`[Cron:${name}] completed in ${duration}ms`);
      }
    } catch (err) {
      const duration = Date.now() - start;
      logger.error(`[Cron:${name}] FAILED after ${duration}ms: ${err.message}`);
    }
  };
}

function startupReport(cronJobs) {
  logger.info('=== STARTUP REPORT ===');
  logger.info(`PID: ${process.pid}`);
  logger.info(`Node: ${process.version}`);
  logger.info(`Platform: ${process.platform}`);
  logger.info(`Memory: ${JSON.stringify(reportMemoryUsage())}`);

  if (cronJobs && cronJobs.length > 0) {
    logger.info('Registered cron jobs:');
    for (const job of cronJobs) {
      logger.info(`  ${job.name}: ${job.schedule}`);
    }
  } else {
    logger.info('No cron jobs registered');
  }

  logger.info(`Uptime: ${process.uptime().toFixed(0)}s`);
  logger.info('======================');
}

module.exports = {
  startEventLoopMonitor,
  stopEventLoopMonitor,
  startMemoryMonitor,
  stopMemoryMonitor,
  reportMemoryUsage,
  cronTimingWrapper,
  startupReport
};
