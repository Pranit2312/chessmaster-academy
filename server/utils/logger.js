const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const formatMsg = (level, msg, data) => {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    return `${prefix} ${msg} ${typeof data === 'object' ? JSON.stringify(data) : data}`;
  }
  return `${prefix} ${msg}`;
};

const logger = {
  error: (msg, data) => currentLevel >= LOG_LEVELS.error && console.error(formatMsg('error', msg, data)),
  warn: (msg, data) => currentLevel >= LOG_LEVELS.warn && console.warn(formatMsg('warn', msg, data)),
  info: (msg, data) => currentLevel >= LOG_LEVELS.info && console.log(formatMsg('info', msg, data)),
  debug: (msg, data) => currentLevel >= LOG_LEVELS.debug && console.log(formatMsg('debug', msg, data))
};

module.exports = logger;
