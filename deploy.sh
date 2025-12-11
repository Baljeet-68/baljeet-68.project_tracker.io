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
cd ..

echo "Installing backend dependencies..."
cd server
npm install
cd ..

echo "Restarting Node.js server..."
mkdir -p "$TARGET/tmp"
touch "$TARGET/tmp/restart.txt"

echo "=== DEPLOY COMPLETE ==="
