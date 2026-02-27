const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Starting migration: Creating project_documents table...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS project_documents (
        id VARCHAR(255) PRIMARY KEY,
        projectId VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        fileName VARCHAR(255) NOT NULL,
        fileData LONGTEXT NOT NULL,
        fileSize INT DEFAULT 0,
        fileType VARCHAR(100),
        createdBy VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL,
        INDEX (projectId)
      )
    `;
    
    await pool.query(sql);
    console.log('SUCCESS: project_documents table created or already exists.');

    // Ensure new columns exist for existing tables
    try {
      await pool.query('ALTER TABLE project_documents ADD COLUMN fileSize INT DEFAULT 0 AFTER fileData');
      console.log('Added fileSize column.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding fileSize:', e.message);
    }

    try {
      await pool.query('ALTER TABLE project_documents ADD COLUMN fileType VARCHAR(100) AFTER fileSize');
      console.log('Added fileType column.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding fileType:', e.message);
    }
    process.exit(0);
  } catch (error) {
    console.error('ERROR during migration:', error);
    process.exit(1);
  }
}

migrate();
