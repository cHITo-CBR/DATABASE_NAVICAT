"use server";
import { query, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
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
    const columns = await getTableColumns("store_visits");
    if (columns.length === 0) {
      return { success: false, error: "store_visits table is missing." };
    }

    const visitId = generateUUID();
    const insertColumns = ["id", "customer_id", "salesman_id", "notes", "visit_date"];
    const insertValues: any[] = [
      visitId,
      input.customer_id,
      input.salesman_id,
      input.notes || null,
      new Date(),
    ];

    if (columns.includes("latitude")) {
      insertColumns.push("latitude");
      insertValues.push(input.latitude ?? null);
    }

    if (columns.includes("longitude")) {
      insertColumns.push("longitude");
      insertValues.push(input.longitude ?? null);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    await execute(
      `INSERT INTO store_visits (${insertColumns.join(", ")}) VALUES (${placeholders})`,
      insertValues
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
    const columns = await getTableColumns("store_visits");
    if (columns.length === 0) {
      return { success: false, error: "store_visits table is missing." };
    }
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
