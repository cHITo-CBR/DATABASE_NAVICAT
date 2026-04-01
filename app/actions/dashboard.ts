"use server";

import { query, queryOne } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2";

export interface DashboardKPIs {
  totalUsers: number;
  pendingApprovals: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  totalSales: number;
}

export interface RecentTransaction {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface LowStockItem {
  variant_name: string;
  balance: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

async function safeCount(table: string, filter?: { column: string; value: string | number }): Promise<number> {
  try {
    let sql = `SELECT COUNT(*) AS count FROM ${table}`;
    const params: any[] = [];
    if (filter) {
      sql += ` WHERE ${filter.column} = ?`;
      params.push(filter.value);
    }
    const result = await queryOne<CountRow>(sql, params);
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [totalUsers, pendingApprovals, totalCustomers, totalProducts] = await Promise.all([
    safeCount("users"),
    safeCount("users", { column: "status", value: "pending" }),
    safeCount("users", { column: "role_id", value: 4 }), // Role ID 4 is for 'buyer'
    safeCount("products"),
  ]);

  // These require tables that may not exist yet
  const lowStockItems = 0;
  const totalSales = 0;

  return {
    totalUsers,
    pendingApprovals,
    totalCustomers,
    totalProducts,
    lowStockItems,
    totalSales,
  };
}

interface TransactionDbRow extends RowDataPacket {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_store_name: string | null;
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  try {
    const transactions = await query<TransactionDbRow>(`
      SELECT st.id, st.total_amount, st.status, st.created_at, c.store_name AS customer_store_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      ORDER BY st.created_at DESC
      LIMIT 5
    `);

    return transactions.map((t) => ({
      id: t.id,
      customer_name: t.customer_store_name ?? "Unknown",
      total_amount: t.total_amount ?? 0,
      status: t.status ?? "unknown",
      created_at: t.created_at,
    }));
  } catch {
    return [];
  }
}

interface LowStockDbRow extends RowDataPacket {
  balance: number;
  variant_name: string | null;
}

export async function getLowStockItems(): Promise<LowStockItem[]> {
  try {
    const items = await query<LowStockDbRow>(`
      SELECT il.balance, pv.name AS variant_name
      FROM inventory_ledger il
      LEFT JOIN product_variants pv ON il.variant_id = pv.id
      WHERE il.balance < 10
      ORDER BY il.balance ASC
      LIMIT 5
    `);

    return items.map((item) => ({
      variant_name: item.variant_name ?? "Unknown SKU",
      balance: item.balance ?? 0,
    }));
  } catch {
    return [];
  }
}
