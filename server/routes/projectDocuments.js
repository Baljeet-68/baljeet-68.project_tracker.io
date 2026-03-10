const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProjectDocuments, logActivity, hasProjectAccess } = require('../middleware/helpers');
const { createProjectDocumentInDb, deleteProjectDocumentFromDb } = require('../api');
const { USE_LIVE_DB } = require('../config');
const localData = require('../data');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getConfig } = require('../config/runtime');
const { pool } = require('../db');

const uploadDir = path.join(__dirname, '..', 'uploads', 'project-documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const uploadLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req)
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const safeOriginal = String(file.originalname || 'file')
        .replace(/[^\w.\-]+/g, '_')
        .slice(0, 180);
      cb(null, `${Date.now()}_${safeOriginal}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg']);
    cb(null, allowed.has(file.mimetype));
  }
});

async function getProjectById(projectId) {
  if (USE_LIVE_DB) {
    // eslint-disable-next-line global-require
    const api = require('../api');
    return api.getProjectById(projectId);
  }
  return (localData.projects || []).find(p => p.id === projectId) || null;
}

function toSafeDoc(doc) {
  if (!doc) return doc;
  const { fileData, storagePath, ...rest } = doc;
  const cfg = getConfig();
  return {
    ...rest,
    // Prefer download endpoint (auth + access control) over exposing raw paths
    downloadUrl: `${cfg.BASE_URL}/documents/${doc.id}/download`
  };
}

// Get all documents for a project
router.get('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await hasProjectAccess(req.user.userId, projectId)) return res.status(403).json({ error: 'Forbidden' });
    const documents = await getProjectDocuments(req, projectId);
    res.json((documents || []).map(toSafeDoc));
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

    if (!projectId) return res.status(400).json({ error: 'projectId is required' });
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await hasProjectAccess(req.user.userId, projectId)) return res.status(403).json({ error: 'Forbidden' });
    
    logActivity(projectId, 'project_document', id, 'viewed', req.user.userId, {
      title: req.body.title || 'Unknown Document'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging document view:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Download a document (auth + project access)
router.get('/documents/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const getDoc = async () => {
      if (USE_LIVE_DB) {
        const [rows] = await pool.query('SELECT * FROM project_documents WHERE id = ?', [id]);
        return rows[0] || null;
      }
      return (localData.projectDocuments || []).find(d => d.id === id) || null;
    };

    const doc = await getDoc();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const project = await getProjectById(doc.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await hasProjectAccess(req.user.userId, doc.projectId)) return res.status(403).json({ error: 'Forbidden' });

    const fileRel = doc.storagePath || doc.fileData; // storagePath preferred, fileData kept for backward compat
    if (!fileRel || typeof fileRel !== 'string' || fileRel.startsWith('data:')) {
      return res.status(400).json({ error: 'Document is not available for download (legacy storage)' });
    }

    const abs = path.join(__dirname, '..', fileRel.replace(/^\/+/, ''));
    if (!abs.startsWith(path.join(__dirname, '..', 'uploads'))) {
      return res.status(400).json({ error: 'Invalid document path' });
    }
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing on server' });

    res.setHeader('Content-Type', doc.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(doc.fileName || 'document').replace(/"/g, '')}"`);
    return res.sendFile(abs);
  } catch (error) {
    console.error('Error downloading document:', error.message);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Upload a new document (multipart/form-data)
router.post('/projects/:projectId/documents', authenticate, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await hasProjectAccess(req.user.userId, projectId)) return res.status(403).json({ error: 'Forbidden' });

    const { title, description } = req.body || {};
    if (!title || !req.file) {
      return res.status(400).json({ error: 'title and file are required' });
    }

    const storagePath = path.posix.join('uploads', 'project-documents', req.file.filename);

    const newDoc = {
      id: `doc${Date.now()}`,
      projectId,
      title,
      description: description || '',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      storagePath,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };

    if (USE_LIVE_DB) {
      await createProjectDocumentInDb(newDoc);
    } else {
      localData.projectDocuments.push(newDoc);
    }

    // Log activity
    logActivity(projectId, 'project_document', newDoc.id, 'uploaded', userId, {
      title,
      fileName: newDoc.fileName,
      fileSize: newDoc.fileSize
    });

    res.status(201).json(toSafeDoc(newDoc));
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

    // If projectId is provided, enforce access check too (admin can still be blocked if you choose;
    // here we allow admin but still validate existence for consistent auditing).
    if (projectId) {
      const project = await getProjectById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
    }

    if (USE_LIVE_DB) {
      await deleteProjectDocumentFromDb(id);
    } else {
      const index = localData.projectDocuments.findIndex(d => d.id === id);
      if (index !== -1) {
        const doc = localData.projectDocuments[index];
        const fileRel = doc.storagePath || doc.fileData;
        if (fileRel && typeof fileRel === 'string' && !fileRel.startsWith('data:')) {
          const abs = path.join(__dirname, '..', fileRel.replace(/^\/+/, ''));
          try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (e) {}
        }
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
