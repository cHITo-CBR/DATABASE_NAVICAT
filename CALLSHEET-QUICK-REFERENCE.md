# Callsheet Quick Reference

## 🚀 Quick Start

### Step 1: Run Database Migration
```sql
-- In phpMyAdmin, run this file:
update-callsheets-schema.sql
```

### Step 2: Add Packaging Types (if not exists)
```sql
INSERT INTO packaging_types (name, description, items_per_case, is_active) VALUES
('24x1', '24 items per case', 24, 1),
('12x1', '12 items per case', 12, 1),
('6x1', '6 items per case', 6, 1),
('48x1', '48 items per case', 48, 1);
```

### Step 3: Test
- Salesman: `/salesman/callsheets/new`
- Admin: `/admin/callsheets`

## 📋 Field Reference

| Display | DB Column | Type | Description |
|---------|-----------|------|-------------|
| **Store** | `customer_id` | Dropdown | Buyer/Customer (from customers table) |
| **Visit Date** | `visit_date` | Date | Date of store visit |
| **Round #** | `round_number` | Number | Visit round number |
| **Period Start** | `period_start` | Date | Reporting period start |
| **Period End** | `period_end` | Date | Reporting period end |
| **Product** | `product_id` | Dropdown | Product selection |
| **Packaging** | `packaging_id` | Dropdown | From packaging_types table |
| **P3** | `p3` | Number | Target/Budget of buyer |
| **IG** | `ig` | Number | Total inventory of buyer |
| **INV (CASE)** | `inventory_cs` | Number | Admin inventory (cases only) |
| **SO** | `so` | Number | Suggested Order |
| **FO** | `fo` | Number | Final Order |
| **Actual** | `actual` | Number | Confirmed Order/Delivery |
| **Visit Remarks** | `remarks` | Text | Salesman notes |

## 🔄 Changed Fields

### Removed
- ❌ `packing` (text field) → Replaced with `packaging_id` dropdown
- ❌ `inventory_pcs` → Only cases now
- ❌ `suggested_order` → Renamed to `so`
- ❌ `final_order` → Renamed to `fo`

### Added
- ✅ `packaging_id` - Foreign key to packaging_types
- ✅ `so` - Suggested Order (shortened)
- ✅ `fo` - Final Order (shortened)
- ✅ `remarks` - Visit remarks/notes

## 🎯 Key Features

### Salesman View (`/salesman/callsheets/new`)
1. Select store from dropdown (buyers/customers)
2. Enter visit date and round number
3. Add products with:
   - Product dropdown
   - Packaging dropdown (from database)
   - P3, IG values
   - INV (CASE) - admin inventory
   - SO, FO, Actual orders
4. Add visit remarks/notes
5. Save as draft or submit for approval

### Admin View (`/admin/callsheets`)
1. View all callsheets with stats
2. Filter by status (draft, submitted, approved, rejected)
3. View detailed callsheet with:
   - Product names (not IDs)
   - Packaging types (not raw text)
   - All order details
   - Visit remarks
4. Approve or reject submitted callsheets

## 📊 Database Tables

### callsheets
```sql
CREATE TABLE callsheets (
  id VARCHAR(36) PRIMARY KEY,
  salesman_id VARCHAR(36),
  customer_id VARCHAR(36),  -- Buyer/Store
  visit_date DATE,
  round_number INT,
  period_start DATE,
  period_end DATE,
  remarks TEXT,             -- Visit notes
  status ENUM('draft','submitted','approved','rejected'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### callsheet_items
```sql
CREATE TABLE callsheet_items (
  id VARCHAR(36) PRIMARY KEY,
  callsheet_id VARCHAR(36),
  product_id VARCHAR(36),
  packaging_id INT,         -- FK to packaging_types
  p3 DECIMAL(10,2),        -- Target/Budget
  ig DECIMAL(10,2),        -- Total inventory
  inventory_cs INT,        -- Cases only
  so INT,                  -- Suggested Order
  fo INT,                  -- Final Order
  actual INT,              -- Confirmed delivery
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔍 Useful Queries

### View all callsheets with details
```sql
SELECT * FROM callsheet_report_view;
```

### Get callsheets by salesman
```sql
SELECT cs.*, c.store_name 
FROM callsheets cs
LEFT JOIN customers c ON cs.customer_id = c.id
WHERE cs.salesman_id = 'YOUR_SALESMAN_ID'
ORDER BY cs.visit_date DESC;
```

### Get pending callsheets
```sql
SELECT * FROM callsheet_report_view 
WHERE status = 'submitted'
ORDER BY visit_date ASC;
```

### Get total orders by product
```sql
SELECT 
  p.name as product_name,
  SUM(ci.so) as total_suggested,
  SUM(ci.fo) as total_final,
  SUM(ci.actual) as total_actual
FROM callsheet_items ci
JOIN products p ON ci.product_id = p.id
GROUP BY p.id, p.name
ORDER BY total_actual DESC;
```

## 🛠️ Troubleshooting

### Empty dropdown (Packaging)
```sql
-- Check if packaging types exist
SELECT * FROM packaging_types WHERE is_active = 1;

-- Add if empty
INSERT INTO packaging_types (name, items_per_case, is_active) 
VALUES ('24x1', 24, 1);
```

### Empty dropdown (Store)
```sql
-- Check customers
SELECT id, name, store_name FROM customers WHERE is_active = 1;
```

### Migration errors
```sql
-- Disable FK checks, run migration, re-enable
SET FOREIGN_KEY_CHECKS = 0;
-- Run update-callsheets-schema.sql
SET FOREIGN_KEY_CHECKS = 1;
```

## 📝 Notes

- **P3** = Target/Budget of the buyer
- **IG** = Total inventory of the buyer  
- **INV (CASE)** = Admin inventory that buyer selects from
- **SO** = Suggested Order
- **FO** = Final Order
- **Actual** = Confirmed order or delivery

All selling is by **case only**, no pieces (PCS).

## ✅ Checklist

- [ ] Run `update-callsheets-schema.sql` in phpMyAdmin
- [ ] Verify packaging_types table has data
- [ ] Verify customers table has data
- [ ] Test creating callsheet as salesman
- [ ] Test viewing callsheet as admin
- [ ] Test approve/reject functionality
- [ ] Verify all dropdowns populate correctly
- [ ] Verify visit remarks save and display

---

**Files Modified:**
- `update-callsheets-schema.sql` (NEW)
- `app/actions/callsheets.ts` (UPDATED)
- `app/salesman/callsheets/new/page.tsx` (UPDATED)
- `app/admin/callsheets/page.tsx` (UPDATED)
- `CALLSHEET-SYSTEM-UPDATE.md` (NEW)
- `CALLSHEET-QUICK-REFERENCE.md` (NEW)
