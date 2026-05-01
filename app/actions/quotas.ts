"use server";
import { query, queryOne, execute } from "@/lib/db-helpers";
import { getCurrentUser } from "@/app/actions/auth";

export interface QuotaRow {
  id: number;
  salesman_id: string;
  salesman_name?: string;
  salesman_email?: string;
  month: number;
  year: number;
  month_name?: string;
  target_amount: number | null;
  target_units: number | null;
  target_orders: number | null;
  achieved_amount: number;
  achieved_units: number;
  achieved_orders: number;
  amount_percentage: number | null;
  units_percentage: number | null;
  orders_percentage: number | null;
  status: "pending" | "ongoing" | "completed";
  dynamicStatus?: "Achieved" | "On Track" | "Below Target" | "Pending";
  created_at: string;
  updated_at: string | null;
}

export async function getQuotas(filters?: {
  year?: number;
  month?: number;
  salesman_id?: string;
}): Promise<QuotaRow[]> {
  try {
    // Inline the quota_report_view logic with JOINs
    let sql = `
      SELECT q.*, u.full_name as salesman_name, u.email as salesman_email
      FROM salesman_quotas q
      LEFT JOIN users u ON q.salesman_id = u.id
      WHERE 1=1`;
    const params: any[] = [];

    if (filters?.year) { sql += " AND q.year = ?"; params.push(filters.year); }
    if (filters?.month) { sql += " AND q.month = ?"; params.push(filters.month); }
    if (filters?.salesman_id) { sql += " AND q.salesman_id = ?"; params.push(filters.salesman_id); }

    sql += " ORDER BY q.year DESC, q.month DESC";

    const data = await query(sql, params);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = new Date().getDate();
    const elapsedPercentage = (currentDay / daysInMonth) * 100;

    const quotasWithLiveAchievements = await Promise.all((data || []).map(async (q: any) => {
      const startDate = new Date(q.year, q.month - 1, 1).toISOString();
      const endDate = new Date(q.year, q.month, 1).toISOString();

      // Fetch live transactions for this salesman in this specific month
      const txRow = await queryOne<{ total: number; count: number }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
         FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [q.salesman_id, startDate, endDate]
      );

      const liveAchievedAmount = txRow?.total ?? 0;
      const liveAchievedOrders = txRow?.count ?? 0;

      const targetAmount = q.target_amount ? Number(q.target_amount) : 0;
      const achievedAmount = liveAchievedAmount > 0 ? liveAchievedAmount : Number(q.achieved_amount);
      const achievedOrders = liveAchievedOrders > 0 ? liveAchievedOrders : Number(q.achieved_orders);

      const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

      let dynamicStatus: "Achieved" | "On Track" | "Below Target" | "Pending" = "Pending";

      if (percentage >= 100) {
        dynamicStatus = "Achieved";
      } else if (targetAmount > 0 && q.month === currentMonth && q.year === currentYear) {
        dynamicStatus = (percentage >= (elapsedPercentage * 0.9)) ? "On Track" : "Below Target";
      } else if (q.status === "completed") {
        dynamicStatus = "Achieved";
      }

      return {
        ...q,
        target_amount: q.target_amount ? Number(q.target_amount) : null,
        achieved_amount: achievedAmount,
        achieved_orders: achievedOrders,
        amount_percentage: percentage,
        units_percentage: q.target_units ? (achievedOrders / Number(q.target_units)) * 100 : null,
        orders_percentage: q.target_orders ? (achievedOrders / Number(q.target_orders)) * 100 : null,
        dynamicStatus,
      };
    }));

    return quotasWithLiveAchievements;
  } catch (error) {
    console.error("Error fetching quotas:", error);
    return [];
  }
}

export async function createQuota(formData: FormData) {
  const session = await getCurrentUser();
  if (!session) return { error: "Unauthorized" };

  const salesman_id = formData.get("salesman_id") as string;
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const target_amount = formData.get("target_amount") as string;
  const target_units = formData.get("target_units") as string;
  const target_orders = formData.get("target_orders") as string;

  if (!salesman_id || !month || !year) {
    return { error: "Salesman, month, and year are required." };
  }

  try {
    await execute(
      `INSERT INTO salesman_quotas (salesman_id, month, year, target_amount, target_units, target_orders, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [salesman_id, month, year,
       target_amount ? parseFloat(target_amount) : null,
       target_units ? parseInt(target_units) : null,
       target_orders ? parseInt(target_orders) : null]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error creating quota:", error);
    // MySQL duplicate key error code
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      return { error: "Quota already exists for this salesman in this month/year." };
    }
    return { error: "Failed to create quota." };
  }
}

export async function updateQuota(id: number, formData: FormData) {
  const session = await getCurrentUser();
  if (!session) return { error: "Unauthorized" };

  const target_amount = formData.get("target_amount") as string;
  const target_units = formData.get("target_units") as string;
  const target_orders = formData.get("target_orders") as string;
  const achieved_amount = formData.get("achieved_amount") as string;
  const achieved_units = formData.get("achieved_units") as string;
  const achieved_orders = formData.get("achieved_orders") as string;
  const status = formData.get("status") as string;

  try {
    await execute(
      `UPDATE salesman_quotas SET target_amount = ?, target_units = ?, target_orders = ?,
       achieved_amount = ?, achieved_units = ?, achieved_orders = ?, status = ?
       WHERE id = ?`,
      [target_amount ? parseFloat(target_amount) : null,
       target_units ? parseInt(target_units) : null,
       target_orders ? parseInt(target_orders) : null,
       achieved_amount ? parseFloat(achieved_amount) : 0,
       achieved_units ? parseInt(achieved_units) : 0,
       achieved_orders ? parseInt(achieved_orders) : 0,
       status || "pending", id]
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating quota:", error);
    return { error: "Failed to update quota." };
  }
}

export async function getCurrentMonthQuotaSummary(): Promise<{
  total_quotas: number;
  completed_quotas: number;
  total_target: number;
  total_achieved: number;
  completion_rate: number;
}> {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const records = await query(
      "SELECT salesman_id, target_amount, achieved_amount, status FROM salesman_quotas WHERE month = ? AND year = ?",
      [currentMonth, currentYear]
    );

    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 1).toISOString();

    let total_achieved = 0;
    let completed_quotas = 0;

    for (const r of records) {
      const txRow = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total
         FROM sales_transactions
         WHERE salesman_id = ? AND status IN ('pending','approved','completed')
         AND created_at >= ? AND created_at < ?`,
        [r.salesman_id, startDate, endDate]
      );

      const liveAchievedAmount = txRow?.total ?? 0;
      const finalAchieved = liveAchievedAmount > 0 ? liveAchievedAmount : (Number(r.achieved_amount) || 0);
      total_achieved += finalAchieved;

      const target = Number(r.target_amount) || 0;
      if (target > 0 && finalAchieved >= target) {
        completed_quotas++;
      } else if (r.status === "completed") {
        completed_quotas++;
      }
    }

    const total_quotas = records.length;
    const total_target = records.reduce((sum: number, r: any) => sum + (Number(r.target_amount) || 0), 0);
    const completion_rate = total_quotas > 0 ? Math.round((completed_quotas / total_quotas) * 100) : 0;

    return { total_quotas, completed_quotas, total_target, total_achieved, completion_rate };
  } catch (error) {
    console.error("Error fetching quota summary:", error);
    return { total_quotas: 0, completed_quotas: 0, total_target: 0, total_achieved: 0, completion_rate: 0 };
  }
}

export async function getSalesmenForQuota(): Promise<{ id: string; name: string; email: string }[]> {
  try {
    const rows = await query(
      `SELECT u.id, u.full_name, u.email
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('salesman', 'sales') AND u.is_active = 1
       ORDER BY u.full_name`
    );
    return rows.map((u: any) => ({ id: u.id, name: u.full_name, email: u.email }));
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    // Fallback: query by role_id 3 directly
    try {
      const rows = await query(
        "SELECT id, full_name, email FROM users WHERE role_id = 3 AND is_active = 1 ORDER BY full_name"
      );
      return rows.map((u: any) => ({ id: u.id, name: u.full_name, email: u.email }));
    } catch {
      return [];
    }
  }
}