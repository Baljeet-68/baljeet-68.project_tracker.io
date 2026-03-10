const { getConfig } = require('./config/runtime');

// Backwards-compatible facade for legacy imports.
function getUSE_LIVE_DB() {
  return getConfig().USE_LIVE_DB;
}

module.exports = {
  get USE_LIVE_DB() {
    return getUSE_LIVE_DB();
  }
};