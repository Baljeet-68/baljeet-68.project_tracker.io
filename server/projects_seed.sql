-- server/projects_seed.sql
-- Create projects table and seed with sample rows from server/data.js

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT,
  client TEXT,
  description TEXT,
  status VARCHAR(50),
  testerId VARCHAR(255),
  developerIds TEXT,
  createdBy VARCHAR(255),
  createdAt DATETIME,
  startDate DATETIME,
  endDate DATETIME
);

INSERT INTO projects (id,name,client,description,status,testerId,developerIds,createdBy,createdAt,startDate,endDate)
VALUES
('proj1','E-Commerce Platform','Acme Corp','Build scalable e-commerce platform','Running','u2','["u3","u4"]','u1','2025-01-01 00:00:00','2025-01-01 00:00:00','2025-06-01 00:00:00'),
('proj2','Mobile App Redesign','TechStart Inc','Redesign mobile app UI/UX','Under Planning','u2','["u4","u5"]','u1','2025-01-05 00:00:00','2025-02-01 00:00:00','2025-05-01 00:00:00');

-- You can import this file in phpMyAdmin or run it from the MySQL CLI to seed the projects table.
