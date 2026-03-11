/**
 * @file server/middleware/validation.js
 * @description Input validation middleware for API endpoints
 */

const { z } = require('zod');

// Common validators
const validators = {
    id: z.string().uuid('Invalid ID format').or(z.coerce.number().positive('ID must be positive')),
    email: z.string().email('Invalid email format'),
    projectId: z.string().or(z.coerce.number()),
    bugId: z.string().or(z.coerce.number()),
    year: z.coerce.number().int().min(2000).max(2100),
    status: z.enum(['active', 'inactive', 'closed', 'pending', 'resolved']).optional(),
    role: z.enum(['admin', 'developer', 'tester', 'hr', 'ecommerce', 'management', 'accountant']).optional(),
    pagination: {
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
    }
};

/**
 * Validate query parameters
 * Usage: router.get('/endpoint', validate({ query: { id: validators.id } }), handler)
 */
function validate(schema) {
    return (req, res, next) => {
        try {
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                return res.status(400).json({ error: 'Invalid request', details: messages });
            }
            return res.status(400).json({ error: 'Validation failed' });
        }
    };
}

module.exports = {
    validate,
    validators
};
