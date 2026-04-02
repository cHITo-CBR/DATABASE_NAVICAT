-- Fix Missing inventory_ledger and inventory_movement_types Tables
-- Run this in phpMyAdmin if you're getting "Unknown column 'product_id'" errors

-- Check if tables exist first
SHOW TABLES LIKE 'inventory_ledger';
SHOW TABLES LIKE 'inventory_movement_types';

-- =====================================================
-- Create inventory_movement_types table (REQUIRED FIRST)
-- =====================================================
CREATE TABLE IF NOT EXISTS `inventory_movement_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `direction` ENUM('in', 'out') NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Create inventory_ledger table (REQUIRES movement_types to exist)
-- =====================================================
CREATE TABLE IF NOT EXISTS `inventory_ledger` (
  `id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36),
  `movement_type_id` INT,
  `quantity` INT NOT NULL,
  `balance` INT NOT NULL DEFAULT 0,
  `notes` TEXT,
  `recorded_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_created` (`product_id`, `created_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Insert sample movement types (REQUIRED for dropdown to work)
-- =====================================================
INSERT IGNORE INTO `inventory_movement_types` (`name`, `direction`, `description`) VALUES 
('Stock In', 'in', 'Inventory received/added'),
('Stock Out', 'out', 'Inventory sold/removed'),
('Adjustment In', 'in', 'Positive stock adjustment'),
('Adjustment Out', 'out', 'Negative stock adjustment'),
('Return', 'in', 'Returned inventory'),
('Damage', 'out', 'Damaged inventory removal');

-- =====================================================
-- Test queries to verify everything works
-- =====================================================
-- Check if tables were created
SELECT 'inventory_movement_types' as table_name, COUNT(*) as row_count FROM inventory_movement_types
UNION ALL
SELECT 'inventory_ledger' as table_name, COUNT(*) as row_count FROM inventory_ledger;

-- Show table structure to verify columns
DESCRIBE inventory_ledger;
DESCRIBE inventory_movement_types;