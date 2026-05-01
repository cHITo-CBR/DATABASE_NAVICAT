import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env.local") });

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "database_navicat",
    });

    const tables = ['users', 'notifications', 'customers', 'roles'];
    for (const table of tables) {
      console.log(`--- Schema for ${table} ---`);
      try {
        const [rows] = await connection.query(`DESCRIBE ${table}`);
        console.table(rows);
      } catch (e) {
        console.log(`Table ${table} does not exist or error describing it: ${e.message}`);
      }
    }
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
