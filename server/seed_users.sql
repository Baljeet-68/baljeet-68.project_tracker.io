-- server/seed_users.sql
-- Insert test users: admin, tester, and developers

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'tester', 'developer') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (id, name, email, password, role, active) VALUES
('u1', 'Admin User', 'admin@example.com', 'admin123', 'admin', TRUE),
('u2', 'John Tester', 'tester@example.com', 'tester123', 'tester', TRUE),
('u3', 'Dev Alice', 'alice@example.com', 'dev123', 'developer', TRUE),
('u4', 'Dev Bob', 'bob@example.com', 'dev123', 'developer', TRUE),
('u5', 'Dev Charlie', 'charlie@example.com', 'dev123', 'developer', TRUE);