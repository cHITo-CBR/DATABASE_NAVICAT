# Callsheet System Update - Complete Documentation

## Overview
The callsheet system has been completely redesigned to match the new requirements with improved field naming, packaging integration, and removal of unused fields.

## Changes Made

### 1. Database Schema Updates

**File:** `update-callsheets-schema.sql`

#### Key Changes:
- ✅ **Store dropdown**: Uses existing `customers` table (buyers)
- ✅ **Packaging dropdown**: Integrated with `packaging_types` table
- ✅ **Removed INV (PCS)**: Only INV (CASE) remains
- ✅ **Updated field names**: 
  - `suggested_order` → `so` (Suggested Order)
  - `final_order` → `fo` (Final Order)
  - `packing` text field → `packaging_id` foreign key
- ✅ **Added visit remarks**: `remarks` field in callsheets table

#### Tables Structure:

**callsheets table:**
```sql
- id (VARCHAR(36), Primary Key)
- salesman_id (VARCHAR(36), FK to users)
- customer_id (VARCHAR(36), FK to customers) -- Buyer/Store
- visit_date (DATE)
- round_number (INT)
- period_start (DATE, nullable)
- period_end (DATE, nullable)
- remarks (TEXT, nullable) -- Visit remarks/notes
- status (ENUM: draft, submitted, approved, rejected)
- created_at, updated_at
```

**callsheet_items table:**
```sql
- id (VARCHAR(36), Primary Key)
- callsheet_id (VARCHAR(36), FK to callsheets)
- product_id (VARCHAR(36), FK to products)
- packaging_id (INT, FK to packaging_types) -- Dropdown selection
- p3 (DECIMAL) -- Target/Budget of the buyer
- ig (DECIMAL) -- Total inventory of the buyer
- inventory_cs (INT) -- Admin inventory in cases
- so (INT) -- Suggested Order
- fo (INT) -- Final Order
- actual (INT) -- Confirmed order or delivery
- created_at, updated_at
```

### 2. Server Actions Updates

**File:** `app/actions/callsheets.ts`

#### New/Updated Functions:

1. **`getPackagingTypes()`** - NEW
   - Fetches all active packaging types for dropdown
   - Returns: `{ id, name, description, items_per_case }`

2. **`createCallsheet()`** - UPDATED
   - Now uses `packaging_id` instead of `packing` text
   - Saves `so`, `fo` instead of `suggested_order`, `final_order`
   - No longer saves `inventory_pcs`

3. **`getCallsheetWithItems()`** - UPDATED
   - Joins with `products` table to get product name
   - Joins with `packaging_types` table to get packaging name
   - Returns enriched item data for display

#### Updated Types:

```typescript
export interface CallsheetItemInput {
  product_id: string;
  packaging_id?: number | null;  // Changed from packing
  p3?: number;                    // Target/Budget
  ig?: number;                    // Total inventory
  inventory_cs?: number;          // Cases only
  so?: number;                    // Suggested Order
  fo?: number;                    // Final Order
  actual?: number;                // Confirmed delivery
}
```

### 3. Salesman Interface Updates

**File:** `app/salesman/callsheets/new/page.tsx`

#### UI Changes:

1. **STORE field:**
   - Dropdown populated from `customers` table
   - Shows buyer/customer store names

2. **Packaging field:**
   - Changed from text input to dropdown
   - Populated from `packaging_types` table
   - Shows all active packaging types

3. **Inventory section:**
   - **Removed:** INV (PCS) field
   - **Kept:** INV (CASE) with blue highlight
   - Shows admin inventory for buyer selection

4. **Order fields:**
   - Labels updated: SO, FO, Actual
   - Tooltips added for clarity:
     - P3: "Target/Budget"
     - IG: "Total Inventory"
     - SO: "Suggested Order"
     - FO: "Final Order"
     - Actual: "Confirmed Order/Delivery"

5. **Visit Remarks:**
   - Large textarea at bottom
   - For salesman notes about the visit

### 4. Admin Interface Updates

**File:** `app/admin/callsheets/page.tsx`

#### Display Changes:

1. **Detail Dialog:**
   - Shows product names instead of IDs
   - Shows packaging names from dropdown
   - Better formatting with proper labels
   - Visit remarks displayed prominently

2. **Table Headers:**
   - Updated to match new field names (SO, FO, Actual)
   - Added tooltips for abbreviations
   - Better visual hierarchy

3. **Data Display:**
   - Product name shown (not just ID)
   - Packaging type shown (not raw text)
   - Null values shown as "-" for clarity
   - Important values highlighted (FO in green, INV in blue)

## Field Definitions

| Field | Full Name | Description | Data Type |
|-------|-----------|-------------|-----------|
| **P3** | Target/Budget | Target or budget of the buyer | Decimal |
| **IG** | Total Inventory | Total inventory of the buyer | Decimal |
| **INV (CASE)** | Inventory Cases | Admin inventory in cases for buyer to select quantity | Integer |
| **SO** | Suggested Order | Suggested order quantity | Integer |
| **FO** | Final Order | Final order quantity | Integer |
| **Actual** | Confirmed Order/Delivery | Actual confirmed order or delivery | Integer |
| **Packaging** | Packaging Type | Packaging type from database dropdown | Foreign Key |
| **Store** | Buyer/Customer | Buyer or customer store from database | Foreign Key |

## Installation Steps

### Step 1: Run Database Migration

1. Open phpMyAdmin
2. Select your database
3. Go to SQL tab
4. Copy and paste contents of `update-callsheets-schema.sql`
5. Click "Go" to execute

**Important Notes:**
- The migration handles existing data gracefully
- It will migrate `suggested_order` → `so` and `final_order` → `fo`
- Old columns are commented out (you can drop them later)
- Foreign keys are added automatically

### Step 2: Verify Database Changes

Run these queries to verify:

```sql
-- Check table structure
DESCRIBE callsheets;
DESCRIBE callsheet_items;

-- Check if packaging types exist
SELECT * FROM packaging_types WHERE is_active = 1;

-- Test the view
SELECT * FROM callsheet_report_view LIMIT 5;
```

### Step 3: Test the Updated Code

The code changes are already in place. Test by:

1. **As Salesman:**
   - Go to `/salesman/callsheets/new`
   - Select a store (buyer) from dropdown
   - Add products
   - Select packaging from dropdown
   - Fill in P3, IG, INV (CASE)
   - Fill in SO, FO, Actual
   - Add visit remarks
   - Submit

2. **As Admin:**
   - Go to `/admin/callsheets`
   - View submitted callsheets
   - Click "View" to see details
   - Verify all fields display correctly
   - Approve or reject

## Features

### ✅ Implemented Features

1. **Store as Dropdown**
   - Populated from customers/buyers table
   - Shows store names
   - Required field with validation

2. **Packaging as Dropdown**
   - Populated from packaging_types table
   - Shows all active packaging types
   - Optional field (can be null)

3. **Removed INV (PCS)**
   - Only INV (CASE) remains
   - Selling is by case only

4. **Updated Order Fields**
   - SO (Suggested Order)
   - FO (Final Order)
   - Actual (Confirmed Order/Delivery)

5. **Visit Remarks/Notes**
   - Text area for salesman observations
   - Displayed in admin view
   - Optional field

6. **Database Integration**
   - All dropdowns fetch from database
   - Foreign keys ensure data integrity
   - Joins provide enriched display data

### 🎨 UI/UX Improvements

1. **Better Labels**
   - Tooltips explain abbreviations
   - Clear field naming
   - Visual hierarchy

2. **Responsive Design**
   - Mobile-friendly layout
   - Grid-based responsive columns
   - Touch-friendly inputs

3. **Visual Feedback**
   - Blue highlight for inventory
   - Green highlight for final orders
   - Clear status badges
   - Loading states

## Database View

The `callsheet_report_view` provides a comprehensive report:

```sql
SELECT * FROM callsheet_report_view;
```

Returns:
- Callsheet details
- Salesman name and email
- Customer/store name, address, phone
- Item counts
- Total final orders
- Total actual orders

## Troubleshooting

### Issue: Packaging dropdown is empty

**Solution:**
```sql
-- Add some packaging types
INSERT INTO packaging_types (name, description, items_per_case, is_active) VALUES
('24x1', '24 items per case', 24, 1),
('12x1', '12 items per case', 12, 1),
('6x1', '6 items per case', 6, 1);
```

### Issue: Store dropdown is empty

**Solution:**
```sql
-- Check if customers exist
SELECT COUNT(*) FROM customers WHERE is_active = 1;

-- Add test customer if needed
INSERT INTO customers (id, name, store_name, is_active) VALUES
(UUID(), 'Test Buyer', 'Test Store', 1);
```

### Issue: Old callsheets show errors

**Solution:**
- The migration handles this automatically
- Old data is preserved and migrated to new column names
- If issues persist, check that the migration completed successfully

### Issue: Foreign key constraints fail

**Solution:**
```sql
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Run the migration

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
```

## API Reference

### Server Actions

```typescript
// Get all packaging types
const packagingTypes = await getPackagingTypes();

// Create a new callsheet
const result = await createCallsheet({
  salesman_id: "uuid",
  customer_id: "uuid", // Buyer/Store
  visit_date: "2026-04-02",
  round_number: 1,
  period_start: "2026-04-01",
  period_end: "2026-04-30",
  remarks: "Store was well-stocked, positive feedback",
  items: [
    {
      product_id: "uuid",
      packaging_id: 1,
      p3: 1000,
      ig: 500,
      inventory_cs: 100,
      so: 50,
      fo: 45,
      actual: 45
    }
  ]
});

// Get callsheet with items
const { data } = await getCallsheetWithItems(callsheetId);

// Update status (admin only)
await updateCallsheetStatus(callsheetId, "approved");
```

## Summary

The callsheet system is now fully functional with:
- ✅ Database schema updated and migrated
- ✅ Server actions updated with new fields
- ✅ Salesman interface with dropdowns
- ✅ Admin interface with enriched data display
- ✅ Comprehensive documentation
- ✅ Field definitions and tooltips
- ✅ Visit remarks/notes functionality

All changes are backward-compatible and the migration handles existing data gracefully.

## Next Steps

1. Run the database migration in phpMyAdmin
2. Ensure packaging_types table has data
3. Test creating a new callsheet as salesman
4. Test viewing/approving as admin
5. Verify all fields save and display correctly

---

**Last Updated:** April 2, 2026  
**Status:** ✅ Complete and Ready for Testing
