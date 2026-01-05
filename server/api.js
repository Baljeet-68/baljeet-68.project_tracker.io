const { pool } = require('./db');
const { hashPassword, encrypt, decrypt } = require('./utils/encryption');

async function getProjectsFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM projects');
    return rows.map(r => ({
      ...r,
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
    return rows.map(u => ({
      ...u,
      active: u.active !== undefined ? (Buffer.isBuffer(u.active) ? u.active[0] : Number(u.active)) : 1
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
      const sql = 'INSERT INTO users (`id`, `name`, `email`, `password`, `role`, `active`) VALUES (?, ?, ?, ?, ?, ?)';
      const params = [user.id, user.name, user.email, user.password, user.role, user.active !== undefined ? Number(user.active) : 1];
      await pool.query(sql, params);
    } catch (error) {
    console.error('Database insert failed in createUserInDb:', error);
    throw error;
  }
}

async function updateUserInDb(userId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.name !== undefined) { fields.push('`name` = ?'); values.push(changes.name); }
    if (changes.email !== undefined) { fields.push('`email` = ?'); values.push(changes.email); }
    if (changes.password !== undefined) {
      fields.push('`password` = ?');
      values.push(changes.password);
    }
    if (changes.role !== undefined) { fields.push('`role` = ?'); values.push(changes.role); }
    if (changes.profilePicture !== undefined) { fields.push('`profilePicture` = ?'); values.push(changes.profilePicture); }
    if (changes.active !== undefined) { fields.push('`active` = ?'); values.push(Number(changes.active)); }

    if (fields.length === 0) return;

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE \`id\` = ?`;
    await pool.query(sql, values);
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
      module: decrypt(r.module),
      attachments: (() => {
        try {
          if (r.attachments == null) return [];
          if (Array.isArray(r.attachments)) return r.attachments;
          return JSON.parse(r.attachments);
        } catch (e) {
          return [];
        }
      })()
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

async function getAnnouncementsFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY createdAt DESC');
    return rows;
  } catch (error) {
    console.error('Database query failed in getAnnouncementsFromMySQL:', error);
    throw error;
  }
}

async function createAnnouncementInDb(announcement) {
  try {
    const sql = 'INSERT INTO announcements (`id`, `title`, `content`, `targetType`, `targetValue`, `startDate`, `endDate`, `active`, `createdBy`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
      announcement.id,
      announcement.title,
      announcement.content,
      announcement.targetType,
      announcement.targetValue || null,
      announcement.startDate,
      announcement.endDate,
      announcement.active !== undefined ? Number(announcement.active) : 1,
      announcement.createdBy,
      announcement.createdAt || new Date().toISOString()
    ];
    await pool.query(sql, params);
  } catch (error) {
    console.error('Database insert failed in createAnnouncementInDb:', error);
    throw error;
  }
}

async function updateAnnouncementInDb(id, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.title !== undefined) { fields.push('`title` = ?'); values.push(changes.title); }
    if (changes.content !== undefined) { fields.push('`content` = ?'); values.push(changes.content); }
    if (changes.targetType !== undefined) { fields.push('`targetType` = ?'); values.push(changes.targetType); }
    if (changes.targetValue !== undefined) { fields.push('`targetValue` = ?'); values.push(changes.targetValue); }
    if (changes.startDate !== undefined) { fields.push('`startDate` = ?'); values.push(changes.startDate); }
    if (changes.endDate !== undefined) { fields.push('`endDate` = ?'); values.push(changes.endDate); }
    if (changes.active !== undefined) { fields.push('`active` = ?'); values.push(Number(changes.active)); }

    if (fields.length === 0) return;

    values.push(id);
    const sql = `UPDATE announcements SET ${fields.join(', ')} WHERE \`id\` = ?`;
    await pool.query(sql, values);
  } catch (error) {
    console.error('Database update failed in updateAnnouncementInDb:', error);
    throw error;
  }
}

async function deleteAnnouncementFromDb(id) {
  try {
    const sql = 'DELETE FROM announcements WHERE id = ?';
    await pool.execute(sql, [id]);
  } catch (error) {
    console.error('Database delete failed in deleteAnnouncementFromDb:', error);
    throw error;
  }
}

async function getMilestonesFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM milestones');
    return rows;
  } catch (error) {
    console.error('Database query failed in getMilestonesFromMySQL:', error);
    throw error;
  }
}

async function createMilestoneInDb(milestone) {
  try {
    const sql = `INSERT INTO milestones 
      (id, projectId, milestoneNumber, module, timeline, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      milestone.id,
      milestone.projectId,
      milestone.milestoneNumber,
      milestone.module,
      milestone.timeline,
      milestone.status || 'Pending',
      milestone.createdAt || new Date().toISOString(),
      milestone.updatedAt || new Date().toISOString()
    ];
    await pool.execute(sql, params);
  } catch (error) {
    console.error('Database insert failed in createMilestoneInDb:', error);
    throw error;
  }
}

async function updateMilestoneInDb(milestoneId, changes) {
  try {
    const fields = [];
    const values = [];

    if (changes.milestoneNumber !== undefined) { fields.push('milestoneNumber = ?'); values.push(changes.milestoneNumber); }
    if (changes.module !== undefined) { fields.push('module = ?'); values.push(changes.module); }
    if (changes.timeline !== undefined) { fields.push('timeline = ?'); values.push(changes.timeline); }
    if (changes.status !== undefined) { fields.push('status = ?'); values.push(changes.status); }
    if (changes.updatedAt !== undefined) { fields.push('updatedAt = ?'); values.push(changes.updatedAt); }

    if (fields.length === 0) return;

    values.push(milestoneId);
    const sql = `UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateMilestoneInDb:', error);
    throw error;
  }
}

async function deleteMilestoneFromDb(milestoneId) {
  try {
    const sql = 'DELETE FROM milestones WHERE id = ?';
    await pool.execute(sql, [milestoneId]);
  } catch (error) {
    console.error('Database delete failed in deleteMilestoneFromDb:', error);
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
  getBugStatsByYear,
  getAnnouncementsFromMySQL,
  createAnnouncementInDb,
  updateAnnouncementInDb,
  deleteAnnouncementFromDb,
  getMilestonesFromMySQL,
  createMilestoneInDb,
  updateMilestoneInDb,
  deleteMilestoneFromDb,
  // Career Job Functions
  getJobsFromMySQL,
  createJobInDb,
  updateJobInDb,
  deleteJobFromDb,
  // Career Application Functions
  getApplicationsFromMySQL,
  createApplicationInDb,
  updateApplicationInDb
};

async function getJobsFromMySQL() {
    try {
      // Auto-expire jobs
      try {
        await pool.query("UPDATE jobs SET status = 'inactive' WHERE expiryDate < NOW() AND status = 'active'");
      } catch (e) {
        console.warn("Auto-expiry failed (likely missing expiryDate column):", e.message);
      }
      
      const [rows] = await pool.query('SELECT * FROM jobs ORDER BY createdAt DESC');
      return rows;
    } catch (error) {
    console.error('Database query failed in getJobsFromMySQL:', error);
    throw error;
  }
}

async function createJobInDb(job) {
  try {
    const sql = 'INSERT INTO jobs (id, title, description, location, type, salary, status, createdBy, createdAt, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
      job.id, 
      job.title, 
      job.description, 
      job.location, 
      job.type, 
      job.salary, 
      job.status || 'active', 
      job.createdBy, 
      job.createdAt || new Date().toISOString(),
      job.expiryDate || null
    ];
    await pool.execute(sql, params);
  } catch (error) {
    console.error('Database insert failed in createJobInDb:', error);
    throw error;
  }
}

async function updateJobInDb(id, changes) {
  try {
    const fields = [];
    const values = [];
    Object.keys(changes).forEach(key => {
      if (changes[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(changes[key]);
      }
    });
    if (fields.length === 0) return;
    values.push(id);
    const sql = `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);
  } catch (error) {
    console.error('Database update failed in updateJobInDb:', error);
    throw error;
  }
}

async function deleteJobFromDb(id) {
  try {
    await pool.execute('DELETE FROM jobs WHERE id = ?', [id]);
  } catch (error) {
    console.error('Database delete failed in deleteJobFromDb:', error);
    throw error;
  }
}

async function getApplicationsFromMySQL() {
  try {
    const [rows] = await pool.query('SELECT * FROM applications ORDER BY appliedAt DESC');
    return rows.map(r => {
      const out = { ...r };
      if ((out.resumeUrl === undefined || out.resumeUrl === null || out.resumeUrl === '') && out.resume_url) {
        out.resumeUrl = out.resume_url;
      }
      if ('resume_url' in out) delete out.resume_url;
      return out;
    });
  } catch (error) {
    console.error('Database query failed in getApplicationsFromMySQL:', error);
    throw error;
  }
}

async function createApplicationInDb(app) {
  try {
    const sql = 'INSERT INTO applications (id, jobId, userId, fullName, email, phone, resumeUrl, coverLetter, status, appliedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [app.id, app.jobId, app.userId, app.fullName, app.email, app.phone, app.resumeUrl, app.coverLetter, app.status || 'applied', app.appliedAt || new Date().toISOString()];
    await pool.execute(sql, params);
  } catch (error) {
    if (error && (error.code === 'ER_BAD_FIELD_ERROR' || /Unknown column 'resumeUrl'/.test(String(error.message)))) {
      const sql = 'INSERT INTO applications (id, jobId, userId, fullName, email, phone, resume_url, coverLetter, status, appliedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const params = [app.id, app.jobId, app.userId, app.fullName, app.email, app.phone, app.resumeUrl, app.coverLetter, app.status || 'applied', app.appliedAt || new Date().toISOString()];
      await pool.execute(sql, params);
      return;
    }
    console.error('Database insert failed in createApplicationInDb:', error);
    throw error;
  }
}

async function updateApplicationInDb(id, status) {
  try {
    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
  } catch (error) {
    console.error('Database update failed in updateApplicationInDb:', error);
    throw error;
  }
}
