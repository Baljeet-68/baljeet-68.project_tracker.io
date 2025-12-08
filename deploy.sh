#!/bin/bash

echo "=== DEPLOY START ==="

REPO="/home/mmfilgqi/public_html/Project_Tracker_Tool"
TARGET="/home/mmfilgqi/public_html/Project_Tracker_Tool"

echo "Clearing old frontend build..."
rm -f "$TARGET/index.html"
rm -rf "$TARGET/assets"

echo "Copying new frontend build..."
cp "$REPO/client/dist/index.html" "$TARGET/index.html"
cp -r "$REPO/client/dist/assets" "$TARGET/assets"

echo "Setting permissions..."
chmod 644 "$TARGET/index.html"
chmod -R 755 "$TARGET/assets"

echo "=== DEPLOY COMPLETE ==="
