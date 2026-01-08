const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getNotifications } = require('../middleware/helpers');

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
    await pool.query(
      'UPDATE notifications SET status = "read" WHERE user_id = ? AND status = "unread"',
      [userId]
    );
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
    await pool.query(
      'UPDATE notifications SET status = "read" WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
