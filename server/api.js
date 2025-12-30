const { pool } = require('./db');
const { hashPassword, encrypt, decrypt } = require('./utils/encryption');

async function getProjectsFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM projects');
    return rows.map(r => ({
      ...r,
      name: decrypt(r.name),
      client: decrypt(r.client),
      description: decrypt(r.description),
      developerIds: (() => {
        try {
          if (r.developerIds == null) return [];
          if (Array.isArray(r.developerIds)) return r.developerIds;
          return JSON.parse(r.developerIds);
        } catch (e) {
          return [];
        }
      })()
    }));
  } catch (error) {
    console.error('Database query failed in getProjectsFromMySQL:', error);
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
      name: decrypt(r.name),
      client: decrypt(r.client),
      description: decrypt(r.description),
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
      description: decrypt(r.description),
      screenId: r.screenId,
      module: decrypt(r.module),
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
    return rows.map(r => ({
      ...r,
      name: decrypt(r.name),
      email: decrypt(r.email)
    }));
  } catch (error) {
    console.error('Database query failed in getUsersFromMySQL:', error);
    throw error;
  }
}

async function updateBugInDb(bugId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.description !== undefined) { fields.push('description = ?'); values.push(encrypt(changes.description)); }
    if (changes.screenId !== undefined) { fields.push('screenId = ?'); values.push(changes.screenId); }
    if (changes.module !== undefined) { fields.push('module = ?'); values.push(encrypt(changes.module)); }
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
      encrypt(screen.title),
      encrypt(screen.module),
      screen.assigneeId,
      screen.plannedDeadline,
      screen.actualEndDate,
      screen.status,
      encrypt(screen.notes),
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

    if (changes.title !== undefined) { fields.push('title = ?'); values.push(encrypt(changes.title)); }
    if (changes.module !== undefined) { fields.push('module = ?'); values.push(encrypt(changes.module)); }
    if (changes.assigneeId !== undefined) { fields.push('assigneeId = ?'); values.push(changes.assigneeId); }
    if (changes.plannedDeadline !== undefined) { fields.push('plannedDeadline = ?'); values.push(changes.plannedDeadline); }
    if (changes.actualEndDate !== undefined) { fields.push('actualEndDate = ?'); values.push(changes.actualEndDate); }
    if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
    if (changes.notes !== undefined) { fields.push('notes = ?'); values.push(encrypt(changes.notes)); }
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

    if (changes.name !== undefined) { fields.push('name = ?'); values.push(encrypt(changes.name)); }
    if (changes.client !== undefined) { fields.push('client = ?'); values.push(encrypt(changes.client)); }
    if (changes.description !== undefined) { fields.push('description = ?'); values.push(encrypt(changes.description)); }
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
    return rows.map(r => ({
      ...r,
      title: decrypt(r.title),
      module: decrypt(r.module),
      notes: decrypt(r.notes)
    }));
  } catch (error) {
    console.error('Database query failed in getScreensFromMySQL:', error);
    throw error;
  }
}

async function getScreenById(screenId) {
  try {
    const [rows] = await pool.query('SELECT * FROM screens WHERE id = ?', [screenId]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      title: decrypt(r.title),
      module: decrypt(r.module),
      notes: decrypt(r.notes)
    };
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
    const params = [user.id, encrypt(user.name), encrypt(user.email), hashedPassword, user.role];
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

    if (changes.name !== undefined) { fields.push('name = ?'); values.push(encrypt(changes.name)); }
    if (changes.email !== undefined) { fields.push('email = ?'); values.push(encrypt(changes.email)); }
    if (changes.password !== undefined) {
      const hashedPassword = await hashPassword(changes.password);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    if (changes.role !== undefined) { fields.push('role = ?'); values.push(changes.role); }
    if (changes.profilePicture !== undefined) { fields.push('profilePicture = ?'); values.push(changes.profilePicture); }

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

async function getBugsFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM bugs');
    return rows.map(r => ({
      ...r,
      description: decrypt(r.description),
      module: decrypt(r.module)
    }));
  } catch (error) {
    console.error('Database query failed in getBugsFromMySQL:', error);
    throw error;
  }
}

async function getBugStatsByYear(year) {
  try {
    const [rows] = await pool.query(
      `SELECT MONTH(createdAt) as month, COUNT(*) as count 
       FROM bugs 
       WHERE YEAR(createdAt) = ? 
       GROUP BY MONTH(createdAt)`,
      [year]
    );
    return rows;
  } catch (error) {
    console.error('Database query failed in getBugStatsByYear:', error);
    throw error;
  }
}

module.exports = {
  pool,
  getProjectsFromMySQL,
  getProjectById,
  updateProjectInDb,
  getBugById,
  getUsersFromMySQL,
  updateBugInDb,
  deleteBugFromDb,
  createScreenInDb,
  updateScreenInDb,
  getScreensFromMySQL,
  getScreenById,
  deleteScreenFromDb,
  createUserInDb,
  updateUserInDb,
  deleteUserFromDb,
  getBugsFromMySQL,
  getBugStatsByYear
};