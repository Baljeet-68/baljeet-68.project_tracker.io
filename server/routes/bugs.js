/**
 * @file routes/bugs.js
 * @description API routes for bug tracking and reporting.
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichBug, logActivity, getBugs, getProjects, normalizeProjectObj } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const dbApi = USE_LIVE_DB ? require('../api') : null;
const localData = !USE_LIVE_DB ? require('../data') : null;
const { pool } = require('../db');

// Define data source functions
let bugsSource;
let usersSource;
let projectsSource;
let bugByIdSource;
let updateBugInDbSource;
let deleteBugFromDbSource;
let bugCountersSource;

if (USE_LIVE_DB) {
  bugsSource = async () => await dbApi.getBugsFromMySQL();
  usersSource = async () => await dbApi.getUsersFromMySQL();
  projectsSource = async () => await dbApi.getProjectsFromMySQL();
  bugByIdSource = dbApi.getBugById;
  updateBugInDbSource = dbApi.updateBugInDb;
  deleteBugFromDbSource = dbApi.deleteBugFromDb;
  bugCountersSource = async () => {
    const [rows] = await pool.query('SELECT projectId, MAX(bugNumber) as maxBugNumber FROM bugs GROUP BY projectId');
    const counters = {};
    rows.forEach(r => { counters[r.projectId] = r.maxBugNumber; });
    return counters;
  };
} else {
  bugsSource = async () => localData.bugs;
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
  bugCountersSource = async () => {
    const counters = {};
    localData.bugs.forEach(b => {
      counters[b.projectId] = Math.max(counters[b.projectId] || 0, b.bugNumber || 0);
    });
    return counters;
  };
}

/**
 * GET /bugs
 * @description List all bugs accessible to the user.
 */
router.get(`/bugs`, authenticate, async (req, res) => {
  try {
    // Use the request-scoped cache helper
    const allBugs = await getBugs(req);
    let result = [];
    
    if (req.user.role === 'admin') {
      result = allBugs;
    } else {
      // For non-admins, we still need to filter based on project access.
      // However, getUsers and getProjects will now also be cached per-request.
      const projects = await getProjects(req);
      
      const userProjectIds = projects.filter(p => {
        const project = normalizeProjectObj(p);
        const isTester = (req.user.role === 'tester') && project.testerId === req.user.userId;
        const isDeveloper = (req.user.role === 'developer' || req.user.role === 'ecommerce') && 
                            project.developerIds && project.developerIds.includes(req.user.userId);
        return isTester || isDeveloper;
      }).map(p => p.id);
      
      result = allBugs.filter(b => userProjectIds.includes(b.projectId));
    }
    
    // Enrich results in parallel
    const enrichedBugs = await Promise.all(result.map(b => enrichBug(req, b)));
    res.json(enrichedBugs);
  } catch (error) {
    console.error('Error in GET /bugs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
      let rows;
      
      if (req.user.role === 'admin') {
        rows = await dbApi.getBugStatsByYear(year);
      } else {
        // For non-admin, only count bugs from projects they have access to
        const projects = await dbApi.getProjectsFromMySQL();
        const userProjectIds = projects.filter(p => {
          const isTester = (req.user.role === 'tester' || req.user.role === 'admin') && p.testerId === req.user.userId;
          const isDeveloper = (req.user.role === 'developer' || req.user.role === 'admin' || req.user.role === 'ecommerce') && p.developerIds && p.developerIds.includes(req.user.userId);
          return isTester || isDeveloper;
        }).map(p => p.id);

        if (userProjectIds.length === 0) {
          rows = [];
        } else {
          const sql = `
            SELECT MONTH(createdAt) as month, COUNT(*) as count 
            FROM bugs 
            WHERE YEAR(createdAt) = ? AND projectId IN (${userProjectIds.map(() => '?').join(',')})
            GROUP BY MONTH(createdAt)`;
          const [dbRows] = await pool.execute(sql, [year, ...userProjectIds]);
          rows = dbRows;
        }
      }

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
      
      let filteredBugs = localData.bugs;
      if (req.user.role !== 'admin') {
        const userProjectIds = localData.projects.filter(p => {
          if (req.user.role === 'tester' && p.testerId === req.user.userId) return true;
          if (req.user.role === 'developer' && p.developerIds && p.developerIds.includes(req.user.userId)) return true;
          return false;
        }).map(p => p.id);
        filteredBugs = localData.bugs.filter(b => userProjectIds.includes(b.projectId));
      }

      filteredBugs.forEach(bug => {
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
    const projectId = req.params.id;
    if (!await hasProjectAccess(req.user.userId, projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Use the optimized helper that utilizes filtered database queries
    const projectBugs = await getBugs(req, projectId);
    const enrichedBugs = await Promise.all(projectBugs.map(b => enrichBug(req, b)));
    
    res.json(enrichedBugs);
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

    // Validate assigned developer is in the project (admin can assign anyone who is a developer)
    if (assignedDeveloperId) {
      const users = await usersSource();
      const dev = users.find(u => u.id === assignedDeveloperId);
      if (!dev || dev.role !== 'developer') {
        return res.status(400).json({ error: 'Assignee must be a developer' });
      }
      if (req.user.role !== 'admin' && !p.developerIds.includes(assignedDeveloperId)) {
        return res.status(400).json({ error: 'Developer not assigned to this project' });
      }
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
      screenId: screenId || null,
      module: module || '',
      assignedDeveloperId: assignedDeveloperId || null,
      createdBy: req.user.userId,
      status: 'Open',
      severity: severity || 'medium',
      attachments: attachments && Array.isArray(attachments) ? attachments : [],
      deadline: (deadline && deadline.trim() !== '') ? new Date(deadline) : null,
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
    logActivity(req.params.id, 'bug', bug.id, 'created', req.user.userId, { bugNumber: bug.bugNumber, description: bug.description });
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

    const { description, severity, screenId, module, assignedDeveloperId, deadline, attachments, status, resolvedAt } = req.body;
    const changes = {};

    if (description !== undefined) changes.description = description;
    if (severity !== undefined) changes.severity = severity;
    if (screenId !== undefined) changes.screenId = screenId || null;
    if (module !== undefined) changes.module = module;
    if (assignedDeveloperId !== undefined) {
      if (assignedDeveloperId) {
        const users = await usersSource();
        const dev = users.find(u => u.id === assignedDeveloperId);
        if (!dev || dev.role !== 'developer') {
          return res.status(400).json({ error: 'Assignee must be a developer' });
        }
        const projects = await projectsSource();
        const p = projects.find(x => x.id === bug.projectId);
        if (req.user.role !== 'admin' && p && !p.developerIds.includes(assignedDeveloperId)) {
          return res.status(400).json({ error: 'Developer not assigned to this project' });
        }
      }
      changes.assignedDeveloperId = assignedDeveloperId || null;
    }
    if (deadline !== undefined) changes.deadline = deadline ? new Date(deadline).toISOString() : null;
    if (attachments !== undefined) changes.attachments = attachments;
    if (status !== undefined) changes.status = status;
    if (resolvedAt !== undefined) changes.resolvedAt = resolvedAt ? new Date(resolvedAt).toISOString() : null;

    changes.updatedAt = new Date().toISOString();
    await updateBugInDbSource(bug.id, changes);
    const updatedBug = await bugByIdSource(bug.id);
    logActivity(bug.projectId, 'bug', bug.id, 'updated', req.user.userId, { ...changes, bugNumber: bug.bugNumber, description: bug.description });
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
    logActivity(bug.projectId, 'bug', bug.id, 'status_change', req.user.userId, { ...changes, bugNumber: bug.bugNumber, description: bug.description });
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

    logActivity(bug.projectId, 'bug', bug.id, 'deleted', req.user.userId, { bugNumber: bug.bugNumber, description: bug.description });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
