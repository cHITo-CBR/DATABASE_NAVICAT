-- Buyer Home Screen support tables/columns
-- Run in phpMyAdmin if columns or table are missing

ALTER TABLE users ADD COLUMN points_balance INT DEFAULT 0;
ALTER TABLE users ADD COLUMN membership_status VARCHAR(50) DEFAULT 'Silver';

CREATE TABLE IF NOT EXISTS user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('order', 'points', 'system') DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
