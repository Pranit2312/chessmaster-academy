const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const origConsole = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  log: console.log.bind(console)
};

const formatMsg = (level, msg, data) => {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    return `${prefix} ${msg} ${typeof data === 'object' ? JSON.stringify(data) : data}`;
  }
  return `${prefix} ${msg}`;
};

const logger = {
  error: (msg, data) => currentLevel >= LOG_LEVELS.error && origConsole.error(formatMsg('error', msg, data)),
  warn: (msg, data) => currentLevel >= LOG_LEVELS.warn && origConsole.warn(formatMsg('warn', msg, data)),
  info: (msg, data) => currentLevel >= LOG_LEVELS.info && origConsole.log(formatMsg('info', msg, data)),
  debug: (msg, data) => currentLevel >= LOG_LEVELS.debug && origConsole.log(formatMsg('debug', msg, data))
};

module.exports = logger;
