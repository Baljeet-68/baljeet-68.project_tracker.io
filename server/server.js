// server.js
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const app = express();

// MODE + BASE_URL
const MODE = process.env.MODE || "local";
const isLocal = MODE === "local";
const BASE_URL = process.env.BASE_URL || "";

console.log("=================================");
console.log("SERVER MODE:", isLocal ? "LOCAL" : "LIVE");
console.log("BASE_URL:", BASE_URL);
console.log("=================================");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mmfinfotech.website",
      "https://mmfinfotech.website/Project_Tracker_Tool",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

const PORT = process.env.PORT || 4000;

// Public test route
app.get(`${BASE_URL}/hello`, (req, res) => {
  res.json({ message: `'API is working!'${new Date().toLocaleString()}` });
});

// === IMPORT ROUTES ===
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const screenRoutes = require("./routes/screens");
const bugRoutes = require("./routes/bugs");

// === MOUNT ROUTES ===
// 🔥 FIX: Avoid double-prefix issues
app.use(BASE_URL, authRoutes);
app.use(BASE_URL, userRoutes);
app.use(BASE_URL, projectRoutes);
console.log(projectRoutes);
app.use(BASE_URL, screenRoutes);
app.use(BASE_URL, bugRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 BASE_URL applied: ${BASE_URL}`);
});