"use server";

/**
 * CUSTOMER MANAGEMENT ACTIONS
 */

import { query, queryOne, execute, generateUUID, buildLikeSearch } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";

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

export interface CustomerStats {
  totalActive: number;
  newThisMonth: number;
}

export async function getCustomers(): Promise<CustomerRow[]> {
  try {
    const rows = await query(
      `SELECT c.*, u.full_name as salesman_name
       FROM customers c
       LEFT JOIN users u ON c.assigned_salesman_id = u.id
       WHERE c.is_active = 1
       ORDER BY c.created_at DESC`
    );
    return rows;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomerStats(): Promise<CustomerStats> {
  try {
    const totalRow = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers WHERE is_active = 1"
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newRow = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers WHERE created_at >= ?",
      [startOfMonth.toISOString()]
    );

    return {
      totalActive: totalRow?.count ?? 0,
      newThisMonth: newRow?.count ?? 0,
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
    await execute(
      `INSERT INTO customers (id, store_name, contact_person, phone, email, address, city, region, assigned_salesman_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [generateUUID(), storeName, contactPerson || null, phone || null, email || null,
       address || null, city || null, region || null, assignedSalesmanId || null]
    );
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create customer." };
  }
}

export async function getSalesmenForAssignment(): Promise<{ id: string; full_name: string }[]> {
  try {
    return await query("SELECT id, full_name FROM users WHERE is_active = 1 ORDER BY full_name");
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    return [];
  }
}

export async function getSalesmanCustomers(salesmanId: string): Promise<CustomerRow[]> {
  try {
    const rows = await query(
      `SELECT c.*, u.full_name as salesman_name
       FROM customers c
       LEFT JOIN users u ON c.assigned_salesman_id = u.id
       WHERE c.assigned_salesman_id = ? AND c.is_active = 1
       ORDER BY c.store_name`,
      [salesmanId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching salesman customers:", error);
    return [];
  }
}

export async function getUnassignedCustomers(): Promise<CustomerRow[]> {
  try {
    const rows = await query(
      `SELECT * FROM customers
       WHERE assigned_salesman_id IS NULL AND is_active = 1
       ORDER BY created_at DESC`
    );
    return rows.map((c: any) => ({ ...c, salesman_name: null }));
  } catch (error) {
    console.error("Error fetching unassigned customers:", error);
    return [];
  }
}

export async function assignCustomerToSalesman(customerId: string, salesmanId: string) {
  try {
    await execute("UPDATE customers SET assigned_salesman_id = ? WHERE id = ?", [salesmanId, customerId]);
    revalidatePath("/salesman/customers");
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to assign customer." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const storeName = formData.get("storeName") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const region = formData.get("region") as string;

  if (!id) return { error: "Customer ID is required." };
  if (!storeName) return { error: "Store name is required." };

  try {
    await execute(
      `UPDATE customers SET store_name = ?, contact_person = ?, phone = ?, email = ?,
       address = ?, city = ?, region = ? WHERE id = ?`,
      [storeName, contactPerson || null, phone || null, email || null,
       address || null, city || null, region || null, id]
    );
    revalidatePath(`/admin/customers/${id}`);
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update customer." };
  }
}
