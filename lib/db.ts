import mysql from "mysql2/promise";

// In development, Next.js clears the module cache often.
// We use a global variable to keep the connection pool across hot reloads.
const globalForMysql = global as unknown as { mysqlPool: mysql.Pool };

const pool = globalForMysql.mysqlPool || mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "navicat",
  port: parseInt(process.env.DB_PORT || "3306"),
  ssl: process.env.DB_SSL === "true" ? {
    rejectUnauthorized: true
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

if (process.env.NODE_ENV !== "production") globalForMysql.mysqlPool = pool;

export default pool;
