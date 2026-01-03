const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Starting migration: Ensuring attachments column exists in bugs table...');
    
    // Check if column exists
    const [columns] = await pool.query('SHOW COLUMNS FROM bugs LIKE "attachments"');
    
    if (columns.length === 0) {
      console.log('Adding attachments column to bugs table...');
      const sql = 'ALTER TABLE bugs ADD COLUMN attachments LONGTEXT DEFAULT NULL AFTER severity';
      await pool.query(sql);
      console.log('SUCCESS: attachments column added.');
    } else {
      console.log('INFO: attachments column already exists.');
      
      // If it exists, ensure it's LONGTEXT to handle large base64 strings
      const columnType = columns[0].Type.toLowerCase();
      if (!columnType.includes('longtext') && !columnType.includes('mediumtext')) {
        console.log('Updating attachments column type to LONGTEXT...');
        await pool.query('ALTER TABLE bugs MODIFY COLUMN attachments LONGTEXT');
        console.log('SUCCESS: attachments column updated to LONGTEXT.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR during migration:', error);
    process.exit(1);
  }
}

migrate();
