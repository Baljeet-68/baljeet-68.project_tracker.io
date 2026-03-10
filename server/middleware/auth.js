const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/runtime');

// NOTE: In-memory blacklist is kept for backwards compatibility with existing logout behavior.
// For production-scale revocation, replace with Redis/DB keyed by jti with TTL.
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
