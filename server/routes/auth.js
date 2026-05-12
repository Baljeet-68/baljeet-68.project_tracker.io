const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticate, tokenBlacklist } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { getProfileUrl, getUsers } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const { comparePassword, hashPassword } = require('../utils/encryption');
const { getConfig } = require('../config/runtime');
const { randomUUID: uuidv4 } = require('crypto');
const logger = require('../utils/logger');

// Login - accepts { email, password } - returns JWT with userId, email, role
// Protected with rate limiting to prevent brute force attacks
router.post(`/login`, loginLimiter, async (req, res, next) => {
  const { email, password } = req.body;
  req.log?.info({ email: email ? String(email).toLowerCase() : undefined }, 'Login attempt');

  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const users = await getUsers(req);

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    req.log?.warn({ email: String(email).toLowerCase() }, 'Login failed: user not found');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check account status
  if (user.active === false || user.active === 0 || user.active === '0') {
    logger.warn({ userId: user.id }, 'Account inactive for login attempt');
    return res.status(403).json({ error: 'Account is inactive. Contact the admin' });
  }

  let passwordMatch = await comparePassword(password, user.password);
  // Backwards-compat: if legacy plaintext passwords exist, allow one-time login and upgrade to bcrypt.
  if (!passwordMatch && typeof user.password === 'string' && !user.password.startsWith('$2')) {
    if (password === user.password) {
      passwordMatch = true;
      try {
        const upgraded = await hashPassword(password);
        if (USE_LIVE_DB) {
          // eslint-disable-next-line global-require
          const api = require('../api');
          await api.updateUserInDb(user.id, { password: upgraded });
        } else {
          // eslint-disable-next-line global-require
          const localData = require('../data');
          const idx = (localData.users || []).findIndex(u => u.id === user.id);
          if (idx >= 0) localData.users[idx].password = upgraded;
        }
        req.log?.info({ userId: user.id }, 'Upgraded legacy plaintext password to bcrypt');
      } catch (e) {
        req.log?.error({ err: e, userId: user.id }, 'Failed to upgrade legacy password');
      }
    }
  }

  if (!passwordMatch) {
    req.log?.warn({ userId: user.id }, 'Login failed: password mismatch');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { JWT_SECRET } = getConfig();
  const jti = uuidv4();
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, jti },
    JWT_SECRET,
    { expiresIn: '8h', algorithm: 'HS256' }
  );
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: getProfileUrl(req, user.profilePicture)
    }
  });
});



// Logout - add token to blacklist (demo)
router.post(`/logout`, (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  if (token) tokenBlacklist.add(token);
  return res.json({ ok: true });
});

// Get current user (uses shared authenticate middleware)
router.get(`/me`, authenticate, async (req, res) => {
  const users = await getUsers(req);
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  return res.json({
    id: req.user.userId,
    email: req.user.email,
    role: req.user.role,
    name: user?.name,
    profilePicture: user ? getProfileUrl(req, user.profilePicture) : ''
  });
});

module.exports = router;
