#!/bin/bash

REPO=/home/mmfilgqi/public_html/Project_Tracker_Tool
TARGET=/home/mmfilgqi/public_html/Project_Tracker_Tool

echo "=== DEPLOY START ==="

echo "Copying frontend build..."
rm -f $TARGET/index.html
rm -rf $TARGET/assets

cp $REPO/client/dist/index.html $TARGET/index.html
cp -r $REPO/client/dist/assets $TARGET/assets

echo "Copying backend..."
rm -rf $TARGET/server
cp -r $REPO/server $TARGET/server

echo "=== DEPLOY COMPLETE ==="
