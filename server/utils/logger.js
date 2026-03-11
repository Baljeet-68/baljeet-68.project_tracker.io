/**
 * @file server/utils/logger.js
 * @description Centralized logging with production/development modes
 */

const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';
const logger = pino({
    level: isDev ? 'debug' : 'warn',
    transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

module.exports = logger;
