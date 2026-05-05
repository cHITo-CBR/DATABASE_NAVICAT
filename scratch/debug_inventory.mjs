// debug_inventory.mjs
// Run: node scratch/debug_inventory.mjs
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const env = readFileSync(envPath, "utf-8");
for (const line of env.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "navicat",
  port: Number(process.env.MYSQL_PORT || 3306),
});

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log("\n=== 1. Columns in sales_transaction_items ===");
    const [sti] = await conn.execute("SHOW COLUMNS FROM sales_transaction_items");
    console.table(sti.map(r => ({ Field: r.Field, Type: r.Type })));

    console.log("\n=== 2. Columns in product_variants ===");
    const [pv] = await conn.execute("SHOW COLUMNS FROM product_variants");
    console.table(pv.map(r => ({ Field: r.Field, Type: r.Type })));

    console.log("\n=== 3. Columns in products (checking total_cases) ===");
    const [prod] = await conn.execute("SHOW COLUMNS FROM products");
    console.table(prod.map(r => ({ Field: r.Field, Type: r.Type })));

    console.log("\n=== 4. Sample sales_transaction_items rows (last 5) ===");
    const [items] = await conn.execute(
      "SELECT * FROM sales_transaction_items ORDER BY id DESC LIMIT 5"
    );
    console.table(items);

    console.log("\n=== 5. Recent sales_transactions with their status ===");
    const [txns] = await conn.execute(
      "SELECT id, status, total_amount, created_at FROM sales_transactions ORDER BY created_at DESC LIMIT 10"
    );
    console.table(txns);

    console.log("\n=== 6. Sample product_variants (first 5) ===");
    const [variants] = await conn.execute(
      "SELECT id, product_id, name FROM product_variants LIMIT 5"
    );
    console.table(variants);

    // Check if any completed orders exist
    console.log("\n=== 7. Completed orders ===");
    const [completed] = await conn.execute(
      "SELECT id, status FROM sales_transactions WHERE status = 'completed'"
    );
    if (completed.length === 0) {
      console.log("  No completed orders found. Mark one as completed to test deduction.");
    } else {
      console.table(completed);
      // Check items for the first completed one
      const first = completed[0];
      console.log(`\n=== 8. Items for completed order ${first.id} ===`);
      const [orderItems] = await conn.execute(
        "SELECT * FROM sales_transaction_items WHERE transaction_id = ?",
        [first.id]
      );
      console.table(orderItems);
    }

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
