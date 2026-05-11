let app;
try {
  app = require('../server/app');
} catch (err) {
  app = (req, res) => {
    res.status(500).json({ boot_error: err.message, stack: err.stack });
  };
}
module.exports = app;
