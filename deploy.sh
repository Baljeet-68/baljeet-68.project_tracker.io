#!/bin/bash

echo "=== DEPLOY START ==="

TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

cd "$TARGET" || exit

echo "Resetting local changes..."
git reset --hard HEAD

echo "Pulling latest changes..."
git pull origin main

echo "Installing frontend dependencies..."
cd client
npm install
npm run build

echo "Deleting index.html and assets folder from root..."

# Delete index.html
rm -f "$TARGET/index.html"

# Delete assets folder
rm -rf "$TARGET/assets"

echo "Root files deleted."

echo "Moving dist files to root..."

# Path to the built frontend files
DIST_PATH="$TARGET/client/dist"

# Copy everything from dist → root
cp -r "$DIST_PATH/"* "$TARGET/"

echo "Dist files moved to root."

echo "Deleting client folder..."

rm -rf "$TARGET/client"

echo "Client folder deleted."

echo "Installing backend dependencies..."
cd server
npm install
npm start
cd ..

echo "Restarting Node.js server..."
mkdir -p "$TARGET/tmp"
touch "$TARGET/tmp/restart.txt"

echo "=== DEPLOY COMPLETE ==="
