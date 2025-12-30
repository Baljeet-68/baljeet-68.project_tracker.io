// Toggle this to switch between local and live DB
const USE_LIVE_DB = process.env.MODE === 'live'; // Live = MariaDB, false = local
const USE_ENCRYPTION = true; 

module.exports = {
  USE_LIVE_DB,
  USE_ENCRYPTION
};