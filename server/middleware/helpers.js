const localData = require('../data');
const { USE_LIVE_DB } = require('../config');
const { getProjectById, getUsersFromMySQL, getBugsFromMySQL, getScreensFromMySQL } = require('../api');

// Helper: Get dynamic profile picture URL
function getProfileUrl(req, filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  
  const baseUrl = (process.env.BASE_URL || '').replace(/\/api$/, '');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  // Use https for production/cpanel, http for local
  const finalProtocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? protocol : 'https';
  
  return `${finalProtocol}://${host}${baseUrl}/uploads/${filename}`;
}

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

async function getUsers() {
  if (USE_LIVE_DB) {
    return await getUsersFromMySQL();
  } else {
    return localData.users;
  }
}

async function getBugs() {
  if (USE_LIVE_DB) {
    return await getBugsFromMySQL();
  } else {
    return localData.bugs;
  }
}

async function getScreens() {
  if (USE_LIVE_DB) {
    return await getScreensFromMySQL();
  } else {
    return localData.screens;
  }
}

// Helper: Get user name by id
async function getUserName(userId) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown';
}

// Helper: Enrich bug with user details
async function enrichBug(req, b) {
  const users = await getUsers();
  const creator = users.find(u => u.id === b.createdBy);
  const assignee = b.assignedDeveloperId ? users.find(u => u.id === b.assignedDeveloperId) : null;
  const screens = await getScreens();
  const screen = b.screenId ? screens.find(s => s.id === b.screenId) : null;
  return {
    ...b,
    createdByName: creator?.name || 'Unknown',
    createdByEmail: creator?.email || '',
    createdByProfilePicture: creator ? getProfileUrl(req, creator.profilePicture) : '',
    assignedDeveloperName: assignee?.name || 'Unassigned',
    assignedDeveloperEmail: assignee?.email || '',
    assignedDeveloperProfilePicture: assignee ? getProfileUrl(req, assignee.profilePicture) : '',
    screenTitle: screen?.title || b.module || 'Unknown'
  };
}

// Helper: Enrich screen with user details
async function enrichScreen(req, s) {
  const users = await getUsers();
  const assignee = s.assigneeId ? users.find(u => u.id === s.assigneeId) : null;
  return {
    ...s,
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || '',
    assigneeProfilePicture: assignee ? getProfileUrl(req, assignee.profilePicture) : ''
  };
}

// Helper: Enrich project with user details (and counts)
async function enrichProject(req, p) {
  p = normalizeProjectObj(p);
  const users = await getUsers();
  const tester = p.testerId ? users.find(u => u.id === p.testerId) : null;
  const testerName = tester?.name || 'Unassigned';
  const testerProfilePicture = tester ? getProfileUrl(req, tester.profilePicture) : '';

  const developerNames = await Promise.all((p.developerIds || []).map(async id => {
    const user = users.find(u => u.id === id);
    return { 
      id, 
      name: user?.name || 'Unknown',
      profilePicture: user ? getProfileUrl(req, user.profilePicture) : ''
    };
  }));

  const bugs = await getBugs();
  const screens = await getScreens();

  const openBugsCount = bugs.filter(b => b.projectId === p.id && (b.status === 'Open' || b.status === 'In Progress')).length;
  const completedScreensCount = screens.filter(s => s.projectId === p.id && s.status === 'Done').length;
  const totalScreensCount = screens.filter(s => s.projectId === p.id).length;
  const screenDeadlines = screens.filter(s => s.projectId === p.id && s.plannedDeadline && new Date(s.plannedDeadline) > new Date()).length;
  const bugDeadlines = bugs.filter(b => b.projectId === p.id && b.deadline && new Date(b.deadline) > new Date()).length;

  return {
    ...p,
    testerName,
    testerProfilePicture,
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

module.exports = { normalizeProjectObj, hasProjectAccess, getUserName, enrichBug, enrichScreen, enrichProject, logActivity, getUsers, getProfileUrl };
