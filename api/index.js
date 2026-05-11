let app = null;
let bootError = null;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!app && !bootError) {
    try {
      app = require('../server/app');
    } catch (err) {
      bootError = err;
    }
  }

  if (bootError) {
    return res.status(500).json({
      boot_error: bootError.message,
      type: bootError.name,
      stack: bootError.stack,
    });
  }

  return app(req, res);
};
