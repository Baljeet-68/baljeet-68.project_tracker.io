let app;
try {
  app = require('../server/app');
} catch (err) {
  app = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    res.status(500).json({ boot_error: err.message, type: err.name });
  };
}
module.exports = app;
