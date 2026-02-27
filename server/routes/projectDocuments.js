const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProjectDocuments, logActivity } = require('../middleware/helpers');
const { createProjectDocumentInDb, deleteProjectDocumentFromDb } = require('../api');
const { USE_LIVE_DB } = require('../config');
const localData = require('../data');

// Simple rate limiting for uploads (in-memory, resets on restart)
const uploadLimits = new Map();
const UPLOAD_COOLDOWN = 5000; // 5 seconds between uploads per user

// Get all documents for a project
router.get('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const documents = await getProjectDocuments(req, projectId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching project documents:', error.message);
    res.status(500).json({ error: 'Failed to fetch project documents', details: error.message });
  }
});

// Log document view activity
router.post('/documents/:id/view', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;
    
    logActivity(projectId, 'project_document', id, 'viewed', req.user.userId, {
      title: req.body.title || 'Unknown Document'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging document view:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Upload a new document
router.post('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, fileName, fileData, fileSize, fileType } = req.body;
    const userId = req.user.userId;

    // Rate limiting check
    const lastUpload = uploadLimits.get(userId);
    if (lastUpload && Date.now() - lastUpload < UPLOAD_COOLDOWN) {
      return res.status(429).json({ error: 'Please wait a few seconds before uploading again' });
    }

    if (!title || !fileName || !fileData) {
      return res.status(400).json({ error: 'Title, fileName, and fileData are required' });
    }

    const newDoc = {
      id: `doc${Date.now()}`,
      projectId,
      title,
      description: description || '',
      fileName,
      fileData,
      fileSize: fileSize || 0,
      fileType: fileType || '',
      createdBy: userId,
      createdAt: new Date().toISOString()
    };

    if (USE_LIVE_DB) {
      await createProjectDocumentInDb(newDoc);
    } else {
      localData.projectDocuments.push(newDoc);
    }

    // Update rate limit
    uploadLimits.set(userId, Date.now());

    // Log activity
    logActivity(projectId, 'project_document', newDoc.id, 'uploaded', userId, {
      title,
      fileName,
      fileSize
    });

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Error uploading project document:', error.message);
    res.status(500).json({ error: 'Failed to upload project document', details: error.message });
  }
});

// Delete a document (Admin only)
router.delete('/documents/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId, title } = req.query; // Expecting these for logging

    if (USE_LIVE_DB) {
      await deleteProjectDocumentFromDb(id);
    } else {
      const index = localData.projectDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        localData.projectDocuments.splice(index, 1);
      }
    }

    // Log activity
    if (projectId) {
      logActivity(projectId, 'project_document', id, 'deleted', req.user.userId, {
        title: title || 'Unknown Document'
      });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting project document:', error.message);
    res.status(500).json({ error: 'Failed to delete project document', details: error.message });
  }
});

module.exports = router;
