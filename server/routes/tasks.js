const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { getMyTasks, getProjectTasks } = require('../services/taskService');

router.get('/tasks/my', authenticate, async (req, res) => {
  try {
    const tasks = await getMyTasks(req);
    res.json(tasks);
  } catch (error) {
    req.log?.error({ err: error }, 'Error in GET /tasks/my');
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// project-specific task list
router.get('/tasks/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await getProjectTasks(req, projectId);
    res.json(tasks);
  } catch (error) {
    req.log?.error({ err: error }, 'Error in GET /tasks/project/:projectId');
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
});

router.get('/tasks/count', authenticate, async (req, res) => {
  try {
    const tasks = await getMyTasks(req);
    const counts = {
      total: tasks.length,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const t of tasks) {
      if (t.priority === 'high') counts.high += 1;
      if (t.priority === 'medium') counts.medium += 1;
      if (t.priority === 'low') counts.low += 1;
    }

    res.json(counts);
  } catch (error) {
    req.log?.error({ err: error }, 'Error in GET /tasks/count');
    res.status(500).json({ error: 'Failed to fetch task counts' });
  }
});

module.exports = router;

