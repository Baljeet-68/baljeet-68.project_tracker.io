// server/check_bugs_table.js
const { pool } = require('./db');

async function checkBugsTable() {
  try {
    const [rows] = await pool.query('DESCRIBE bugs');
    console.log('Columns in bugs table:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error describing bugs table:', err);
    process.exit(1);
  }
}

checkBugsTable();
