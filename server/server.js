// server.js
require("dotenv").config(); // MUST BE FIRST

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

// BASE_URL from .env
const BASE_URL = process.env.BASE_URL || "";
const PORT = process.env.PORT || 4000;

console.log("=================================");
console.log("SERVER RUNNING");
console.log("BASE_URL:", BASE_URL);
console.log("PORT:", PORT);
console.log("=================================");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mmfinfotech.website",
      "https://mmfinfotech.website/Project_Tracker_Tool"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
  })
);

// Data files
const {
  users,
  projects,
  screens,
  bugs,
  activityLog,
  bugCounters,
} = require("./data");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ========================================================
// AUTH HELPERS
// ========================================================

const tokenBlacklist = new Set();

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing authorization header" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ error: "Invalid auth format" });

  if (tokenBlacklist.has(token))
    return res.status(401).json({ error: "Token revoked" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

function getUserName(id) {
  const u = users.find((u) => u.id === id);
  return u?.name || "Unknown";
}

function normalizeProjectObj(p) {
  if (!p) return null;

  if (typeof p.developerIds === "string") {
    try { p.developerIds = JSON.parse(p.developerIds); }
    catch { p.developerIds = p.developerIds.split(",").map(s => s.trim()); }
  }

  if (!Array.isArray(p.developerIds)) p.developerIds = [];
  if (!p.testerId) p.testerId = "";

  return p;
}

async function hasProjectAccess(userId, projectId) {
  const { getProjectById } = require("./api");
  let project = await getProjectById(projectId);
  if (!project) return false;

  project = normalizeProjectObj(project);

  const user = users.find(u => u.id === userId);
  if (!user) return false;

  if (user.role === "admin") return true;
  if (user.role === "tester" && project.testerId === userId) return true;
  if (user.role === "developer" && project.developerIds.includes(userId)) return true;

  return false;
}

function enrichBug(b) {
  return {
    ...b,
    createdByName: getUserName(b.createdBy),
    assignedDeveloperName: getUserName(b.assignedDeveloperId),
  };
}

function enrichScreen(s) {
  return {
    ...s,
    assigneeName: getUserName(s.assigneeId)
  };
}

function logActivity(projectId, entityType, entityId, action, userId, changes) {
  const log = {
    id: "act" + Date.now(),
    projectId,
    entityType,
    entityId,
    action,
    createdBy: userId,
    changes,
    createdAt: new Date()
  };
  activityLog.push(log);
}

// ========================================================
// PUBLIC TEST ROUTE
// ========================================================
app.get(`${BASE_URL}/api/hello`, (req, res) => {
  res.json({ message: "Hello from Node server!", baseUrl: BASE_URL });
});

// ========================================================
// AUTH ROUTES
// ========================================================

// LOGIN
app.post(`${BASE_URL}/login`, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// LOGOUT
app.post(`${BASE_URL}/logout`, authenticate, (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  tokenBlacklist.add(token);
  res.json({ ok: true });
});

// CURRENT USER
app.get(`${BASE_URL}/me`, authenticate, (req, res) => {
  const u = users.find(u => u.id === req.user.userId);

  if (!u) return res.status(404).json({ error: "User not found" });

  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  });
});

// ========================================================
// PROJECT ROUTES
// ========================================================
const { getProjectsFromSupabase, getProjectById, updateProjectInDb } = require("./api");
const { pool } = require("./db");

// GET ALL PROJECTS (role-restricted)
app.get(`${BASE_URL}/api/projects`, authenticate, async (req, res) => {
  try {
    const allProjects = await getProjectsFromSupabase();

    let result = [];
    if (req.user.role === "admin") {
      result = allProjects;
    } else {
      result = allProjects.filter(p =>
        (req.user.role === "tester" && p.testerId === req.user.userId) ||
        (req.user.role === "developer" && p.developerIds.includes(req.user.userId))
      );
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE PROJECT WITH SCREENS + BUGS
app.get(`${BASE_URL}/api/projects/:id`, authenticate, async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found" });

    if (!await hasProjectAccess(req.user.userId, req.params.id))
      return res.status(403).json({ error: "Forbidden" });

    p.screensList = screens.filter(s => s.projectId === p.id).map(enrichScreen);
    p.bugsList = bugs.filter(b => b.projectId === p.id).map(enrichBug);

    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PROJECT (ADMIN ONLY)
app.post(`${BASE_URL}/api/projects`, authenticate, requireRole("admin"), async (req, res) => {
  const { name, client, description, startDate, endDate, testerId, developerIds } = req.body;

  if (!name) return res.status(400).json({ error: "Missing project name" });

  // Validate tester
  if (testerId && !users.find(u => u.id === testerId && u.role === "tester"))
    return res.status(400).json({ error: "Invalid tester ID" });

  // Validate developers
  if (developerIds && developerIds.filter(id => !users.find(u => u.id === id && u.role === "developer")).length > 0)
    return res.status(400).json({ error: "Invalid developer IDs" });

  const id = `proj${Date.now()}`;

  const newProject = {
    id,
    name,
    client: client || "",
    description: description || "",
    status: "Planning",
    testerId: testerId || "",
    developerIds: developerIds || [],
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : new Date()
  };

  try {
    await pool.execute(
      `INSERT INTO projects (id, name, client, description, status, testerId, developerIds, createdBy, createdAt, startDate, endDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProject.id,
        newProject.name,
        newProject.client,
        newProject.description,
        newProject.status,
        newProject.testerId,
        JSON.stringify(newProject.developerIds),
        newProject.createdBy,
        newProject.createdAt,
        newProject.startDate,
        newProject.endDate
      ]
    );

    res.json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROJECT (ADMIN ONLY)
app.patch(`${BASE_URL}/api/projects/:id`, authenticate, requireRole("admin"), async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found" });

    const { name, description, status, client, startDate, endDate, testerId, developerIds } = req.body;
    const changes = {};

    if (name !== undefined) changes.name = name;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) changes.status = status;
    if (client !== undefined) changes.client = client;
    if (startDate !== undefined) changes.startDate = new Date(startDate);
    if (endDate !== undefined) changes.endDate = new Date(endDate);

    if (testerId !== undefined) {
      if (testerId && !users.find(u => u.id === testerId && u.role === "tester"))
        return res.status(400).json({ error: "Invalid tester ID" });
      changes.testerId = testerId;
    }

    if (developerIds !== undefined) {
      if (developerIds.filter(id => !users.find(u => u.id === id && u.role === "developer")).length > 0)
        return res.status(400).json({ error: "Invalid developer IDs" });

      changes.developerIds = developerIds;
    }

    await updateProjectInDb(req.params.id, changes);

    const updated = await getProjectById(req.params.id);
    logActivity(updated.id, "project", updated.id, "updated", req.user.userId, changes);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// SCREEN ROUTES
// ========================================================

// LIST SCREENS FOR A PROJECT
app.get(`${BASE_URL}/api/projects/:id/screens`, authenticate, async (req, res) => {
  if (!await hasProjectAccess(req.user.userId, req.params.id))
    return res.status(403).json({ error: "Forbidden" });

  const list = screens.filter(s => s.projectId === req.params.id).map(enrichScreen);
  res.json(list);
});

// CREATE SCREEN (ADMIN ONLY)
app.post(`${BASE_URL}/api/projects/:id/screens`, authenticate, requireRole("admin"), async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found" });

    const { title, module, assigneeId, plannedDeadline, notes } = req.body;
    if (!title) return res.status(400).json({ error: "Missing title" });

    if (assigneeId && !p.developerIds.includes(assigneeId))
      return res.status(400).json({ error: "Assignee not part of project" });

    const scr = {
      id: "scr" + Date.now(),
      projectId: p.id,
      title,
      module: module || "General",
      assigneeId: assigneeId || null,
      plannedDeadline: plannedDeadline ? new Date(plannedDeadline) : null,
      status: "Planned",
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    screens.push(scr);
    logActivity(p.id, "screen", scr.id, "created", req.user.userId, { title });

    res.json(enrichScreen(scr));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// BUG ROUTES
// ========================================================

// LIST BUGS FOR PROJECT
app.get(`${BASE_URL}/api/projects/:id/bugs`, authenticate, async (req, res) => {
  if (!await hasProjectAccess(req.user.userId, req.params.id))
    return res.status(403).json({ error: "Forbidden" });

  const result = bugs
    .filter(b => b.projectId === req.params.id)
    .map(enrichBug);

  res.json(result);
});

// CREATE BUG (tester/admin)
app.post(`${BASE_URL}/api/projects/:id/bugs`, authenticate, requireRole("tester", "admin"), async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (!await hasProjectAccess(req.user.userId, project.id))
    return res.status(403).json({ error: "Forbidden" });

  const { description, screenId, module, assignedDeveloperId, severity, attachments, deadline } = req.body;

  if (!description) return res.status(400).json({ error: "Missing description" });
  if (!severity) return res.status(400).json({ error: "Missing severity" });

  // validate assigned dev
  if (assignedDeveloperId && !project.developerIds.includes(assignedDeveloperId))
    return res.status(400).json({ error: "Developer not in this project" });

  // bug number auto-increment
  bugCounters[project.id] = (bugCounters[project.id] || 0) + 1;

  const bug = {
    id: "bug" + Date.now(),
    projectId: project.id,
    bugNumber: bugCounters[project.id],
    description,
    screenId: screenId || "",
    module: module || "",
    assignedDeveloperId: assignedDeveloperId || "",
    createdBy: req.user.userId,
    severity,
    status: "Open",
    attachments: attachments || [],
    deadline: deadline ? new Date(deadline) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null
  };

  bugs.push(bug);
  logActivity(project.id, "bug", bug.id, "created", req.user.userId, { description, severity });

  res.json(enrichBug(bug));
});

// UPDATE BUG (tester/admin, dev limited)
app.patch(`${BASE_URL}/api/bugs/:id`, authenticate, async (req, res) => {
  const bug = bugs.find(b => b.id === req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });

  if (!await hasProjectAccess(req.user.userId, bug.projectId))
    return res.status(403).json({ error: "Forbidden" });

  const p = projects.find(pr => pr.id === bug.projectId);
  const changes = {};

  // Developer can only update deadline
  if (req.user.role === "developer") {
    if (req.body.deadline === undefined)
      return res.status(403).json({ error: "Developers may update deadline only" });

    bug.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    bug.updatedAt = new Date();

    logActivity(bug.projectId, "bug", bug.id, "deadline_updated", req.user.userId, { deadline: req.body.deadline });
    return res.json(enrichBug(bug));
  }

  // Tester: only if they created it
  if (req.user.role === "tester" && bug.createdBy !== req.user.userId)
    return res.status(403).json({ error: "Forbidden — testers can only edit their own bugs" });

  const { description, severity, screenId, module, assignedDeveloperId, deadline } = req.body;

  if (description !== undefined) { bug.description = description; changes.description = description; }
  if (severity !== undefined) { bug.severity = severity; changes.severity = severity; }
  if (screenId !== undefined) { bug.screenId = screenId; changes.screenId = screenId; }
  if (module !== undefined) { bug.module = module; changes.module = module; }

  if (assignedDeveloperId !== undefined) {
    if (assignedDeveloperId && !p.developerIds.includes(assignedDeveloperId))
      return res.status(400).json({ error: "Invalid developer for this project" });

    bug.assignedDeveloperId = assignedDeveloperId;
    changes.assignedDeveloperId = assignedDeveloperId;
  }

  if (deadline !== undefined) {
    bug.deadline = deadline ? new Date(deadline) : null;
    changes.deadline = deadline;
  }

  bug.updatedAt = new Date();
  logActivity(bug.projectId, "bug", bug.id, "updated", req.user.userId, changes);

  res.json(enrichBug(bug));
});

// UPDATE BUG STATUS (dev/admin)
app.patch(`${BASE_URL}/api/bugs/:id/status`, authenticate, requireRole("developer", "admin"), async (req, res) => {
  const bug = bugs.find(b => b.id === req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });

  if (!await hasProjectAccess(req.user.userId, bug.projectId))
    return res.status(403).json({ error: "Forbidden" });

  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status" });

  const oldStatus = bug.status;
  bug.status = status;

  if (status === "Resolved" || status === "Closed")
    bug.resolvedAt = new Date();

  bug.updatedAt = new Date();

  logActivity(bug.projectId, "bug", bug.id, "status_change", req.user.userId, { oldStatus, newStatus: status });

  res.json(enrichBug(bug));
});

// DELETE BUG (admin only)
app.delete(`${BASE_URL}/api/bugs/:id`, authenticate, requireRole("admin"), async (req, res) => {
  const bug = bugs.find(b => b.id === req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });

  if (!await hasProjectAccess(req.user.userId, bug.projectId))
    return res.status(403).json({ error: "Forbidden" });

  const index = bugs.indexOf(bug);
  if (index > -1) bugs.splice(index, 1);

  logActivity(bug.projectId, "bug", bug.id, "deleted", req.user.userId, { bugNumber: bug.bugNumber });

  res.json({ ok: true });
});

// ========================================================
// USER MANAGEMENT (ADMIN)
// ========================================================

// CREATE USER
app.post(`${BASE_URL}/api/users`, authenticate, requireRole("admin"), (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ error: "Missing fields" });

  if (!["admin", "tester", "developer"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "User already exists" });

  const user = {
    id: "u" + Date.now(),
    name,
    email,
    password,
    role,
    active: true
  };

  users.push(user);
  logActivity("", "user", user.id, "created", req.user.userId, { email, role });

  res.json(user);
});

// LIST USERS
app.get(`${BASE_URL}/api/users`, authenticate, requireRole("admin"), (req, res) => {
  res.json(users);
});

// UPDATE USER
app.patch(`${BASE_URL}/api/users/:id`, authenticate, requireRole("admin"), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { role, active } = req.body;

  if (role && ["admin", "tester", "developer"].includes(role))
    user.role = role;

  if (active !== undefined)
    user.active = active;

  res.json(user);
});

// ========================================================
// ACTIVITY LOG
// ========================================================
function enrichActivity(a) {
  const u = users.find(x => x.id === a.createdBy);
  return {
    ...a,
    createdByName: u?.name || "Unknown",
    createdByEmail: u?.email || ""
  };
}

app.get(`${BASE_URL}/api/projects/:id/activity`, authenticate, async (req, res) => {
  if (!await hasProjectAccess(req.user.userId, req.params.id))
    return res.status(403).json({ error: "Forbidden" });

  const logs = activityLog
    .filter(a => a.projectId === req.params.id)
    .map(enrichActivity)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(logs);
});

// ========================================================
// 404 HANDLER
// ========================================================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

// ========================================================
// START SERVER
// ========================================================
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 BASE_URL applied: ${BASE_URL}`);
  console.log("=================================");
});
