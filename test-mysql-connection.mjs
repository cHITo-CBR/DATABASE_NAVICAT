import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.join(__dirname, ".env.local") });

async function testConnection() {
  console.log("Attempting to connect to MySQL with the following settings:");
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Password: ${process.env.DB_PASSWORD ? "(set)" : "(empty)"}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "navicat",
      port: parseInt(process.env.DB_PORT || "3306"),
    });

    console.log("✅ Successfully connected to MySQL!");
    
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables found:", tables.map(t => Object.values(t)[0]));

    if (tables.length === 0) {
      console.log("⚠️ The database is empty. You might need to run the migration scripts.");
    } else {
      // Check for some key tables
      const tableNames = tables.map(t => Object.values(t)[0]);
      const expectedTables = ["users", "roles", "products", "orders"];
      const missingTables = expectedTables.filter(t => !tableNames.includes(t));
      
      if (missingTables.length > 0) {
        console.log("⚠️ Some expected tables are missing:", missingTables);
      } else {
        const [userCount] = await connection.query("SELECT COUNT(*) as count FROM users");
        console.log(`Found ${userCount[0].count} users.`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:");
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error("Hint: Is the MySQL service running on your machine?");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`Hint: The database '${process.env.DB_NAME}' does not exist.`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("Hint: Check your username and password.");
    }
  }
}

testConnection();
