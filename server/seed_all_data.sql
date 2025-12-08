-- server/seed_all_data.sql
-- Complete seed data for Bug Tracker: users, projects, screens, bugs, activity log

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'tester', 'developer') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, name, email, password, role, active) VALUES
('u1', 'Admin User', 'admin@example.com', 'admin123', 'admin', TRUE),
('u2', 'John Tester', 'tester@example.com', 'tester123', 'tester', TRUE),
('u3', 'Dev Alice', 'alice@example.com', 'dev123', 'developer', TRUE),
('u4', 'Dev Bob', 'bob@example.com', 'dev123', 'developer', TRUE),
('u5', 'Dev Charlie', 'charlie@example.com', 'dev123', 'developer', TRUE);

-- ============ PROJECTS TABLE ============
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT,
  description TEXT,
  status VARCHAR(50),
  testerId VARCHAR(255),
  developerIds TEXT,
  createdBy VARCHAR(255),
  createdAt DATETIME,
  startDate DATETIME,
  endDate DATETIME,
  FOREIGN KEY (testerId) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

INSERT INTO projects (id, name, client, description, status, testerId, developerIds, createdBy, createdAt, startDate, endDate) VALUES
('proj1', 'E-Commerce Platform', 'Acme Corp', 'Build scalable e-commerce platform', 'Running', 'u2', '["u3","u4"]', 'u1', '2025-01-01 00:00:00', '2025-01-01 00:00:00', '2025-06-01 00:00:00'),
('proj2', 'Mobile App Redesign', 'TechStart Inc', 'Redesign mobile app UI/UX', 'Under Planning', 'u2', '["u4","u5"]', 'u1', '2025-01-05 00:00:00', '2025-02-01 00:00:00', '2025-05-01 00:00:00');

-- ============ SCREENS TABLE ============
CREATE TABLE IF NOT EXISTS screens (
  id VARCHAR(255) PRIMARY KEY,
  projectId VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  assigneeId VARCHAR(255),
  plannedDeadline DATETIME,
  actualEndDate DATETIME,
  status VARCHAR(50),
  notes TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (assigneeId) REFERENCES users(id)
);

INSERT INTO screens (id, projectId, title, module, assigneeId, plannedDeadline, actualEndDate, status, notes, createdAt, updatedAt) VALUES
('scr1', 'proj1', 'Product Listing Page', 'Frontend', 'u3', '2025-02-15 00:00:00', NULL, 'In Progress', 'Include filtering and sorting', '2025-01-10 00:00:00', '2025-01-10 00:00:00'),
('scr2', 'proj1', 'Checkout Flow', 'Frontend', 'u4', '2025-03-01 00:00:00', NULL, 'Planned', 'Multi-step checkout', '2025-01-10 00:00:00', '2025-01-10 00:00:00'),
('scr3', 'proj1', 'User Authentication', 'Backend', 'u3', '2025-02-01 00:00:00', '2025-01-28 00:00:00', 'Done', 'JWT-based auth', '2025-01-05 00:00:00', '2025-01-28 00:00:00');

-- ============ BUGS TABLE ============
CREATE TABLE IF NOT EXISTS bugs (
  id VARCHAR(255) PRIMARY KEY,
  projectId VARCHAR(255) NOT NULL,
  bugNumber INT NOT NULL,
  description TEXT NOT NULL,
  screenId VARCHAR(255),
  module VARCHAR(100),
  assignedDeveloperId VARCHAR(255),
  createdBy VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Open',
  severity VARCHAR(50) DEFAULT 'medium',
  attachments TEXT,
  deadline DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  resolvedAt DATETIME,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (screenId) REFERENCES screens(id),
  FOREIGN KEY (assignedDeveloperId) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id),
  UNIQUE KEY unique_bug_per_project (projectId, bugNumber)
);

INSERT INTO bugs (id, projectId, bugNumber, description, screenId, module, assignedDeveloperId, createdBy, status, severity, attachments, createdAt, updatedAt, resolvedAt) VALUES
('bug1', 'proj1', 1, 'Filter dropdown not closing on selection', 'scr1', 'Frontend', 'u3', 'u2', 'Open', 'high', '[]', '2025-01-15 00:00:00', '2025-01-15 00:00:00', NULL),
('bug2', 'proj1', 2, 'Sorting not working on mobile', 'scr1', 'Frontend', 'u4', 'u2', 'In Progress', 'medium', '[]', '2025-01-18 00:00:00', '2025-01-20 00:00:00', NULL),
('bug3', 'proj1', 3, 'Payment gateway integration error', 'scr2', 'Backend', 'u4', 'u2', 'Resolved', 'critical', '[]', '2025-01-20 00:00:00', '2025-01-22 00:00:00', '2025-01-22 00:00:00');

-- ============ ACTIVITY LOG TABLE ============
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(255) PRIMARY KEY,
  projectId VARCHAR(255),
  entityType VARCHAR(100),
  entityId VARCHAR(255),
  action VARCHAR(100),
  createdBy VARCHAR(255) NOT NULL,
  changes JSON,
  createdAt DATETIME,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

INSERT INTO activity_log (id, projectId, entityType, entityId, action, createdBy, changes, createdAt) VALUES
('act1', 'proj1', 'bug', 'bug1', 'created', 'u2', '{"description": "Filter dropdown not closing", "status": "Open"}', '2025-01-15 00:00:00'),
('act2', 'proj1', 'bug', 'bug2', 'status_change', 'u4', '{"oldStatus": "Open", "newStatus": "In Progress"}', '2025-01-20 00:00:00');

-- ============ BUG COUNTERS TABLE ============
CREATE TABLE IF NOT EXISTS bug_counters (
  projectId VARCHAR(255) PRIMARY KEY,
  counter INT DEFAULT 0,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

INSERT INTO bug_counters (projectId, counter) VALUES
('proj1', 3),
('proj2', 0);
