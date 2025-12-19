const { pool } = require('./db');
const { hashPassword } = require('./utils/encryption');

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

async function getBugById(bugId) {
  try {
    const [rows] = await pool.query('SELECT * FROM bugs WHERE id = ?', [bugId]);
    if (rows.length === 0) return null;
    const r = rows[0];
    const attachments = (() => {
      try {
        if (r.attachments == null) return [];
        if (Array.isArray(r.attachments)) return r.attachments;
        return JSON.parse(r.attachments);
      } catch (e) {
        return [];
      }
    })();
    return {
      id: r.id,
      projectId: r.projectId,
      bugNumber: r.bugNumber,
      description: r.description,
      screenId: r.screenId,
      module: r.module,
      assignedDeveloperId: r.assignedDeveloperId,
      createdBy: r.createdBy,
      status: r.status,
      severity: r.severity,
      attachments,
      deadline: r.deadline,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      resolvedAt: r.resolvedAt
    };
  } catch (error) {
    console.error('Database query failed in getBugById:', error);
    throw error;
  }
}

async function getUsersFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  } catch (error) {
    console.error('Database query failed in getUsersFromMySQL:', error);
    throw error;
  }
}

async function updateBugInDb(bugId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.description !== undefined) { fields.push('description = ?'); values.push(changes.description); }
    if (changes.screenId !== undefined) { fields.push('screenId = ?'); values.push(changes.screenId); }
    if (changes.module !== undefined) { fields.push('module = ?'); values.push(changes.module); }
    if (changes.assignedDeveloperId !== undefined) { fields.push('assignedDeveloperId = ?'); values.push(changes.assignedDeveloperId); }
    if (changes.severity !== undefined) { fields.push('severity = ?'); values.push(changes.severity); }
    if (changes.attachments !== undefined) { fields.push('attachments = ?'); values.push(JSON.stringify(changes.attachments)); }
    if (changes.deadline !== undefined) { fields.push('deadline = ?'); values.push(changes.deadline); }
    if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
    if (changes.resolvedAt !== undefined) { fields.push('resolvedAt = ?'); values.push(changes.resolvedAt); }
    if (changes.updatedAt !== undefined) { fields.push('updatedAt = ?'); values.push(changes.updatedAt); }

    if (fields.length === 0) return;

    values.push(bugId);
    const sql = `UPDATE bugs SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateBugInDb:', error);
    throw error;
  }
}

async function deleteBugFromDb(bugId) {
  try {
    const sql = 'DELETE FROM bugs WHERE id = ?';
    await pool.execute(sql, [bugId]);
  } catch (error) {
    console.error('Database delete failed in deleteBugFromDb:', error);
    throw error;
  }
}

async function createScreenInDb(screen) {
  try {
    const sql = `INSERT INTO screens
      (id, projectId, title, module, assigneeId, plannedDeadline, actualEndDate, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      screen.id,
      screen.projectId,
      screen.title,
      screen.module,
      screen.assigneeId,
      screen.plannedDeadline,
      screen.actualEndDate,
      screen.status,
      screen.notes,
      screen.createdAt,
      screen.updatedAt
    ];
    await pool.execute(sql, params);
  } catch (error) {
    console.error('Database insert failed in createScreenInDb:', error);
    throw error;
  }
}

async function updateScreenInDb(screenId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.title !== undefined) { fields.push('title = ?'); values.push(changes.title); }
    if (changes.module !== undefined) { fields.push('module = ?'); values.push(changes.module); }
    if (changes.assigneeId !== undefined) { fields.push('assigneeId = ?'); values.push(changes.assigneeId); }
    if (changes.plannedDeadline !== undefined) { fields.push('plannedDeadline = ?'); values.push(changes.plannedDeadline); }
    if (changes.actualEndDate !== undefined) { fields.push('actualEndDate = ?'); values.push(changes.actualEndDate); }
    if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
    if (changes.notes !== undefined) { fields.push('notes = ?'); values.push(changes.notes); }
    if (changes.updatedAt !== undefined) { fields.push('updatedAt = ?'); values.push(changes.updatedAt); }

    if (fields.length === 0) return;

    values.push(screenId);
    const sql = `UPDATE screens SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateScreenInDb:', error);
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
    if (changes.developerIds !== undefined) { fields.push('developerIds = ?'); values.push(JSON.stringify(changes.developerIds)); }
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

async function getScreensFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM screens');
    return rows;
  } catch (error) {
    console.error('Database query failed in getScreensFromMySQL:', error);
    throw error;
  }
}

async function getScreenById(screenId) {
  try {
    const [rows] = await pool.query('SELECT * FROM screens WHERE id = ?', [screenId]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('Database query failed in getScreenById:', error);
    throw error;
  }
}

async function deleteScreenFromDb(screenId) {
  try {
    const sql = 'DELETE FROM screens WHERE id = ?';
    await pool.execute(sql, [screenId]);
  } catch (error) {
    console.error('Database delete failed in deleteScreenFromDb:', error);
    throw error;
  }
}

async function createUserInDb(user) {
  try {
    const hashedPassword = await hashPassword(user.password);
    const sql = 'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)';
    const params = [user.id, user.name, user.email, hashedPassword, user.role];
    await pool.execute(sql, params);
  } catch (error) {
    console.error('Database insert failed in createUserInDb:', error);
    throw error;
  }
}

async function updateUserInDb(userId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.name !== undefined) { fields.push('name = ?'); values.push(changes.name); }
    if (changes.email !== undefined) { fields.push('email = ?'); values.push(changes.email); }
    if (changes.password !== undefined) {
      const hashedPassword = await hashPassword(changes.password);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    if (changes.role !== undefined) { fields.push('role = ?'); values.push(changes.role); }

    if (fields.length === 0) return;

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateUserInDb:', error);
    throw error;
  }
}

async function deleteUserFromDb(userId) {
  try {
    const sql = 'DELETE FROM users WHERE id = ?';
    await pool.execute(sql, [userId]);
  } catch (error) {
    console.error('Database delete failed in deleteUserFromDb:', error);
    throw error;
  }
}

module.exports = { getProjectsFromMySQL, getProjectById, updateProjectInDb, getBugById, getUsersFromMySQL, updateBugInDb, deleteBugFromDb, createScreenInDb, updateScreenInDb, getScreensFromMySQL, getScreenById, deleteScreenFromDb, createUserInDb, updateUserInDb, deleteUserFromDb };