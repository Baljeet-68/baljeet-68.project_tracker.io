const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  let connection;
  try {
    console.log('Starting migration: Creating project_documents table...');

    // Direct database connection without full config validation
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'project_tracker'
    });

    console.log(`Connected to database: ${process.env.DB_NAME}`);

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

    await connection.query(sql);
    console.log('✅ SUCCESS: project_documents table created or already exists.');

    // Ensure new columns exist for existing tables
    try {
      await connection.query('ALTER TABLE project_documents ADD COLUMN fileSize INT DEFAULT 0 AFTER fileData');
      console.log('✅ Added fileSize column.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  fileSize column already exists.');
      } else {
        console.error('Error adding fileSize:', e.message);
      }
    }

    try {
      await connection.query('ALTER TABLE project_documents ADD COLUMN fileType VARCHAR(100) AFTER fileSize');
      console.log('✅ Added fileType column.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  fileType column already exists.');
      } else {
        console.error('Error adding fileType:', e.message);
      }
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR during migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
