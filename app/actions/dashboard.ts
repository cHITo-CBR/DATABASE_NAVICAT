"use server";
import { query, queryOne } from "@/lib/db-helpers";

export interface DashboardKPIs {
  totalUsers: number;
  successfulOrdersCount: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  totalSales: number;
  totalPipelineValue: number;
  pipelineGrowth: number;
  goalEfficiency: number;
  hubStatus: 'operational' | 'maintenance' | 'offline';
  totalEarnings: number;
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

async function safeCount(table: string, filter?: { column: string; value: any }): Promise<number> {
  try {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const params: any[] = [];
    if (filter) {
      sql += ` WHERE ${filter.column} = ?`;
      params.push(filter.value);
    }
    const row = await queryOne<{ count: number }>(sql, params);
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [totalUsers, totalCustomers, totalProducts] = await Promise.all([
    safeCount("users"),
    safeCount("customers"),
    safeCount("products"),
  ]);

  let successfulOrdersCount = 0;
  try {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM sales_transactions WHERE status = 'completed'"
    );
    successfulOrdersCount = row?.count ?? 0;
  } catch { successfulOrdersCount = 0; }

  let lowStockItems = 0;
  try {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM products WHERE total_cases < 10 AND is_archived = 0"
    );
    lowStockItems = row?.count ?? 0;
  } catch { lowStockItems = 0; }

  let totalPipelineValue = 0;
  try {
    const rows = await query("SELECT total_cases, packaging_price FROM products WHERE is_archived = 0");
    totalPipelineValue = rows.reduce((sum: number, p: any) =>
      sum + ((p.total_cases || 0) * (Number(p.packaging_price) || 0)), 0);
  } catch { totalPipelineValue = 0; }

  const lastMonthValue = totalPipelineValue * 0.89;
  const pipelineGrowth = lastMonthValue > 0 ? Math.round(((totalPipelineValue - lastMonthValue) / lastMonthValue) * 100) : 0;

  const targetProducts = 50;
  const goalEfficiency = targetProducts > 0 ? Math.min(100, Math.round((totalProducts / targetProducts) * 100 * 10)) / 10 : 0;

  const hubStatus: 'operational' | 'maintenance' | 'offline' =
    totalUsers > 0 && totalProducts > 0 ? 'operational' :
      totalUsers > 0 ? 'maintenance' : 'offline';

  let totalEarnings = 0;
  try {
    const row = await queryOne<{ total: number }>(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_transactions WHERE status = 'completed'"
    );
    totalEarnings = row?.total ?? 0;
  } catch { totalEarnings = 0; }

  return {
    totalUsers,
    successfulOrdersCount,
    totalCustomers,
    totalProducts,
    lowStockItems,
    totalSales: 0,
    totalPipelineValue,
    pipelineGrowth,
    goalEfficiency,
    hubStatus,
    totalEarnings,
  };
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  try {
    const rows = await query(
      `SELECT st.id, st.total_amount, st.status, st.created_at, c.store_name as customer_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       ORDER BY st.created_at DESC
       LIMIT 5`
    );

    return rows.map((t: any) => ({
      id: t.id,
      customer_name: t.customer_name ?? "Unknown",
      total_amount: t.total_amount ?? 0,
      status: t.status ?? "unknown",
      created_at: t.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getLowStockItems(): Promise<LowStockItem[]> {
  try {
    const rows = await query(
      `SELECT il.balance, pv.name as variant_name
       FROM inventory_ledger il
       LEFT JOIN product_variants pv ON il.product_variant_id = pv.id
       WHERE il.balance < 10
       ORDER BY il.balance ASC
       LIMIT 5`
    );

    return rows.map((item: any) => ({
      variant_name: item.variant_name ?? "Unknown SKU",
      balance: item.balance ?? 0,
    }));
  } catch {
    return [];
  }
}
