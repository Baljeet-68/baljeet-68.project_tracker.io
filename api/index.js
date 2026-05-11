const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/hello', (req, res) => res.json({ status: 'ok', source: 'vercel-standalone' }));
app.post('/api/login', (req, res) => res.json({ ok: true }));
app.all('*', (req, res) => res.json({ path: req.path, method: req.method }));
module.exports = app;
