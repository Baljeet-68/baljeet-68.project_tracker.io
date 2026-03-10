const localData = require('../data');

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

module.exports = { logActivity };

