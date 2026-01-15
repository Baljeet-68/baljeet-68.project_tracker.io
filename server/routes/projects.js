/**
 * @file routes/projects.js
 * @description API routes for project management.
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichProject, normalizeProjectObj, logActivity, enrichBug, getUserName, getBugs, getScreens, getProjects } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const dbApi = USE_LIVE_DB ? require('../api') : null;
const localData = !USE_LIVE_DB ? require('../data') : null;
const { pool } = require('../db');

// Define data source functions based on configuration
let getProjectsSource;
let getProjectByIdSource;
let updateProjectInDbSource;
let usersSource;
let projectsSource;
let screensSource;
let bugsSource;

if (USE_LIVE_DB) {
  getProjectsSource = dbApi.getProjectsFromMySQL;
  getProjectByIdSource = dbApi.getProjectById;
  updateProjectInDbSource = dbApi.updateProjectInDb;
  usersSource = async () => await dbApi.getUsersFromMySQL();
  projectsSource = []; 
  screensSource = []; 
  bugsSource = []; 
} else {
  projectsSource = localData.projects;
  usersSource = () => localData.users;
  screensSource = localData.screens;
  bugsSource = localData.bugs;

  getProjectsSource = async () => projectsSource;
  getProjectByIdSource = async (id) => projectsSource.find(p => p.id === id);
  updateProjectInDbSource = async (projectId, changes) => {
    const projectIndex = projectsSource.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
      projectsSource[projectIndex] = { ...projectsSource[projectIndex], ...changes };
    }
  };
}

/**
 * GET /projects
 * @description List assigned projects for the authenticated user.
 * Admins see all projects.
 */
router.get(`/projects`, authenticate, async (req, res) => {
  try {
    const allProjects = await getProjects(req);
    let result = [];
    
    if (req.user.role === 'admin') {
      result = allProjects;
    } else {
      // Filter projects based on user's role and assignment
      result = allProjects.filter((p) => {
        const project = normalizeProjectObj(p);
        const isTester = (req.user.role === 'tester') && project.testerId === req.user.userId;
        const isDeveloper = (req.user.role === 'developer' || req.user.role === 'ecommerce') && 
                            project.developerIds && project.developerIds.includes(req.user.userId);
        return isTester || isDeveloper;
      });
    }
    
    // Enrich all projects in parallel
    const enrichedProjects = await Promise.all(result.map(p => enrichProject(req, p)));
    res.json(enrichedProjects);
  } catch (error) {
    console.error('Error in GET /projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /projects/:id
 * @description Get full details of a single project including screens and bugs.
 */
router.get(`/projects/:id`, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const p = await getProjectByIdSource(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    
    // Check access rights
    const hasAccess = await hasProjectAccess(req.user.userId, id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access Forbidden' });
    }

    // Related details (screens and bugs) are now fetched efficiently inside enrichProject
    // because we updated enrichProject to use getBugs(req, p.id) and getScreens(req, p.id)
    // which use the new filtered database queries.
    const enriched = await enrichProject(req, p);
    
    // For the single project view, we might want to include the lists explicitly
    // if the client expects them as screensList and bugsList.
    enriched.screensList = await getScreens(req, id);
    enriched.bugsList = await Promise.all((await getBugs(req, id)).map(b => enrichBug(req, b)));

    res.json(enriched);
  } catch (error) {
    console.error(`Error in GET /projects/${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/projects/:id/activity - get project activity log
router.get(`/projects/:id/activity`, authenticate, async (req, res) => {
  try {
    const projectId = req.params.id;
    // Check access
    const hasAccess = await hasProjectAccess(req.user.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const localData = require('../data');
    const activity = localData.activityLog.filter(a => a.projectId === projectId);

    // Enrich activity with user names
    const enrichedActivity = await Promise.all(activity.map(async (a) => ({
      ...a,
      createdByName: await getUserName(a.createdBy, req)
    })));

    res.json(enrichedActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - admin only create project
router.post(`/projects`, authenticate, requireRole('admin'), async (req, res) => {
  const { name, client, description, startDate, endDate, testerId, developerIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const users = await usersSource();

  // Validate that testerId is a valid tester user (tester or admin)
  if (testerId && !users.find(u => u.id === testerId && (u.role === 'tester' || u.role === 'admin'))) {
    return res.status(400).json({ error: 'Invalid tester ID' });
  }

  // Validate that developerIds are valid project-related users (developer, admin, or ecommerce)
  if (developerIds && developerIds.length > 0) {
    const invalid = developerIds.filter(id => !users.find(u => u.id === id && (u.role === 'developer' || u.role === 'admin' || u.role === 'ecommerce')));
    if (invalid.length > 0) return res.status(400).json({ error: 'Invalid developer IDs' });
  }

  // Generate a unique id (Supabase can also auto-generate)
  const id = `proj${Date.now()}`;
  const project = {
    id,
    name,
    client: client || '',
    description: description || '',
    status: 'Planning',
    testerId: testerId || null,
    developerIds: developerIds || [],
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString()
  };

  try {
    if (USE_LIVE_DB) {
      // Insert into MySQL projects table. developerIds stored as JSON string.
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
    } else {
      projectsSource.push(project);
    }
    res.status(201).json(await enrichProject(req, project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id - admin only update project
router.patch(`/projects/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const p = await getProjectByIdSource(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    const { name, description, status, client, startDate, endDate, testerId, developerIds } = req.body;
    const changes = {};

    const users = await usersSource();

    if (name !== undefined) changes.name = name;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) changes.status = status;
    if (client !== undefined) changes.client = client;
    if (startDate !== undefined) changes.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) changes.endDate = endDate ? new Date(endDate) : null;
    
    if (testerId !== undefined) {
      // Allow if testerId is same as current, or if it's a valid tester
      if (testerId && testerId !== p.testerId) {
        if (!users.find(u => u.id === testerId && (u.role === 'tester' || u.role === 'admin'))) {
          return res.status(400).json({ error: 'Invalid tester ID' });
        }
      }
      changes.testerId = testerId || null;
    }
    if (developerIds !== undefined) {
      if (developerIds && developerIds.length > 0) {
        // Only validate IDs that were ADDED
        const currentIds = p.developerIds || [];
        const newIds = developerIds.filter(id => !currentIds.includes(id));
        if (newIds.length > 0) {
          const invalid = newIds.filter(id => !users.find(u => u.id === id && (u.role === 'developer' || u.role === 'admin' || u.role === 'ecommerce')));
          if (invalid.length > 0) return res.status(400).json({ error: 'Invalid developer IDs' });
        }
      }
      changes.developerIds = developerIds;
    }

    await updateProjectInDbSource(req.params.id, changes);
    
    // Fetch updated project
    const updatedProject = await getProjectByIdSource(req.params.id);
    
    logActivity(updatedProject.id, 'project', updatedProject.id, 'updated', req.user.userId, changes);
    res.json(await enrichProject(req, updatedProject));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /projects/:id - admin only delete project
router.delete(`/projects/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const projectId = req.params.id;
    if (USE_LIVE_DB) {
      const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
    } else {
      const projects = await getProjectsSource();
      const index = projects.findIndex(p => p.id === projectId);
      if (index === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }
      projects.splice(index, 1);
    }
    logActivity(projectId, 'project', projectId, 'deleted', req.user.userId, {});
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
