const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichBug, logActivity } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');

let bugsSource;
let bugCountersSource;
let usersSource;
let projectsSource;
let bugByIdSource;
let updateBugInDbSource;
let deleteBugFromDbSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  bugsSource = async () => await dbApi.getBugsFromMySQL();
  bugCountersSource = async () => {
    // For live DB, we might need a better way to handle bug counters per project.
    // For now, let's just fetch all bugs and find the max bugNumber for each project.
    const allBugs = await dbApi.getBugsFromMySQL();
    const counters = {};
    allBugs.forEach(b => {
      if (!counters[b.projectId] || b.bugNumber > counters[b.projectId]) {
        counters[b.projectId] = b.bugNumber;
      }
    });
    return counters;
  };
  usersSource = async () => await dbApi.getUsersFromMySQL();
  projectsSource = async () => await dbApi.getProjectsFromMySQL();
  bugByIdSource = dbApi.getBugById;
  updateBugInDbSource = dbApi.updateBugInDb;
  deleteBugFromDbSource = dbApi.deleteBugFromDb;
} else {
  const localData = require('../data');
  bugsSource = async () => localData.bugs;
  bugCountersSource = async () => localData.bugCounters;
  usersSource = async () => localData.users;
  projectsSource = async () => localData.projects;
  bugByIdSource = async (id) => localData.bugs.find(b => b.id === id);
  updateBugInDbSource = async (bugId, changes) => {
    const bugs = await bugsSource();
    const bugIndex = bugs.findIndex(b => b.id === bugId);
    if (bugIndex > -1) {
      bugs[bugIndex] = { ...bugs[bugIndex], ...changes };
    }
  };
}

// GET /api/bugs - list all bugs (admin only for now)
router.get(`/bugs`, authenticate, async (req, res) => {
  try {
    const allBugs = await bugsSource();
    let result = [];
    if (req.user.role === 'admin') {
      result = allBugs;
    } else {
      // Filter bugs where user has project access
      const projects = await projectsSource();
      const userProjects = projects.filter(p => {
        if (req.user.role === 'tester' && p.testerId === req.user.userId) return true;
        if (req.user.role === 'developer' && p.developerIds && p.developerIds.includes(req.user.userId)) return true;
        return false;
      }).map(p => p.id);
      result = allBugs.filter(b => userProjects.includes(b.projectId));
    }
    res.json(await Promise.all(result.map(b => enrichBug(req, b))));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bugs/stats/:year - get bug stats grouped by month for a specific year
router.get(`/bugs/stats/:year`, authenticate, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    let stats;
    if (USE_LIVE_DB) {
      const dbApi = require('../api');
      const rows = await dbApi.getBugStatsByYear(year);
      // Map database result to standard format (ensure all 12 months are present)
      const monthlyCounts = Array(12).fill(0).map((_, i) => ({ month: i + 1, count: 0 }));
      rows.forEach(r => {
        const mIdx = r.month - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthlyCounts[mIdx].count = r.count;
        }
      });
      stats = monthlyCounts;
    } else {
      const localData = require('../data');
      const monthlyCounts = Array(12).fill(0);
      localData.bugs.forEach(bug => {
        const createdAt = new Date(bug.createdAt);
        if (createdAt.getFullYear() === year) {
          monthlyCounts[createdAt.getMonth()]++;
        }
      });
      stats = monthlyCounts.map((count, index) => ({
        month: index + 1,
        count: count
      }));
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bugs/years - get available years for bug reports
router.get(`/bugs/years`, authenticate, async (req, res) => {
  try {
    let years;
    if (USE_LIVE_DB) {
      const { pool } = require('../api');
      const [rows] = await pool.query('SELECT DISTINCT YEAR(createdAt) as year FROM bugs ORDER BY year DESC');
      years = rows.map(r => r.year);
    } else {
      const localData = require('../data');
      const yearsSet = new Set();
      localData.bugs.forEach(bug => {
        yearsSet.add(new Date(bug.createdAt).getFullYear());
      });
      years = Array.from(yearsSet).sort((a, b) => b - a);
    }
    
    // If no years found, return current year as default
    if (years.length === 0) {
      years = [new Date().getFullYear()];
    }
    
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id/bugs - list bugs with per-project numbering
router.get(`/projects/:id/bugs`, authenticate, async (req, res) => {
  try {
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const bugs = await bugsSource();
    const projectBugs = await Promise.all(bugs.filter((b) => b.projectId === req.params.id).map(b => enrichBug(req, b)));
    res.json(projectBugs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/bugs - tester/admin only create bug
router.post(`/projects/:id/bugs`, authenticate, requireRole('tester', 'admin'), async (req, res) => {
  try {
    const projects = await projectsSource();
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
    const bugCounters = await bugCountersSource();
    bugCounters[req.params.id] = (bugCounters[req.params.id] || 0) + 1;
    const bugNumber = bugCounters[req.params.id];

    const id = `bug${Date.now()}`;
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null
    };

    if (USE_LIVE_DB) {
      // Insert into MySQL bugs table
      const sql = `INSERT INTO bugs
        (id, projectId, bugNumber, description, screenId, module, assignedDeveloperId, createdBy, status, severity, attachments, deadline, createdAt, updatedAt, resolvedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        bug.id,
        bug.projectId,
        bug.bugNumber,
        bug.description,
        bug.screenId,
        bug.module,
        bug.assignedDeveloperId,
        bug.createdBy,
        bug.status,
        bug.severity,
        JSON.stringify(bug.attachments),
        bug.deadline,
        bug.createdAt,
        bug.updatedAt,
        bug.resolvedAt
      ];
      await pool.execute(sql, params);
    } else {
      const bugs = await bugsSource();
      bugs.push(bug);
      p.bugs = p.bugs || [];
      p.bugs.push(bug.id);
    }
    logActivity(req.params.id, 'bug', bug.id, 'created', req.user.userId, { bugNumber: bug.bugNumber });
    res.status(201).json(await enrichBug(req, bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id - tester (if createdBy) / admin (all fields) - restrict field-level access
router.patch(`/bugs/:id`, authenticate, async (req, res) => {
  try {
    const bug = await bugByIdSource(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Developers can update deadline only
    if (req.user.role === 'developer') {
      const { deadline } = req.body;
      if (deadline !== undefined) {
        const changes = { deadline: deadline ? new Date(deadline).toISOString() : null, updatedAt: new Date().toISOString() };
        await updateBugInDbSource(bug.id, changes);
        logActivity(bug.projectId, 'bug', bug.id, 'deadline_updated', req.user.userId, { deadline });
        const updatedBug = await bugByIdSource(bug.id);
        return res.json(await enrichBug(req, updatedBug));
      }
      return res.status(403).json({ error: 'Forbidden - developers can only update deadline' });
    }

    // Tester can only edit if they created it
    if (req.user.role === 'tester' && bug.createdBy !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden - can only edit bugs you created' });
    }

    const { description, severity, screenId, module, assignedDeveloperId, deadline } = req.body;
    const changes = {};

    if (description !== undefined) changes.description = description;
    if (severity !== undefined) changes.severity = severity;
    if (screenId !== undefined) changes.screenId = screenId;
    if (module !== undefined) changes.module = module;
    if (assignedDeveloperId !== undefined) changes.assignedDeveloperId = assignedDeveloperId;
    if (deadline !== undefined) changes.deadline = deadline ? new Date(deadline).toISOString() : null;

    changes.updatedAt = new Date().toISOString();
    await updateBugInDbSource(bug.id, changes);
    const updatedBug = await bugByIdSource(bug.id);
    logActivity(bug.projectId, 'bug', bug.id, 'updated', req.user.userId, changes);
    res.json(await enrichBug(req, updatedBug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id/status - developer/tester/admin only update status and resolvedAt
router.patch(`/bugs/:id/status`, authenticate, requireRole('developer', 'tester', 'admin'), async (req, res) => {
  try {
    const bug = await bugByIdSource(req.params.id);
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
      changes.status = status;
      changes.oldStatus = oldStatus;
      changes.newStatus = status;
    }
    if (status === 'Resolved' && resolvedAt) {
      changes.resolvedAt = new Date(resolvedAt).toISOString();
    }

    changes.updatedAt = new Date().toISOString();
    await updateBugInDbSource(bug.id, changes);
    const updatedBug = await bugByIdSource(bug.id);
    logActivity(bug.projectId, 'bug', bug.id, 'status_change', req.user.userId, changes);
    res.json(await enrichBug(req, updatedBug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/bugs/:id - admin only delete bug
router.delete(`/bugs/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const bug = await bugByIdSource(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (USE_LIVE_DB) {
      await deleteBugFromDbSource(req.params.id);
    } else {
      const bugs = await bugsSource();
      const index = bugs.findIndex((b) => b.id === req.params.id);
      bugs.splice(index, 1);
    }

    logActivity(bug.projectId, 'bug', bug.id, 'deleted', req.user.userId, { description: bug.description });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
