const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticate, tokenBlacklist } = require('../middleware/auth');
const { getProfileUrl } = require('../middleware/helpers');
const { USE_LIVE_DB, USE_ENCRYPTION } = require('../config');
const { comparePassword } = require('../utils/encryption');

let usersSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  usersSource = async () => await dbApi.getUsersFromMySQL();
} else {
  const localData = require('../data');
  usersSource = async () => localData.users;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
// Login - accepts { email, password } - returns JWT with userId, email, role
router.post(`/login`, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const users = await usersSource();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
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

// Get current user
router.get(`/me`, async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
  const token = parts[1];
  if (tokenBlacklist.has(token)) return res.status(401).json({ error: 'Token revoked' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await usersSource();
    const user = users.find(u => u.id === payload.userId);
    return res.json({ 
      id: payload.userId, 
      email: payload.email, 
      role: payload.role, 
      name: user?.name,
      profilePicture: user ? getProfileUrl(req, user.profilePicture) : ''
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
