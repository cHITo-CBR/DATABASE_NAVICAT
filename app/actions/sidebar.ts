"use server";
import { queryOne, getTableColumns } from "@/lib/db-helpers";

export interface SidebarCounts {
  customers: number;
  products: number;
  inventory: number;
  sales: number;
  quotas: number;
  visits: number;
  buyerRequests: number;
  bookings: number;
  orders: number;
  callsheets: number;
  [key: string]: number;
}

export async function getSidebarCounts(): Promise<SidebarCounts> {
  try {
    const [hasSalesmanQuotas, hasStoreVisits, hasBuyerRequests] = await Promise.all([
      getTableColumns("salesman_quotas").then((c) => c.length > 0),
      getTableColumns("store_visits").then((c) => c.length > 0),
      getTableColumns("buyer_requests").then((c) => c.length > 0),
    ]);

    const [customers, products, sales, quotas, visits, buyerRequests] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM customers WHERE is_active = 1").then(r => r?.count || 0),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE is_active = 1").then(r => r?.count || 0),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM sales_transactions").then(r => r?.count || 0),
      hasSalesmanQuotas
        ? queryOne<{ count: number }>("SELECT COUNT(*) as count FROM salesman_quotas WHERE status = 'ongoing'").then(r => r?.count || 0)
        : 0,
      hasStoreVisits
        ? queryOne<{ count: number }>("SELECT COUNT(*) as count FROM store_visits").then(r => r?.count || 0)
        : 0,
      hasBuyerRequests
        ? queryOne<{ count: number }>("SELECT COUNT(*) as count FROM buyer_requests WHERE status = 'pending'").then(r => r?.count || 0)
        : 0,
    ]);

    return {
      customers: Number(customers),
      products: Number(products),
      inventory: 0,
      sales: Number(sales),
      quotas: Number(quotas),
      visits: Number(visits),
      buyerRequests: Number(buyerRequests),
      bookings: 0,
      orders: 0,
      callsheets: 0,
    };
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return { customers: 0, products: 0, inventory: 0, sales: 0, quotas: 0, visits: 0, buyerRequests: 0, bookings: 0, orders: 0, callsheets: 0 };
  }
}
