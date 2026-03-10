/**
 * @file helpers.js
 * @description Backwards-compatible facade. New code should import from:
 * - repositories/dataRepository
 * - services/accessControl
 * - services/enrichment
 * - lib/urlBuilder
 * - audit/activityLogger
 */

const { buildUploadUrl } = require('../lib/urlBuilder');
const accessControl = require('../services/accessControl');
const enrichment = require('../services/enrichment');
const repo = require('../repositories/dataRepository');
const { logActivity } = require('../audit/activityLogger');

function getProfileUrl(_req, filename) {
  return buildUploadUrl(filename);
}

function clearCache() {
  // No-op: cache is request-scoped in server.js
}

async function hasProjectAccess(userId, projectId, req) {
  return accessControl.hasProjectAccess(userId, projectId, req);
}

module.exports = {
  // Access control / normalization
  normalizeProjectObj: accessControl.normalizeProjectObj,
  hasProjectAccess,

  // Enrichment
  getUserName: enrichment.getUserName,
  enrichBug: enrichment.enrichBug,
  enrichScreen: enrichment.enrichScreen,
  enrichProject: enrichment.enrichProject,

  // Activity/audit
  logActivity,

  // Repository access (cached per request)
  getUsers: repo.getUsers,
  getProjects: repo.getProjects,
  getBugs: repo.getBugs,
  getScreens: repo.getScreens,
  getMilestones: repo.getMilestones,
  getProjectDocuments: repo.getProjectDocuments,
  getAnnouncements: repo.getAnnouncements,
  getJobs: repo.getJobs,
  getApplications: repo.getApplications,
  getLeaves: repo.getLeaves,
  getNotifications: repo.getNotifications,

  // URL helpers
  getProfileUrl,
  clearCache
};
