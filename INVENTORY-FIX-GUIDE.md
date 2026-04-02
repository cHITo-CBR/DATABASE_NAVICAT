# Fix for "Unknown column 'product_id' in where clause" Error

## Problem
The inventory system is trying to use tables (`inventory_ledger` and `inventory_movement_types`) that don't exist in your database yet.

## Solution - Run Database Migration

### Option 1: Run the complete migration (Recommended)
1. Open **phpMyAdmin**
2. Select your database
3. Go to **SQL** tab
4. Copy and paste the entire content of `migration-fix-catalog.sql`
5. Click **Go** to execute

### Option 2: Run just the inventory tables fix
1. Open **phpMyAdmin**
2. Select your database  
3. Go to **SQL** tab
4. Copy and paste the content of `fix-inventory-tables.sql`
5. Click **Go** to execute

## What These Scripts Do

### Creates Missing Tables:
- ✅ `inventory_movement_types` - Stores movement types (Stock In, Stock Out, etc.)
- ✅ `inventory_ledger` - Stores inventory movement history with balances

### Adds Required Data:
- ✅ Sample movement types for the dropdown
- ✅ Proper indexes for performance

## After Running Migration

1. **Refresh your browser** (the inventory page)
2. **Try the stock adjustment again**
3. **Check the dropdowns** - they should now populate with:
   - Product Variant dropdown: Lists your products
   - Movement Type dropdown: Stock In, Stock Out, Adjustment In, Adjustment Out

## Verification Steps

Run these queries in phpMyAdmin to confirm tables exist:

```sql
-- Check if tables were created
SHOW TABLES LIKE 'inventory%';

-- Check movement types data
SELECT * FROM inventory_movement_types;

-- Check table structure
DESCRIBE inventory_ledger;
```

## Expected Results

✅ **Inventory page loads without errors**  
✅ **Product dropdown shows your products**  
✅ **Movement type dropdown shows options**  
✅ **Stock adjustments save successfully**  
✅ **Inventory history shows in ledger**

## If Still Having Issues

1. Check if migration ran successfully:
   ```sql
   SELECT COUNT(*) FROM inventory_movement_types;
   ```
   Should return 6 rows

2. Check browser console for detailed error logs I added

3. Verify your products table has data:
   ```sql
   SELECT id, name FROM products LIMIT 5;
   ```

The enhanced error handling will now give you clearer messages about what's wrong!