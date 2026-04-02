-- STEP-BY-STEP DEBUG SCRIPT
-- Run each section ONE AT A TIME in phpMyAdmin

-- ============================================
-- SECTION 1: Check if tables exist at all
-- ============================================
SHOW TABLES;

-- ============================================  
-- SECTION 2: Look specifically for inventory tables
-- ============================================
SHOW TABLES LIKE 'inventory%';

-- ============================================
-- SECTION 3: Check products table (should exist)
-- ============================================  
DESCRIBE products;

-- ============================================
-- SECTION 4: Try to check inventory_ledger structure
-- ============================================
DESCRIBE inventory_ledger;

-- ============================================
-- SECTION 5: Try to check inventory_movement_types structure  
-- ============================================
DESCRIBE inventory_movement_types;

-- ============================================
-- SECTION 6: Check movement types data
-- ============================================
SELECT * FROM inventory_movement_types LIMIT 10;

-- ============================================
-- STOP HERE AND TELL ME THE RESULTS
-- ============================================
-- Copy the results of each section and let me know:
-- 1. What tables show up in SHOW TABLES?
-- 2. Do you see inventory_ledger and inventory_movement_types?
-- 3. What errors (if any) do you get from DESCRIBE commands?