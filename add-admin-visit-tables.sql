-- Admin visits tables (appointments + store_visit_skus)
-- Run this in phpMyAdmin before using Admin > Visits

-- =====================================================
-- Create appointments table
-- =====================================================
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `customer_id` VARCHAR(36) NOT NULL,
  `salesman_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `appointment_type` VARCHAR(100) DEFAULT 'store_visit',
  `scheduled_at` DATETIME NOT NULL,
  `notes` TEXT,
  `status` ENUM('pending','completed','cancelled') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_salesman` (`salesman_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_scheduled_at` (`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Create store_visits table
-- =====================================================
CREATE TABLE IF NOT EXISTS `store_visits` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `visit_date` DATETIME NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_salesman` (`salesman_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_visit_date` (`visit_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Create store_visit_skus table
-- =====================================================
CREATE TABLE IF NOT EXISTS `store_visit_skus` (
  `id` VARCHAR(36) PRIMARY KEY,
  `visit_id` VARCHAR(36) NOT NULL,
  `variant_id` VARCHAR(36) NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_visit` (`visit_id`),
  INDEX `idx_variant` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Optional: add location columns to store_visits
-- =====================================================
-- Run only if latitude/longitude columns are missing
ALTER TABLE store_visits ADD COLUMN latitude DECIMAL(10,8) NULL;
ALTER TABLE store_visits ADD COLUMN longitude DECIMAL(11,8) NULL;
