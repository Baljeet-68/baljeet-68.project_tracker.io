#!/bin/bash

echo "=== DEPLOY START ==="

TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

# Try loading Node.js environment (if available)
source /opt/alt/alt-nodejs20/enable 2>/dev/null || true
source /opt/alt/alt-nodejs18/enable 2>/dev/null || true


# ===============================
# GIT RESET + PULL
# ===============================
cd "$TARGET" || exit

echo "Resetting local changes..."
git reset --hard HEAD

echo "Pulling latest changes..."
git pull origin main


# ===============================
# FRONTEND (BUILD LOCALLY)
# ===============================
echo "Skipping frontend build (server cannot build Vite apps)."
echo "Make sure client/dist is built locally and committed to GitHub."


# ===============================
# DELETE OLD ROOT FRONTEND FILES
# ===============================
echo "Deleting old frontend root files..."
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"


# ===============================
# COPY NEW DIST FILES TO ROOT
# ===============================
echo "Copying new dist files to root..."
cp -rf "$TARGET/client/dist/"* "$TARGET/"

echo "Frontend deployment complete."


# ===============================
# BACKEND SETUP
# ===============================
echo "Installing backend dependencies..."
cd "$TARGET/server" || exit
npm install


# ===============================
# RESTART BACKEND
# ===============================
echo "Restarting Node.js server..."
mkdir -p "$TARGET/tmp"
touch "$TARGET/tmp/restart.txt"

echo "=== DEPLOY COMPLETE ==="
