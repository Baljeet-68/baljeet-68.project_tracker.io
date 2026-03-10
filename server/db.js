// server/db.js
const mysql = require('mysql2/promise');
const { getConfig } = require('./config/runtime');

const cfg = getConfig();

const pool = mysql.createPool({
  host: cfg.DB.host,
  port: cfg.DB.port,
  user: cfg.DB.user,
  password: cfg.DB.password,
  database: cfg.DB.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

module.exports = { pool };
