let app;
try {
  app = require('../server/app');
} catch (err) {
  app = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    res.status(500).json({
      boot_error: err.message,
      type: err.name,
      has_jwt: !!process.env.JWT_SECRET,
      has_origin: !!process.env.PUBLIC_APP_ORIGIN,
      mode: process.env.MODE || 'unset',
      base_url: process.env.BASE_URL || 'unset',
    });
  };
}
module.exports = app;
