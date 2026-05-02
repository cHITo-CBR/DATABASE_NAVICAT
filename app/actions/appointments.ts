
"use server";

import { query, queryOne, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface AppointmentRow {
  id: string;
  customer_id: number;
  salesman_id: string;
  title: string;
  appointment_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  customer_name: string;
  salesman_name: string;
}

/**
 * Fetches all appointments, optionally filtered by salesman.
 */
export async function getAppointments(salesmanId?: string) {
  try {
    const columns = await getTableColumns("appointments");
    if (columns.length === 0) return [];
    const sql = `
      SELECT a.*, c.store_name as customer_name, u.full_name as salesman_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.salesman_id = u.id
      ${salesmanId ? 'WHERE a.salesman_id = ?' : ''}
      ORDER BY a.scheduled_at ASC
    `;
    const params = salesmanId ? [salesmanId] : [];
    return await query(sql, params);
  } catch (error) {
    console.error("getAppointments error:", error);
    return [];
  }
}

/**
 * Creates a new appointment/visit schedule.
 */
export async function createAppointment(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const customer_id = parseInt(formData.get("customer_id") as string);
  const salesman_id = formData.get("salesman_id") as string || session.user.id;
  const title = formData.get("title") as string;
  const appointment_type = formData.get("appointment_type") as string;
  const scheduled_at = formData.get("scheduled_at") as string;
  const notes = formData.get("notes") as string;

  if (!customer_id || !title || !scheduled_at) {
    return { error: "Missing required fields." };
  }

  try {
    const columns = await getTableColumns("appointments");
    if (columns.length === 0) {
      return { error: "Appointments table is missing. Run the admin visit tables SQL." };
    }
    await execute(
      `INSERT INTO appointments (id, customer_id, salesman_id, title, appointment_type, scheduled_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), customer_id, salesman_id, title, appointment_type, scheduled_at, notes || null]
    );

    revalidatePath("/admin/visits");
    revalidatePath("/salesman/dashboard");
    revalidatePath("/visits");
    return { success: true };
  } catch (error: any) {
    console.error("createAppointment error:", error);
    return { error: "Failed to create appointment." };
  }
}

/**
 * Updates an appointment status (e.g., to 'completed' after a visit).
 */
export async function updateAppointmentStatus(id: string, status: string) {
  try {
    const columns = await getTableColumns("appointments");
    if (columns.length === 0) {
      return { error: "Appointments table is missing." };
    }
    await execute("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
    revalidatePath("/admin/visits");
    revalidatePath("/visits");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update status." };
  }
}

/**
 * Deletes an appointment.
 */
export async function deleteAppointment(id: string) {
  try {
    const columns = await getTableColumns("appointments");
    if (columns.length === 0) {
      return { error: "Appointments table is missing." };
    }
    await execute("DELETE FROM appointments WHERE id = ?", [id]);
    revalidatePath("/visits");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete appointment." };
  }
}
