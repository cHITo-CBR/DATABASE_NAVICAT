"use server";

import { query, queryOne, insert, generateUUID, fromBoolean, toBoolean } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";

export interface CustomerRow {
  id: string;
  store_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  is_active: boolean;
  created_at: string;
  salesman_name?: string | null;
}

interface CustomerRowDB extends RowDataPacket {
  id: string;
  store_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  is_active: number;
  created_at: string;
  salesman_name: string | null;
}

export interface CustomerStats {
  totalActive: number;
  newThisMonth: number;
}

interface CountResult extends RowDataPacket {
  count: number;
}

export async function getCustomers(): Promise<CustomerRow[]> {
  try {
    const customers = await query<CustomerRowDB>(
      `SELECT c.*, u.full_name as salesman_name
       FROM customers c
       LEFT JOIN users u ON c.assigned_salesman_id = u.id
       WHERE c.is_active = ?
       ORDER BY c.created_at DESC`,
      [fromBoolean(true)]
    );
    return customers.map(c => ({ ...c, is_active: toBoolean(c.is_active) }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomerStats(): Promise<CustomerStats> {
  try {
    const totalResult = await queryOne<CountResult>(
      "SELECT COUNT(*) as count FROM customers WHERE is_active = ?",
      [fromBoolean(true)]
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newResult = await queryOne<CountResult>(
      "SELECT COUNT(*) as count FROM customers WHERE created_at >= ?",
      [startOfMonth.toISOString()]
    );

    return {
      totalActive: totalResult?.count ?? 0,
      newThisMonth: newResult?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return { totalActive: 0, newThisMonth: 0 };
  }
}

export async function createCustomer(formData: FormData) {
  const storeName = formData.get("storeName") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const region = formData.get("region") as string;
  const assignedSalesmanId = formData.get("assignedSalesmanId") as string;

  if (!storeName) return { error: "Store name is required." };

  try {
    const customerId = generateUUID();

    await insert(
      `INSERT INTO customers (id, store_name, contact_person, phone, email, address, city, region, assigned_salesman_id, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        customerId,
        storeName,
        contactPerson || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        region || null,
        assignedSalesmanId || null,
        fromBoolean(true)
      ]
    );

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create customer." };
  }
}

export async function getSalesmenForAssignment(): Promise<{ id: string; full_name: string }[]> {
  try {
    return await query<RowDataPacket & { id: string; full_name: string }>(
      "SELECT id, full_name FROM users WHERE is_active = ? ORDER BY full_name",
      [fromBoolean(true)]
    );
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    return [];
  }
}

export async function getSalesmanCustomers(salesmanId: string): Promise<CustomerRow[]> {
  try {
    const customers = await query<CustomerRowDB>(
      `SELECT c.*, u.full_name as salesman_name
       FROM customers c
       LEFT JOIN users u ON c.assigned_salesman_id = u.id
       WHERE c.assigned_salesman_id = ? AND c.is_active = ?
       ORDER BY c.store_name ASC`,
      [salesmanId, fromBoolean(true)]
    );
    return customers.map(c => ({ ...c, is_active: toBoolean(c.is_active) }));
  } catch (error) {
    console.error("Error fetching salesman customers:", error);
    return [];
  }
}
