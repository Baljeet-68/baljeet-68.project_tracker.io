const { getConfig } = require('../config/runtime');

function buildUploadUrl(filename) {
  if (!filename) return '';
  if (String(filename).startsWith('http')) return String(filename);
  const cfg = getConfig();
  const origin = cfg.PUBLIC_APP_ORIGIN.replace(/\/+$/, '');
  return `${origin}/uploads/${filename}`;
}

module.exports = { buildUploadUrl };

