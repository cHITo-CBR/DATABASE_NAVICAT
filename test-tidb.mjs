import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log("Starting TiDB Connection Test...");
  console.log("Config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "4000"),
      ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: true
      } : undefined,
    });

    console.log("✅ Successfully connected to TiDB!");

    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    console.log("Query test result (1+1):", rows[0].solution);

    const [tables] = await connection.execute('SHOW TABLES');
    console.log("Tables found in database:", tables.length);
    tables.forEach(t => console.log(` - ${Object.values(t)[0]}`));

    await connection.end();
    console.log("✅ Connection closed successfully.");
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err.message);
  }
}

testConnection();
