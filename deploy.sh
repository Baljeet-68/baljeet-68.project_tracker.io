#!/bin/bash

echo "================================="
echo "🚀 DEPLOY START"
echo "================================="

TARGET="/home/your_cpanel_username/public_html/Project_Tracker_Tool"

# Load Node environment

source /opt/alt/alt-nodejs24/enable 2>/dev/null || true

# Move to project root

cd "$TARGET" || exit

# ===============================

# REMOVE OLD FRONTEND FILES FIRST

# ===============================

echo "🧹 Removing old frontend files..."
rm -rf assets
rm -f index.html

# ===============================

# CLEAN GIT

# ===============================

echo "Cleaning git working tree..."
git clean -fd
git reset --hard HEAD

# ===============================

# PULL LATEST CODE

# ===============================

echo "📥 Pulling latest changes..."
git pull origin main

# ===============================

# DEPLOY FRONTEND

# ===============================

echo "🎨 Deploying frontend build..."

cp -rf client/dist/* .

echo "✅ Frontend deployed"

# ===============================

# BACKEND SETUP

# ===============================

echo "📦 Installing backend dependencies..."

cd "$TARGET/server" || exit
npm install --omit=dev

# ===============================

# RESTART NODE SERVER

# ===============================

echo "🔁 Restarting Node server..."

mkdir -p "$TARGET/logs"

echo "Stopping processes on port 4000..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

sleep 2

echo "Starting server..."
nohup npm start > "$TARGET/logs/server.log" 2>&1 &

PID=$!
echo "✅ Server started with PID: $PID"

echo "================================="
echo "🎉 DEPLOY COMPLETE"
echo "================================="
