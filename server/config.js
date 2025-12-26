// Toggle this to switch between local and live DB
const USE_LIVE_DB = process.env.MODE === 'live'; // Live = MariaDB, false = local #for live

const USE_ENCRYPTION = process.env.USE_ENCRYPTION === 'true'; // true = encrypt sensitive data, false = no encryption

module.exports = {
  USE_LIVE_DB,
  USE_ENCRYPTION
};