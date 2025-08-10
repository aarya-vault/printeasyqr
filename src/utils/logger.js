// Professional logging utility to replace console.log statements
// Provides different log levels and proper formatting

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const getCurrentLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  return LOG_LEVELS[envLevel] ?? (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level}:`;
  
  if (typeof message === 'object') {
    return `${prefix} ${JSON.stringify(message, null, 2)}`;
  }
  
  let formatted = `${prefix} ${message}`;
  if (Object.keys(meta).length > 0) {
    formatted += ` ${JSON.stringify(meta)}`;
  }
  
  return formatted;
};

const shouldLog = (level) => {
  const levelValue = LOG_LEVELS[level];
  const currentLevel = getCurrentLevel();
  return levelValue <= currentLevel;
};

export const logger = {
  error: (message, meta = {}) => {
    if (shouldLog('ERROR')) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (shouldLog('WARN')) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (shouldLog('INFO')) {
      console.info(formatMessage('INFO', message, meta));
    }
  },
  
  debug: (message, meta = {}) => {
    if (shouldLog('DEBUG')) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
  
  // Database specific logging
  database: {
    connected: (dbName) => logger.info(`Database connection established: ${dbName}`),
    disconnected: (dbName) => logger.warn(`Database connection closed: ${dbName}`),
    error: (operation, error) => logger.error(`Database ${operation} failed`, { error: error.message }),
    sync: (model) => logger.info(`Database model synchronized: ${model}`)
  },
  
  // HTTP request logging
  request: {
    incoming: (method, url, ip) => logger.debug(`${method} ${url}`, { ip }),
    completed: (method, url, status, duration) => logger.info(`${method} ${url} - ${status}`, { duration: `${duration}ms` }),
    error: (method, url, error) => logger.error(`${method} ${url} failed`, { error: error.message })
  },
  
  // Authentication logging
  auth: {
    login: (userId, email) => logger.info('User login successful', { userId, email }),
    loginFailed: (email, reason) => logger.warn('User login failed', { email, reason }),
    logout: (userId) => logger.info('User logout', { userId }),
    tokenError: (error) => logger.error('JWT token validation failed', { error: error.message })
  }
};

export default logger;