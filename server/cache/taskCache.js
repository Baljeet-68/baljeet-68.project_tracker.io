const taskCache = new Map();

const CACHE_TTL_MS = 30 * 1000; // 30 seconds - lightweight, in-memory only

function getCachedTasks(userId) {
  if (!userId) return null;
  const entry = taskCache.get(String(userId));
  if (!entry) return null;

  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
  if (isExpired) {
    taskCache.delete(String(userId));
    return null;
  }
  return entry.tasks || null;
}

function setCachedTasks(userId, tasks) {
  if (!userId) return;
  taskCache.set(String(userId), {
    tasks: Array.isArray(tasks) ? tasks : [],
    cachedAt: Date.now()
  });
}

function clearUserTasks(userId) {
  if (!userId) return;
  taskCache.delete(String(userId));
}

module.exports = {
  getCachedTasks,
  setCachedTasks,
  clearUserTasks
};

