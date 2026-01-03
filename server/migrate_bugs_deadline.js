const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Starting migration: Adding deadline column to bugs table...');
    
    // Check if column exists first
    const [columns] = await pool.query('SHOW COLUMNS FROM bugs LIKE "deadline"');
    
    if (columns.length === 0) {
      const sql = 'ALTER TABLE bugs ADD COLUMN deadline DATETIME DEFAULT NULL AFTER attachments';
      await pool.query(sql);
      console.log('SUCCESS: deadline column added to bugs table.');
    } else {
      console.log('INFO: deadline column already exists in bugs table.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR during migration:', error);
    process.exit(1);
  }
}

migrate();
