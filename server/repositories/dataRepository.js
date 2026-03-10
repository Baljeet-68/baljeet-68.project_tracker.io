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

async function getUsers(req) {
  if (req?.cache?.users) return req.cache.users;
  const users = USE_LIVE_DB ? await getUsersFromMySQL() : localData.users;
  if (req?.cache) req.cache.users = users;
  return users;
}

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

async function getAnnouncements(req) {
  if (req?.cache?.announcements) return req.cache.announcements;
  const announcements = USE_LIVE_DB ? await getAnnouncementsFromMySQL() : (localData.announcements || []);
  if (req?.cache) req.cache.announcements = announcements;
  return announcements;
}

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

async function getApplications(req) {
  if (req?.cache?.applications) return req.cache.applications;
  const applications = USE_LIVE_DB ? await getApplicationsFromMySQL() : (localData.applications || []);
  if (req?.cache) req.cache.applications = applications;
  return applications;
}

async function getLeaves(req) {
  if (req?.cache?.leaves) return req.cache.leaves;
  const leaves = USE_LIVE_DB ? await getLeavesFromMySQL() : (localData.leaves || []);
  if (req?.cache) req.cache.leaves = leaves;
  return leaves;
}

async function getNotifications(req, userId) {
  if (!userId) return [];
  if (req?.cache?.notifications?.[userId]) return req.cache.notifications[userId];
  const notifications = USE_LIVE_DB
    ? await getNotificationsFromMySQL(userId)
    : (localData.notifications || []).filter(n => n.user_id === userId);
  if (req?.cache) {
    if (!req.cache.notifications) req.cache.notifications = {};
    req.cache.notifications[userId] = notifications;
  }
  return notifications;
}

async function getProjectDocuments(req, projectId) {
  if (req?.cache?.projectDocuments?.[projectId]) return req.cache.projectDocuments[projectId];
  const docs = USE_LIVE_DB
    ? await getProjectDocumentsFromMySQL(projectId)
    : localData.projectDocuments.filter(d => d.projectId === projectId);
  if (req?.cache) {
    if (!req.cache.projectDocuments) req.cache.projectDocuments = {};
    req.cache.projectDocuments[projectId] = docs;
  }
  return docs;
}

module.exports = {
  getProjectById,
  getUsers,
  getProjects,
  getBugs,
  getScreens,
  getMilestones,
  getAnnouncements,
  getJobs,
  getApplications,
  getLeaves,
  getNotifications,
  getProjectDocuments
};

