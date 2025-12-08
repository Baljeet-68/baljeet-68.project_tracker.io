-- server/seed_screens.sql
-- Insert screens for projects

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

INSERT IGNORE INTO screens (id, projectId, title, module, assigneeId, plannedDeadline, actualEndDate, status, notes, createdAt, updatedAt) VALUES
('scr1', 'proj1', 'Product Listing Page', 'Frontend', 'u3', '2025-02-15 00:00:00', NULL, 'In Progress', 'Include filtering and sorting', '2025-01-10 00:00:00', '2025-01-10 00:00:00'),
('scr2', 'proj1', 'Checkout Flow', 'Frontend', 'u4', '2025-03-01 00:00:00', NULL, 'Planned', 'Multi-step checkout', '2025-01-10 00:00:00', '2025-01-10 00:00:00'),
('scr3', 'proj1', 'User Authentication', 'Backend', 'u3', '2025-02-01 00:00:00', '2025-01-28 00:00:00', 'Done', 'JWT-based auth', '2025-01-05 00:00:00', '2025-01-28 00:00:00');