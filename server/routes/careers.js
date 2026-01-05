const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { USE_LIVE_DB } = require('../config');
const dbApi = USE_LIVE_DB ? require('../api') : null;
const localData = !USE_LIVE_DB ? require('../data') : null;
const crypto = require('crypto');

// Abstraction for Jobs
var jobsSource;
var createJobSource;
var updateJobSource;
var deleteJobSource;

// Abstraction for Applications
var applicationsSource;
var createApplicationSource;
var updateApplicationSource;

if (USE_LIVE_DB) {
  jobsSource = async () => await dbApi.getJobsFromMySQL();
  createJobSource = dbApi.createJobInDb;
  updateJobSource = dbApi.updateJobInDb;
  deleteJobSource = dbApi.deleteJobFromDb;

  applicationsSource = async () => await dbApi.getApplicationsFromMySQL();
  createApplicationSource = dbApi.createApplicationInDb;
  updateApplicationSource = dbApi.updateApplicationInDb;
} else {
  jobsSource = async () => localData.jobs || [];
  createJobSource = async (j) => {
    if (!localData.jobs) localData.jobs = [];
    localData.jobs.push(j);
  };
  updateJobSource = async (id, changes) => {
    const idx = (localData.jobs || []).findIndex(j => j.id === id);
    if (idx > -1) localData.jobs[idx] = { ...localData.jobs[idx], ...changes };
  };
  deleteJobSource = async (id) => {
    localData.jobs = (localData.jobs || []).filter(j => j.id !== id);
  };

  applicationsSource = async () => localData.applications || [];
  createApplicationSource = async (a) => {
    if (!localData.applications) localData.applications = [];
    localData.applications.push(a);
  };
  updateApplicationSource = async (id, status) => {
    const idx = (localData.applications || []).findIndex(a => a.id === id);
    if (idx > -1) localData.applications[idx].status = status;
  };
}

// JOB ROUTES

// GET /api/public-jobs - available to everyone without token
router.get('/public-jobs', async (req, res) => {
  try {
    const jobs = await jobsSource();
    // Only return active jobs for the public API
    const activeJobs = jobs.filter(job => 
      job.status && job.status.toLowerCase() === 'active'
    );
    res.json(activeJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/public-apply - handle job applications from PHP
router.post('/public-apply', async (req, res) => {
  try {
    const { jobId, fullName, email, phone, coverLetter, resumeUrl } = req.body;
    
    if (!jobId || !fullName || !email) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const application = {
      id: crypto.randomUUID(),
      jobId,
      fullName,
      email,
      phone,
      coverLetter,
      resumeUrl: resumeUrl || '', // In a real app, this would be a file path from an upload
      status: 'applied',
      appliedAt: new Date().toISOString(),
      userId: null // Public application, no userId
    };

    await createApplicationSource(application);
    res.status(201).json({ success: true, applicationId: application.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs - available to authenticated users
router.get('/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await jobsSource();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs - admin/hr only
router.post('/jobs', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const job = {
      id: crypto.randomUUID(),
      ...req.body,
      createdBy: req.user.userId,
      createdAt: new Date().toISOString()
    };
    await createJobSource(job);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/jobs/:id - admin/hr only
router.patch('/jobs/:id', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    await updateJobSource(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id - admin/hr only
router.delete('/jobs/:id', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    await deleteJobSource(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// APPLICATION ROUTES

// GET /api/applications - admin/hr only
router.get('/applications', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const apps = await applicationsSource();
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications - users apply
router.post('/applications', authenticate, async (req, res) => {
  try {
    const app = {
      id: crypto.randomUUID(),
      ...req.body,
      userId: req.user.userId,
      appliedAt: new Date().toISOString()
    };
    await createApplicationSource(app);
    res.status(201).json(app);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:id/status - admin/hr only
router.patch('/applications/:id/status', authenticate, requireRole('admin', 'hr'), async (req, res) => {
  try {
    await updateApplicationSource(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
