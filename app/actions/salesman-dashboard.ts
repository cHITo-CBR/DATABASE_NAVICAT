"use server";
import { query, queryOne, getTableColumns } from "@/lib/db-helpers";

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

/**
 * Safe count helper: returns 0 if the table doesn't exist or the query fails.
 */
async function safeCount(sql: string, params: any[] = []): Promise<number> {
  try {
    const row = await queryOne<{ count: number }>(sql, params);
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

async function safeQuery(sql: string, params: any[] = []): Promise<any[]> {
  try {
    return await query(sql, params);
  } catch {
    return [];
  }
}

export async function getSalesmanKPIs(userId: string): Promise<SalesmanKPIs> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 1).toISOString();

    // Check which optional tables exist
    const hasCallsheets = (await getTableColumns("callsheets")).length > 0;
    const hasBuyerRequests = (await getTableColumns("buyer_requests")).length > 0;
    const hasQuotas = (await getTableColumns("salesman_quotas")).length > 0;

    // Run all queries in parallel — missing tables are safely handled
    const [
      todayVisits,
      pendingCallsheets,
      submittedCallsheets,
      pendingBuyerRequests,
      myMonthlyBookingsCount,
      myMonthlySalesRows,
      companyMonthlySalesRows
    ] = await Promise.all([
      // Today's visits
      safeCount(
        "SELECT COUNT(*) as count FROM store_visits WHERE salesman_id = ? AND visit_date >= ?",
        [userId, `${today}T00:00:00`]
      ),
      // Pending callsheets
      hasCallsheets
        ? safeCount("SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ? AND status = 'draft'", [userId])
        : Promise.resolve(0),
      // Submitted callsheets
      hasCallsheets
        ? safeCount("SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ? AND status = 'submitted'", [userId])
        : Promise.resolve(0),
      // Pending buyer requests
      hasBuyerRequests
        ? safeCount("SELECT COUNT(*) as count FROM buyer_requests WHERE salesman_id = ? AND status = 'pending'", [userId])
        : Promise.resolve(0),
      // My monthly bookings count
      safeCount(
        `SELECT COUNT(*) as count FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [userId, startDate, endDate]
      ),
      // My monthly sales amounts
      safeQuery(
        `SELECT total_amount FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [userId, startDate, endDate]
      ),
      // Company-wide monthly sales
      safeQuery(
        `SELECT total_amount FROM sales_transactions
         WHERE status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [startDate, endDate]
      ),
    ]);

    // Fetch quota data
    let quotaDataRes: any = null;
    if (hasQuotas) {
      quotaDataRes = await queryOne(
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
      todayVisits,
      pendingCallsheets,
      submittedCallsheets,
      pendingBuyerRequests,
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
    const hasCallsheets = (await getTableColumns("callsheets")).length > 0;

    // Fetch visits (always available)
    const visits = await safeQuery(
      `SELECT sv.id, sv.visit_date, sv.notes, sv.created_at, c.store_name
       FROM store_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       WHERE sv.salesman_id = ?
       ORDER BY sv.created_at DESC LIMIT 5`,
      [userId]
    );

    // Fetch callsheets only if table exists
    const callsheets = hasCallsheets
      ? await safeQuery(
          `SELECT cs.id, cs.status, cs.visit_date, cs.updated_at, c.store_name
           FROM callsheets cs
           LEFT JOIN customers c ON cs.customer_id = c.id
           WHERE cs.salesman_id = ?
           ORDER BY cs.updated_at DESC LIMIT 3`,
          [userId]
        )
      : [];

    // Also fetch recent bookings for the activity feed
    const bookings = await safeQuery(
      `SELECT st.id, st.status, st.total_amount, st.created_at, c.store_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.salesman_id = ?
       ORDER BY st.created_at DESC LIMIT 5`,
      [userId]
    );

    return {
      visits: visits.map((v: any) => ({
        ...v,
        type: "visit",
        customers: v.store_name ? { store_name: v.store_name } : null,
      })),
      callsheets: callsheets.map((cs: any) => ({
        ...cs,
        type: "callsheet",
        customers: cs.store_name ? { store_name: cs.store_name } : null,
      })),
      bookings: bookings.map((b: any) => ({
        ...b,
        type: "booking",
        customers: b.store_name ? { store_name: b.store_name } : null,
      })),
    };
  } catch {
    return { visits: [], callsheets: [], bookings: [] };
  }
}
