
"use server";

import { query, queryOne } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";

export interface BuyerKPIs {
  storeName: string;
  totalOrders: number;
  totalSpent: number;
  unpaidInvoices: number;
  lastOrderDate: string | null;
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
