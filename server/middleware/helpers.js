const localData = require('../data');
const { USE_LIVE_DB } = require('../config');
const { getProjectById, getUsersFromMySQL } = require('../api');

// Helper: normalize project object returned from DB or local
function normalizeProjectObj(p) {
  if (!p) return null;

  // developerIds may come as JSON string from DB; ensure array
  if (p.developerIds && typeof p.developerIds === 'string') {
    try {
      p.developerIds = JSON.parse(p.developerIds);
    } catch (e) {
      // fallback: split by comma (if stored that way)
      p.developerIds = p.developerIds.split ? p.developerIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
  }
  p.developerIds = Array.isArray(p.developerIds) ? p.developerIds : [];

  // Ensure testerId exists
  p.testerId = p.testerId || '';

  return p;
}

// Helper: Check if user has access to project (local or live)
async function hasProjectAccess(userId, projectId) {
  const project = await getProjectById(projectId);
  const normalizedProject = normalizeProjectObj(project);
  if (!normalizedProject) return false;
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'tester' && normalizedProject.testerId === userId) return true;
  if (user.role === 'developer' && normalizedProject.developerIds.includes(userId)) return true;
  return false;
}

let allUsersCache = null;

async function getUsers() {
  if (USE_LIVE_DB) {
    return await getUsersFromMySQL();
  } else {
    return localData.users;
  }
}

// Helper: Get user name by id
async function getUserName(userId) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown';
}

// Helper: Enrich bug with user details
async function enrichBug(b) {
  const users = await getUsers();
  const creator = users.find(u => u.id === b.createdBy);
  const assignee = b.assignedDeveloperId ? users.find(u => u.id === b.assignedDeveloperId) : null;
  const screen = b.screenId ? localData.screens.find(s => s.id === b.screenId) : null;
  return {
    ...b,
    createdByName: creator?.name || 'Unknown',
    createdByEmail: creator?.email || '',
    assignedDeveloperName: assignee?.name || 'Unassigned',
    assignedDeveloperEmail: assignee?.email || '',
    screenTitle: screen?.title || b.module || 'Unknown'
  };
}

// Helper: Enrich screen with user details
async function enrichScreen(s) {
  const users = await getUsers();
  const assignee = s.assigneeId ? users.find(u => u.id === s.assigneeId) : null;
  return {
    ...s,
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || ''
  };
}

// Helper: Enrich project with user details (and counts)
async function enrichProject(p) {
  p = normalizeProjectObj(p);
  const testerName = p.testerId ? await getUserName(p.testerId) : 'Unassigned';
  const developerNames = await Promise.all((p.developerIds || []).map(async id => ({ id, name: await getUserName(id) })));
  const openBugsCount = localData.bugs.filter(b => b.projectId === p.id && (b.status === 'Open' || b.status === 'In Progress')).length;
  const completedScreensCount = localData.screens.filter(s => s.projectId === p.id).length;
  const totalScreensCount = localData.screens.filter(s => s.projectId === p.id).length;
  const screenDeadlines = localData.screens.filter(s => s.projectId === p.id && s.plannedDeadline && new Date(s.plannedDeadline) > new Date()).length;
  const bugDeadlines = localData.bugs.filter(b => b.projectId === p.id && b.deadline && new Date(b.deadline) > new Date()).length;

  return {
    ...p,
    testerName,
    developerNames,
    openBugsCount,
    completedScreensCount,
    totalScreensCount,
    upcomingDeadlines: screenDeadlines + bugDeadlines
  };
}

// Activity Logger
function logActivity(projectId, entityType, entityId, action, userId, changes) {
  const activity = {
    id: `act${Date.now()}`,
    projectId,
    entityType,
    entityId,
    action,
    createdBy: userId,
    changes,
    createdAt: new Date()
  };
  localData.activityLog.push(activity);
}

module.exports = { normalizeProjectObj, hasProjectAccess, getUserName, enrichBug, enrichScreen, enrichProject, logActivity, getUsers };
