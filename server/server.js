const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { getConfig } = require('./config/runtime');

const cfg = getConfig();

const server = app.listen(cfg.PORT, () => {
  console.log('=================================');
  console.log('SERVER MODE:', cfg.USE_LIVE_DB ? 'LIVE' : 'LOCAL');
  console.log('BASE_URL  :', cfg.BASE_URL || '/');
  console.log('ORIGIN    :', cfg.PUBLIC_APP_ORIGIN);
  console.log(`Listening on port ${cfg.PORT}`);
  console.log('=================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${cfg.PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
