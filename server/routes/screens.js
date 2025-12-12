const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichScreen, normalizeProjectObj, logActivity } = require('../middleware/helpers');
const { getProjectById } = require('../api');
const { screens, users } = require('../data');

// GET /api/projects/:id/screens - list screens for a project
router.get(`/projects/:id/screens`, authenticate, async (req, res) => {
  try {
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const projectScreens = screens.filter(s => s.projectId === req.params.id).map(s => enrichScreen(s));
    res.json(projectScreens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/screens - admin only create screen
router.post(`/projects/:id/screens`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    const project = normalizeProjectObj(p);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });

    // Validate assignee is valid developer
    if (assigneeId && !project.developerIds.includes(assigneeId)) {
      return res.status(400).json({ error: 'Assignee must be a developer on this project' });
    }

    const screen = {
      id: `scr${Date.now()}`,
      projectId: project.id,
      title,
      module: module || 'General',
      assigneeId: assigneeId || null,
      plannedDeadline: plannedDeadline ? new Date(plannedDeadline) : null,
      actualEndDate: null,
      status: 'Planned',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    screens.push(screen);
    logActivity(project.id, 'screen', screen.id, 'created', req.user.userId, { title });
    res.status(201).json(enrichScreen(screen));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/screens/:id - admin/developer update screen details (name, deadline, assignee)
router.patch(`/screens/:id`, authenticate, async (req, res) => {
  try {
    const scr = screens.find((s) => s.id === req.params.id);
    if (!scr) return res.status(404).json({ error: 'Screen not found' });

    if (!await hasProjectAccess(req.user.userId, scr.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const p = await getProjectById(scr.projectId);
    const project = normalizeProjectObj(p);

    // Developers can only update deadline if assigned to this screen
    if (req.user.role === 'developer' && scr.assigneeId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - not assigned to this screen' });
    }

    // Only admin can update title, module, assigneeId, notes
    if (req.user.role !== 'admin') {
      const { plannedDeadline } = req.body;
      if (plannedDeadline !== undefined) {
        scr.plannedDeadline = plannedDeadline ? new Date(plannedDeadline) : null;
        scr.updatedAt = new Date().toISOString();
        logActivity(scr.projectId, 'screen', scr.id, 'deadline_updated', req.user.userId, { plannedDeadline });
        return res.json(enrichScreen(scr));
      }
      return res.status(403).json({ error: 'Forbidden - limited update access' });
    }

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    const changes = {};

    if (title !== undefined) { scr.title = title; changes.title = title; }
    if (module !== undefined) { scr.module = module; changes.module = module; }
    if (plannedDeadline !== undefined) {
      scr.plannedDeadline = plannedDeadline ? new Date(plannedDeadline) : null;
      changes.plannedDeadline = plannedDeadline;
    }
    if (assigneeId !== undefined) {
      if (assigneeId && !project.developerIds.includes(assigneeId)) {
        return res.status(400).json({ error: 'Assignee not assigned to this project' });
      }
      scr.assigneeId = assigneeId;
      changes.assigneeId = assigneeId;
    }
    if (notes !== undefined) { scr.notes = notes; changes.notes = notes; }

    scr.updatedAt = new Date().toISOString();
    logActivity(scr.projectId, 'screen', scr.id, 'updated', req.user.userId, changes);
    res.json(enrichScreen(scr));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/screens/:id/status - developer/admin only update status and actualEndDate
router.patch(`/screens/:id/status`, authenticate, requireRole('admin', 'developer'), async (req, res) => {
  try {
    const scr = screens.find((s) => s.id === req.params.id);
    if (!scr) return res.status(404).json({ error: 'Screen not found' });

    if (!await hasProjectAccess(req.user.userId, scr.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only allow assigned developer or admin to update status
    if (req.user.role === 'developer' && scr.assigneeId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - not assigned to this screen' });
    }

    const { status, actualEndDate } = req.body;
    const oldStatus = scr.status;
    const changes = {};

    if (status) {
      scr.status = status;
      changes.oldStatus = oldStatus;
      changes.newStatus = status;
    }
    if (status === 'Done' && actualEndDate) {
      scr.actualEndDate = new Date(actualEndDate);
      changes.actualEndDate = actualEndDate;
    }

    scr.updatedAt = new Date().toISOString();
    logActivity(scr.projectId, 'screen', scr.id, 'status_change', req.user.userId, changes);
    res.json(enrichScreen(scr));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/screens/:id - admin only delete screen
router.delete(`/screens/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const index = screens.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Screen not found' });
    }
    const deletedScreen = screens.splice(index, 1)[0];
    logActivity(deletedScreen.projectId, 'screen', deletedScreen.id, 'deleted', req.user.userId, { title: deletedScreen.title });
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
