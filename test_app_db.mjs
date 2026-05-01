import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env.local") });

async function testConnection() {
  const config = {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "database_navicat",
  };
  
  console.log("Testing connection with config:", config);

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ Connection successful!");
    
    const [rows] = await connection.query("SELECT DATABASE()");
    console.log("Connected to database:", rows[0]['DATABASE()']);
    
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables found:", tables.map(t => Object.values(t)[0]));
    
    await connection.end();
  } catch (err) {
    console.error("❌ Connection failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
  }
}

testConnection();
