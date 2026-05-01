
"use server";

import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

export interface BuyerRequestItem {
  product_id: string;
  quantity: number;
}

/**
 * Buyer submits a product request list
 */
export async function submitBuyerRequest(items: BuyerRequestItem[]) {
  const session = await getSession();
  if (!session || !session.user.linked_customer_id) return { error: "Unauthorized" };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const requestId = generateUUID();
    const customerId = session.user.linked_customer_id;

    // 1. Create request header
    await connection.execute(
      "INSERT INTO buyer_requests (id, customer_id, status) VALUES (?, ?, 'pending')",
      [requestId, customerId]
    );

    // 2. Create request items
    for (const item of items) {
      await connection.execute(
        "INSERT INTO buyer_request_items (id, request_id, product_id, quantity) VALUES (?, ?, ?, ?)",
        [generateUUID(), requestId, item.product_id, item.quantity]
      );
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

    // 3. Move items to transaction_items
    for (const item of items) {
      // Get product price
      const prod = await queryOne("SELECT packaging_price FROM products WHERE id = ?", [item.product_id]);
      const price = Number(prod?.packaging_price) || 0;

      await connection.execute(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.product_id, item.quantity, price, price * item.quantity]
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
