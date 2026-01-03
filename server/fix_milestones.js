const { pool } = require('./db');

async function fixMilestoneTable() {
  try {
    console.log('Checking milestone table structure...');
    
    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'milestones'");
    if (tables.length === 0) {
      console.log('Milestones table does not exist. Creating it...');
      const createTableQuery = `
        CREATE TABLE milestones (
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
      await pool.query(createTableQuery);
      console.log('Table created successfully.');
    } else {
      console.log('Table exists. Ensuring status column is VARCHAR to avoid ENUM issues...');
      // Convert status to VARCHAR if it was ENUM
      await pool.query("ALTER TABLE milestones MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'");
      console.log('Table structure updated successfully.');
    }
    
    // Fix any empty statuses
    console.log('Fixing any empty status values...');
    await pool.query("UPDATE milestones SET status = 'Pending' WHERE status IS NULL OR status = ''");
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fixMilestoneTable();
