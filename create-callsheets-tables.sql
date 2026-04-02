-- Callsheets Database Schema
-- Run this in phpMyAdmin to create callsheet tables

-- =====================================================
-- 1. Create callsheets table
-- =====================================================
CREATE TABLE IF NOT EXISTS `callsheets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `visit_date` DATE NOT NULL,
  `visit_time` TIME,
  `purpose` ENUM('sales_call', 'delivery', 'collection', 'support', 'follow_up', 'other') DEFAULT 'sales_call',
  `status` ENUM('draft', 'scheduled', 'completed', 'cancelled') DEFAULT 'draft',
  `notes` TEXT,
  `location` VARCHAR(255),
  `products_discussed` JSON,
  `outcome` TEXT,
  `next_action` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_salesman` (`salesman_id`),
  INDEX `idx_customer` (`customer_id`),
  INDEX `idx_visit_date` (`visit_date`),
  INDEX `idx_status` (`status`),
  
  CONSTRAINT `fk_callsheet_salesman` FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_callsheet_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 2. Create callsheet_items table (products in callsheet)
-- =====================================================
CREATE TABLE IF NOT EXISTS `callsheet_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `callsheet_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `quantity_discussed` INT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_callsheet` (`callsheet_id`),
  INDEX `idx_product` (`product_id`),
  
  CONSTRAINT `fk_callsheet_item_callsheet` FOREIGN KEY (`callsheet_id`) REFERENCES `callsheets`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_callsheet_item_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 3. Create view for admin callsheet reporting
-- =====================================================
DROP VIEW IF EXISTS `callsheet_report_view`;
CREATE VIEW `callsheet_report_view` AS
SELECT 
  c.id,
  c.visit_date,
  c.visit_time,
  c.purpose,
  c.status,
  c.notes,
  c.location,
  c.outcome,
  c.next_action,
  c.created_at,
  c.updated_at,
  u.full_name as salesman_name,
  u.email as salesman_email,
  cust.name as customer_name,
  cust.store_name,
  cust.address as customer_address,
  cust.phone as customer_phone,
  (SELECT COUNT(*) FROM callsheet_items WHERE callsheet_id = c.id) as products_count
FROM callsheets c
LEFT JOIN users u ON c.salesman_id = u.id
LEFT JOIN customers cust ON c.customer_id = cust.id
ORDER BY c.visit_date DESC, c.created_at DESC;

-- =====================================================
-- 4. Test the tables
-- =====================================================
SELECT 'Callsheet tables created successfully' as result;
SELECT COUNT(*) as callsheet_count FROM callsheets;
SELECT COUNT(*) as callsheet_items_count FROM callsheet_items;
SELECT COUNT(*) as view_count FROM callsheet_report_view;
