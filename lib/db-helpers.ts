import pool from "./db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

/**
 * Execute a SELECT query and return rows
 */
export async function query<T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows;
}

/**
 * Execute a SELECT query and return a single row
 */
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT query and return the inserted ID
 */
export async function insert(
  sql: string,
  params: any[] = []
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.insertId;
}

/**
 * Execute an UPDATE query and return affected rows count
 */
export async function update(
  sql: string,
  params: any[] = []
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

/**
 * Execute a DELETE query and return affected rows count
 */
export async function remove(
  sql: string,
  params: any[] = []
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

/**
 * Execute any query (for complex operations)
 */
export async function execute(
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Convert MySQL TINYINT(1) to boolean
 */
export function toBoolean(value: any): boolean {
  return value === 1 || value === true;
}

/**
 * Convert boolean to MySQL TINYINT(1)
 */
export function fromBoolean(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  startIndex: number = 1
): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && "operator" in value) {
        // Support for custom operators like { operator: 'LIKE', value: '%search%' }
        conditions.push(`${key} ${value.operator} ?`);
        params.push(value.value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
      paramIndex++;
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

/**
 * Execute queries in a transaction
 */
export async function transaction<T>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Escape LIKE pattern for safe searching
 */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/**
 * Build case-insensitive LIKE search
 */
export function buildLikeSearch(column: string, searchTerm: string): {
  condition: string;
  value: string;
} {
  const escaped = escapeLike(searchTerm);
  return {
    condition: `LOWER(${column}) LIKE ?`,
    value: `%${escaped.toLowerCase()}%`,
  };
}
