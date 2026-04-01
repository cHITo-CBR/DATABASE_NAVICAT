"use server";

import { query, queryOne, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

export interface SalesTransactionRow {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customers: { store_name: string } | null;
  users: { full_name: string } | null;
}

export interface SaleDetailItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_variants: { name: string; sku: string | null } | null;
}

export interface SaleDetail {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customers: { store_name: string } | null;
  users: { full_name: string } | null;
  sales_transaction_items: SaleDetailItem[];
}

interface SalesTransactionDbRow extends RowDataPacket {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

export async function getSalesTransactions(): Promise<SalesTransactionRow[]> {
  try {
    const rows = await query<SalesTransactionDbRow>(`
      SELECT st.id, st.status, st.total_amount, st.notes, st.created_at,
             c.store_name AS customer_store_name,
             u.full_name AS salesman_full_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u ON st.salesman_id = u.id
      ORDER BY st.created_at DESC
    `);

    return rows.map(row => ({
      id: row.id,
      status: row.status,
      total_amount: row.total_amount,
      notes: row.notes,
      created_at: row.created_at,
      customers: row.customer_store_name ? { store_name: row.customer_store_name } : null,
      users: row.salesman_full_name ? { full_name: row.salesman_full_name } : null,
    }));
  } catch {
    return [];
  }
}

interface SaleDetailDbRow extends RowDataPacket {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

interface SaleItemDbRow extends RowDataPacket {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_name: string | null;
  variant_sku: string | null;
}

export async function getSaleDetails(id: string): Promise<SaleDetail | null> {
  try {
    const transaction = await queryOne<SaleDetailDbRow>(`
      SELECT st.id, st.status, st.total_amount, st.notes, st.created_at,
             c.store_name AS customer_store_name,
             u.full_name AS salesman_full_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u ON st.salesman_id = u.id
      WHERE st.id = ?
    `, [id]);

    if (!transaction) return null;

    const items = await query<SaleItemDbRow>(`
      SELECT sti.id, sti.quantity, sti.unit_price, sti.subtotal,
             pv.name AS variant_name, pv.sku AS variant_sku
      FROM sales_transaction_items sti
      LEFT JOIN product_variants pv ON sti.variant_id = pv.id
      WHERE sti.transaction_id = ?
    `, [id]);

    return {
      id: transaction.id,
      status: transaction.status,
      total_amount: transaction.total_amount,
      notes: transaction.notes,
      created_at: transaction.created_at,
      customers: transaction.customer_store_name ? { store_name: transaction.customer_store_name } : null,
      users: transaction.salesman_full_name ? { full_name: transaction.salesman_full_name } : null,
      sales_transaction_items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_variants: item.variant_name ? { name: item.variant_name, sku: item.variant_sku } : null,
      })),
    };
  } catch {
    return null;
  }
}

export async function exportSalesCSV(): Promise<string> {
  try {
    const rows = await query<SalesTransactionDbRow>(`
      SELECT st.id, st.status, st.total_amount, st.created_at,
             c.store_name AS customer_store_name,
             u.full_name AS salesman_full_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u ON st.salesman_id = u.id
      ORDER BY st.created_at DESC
    `);

    if (rows.length === 0) return "";

    const headers = ["Transaction ID", "Date", "Customer", "Sales Rep", "Total Amount", "Status"];
    const csvRows = rows.map((t) => [
      t.id,
      new Date(t.created_at).toLocaleDateString(),
      t.customer_store_name ?? "N/A",
      t.salesman_full_name ?? "N/A",
      t.total_amount ?? 0,
      t.status,
    ]);

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    return csv;
  } catch {
    return "";
  }
}

export interface BookingItemInput {
  variant_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateBookingInput {
  customer_id: string;
  salesman_id: string;
  notes?: string;
  items: BookingItemInput[];
}

/**
 * Creates a new booking (sales transaction) and its items.
 */
export async function createBooking(input: CreateBookingInput) {
  try {
    const { customer_id, salesman_id, notes, items } = input;
    
    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Generate UUID for the transaction
    const transactionId = generateUUID();

    // 1. Insert transaction header
    await query(`
      INSERT INTO sales_transactions (id, customer_id, salesman_id, total_amount, notes, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [transactionId, customer_id, salesman_id, total_amount, notes || null, "pending"]);

    // 2. Insert transaction items
    if (items.length > 0) {
      for (const item of items) {
        const itemId = generateUUID();
        await query(`
          INSERT INTO sales_transaction_items (id, transaction_id, variant_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [itemId, transactionId, item.variant_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
      }
    }

    revalidatePath("/salesman/dashboard");
    revalidatePath("/sales"); // For admin dashboard
    return { success: true, data: { id: transactionId } };
  } catch (error: any) {
    console.error("createBooking error:", error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════
// ADMIN ACTIONS
// ═══════════════════════════════════════════

interface BookingDbRow extends RowDataPacket {
  id: string;
  customer_id: string;
  salesman_id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

interface BookingItemDbRow extends RowDataPacket {
  id: string;
  transaction_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_name: string | null;
  variant_sku: string | null;
}

/**
 * Fetches ALL bookings for admin management.
 */
export async function getAllBookings() {
  try {
    const transactions = await query<BookingDbRow>(`
      SELECT st.*, c.store_name AS customer_store_name, u.full_name AS salesman_full_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u ON st.salesman_id = u.id
      ORDER BY st.created_at DESC
    `);

    // Fetch all items for all transactions
    const transactionIds = transactions.map(t => t.id);
    let itemsMap: Map<string, BookingItemDbRow[]> = new Map();
    
    if (transactionIds.length > 0) {
      const placeholders = transactionIds.map(() => '?').join(',');
      const items = await query<BookingItemDbRow>(`
        SELECT sti.*, pv.name AS variant_name, pv.sku AS variant_sku
        FROM sales_transaction_items sti
        LEFT JOIN product_variants pv ON sti.variant_id = pv.id
        WHERE sti.transaction_id IN (${placeholders})
      `, transactionIds);

      for (const item of items) {
        if (!itemsMap.has(item.transaction_id)) {
          itemsMap.set(item.transaction_id, []);
        }
        itemsMap.get(item.transaction_id)!.push(item);
      }
    }

    return transactions.map(t => ({
      id: t.id,
      customer_id: t.customer_id,
      salesman_id: t.salesman_id,
      status: t.status,
      total_amount: t.total_amount,
      notes: t.notes,
      created_at: t.created_at,
      updated_at: t.updated_at,
      customers: t.customer_store_name ? { store_name: t.customer_store_name } : null,
      users: t.salesman_full_name ? { full_name: t.salesman_full_name } : null,
      sales_transaction_items: (itemsMap.get(t.id) || []).map(item => ({
        id: item.id,
        transaction_id: item.transaction_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_variants: item.variant_name ? { name: item.variant_name, sku: item.variant_sku } : null,
      })),
    }));
  } catch (error: any) {
    console.error("getAllBookings error:", error);
    return [];
  }
}

/**
 * Updates a booking/transaction status.
 */
export async function updateBookingStatus(transactionId: string, status: string) {
  try {
    await query(`
      UPDATE sales_transactions SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, transactionId]);

    revalidatePath("/bookings");
    revalidatePath("/sales");
    revalidatePath("/salesman/bookings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
