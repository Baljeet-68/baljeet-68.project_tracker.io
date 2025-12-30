const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Toggle this to switch between local and live DB
const MODE = (process.env.MODE || 'local').trim().toLowerCase();
const USE_LIVE_DB = true; // Force DB mode for MariaDB login
const USE_ENCRYPTION = true; 

console.log(`[CONFIG] MODE detected: "${MODE}", USE_LIVE_DB: ${USE_LIVE_DB}`);

module.exports = {
  USE_LIVE_DB,
  USE_ENCRYPTION
};