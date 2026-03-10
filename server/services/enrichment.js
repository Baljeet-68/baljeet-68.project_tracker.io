const { buildUploadUrl } = require('../lib/urlBuilder');
const { normalizeProjectObj } = require('./accessControl');
const {
  getUsers,
  getBugs,
  getScreens
} = require('../repositories/dataRepository');

async function getUserName(userId, req) {
  const users = await getUsers(req);
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown';
}

async function enrichBug(req, b) {
  const users = await getUsers(req);
  const usersById = new Map(users.map(u => [u.id, u]));

  const creator = usersById.get(b.createdBy);
  const assignee = b.assignedDeveloperId ? usersById.get(b.assignedDeveloperId) : null;

  const screens = await getScreens(req, b.projectId);
  const screensById = new Map(screens.map(s => [s.id, s]));
  const screen = b.screenId ? screensById.get(b.screenId) : null;

  return {
    ...b,
    createdByName: creator?.name || 'Unknown',
    createdByEmail: creator?.email || '',
    createdByProfilePicture: creator ? buildUploadUrl(creator.profilePicture) : '',
    assignedDeveloperName: assignee?.name || 'Unassigned',
    assignedDeveloperEmail: assignee?.email || '',
    assignedDeveloperProfilePicture: assignee ? buildUploadUrl(assignee.profilePicture) : '',
    screenTitle: screen?.title || b.module || 'Unknown'
  };
}

async function enrichScreen(req, s) {
  const users = await getUsers(req);
  const usersById = new Map(users.map(u => [u.id, u]));
  const assignee = s.assigneeId ? usersById.get(s.assigneeId) : null;
  return {
    ...s,
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || '',
    assigneeProfilePicture: assignee ? buildUploadUrl(assignee.profilePicture) : ''
  };
}

async function enrichProject(req, p) {
  p = normalizeProjectObj(p);
  const users = await getUsers(req);
  const usersById = new Map(users.map(u => [u.id, u]));

  const tester = p.testerId ? usersById.get(p.testerId) : null;
  const testerName = tester?.name || 'Unassigned';
  const testerProfilePicture = tester ? buildUploadUrl(tester.profilePicture) : '';

  const developerNames = (p.developerIds || []).map(id => {
    const user = usersById.get(id);
    return {
      id,
      name: user?.name || 'Unknown',
      profilePicture: user ? buildUploadUrl(user.profilePicture) : ''
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

module.exports = { getUserName, enrichBug, enrichScreen, enrichProject };

