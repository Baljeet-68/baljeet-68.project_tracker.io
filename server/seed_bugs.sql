-- server/seed_bugs.sql
-- Insert bugs for project 1

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

INSERT IGNORE INTO bugs (id, projectId, bugNumber, description, screenId, module, assignedDeveloperId, createdBy, status, severity, attachments, createdAt, updatedAt, resolvedAt) VALUES
('bug1', 'proj1', 1, 'Filter dropdown not closing on selection', 'scr1', 'Frontend', 'u3', 'u2', 'Open', 'high', '[]', '2025-01-15 00:00:00', '2025-01-15 00:00:00', NULL),
('bug2', 'proj1', 2, 'Sorting not working on mobile', 'scr1', 'Frontend', 'u4', 'u2', 'In Progress', 'medium', '[]', '2025-01-18 00:00:00', '2025-01-20 00:00:00', NULL),
('bug3', 'proj1', 3, 'Payment gateway integration error', 'scr2', 'Backend', 'u4', 'u2', 'Resolved', 'critical', '[]', '2025-01-20 00:00:00', '2025-01-22 00:00:00', '2025-01-22 00:00:00');