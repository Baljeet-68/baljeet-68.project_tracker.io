// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   MODE + BASE_URL
================================ */
const MODE = process.env.MODE || "local";
const isLocal = MODE === "local";
const BASE_URL = process.env.BASE_URL || "";

console.log("=================================");
console.log("SERVER MODE:", isLocal ? "LOCAL" : "LIVE");
console.log("BASE_URL:", BASE_URL || "/");
console.log("=================================");

/* ===============================
   Middleware
================================ */
// CORS must be first to handle errors with proper headers
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://mmfinfotech.website",
  "https://mmfinfotech.website/Project_Tracker_Tool",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & tools like Postman
      if (!origin || allowedOrigins.includes(origin)) {
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', // Cache for 1 year (filenames are unique with timestamps)
  etag: true,   // Enable ETag for "if-none-match" checks
  lastModified: true // Enable Last-Modified header
}));

/* ===============================
   Port (LOCAL + CPANEL SAFE)
================================ */
const PORT = process.env.PORT || 4000;

/* ===============================
   Health Check Route
================================ */
app.get(`${BASE_URL}/hello`, (req, res) => {
  const now = new Date();
  res.json({
    status: "ok",
    message: "API is working!",
    base_url: BASE_URL,
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

/* ===============================
   Mount Routes (NO double prefix)
================================ */
app.use(BASE_URL, authRoutes);
app.use(BASE_URL, userRoutes);
app.use(BASE_URL, projectRoutes);
app.use(BASE_URL, screenRoutes);
app.use(BASE_URL, bugRoutes);
app.use(BASE_URL, leaveRoutes);
app.use(BASE_URL, notificationRoutes);
app.use(BASE_URL, announcementRoutes);
app.use(BASE_URL, milestoneRoutes);
app.use(BASE_URL, careerRoutes);

/* ===============================
   404 Handler
================================ */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* ===============================
   Start Server (Safe)
================================ */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 BASE_URL applied: ${BASE_URL || "/"}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
  }
});

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS length:", process.env.DB_PASS?.length);
