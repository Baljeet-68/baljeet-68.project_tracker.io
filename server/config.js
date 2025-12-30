const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Toggle this to switch between local and live DB
const MODE = (process.env.MODE || 'local').trim().toLowerCase();
const USE_LIVE_DB = MODE === 'live'; 
const USE_ENCRYPTION = MODE === 'false'; // Use encryption/hashing in live mode with DB

console.log(`[CONFIG] MODE detected: "${MODE}", USE_LIVE_DB: ${USE_LIVE_DB}`);

module.exports = {
  USE_LIVE_DB,
  USE_ENCRYPTION
};