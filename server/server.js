// server.js
require("dotenv").config();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   CORS Configuration
================================ */
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

/* ===============================
   Mount Routes (NO double prefix)
================================ */
app.use(BASE_URL, authRoutes);
app.use(BASE_URL, userRoutes);
app.use(BASE_URL, projectRoutes);
app.use(BASE_URL, screenRoutes);
app.use(BASE_URL, bugRoutes);

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