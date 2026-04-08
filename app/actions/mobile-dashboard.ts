nd will"use server";

import { queryOne } from "@/lib/db-helpers";
import { getCurrentUser } from "@/app/actions/auth";

export interface MobileDashboardData {
  user: {
    full_name: string;
    avatar_url?: string;
  };
  targets: {
    daily_sales_percentage: number;
  };
  stats: {
    todays_visits: number;
    draft_callsheets: number;
    bookings: number;
    total_buyers: number;
  };
  recent_activity: any[];
}

export async function getSalesmanMobileData(): Promise<MobileDashboardData> {
  const session = await getCurrentUser();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  // 1. Get Quota Progress
  const quota = await queryOne<any>(`
    SELECT amount_percentage FROM quota_report_view 
    WHERE salesman_id = ? AND month = ? AND year = ?
  `, [userId, currentMonth, currentYear]);

  // 2. Get Today's Visits
  const visits = await queryOne<any>(`
    SELECT COUNT(*) as count FROM store_visits 
    WHERE salesman_id = ? AND visit_date = ?
  `, [userId, today]);

  // 3. Get Draft Callsheets
  const callsheets = await queryOne<any>(`
    SELECT COUNT(*) as count FROM callsheets 
    WHERE salesman_id = ? AND status = 'draft'
  `, [userId]);

  // 4. Get Bookings (Recent sales transactions)
  const bookings = await queryOne<any>(`
    SELECT COUNT(*) as count FROM sales_transactions 
    WHERE salesman_id = ? AND status IN ('pending', 'approved')
  `, [userId]);

  // 5. Get Total Buyers/Stores
  const buyers = await queryOne<any>(`
    SELECT COUNT(*) as count FROM customers 
    WHERE assigned_salesman_id = ? AND is_active = 1
  `, [userId]);

  return {
    user: {
      full_name: session.user.full_name,
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + session.user.full_name,
    },
    targets: {
      daily_sales_percentage: quota?.amount_percentage ? parseFloat(quota.amount_percentage) : 0,
    },
    stats: {
      todays_visits: visits?.count || 0,
      draft_callsheets: callsheets?.count || 0,
      bookings: bookings?.count || 0,
      total_buyers: buyers?.count || 0,
    },
    recent_activity: [], // To be implemented if needed
  };
}
