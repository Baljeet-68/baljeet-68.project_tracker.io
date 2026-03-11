/**
 * @file server/utils/errorHandler.js
 * @description Centralized error handling with safe public messaging
 */

class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Safe error response for client
 * NEVER expose:
 * - Database column names or schema
 * - Stack traces
 * - Internal file paths
 * - SQL queries
 */
function getSafeErrorResponse(error, isDevelopment = false) {
    const response = {
        error: error.message || 'An error occurred'
    };

    // Only expose details in development
    if (isDevelopment && error.details) {
        response.details = error.details;
    }

    return response;
}

/**
 * Express error middleware
 */
function errorHandler(err, req, res, next) {
    const isDev = process.env.NODE_ENV !== 'production';

    // Log full error for debugging
    req.log?.error({
        error: err.message,
        stack: err.stack,
        path: req.path,
        userId: req.user?.userId
    }, 'Unhandled error');

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Send safe response
    res.status(statusCode).json(
        getSafeErrorResponse(err, isDev)
    );
}

module.exports = {
    AppError,
    getSafeErrorResponse,
    errorHandler
};
