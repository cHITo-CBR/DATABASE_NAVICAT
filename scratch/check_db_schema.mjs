import pool from "./lib/db.js";

async function checkSchema() {
  try {
    const tables = ['users', 'notifications', 'customers', 'roles'];
    for (const table of tables) {
      console.log(`--- Schema for ${table} ---`);
      const [rows] = await pool.query(`DESCRIBE ${table}`);
      console.table(rows);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
