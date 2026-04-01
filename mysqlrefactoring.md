# MySQL Refactoring Roadmap: FlowStock Inventory System

This document provides a comprehensive roadmap for migrating the FlowStock application from **Supabase** to a local **MySQL** database managed via **Navicat Premium Lite**.

---

## 🏗 Phase 1: Environment & Tooling
1.  **Install MySQL Server**: Ensure you have MySQL 8.0+ installed locally.
2.  **Navicat Setup**:
    *   Create a new connection in Navicat Premium Lite.
    *   Create a database named `inventory_db`.
3.  **Dependencies**:
    *   Run `npm install mysql2 bcryptjs jose` (for raw SQL, password hashing, and JWT).
    *   Remove Supabase: `npm uninstall @supabase/supabase-js`.
4.  **Environment Variables**:
    *   Update `.env.local`:
        ```env
        DATABASE_URL=mysql://user:password@localhost:3306/inventory_db
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_password
        DB_NAME=inventory_db
        JWT_SECRET=your_super_secret_key
        ```

---

## 🗄 Phase 2: Schema Migration
Translate the PostgreSQL schema from Supabase to MySQL format. Key differences include:
*   Replace `UUID` with `VARCHAR(36)` or `INT AUTO_INCREMENT`.
*   Replace `TIMESTAMPTZ` with `TIMESTAMP`.
*   Convert array types (if any) to separate relational tables or JSON columns.

### SQL Core Migration (Example: Products)
```sql
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    brand_id INT,
    total_packaging VARCHAR(100),
    net_weight VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔌 Phase 3: Database Connection Layer
Create `lib/db.ts` to manage the MySQL connection pool.

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

---

## 🔄 Phase 4: Server Action Refactoring
Replace all Supabase syntax with SQL queries.

**Before (Supabase):**
```typescript
const { data, error } = await supabase.from('products').select('*');
```

**After (MySQL):**
```typescript
import pool from '@/lib/db';

const [rows] = await pool.execute('SELECT * FROM products WHERE is_archived = FALSE');
```

---

## 🔐 Phase 5: Authentication Transition
Since Supabase Auth is removed, we must implement custom Auth:
1.  **Users Table**: Store `email` and `password_hash`.
2.  **Login Action**: Use `bcryptjs.compare` to verify passwords.
3.  **Session Management**: Use `jose` to sign HS256 JWTs and store them in HTTP-only cookies via `next/headers`.
4.  **Middleware**: Update `middleware.ts` to verify the local JWT instead of Supabase session.

---

## 🚀 Phase 6: Testing & Cleanup
1.  **Test CRUD**: Run the application and verify that adding/editing products works in Navicat.
2.  **Data Porting**: Use Navicat's "Data Transfer" feature if you need to move existing data from Supabase to local MySQL.
3.  **Delete Legacy Files**: Remove `lib/supabase.ts` and any `supabase` folders.

---

## ⚠️ Known Challenges
*   **Case Sensitivity**: Table names are often case-sensitive in Linux but case-insensitive in Windows MySQL. Use `snake_case` consistently.
*   **Booleans**: MySQL stores booleans as `TINYINT(1)` (0 or 1). Ensure frontend logic handles this conversion if necessary.
*   **ID Generation**: If using UUIDs, you must generate them in the Server Action (using `crypto.randomUUID()`) before inserting into MySQL.
