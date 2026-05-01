"use server";

/**
 * BOOKINGS ACTIONS
 * This file handles server-side operations for sales bookings (transactions).
 */

import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";

export interface BookingRow {
  id: string;
  salesman_id: string;
  customer_id: string | null;
  customer_store_name: string | null;
  total_amount: number;
  status: "pending" | "approved" | "completed" | "cancelled";
  created_at: string;
  updated_at: string | null;
}

export async function getSalesmanBookings(): Promise<BookingRow[]> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return [];

    const rows = await query(
      `SELECT st.id, st.salesman_id, st.customer_id, st.total_amount, st.status,
              st.created_at, st.updated_at, c.store_name as customer_store_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.salesman_id = ?
       ORDER BY st.created_at DESC`,
      [session.user.id]
    );

    return rows.map((b: any) => ({
      ...b,
      total_amount: Number(b.total_amount),
    }));
  } catch (error) {
    console.error("Error fetching salesman bookings:", error);
    return [];
  }
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return null;

    const row = await queryOne(
      `SELECT st.id, st.salesman_id, st.customer_id, st.total_amount, st.status,
              st.created_at, st.updated_at, c.store_name as customer_store_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.id = ? AND st.salesman_id = ?`,
      [id, session.user.id]
    );

    if (!row) return null;
    return { ...row, total_amount: Number(row.total_amount) };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return null;
  }
}

export async function createBooking(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const customer_id = formData.get("customer_id") as string;
    const total_amount = formData.get("total_amount") as string;

    if (!customer_id || !total_amount) {
      return { error: "Customer and total amount are required" };
    }

    const bookingId = generateUUID();

    await execute(
      `INSERT INTO sales_transactions (id, salesman_id, customer_id, total_amount, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [bookingId, session.user.id, customer_id, parseFloat(total_amount)]
    );

    return { success: true, booking_id: bookingId };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { error: "Failed to create booking" };
  }
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return { error: "Unauthorized" };

    await execute(
      `UPDATE sales_transactions SET status = ?, updated_at = NOW()
       WHERE id = ? AND salesman_id = ?`,
      [status, id, session.user.id]
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { error: "Failed to update booking status" };
  }
}