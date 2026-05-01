"use server";
import { query, execute, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { notifyRole } from "@/app/actions/notifications";

export interface CreateStoreVisitInput {
  customer_id: string;
  salesman_id: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export async function createStoreVisit(input: CreateStoreVisitInput) {
  try {
    const visitId = generateUUID();
    await execute(
      `INSERT INTO store_visits (id, customer_id, salesman_id, notes, latitude, longitude, visit_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [visitId, input.customer_id, input.salesman_id, input.notes || null,
       input.latitude ?? null, input.longitude ?? null]
    );

    await notifyRole("supervisor", "New Store Visit Logged", `A salesman has logged a new store visit.`);

    revalidatePath("/salesman/dashboard");
    revalidatePath("/notifications");
    revalidatePath("/salesman/visits");
    return { success: true, data: { id: visitId } };
  } catch (error: any) {
    console.error("createStoreVisit error:", error);
    return { success: false, error: error.message };
  }
}

export async function getSalesmanVisits(salesmanId: string) {
  try {
    const rows = await query(
      `SELECT sv.*, c.store_name, c.address
       FROM store_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       WHERE sv.salesman_id = ?
       ORDER BY sv.visit_date DESC`,
      [salesmanId]
    );

    return {
      success: true,
      data: rows.map((v: any) => ({
        ...v,
        customers: v.store_name ? { store_name: v.store_name, address: v.address } : null,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
