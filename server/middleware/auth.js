const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/runtime');

// NOTE: In-memory blacklist is a temporary solution for development only.
// For production with multiple servers, implement this:
//   1. Redis cache: Store revoked JTIs with TTL = token expiry (8h)
//   2. Database: Add revoked_tokens table with index on jti
// 
// Example Redis implementation:
//   const redis = require('redis');
//   const client = redis.createClient();
//   async function revokeToken(jti) {
//     await client.setex(`revoked:${jti}`, 28800, '1'); // 8h TTL
//   }
//   async function isTokenRevoked(jti) {
//     return await client.exists(`revoked:${jti}`);
//   }

const tokenBlacklist = new Set();

// Middleware to protect routes
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
  const token = parts[1];
  if (tokenBlacklist.has(token)) return res.status(401).json({ error: 'Token revoked' });
  try {
    const { JWT_SECRET } = getConfig();
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  }
}

module.exports = { authenticate, requireRole, tokenBlacklist };
