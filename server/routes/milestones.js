const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { USE_LIVE_DB } = require('../config');
const dbApi = USE_LIVE_DB ? require('../api') : null;
const localData = !USE_LIVE_DB ? require('../data') : null;
const crypto = require('crypto');

var milestonesSource;
var createMilestoneInDbSource;
var updateMilestoneInDbSource;
var deleteMilestoneFromDbSource;

if (USE_LIVE_DB) {
  milestonesSource = async () => await dbApi.getMilestonesFromMySQL();
  createMilestoneInDbSource = dbApi.createMilestoneInDb;
  updateMilestoneInDbSource = dbApi.updateMilestoneInDb;
  deleteMilestoneFromDbSource = dbApi.deleteMilestoneFromDb;
} else {
  // Local mode (simplified)
  milestonesSource = async () => localData.milestones || [];
  createMilestoneInDbSource = async (m) => {
    if (!localData.milestones) localData.milestones = [];
    localData.milestones.push(m);
  };
  updateMilestoneInDbSource = async (id, changes) => {
    if (!localData.milestones) return;
    const idx = localData.milestones.findIndex(m => m.id === id);
    if (idx > -1) localData.milestones[idx] = { ...localData.milestones[idx], ...changes };
  };
  deleteMilestoneFromDbSource = async (id) => {
    if (!localData.milestones) return;
    localData.milestones = localData.milestones.filter(m => m.id !== id);
  };
}

// GET /api/projects/:id/milestones
router.get('/projects/:id/milestones', authenticate, async (req, res) => {
  try {
    const allMilestones = await milestonesSource();
    const projectMilestones = allMilestones.filter(m => m.projectId === req.params.id);
    res.json(projectMilestones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/milestones
router.post('/projects/:id/milestones', authenticate, async (req, res) => {
  try {
    const { milestoneNumber, module, timeline, status } = req.body;
    const milestone = {
      id: crypto.randomUUID(),
      projectId: req.params.id,
      milestoneNumber,
      module,
      timeline,
      status: status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await createMilestoneInDbSource(milestone);
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/milestones/:id
router.patch('/milestones/:id', authenticate, async (req, res) => {
  try {
    const changes = { ...req.body, updatedAt: new Date().toISOString() };
    await updateMilestoneInDbSource(req.params.id, changes);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/milestones/:id
router.delete('/milestones/:id', authenticate, async (req, res) => {
  try {
    await deleteMilestoneFromDbSource(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
