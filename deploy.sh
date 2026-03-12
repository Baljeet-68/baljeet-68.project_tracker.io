#!/bin/bash

echo "================================="
echo "🚀 DEPLOYMENT STARTED"
echo "================================="

TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

# Load Node.js environment if available

source /opt/alt/alt-nodejs24/enable 2>/dev/null || true

# ===============================

# GO TO PROJECT DIRECTORY

# ===============================

cd "$TARGET" || {
echo "❌ Project directory not found!"
exit 1
}

# ===============================

# GIT RESET + PULL

# ===============================

echo "📥 Resetting local changes..."
git reset --hard HEAD

echo "📥 Pulling latest code from GitHub..."
git pull origin main

# ===============================

# FRONTEND DEPLOYMENT

# ===============================

echo "🎨 Deploying frontend..."

echo "Deleting old frontend root files..."
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"

echo "Copying new dist files to root..."
cp -rf "$TARGET/client/dist/"* "$TARGET/"

echo "✅ Frontend deployment complete."

# ===============================

# BACKEND SETUP

# ===============================

echo "📦 Installing backend dependencies..."
cd "$TARGET/server" || exit
npm install --omit=dev

# ===============================

# RESTART BACKEND SERVER

# ===============================

echo "🔁 Restarting Node.js server..."

mkdir -p "$TARGET/logs"

# Kill any process using port 4000

echo "Stopping existing Node.js processes..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

sleep 2

# Start server in background

echo "Starting Node.js server..."
nohup npm start > "$TARGET/logs/server.log" 2>&1 &

SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"

echo "================================="
echo "🎉 DEPLOYMENT COMPLETE"
echo "================================="
