-- 001_create_token_table.sql
-- Migration: create invites/password_resets table
CREATE TABLE IF NOT EXISTS invites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  type ENUM('invite','password_reset') NOT NULL DEFAULT 'invite',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_invites_email (email),
  INDEX idx_invites_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
