import pool from "./lib/db.ts";

async function showTables() {
  try {
    const [rows] = await pool.execute("SHOW TABLES");
    console.log("Tables in database:", rows);
    for (const row of rows as any[]) {
      const tableName = Object.values(row)[0] as string;
      const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
      console.log(`\nTable: ${tableName}`);
      console.table(columns);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

showTables();
