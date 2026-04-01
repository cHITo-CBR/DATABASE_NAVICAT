"use server";

import { query, queryOne, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

export type CallsheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface CallsheetItemInput {
  product_id: string;
  packing?: string;
  p3?: number;
  ig?: number;
  inventory_cs?: number;
  inventory_pcs?: number;
  suggested_order?: number;
  final_order?: number;
  actual?: number;
}

export interface CreateCallsheetInput {
  salesman_id: string;
  customer_id: string;
  visit_date: string;
  period_start?: string;
  period_end?: string;
  round_number?: number;
  remarks?: string;
  items: CallsheetItemInput[];
}

/**
 * Creates a new callsheet and its associated items.
 */
export async function createCallsheet(input: CreateCallsheetInput) {
  try {
    const { salesman_id, customer_id, visit_date, period_start, period_end, round_number, remarks, items } = input;

    const callsheetId = generateUUID();

    // 1. Create the callsheet header
    await query(`
      INSERT INTO callsheets (id, salesman_id, customer_id, visit_date, period_start, period_end, round_number, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [callsheetId, salesman_id, customer_id, visit_date, period_start || null, period_end || null, round_number || null, remarks || null, "draft"]);

    // 2. Insert items
    if (items.length > 0) {
      for (const item of items) {
        const itemId = generateUUID();
        await query(`
          INSERT INTO callsheet_items (id, callsheet_id, product_id, packing, p3, ig, inventory_cs, inventory_pcs, suggested_order, final_order, actual)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          itemId, callsheetId, item.product_id, item.packing || null,
          item.p3 ?? null, item.ig ?? null, item.inventory_cs ?? null, item.inventory_pcs ?? null,
          item.suggested_order ?? null, item.final_order ?? null, item.actual ?? null
        ]);
      }
    }

    revalidatePath("/salesman/callsheets");
    return { success: true, data: { id: callsheetId } };
  } catch (error: any) {
    console.error("createCallsheet error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Submits a draft callsheet for approval.
 */
export async function submitCallsheet(callsheetId: string) {
  try {
    await query(`
      UPDATE callsheets SET status = ?, updated_at = NOW() WHERE id = ?
    `, ["submitted", callsheetId]);

    revalidatePath("/salesman/dashboard");
    revalidatePath("/salesman/callsheets");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface CallsheetDbRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  visit_date: string;
  period_start: string | null;
  period_end: string | null;
  round_number: number | null;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_store_name: string | null;
}

interface CallsheetItemDbRow extends RowDataPacket {
  id: string;
  callsheet_id: string;
  product_id: string;
  packing: string | null;
  p3: number | null;
  ig: number | null;
  inventory_cs: number | null;
  inventory_pcs: number | null;
  suggested_order: number | null;
  final_order: number | null;
  actual: number | null;
}

/**
 * Fetches callsheets for a specific salesman.
 */
export async function getSalesmanCallsheets(salesmanId: string) {
  try {
    const rows = await query<CallsheetDbRow>(`
      SELECT cs.*, c.store_name AS customer_store_name
      FROM callsheets cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.salesman_id = ?
      ORDER BY cs.created_at DESC
    `, [salesmanId]);

    const data = rows.map(row => ({
      ...row,
      customers: row.customer_store_name ? { store_name: row.customer_store_name } : null,
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetches a single callsheet with its items.
 */
export async function getCallsheetWithItems(callsheetId: string) {
  try {
    const callsheet = await queryOne<CallsheetDbRow>(`
      SELECT cs.*, c.store_name AS customer_store_name
      FROM callsheets cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.id = ?
    `, [callsheetId]);

    if (!callsheet) {
      return { success: false, error: "Callsheet not found" };
    }

    const items = await query<CallsheetItemDbRow>(`
      SELECT * FROM callsheet_items WHERE callsheet_id = ?
    `, [callsheetId]);

    const data = {
      ...callsheet,
      customers: callsheet.customer_store_name ? { store_name: callsheet.customer_store_name } : null,
      callsheet_items: items,
    };

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════
// ADMIN ACTIONS
// ═══════════════════════════════════════════

interface CallsheetAdminDbRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  visit_date: string;
  period_start: string | null;
  period_end: string | null;
  round_number: number | null;
  remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

/**
 * Fetches ALL callsheets for admin review (with salesman and customer info).
 */
export async function getAllCallsheets() {
  try {
    const rows = await query<CallsheetAdminDbRow>(`
      SELECT cs.*, c.store_name AS customer_store_name, u.full_name AS salesman_full_name
      FROM callsheets cs
      LEFT JOIN customers c ON cs.customer_id = c.id
      LEFT JOIN users u ON cs.salesman_id = u.id
      ORDER BY cs.created_at DESC
    `);

    return rows.map(row => ({
      ...row,
      customers: row.customer_store_name ? { store_name: row.customer_store_name } : null,
      users: row.salesman_full_name ? { full_name: row.salesman_full_name } : null,
    }));
  } catch (error: any) {
    console.error("getAllCallsheets error:", error);
    return [];
  }
}

/**
 * Updates a callsheet's status (approve/reject).
 */
export async function updateCallsheetStatus(callsheetId: string, status: CallsheetStatus) {
  try {
    await query(`
      UPDATE callsheets SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, callsheetId]);

    revalidatePath("/callsheets");
    revalidatePath("/salesman/callsheets");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
