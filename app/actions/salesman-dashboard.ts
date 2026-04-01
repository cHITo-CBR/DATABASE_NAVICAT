"use server";

import { query, queryOne } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2";

export interface SalesmanKPIs {
  todayVisits: number;
  pendingCallsheets: number;
  submittedCallsheets: number;
  pendingBuyerRequests: number;
  confirmedBookings: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

/**
 * Fetches KPIs for the salesman dashboard.
 */
export async function getSalesmanKPIs(userId: string): Promise<SalesmanKPIs> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Parallel counts
    const [visits, pendingCS, submittedCS, buyerReqs, bookings] = await Promise.all([
      // Today's visits
      queryOne<CountRow>(`
        SELECT COUNT(*) AS count FROM store_visits
        WHERE salesman_id = ? AND visit_date >= ?
      `, [userId, `${today} 00:00:00`]),

      // Pending (Draft) Callsheets
      queryOne<CountRow>(`
        SELECT COUNT(*) AS count FROM callsheets
        WHERE salesman_id = ? AND status = ?
      `, [userId, "draft"]),

      // Submitted Callsheets
      queryOne<CountRow>(`
        SELECT COUNT(*) AS count FROM callsheets
        WHERE salesman_id = ? AND status = ?
      `, [userId, "submitted"]),

      // Pending Buyer Requests
      queryOne<CountRow>(`
        SELECT COUNT(*) AS count FROM buyer_requests
        WHERE salesman_id = ? AND status = ?
      `, [userId, "pending"]),

      // Confirmed Bookings (Sales Transactions)
      queryOne<CountRow>(`
        SELECT COUNT(*) AS count FROM sales_transactions
        WHERE salesman_id = ? AND status = ?
      `, [userId, "completed"])
    ]);

    return {
      todayVisits: visits?.count ?? 0,
      pendingCallsheets: pendingCS?.count ?? 0,
      submittedCallsheets: submittedCS?.count ?? 0,
      pendingBuyerRequests: buyerReqs?.count ?? 0,
      confirmedBookings: bookings?.count ?? 0
    };
  } catch (err) {
    console.error("Salesman KPI error:", err);
    return {
      todayVisits: 0,
      pendingCallsheets: 0,
      submittedCallsheets: 0,
      pendingBuyerRequests: 0,
      confirmedBookings: 0
    };
  }
}

interface VisitDbRow extends RowDataPacket {
  id: string;
  visit_date: string;
  notes: string | null;
  created_at: string;
  customer_store_name: string | null;
}

interface CallsheetDbRow extends RowDataPacket {
  id: string;
  status: string;
  visit_date: string;
  updated_at: string;
  customer_store_name: string | null;
}

/**
 * Gets recent activity for the salesman.
 */
export async function getSalesmanRecentActivity(userId: string) {
  try {
    const [visits, callsheets] = await Promise.all([
      query<VisitDbRow>(`
        SELECT sv.id, sv.visit_date, sv.notes, sv.created_at, c.store_name AS customer_store_name
        FROM store_visits sv
        LEFT JOIN customers c ON sv.customer_id = c.id
        WHERE sv.salesman_id = ?
        ORDER BY sv.created_at DESC
        LIMIT 3
      `, [userId]),
      query<CallsheetDbRow>(`
        SELECT cs.id, cs.status, cs.visit_date, cs.updated_at, c.store_name AS customer_store_name
        FROM callsheets cs
        LEFT JOIN customers c ON cs.customer_id = c.id
        WHERE cs.salesman_id = ?
        ORDER BY cs.updated_at DESC
        LIMIT 3
      `, [userId]),
    ]);

    return {
      visits: visits.map(v => ({
        ...v,
        customers: v.customer_store_name ? { store_name: v.customer_store_name } : null,
      })),
      callsheets: callsheets.map(cs => ({
        ...cs,
        customers: cs.customer_store_name ? { store_name: cs.customer_store_name } : null,
      })),
    };
  } catch {
    return { visits: [], callsheets: [] };
  }
}
