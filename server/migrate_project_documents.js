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
        createdBy VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL,
        INDEX (projectId)
      )
    `;
    
    await pool.query(sql);
    console.log('SUCCESS: project_documents table created.');
    process.exit(0);
  } catch (error) {
    console.error('ERROR during migration:', error);
    process.exit(1);
  }
}

migrate();
