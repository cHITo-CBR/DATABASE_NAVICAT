import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * DATABASE HELPERS
 * This file provides utility functions for common database operations.
 * All server actions use these helpers instead of raw pool access.
 */

/**
 * Generates a unique identifier (UUID v4) for new database records.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Execute a SQL query and return the rows as typed array.
 * Uses parameterized queries to prevent SQL injection.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

/**
 * Execute a SQL query and return the first row, or null if no results.
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the result metadata.
 */
export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export interface TableColumn {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  EXTRA: string | null;
}

export async function getTableColumns(tableName: string): Promise<TableColumn[]> {
  return query<TableColumn>(
    `SELECT COLUMN_NAME, DATA_TYPE, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
}

/**
 * Get a single count value from a COUNT(*) query.
 */
export async function queryCount(sql: string, params: any[] = []): Promise<number> {
  const row = await queryOne<{ count: number }>(sql, params);
  return row?.count ?? 0;
}

/**
 * UTILITY: Boolean Converters
 * MySQL uses TINYINT(1) for booleans.
 */
export function toBoolean(value: any): boolean {
  return value === true || value === 1 || value === "true";
}

export function fromBoolean(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Prepares a search term for use with MySQL LIKE (case-insensitive by default collation).
 */
export function buildLikeSearch(searchTerm: string): string {
  const escaped = searchTerm.replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}

export { pool };
