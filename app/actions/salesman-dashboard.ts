"use server";
import { query, queryOne } from "@/lib/db-helpers";

export interface SalesmanKPIs {
  todayVisits: number;
  pendingCallsheets: number;
  submittedCallsheets: number;
  pendingBuyerRequests: number;
  confirmedBookings: number;
  quota: {
    target: number;
    achieved: number;
    percentage: number;
    orderTarget: number;
    orderAchieved: number;
    orderPercentage: number;
    month: number;
    year: number;
    status: "Achieved" | "On Track" | "Below Target" | "No Target";
  } | null;
}

export async function getSalesmanKPIs(userId: string): Promise<SalesmanKPIs> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 1).toISOString();

    const [visitsRow, pendingCSRow, submittedCSRow, buyerReqsRow, myMonthlyBookingsRow, myMonthlySalesRows, companyMonthlySalesRows] = await Promise.all([
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM store_visits WHERE salesman_id = ? AND visit_date >= ?",
        [userId, `${today}T00:00:00`]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ? AND status = 'draft'",
        [userId]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ? AND status = 'submitted'",
        [userId]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM buyer_requests WHERE salesman_id = ? AND status = 'pending'",
        [userId]
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [userId, startDate, endDate]
      ),
      query(
        `SELECT total_amount FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [userId, startDate, endDate]
      ),
      query(
        `SELECT total_amount FROM sales_transactions
         WHERE status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [startDate, endDate]
      ),
    ]);

    // Fetch quota data (inline replaces quota_report_view)
    let quotaDataRes = await queryOne(
      `SELECT target_amount, achieved_amount, target_orders, achieved_orders, month, year
       FROM salesman_quotas WHERE salesman_id = ? AND month = ? AND year = ?`,
      [userId, currentMonth, currentYear]
    );

    if (!quotaDataRes) {
      quotaDataRes = await queryOne(
        `SELECT target_amount, achieved_amount, target_orders, achieved_orders, month, year
         FROM salesman_quotas WHERE salesman_id = ?
         ORDER BY year DESC, month DESC LIMIT 1`,
        [userId]
      );
    }

    // Financial Achievements
    const myTotalAmount = (myMonthlySalesRows || []).reduce((sum: number, tx: any) => sum + (Number(tx.total_amount) || 0), 0);
    const companyTotalAmount = (companyMonthlySalesRows || []).reduce((sum: number, tx: any) => sum + (Number(tx.total_amount) || 0), 0);

    const quotaTargetAmount = quotaDataRes ? Number(quotaDataRes.target_amount) : 0;
    const targetAmount = quotaTargetAmount > 0 ? quotaTargetAmount : companyTotalAmount;

    const calculatedPercentage = targetAmount > 0
      ? Math.min(100, Math.round((myTotalAmount / targetAmount) * 100))
      : (myTotalAmount > 0 ? 100 : 0);

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = new Date().getDate();
    const elapsedPercentage = (currentDay / daysInMonth) * 100;

    let status: "Achieved" | "On Track" | "Below Target" | "No Target" = "No Target";
    if (calculatedPercentage >= 100) status = "Achieved";
    else if (targetAmount > 0) {
      status = (calculatedPercentage >= (elapsedPercentage * 0.9)) ? "On Track" : "Below Target";
    }

    const myMonthlyBookingsCount = myMonthlyBookingsRow?.count ?? 0;

    const quotaData = {
      target: targetAmount,
      achieved: myTotalAmount,
      percentage: calculatedPercentage,
      orderTarget: Number(quotaDataRes?.target_orders ?? 0),
      orderAchieved: myMonthlyBookingsCount,
      orderPercentage: quotaDataRes?.target_orders ? Math.min(100, Math.round((myMonthlyBookingsCount / Number(quotaDataRes.target_orders)) * 100)) : 0,
      month: quotaDataRes?.month ?? currentMonth,
      year: quotaDataRes?.year ?? currentYear,
      status: status,
    };

    return {
      todayVisits: visitsRow?.count ?? 0,
      pendingCallsheets: pendingCSRow?.count ?? 0,
      submittedCallsheets: submittedCSRow?.count ?? 0,
      pendingBuyerRequests: buyerReqsRow?.count ?? 0,
      confirmedBookings: myMonthlyBookingsCount,
      quota: quotaData,
    };
  } catch (err) {
    console.error("Salesman KPI error:", err);
    return { todayVisits: 0, pendingCallsheets: 0, submittedCallsheets: 0, pendingBuyerRequests: 0, confirmedBookings: 0, quota: null };
  }
}

export async function getSalesmanRecentActivity(userId: string) {
  try {
    const [visits, callsheets] = await Promise.all([
      query(
        `SELECT sv.id, sv.visit_date, sv.notes, sv.created_at, c.store_name
         FROM store_visits sv
         LEFT JOIN customers c ON sv.customer_id = c.id
         WHERE sv.salesman_id = ?
         ORDER BY sv.created_at DESC LIMIT 3`,
        [userId]
      ),
      query(
        `SELECT cs.id, cs.status, cs.visit_date, cs.updated_at, c.store_name
         FROM callsheets cs
         LEFT JOIN customers c ON cs.customer_id = c.id
         WHERE cs.salesman_id = ?
         ORDER BY cs.updated_at DESC LIMIT 3`,
        [userId]
      ),
    ]);

    return {
      visits: visits.map((v: any) => ({
        ...v,
        customers: v.store_name ? { store_name: v.store_name } : null,
      })),
      callsheets: callsheets.map((cs: any) => ({
        ...cs,
        customers: cs.store_name ? { store_name: cs.store_name } : null,
      })),
    };
  } catch {
    return { visits: [], callsheets: [] };
  }
}
