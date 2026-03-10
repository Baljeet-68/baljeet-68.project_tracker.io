const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');
const { getUserName, getProfileUrl, getUsers } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const dbApi = USE_LIVE_DB ? require('../api') : null;
const localData = !USE_LIVE_DB ? require('../data') : null;
const { hashPassword } = require('../utils/encryption');

var usersSource;
var createUserInDbSource;
var updateUserInDbSource;
var deleteUserFromDbSource;

if (USE_LIVE_DB) {
  usersSource = async () => await dbApi.getUsersFromMySQL();
  createUserInDbSource = dbApi.createUserInDb;
  updateUserInDbSource = dbApi.updateUserInDb;
  deleteUserFromDbSource = dbApi.deleteUserFromDb;
} else {
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
    const users = await getUsers(req);
    const usersWithNames = await Promise.all(users.map(async u => ({
      ...u,
      name: await getUserName(u.id, req),
      profilePicture: getProfileUrl(req, u.profilePicture)
    })));
    res.json(usersWithNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me - get current user profile
router.get(`/me`, authenticate, async (req, res) => {
  try {
    const users = await getUsers(req);
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Don't send password
    const { password, ...userProfile } = user;
    res.json({
      ...userProfile,
      name: await getUserName(user.id, req),
      profilePicture: getProfileUrl(req, user.profilePicture)
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
    if (password) changes.password = await hashPassword(password);

    // Handle profile picture storage as file
    if (profilePicture !== undefined) {
      const users = await usersSource();
      const currentUser = users.find(u => u.id === req.user.userId);
      const uploadDir = path.join(__dirname, '..', 'uploads');

      if (profilePicture === '' || profilePicture === null) {
        // Delete old picture if it exists
        if (currentUser && currentUser.profilePicture && !currentUser.profilePicture.startsWith('http')) {
          try {
            const oldPath = path.join(uploadDir, currentUser.profilePicture);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (err) { console.error('Delete error:', err); }
        }
        changes.profilePicture = '';
      } else if (profilePicture.startsWith('data:image')) {
        // It's a base64 string, save it as a file
        const matches = profilePicture.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({ error: 'Invalid image format' });
        }

        const extension = matches[1].toLowerCase();
        if (!['jpg', 'jpeg', 'png'].includes(extension)) {
          return res.status(400).json({ error: 'Only JPG, JPEG, and PNG files are allowed' });
        }

        const base64Data = matches[2];
        const fileName = `profile_${req.user.userId}_${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file to disk
        fs.writeFileSync(filePath, base64Data, 'base64');

        // Delete old profile picture if it exists
        if (currentUser && currentUser.profilePicture && !currentUser.profilePicture.startsWith('http')) {
          try {
            const oldPath = path.join(uploadDir, currentUser.profilePicture);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          } catch (err) {
            console.error('Failed to delete old profile picture:', err);
          }
        }

        // Store ONLY the filename in DB
        changes.profilePicture = fileName;
      } else {
        // It's already a link or something else, keep it as is
        changes.profilePicture = profilePicture;
      }
    }

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

    // Fetch the actual user from DB after update to ensure we return correct state
    const updatedUsers = await usersSource();
    const finalUser = updatedUsers.find(u => u.id === req.user.userId);
    const { password: _, ...userResponse } = finalUser;

    res.json({
      ...userResponse,
      name: await getUserName(req.user.userId),
      profilePicture: getProfileUrl(req, finalUser.profilePicture)
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
    const newUser = { id: `u${Date.now()}`, name, email, password: await hashPassword(password), role };

    if (USE_LIVE_DB) {
      await createUserInDbSource(newUser);
    } else {
      users.push(newUser);
    }

    const { password: _, ...userResponse } = newUser;
    res.status(201).json({
      ...userResponse,
      profilePicture: getProfileUrl(req, newUser.profilePicture)
    });
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
    if (password) changes.password = await hashPassword(password);
    if (role) changes.role = role;
    if (active == '0' || active == 0) changes.active = active;
    if (active == '1' || active == 1) changes.active = active;

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

    // Fetch the actual user from DB after update to ensure we return correct state
    const usersAfterUpdate = await usersSource();
    const finalUser = usersAfterUpdate.find(u => u.id === updatedUser.id) || updatedUser;

    const { password: _, ...userResponse } = finalUser;
    res.json({
      ...userResponse,
      profilePicture: getProfileUrl(req, finalUser.profilePicture)
    });
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

    // Delete profile picture if it exists
    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      try {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        const filePath = path.join(uploadDir, user.profilePicture);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete profile picture during user deletion:', err);
      }
    }

    await deleteUserFromDbSource(req.params.id);
    res.json({ ok: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
