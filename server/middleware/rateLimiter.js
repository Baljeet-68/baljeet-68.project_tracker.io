/**
 * @file server/middleware/rateLimiter.js
 * @description Rate limiting middleware for sensitive endpoints
 */

const rateLimit = require('express-rate-limit');

// Brute force protection on login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                     // 5 attempts per windowMs
    message: 'Too many login attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.ip === '127.0.0.1', // Skip localhost for development
    keyGenerator: (req) => req.body?.email || req.ip || 'anonymous',
});

// General API rate limiter (more lenient)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 100,             // 100 requests per minute
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    apiLimiter
};
