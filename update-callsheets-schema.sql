-- =====================================================
-- Updated Callsheets Schema
-- This updates the callsheets tables to match the new requirements
-- =====================================================

-- Drop existing tables if you want a clean start (CAREFUL: This deletes data!)
-- DROP TABLE IF EXISTS `callsheet_items`;
-- DROP TABLE IF EXISTS `callsheets`;

-- =====================================================
-- 1. Create/Update callsheets table
-- =====================================================
CREATE TABLE IF NOT EXISTS `callsheets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL COMMENT 'Buyer/Store ID',
  `visit_date` DATE NOT NULL,
  `round_number` INT DEFAULT 1,
  `period_start` DATE NULL,
  `period_end` DATE NULL,
  `remarks` TEXT NULL COMMENT 'Visit remarks/notes',
  `status` ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_salesman` (`salesman_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_visit_date` (`visit_date`),
  INDEX `idx_status` (`status`),
  
  CONSTRAINT `fk_callsheet_salesman` FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_callsheet_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Callsheet headers - stores buyer visit information';

-- =====================================================
-- 2. Create/Update callsheet_items table
-- =====================================================
CREATE TABLE IF NOT EXISTS `callsheet_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `callsheet_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `packaging_id` INT NULL COMMENT 'Packaging type from packaging_types table',
  `p3` DECIMAL(10,2) DEFAULT 0 COMMENT 'Target/Budget of the buyer',
  `ig` DECIMAL(10,2) DEFAULT 0 COMMENT 'Total inventory of the buyer',
  `inventory_cs` INT DEFAULT 0 COMMENT 'Admin inventory in cases (buyer will select quantity)',
  `so` INT DEFAULT 0 COMMENT 'Suggested Order',
  `fo` INT DEFAULT 0 COMMENT 'Final Order',
  `actual` INT DEFAULT 0 COMMENT 'Confirmed order or delivery',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_callsheet` (`callsheet_id`),
  INDEX `idx_product` (`product_id`),
  INDEX `idx_packaging` (`packaging_id`),
  
  CONSTRAINT `fk_callsheet_item_callsheet` FOREIGN KEY (`callsheet_id`) REFERENCES `callsheets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_callsheet_item_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_callsheet_item_packaging` FOREIGN KEY (`packaging_id`) REFERENCES `packaging_types`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Callsheet line items - product inventory and orders';

-- =====================================================
-- 3. If tables already exist, add/modify columns
-- =====================================================

-- For callsheets table
ALTER TABLE `callsheets` 
  MODIFY COLUMN IF EXISTS `remarks` TEXT NULL COMMENT 'Visit remarks/notes',
  ADD COLUMN IF NOT EXISTS `round_number` INT DEFAULT 1 AFTER `visit_date`,
  ADD COLUMN IF NOT EXISTS `period_start` DATE NULL AFTER `round_number`,
  ADD COLUMN IF NOT EXISTS `period_end` DATE NULL AFTER `period_start`;

-- For callsheet_items table - rename/add columns
-- Note: MySQL doesn't support IF EXISTS for ALTER COLUMN, so we handle it carefully
-- Add new columns if they don't exist
SET @dbname = DATABASE();
SET @tablename = 'callsheet_items';

-- Add packaging_id if doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'packaging_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE callsheet_items ADD COLUMN packaging_id INT NULL COMMENT "Packaging type from packaging_types table"', 
  'SELECT "Column packaging_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add so column (Suggested Order) if doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'so');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE callsheet_items ADD COLUMN so INT DEFAULT 0 COMMENT "Suggested Order"', 
  'SELECT "Column so already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add fo column (Final Order) if doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'fo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE callsheet_items ADD COLUMN fo INT DEFAULT 0 COMMENT "Final Order"', 
  'SELECT "Column fo already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate data from old columns to new columns if they exist
-- suggested_order -> so
SET @col_old = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'suggested_order');
SET @sql = IF(@col_old > 0, 
  'UPDATE callsheet_items SET so = COALESCE(suggested_order, 0) WHERE so = 0', 
  'SELECT "No migration needed for suggested_order"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- final_order -> fo
SET @col_old = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'final_order');
SET @sql = IF(@col_old > 0, 
  'UPDATE callsheet_items SET fo = COALESCE(final_order, 0) WHERE fo = 0', 
  'SELECT "No migration needed for final_order"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old columns that are no longer needed (optional - uncomment if you want to remove them)
-- ALTER TABLE callsheet_items DROP COLUMN IF EXISTS `packing`;
-- ALTER TABLE callsheet_items DROP COLUMN IF EXISTS `inventory_pcs`;
-- ALTER TABLE callsheet_items DROP COLUMN IF EXISTS `suggested_order`;
-- ALTER TABLE callsheet_items DROP COLUMN IF EXISTS `final_order`;

-- Add foreign key for packaging_id if not exists
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND CONSTRAINT_NAME = 'fk_callsheet_item_packaging');
SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE callsheet_items ADD CONSTRAINT fk_callsheet_item_packaging FOREIGN KEY (packaging_id) REFERENCES packaging_types(id) ON DELETE SET NULL', 
  'SELECT "Foreign key fk_callsheet_item_packaging already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. Create view for admin callsheet reporting
-- =====================================================
DROP VIEW IF EXISTS `callsheet_report_view`;
CREATE VIEW `callsheet_report_view` AS
SELECT 
  cs.id,
  cs.visit_date,
  cs.round_number,
  cs.period_start,
  cs.period_end,
  cs.status,
  cs.remarks,
  cs.created_at,
  cs.updated_at,
  u.full_name as salesman_name,
  u.email as salesman_email,
  c.name as customer_name,
  c.store_name,
  c.address as customer_address,
  c.phone as customer_phone,
  (SELECT COUNT(*) FROM callsheet_items WHERE callsheet_id = cs.id) as items_count,
  (SELECT SUM(fo) FROM callsheet_items WHERE callsheet_id = cs.id) as total_final_orders,
  (SELECT SUM(actual) FROM callsheet_items WHERE callsheet_id = cs.id) as total_actual_orders
FROM callsheets cs
LEFT JOIN users u ON cs.salesman_id = u.id
LEFT JOIN customers c ON cs.customer_id = c.id
ORDER BY cs.visit_date DESC, cs.created_at DESC;

-- =====================================================
-- 5. Test the schema
-- =====================================================
SELECT 'Callsheet schema updated successfully!' as result;
SHOW TABLES LIKE 'callsheet%';
DESCRIBE callsheets;
DESCRIBE callsheet_items;
SELECT * FROM callsheet_report_view LIMIT 5;
