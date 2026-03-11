// server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // load env ONCE (entrypoint only)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const { loadConfig } = require('./config/index');
const { initConfig } = require('./config/runtime');

const cfg = initConfig(loadConfig(process.env));

const app = express();

/**
 * Middleware to initialize request-level cache.
 * This ensures that subsequent calls within the same request flow
 * get fresh data if needed, while allowing memoization within that single request.
 * It avoids race conditions between concurrent requests.
 */
app.use((req, res, next) => {
  req.cache = {
    users: null,
    bugs: null,
    screens: null,
    projects: null,
    projectBugs: {},         // Map of projectId -> bugs
    projectScreens: {},      // Map of projectId -> screens
    projectMilestones: {},   // Map of projectId -> milestones
    notifications: {},       // Map of userId -> notifications
  };
  next();
});

app.set('trust proxy', 1); // safe defaults behind reverse proxies (cPanel/Cloudflare/etc.)

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // needed for serving uploaded files
}));

// Request ID + structured logging
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
});
app.use(pino({
  genReqId: (req) => req.id,
  redact: ['req.headers.authorization']
}));

console.log('=================================');
console.log('SERVER MODE:', cfg.USE_LIVE_DB ? 'LIVE' : 'LOCAL');
console.log('BASE_URL:', cfg.BASE_URL || '/');
console.log('PUBLIC_APP_ORIGIN:', cfg.PUBLIC_APP_ORIGIN);
console.log('=================================');

/* ===============================
   Middleware
================================ */
// CORS must be first to handle errors with proper headers
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  cfg.PUBLIC_APP_ORIGIN
]);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & tools like Postman
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Keep JSON payloads small; uploads use multipart streaming instead.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve static files from the uploads directory with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', // Cache for 1 year (filenames are unique with timestamps)
  etag: true,   // Enable ETag for "if-none-match" checks
  lastModified: true // Enable Last-Modified header
}));

/* ===============================
   Port (LOCAL + CPANEL SAFE)
================================ */
const PORT = cfg.PORT;

/* ===============================
   Health Check Route
================================ */
app.get(`${cfg.BASE_URL}/hello`, (req, res) => {
  const now = new Date();
  res.json({
    status: "ok",
    message: "API is working!",
    base_url: cfg.BASE_URL,
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString(),
  });
});

/* ===============================
   Import Routes
================================ */
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const screenRoutes = require("./routes/screens");
const bugRoutes = require("./routes/bugs");
const leaveRoutes = require("./routes/leaves");
const notificationRoutes = require("./routes/notifications");
const announcementRoutes = require("./routes/announcements");
const milestoneRoutes = require("./routes/milestones");
const careerRoutes = require("./routes/careers");
const projectDocumentRoutes = require("./routes/projectDocuments");
const taskRoutes = require("./routes/tasks");
const dashboardRoutes = require("./routes/dashboard");

/* ===============================
   Mount Routes (NO double prefix)
================================ */
app.use(cfg.BASE_URL, authRoutes);
app.use(cfg.BASE_URL, userRoutes);
app.use(cfg.BASE_URL, projectRoutes);
app.use(cfg.BASE_URL, screenRoutes);
app.use(cfg.BASE_URL, bugRoutes);
app.use(cfg.BASE_URL, leaveRoutes);
app.use(cfg.BASE_URL, notificationRoutes);
app.use(cfg.BASE_URL, announcementRoutes);
app.use(cfg.BASE_URL, milestoneRoutes);
app.use(cfg.BASE_URL, careerRoutes);
app.use(cfg.BASE_URL, projectDocumentRoutes);
app.use(cfg.BASE_URL, taskRoutes);
app.use(cfg.BASE_URL, dashboardRoutes);

/* ===============================
   404 Handler
================================ */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler (ensures consistent JSON + hides internals in production)
app.use((err, req, res, next) => {
  req.log?.error({ err }, 'Unhandled error');
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : (err.message || 'Error'),
    requestId: req.id
  });
});

/* ===============================
   Start Server (Safe)
================================ */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 BASE_URL applied: ${cfg.BASE_URL || "/"}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
  }
});
