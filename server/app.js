const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino-http');
const { randomUUID } = require('crypto');

const { loadConfig } = require('./config/index');
const { initConfig } = require('./config/runtime');

const cfg = initConfig(loadConfig(process.env));

const app = express();

app.use((req, res, next) => {
  req.cache = {
    users: null,
    bugs: null,
    screens: null,
    projects: null,
    projectBugs: {},
    projectScreens: {},
    projectMilestones: {},
    notifications: {},
  };
  next();
});

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// pino-http disabled temporarily for Vercel compatibility debugging
// app.use(pino({ genReqId: (req) => req.id, redact: ['req.headers.authorization'] }));

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  cfg.PUBLIC_APP_ORIGIN
]);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

app.get(`${cfg.BASE_URL}/hello`, (req, res) => {
  const now = new Date();
  res.json({
    status: 'ok',
    message: 'API is working!',
    base_url: cfg.BASE_URL,
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString(),
  });
});

const authRoutes            = require('./routes/auth');
const userRoutes            = require('./routes/users');
const projectRoutes         = require('./routes/projects');
const screenRoutes          = require('./routes/screens');
const bugRoutes             = require('./routes/bugs');
const leaveRoutes           = require('./routes/leaves');
const notificationRoutes    = require('./routes/notifications');
const announcementRoutes    = require('./routes/announcements');
const milestoneRoutes       = require('./routes/milestones');
const holidayRoutes         = require('./routes/holidays');
const ecommerceProjectRoutes = require('./routes/ecommerce-projects');
const careerRoutes          = require('./routes/careers');
const projectDocumentRoutes = require('./routes/projectDocuments');
const taskRoutes            = require('./routes/tasks');
const reportRoutes          = require('./routes/reports');
const dashboardRoutes       = require('./routes/dashboard');

app.use(cfg.BASE_URL, authRoutes);
app.use(cfg.BASE_URL, userRoutes);
app.use(cfg.BASE_URL, projectRoutes);
app.use(cfg.BASE_URL, screenRoutes);
app.use(cfg.BASE_URL, bugRoutes);
app.use(cfg.BASE_URL, leaveRoutes);
app.use(cfg.BASE_URL, notificationRoutes);
app.use(cfg.BASE_URL, announcementRoutes);
app.use(cfg.BASE_URL, milestoneRoutes);
app.use(cfg.BASE_URL, holidayRoutes);
app.use(cfg.BASE_URL, ecommerceProjectRoutes);
app.use(cfg.BASE_URL, careerRoutes);
app.use(cfg.BASE_URL, projectDocumentRoutes);
app.use(cfg.BASE_URL, taskRoutes);
app.use(cfg.BASE_URL, reportRoutes);
app.use(cfg.BASE_URL, dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : (err.message || 'Error'),
    requestId: req.id
  });
});

module.exports = app;
