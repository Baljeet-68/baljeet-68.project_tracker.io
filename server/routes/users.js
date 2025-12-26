const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getUserName } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');

let usersSource;
let createUserInDbSource;
let updateUserInDbSource;
let deleteUserFromDbSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  usersSource = async () => await dbApi.getUsersFromMySQL();
  createUserInDbSource = dbApi.createUserInDb;
  updateUserInDbSource = dbApi.updateUserInDb;
  deleteUserFromDbSource = dbApi.deleteUserFromDb;
} else {
  const localData = require('../data');
  usersSource = async () => localData.users;
  createUserInDbSource = async (user) => {
    const users = await usersSource();
    users.push(user);
  };
  updateUserInDbSource = async (userId, changes) => {
    const users = await usersSource();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], ...changes };
    }
  };
  deleteUserFromDbSource = async (userId) => {
    const users = await usersSource();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users.splice(index, 1);
    }
  };
}

// GET /api/users - admin only
router.get(`/users`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await usersSource();
    const usersWithNames = await Promise.all(users.map(async u => ({
      ...u,
      name: await getUserName(u.id)
    })));
    res.json(usersWithNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me - get current user profile
router.get(`/me`, authenticate, async (req, res) => {
  try {
    const users = await usersSource();
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Don't send password
    const { password, ...userProfile } = user;
    res.json({
      ...userProfile,
      name: await getUserName(user.id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me - update current user profile
router.patch(`/me`, authenticate, async (req, res) => {
  try {
    const { name, password, profilePicture } = req.body;
    const changes = {};
    if (name) changes.name = name;
    if (password) changes.password = password;
    if (profilePicture) changes.profilePicture = profilePicture;

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    if (USE_LIVE_DB) {
      await updateUserInDbSource(req.user.userId, changes);
    } else {
      const users = await usersSource();
      const userIndex = users.findIndex(u => u.id === req.user.userId);
      if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...changes };
      }
    }

    const updatedUsers = await usersSource();
    const updatedUser = updatedUsers.find(u => u.id === req.user.userId);
    const { password: _, ...userResponse } = updatedUser;
    
    res.json({
      ...userResponse,
      name: await getUserName(req.user.userId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - admin only create user
router.post(`/users`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
    const users = await usersSource();
    if (users.find((u) => u.email === email)) return res.status(400).json({ error: 'User exists' });
    const newUser = { id: `u${Date.now()}`, name, email, password, role };

    if (USE_LIVE_DB) {
      await createUserInDbSource(newUser);
    } else {
      users.push(newUser);
    }
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:id - admin only update user
router.patch(`/users/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await usersSource();
    let user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, email, password, role, active } = req.body;
    const changes = {};
    if (name) changes.name = name;
    if (email) changes.email = email;
    if (password) changes.password = password;
    if (role) changes.role = role;
    if (typeof active !== 'undefined') changes.active = active;

    if (Object.keys(changes).length === 0) {
      return res.status(200).json(user); // No changes, return existing user
    }

    const updatedUser = { ...user, ...changes };

    if (USE_LIVE_DB) {
      await updateUserInDbSource(updatedUser.id, changes);
    } else {
      const userIndex = users.findIndex(u => u.id === updatedUser.id);
      if (userIndex > -1) {
        users[userIndex] = updatedUser;
      }
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - admin only delete user
router.delete(`/users/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await usersSource();
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Prevent admin from deleting themselves
    if (user.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Prevent admin from deleting other admins
    if (req.user.role === 'admin' && user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete another admin' });
    }

    await deleteUserFromDbSource(req.params.id);
    res.json({ ok: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
