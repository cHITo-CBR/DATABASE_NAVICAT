-- ==============================================================================
-- FlowStock AI - MySQL Schema Migration Script
-- ==============================================================================
-- Instructions: Run this script in your MySQL database to create all the
-- necessary tables and relationships for the FlowStock AI application.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Roles & Users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `roles` (`id`, `name`) VALUES 
(1, 'admin'), 
(2, 'supervisor'), 
(3, 'salesman'), 
(4, 'buyer');

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `is_active` TINYINT(1) DEFAULT 0,
  `rejection_reason` TEXT DEFAULT NULL,
  `approved_by` VARCHAR(36) DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin (Password is 'password123', you should change this later)
-- Hash generated for 'password123'
INSERT IGNORE INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role_id`, `status`, `is_active`) VALUES 
('00000000-0000-0000-0000-000000000000', 'System Admin', 'admin@flowstock.com', '$2b$10$ifcm.dDH.LDVG17.TuNL4uqKc79yxQrPrDrMGM4B2h.scxsPJ0/uu', 1, 'approved', 1);

-- ------------------------------------------------------------------------------
-- 2. Customers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `store_name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `assigned_salesman_id` VARCHAR(36) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`assigned_salesman_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Catalog Configuration
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `units` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `abbreviation` VARCHAR(20) DEFAULT NULL,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `packaging_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `items_per_case` INT DEFAULT 1,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Products & Variants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `category_id` INT DEFAULT NULL,
  `brand_id` INT DEFAULT NULL,
  `packaging_id` INT DEFAULT NULL,
  `total_packaging` VARCHAR(50) DEFAULT NULL,
  `net_weight` VARCHAR(50) DEFAULT NULL,
  `total_cases` INT DEFAULT 0,
  `packaging_price` DECIMAL(10, 2) DEFAULT 0.00,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`packaging_id`) REFERENCES `packaging_types`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(100) UNIQUE DEFAULT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `packaging_id` INT DEFAULT NULL,
  `unit_id` INT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`packaging_id`) REFERENCES `packaging_types`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Inventory Management
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_movement_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `direction` ENUM('in', 'out') NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `inventory_movement_types` (`id`, `name`, `direction`) VALUES 
(1, 'Stock In', 'in'), 
(2, 'Stock Out', 'out'), 
(3, 'Adjustment In', 'in'), 
(4, 'Adjustment Out', 'out');

CREATE TABLE IF NOT EXISTS `inventory_ledger` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(36) NOT NULL,
  `product_variant_id` VARCHAR(36) DEFAULT NULL,
  `movement_type_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `balance` INT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `recorded_by` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`movement_type_id`) REFERENCES `inventory_movement_types`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Sales & Orders
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_transactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) DEFAULT NULL,
  `status` ENUM('pending', 'for_approval', 'approved', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales_transaction_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `transaction_id` VARCHAR(36) NOT NULL,
  `variant_id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`transaction_id`) REFERENCES `sales_transactions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Salesman Field Operations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `store_visits` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `visit_date` DATETIME NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `store_visit_skus` (
  `id` VARCHAR(36) PRIMARY KEY,
  `visit_id` VARCHAR(36) NOT NULL,
  `variant_id` VARCHAR(36) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  FOREIGN KEY (`visit_id`) REFERENCES `store_visits`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `callsheets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `visit_date` DATETIME DEFAULT NULL,
  `status` ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `callsheet_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `callsheet_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `quantity` INT DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  FOREIGN KEY (`callsheet_id`) REFERENCES `callsheets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Buyer Requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `buyer_requests` (
  `id` VARCHAR(36) PRIMARY KEY,
  `salesman_id` VARCHAR(36) DEFAULT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `status` ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `buyer_request_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `request_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  FOREIGN KEY (`request_id`) REFERENCES `buyer_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Quotas & Analytics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `salesman_quotas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `target_amount` DECIMAL(12, 2) DEFAULT NULL,
  `target_units` INT DEFAULT NULL,
  `target_orders` INT DEFAULT NULL,
  `achieved_amount` DECIMAL(12, 2) DEFAULT 0.00,
  `achieved_units` INT DEFAULT 0,
  `achieved_orders` INT DEFAULT 0,
  `status` ENUM('pending', 'ongoing', 'completed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `idx_salesman_period` (`salesman_id`, `month`, `year`),
  FOREIGN KEY (`salesman_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. System Configuration & Notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) DEFAULT NULL,
  `entity_id` VARCHAR(36) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_insights` (
  `id` VARCHAR(36) PRIMARY KEY,
  `insight_type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `severity` VARCHAR(50) DEFAULT 'medium',
  `data` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
