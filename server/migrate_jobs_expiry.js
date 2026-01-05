const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Migrating jobs table to include expiryDate...');
    const sql = "ALTER TABLE jobs ADD COLUMN expiryDate DATETIME DEFAULT NULL";
    await pool.query(sql);
    console.log('Migration successful: expiryDate column added.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column expiryDate already exists. Skipping.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
