const { pool } = require('./db');

async function migrateCareers() {
  try {
    console.log('Migrating Career tables...');
    
    // Jobs table
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255),
        type VARCHAR(50), -- Full-time, Part-time, Contract, etc.
        salary VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active', -- active, closed
        createdBy VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createJobsTable);
    console.log('Jobs table ready.');

    // Applications table
    const createApplicationsTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(255) PRIMARY KEY,
        jobId VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        resumeUrl TEXT,
        coverLetter TEXT,
        status VARCHAR(50) DEFAULT 'applied', -- applied, reviewing, shortlisted, rejected, hired
        appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createApplicationsTable);
    console.log('Applications table ready.');

    console.log('Career migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Career migration failed:', error);
    process.exit(1);
  }
}

migrateCareers();
