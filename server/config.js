// DEPRECATED: This file is kept for backwards compatibility only.
// All new code should import directly from './config/runtime' instead.
// 
// This facade will be removed in v2.0
// Migration path:
//   OLD: const { USE_LIVE_DB } = require('./config');
//   NEW: const { getConfig } = require('./config/runtime');
//        const cfg = getConfig();
//        const USE_LIVE_DB = cfg.USE_LIVE_DB;

const { getConfig } = require('./config/runtime');

console.warn('[DEPRECATION] Importing from server/config.js is deprecated. Use server/config/runtime.js instead.');

module.exports = {
  get USE_LIVE_DB() {
    return getConfig().USE_LIVE_DB;
  }
};