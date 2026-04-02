-- DEBUG: Check if inventory tables exist
-- Copy this into phpMyAdmin SQL tab and run it

-- 1. Check what tables exist in your database
SHOW TABLES;

-- 2. Specifically check for inventory tables
SHOW TABLES LIKE 'inventory_%';

-- 3. Check if inventory_ledger exists and has correct structure
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'inventory_ledger' 
AND TABLE_SCHEMA = DATABASE();

-- 4. Check if inventory_movement_types exists  
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'inventory_movement_types' 
AND TABLE_SCHEMA = DATABASE();

-- 5. If tables exist, check if they have data
-- (This will error if tables don't exist - that's expected)
SELECT 'inventory_movement_types' as table_name, COUNT(*) as rows FROM inventory_movement_types
UNION ALL  
SELECT 'inventory_ledger' as table_name, COUNT(*) as rows FROM inventory_ledger;