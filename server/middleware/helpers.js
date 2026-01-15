/**
 * @file helpers.js
 * @description Utility functions for data normalization, enrichment, and access control.
 * Optimized for performance with basic memoization to reduce redundant database calls.
 */

const localData = require('../data');
const { USE_LIVE_DB } = require('../config');
const { 
  getProjectById, 
  getUsersFromMySQL, 
  getBugsFromMySQL, 
  getScreensFromMySQL,
  getBugsByProjectId,
  getScreensByProjectId,
  getMilestonesByProjectId,
  getMilestonesFromMySQL,
  getProjectDocumentsFromMySQL,
  getAnnouncementsFromMySQL,
  getJobsFromMySQL,
  getApplicationsFromMySQL,
  getLeavesFromMySQL,
  getNotificationsFromMySQL
} = require('../api');

/**
 * Generates a dynamic profile picture URL.
 * @param {Object} req - Express request object.
 * @param {string} filename - The profile picture filename.
 * @returns {string} The full URL to the profile picture.
 */
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

/**
 * Normalizes project object to ensure consistent data structure.
 * @param {Object} p - The project object.
 * @returns {Object|null} Normalized project or null.
 */
function normalizeProjectObj(p) {
  if (!p) return null;

  // Ensure developerIds is always an array, even if stored as JSON string in DB
  if (p.developerIds && typeof p.developerIds === 'string') {
    try {
      p.developerIds = JSON.parse(p.developerIds);
    } catch (e) {
      // Fallback: split by comma if stored that way
      p.developerIds = p.developerIds.split ? p.developerIds.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
  }
  p.developerIds = Array.isArray(p.developerIds) ? p.developerIds : [];
  p.testerId = p.testerId || '';

  return p;
}

/**
 * Checks if a user has access to a specific project.
 * @param {string} userId - ID of the user.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<boolean>}
 */
async function hasProjectAccess(userId, projectId) {
  let project;
  if (USE_LIVE_DB) {
    project = await getProjectById(projectId);
  } else {
    project = localData.projects.find(p => p.id === projectId);
  }
  
  const normalizedProject = normalizeProjectObj(project);
  if (!normalizedProject) return false;

  const users = await getUsers(); // Fallback if req is not available
  const user = users.find(u => u.id === userId);
  if (!user) return false;

  // Admins have access to everything
  if (user.role === 'admin') return true;

  const isTester = (user.role === 'tester') && normalizedProject.testerId === userId;
  const isDeveloper = (user.role === 'developer' || user.role === 'ecommerce') && normalizedProject.developerIds.includes(userId);
  
  return isTester || isDeveloper;
}

/**
 * Fetches all users, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getUsers(req) {
  if (req?.cache?.users) return req.cache.users;
  
  let users;
  if (USE_LIVE_DB) {
    users = await getUsersFromMySQL();
  } else {
    users = localData.users;
  }
  
  if (req?.cache) req.cache.users = users;
  return users;
}

/**
 * Fetches all projects, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getProjects(req) {
  if (req?.cache?.projects) return req.cache.projects;
  
  let projects;
  if (USE_LIVE_DB) {
    const { getProjectsFromMySQL } = require('../api');
    projects = await getProjectsFromMySQL();
  } else {
    projects = localData.projects;
  }
  
  if (req?.cache) req.cache.projects = projects;
  return projects;
}

/**
 * Fetches bugs for a project, with request-level memoization.
 * @param {Object} req - Express request object.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<Array>}
 */
async function getBugs(req, projectId) {
  if (!projectId) {
    if (req?.cache?.bugs) return req.cache.bugs;
    const bugs = USE_LIVE_DB ? await getBugsFromMySQL() : localData.bugs;
    if (req?.cache) req.cache.bugs = bugs;
    return bugs;
  }

  if (req?.cache?.projectBugs?.[projectId]) return req.cache.projectBugs[projectId];
  
  const bugs = USE_LIVE_DB ? await getBugsByProjectId(projectId) : localData.bugs.filter(b => b.projectId === projectId);
  if (req?.cache?.projectBugs) req.cache.projectBugs[projectId] = bugs;
  return bugs;
}

/**
 * Fetches screens for a project, with request-level memoization.
 * @param {Object} req - Express request object.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<Array>}
 */
async function getScreens(req, projectId) {
  if (!projectId) {
    if (req?.cache?.screens) return req.cache.screens;
    const screens = USE_LIVE_DB ? await getScreensFromMySQL() : localData.screens;
    if (req?.cache) req.cache.screens = screens;
    return screens;
  }

  if (req?.cache?.projectScreens?.[projectId]) return req.cache.projectScreens[projectId];
  
  const screens = USE_LIVE_DB ? await getScreensByProjectId(projectId) : localData.screens.filter(s => s.projectId === projectId);
  if (req?.cache?.projectScreens) req.cache.projectScreens[projectId] = screens;
  return screens;
}

/**
 * Fetches milestones for a project, with request-level memoization.
 * @param {Object} req - Express request object.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<Array>}
 */
async function getMilestones(req, projectId) {
  if (!projectId) {
    if (req?.cache?.milestones) return req.cache.milestones;
    const milestones = USE_LIVE_DB ? await getMilestonesFromMySQL() : localData.milestones;
    if (req?.cache) req.cache.milestones = milestones;
    return milestones;
  }

  if (req?.cache?.projectMilestones?.[projectId]) return req.cache.projectMilestones[projectId];
  
  const milestones = USE_LIVE_DB ? await getMilestonesByProjectId(projectId) : (localData.milestones || []).filter(m => m.projectId === projectId);
  if (req?.cache?.projectMilestones) req.cache.projectMilestones[projectId] = milestones;
  return milestones;
}

/**
 * Fetches announcements, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getAnnouncements(req) {
  if (req?.cache?.announcements) return req.cache.announcements;
  
  let announcements;
  if (USE_LIVE_DB) {
    announcements = await getAnnouncementsFromMySQL();
  } else {
    announcements = localData.announcements || [];
  }
  
  if (req?.cache) req.cache.announcements = announcements;
  return announcements;
}

/**
 * Fetches jobs, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getJobs(req) {
  if (req?.cache?.jobs) return req.cache.jobs;
  
  let jobs;
  if (USE_LIVE_DB) {
    jobs = await getJobsFromMySQL();
  } else {
    const now = new Date();
    jobs = (localData.jobs || []).map(j => {
      if (j.expiryDate && new Date(j.expiryDate) < now && j.status === 'active') {
        return { ...j, status: 'inactive' };
      }
      return j;
    });
  }
  
  if (req?.cache) req.cache.jobs = jobs;
  return jobs;
}

/**
 * Fetches applications, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getApplications(req) {
  if (req?.cache?.applications) return req.cache.applications;
  
  let applications;
  if (USE_LIVE_DB) {
    applications = await getApplicationsFromMySQL();
  } else {
    applications = localData.applications || [];
  }
  
  if (req?.cache) req.cache.applications = applications;
  return applications;
}

/**
 * Fetches leaves, with request-level memoization.
 * @param {Object} req - Express request object.
 * @returns {Promise<Array>}
 */
async function getLeaves(req) {
  if (req?.cache?.leaves) return req.cache.leaves;
  
  let leaves;
  if (USE_LIVE_DB) {
    leaves = await getLeavesFromMySQL();
  } else {
    leaves = localData.leaves || [];
  }
  
  if (req?.cache) req.cache.leaves = leaves;
  return leaves;
}

/**
 * Fetches notifications for a user, with request-level memoization.
 * @param {Object} req - Express request object.
 * @param {string} userId - User ID to fetch notifications for.
 * @returns {Promise<Array>}
 */
async function getNotifications(req, userId) {
  if (!userId) return [];
  if (req?.cache?.notifications?.[userId]) {
    return req.cache.notifications[userId];
  }
  
  let notifications;
  if (USE_LIVE_DB) {
    notifications = await getNotificationsFromMySQL(userId);
  } else {
    notifications = (localData.notifications || []).filter(n => n.user_id === userId);
  }
  
  if (req?.cache) {
    if (!req.cache.notifications) req.cache.notifications = {};
    req.cache.notifications[userId] = notifications;
  }
  return notifications;
}

/**
 * Clears the internal cache. (Legacy - now handled by request-level cache)
 */
function clearCache() {
  // No-op, handled per-request in server.js
}

/**
 * Gets a user's name by their ID.
 * @param {string} userId 
 * @param {Object} req
 * @returns {Promise<string>}
 */
async function getUserName(userId, req) {
  const users = await getUsers(req);
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown';
}

/**
 * Enriches a bug object with related user and screen details.
 * @param {Object} req - Express request.
 * @param {Object} b - The bug object.
 * @returns {Promise<Object>} Enriched bug object.
 */
async function enrichBug(req, b) {
  const users = await getUsers(req);
  const creator = users.find(u => u.id === b.createdBy);
  const assignee = b.assignedDeveloperId ? users.find(u => u.id === b.assignedDeveloperId) : null;
  
  const screens = await getScreens(req, b.projectId);
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

/**
 * Enriches a screen object with assignee details.
 * @param {Object} req 
 * @param {Object} s - Screen object.
 * @returns {Promise<Object>} Enriched screen object.
 */
async function enrichScreen(req, s) {
  const users = await getUsers(req);
  const assignee = s.assigneeId ? users.find(u => u.id === s.assigneeId) : null;
  return {
    ...s,
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || '',
    assigneeProfilePicture: assignee ? getProfileUrl(req, assignee.profilePicture) : ''
  };
}

/**
 * Enriches a project object with details like counts and user info.
 * This is a heavy operation; memoization of users, bugs, and screens is crucial here.
 * @param {Object} req 
 * @param {Object} p - Project object.
 * @returns {Promise<Object>} Enriched project object.
 */
async function enrichProject(req, p) {
  p = normalizeProjectObj(p);
  const users = await getUsers(req);
  const tester = p.testerId ? users.find(u => u.id === p.testerId) : null;
  const testerName = tester?.name || 'Unassigned';
  const testerProfilePicture = tester ? getProfileUrl(req, tester.profilePicture) : '';

  // Batch developer info lookup
  const developerNames = (p.developerIds || []).map(id => {
    const user = users.find(u => u.id === id);
    return { 
      id, 
      name: user?.name || 'Unknown',
      profilePicture: user ? getProfileUrl(req, user.profilePicture) : ''
    };
  });

  const projectBugs = await getBugs(req, p.id);
  const projectScreens = await getScreens(req, p.id);

  const openBugsCount = projectBugs.filter(b => b.status === 'Open' || b.status === 'In Progress').length;
  const completedScreensCount = projectScreens.filter(s => s.status === 'Done').length;
  const totalScreensCount = projectScreens.length;
  
  const now = new Date();
  const screenDeadlines = projectScreens.filter(s => s.plannedDeadline && new Date(s.plannedDeadline) > now).length;
  const bugDeadlines = projectBugs.filter(b => b.deadline && new Date(b.deadline) > now).length;

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

/**
 * Logs an activity to the activity log.
 */
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

/**
 * Fetches project documents, with request-level memoization.
 * @param {Object} req - Express request object.
 * @param {string} projectId - The ID of the project.
 * @returns {Promise<Array>}
 */
async function getProjectDocuments(req, projectId) {
  if (req?.cache?.projectDocuments?.[projectId]) return req.cache.projectDocuments[projectId];
  
  let docs;
  if (USE_LIVE_DB) {
    docs = await getProjectDocumentsFromMySQL(projectId);
  } else {
    docs = localData.projectDocuments.filter(d => d.projectId === projectId);
  }
  
  if (req?.cache) {
    if (!req.cache.projectDocuments) req.cache.projectDocuments = {};
    req.cache.projectDocuments[projectId] = docs;
  }
  return docs;
}

module.exports = { 
  normalizeProjectObj, 
  hasProjectAccess, 
  getUserName, 
  enrichBug, 
  enrichScreen, 
  enrichProject, 
  logActivity, 
  getUsers, 
  getProjects,
  getBugs,
  getScreens,
  getMilestones,
  getProjectDocuments,
  getAnnouncements,
  getJobs,
  getApplications,
  getLeaves,
  getNotifications,
  getProfileUrl,
  clearCache 
};
