// server.js
const express = require("express");
const cors = require("cors");
const app = express();

require('dotenv').config();

const MODE = process.env.MODE || "local"; // "local" or "live"
const isLocal = MODE === "local";

console.log("SERVER MODE:", isLocal ? "LOCAL" : "LIVE");

// FIXED — add JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.url.startsWith('/Project_Tracker_Tool/server')) {
    req.url = req.url.replace('/Project_Tracker_Tool/server', '');
  }
  next();
});


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mmfinfotech.website",
      "https://mmfinfotech.website/Project_Tracker_Tool"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 4000;
const jwt = require('jsonwebtoken');

// In local mode we load the in-memory data
const { users, projects, screens, bugs, activityLog, bugCounters } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BASE_URL = process.env.BASE_URL || '';

// Public test route
app.get(`/api/hello`, (req, res) => {
  res.json({ message: 'Hello from Node server!', mode: MODE });
});

// ============ AUTHENTICATION (PHASE 1) ============

// Login - accepts { email, password } - returns JWT with userId, email, role
app.post(`/login`, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// In-memory token blacklist for logout (demo only)
const tokenBlacklist = new Set();

// Logout - add token to blacklist (demo)
app.post(`/logout`, (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  if (token) tokenBlacklist.add(token);
  return res.json({ ok: true });
});

// Get current user
app.get(`/me`, (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
  const token = parts[1];
  if (tokenBlacklist.has(token)) return res.status(401).json({ error: 'Token revoked' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === payload.userId);
    return res.json({ id: payload.userId, email: payload.email, role: payload.role, name: user?.name });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Middleware to protect routes
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
  const token = parts[1];
  if (tokenBlacklist.has(token)) return res.status(401).json({ error: 'Token revoked' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  }
}

// Helper: normalize project object returned from DB or local
function normalizeProjectObj(p) {
  if (!p) return null;

  // developerIds may come as JSON string from DB; ensure array
  if (p.developerIds && typeof p.developerIds === 'string') {
    try {
      p.developerIds = JSON.parse(p.developerIds);
    } catch (e) {
      // fallback: split by comma (if stored that way)
      p.developerIds = p.developerIds.split ? p.developerIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
  }
  p.developerIds = Array.isArray(p.developerIds) ? p.developerIds : [];

  // Ensure testerId exists
  p.testerId = p.testerId || '';

  return p;
}

// Helper: Check if user has access to project (local or live)
async function hasProjectAccess(userId, projectId) {
  let project;
  if (isLocal) {
    project = projects.find(p => p.id === projectId);
  } else {
    const { getProjectById } = require('./api');
    project = await getProjectById(projectId);
  }
  project = normalizeProjectObj(project);
  if (!project) return false;
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'tester' && project.testerId === userId) return true;
  if (user.role === 'developer' && project.developerIds.includes(userId)) return true;
  return false;
}

// Helper: Get user name by id
function getUserName(userId) {
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown';
}

// Helper: Enrich bug with user details
function enrichBug(b) {
  const creator = users.find(u => u.id === b.createdBy);
  const assignee = b.assignedDeveloperId ? users.find(u => u.id === b.assignedDeveloperId) : null;
  const screen = b.screenId ? screens.find(s => s.id === b.screenId) : null;
  return {
    ...b,
    createdByName: creator?.name || 'Unknown',
    createdByEmail: creator?.email || '',
    assignedDeveloperName: assignee?.name || 'Unassigned',
    assignedDeveloperEmail: assignee?.email || '',
    screenTitle: screen?.title || b.module || 'Unknown'
  };
}

// Helper: Enrich screen with user details
function enrichScreen(s) {
  const assignee = s.assigneeId ? users.find(u => u.id === s.assigneeId) : null;
  return {
    ...s,
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || ''
  };
}

// Helper: Enrich project with user details (and counts)
function enrichProject(p) {
  p = normalizeProjectObj(p);
  const screenDeadlines = screens.filter(s => s.projectId === p.id && s.plannedDeadline && new Date(s.plannedDeadline) > new Date()).length;
  const bugDeadlines = bugs.filter(b => b.projectId === p.id && b.deadline && new Date(b.deadline) > new Date()).length;
  return {
    ...p,
    testerName: p.testerId ? getUserName(p.testerId) : 'Unassigned',
    developerNames: (p.developerIds || []).map(id => ({ id, name: getUserName(id) })),
    openBugsCount: bugs.filter(b => b.projectId === p.id && (b.status === 'Open' || b.status === 'In Progress')).length,
    completedScreensCount: screens.filter(s => s.projectId === p.id && s.status === 'Done').length,
    totalScreensCount: screens.filter(s => s.projectId === p.id).length,
    upcomingDeadlines: screenDeadlines + bugDeadlines
  };
}

// ============ PROJECTS ENDPOINTS (PHASE 2) ============

// GET /projects - list only assigned projects per user
app.get(`/projects`, authenticate, async (req, res) => {
  try {
    let allProjects;

    if (isLocal) {
      allProjects = projects.map(p => normalizeProjectObj({ ...p }));
    } else {
      const { getProjectsFromMySQL } = require('./api');
      allProjects = await getProjectsFromMySQL();
      allProjects = (allProjects || []).map(p => normalizeProjectObj({ ...p }));
    }

    let result = [];
    if (req.user.role === 'admin') {
      result = allProjects;
    } else {
      result = allProjects.filter((p) => {
        if (req.user.role === 'tester' && p.testerId === req.user.userId) return true;
        if (req.user.role === 'developer' && p.developerIds && p.developerIds.includes(req.user.userId)) return true;
        return false;
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id - get single project with full details
app.get(`/api/projects/:id`, authenticate, async (req, res) => {
  try {
    let p;

    if (isLocal) {
      p = projects.find(pr => pr.id === req.params.id);
    } else {
      const { getProjectById } = require('./api');
      p = await getProjectById(req.params.id);
    }

    p = normalizeProjectObj(p);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    // Check access
    const hasAccess = await hasProjectAccess(req.user.userId, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Add screens and bugs details (still from in-memory for now)
    p.screensList = screens.filter(s => s.projectId === p.id).map(enrichScreen);
    p.bugsList = bugs.filter(b => b.projectId === p.id).map(b => enrichBug(b));

    res.json(enrichProject(p));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - admin only create project
app.post(`/api/projects`, authenticate, requireRole('admin'), async (req, res) => {
  const { name, client, description, startDate, endDate, testerId, developerIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  // Validate that testerId is a valid tester user
  if (testerId && !users.find(u => u.id === testerId && u.role === 'tester')) {
    return res.status(400).json({ error: 'Invalid tester ID' });
  }

  // Validate that developerIds are valid developer users
  if (developerIds && developerIds.length > 0) {
    const invalid = developerIds.filter(id => !users.find(u => u.id === id && u.role === 'developer'));
    if (invalid.length > 0) return res.status(400).json({ error: 'Invalid developer IDs' });
  }

  // Generate a unique id
  const id = `proj${Date.now()}`;
  const project = {
    id,
    name,
    client: client || '',
    description: description || '',
    status: 'Planning',
    testerId: testerId || '',
    developerIds: developerIds || [],
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString()
  };

  try {
    if (isLocal) {
      // push into in-memory projects
      projects.push(project);
      return res.json(project);
    } else {
      // Insert into MySQL projects table. developerIds stored as JSON string.
      const { pool } = require('./db');
      const sql = `INSERT INTO projects
        (id, name, client, description, status, testerId, developerIds, createdBy, createdAt, startDate, endDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        project.id,
        project.name,
        project.client,
        project.description,
        project.status,
        project.testerId,
        JSON.stringify(project.developerIds || []),
        project.createdBy,
        project.createdAt,
        project.startDate,
        project.endDate
      ];
      await pool.execute(sql, params);
      return res.json(project);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id - admin only update project
app.patch(`/api/projects/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    let p;
    if (isLocal) {
      p = projects.find(pr => pr.id === req.params.id);
      if (!p) return res.status(404).json({ error: 'Project not found' });
    } else {
      const { getProjectById } = require('./api');
      p = await getProjectById(req.params.id);
      if (!p) return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, status, client, startDate, endDate, testerId, developerIds } = req.body;
    const changes = {};

    if (name !== undefined) changes.name = name;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) changes.status = status;
    if (client !== undefined) changes.client = client;
    if (startDate !== undefined) changes.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) changes.endDate = endDate ? new Date(endDate) : null;

    if (testerId !== undefined) {
      if (testerId && !users.find(u => u.id === testerId && u.role === 'tester')) {
        return res.status(400).json({ error: 'Invalid tester ID' });
      }
      changes.testerId = testerId;
    }
    if (developerIds !== undefined) {
      if (developerIds && developerIds.length > 0) {
        const invalid = developerIds.filter(id => !users.find(u => u.id === id && u.role === 'developer'));
        if (invalid.length > 0) return res.status(400).json({ error: 'Invalid developer IDs' });
      }
      changes.developerIds = developerIds;
    }

    if (isLocal) {
      // apply changes in memory
      Object.assign(p, changes);
      p.updatedAt = new Date().toISOString();
    } else {
      const { updateProjectInDb, getProjectById } = require('./api');
      await updateProjectInDb(req.params.id, changes);
      p = await getProjectById(req.params.id);
    }

    const updatedProject = normalizeProjectObj(p);
    logActivity(updatedProject.id, 'project', updatedProject.id, 'updated', req.user.userId, changes);
    res.json(enrichProject(updatedProject));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SCREENS/TASKS ENDPOINTS (PHASE 3) ============

// GET /api/projects/:id/screens - list screens for a project
app.get(`/api/projects/:id/screens`, authenticate, async (req, res) => {
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
app.post(`/api/projects/:id/screens`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    // fetch project (local or live)
    let p;
    if (isLocal) {
      p = projects.find(pr => pr.id === req.params.id);
    } else {
      const { getProjectById } = require('./api');
      p = await getProjectById(req.params.id);
    }
    p = normalizeProjectObj(p);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });

    // Validate assignee is valid developer
    if (assigneeId && !p.developerIds.includes(assigneeId)) {
      return res.status(400).json({ error: 'Assignee must be a developer on this project' });
    }

    const screen = {
      id: `scr${Date.now()}`,
      projectId: p.id,
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
    logActivity(p.id, 'screen', screen.id, 'created', req.user.userId, { title });
    res.json(enrichScreen(screen));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/screens/:id - admin/developer update screen details (name, deadline, assignee)
app.patch(`/api/screens/:id`, authenticate, async (req, res) => {
  try {
    const scr = screens.find((s) => s.id === req.params.id);
    if (!scr) return res.status(404).json({ error: 'Screen not found' });

    if (!await hasProjectAccess(req.user.userId, scr.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let project;
    if (isLocal) {
      project = projects.find(p => p.id === scr.projectId);
    } else {
      const { getProjectById } = require('./api');
      project = await getProjectById(scr.projectId);
    }
    project = normalizeProjectObj(project);

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
app.patch(`/api/screens/:id/status`, authenticate, requireRole('admin', 'developer'), async (req, res) => {
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

// ============ BUGS ENDPOINTS (PHASE 4) ============

// GET /api/projects/:id/bugs - list bugs with per-project numbering
app.get(`/api/projects/:id/bugs`, authenticate, async (req, res) => {
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
app.post(`/api/projects/:id/bugs`, authenticate, requireRole('tester', 'admin'), async (req, res) => {
  try {
    let p;
    if (isLocal) {
      p = projects.find(pr => pr.id === req.params.id);
    } else {
      const { getProjectById } = require('./api');
      p = await getProjectById(req.params.id);
    }
    p = normalizeProjectObj(p);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null
    };
    bugs.push(bug);
    logActivity(req.params.id, 'bug', bug.id, 'created', req.user.userId, { description, status: 'Open', severity, deadline });
    res.json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id - tester (if createdBy) / admin (all fields) - restrict field-level access
app.patch(`/api/bugs/:id`, authenticate, async (req, res) => {
  try {
    const bug = bugs.find((b) => b.id === req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let p;
    if (isLocal) {
      p = projects.find(pr => pr.id === bug.projectId);
    } else {
      const { getProjectById } = require('./api');
      p = await getProjectById(bug.projectId);
    }
    p = normalizeProjectObj(p);

    // Developers can update deadline only
    if (req.user.role === 'developer') {
      const { deadline } = req.body;
      if (deadline !== undefined) {
        bug.deadline = deadline ? new Date(deadline) : null;
        bug.updatedAt = new Date().toISOString();
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
    if (assignedDeveloperId !== undefined) {
      if (assignedDeveloperId && !p.developerIds.includes(assignedDeveloperId)) {
        return res.status(400).json({ error: 'Developer not assigned to this project' });
      }
      bug.assignedDeveloperId = assignedDeveloperId;
      changes.assignedDeveloperId = assignedDeveloperId;
    }
    if (deadline !== undefined) {
      bug.deadline = deadline ? new Date(deadline) : null;
      changes.deadline = deadline;
    }

    bug.updatedAt = new Date().toISOString();
    logActivity(bug.projectId, 'bug', bug.id, 'updated', req.user.userId, changes);
    res.json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bugs/:id/status - developer/admin only (not tester) update status only
app.patch(`/api/bugs/:id/status`, authenticate, requireRole('admin', 'developer'), async (req, res) => {
  try {
    const bug = bugs.find((b) => b.id === req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    if (!await hasProjectAccess(req.user.userId, bug.projectId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });

    const oldStatus = bug.status;
    const changes = { oldStatus, newStatus: status };

    bug.status = status;
    if (status === 'Resolved') bug.resolvedAt = new Date().toISOString();
    if (status === 'Closed') bug.resolvedAt = bug.resolvedAt || new Date().toISOString();

    bug.updatedAt = new Date().toISOString();
    logActivity(bug.projectId, 'bug', bug.id, 'status_change', req.user.userId, changes);
    res.json(enrichBug(bug));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/bugs/:id - admin only (soft delete by marking archived)
app.delete(`/api/bugs/:id`, authenticate, requireRole('admin'), (req, res) => {
  const bug = bugs.find((b) => b.id === req.params.id);
  if (!bug) return res.status(404).json({ error: 'Bug not found' });

  if (!hasProjectAccess(req.user.userId, bug.projectId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const index = bugs.indexOf(bug);
  if (index > -1) {
    bugs.splice(index, 1);
    const p = projects.find(pr => pr.id === bug.projectId);
    if (p && p.bugs) {
      p.bugs = p.bugs.filter(id => id !== bug.id);
    }
    logActivity(bug.projectId, 'bug', bug.id, 'deleted', req.user.userId, { bugNumber: bug.bugNumber });
  }

  res.json({ ok: true });
});

// ============ USERS ENDPOINTS (ADMIN) ============

// Admin: create a new user
app.post(`/api/users`, authenticate, requireRole('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password || !role || !name) return res.status(400).json({ error: 'Missing fields' });
  if (!['admin', 'tester', 'developer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: 'User exists' });

  const id = `u${Math.floor(Math.random() * 100000)}`;
  const user = { id, name, email, password, role, active: true };
  users.push(user);
  logActivity('', 'user', id, 'created', req.user.userId, { email, role });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// Admin: list users
app.get(`/api/users`, authenticate, requireRole('admin'), (req, res) => {
  res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active })));
});

// Admin: deactivate/reactivate user
app.patch(`/api/users/:id`, authenticate, requireRole('admin'), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { active, role } = req.body;
  if (active !== undefined) { user.active = active; }
  if (role !== undefined && ['admin', 'tester', 'developer'].includes(role)) { user.role = role; }

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
});

// ============ ACTIVITY LOG (PHASE 5) ============

function logActivity(projectId, entityType, entityId, action, userId, changes) {
  const id = `act${Math.floor(Math.random() * 100000)}`;
  const log = {
    id,
    projectId: projectId || '',
    entityType,
    entityId,
    action,
    createdBy: userId,
    changes: changes || {},
    createdAt: new Date().toISOString()
  };
  activityLog.push(log);
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.activity = project.activity || [];
      project.activity.push(log.id);
    }
  }
}

// GET /api/projects/:id/activity - retrieve activity log with enriched data
app.get('/api/projects/:id/activity', authenticate, async (req, res) => {
  try {
    if (!await hasProjectAccess(req.user.userId, req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const projectActivity = activityLog.filter((a) => a.projectId === req.params.id).map(a => enrichActivity(a));
    // Sort by date descending
    projectActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(projectActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Enrich activity with user details
function enrichActivity(a) {
  const creator = users.find(u => u.id === a.createdBy);
  return {
    ...a,
    createdByName: creator?.name || 'Unknown',
    createdByEmail: creator?.email || ''
  };
}

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
