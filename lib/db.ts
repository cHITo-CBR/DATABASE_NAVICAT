import mysql from "mysql2/promise";

/**
 * DATABASE INITIALIZATION
 * This file initializes the MySQL connection pool used throughout the application's backend.
 * It uses a singleton pattern to prevent multiple pools during development hot-reloads.
 */

const globalForDb = global as unknown as { pool: mysql.Pool };

const pool: mysql.Pool =
  globalForDb.pool ||
  mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "flowstock",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export default pool;
