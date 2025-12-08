const { pool } = require('./db');

async function getProjectsFromSupabase() {
  // Reads projects from MySQL `projects` table. Keeps the same exported name
  // so existing imports don't need to be changed elsewhere.
  const [rows] = await pool.query('SELECT * FROM projects');
  // Parse developerIds column if stored as JSON string
  return rows.map(r => {
    const developerIds = (() => {
      try {
        if (r.developerIds == null) return [];
        if (Array.isArray(r.developerIds)) return r.developerIds;
        return JSON.parse(r.developerIds);
      } catch (e) {
        return [];
      }
    })();

    return {
      id: r.id,
      name: r.name,
      client: r.client,
      description: r.description,
      status: r.status,
      testerId: r.testerId,
      developerIds,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      startDate: r.startDate,
      endDate: r.endDate
    };
  });
}

module.exports = { getProjectsFromSupabase };