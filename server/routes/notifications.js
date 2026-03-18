const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getNotifications } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const localData = !USE_LIVE_DB ? require('../data') : null;

// Get notifications for the logged-in user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const notifications = await getNotifications(req, userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all notifications as read for the logged-in user
router.post('/notifications/mark-all-read', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    if (USE_LIVE_DB) {
      await pool.query(
        'UPDATE notifications SET status = "read" WHERE user_id = ? AND status = "unread"',
        [userId]
      );
    } else {
      if (localData.notifications) {
        localData.notifications.forEach(n => {
          if (n.user_id === userId) n.status = 'read';
        });
      }
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Mark a specific notification as read
router.post('/notifications/:id/mark-read', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    if (USE_LIVE_DB) {
      await pool.query(
        'UPDATE notifications SET status = "read" WHERE id = ? AND user_id = ?',
        [id, userId]
      );
    } else {
      if (localData.notifications) {
        const notif = localData.notifications.find(n => String(n.id) === String(id) && n.user_id === userId);
        if (notif) notif.status = 'read';
      }
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * GET /notifications/preferences
 * @description Get notification preferences for the logged-in user
 */
router.get('/notifications/preferences', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    if (USE_LIVE_DB) {
      const [rows] = await pool.query('SELECT * FROM notification_preferences WHERE user_id = ?', [userId]);
      res.json(rows);
    } else {
      res.json(localData.notification_preferences ? localData.notification_preferences.filter(p => p.user_id === userId) : []);
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

/**
 * POST /notifications/preferences
 * @description Save notification preferences for the logged-in user
 */
router.post('/notifications/preferences', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body; // Array of { type, email_enabled, inapp_enabled }

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' });
    }

    if (USE_LIVE_DB) {
      for (const pref of preferences) {
        await pool.execute(
          'INSERT INTO notification_preferences (user_id, type, email_enabled, inapp_enabled) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE email_enabled = ?, inapp_enabled = ?',
          [userId, pref.type, pref.email_enabled, pref.inapp_enabled, pref.email_enabled, pref.inapp_enabled]
        );
      }
    } else {
      if (!localData.notification_preferences) localData.notification_preferences = [];
      for (const pref of preferences) {
        const index = localData.notification_preferences.findIndex(p => p.user_id === userId && p.type === pref.type);
        if (index > -1) {
          localData.notification_preferences[index] = { ...localData.notification_preferences[index], ...pref };
        } else {
          localData.notification_preferences.push({ user_id: userId, ...pref });
        }
      }
    }
    res.json({ message: 'Notification preferences saved' });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
});

module.exports = router;

