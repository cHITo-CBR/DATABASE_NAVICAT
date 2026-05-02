-- Add Salesman Quota System to Database
-- Run this in phpMyAdmin to add quota functionality

-- =====================================================
-- Create salesman_quotas table
-- =====================================================
CREATE TABLE IF NOT EXISTS `salesman_quotas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salesman_id` VARCHAR(36) NOT NULL,
  `month` TINYINT NOT NULL,        -- 1 to 12
  `year` YEAR NOT NULL,            -- e.g. 2026
  
  `target_amount` DECIMAL(12,2),   -- total sales target (₱)
  `target_units` INT,              -- optional: number of items to sell
  `target_orders` INT,             -- optional: number of transactions
  
  `achieved_amount` DECIMAL(12,2) DEFAULT 0,
  `achieved_units` INT DEFAULT 0,
  `achieved_orders` INT DEFAULT 0,
  
  `status` ENUM('pending','ongoing','completed') DEFAULT 'pending',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure one quota per salesman per month/year
  UNIQUE KEY `unique_quota` (`salesman_id`, `month`, `year`),
  
  -- Foreign key to users table (assuming salesman_id references users.id)
  INDEX `idx_salesman_date` (`salesman_id`, `year`, `month`),
  INDEX `idx_year_month` (`year`, `month`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Create quota_achievements table (for detailed tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS `quota_achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quota_id` INT NOT NULL,
  `achievement_date` DATE NOT NULL,
  `amount` DECIMAL(12,2) DEFAULT 0,
  `units` INT DEFAULT 0,
  `orders` INT DEFAULT 0,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`quota_id`) REFERENCES `salesman_quotas`(`id`) ON DELETE CASCADE,
  INDEX `idx_quota_date` (`quota_id`, `achievement_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- Add sample quota data (optional - for testing)
-- =====================================================
-- Replace 'USER_ID_HERE' with actual user IDs from your users table
-- INSERT INTO `salesman_quotas` (`salesman_id`, `month`, `year`, `target_amount`, `target_units`, `target_orders`, `status`) VALUES 
-- ('USER_ID_HERE', 4, 2026, 50000.00, 100, 25, 'ongoing'),
-- ('USER_ID_HERE', 5, 2026, 60000.00, 120, 30, 'pending');

-- =====================================================
-- Check if quota tables were created successfully
-- =====================================================
DESCRIBE salesman_quotas;
DESCRIBE quota_achievements;

-- =====================================================
-- Create view for quota reporting (FIXED - Removed ORDER BY)
-- =====================================================
CREATE OR REPLACE VIEW `quota_report_view` AS
SELECT 
  sq.*,
  u.full_name as salesman_name,
  u.email as salesman_email,
  ROUND((sq.achieved_amount / NULLIF(sq.target_amount, 0)) * 100, 2) as amount_percentage,
  ROUND((sq.achieved_units / NULLIF(sq.target_units, 0)) * 100, 2) as units_percentage,
  ROUND((sq.achieved_orders / NULLIF(sq.target_orders, 0)) * 100, 2) as orders_percentage,
  MONTHNAME(STR_TO_DATE(sq.month, '%m')) as month_name
FROM salesman_quotas sq
LEFT JOIN users u ON sq.salesman_id = u.id;

-- =====================================================
-- Example usage - Query the view with sorting
-- =====================================================
-- SELECT * FROM quota_report_view 
-- ORDER BY year DESC, month DESC, salesman_name;

-- =====================================================
-- Test the view works correctly
-- =====================================================
SELECT 'quota_report_view' as view_name, COUNT(*) as record_count 
FROM quota_report_view;
