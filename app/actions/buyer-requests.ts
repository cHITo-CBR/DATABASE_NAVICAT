
"use server";

import { query, queryOne, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { getSalesItemConfig } from "@/lib/sales-schema";

export interface BuyerRequestItem {
  product_id: string;
  quantity: number;
  unit_price?: number;
}

/**
 * Buyer submits a product request list
 */
export async function submitBuyerRequest(items: BuyerRequestItem[], options?: { deductStock?: boolean }) {
  const session = await getSession();
  if (!session || session.user.role !== "buyer") return { error: "Unauthorized" };
  const customerId = session.user.linked_customer_id || session.user.customer_id;
  if (!customerId) return { error: "No customer profile linked." };
  if (!items || items.length === 0) return { error: "No items provided." };

  const connection = await pool.getConnection();
  try {
    const requestId = generateUUID();
    const requestColumns = await getTableColumns("buyer_requests");
    if (requestColumns.length === 0) return { error: "buyer_requests table is missing." };
    const itemColumns = await getTableColumns("buyer_request_items");
    if (itemColumns.length === 0) return { error: "buyer_request_items table is missing." };

    const productColumns = await getTableColumns("products");
    const hasTotalCases = productColumns.includes("total_cases");
    const hasAssignedSalesman = (await getTableColumns("customers")).includes("assigned_salesman_id");

    // 1. Create request header
    const requestInsertColumns: string[] = ["id"];
    const requestValues: any[] = [requestId];

    if (requestColumns.includes("status")) {
      requestInsertColumns.push("status");
      requestValues.push("pending");
    }

    if (requestColumns.includes("customer_id")) {
      requestInsertColumns.push("customer_id");
      requestValues.push(customerId);
    }

    if (requestColumns.includes("buyer_id")) {
      requestInsertColumns.push("buyer_id");
      requestValues.push(session.user.id);
    }

    if (requestColumns.includes("salesman_id") && hasAssignedSalesman) {
      const assigned = await queryOne<{ assigned_salesman_id: string | null }>(
        "SELECT assigned_salesman_id FROM customers WHERE id = ?",
        [customerId]
      );
      requestInsertColumns.push("salesman_id");
      requestValues.push(assigned?.assigned_salesman_id ?? null);
    }

    const productIds = items.map((item) => item.product_id);
    let productPriceMap = new Map<string, number>();
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(",");
      const rows = await query(
        `SELECT id, packaging_price FROM products WHERE id IN (${placeholders})`,
        productIds
      );
      productPriceMap = new Map(rows.map((row: any) => [row.id, Number(row.packaging_price) || 0]));
    }

    const totalAmount = items.reduce((sum, item) => {
      const price = item.unit_price ?? productPriceMap.get(item.product_id) ?? 0;
      return sum + price * item.quantity;
    }, 0);

    if (requestColumns.includes("total_amount")) {
      requestInsertColumns.push("total_amount");
      requestValues.push(totalAmount);
    }

    await connection.beginTransaction();

    const requestPlaceholders = requestInsertColumns.map(() => "?").join(", ");
    await connection.execute(
      `INSERT INTO buyer_requests (${requestInsertColumns.join(", ")}) VALUES (${requestPlaceholders})`,
      requestValues
    );

    // 2. Create request items
    for (const item of items) {
      const price = item.unit_price ?? productPriceMap.get(item.product_id) ?? 0;
      const itemInsertColumns: string[] = ["request_id", "product_id", "quantity"];
      const itemValues: any[] = [requestId, item.product_id, item.quantity];

      if (itemColumns.includes("id")) {
        itemInsertColumns.unshift("id");
        itemValues.unshift(generateUUID());
      }

      if (itemColumns.includes("unit_price")) {
        itemInsertColumns.push("unit_price");
        itemValues.push(price);
      }

      const itemPlaceholders = itemInsertColumns.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO buyer_request_items (${itemInsertColumns.join(", ")}) VALUES (${itemPlaceholders})`,
        itemValues
      );

      if (options?.deductStock && hasTotalCases) {
        await connection.execute(
          "UPDATE products SET total_cases = total_cases - ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.commit();
    revalidatePath("/buyer/requests");
    revalidatePath("/admin/buyer-requests");
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("submitBuyerRequest error:", error);
    return { error: "Failed to submit request." };
  } finally {
    connection.release();
  }
}

/**
 * Fetch all pending requests for Admin
 */
export async function getAllBuyerRequests() {
  try {
    const rows = await query(`
      SELECT br.*, c.store_name, c.contact_person
      FROM buyer_requests br
      JOIN customers c ON br.customer_id = c.id
      ORDER BY br.created_at DESC
    `);
    
    // Fetch items for each
    const requestsWithItems = await Promise.all(rows.map(async (br: any) => {
      const items = await query(`
        SELECT bri.*, p.name as product_name
        FROM buyer_request_items bri
        JOIN products p ON bri.product_id = p.id
        WHERE bri.request_id = ?
      `, [br.id]);
      return { ...br, items };
    }));

    return requestsWithItems;
  } catch (error) {
    console.error("getAllBuyerRequests error:", error);
    return [];
  }
}

/**
 * Admin approves a request, converting it to a pending sales transaction
 */
export async function approveBuyerRequest(requestId: string) {
  const connection = await pool.getConnection();
  try {
    const salesColumns = await getTableColumns("sales_transactions");
    if (salesColumns.length === 0) {
      return { error: "sales_transactions table is missing." };
    }
    const itemConfig = await getSalesItemConfig();
    if (!itemConfig) {
      return { error: "Sales items table is missing." };
    }
    const hasProductVariants = (await getTableColumns("product_variants")).length > 0;

    await connection.beginTransaction();

    // 1. Get request details
    const request = await queryOne("SELECT * FROM buyer_requests WHERE id = ?", [requestId]);
    if (!request) throw new Error("Request not found");

    const items = await query("SELECT * FROM buyer_request_items WHERE request_id = ?", [requestId]);

    // 2. Create Sales Transaction
    const transactionId = generateUUID();
    
    // We need a salesman ID. For now, let's assign to the salesman assigned to the customer or null
    const customer = await queryOne("SELECT assigned_salesman_id FROM customers WHERE id = ?", [request.customer_id]);
    const salesmanId = customer?.assigned_salesman_id || '00000000-0000-0000-0000-000000000000';

    await connection.execute(
      `INSERT INTO sales_transactions (id, salesman_id, customer_id, status, is_buyer_initiated) 
       VALUES (?, ?, ?, 'pending', 1)`,
      [transactionId, salesmanId, request.customer_id]
    );

    // 3. Move items to sales items table
    for (const item of items) {
      let variantId = item.product_id;
      let price = 0;

      if (itemConfig.variantColumn === "variant_id" && hasProductVariants) {
        const variant = await queryOne(
          "SELECT id, unit_price FROM product_variants WHERE product_id = ? ORDER BY is_active DESC, created_at ASC LIMIT 1",
          [item.product_id]
        );
        if (!variant?.id) {
          throw new Error("No variant found for requested product.");
        }
        variantId = variant.id;
        price = Number(variant.unit_price) || 0;
      } else {
        const prod = await queryOne("SELECT packaging_price FROM products WHERE id = ?", [item.product_id]);
        price = Number(prod?.packaging_price) || 0;
      }

      const subtotal = price * item.quantity;
      const columns = ["transaction_id", itemConfig.variantColumn, "quantity", "unit_price", itemConfig.subtotalColumn];
      const values: any[] = [transactionId, variantId, item.quantity, price, subtotal];

      if (itemConfig.requiresId) {
        columns.unshift("id");
        values.unshift(generateUUID());
      }

      const placeholders = columns.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO ${itemConfig.table} (${columns.join(", ")})
         VALUES (${placeholders})`,
        values
      );
    }

    // 4. Update request status
    await connection.execute("UPDATE buyer_requests SET status = 'processed' WHERE id = ?", [requestId]);

    await connection.commit();
    revalidatePath("/admin/buyer-requests");
    revalidatePath("/admin/sales");
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("approveBuyerRequest error:", error);
    return { error: error.message };
  } finally {
    connection.release();
  }
}
