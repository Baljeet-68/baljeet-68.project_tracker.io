#!/bin/bash

# Path to your Git repo on server
REPO=/home/mmfilgqi/public_html/Project_Tracker_Tool

# Path where final website files should live
TARGET=/home/mmfilgqi/public_html/Project_Tracker_Tool

echo "=== DEPLOY START ==="

# --------- FRONTEND BUILD ----------
echo "Installing client dependencies..."
cd $REPO/client || exit
npm install --force

echo "Building Vite app..."
npm run build

echo "Copying frontend build to public folder..."
rm -f $TARGET/index.html
rm -rf $TARGET/assets
cp $REPO/client/dist/index.html $TARGET/index.html
cp -r $REPO/client/dist/assets $TARGET/assets


# --------- BACKEND UPDATE ----------
echo "Updating backend..."
rm -rf $TARGET/server
cp -r $REPO/server $TARGET/server

echo "=== DEPLOY COMPLETE ==="
