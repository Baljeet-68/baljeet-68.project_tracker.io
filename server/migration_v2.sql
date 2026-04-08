-- SQL Migration Script for New Modules
-- Run this on your MySQL database if you are using MODE=live

-- 1. Add 'type' column to projects table
-- This allows distinguishing between 'IT' and 'ecommerce' projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'IT' AFTER status;

-- 2. Create holidays table
-- Used by the leave validation logic and holiday calendar admin panel
CREATE TABLE IF NOT EXISTS holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create notification_preferences table
-- Manages per-user notification settings for Email and In-App
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id VARCHAR(255),
    type VARCHAR(100),
    email_enabled BOOLEAN DEFAULT TRUE,
    inapp_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
