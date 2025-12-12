const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichProject, normalizeProjectObj, logActivity } = require('../middleware/helpers');
const { getProjectsFromMySQL, getProjectById, updateProjectInDb } = require('../api');
const { users } = require('../data');
const { pool } = require('../db');

// GET /api/projects - list only assigned projects per user
router.get(`/projects`, authenticate, async (req, res) => {
  try {
    const allProjects = await getProjectsFromMySQL();
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
    res.json(result.map(p => enrichProject(p)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id - get single project with full details
router.get(`/projects/:id`, authenticate, async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    
    // Check access
    const hasAccess = await hasProjectAccess(req.user.userId, req.params.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Add screens and bugs details (still from in-memory for now)
    // NOTE: screens and bugs are still in-memory for now, will be moved to DB later
    const { screens, bugs } = require('../data');
    p.screensList = screens.filter(s => s.projectId === p.id);
    p.bugsList = bugs.filter(b => b.projectId === p.id).map(b => enrichBug(b));
    res.json(enrichProject(p));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects - admin only create project
router.post(`/projects`, authenticate, requireRole('admin'), async (req, res) => {
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

  // Generate a unique id (Supabase can also auto-generate)
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
    res.status(201).json(enrichProject(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id - admin only update project
router.patch(`/projects/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });

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

    await updateProjectInDb(req.params.id, changes);
    
    // Fetch updated project
    const updatedProject = await getProjectById(req.params.id);
    
    logActivity(updatedProject.id, 'project', updatedProject.id, 'updated', req.user.userId, changes);
    res.json(enrichProject(updatedProject));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /projects/:id - admin only delete project
router.delete(`/projects/:id`, authenticate, requireRole('admin'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    logActivity(projectId, 'project', projectId, 'deleted', req.user.userId, {});
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
