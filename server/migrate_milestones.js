const { pool } = require('./db');

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(255) PRIMARY KEY,
        projectId VARCHAR(255) NOT NULL,
        milestoneNumber VARCHAR(255),
        module VARCHAR(255),
        timeline DATETIME,
        status VARCHAR(50) DEFAULT 'Pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    // Note: I removed the FOREIGN KEY for now to avoid potential issues if the projects table isn't exactly matching or if it's not InnoDB.
    // Standardizing on the same pattern as other tables in this codebase.
    
    await pool.query(createTableQuery);
    console.log('Milestones table created successfully or already exists.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
