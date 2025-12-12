const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { users } = require('../data');
const { getUserName } = require('../middleware/helpers');



// GET /api/users - admin only
router.get(`/users`, authenticate, requireRole('admin'), (req, res) => {
  res.json(users.map(u => ({ ...u, name: getUserName(u.id) })));
});

// POST /api/users - admin only create user
router.post(`/users`, authenticate, requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: 'User exists' });
  const newUser = { id: `u${Date.now()}`, name, email, password, role };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PATCH /api/users/:id - admin only update user
router.patch(`/users/:id`, authenticate, requireRole('admin'), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, email, password, role } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (role) user.role = role;
  res.json(user);
});

// DELETE /api/users/:id - admin only delete user
router.delete(`/users/:id`, authenticate, requireRole('admin'), (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
