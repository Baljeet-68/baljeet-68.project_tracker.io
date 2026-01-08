const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAnnouncements } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');

let announcementsSource;
let createAnnouncementSource;
let updateAnnouncementSource;
let deleteAnnouncementSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  announcementsSource = dbApi.getAnnouncementsFromMySQL;
  createAnnouncementSource = dbApi.createAnnouncementInDb;
  updateAnnouncementSource = dbApi.updateAnnouncementInDb;
  deleteAnnouncementSource = dbApi.deleteAnnouncementFromDb;
} else {
  const localData = require('../data');
  if (!localData.announcements) localData.announcements = [];
  announcementsSource = async () => localData.announcements;
  createAnnouncementSource = async (announcement) => {
    localData.announcements.push(announcement);
  };
  updateAnnouncementSource = async (id, changes) => {
    const idx = localData.announcements.findIndex(a => a.id === id);
    if (idx !== -1) {
      localData.announcements[idx] = { ...localData.announcements[idx], ...changes };
    }
  };
  deleteAnnouncementSource = async (id) => {
    const idx = localData.announcements.findIndex(a => a.id === id);
    if (idx !== -1) {
      localData.announcements.splice(idx, 1);
    }
  };
}

// GET /api/announcements - Get all announcements for the user
router.get('/announcements', authenticate, async (req, res) => {
  try {
    const all = await getAnnouncements(req);
    const { userId, role } = req.user;
    const now = new Date();

    // Filter based on targeting and dates
    const filtered = all.filter(a => {
      // Admin and HR see everything for management purposes
      if (role === 'admin' || role === 'hr') return true;

      // Check if active
      if (!a.active) return false;

      // Check dates
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      if (now < start || now > end) return false;

      // Check targeting
      if (a.targetType === 'all') return true;
      if (a.targetType === 'role' && a.targetValue === role) return true;
      if (a.targetType === 'user' && a.targetValue === userId) return true;

      return false;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements - Create announcement (Admin/HR only)
router.post('/announcements', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, content, targetType, targetValue, startDate, endDate, active } = req.body;
    if (!title || !content || !targetType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newAnnouncement = {
      id: `ann${Date.now()}`,
      title,
      content,
      targetType,
      targetValue: targetValue || null,
      startDate,
      endDate,
      active: active !== undefined ? active : true,
      createdBy: req.user.userId,
      createdAt: new Date().toISOString()
    };

    await createAnnouncementSource(newAnnouncement);
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/announcements/:id - Update announcement (Admin/HR only)
router.patch('/announcements/:id', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, content, targetType, targetValue, startDate, endDate, active } = req.body;
    const changes = {};
    if (title !== undefined) changes.title = title;
    if (content !== undefined) changes.content = content;
    if (targetType !== undefined) changes.targetType = targetType;
    if (targetValue !== undefined) changes.targetValue = targetValue;
    if (startDate !== undefined) changes.startDate = startDate;
    if (endDate !== undefined) changes.endDate = endDate;
    if (active !== undefined) changes.active = active;

    await updateAnnouncementSource(req.params.id, changes);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id - Delete announcement (Admin/HR only)
router.delete('/announcements/:id', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    await deleteAnnouncementSource(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
