#!/bin/bash
REPO=/home/mmfilgqi/public_html/Project_Tracker_Tool
TARGET=/home/mmfilgqi/public_html/Project_Tracker_Tool

echo "=== DEPLOY START ==="

# ------ FRONTEND BUILD ------
echo "Installing client dependencies..."
cd $REPO/client || exit
npm install --force

echo "Building Vite app..."
npm run build

echo "Copying build output..."
# Remove old files
rm -f $TARGET/index.html
rm -rf $TARGET/assets

# Copy new files
cp $REPO/client/dist/index.html $TARGET/index.html
cp -r $REPO/client/dist/assets $TARGET/assets


# ------ BACKEND ------
echo "Updating backend..."
rm -rf $TARGET/server
cp -r $REPO/server $TARGET/server

echo "=== DEPLOY COMPLETE ==="
