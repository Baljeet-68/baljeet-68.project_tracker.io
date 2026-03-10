const localData = require('../data');
const { USE_LIVE_DB } = require('../config');
const { getUsers, getProjectById } = require('../repositories/dataRepository');

function normalizeProjectObj(p) {
  if (!p) return null;

  if (p.developerIds && typeof p.developerIds === 'string') {
    try {
      p.developerIds = JSON.parse(p.developerIds);
    } catch (e) {
      p.developerIds = p.developerIds.split ? p.developerIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
  }
  p.developerIds = Array.isArray(p.developerIds) ? p.developerIds : [];
  p.testerId = p.testerId || '';

  return p;
}

async function hasProjectAccess(userId, projectId, req) {
  let project;
  if (USE_LIVE_DB) {
    project = await getProjectById(projectId);
  } else {
    project = (localData.projects || []).find(p => p.id === projectId);
  }

  const normalizedProject = normalizeProjectObj(project);
  if (!normalizedProject) return false;

  const users = await getUsers(req);
  const user = users.find(u => u.id === userId);
  if (!user) return false;

  if (user.role === 'admin') return true;

  const isTester = (user.role === 'tester') && normalizedProject.testerId === userId;
  const isDeveloper = (user.role === 'developer' || user.role === 'ecommerce') && normalizedProject.developerIds.includes(userId);
  return isTester || isDeveloper;
}

module.exports = { normalizeProjectObj, hasProjectAccess };

