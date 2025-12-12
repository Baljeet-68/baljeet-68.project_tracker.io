const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichBug, logActivity } = require('../middleware/helpers');
const { bugs, bugCounters, users, projects } = require('../data');

// GET /api/projects/:id/bugs - list bugs with per-project numbering
router.get(`/projects/:id/bugs`, authenticate, async (req, res) => {
  try {
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const projectBugs = bugs.filter((b) => b.projectId === req.params.id).map(b => enrichBug(b));
    res.json(projectBugs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/bugs - tester/admin only create bug
router.post(`/projects/:id/bugs`, authenticate, requireRole('tester', 'admin'), async (req, res) => {
  try {
    const p = projects.find((x) => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { description, screenId, module, assignedDeveloperId, severity, attachments, deadline } = req.body;
    if (!description) return res.status(400).json({ error: 'Missing description' });
    if (!severity) return res.status(400).json({ error: 'Missing severity' });

    // Validate assigned developer is in the project
    if (assignedDeveloperId && !p.developerIds.includes(assignedDeveloperId)) {
      return res.status(400).json({ error: 'Developer not assigned to this project' });
    }

    // Auto-increment bug number per project
    bugCounters[req.params.id] = (bugCounters[req.params.id] || 0) + 1;
    const bugNumber = bugCounters[req.params.id];

    const id = `bug${Math.floor(Math.random() * 100000)}`;
    const bug = {
      id,
      projectId: req.params.id,
      bugNumber,
      description,
      screenId: screenId || '',
      module: module || '',
      assignedDeveloperId: assignedDeveloperId || '',
      createdBy: req.user.userId,
      status: 'Open',
      severity: severity || 'medium',
      attachments: attachments && Array.isArray(attachments) ? attachments : [],
      deadline: deadline ? new Date(deadline) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null
    };
    bugs.push(bug);
    p.bugs = p.bugs || [];
    p.bugs.push(bug.id);
    logActivity(req.params.id, 'bug', bug.id, 'created', req.user.userId, { description, status: 'Open', severity, deadline });
    res.status(201).json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id - tester (if createdBy) / admin (all fields) - restrict field-level access
router.patch(`/bugs/:id`, authenticate, async (req, res) => {
  try {
    const bug = bugs.find((b) => b.id === req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Developers can update deadline only
    if (req.user.role === 'developer') {
      const { deadline } = req.body;
      if (deadline !== undefined) {
        bug.deadline = deadline ? new Date(deadline) : null;
        bug.updatedAt = new Date();
        logActivity(bug.projectId, 'bug', bug.id, 'deadline_updated', req.user.userId, { deadline });
        return res.json(enrichBug(bug));
      }
      return res.status(403).json({ error: 'Forbidden - developers can only update deadline' });
    }

    // Tester can only edit if they created it
    if (req.user.role === 'tester' && bug.createdBy !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - can only edit bugs you created' });
    }

    const { description, severity, screenId, module, assignedDeveloperId, deadline } = req.body;
    const changes = {};

    if (description !== undefined) { bug.description = description; changes.description = description; }
    if (severity !== undefined) { bug.severity = severity; changes.severity = severity; }
    if (screenId !== undefined) { bug.screenId = screenId; changes.screenId = screenId; }
    if (module !== undefined) { bug.module = module; changes.module = module; }
    if (assignedDeveloperId !== undefined) { bug.assignedDeveloperId = assignedDeveloperId; changes.assignedDeveloperId = assignedDeveloperId; }
    if (deadline !== undefined) { bug.deadline = deadline ? new Date(deadline) : null; changes.deadline = deadline; }

    bug.updatedAt = new Date();
    logActivity(bug.projectId, 'bug', bug.id, 'updated', req.user.userId, changes);
    res.json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id/status - developer/tester/admin only update status and resolvedAt
router.patch(`/bugs/:id/status`, authenticate, requireRole('developer', 'tester', 'admin'), async (req, res) => {
  try {
    const bug = bugs.find((b) => b.id === req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only allow assigned developer or admin to update status
    if (req.user.role === 'developer' && bug.assignedDeveloperId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - not assigned to this bug' });
    }

    const { status, resolvedAt } = req.body;
    const oldStatus = bug.status;
    const changes = {};

    if (status) {
      bug.status = status;
      changes.oldStatus = oldStatus;
      changes.newStatus = status;
    }
    if (status === 'Resolved' && resolvedAt) {
      bug.resolvedAt = new Date(resolvedAt);
      changes.resolvedAt = resolvedAt;
    }

    bug.updatedAt = new Date();
    logActivity(bug.projectId, 'bug', bug.id, 'status_change', req.user.userId, changes);
    res.json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/bugs/:id - admin only delete bug
router.delete(`/bugs/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const index = bugs.findIndex((b) => b.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Bug not found' });

    const bug = bugs[index];
    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    bugs.splice(index, 1);
    logActivity(bug.projectId, 'bug', bug.id, 'deleted', req.user.userId, { description: bug.description });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
