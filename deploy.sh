#!/bin/bash

echo "=== DEPLOY START ==="

# Load Node.js environment (adjust if needed)
source /opt/alt/alt-nodejs18/enable 2>/dev/null || true

TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

cd "$TARGET" || exit

echo "Resetting local changes..."
git reset --hard HEAD

echo "Pulling latest changes..."
git pull origin main


# ===============================
# FRONTEND BUILD
# ===============================
echo "Installing frontend dependencies..."
cd "$TARGET/client" || exit
npm install
npm run build


# ===============================
# CLEAN ROOT FRONTEND FILES
# ===============================
echo "Deleting old frontend root files..."
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"


# ===============================
# MOVE NEW DIST FILES TO ROOT
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
