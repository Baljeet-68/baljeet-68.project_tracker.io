#!/bin/bash

APP_DIR=/home/mmfilgqi/public_html/Project_Tracker_Tool/server

cd $APP_DIR

echo "Installing dependencies..."
npm install --production

echo "Starting server..."
pm2 start index.js --name project_tracker_server

echo "Saving PM2..."
pm2 save
