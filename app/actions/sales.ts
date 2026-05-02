"use server";
import { query, queryOne, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { notifyRole, createNotification } from "@/app/actions/notifications";
import pool from "@/lib/db";
import { getSalesItemConfig, getSalesItemJoinConfig } from "@/lib/sales-schema";

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
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) return [];
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
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) return null;

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

    const itemConfig = await getSalesItemConfig();
    let items: any[] = [];
    if (itemConfig) {
      const joinConfig = await getSalesItemJoinConfig(itemConfig.variantColumn);
      items = await query(
        `SELECT sti.id, sti.quantity, sti.unit_price, sti.${itemConfig.subtotalColumn} as subtotal,
                ${joinConfig.nameSelect} as variant_name, ${joinConfig.skuSelect} as variant_sku
         FROM ${itemConfig.table} sti
         ${joinConfig.join}
         WHERE sti.transaction_id = ?`,
        [id]
      );
    }

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
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) return "";
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
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) {
      return { success: false, error: "sales_transactions table is missing." };
    }

    const itemConfig = await getSalesItemConfig();
    if (!itemConfig) {
      return { success: false, error: "Sales items table is missing." };
    }

    const productColumns = await getTableColumns("products");
    const hasTotalCases = productColumns.includes("total_cases");
    const hasProductVariants = (await getTableColumns("product_variants")).length > 0;

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
      const subtotal = item.quantity * item.unit_price;
      const columns = ["transaction_id", itemConfig.variantColumn, "quantity", "unit_price", itemConfig.subtotalColumn];
      const values: any[] = [transactionId, item.variant_id, item.quantity, item.unit_price, subtotal];

      if (itemConfig.requiresId) {
        columns.unshift("id");
        values.unshift(generateUUID());
      }

      const placeholders = columns.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO ${itemConfig.table} (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );

      // Deduct inventory via product directly
      if (hasTotalCases) {
        let productId = item.variant_id;
        if (itemConfig.variantColumn === "variant_id" && hasProductVariants) {
          const [rows] = await connection.execute(
            "SELECT product_id FROM product_variants WHERE id = ?",
            [item.variant_id]
          );
          const row = (rows as any[])[0];
          if (!row?.product_id) {
            throw new Error("Product variant not found for inventory update.");
          }
          productId = row.product_id;
        }

        await connection.execute(
          `UPDATE products
           SET total_cases = total_cases - ?
           WHERE id = ?`,
          [item.quantity, productId]
        );
      }
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
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) return [];
    const itemConfig = await getSalesItemConfig();
    const joinConfig = itemConfig ? await getSalesItemJoinConfig(itemConfig.variantColumn) : null;
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
    if (transactionIds.length > 0 && itemConfig && joinConfig) {
      const placeholders = transactionIds.map(() => '?').join(',');
      allItems = await query(
        `SELECT sti.id, sti.transaction_id, sti.${itemConfig.variantColumn} as variant_id,
                sti.quantity, sti.unit_price, sti.${itemConfig.subtotalColumn} as subtotal,
                ${joinConfig.nameSelect} as variant_name, ${joinConfig.skuSelect} as variant_sku
         FROM ${itemConfig.table} sti
         ${joinConfig.join}
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
    const itemConfig = await getSalesItemConfig();
    const hasProductVariants = (await getTableColumns("product_variants")).length > 0;
    const productColumns = await getTableColumns("products");
    const hasTotalCases = productColumns.includes("total_cases");

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

      const itemsQuery = itemConfig
        ? `SELECT ${itemConfig.variantColumn} as variant_id, quantity FROM ${itemConfig.table} WHERE transaction_id = ?`
        : null;
      const [itemRows] = itemsQuery
        ? await connection.execute(itemsQuery, [transactionId])
        : [[], []];

      for (const item of (itemRows as any[])) {
        if (!hasTotalCases) continue;
        let productId = item.variant_id;
        if (itemConfig?.variantColumn === "variant_id" && hasProductVariants) {
          const [rows] = await connection.execute(
            "SELECT product_id FROM product_variants WHERE id = ?",
            [item.variant_id]
          );
          const row = (rows as any[])[0];
          if (!row?.product_id) {
            throw new Error("Product variant not found for inventory restore.");
          }
          productId = row.product_id;
        }

        // Restore stock directly to product
        await connection.execute(
          `UPDATE products
           SET total_cases = total_cases + ?
           WHERE id = ?`,
          [item.quantity, productId]
        );
        console.log(`[Inventory] Restored ${item.quantity} cases for product ${productId}.`);
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
