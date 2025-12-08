#!/bin/bash

REPO="/home/mmfilgqi/public_html/Project_Tracker_Tool"
TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool/live"

echo "=== DEPLOY START ==="

# Ensure target folder exists
mkdir -p "$TARGET"

echo "Copying frontend build..."

# Clean old build
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"

# Copy new build
cp "$REPO/client/dist/index.html" "$TARGET/index.html"
cp -r "$REPO/client/dist/assets" "$TARGET/assets"

echo "Frontend deploy complete."
echo "=== DEPLOY COMPLETE ==="
