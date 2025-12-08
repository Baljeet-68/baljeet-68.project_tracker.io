// server/import_sql.js
// Simple SQL importer: reads projects_seed.sql and executes it via mysql2
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// For localhost imports, use 'localhost' not the remote host
const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'project_tracker';

async function importSQL() {
  console.log('=== SQL Import Script ===\n');
  console.log(`Connecting to: ${DB_HOST}:${DB_PORT}/${DB_NAME}\n`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectTimeout: 5000,
      multipleStatements: true
    });

    console.log('✓ Connected to database.\n');

    // Read SQL file
    const sql = fs.readFileSync('./projects_seed.sql', 'utf8');
    console.log('Executing SQL...\n');

    // Execute all statements in the file
    await connection.query(sql);

    console.log('✓ SQL import complete!\n');

    // Verify import
    const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM projects');
    console.log(`✓ Projects table now has ${rows[0].cnt} rows.\n`);

    // Show imported projects
    const [projects] = await connection.query('SELECT id, name, status FROM projects');
    console.log('Imported projects:');
    projects.forEach(p => {
      console.log(`  - ${p.id}: ${p.name} (${p.status})`);
    });

    console.log('\n✓ Import successful! You can now start the server:');
    console.log('  npm start\n');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.log(`✗ Error: ${err.message || err.code || 'Unknown error'}\n`);
    console.log('Full error details:');
    console.log(err);
    console.log('\nTroubleshooting:\n');
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
      console.log('  1. Ensure MySQL is running locally on port 3306');
      console.log('  2. Run: net start MySQL' + DB_PORT + ' (Windows)\n');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('  Database does not exist. Create it first:\n');
      console.log('    mysql -u root -p -e "CREATE DATABASE ' + DB_NAME + ';"');
      console.log('    mysql -u ' + DB_USER + ' -p ' + DB_NAME + ' < projects_seed.sql\n');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('  Access denied. Check credentials in server/.env\n');
    }
    process.exit(1);
  }
}

importSQL();
