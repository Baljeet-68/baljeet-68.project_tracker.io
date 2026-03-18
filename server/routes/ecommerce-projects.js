const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { hasProjectAccess, enrichProject, normalizeProjectObj, logActivity, getBugs, getScreens } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const { pool } = require('../db');
const localData = !USE_LIVE_DB ? require('../data') : null;

// Helper to get projects from DB or local data
async function getECommerceProjects(req) {
  if (USE_LIVE_DB) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE type = "ecommerce"');
    return rows;
  } else {
    return (localData.projects || []).filter(p => p.type === 'ecommerce');
  }
}

async function getProjectById(id) {
  if (USE_LIVE_DB) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ? AND type = "ecommerce"', [id]);
    return rows[0] || null;
  } else {
    return (localData.projects || []).find(p => p.id === id && p.type === 'ecommerce');
  }
}

/**
 * GET /ecommerce-projects
 */
router.get('/ecommerce-projects', authenticate, async (req, res) => {
  try {
    const allProjects = await getECommerceProjects(req);
    let result = [];
    
    if (req.user.role === 'admin' || req.user.role === 'management' || req.user.role === 'ecommerce') {
      result = allProjects;
    } else {
      result = allProjects.filter((p) => {
        const project = normalizeProjectObj(p);
        return project.developerIds && project.developerIds.includes(req.user.userId);
      });
    }
    
    const enrichedProjects = await Promise.all(result.map(p => enrichProject(req, p)));
    res.json(enrichedProjects);
  } catch (error) {
    console.error('Error in GET /ecommerce-projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /ecommerce-projects/:id
 */
router.get('/ecommerce-projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const p = await getProjectById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    
    const enriched = await enrichProject(req, p);
    enriched.screensList = await getScreens(req, id);
    enriched.bugsList = await getBugs(req, id);

    res.json(enriched);
  } catch (error) {
    console.error(`Error in GET /ecommerce-projects/${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /ecommerce-projects
 */
router.post('/ecommerce-projects', authenticate, requireRole('admin'), async (req, res) => {
  const { name, client, description, startDate, endDate, developerIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const id = `eco${Date.now()}`;
  const project = {
    id,
    name,
    client: client || '',
    description: description || '',
    status: 'Under Planning',
    developerIds: developerIds || [],
    type: 'ecommerce',
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString()
  };

  try {
    if (USE_LIVE_DB) {
      const sql = `INSERT INTO projects
        (id, name, client, description, status, developerIds, type, createdBy, createdAt, startDate, endDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        project.id, project.name, project.client, project.description, project.status,
        JSON.stringify(project.developerIds), project.type, project.createdBy,
        project.createdAt, project.startDate, project.endDate
      ];
      await pool.execute(sql, params);
    } else {
      if (!localData.projects) localData.projects = [];
      localData.projects.push(project);
    }
    res.status(201).json(await enrichProject(req, project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /ecommerce-projects/:id
 */
router.patch('/ecommerce-projects/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const p = await getProjectById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    const { name, description, status, client, startDate, endDate, developerIds } = req.body;
    const changes = {};

    if (name !== undefined) changes.name = name;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) changes.status = status;
    if (client !== undefined) changes.client = client;
    if (startDate !== undefined) changes.startDate = startDate;
    if (endDate !== undefined) changes.endDate = endDate;
    if (developerIds !== undefined) changes.developerIds = developerIds;

    if (USE_LIVE_DB) {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(changes)) {
        fields.push(`${key} = ?`);
        values.push(key === 'developerIds' ? JSON.stringify(val) : val);
      }
      values.push(req.params.id);
      await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    } else {
      Object.assign(p, changes);
    }

    logActivity(req.params.id, 'project', req.params.id, 'updated', req.user.userId, changes);
    res.json(await enrichProject(req, await getProjectById(req.params.id)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /ecommerce-projects/:id
 */
router.delete('/ecommerce-projects/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (USE_LIVE_DB) {
      await pool.execute('DELETE FROM projects WHERE id = ? AND type = "ecommerce"', [req.params.id]);
    } else {
      const index = localData.projects.findIndex(p => p.id === req.params.id && p.type === 'ecommerce');
      if (index > -1) localData.projects.splice(index, 1);
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
