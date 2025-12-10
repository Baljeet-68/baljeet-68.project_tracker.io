#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "=== DEPLOY START ==="

REPO="."
TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

# Pull latest changes from git
echo "Pulling latest changes..."
git pull origin main

echo "Clearing old frontend build..."
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"

echo "Copying new frontend build..."
cp "$REPO/client/dist/index.html" "$TARGET/index.html"
cp -r "$REPO/client/dist/assets" "$TARGET/assets"

echo "Setting permissions..."
chmod 644 "$TARGET/index.html"
chmod -R 755 "$TARGET/assets"

echo "Installing server dependencies..."
if [ -d "$REPO/server" ]; then
    cd "$REPO/server"
    npm install
    cd ..
else
    echo "Warning: server directory not found, skipping npm install."
fi

echo "Restarting Node.js server..."
mkdir -p "$TARGET/tmp"
touch "$TARGET/tmp/restart.txt"

echo "=== DEPLOY COMPLETE ==="
