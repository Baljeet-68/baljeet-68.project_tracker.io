const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getProjectDocuments } = require('../middleware/helpers');
const { createProjectDocumentInDb, deleteProjectDocumentFromDb } = require('../api');
const { USE_LIVE_DB } = require('../config');
const localData = require('../data');

// Get all documents for a project
router.get('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const documents = await getProjectDocuments(req, projectId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ error: 'Failed to fetch project documents' });
  }
});

// Upload a new document
router.post('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, fileName, fileData } = req.body;

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
      createdBy: req.user.userId,
      createdAt: new Date().toISOString()
    };

    if (USE_LIVE_DB) {
      await createProjectDocumentInDb(newDoc);
    } else {
      localData.projectDocuments.push(newDoc);
    }

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Error uploading project document:', error);
    res.status(500).json({ error: 'Failed to upload project document' });
  }
});

// Delete a document
router.delete('/documents/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (USE_LIVE_DB) {
      await deleteProjectDocumentFromDb(id);
    } else {
      const index = localData.projectDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        localData.projectDocuments.splice(index, 1);
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting project document:', error);
    res.status(500).json({ error: 'Failed to delete project document' });
  }
});

module.exports = router;
