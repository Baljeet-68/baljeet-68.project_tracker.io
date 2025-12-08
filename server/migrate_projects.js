// server/migrate_projects.js
// Simple migration to copy `projects` from in-memory `data.js` into MySQL `projects` table.
const { pool } = require('./db');
const { projects } = require('./data');
require('dotenv').config();

async function ensureTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(255) PRIMARY KEY,
      name TEXT,
      client TEXT,
      description TEXT,
      status VARCHAR(50),
      testerId VARCHAR(255),
      developerIds TEXT,
      createdBy VARCHAR(255),
      createdAt DATETIME,
      startDate DATETIME,
      endDate DATETIME
    )`;
  await pool.execute(createSql);
}

async function migrate() {
  try {
    await ensureTable();
    let inserted = 0;
    for (const p of projects) {
      // Check if exists
      const [rows] = await pool.query('SELECT id FROM projects WHERE id = ?', [p.id]);
      if (rows.length > 0) continue;

      const sql = `INSERT INTO projects
        (id, name, client, description, status, testerId, developerIds, createdBy, createdAt, startDate, endDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        p.id,
        p.name,
        p.client,
        p.description,
        p.status,
        p.testerId || '',
        JSON.stringify(p.developerIds || []),
        p.createdBy || '',
        formatDate(p.createdAt),
        formatDate(p.startDate),
        formatDate(p.endDate)
      ];

      await pool.execute(sql, params);
      inserted++;
    }
    console.log(`Migration complete. Inserted ${inserted} projects.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

function formatDate(d) {
  if (!d) return null;
  if (typeof d === 'string') return new Date(d);
  if (d instanceof Date) return d;
  return new Date(d);
}

migrate();
