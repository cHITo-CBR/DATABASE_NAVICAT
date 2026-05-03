
"use server";

import { query, queryOne, getTableColumns } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";

export interface BuyerKPIs {
  storeName: string;
  totalOrders: number;
  totalSpent: number;
  unpaidInvoices: number;
  lastOrderDate: string | null;
}

export interface BuyerHomeData {
  userName: string;
  storeName: string | null;
  pointsBalance: number;
  membershipStatus: string;
  pendingOrders: number;
  activeOrders: number;
  recentActivity: {
    id: string | number;
    title: string;
    description: string | null;
    type: "order" | "points" | "system";
    created_at: string;
  }[];
}

export async function getBuyerHomeData(): Promise<BuyerHomeData | null> {
  const session = await getSession();
  if (!session || !session.user) return null;
  if (session.user.role !== "buyer") return null;

  const userId = session.user.id;
  const userName =
    session.user.full_name ||
    session.user.name ||
    session.user.email ||
    "Buyer";

  const userColumns = await getTableColumns("users");
  let pointsBalance = 0;
  let membershipStatus = "Silver";

  if (userColumns.includes("points_balance") || userColumns.includes("membership_status")) {
    const userRow = await queryOne<{ points_balance?: number; membership_status?: string }>(
      `SELECT ${userColumns.includes("points_balance") ? "points_balance" : "0 as points_balance"},
              ${userColumns.includes("membership_status") ? "membership_status" : "'Silver' as membership_status"}
       FROM users WHERE id = ?`,
      [userId]
    );
    pointsBalance = Number(userRow?.points_balance) || 0;
    membershipStatus = userRow?.membership_status || "Silver";
  }

  const customerId = session.user.linked_customer_id || session.user.customer_id || null;
  let storeName: string | null = null;
  if (customerId) {
    const customer = await queryOne<{ store_name: string }>(
      "SELECT store_name FROM customers WHERE id = ?",
      [customerId]
    );
    storeName = customer?.store_name || null;
  }

  const requestColumns = await getTableColumns("buyer_requests");
  let pendingOrders = 0;
  let activeOrders = 0;
  let filterColumn: "buyer_id" | "customer_id" | null = null;
  let filterValue: string | null = null;

  if (requestColumns.includes("buyer_id")) {
    filterColumn = "buyer_id";
    filterValue = userId;
  } else if (requestColumns.includes("customer_id") && customerId) {
    filterColumn = "customer_id";
    filterValue = customerId;
  }

  if (filterColumn && filterValue && requestColumns.includes("status")) {
    const pendingRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM buyer_requests WHERE ${filterColumn} = ? AND status = 'pending'`,
      [filterValue]
    );
    const activeRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM buyer_requests WHERE ${filterColumn} = ? AND status IN ('processed','approved','for_approval','shipped','delivered','completed')`,
      [filterValue]
    );
    pendingOrders = pendingRow?.count || 0;
    activeOrders = activeRow?.count || 0;
  }

  const activityColumns = await getTableColumns("user_activity");
  let recentActivity: BuyerHomeData["recentActivity"] = [];
  if (activityColumns.length > 0) {
    recentActivity = await query(
      `SELECT id, title, description, type, created_at
       FROM user_activity
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );
  }

  return {
    userName,
    storeName,
    pointsBalance,
    membershipStatus,
    pendingOrders,
    activeOrders,
    recentActivity: recentActivity.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      type: row.type || "system",
      created_at: row.created_at,
    })),
  };
}

export async function getBuyerDashboardKPIs(): Promise<BuyerKPIs | null> {
  const session = await getSession();
  if (!session || !session.user.linked_customer_id) return null;

  const customerId = session.user.linked_customer_id;

  try {
    // 1. Get Store Name
    const customer = await queryOne<{ store_name: string }>(
      "SELECT store_name FROM customers WHERE id = ?",
      [customerId]
    );

    // 2. Get Order Stats
    const stats = await queryOne<{ total_orders: number, total_spent: number }>(
      `SELECT COUNT(*) as total_orders, SUM(total_amount) as total_spent 
       FROM sales_transactions 
       WHERE customer_id = ? AND status != 'cancelled'`,
      [customerId]
    );

    // 3. Get Unpaid Invoices (using the new payment_status column)
    const unpaid = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM sales_transactions 
       WHERE customer_id = ? AND payment_status != 'paid' AND status != 'cancelled'`,
      [customerId]
    );

    // 4. Get Last Order Date
    const lastOrder = await queryOne<{ created_at: string }>(
      "SELECT created_at FROM sales_transactions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1",
      [customerId]
    );

    return {
      storeName: customer?.store_name || "Your Store",
      totalOrders: stats?.total_orders || 0,
      totalSpent: Number(stats?.total_spent) || 0,
      unpaidInvoices: unpaid?.count || 0,
      lastOrderDate: lastOrder?.created_at || null,
    };
  } catch (error) {
    console.error("getBuyerDashboardKPIs error:", error);
    return null;
  }
}

export async function getBuyerRecentOrders() {
  const session = await getSession();
  if (!session || !session.user.linked_customer_id) return [];

  const customerId = session.user.linked_customer_id;

  try {
    return await query(
      `SELECT id, total_amount, status, payment_status, created_at 
       FROM sales_transactions 
       WHERE customer_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [customerId]
    );
  } catch (error) {
    console.error("getBuyerRecentOrders error:", error);
    return [];
  }
}
