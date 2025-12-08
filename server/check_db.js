// server/check_db.js
// Diagnostic script to check MySQL connectivity and provide guidance.
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'project_tracker';

async function checkConnection() {
  console.log('=== MySQL Connection Diagnostic ===\n');
  console.log(`Configuration:
  Host: ${DB_HOST}
  Port: ${DB_PORT}
  User: ${DB_USER}
  Database: ${DB_NAME}
  Password: ${DB_PASS ? 'ol$9Kw}bZ}fu' : '(empty)'}\n`);

  try {
    console.log('Attempting connection...');
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectTimeout: 5000
    });

    console.log('✓ Connection successful!\n');

    // Check if projects table exists
    try {
      const [tables] = await connection.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'",
        [DB_NAME]
      );
      if (tables.length > 0) {
        console.log('✓ Table "projects" exists.');
        const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM projects');
        console.log(`  Row count: ${rows[0].cnt}`);
      } else {
        console.log('✗ Table "projects" does NOT exist.');
        console.log('  Run: node migrate_projects.js');
      }
    } catch (err) {
      console.log(`✗ Could not query tables: ${err.message}`);
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.log(`✗ Connection failed: ${err.message}\n`);
    console.log('Troubleshooting:');
    console.log('1. Verify DB_HOST, DB_PORT, DB_USER, DB_PASS in server/.env are correct.');
    console.log('2. Confirm the MySQL server is running and accepting remote connections.');
    console.log('3. Check firewall settings on the DB host — port 3306 may be blocked.');
    console.log('4. If using a hosting provider (like cPanel/phpMyAdmin), verify:');
    console.log('   - MySQL remote access is enabled.');
    console.log('   - Your IP is whitelisted (check phpMyAdmin > Users > Host restrictions).');
    console.log('5. As a quick alternative, import server/projects_seed.sql manually in phpMyAdmin.');
    console.log('   This avoids needing Node.js to connect to the DB.\n');
    process.exit(1);
  }
}

checkConnection();
