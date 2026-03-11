const {
  getProjects,
  getBugs,
  getScreens,
  getLeaves,
  getApplications,
  getNotifications
} = require('../middleware/helpers');

const { getCachedTasks, setCachedTasks } = require('../cache/taskCache');

const PRIORITY_ORDER = {
  high: 1,
  medium: 2,
  low: 3
};

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function buildTaskId(prefix, id) {
  return `${prefix}-${String(id)}`;
}

async function collectLeaveTasks(req) {
  const tasks = [];
  const { role, userId } = req.user || {};
  const leaves = await getLeaves(req);

  if (!Array.isArray(leaves)) return tasks;

  const isAdminOrHR = role === 'admin' || role === 'hr';

  for (const leave of leaves) {
    // Approval tasks for HR/Admin
    if (isAdminOrHR && leave.status === 'Submitted') {
      tasks.push({
        id: buildTaskId('leave-approve', leave.id),
        type: 'leave_approval',
        title: 'Leave Approval',
        description: `${leave.userName || 'Employee'} requested ${leave.type || 'Leave'}`,
        module: 'leaves',
        priority: 'high',
        actionUrl: '/attendance',
        createdAt: toIsoDate(leave.created_at || leave.createdAt || leave.start_date)
      });
    }

    // Status update tasks for requester
    if (
      String(leave.user_id) === String(userId) &&
      (leave.status === 'Approved' || leave.status === 'Rejected')
    ) {
      tasks.push({
        id: buildTaskId('leave-status', leave.id),
        type: 'leave_status',
        title: `Leave ${leave.status}`,
        description: `Your ${leave.type || 'leave'} request has been ${String(leave.status).toLowerCase()}.`,
        module: 'leaves',
        priority: 'medium',
        actionUrl: '/attendance',
        createdAt: toIsoDate(leave.updated_at || leave.updatedAt || leave.start_date)
      });
    }
  }

  return tasks;
}

async function collectBugTasks(req) {
  const tasks = [];
  const { userId } = req.user || {};

  const [projects, bugs] = await Promise.all([
    getProjects(req),
    getBugs(req)
  ]);

  const projectById = new Map();
  for (const p of projects || []) {
    projectById.set(String(p.id), p);
  }

  const now = new Date();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  for (const bug of bugs || []) {
    const project = projectById.get(String(bug.projectId));

    // Bug assigned to current developer
    if (
      bug.assignedDeveloperId &&
      String(bug.assignedDeveloperId) === String(userId) &&
      String(bug.status).toLowerCase() !== 'closed'
    ) {
      tasks.push({
        id: buildTaskId('bug-assigned', bug.id),
        type: 'bug_assigned',
        title: `Bug #${bug.bugNumber || bug.id}`,
        description: bug.description || 'Bug assigned to you',
        module: 'bugs',
        priority: 'high',
        actionUrl: `/projects/${bug.projectId}`,
        createdAt: toIsoDate(bug.createdAt)
      });
    }

    // Bug verification by tester
    if (
      project &&
      project.testerId &&
      String(project.testerId) === String(userId) &&
      String(bug.status).toLowerCase() === 'resolved'
    ) {
      tasks.push({
        id: buildTaskId('bug-verify', bug.id),
        type: 'bug_verification',
        title: `Verify Bug #${bug.bugNumber || bug.id}`,
        description: bug.description || 'Verify resolved bug',
        module: 'bugs',
        priority: 'high',
        actionUrl: `/projects/${bug.projectId}`,
        createdAt: toIsoDate(bug.resolvedAt || bug.updatedAt || bug.createdAt)
      });
    }

    // Bug deadline near
    if (
      bug.deadline &&
      bug.assignedDeveloperId &&
      String(bug.assignedDeveloperId) === String(userId)
    ) {
      const deadline = new Date(bug.deadline);
      if (!Number.isNaN(deadline.getTime())) {
        const diff = deadline.getTime() - now.getTime();
        if (diff >= 0 && diff <= twoDaysMs) {
          tasks.push({
            id: buildTaskId('bug-deadline', bug.id),
            type: 'bug_deadline',
            title: `Bug Deadline Approaching`,
            description: `Bug #${bug.bugNumber || bug.id} deadline is near.`,
            module: 'bugs',
            priority: 'high',
            actionUrl: `/projects/${bug.projectId}`,
            createdAt: toIsoDate(bug.createdAt)
          });
        }
      }
    }
  }

  return tasks;
}

async function collectProjectTasks(req) {
  const tasks = [];
  const { userId, role } = req.user || {};
  const projects = await getProjects(req);

  for (const project of projects || []) {
    const devIds = Array.isArray(project.developerIds)
      ? project.developerIds
      : [];

    const isDeveloper =
      devIds.some((id) => String(id) === String(userId));
    const isTester =
      project.testerId && String(project.testerId) === String(userId);

    if (isDeveloper || isTester || role === 'admin') {
      tasks.push({
        id: buildTaskId('project', project.id),
        type: 'project_assignment',
        title: project.name || 'Project',
        description: `You have work on project "${project.name || project.id}".`,
        module: 'projects',
        priority: 'medium',
        actionUrl: `/projects/${project.id}`,
        createdAt: toIsoDate(project.createdAt)
      });
    }
  }

  return tasks;
}

async function collectScreenTasks(req) {
  const tasks = [];
  const { userId } = req.user || {};
  const screens = await getScreens(req);

  for (const screen of screens || []) {
    if (screen.assigneeId && String(screen.assigneeId) === String(userId)) {
      tasks.push({
        id: buildTaskId('screen', screen.id),
        type: 'screen_assignment',
        title: screen.title || 'Screen Task',
        description: screen.module
          ? `Work on module "${screen.module}".`
          : 'You have an assigned screen/task.',
        module: 'screens',
        priority: 'medium',
        actionUrl: `/projects/${screen.projectId}`,
        createdAt: toIsoDate(screen.createdAt)
      });
    }
  }

  return tasks;
}

async function collectHRTasks(req) {
  const tasks = [];
  const { role } = req.user || {};
  const isHR = role === 'hr' || role === 'admin';
  if (!isHR) return tasks;

  const applications = await getApplications(req);
  for (const app of applications || []) {
    if (String(app.status).toLowerCase() === 'applied') {
      tasks.push({
        id: buildTaskId('application', app.id),
        type: 'application_review',
        title: 'New Job Application',
        description: `${app.fullName || 'Candidate'} applied for job ${app.jobId || ''}`.trim(),
        module: 'careers',
        priority: 'medium',
        actionUrl: '/careers',
        createdAt: toIsoDate(app.appliedAt)
      });
    }
  }

  return tasks;
}

async function collectNotificationTasks(req) {
  const tasks = [];
  const { userId } = req.user || {};
  const notifications = await getNotifications(req, userId);

  const actionableTypes = new Set([
    'leave_request',
    'bug_assigned',
    'project_assigned'
  ]);

  for (const n of notifications || []) {
    if (!actionableTypes.has(n.type)) continue;

    let actionUrl = '/notifications';
    if (n.type === 'leave_request') actionUrl = '/attendance';
    if (n.type === 'bug_assigned') actionUrl = '/projects';
    if (n.type === 'project_assigned') actionUrl = '/projects';

    tasks.push({
      id: buildTaskId('notification', n.id),
      type: n.type,
      title: n.title || 'Notification',
      description: n.message || '',
      module: 'notifications',
      priority: 'low',
      actionUrl,
      createdAt: toIsoDate(n.created_at || n.createdAt)
    });
  }

  return tasks;
}

async function getMyTasks(req) {
  const { userId } = req.user || {};
  if (!userId) return [];

  const cached = getCachedTasks(userId);
  if (cached) return cached;

  const [
    leaveTasks,
    bugTasks,
    projectTasks,
    screenTasks,
    hrTasks,
    notificationTasks
  ] = await Promise.all([
    collectLeaveTasks(req),
    collectBugTasks(req),
    collectProjectTasks(req),
    collectScreenTasks(req),
    collectHRTasks(req),
    collectNotificationTasks(req)
  ]);

  const allTasks = [
    ...leaveTasks,
    ...bugTasks,
    ...projectTasks,
    ...screenTasks,
    ...hrTasks,
    ...notificationTasks
  ];

  allTasks.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] || 99;
    const pb = PRIORITY_ORDER[b.priority] || 99;
    if (pa !== pb) return pa - pb;
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return db - da;
  });

  setCachedTasks(userId, allTasks);
  return allTasks;
}

module.exports = {
  getMyTasks,
  collectLeaveTasks,
  collectBugTasks,
  collectProjectTasks,
  collectScreenTasks,
  collectHRTasks,
  collectNotificationTasks
};

