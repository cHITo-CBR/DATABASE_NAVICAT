"use server";
import { query, queryOne } from "@/lib/db-helpers";
import { getCurrentUser } from "@/app/actions/auth";

export interface MobileDashboardData {
  user: { full_name: string; avatar_url?: string };
  targets: { daily_sales_percentage: number };
  stats: { todays_visits: number; draft_callsheets: number; bookings: number; total_buyers: number };
  recent_activity: any[];
}

export async function getSalesmanMobileData(): Promise<MobileDashboardData> {
  const session = await getCurrentUser();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
  const endDate = new Date(currentYear, currentMonth, 1).toISOString();

  const [quotaRow, visitsRow, callsheetsRow, bookingsRow, buyersRow] = await Promise.all([
    queryOne<{ amount_percentage: number }>(
      `SELECT
        CASE WHEN sq.target_amount > 0
          THEN (COALESCE(SUM(st.total_amount), 0) / sq.target_amount) * 100
          ELSE 0
        END as amount_percentage
       FROM salesman_quotas sq
       LEFT JOIN sales_transactions st ON st.salesman_id = sq.salesman_id
         AND st.status IN ('pending','approved','completed')
         AND st.created_at >= ? AND st.created_at < ?
       WHERE sq.salesman_id = ? AND sq.month = ? AND sq.year = ?
       GROUP BY sq.id`,
      [startDate, endDate, userId, currentMonth, currentYear]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM store_visits WHERE salesman_id = ? AND DATE(visit_date) = ?",
      [userId, today]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ? AND status = 'draft'",
      [userId]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM sales_transactions WHERE salesman_id = ? AND status IN ('pending', 'approved')",
      [userId]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers WHERE assigned_salesman_id = ? AND is_active = 1",
      [userId]
    ),
  ]);

  return {
    user: {
      full_name: session.user.full_name,
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + session.user.full_name,
    },
    targets: {
      daily_sales_percentage: quotaRow?.amount_percentage ? Number(quotaRow.amount_percentage) : 0,
    },
    stats: {
      todays_visits: visitsRow?.count || 0,
      draft_callsheets: callsheetsRow?.count || 0,
      bookings: bookingsRow?.count || 0,
      total_buyers: buyersRow?.count || 0,
    },
    recent_activity: [],
  };
}
