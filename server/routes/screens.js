const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichScreen, normalizeProjectObj, logActivity } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');

let screensSource;
let usersSource;
let projectsSource;
let screenByIdSource;
let updateScreenInDbSource;
let deleteScreenFromDbSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  screensSource = async () => await dbApi.getScreensFromMySQL();
  usersSource = async () => await dbApi.getUsersFromMySQL();
  projectsSource = async () => await dbApi.getProjectsFromMySQL();
  screenByIdSource = dbApi.getScreenById;
  updateScreenInDbSource = dbApi.updateScreenInDb;
  deleteScreenFromDbSource = dbApi.deleteScreenFromDb;
} else {
  const localData = require('../data');
  screensSource = async () => localData.screens;
  usersSource = async () => localData.users;
  projectsSource = async () => localData.projects;
  screenByIdSource = async (id) => localData.screens.find(s => s.id === id);
  updateScreenInDbSource = async (screenId, changes) => {
    const screens = await screensSource();
    const screenIndex = screens.findIndex(s => s.id === screenId);
    if (screenIndex > -1) {
      screens[screenIndex] = { ...screens[screenIndex], ...changes };
    }
  };
  deleteScreenFromDbSource = async (screenId) => {
    const screens = await screensSource();
    const index = screens.findIndex(s => s.id === screenId);
    if (index !== -1) {
      screens.splice(index, 1);
    }
  };
}

// GET /api/screens - list all screens
router.get(`/screens`, authenticate, async (req, res) => {
  try {
    const allScreens = await screensSource();
    let result = [];
    if (req.user.role === 'admin') {
      result = allScreens;
    } else {
      const projects = await projectsSource();
      const userProjects = projects.filter(p => {
        if (req.user.role === 'tester' && p.testerId === req.user.userId) return true;
        if (req.user.role === 'developer' && p.developerIds && p.developerIds.includes(req.user.userId)) return true;
        return false;
      }).map(p => p.id);
      result = allScreens.filter(s => userProjects.includes(s.projectId));
    }
    res.json(await Promise.all(result.map(s => enrichScreen(req, s))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/screens - list screens for a project
router.get(`/projects/:id/screens`, authenticate, async (req, res) => {
  try {
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const screens = await screensSource();
    const projectScreens = await Promise.all(screens.filter(s => s.projectId === req.params.id).map(s => enrichScreen(req, s)));
    res.json(projectScreens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/screens - admin only create screen
router.post(`/projects/:id/screens`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const projects = await projectsSource();
    const p = projects.find((x) => x.id === req.params.id);
    const project = normalizeProjectObj(p);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });

    // Validate assignee is valid developer
    if (assigneeId) {
      const users = await usersSource();
      const assignee = users.find(u => u.id === assigneeId);
      if (!assignee || assignee.role !== 'developer' || !project.developerIds.includes(assigneeId)) {
        return res.status(400).json({ error: 'Assignee must be a developer on this project' });
      }
    }

    const screen = {
      id: `scr${Date.now()}`,
      projectId: project.id,
      title,
      module: module || 'General',
      assigneeId: assigneeId || null,
      plannedDeadline: plannedDeadline ? new Date(plannedDeadline).toISOString() : null,
      actualEndDate: null,
      status: 'Planned',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (USE_LIVE_DB) {
      await createScreenInDbSource(screen);
    } else {
      const screens = await screensSource();
      screens.push(screen);
    }

    logActivity(project.id, 'screen', screen.id, 'created', req.user.userId, { title });
    res.status(201).json(await enrichScreen(req, screen));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/screens/:id - admin/developer update screen details (name, deadline, assignee)
router.patch(`/screens/:id`, authenticate, async (req, res) => {
  try {
    let scr = await screenByIdSource(req.params.id);
    if (!scr) return res.status(404).json({ error: 'Screen not found' });

    if (!await hasProjectAccess(req.user.userId, scr.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const projects = await projectsSource();
    const p = projects.find((x) => x.id === scr.projectId);
    const project = normalizeProjectObj(p);

    // Developers can only update deadline if assigned to this screen
    if (req.user.role === 'developer' && scr.assigneeId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - not assigned to this screen' });
    }

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    const changes = {};

    // Only admin can update title, module, assigneeId, notes
    if (req.user.role !== 'admin') {
      if (plannedDeadline !== undefined) {
        changes.plannedDeadline = plannedDeadline ? new Date(plannedDeadline).toISOString() : null;
      }
      // If developer, only plannedDeadline can be updated
      if (Object.keys(req.body).some(key => !['plannedDeadline'].includes(key))) {
        return res.status(403).json({ error: 'Forbidden - limited update access' });
      }
    } else { // Admin can update all fields
      if (title !== undefined) { changes.title = title; }
      if (module !== undefined) { changes.module = module; }
      if (plannedDeadline !== undefined) {
        changes.plannedDeadline = plannedDeadline ? new Date(plannedDeadline).toISOString() : null;
      }
      if (assigneeId !== undefined) {
        // Validate assignee is valid developer
        if (assigneeId) {
          const users = await usersSource();
          const assignee = users.find(u => u.id === assigneeId);
          if (!assignee || assignee.role !== 'developer' || !project.developerIds.includes(assigneeId)) {
            return res.status(400).json({ error: 'Assignee must be a developer on this project' });
          }
        }
        changes.assigneeId = assigneeId;
      }
      if (notes !== undefined) { changes.notes = notes; }
    }

    if (Object.keys(changes).length === 0) {
      return res.status(200).json(await enrichScreen(req, scr)); // No changes, return existing screen
    }

    // Apply changes to the screen object
    const updatedScreen = { ...scr, ...changes, updatedAt: new Date().toISOString() };

    if (USE_LIVE_DB) {
      await updateScreenInDbSource(updatedScreen.id, changes);
    } else {
      const screens = await screensSource();
      const screenIndex = screens.findIndex(s => s.id === updatedScreen.id);
      if (screenIndex > -1) {
        screens[screenIndex] = updatedScreen;
      }
    }

    logActivity(scr.projectId, 'screen', scr.id, 'updated', req.user.userId, changes);
    res.json(await enrichScreen(req, updatedScreen));
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
    res.json(await enrichScreen(req, scr));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/screens/:id - admin only delete screen
router.delete(`/screens/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const scr = await screenByIdSource(req.params.id);
    if (!scr) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    if (USE_LIVE_DB) {
      await deleteScreenFromDbSource(req.params.id);
    } else {
      const screens = await screensSource();
      const index = screens.findIndex(s => s.id === req.params.id);
      if (index !== -1) {
        screens.splice(index, 1);
      }
    }

    logActivity(scr.projectId, 'screen', scr.id, 'deleted', req.user.userId, { title: scr.title });
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
