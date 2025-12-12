const { pool } = require('./db');

async function getProjectsFromMySQL() {
  try {
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
  } catch (error) {
    console.error('Database query failed in getProjectsFromSupabase:', error);
    throw error;
  }
}

async function getProjectById(projectId) {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (rows.length === 0) return null;
    const r = rows[0];
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
  } catch (error) {
    console.error('Database query failed in getProjectById:', error);
    throw error;
  }
}

async function updateProjectInDb(projectId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.name !== undefined) { fields.push('name = ?'); values.push(changes.name); }
    if (changes.client !== undefined) { fields.push('client = ?'); values.push(changes.client); }
    if (changes.description !== undefined) { fields.push('description = ?'); values.push(changes.description); }
    if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
    if (changes.testerId !== undefined) { fields.push('testerId = ?'); values.push(changes.testerId); }
    if (changes.developerIds !== undefined) { 
      fields.push('developerIds = ?'); 
      values.push(JSON.stringify(changes.developerIds)); 
    }
    if (changes.startDate !== undefined) { fields.push('startDate = ?'); values.push(changes.startDate); }
    if (changes.endDate !== undefined) { fields.push('endDate = ?'); values.push(changes.endDate); }

    if (fields.length === 0) return;

    values.push(projectId);
    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateProjectInDb:', error);
    throw error;
  }
}

module.exports = { getProjectsFromMySQL, getProjectById, updateProjectInDb };