"use server";
import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { notifyRole, createNotification } from "@/app/actions/notifications";
import pool from "@/lib/db";

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

export async function getSalesTransactions(): Promise<SalesTransactionRow[]> {
  try {
    const rows = await query(
      `SELECT st.id, st.status, st.total_amount, st.notes, st.created_at,
              c.store_name as customer_name, u.full_name as salesman_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u ON st.salesman_id = u.id
       ORDER BY st.created_at DESC`
    );

    return rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      total_amount: row.total_amount,
      notes: row.notes,
      created_at: row.created_at,
      customers: row.customer_name ? { store_name: row.customer_name } : null,
      users: row.salesman_name ? { full_name: row.salesman_name } : null,
    }));
  } catch {
    return [];
  }
}

export async function getSaleDetails(id: string): Promise<SaleDetail | null> {
  try {
    const transaction = await queryOne(
      `SELECT st.id, st.status, st.total_amount, st.notes, st.created_at,
              c.store_name as customer_name, u.full_name as salesman_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u ON st.salesman_id = u.id
       WHERE st.id = ?`,
      [id]
    );

    if (!transaction) return null;

    const items = await query(
      `SELECT sti.id, sti.quantity, sti.unit_price, sti.total_price as subtotal,
              p.name as variant_name, p.id as variant_sku
       FROM transaction_items sti
       LEFT JOIN products p ON sti.product_id = p.id
       WHERE sti.transaction_id = ?`,
      [id]
    );

    return {
      id: transaction.id,
      status: transaction.status,
      total_amount: transaction.total_amount,
      notes: transaction.notes,
      created_at: transaction.created_at,
      customers: transaction.customer_name ? { store_name: transaction.customer_name } : null,
      users: transaction.salesman_name ? { full_name: transaction.salesman_name } : null,
      sales_transaction_items: items.map((item: any) => ({
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
    const rows = await query(
      `SELECT st.id, st.status, st.total_amount, st.created_at,
              c.store_name as customer_name, u.full_name as salesman_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u ON st.salesman_id = u.id
       ORDER BY st.created_at DESC`
    );

    if (!rows || rows.length === 0) return "";

    const headers = ["Transaction ID", "Date", "Customer", "Sales Rep", "Total Amount", "Status"];
    const csvRows = rows.map((t: any) => [
      t.id,
      new Date(t.created_at).toLocaleDateString(),
      t.customer_name ?? "N/A",
      t.salesman_name ?? "N/A",
      t.total_amount ?? 0,
      t.status,
    ]);

    return [headers.join(","), ...csvRows.map((r: any) => r.join(","))].join("\n");
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

export async function createBooking(input: CreateBookingInput) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, salesman_id, notes, items } = input;
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const transactionId = generateUUID();

    // 1. Create the sales transaction record
    await connection.execute(
      `INSERT INTO sales_transactions (id, customer_id, salesman_id, total_amount, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [transactionId, customer_id, salesman_id, total_amount, notes || null]
    );

    // 2. Insert transaction items and deduct inventory
    for (const item of items) {
      await connection.execute(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.variant_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );

      // Deduct inventory via product directly
      await connection.execute(
        `UPDATE products
         SET total_cases = total_cases - ?
         WHERE id = ?`,
        [item.quantity, item.variant_id]
      );
    }

    await connection.commit();

    // 3. Dispatch Notifications (outside transaction)
    await notifyRole("admin", "New Order Created", `A new order has been placed by Salesman.`);
    await notifyRole("supervisor", "New Order Created", `A new order has been placed by Salesman.`);

    // 4. Clear caches
    revalidatePath("/salesman/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/notifications");
    revalidatePath("/sales");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/catalog/products");
    revalidatePath("/supervisor/catalog/products");

    return { success: true, data: { id: transactionId } };
  } catch (error: any) {
    await connection.rollback();
    console.error("createBooking error:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function getAllBookings() {
  try {
    const transactions = await query(
      `SELECT st.*, c.store_name as customer_name, u.full_name as salesman_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u ON st.salesman_id = u.id
       ORDER BY st.created_at DESC`
    );

    if (!transactions || transactions.length === 0) return [];

    const transactionIds = transactions.map((t: any) => t.id);

    // Fetch all items for these transactions
    let allItems: any[] = [];
    if (transactionIds.length > 0) {
      const placeholders = transactionIds.map(() => '?').join(',');
      allItems = await query(
        `SELECT sti.id, sti.transaction_id, sti.product_id as variant_id, sti.quantity, sti.unit_price, sti.total_price as subtotal, 
                p.name as variant_name, p.id as variant_sku
         FROM transaction_items sti
         LEFT JOIN products p ON sti.product_id = p.id
         WHERE sti.transaction_id IN (${placeholders})`,
        transactionIds
      );
    }

    const itemsMap = new Map<string, any[]>();
    for (const item of allItems) {
      if (!itemsMap.has(item.transaction_id)) itemsMap.set(item.transaction_id, []);
      itemsMap.get(item.transaction_id)!.push({
        ...item,
        product_variants: item.variant_name ? { name: item.variant_name, sku: item.variant_sku } : null,
      });
    }

    return transactions.map((t: any) => ({
      id: t.id,
      customer_id: t.customer_id,
      salesman_id: t.salesman_id,
      status: t.status,
      total_amount: t.total_amount,
      notes: t.notes,
      created_at: t.created_at,
      updated_at: t.updated_at,
      customers: t.customer_name ? { store_name: t.customer_name } : null,
      users: t.salesman_name ? { full_name: t.salesman_name } : null,
      sales_transaction_items: itemsMap.get(t.id) || [],
    }));
  } catch (error: any) {
    console.error("getAllBookings error:", error);
    return [];
  }
}

export async function updateBookingStatus(transactionId: string, status: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log(`[Inventory] Updating transaction ${transactionId} to ${status}`);

    // 1. Fetch current status
    const [currentRows] = await connection.execute(
      "SELECT status, salesman_id FROM sales_transactions WHERE id = ?",
      [transactionId]
    );
    const currentTx = (currentRows as any[])[0];
    if (!currentTx) throw new Error("Transaction not found");

    console.log(`[Inventory] Current status is: ${currentTx.status}`);

    // 2. Update status
    await connection.execute(
      "UPDATE sales_transactions SET status = ? WHERE id = ?",
      [status, transactionId]
    );

    // Notify the Salesman
    if (currentTx.salesman_id && currentTx.status !== status) {
      await createNotification(
        currentTx.salesman_id,
        "Order Status Updated",
        `Your order has been updated to: ${status.toUpperCase()}.`,
        status === "cancelled" ? "warning" : "success"
      );
    }

    // INVENTORY RESTORATION on CANCEL
    const isNowCancelled = status.toLowerCase() === "cancelled";
    const wasAlreadyCancelled = currentTx.status?.toLowerCase() === "cancelled";

    if (isNowCancelled && !wasAlreadyCancelled) {
      console.log(`[Inventory] Status changed to CANCELLED. Restoring deduction...`);

      const [itemRows] = await connection.execute(
        "SELECT product_id as variant_id, quantity FROM transaction_items WHERE transaction_id = ?",
        [transactionId]
      );

      for (const item of (itemRows as any[])) {
        // Restore stock directly to product
        await connection.execute(
          `UPDATE products
           SET total_cases = total_cases + ?
           WHERE id = ?`,
          [item.quantity, item.variant_id]
        );
        console.log(`[Inventory] Restored ${item.quantity} cases for product ${item.variant_id}.`);
      }
    }

    await connection.commit();

    // Clear caches
    revalidatePath("/bookings");
    revalidatePath("/sales");
    revalidatePath("/notifications");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/orders");
    revalidatePath("/salesman/bookings");
    revalidatePath("/admin/catalog/products");
    revalidatePath("/supervisor/catalog/products");

    console.log(`[Inventory] Update process finished for ${transactionId}`);
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("[Inventory] CRITICAL ERROR in updateBookingStatus:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function recordPayment(transactionId: string, amount: number, method: string = 'cash') {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get current transaction
    const [rows] = await connection.execute(
      "SELECT total_amount, payment_status FROM sales_transactions WHERE id = ?",
      [transactionId]
    );
    const tx = (rows as any[])[0];
    if (!tx) throw new Error("Transaction not found");

    // 2. Update payment status
    // Simple logic: if payment >= total, mark as paid. Otherwise partial.
    const newStatus = amount >= Number(tx.total_amount) ? 'paid' : 'partial';

    await connection.execute(
      "UPDATE sales_transactions SET payment_status = ? WHERE id = ?",
      [newStatus, transactionId]
    );

    // 3. (Optional) Create a specific record in an audit log or payments table if you create one later

    await connection.commit();
    revalidatePath("/admin/sales");
    revalidatePath("/sales");
    revalidatePath("/buyer/dashboard");
    
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("recordPayment error:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
