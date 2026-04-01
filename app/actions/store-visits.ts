"use server";

import { query, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

export interface CreateStoreVisitInput {
  customer_id: string;
  salesman_id: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Records a new store visit.
 */
export async function createStoreVisit(input: CreateStoreVisitInput) {
  try {
    const visitId = generateUUID();
    const { customer_id, salesman_id, notes, latitude, longitude } = input;

    await query(`
      INSERT INTO store_visits (id, customer_id, salesman_id, notes, latitude, longitude, visit_date)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [visitId, customer_id, salesman_id, notes || null, latitude ?? null, longitude ?? null]);

    revalidatePath("/salesman/dashboard");
    revalidatePath("/salesman/visits");
    return { success: true, data: { id: visitId } };
  } catch (error: any) {
    console.error("createStoreVisit error:", error);
    return { success: false, error: error.message };
  }
}

interface VisitDbRow extends RowDataPacket {
  id: string;
  customer_id: string;
  salesman_id: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  visit_date: string;
  created_at: string;
  customer_store_name: string | null;
  customer_address: string | null;
}

/**
 * Gets visits for a specific salesman.
 */
export async function getSalesmanVisits(salesmanId: string) {
  try {
    const visits = await query<VisitDbRow>(`
      SELECT sv.*, c.store_name AS customer_store_name, c.address AS customer_address
      FROM store_visits sv
      LEFT JOIN customers c ON sv.customer_id = c.id
      WHERE sv.salesman_id = ?
      ORDER BY sv.visit_date DESC
    `, [salesmanId]);

    const data = visits.map(v => ({
      ...v,
      customers: v.customer_store_name ? { store_name: v.customer_store_name, address: v.customer_address } : null,
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
