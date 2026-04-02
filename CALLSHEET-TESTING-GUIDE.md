# 🧪 Callsheet System - Testing Guide

## Pre-Testing Setup

### 1. Database Migration
**Status**: ⏳ Pending

Run this SQL script in phpMyAdmin:
```sql
-- File: update-callsheets-schema.sql
-- This creates/updates the callsheet tables with new schema
```

**Steps:**
1. Open phpMyAdmin
2. Select your database
3. Go to SQL tab
4. Open `update-callsheets-schema.sql`
5. Copy all content
6. Paste in SQL tab
7. Click "Go"
8. Verify "Callsheet schema updated successfully!" message

### 2. Verify Packaging Types
```sql
-- Check if packaging types exist
SELECT * FROM packaging_types WHERE is_active = 1;
```

**Expected Result**: At least 1 packaging type

**If Empty**, run:
```sql
INSERT INTO packaging_types (name, description, items_per_case, is_active, is_archived) VALUES
('24x1', '24 items per case', 24, 1, 0),
('12x1', '12 items per case', 12, 1, 0),
('6x1', '6 items per case', 6, 1, 0),
('48x1', '48 items per case', 48, 1, 0);
```

### 3. Verify Customers/Buyers Exist
```sql
-- Check if customers exist
SELECT id, name, store_name FROM customers WHERE is_active = 1 LIMIT 5;
```

**Expected Result**: At least 1 customer/buyer

### 4. Verify Products Exist
```sql
-- Check if products exist
SELECT id, name FROM products WHERE is_active = 1 LIMIT 5;
```

**Expected Result**: At least 1 product

## Testing Checklist

### ✅ Database Tests

- [ ] **T1.1** - callsheets table exists
  ```sql
  DESCRIBE callsheets;
  ```
  Expected: Should show columns including `remarks`, `round_number`, `period_start`, `period_end`

- [ ] **T1.2** - callsheet_items table exists with new schema
  ```sql
  DESCRIBE callsheet_items;
  ```
  Expected: Should show `packaging_id`, `so`, `fo`, `actual`, NOT `packing`, `suggested_order`, `final_order`

- [ ] **T1.3** - Foreign key to packaging_types exists
  ```sql
  SHOW CREATE TABLE callsheet_items;
  ```
  Expected: Should see `FOREIGN KEY (packaging_id) REFERENCES packaging_types(id)`

- [ ] **T1.4** - View exists
  ```sql
  SELECT * FROM callsheet_report_view LIMIT 1;
  ```
  Expected: No errors

### ✅ Salesman Interface Tests

**Location**: `/salesman/callsheets/new`

- [ ] **T2.1** - Page loads without errors
  - Open browser console (F12)
  - Navigate to page
  - No red errors in console

- [ ] **T2.2** - Store dropdown populates
  - Check if dropdown shows buyer/customer names
  - Should not be empty
  - Can select a store

- [ ] **T2.3** - Product dropdown populates in items
  - Add a row
  - Check product dropdown
  - Should show product names

- [ ] **T2.4** - Packaging dropdown populates
  - Add a row
  - Check packaging dropdown
  - Should show packaging types (24x1, 12x1, etc.)
  - Can select a packaging type

- [ ] **T2.5** - INV (PCS) field is NOT present
  - Check item card
  - Should only see "INV (CASE)"
  - Should NOT see "INV (PCS)"

- [ ] **T2.6** - Order fields use new names
  - Should see "SO" (not "Suggested Order")
  - Should see "FO" (not "Final Order")
  - Should see "Actual"

- [ ] **T2.7** - Visit remarks field exists
  - Large textarea at bottom
  - Can type in it
  - Placeholder text visible

- [ ] **T2.8** - Can create callsheet
  1. Fill in all required fields:
     - Store: Select a buyer
     - Visit Date: Today's date
     - Product: Select a product
     - Packaging: Select packaging type
     - Fill in P3, IG, INV (CASE)
     - Fill in SO, FO, Actual
     - Add visit remarks
  2. Click "Submit"
  3. Should redirect to `/salesman/callsheets`
  4. Should see success (new callsheet in list)

### ✅ Admin Interface Tests

**Location**: `/admin/callsheets`

- [ ] **T3.1** - Page loads without errors
  - Open browser console (F12)
  - Navigate to page
  - No red errors in console

- [ ] **T3.2** - Statistics cards show correct counts
  - Should see Total, Submitted, Approved, Rejected
  - Numbers should match database

- [ ] **T3.3** - Callsheets table displays
  - Shows callsheets in table
  - Has Date, Salesman, Customer, Round, Status, Actions columns

- [ ] **T3.4** - View button opens detail dialog
  - Click "View" on a callsheet
  - Dialog opens
  - No errors

- [ ] **T3.5** - Detail dialog shows product names (not IDs)
  - In dialog, check product column
  - Should show "Product Name" not "uuid..."

- [ ] **T3.6** - Detail dialog shows packaging names
  - In dialog, check packaging column
  - Should show "24x1" not just a number or "-"

- [ ] **T3.7** - Detail dialog shows new field names
  - Should see columns: P3, IG, Inv (CS), SO, FO, Actual
  - Should NOT see: Packing (text), Inv (Pcs), Suggested Order, Final Order

- [ ] **T3.8** - Visit remarks display
  - If callsheet has remarks, should show in dialog
  - Formatted nicely in a box

- [ ] **T3.9** - Can approve callsheet
  1. Find a "submitted" callsheet
  2. Click "Approve"
  3. Status changes to "approved"
  4. No errors

- [ ] **T3.10** - Can reject callsheet
  1. Find a "submitted" callsheet
  2. Click "Reject"
  3. Status changes to "rejected"
  4. No errors

### ✅ Data Integrity Tests

- [ ] **T4.1** - Data saves correctly
  ```sql
  -- After creating a callsheet, check database
  SELECT * FROM callsheets ORDER BY created_at DESC LIMIT 1;
  ```
  Expected: New row with correct data

- [ ] **T4.2** - Items save with packaging_id
  ```sql
  -- Check latest callsheet items
  SELECT ci.*, pt.name as packaging_name
  FROM callsheet_items ci
  LEFT JOIN packaging_types pt ON ci.packaging_id = pt.id
  ORDER BY ci.created_at DESC LIMIT 5;
  ```
  Expected: packaging_id is populated, packaging_name shows

- [ ] **T4.3** - Visit remarks saved
  ```sql
  SELECT id, remarks FROM callsheets WHERE remarks IS NOT NULL LIMIT 5;
  ```
  Expected: Remarks text is saved

- [ ] **T4.4** - No inventory_pcs data
  ```sql
  -- This should fail if column was dropped
  SELECT inventory_pcs FROM callsheet_items LIMIT 1;
  ```
  Expected: Column doesn't exist (error) OR all NULL

### ✅ Edge Cases

- [ ] **T5.1** - Can create callsheet without packaging selection
  - Leave packaging dropdown empty
  - Should still save (NULL is allowed)

- [ ] **T5.2** - Can create callsheet with 0 values
  - Set P3, IG, SO, FO, Actual to 0
  - Should save correctly

- [ ] **T5.3** - Can create callsheet without remarks
  - Leave remarks field empty
  - Should save correctly

- [ ] **T5.4** - Can view old callsheets (if any existed)
  - If you had callsheets before migration
  - They should still display
  - Data should be migrated (suggested_order → so, etc.)

## Common Issues & Solutions

### Issue 1: Packaging dropdown is empty
**Symptom**: No options in packaging dropdown  
**Solution**: Run the packaging types INSERT query (see Pre-Testing Setup #2)

### Issue 2: Store dropdown is empty
**Symptom**: No stores/buyers in dropdown  
**Solution**: Verify customers table has data:
```sql
SELECT COUNT(*) FROM customers WHERE is_active = 1;
```

### Issue 3: "Column 'packing' doesn't exist"
**Symptom**: Error when trying to save  
**Solution**: Make sure you ran the migration completely. The migration creates new columns.

### Issue 4: "Cannot add or update a child row: a foreign key constraint fails"
**Symptom**: Error when saving callsheet item  
**Solution**: 
1. Make sure packaging_id exists in packaging_types table
2. Or set packaging_id to NULL if optional

### Issue 5: Products don't display in admin view
**Symptom**: Shows "Product uuid..." instead of name  
**Solution**: This is expected if the JOIN failed. Check that products table has the product_id.

### Issue 6: Old callsheets show NULL for new fields
**Symptom**: Old callsheets show empty values for SO, FO  
**Solution**: This is expected. The migration copied old data (suggested_order → so) but only for existing records.

## Test Data Template

Use this to create a test callsheet:

```
STORE: [Select any buyer]
VISIT DATE: 2026-04-02
ROUND #: 1
PERIOD START: 2026-04-01
PERIOD END: 2026-04-30

ITEM #1:
  Product: [Select any product]
  Packaging: 24x1
  P3: 1000
  IG: 500
  INV (CASE): 100
  SO: 50
  FO: 45
  Actual: 45

VISIT REMARKS:
Store was well-stocked. Manager mentioned they need more inventory next week. Customer feedback was positive. Competitor pricing was higher by 10%.
```

## Success Criteria

✅ All tests pass  
✅ No console errors  
✅ Data saves to database correctly  
✅ Dropdowns populate from database  
✅ Admin can view detailed callsheets  
✅ Product and packaging names display (not IDs)  
✅ Visit remarks save and display

## Quick Verification

Run this SQL to verify everything:

```sql
-- 1. Check schema
DESCRIBE callsheets;
DESCRIBE callsheet_items;

-- 2. Check data
SELECT * FROM packaging_types WHERE is_active = 1;
SELECT COUNT(*) as customer_count FROM customers WHERE is_active = 1;
SELECT COUNT(*) as product_count FROM products WHERE is_active = 1;

-- 3. Check view
SELECT * FROM callsheet_report_view LIMIT 1;

-- 4. Create test callsheet via UI, then check:
SELECT 
  cs.*,
  COUNT(ci.id) as item_count
FROM callsheets cs
LEFT JOIN callsheet_items ci ON cs.id = ci.callsheet_id
GROUP BY cs.id
ORDER BY cs.created_at DESC
LIMIT 1;
```

---

**When All Tests Pass**: ✅ System is ready for production use!

**If Issues Found**: Check console errors, database logs, and refer to troubleshooting guides.
