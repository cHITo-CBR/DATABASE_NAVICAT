"use server";

import { query, queryOne, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

export interface BuyerRequestItemInput {
  product_id: string;
  quantity: number;
  notes?: string;
}

export interface CreateBuyerRequestInput {
  salesman_id: string;
  customer_id: string;
  notes?: string;
  items: BuyerRequestItemInput[];
}

/**
 * Creates a new buyer request and its items.
 */
export async function createBuyerRequest(input: CreateBuyerRequestInput) {
  try {
    const { salesman_id, customer_id, notes, items } = input;
    const requestId = generateUUID();

    // 1. Create request header
    await query(`
      INSERT INTO buyer_requests (id, salesman_id, customer_id, notes, status)
      VALUES (?, ?, ?, ?, ?)
    `, [requestId, salesman_id, customer_id, notes || null, "pending"]);

    // 2. Insert items
    if (items.length > 0) {
      for (const item of items) {
        const itemId = generateUUID();
        await query(`
          INSERT INTO buyer_request_items (id, request_id, product_id, quantity, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [itemId, requestId, item.product_id, item.quantity, item.notes || null]);
      }
    }

    revalidatePath("/salesman/dashboard");
    revalidatePath("/salesman/requests");
    return { success: true, data: { id: requestId } };
  } catch (error: any) {
    console.error("createBuyerRequest error:", error);
    return { success: false, error: error.message };
  }
}

interface BuyerRequestDbRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

interface BuyerRequestItemDbRow extends RowDataPacket {
  id: string;
  request_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  product_name: string | null;
}

/**
 * Fetches buyer requests for a salesman.
 */
export async function getSalesmanBuyerRequests(salesmanId: string) {
  try {
    const requests = await query<BuyerRequestDbRow>(`
      SELECT br.*, c.store_name AS customer_store_name
      FROM buyer_requests br
      LEFT JOIN customers c ON br.customer_id = c.id
      WHERE br.salesman_id = ?
      ORDER BY br.created_at DESC
    `, [salesmanId]);

    // Fetch items for each request
    const requestIds = requests.map(r => r.id);
    let itemsMap: Map<string, any[]> = new Map();

    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const items = await query<BuyerRequestItemDbRow>(`
        SELECT bri.*, p.name AS product_name
        FROM buyer_request_items bri
        LEFT JOIN products p ON bri.product_id = p.id
        WHERE bri.request_id IN (${placeholders})
      `, requestIds);

      for (const item of items) {
        if (!itemsMap.has(item.request_id)) {
          itemsMap.set(item.request_id, []);
        }
        itemsMap.get(item.request_id)!.push({
          ...item,
          products: item.product_name ? { name: item.product_name } : null,
        });
      }
    }

    const data = requests.map(r => ({
      ...r,
      customers: r.customer_store_name ? { store_name: r.customer_store_name } : null,
      buyer_request_items: itemsMap.get(r.id) || [],
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════
// ADMIN ACTIONS
// ═══════════════════════════════════════════

/**
 * Fetches ALL buyer requests for admin review.
 */
export async function getAllBuyerRequests() {
  try {
    const requests = await query<BuyerRequestDbRow>(`
      SELECT br.*, c.store_name AS customer_store_name, u.full_name AS salesman_full_name
      FROM buyer_requests br
      LEFT JOIN customers c ON br.customer_id = c.id
      LEFT JOIN users u ON br.salesman_id = u.id
      ORDER BY br.created_at DESC
    `);

    // Fetch items for each request
    const requestIds = requests.map(r => r.id);
    let itemsMap: Map<string, any[]> = new Map();

    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const items = await query<BuyerRequestItemDbRow>(`
        SELECT bri.*, p.name AS product_name
        FROM buyer_request_items bri
        LEFT JOIN products p ON bri.product_id = p.id
        WHERE bri.request_id IN (${placeholders})
      `, requestIds);

      for (const item of items) {
        if (!itemsMap.has(item.request_id)) {
          itemsMap.set(item.request_id, []);
        }
        itemsMap.get(item.request_id)!.push({
          ...item,
          products: item.product_name ? { name: item.product_name } : null,
        });
      }
    }

    return requests.map(r => ({
      ...r,
      customers: r.customer_store_name ? { store_name: r.customer_store_name } : null,
      users: r.salesman_full_name ? { full_name: r.salesman_full_name } : null,
      buyer_request_items: itemsMap.get(r.id) || [],
    }));
  } catch (error: any) {
    console.error("getAllBuyerRequests error:", error);
    return [];
  }
}

/**
 * Updates a buyer request status (fulfill/reject).
 */
export async function updateBuyerRequestStatus(requestId: string, status: string) {
  try {
    await query(`
      UPDATE buyer_requests SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, requestId]);

    revalidatePath("/buyer-requests");
    revalidatePath("/salesman/requests");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
