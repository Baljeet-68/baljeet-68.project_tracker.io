/**
 * @file server/utils/logger.js
 * @description Centralized logging with production/development modes
 */

const isDev = process.env.NODE_ENV !== 'production';

// Simple logger that uses console methods - avoids pino-pretty dependency issues
const logger = {
    debug: isDev ? (...args) => console.log('[DEBUG]', ...args) : () => { },
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    level: isDev ? 'debug' : 'warn'
};

module.exports = logger;
