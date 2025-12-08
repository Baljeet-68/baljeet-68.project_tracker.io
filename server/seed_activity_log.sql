-- server/seed_activity_log.sql
-- Insert activity log entries

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

INSERT IGNORE INTO activity_log (id, projectId, entityType, entityId, action, createdBy, changes, createdAt) VALUES
('act1', 'proj1', 'bug', 'bug1', 'created', 'u2', '{"description": "Filter dropdown not closing", "status": "Open"}', '2025-01-15 00:00:00'),
('act2', 'proj1', 'bug', 'bug2', 'status_change', 'u4', '{"oldStatus": "Open", "newStatus": "In Progress"}', '2025-01-20 00:00:00');