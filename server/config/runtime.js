let _config = null;

function initConfig(config) {
  _config = config;
  return _config;
}

function getConfig() {
  if (!_config) {
    // Best-effort fallback for scripts/one-offs that loaded dotenv themselves.
    // The main server entrypoint should still call initConfig() explicitly.
    // eslint-disable-next-line global-require
    const { loadConfig } = require('./index');
    _config = loadConfig(process.env);
  }
  return _config;
}

module.exports = { initConfig, getConfig };

