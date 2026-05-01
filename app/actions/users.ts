"use server";
import { query, queryOne, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  role_name?: string;
}

export async function getUsers(search?: string, roleFilter?: string): Promise<UserRow[]> {
  try {
    let sql = `SELECT u.id, u.full_name, u.email, u.phone_number, u.status, u.is_active, u.created_at,
               r.name as role_name
               FROM users u
               LEFT JOIN roles r ON u.role_id = r.id
               WHERE 1=1`;
    const params: any[] = [];

    if (roleFilter && roleFilter !== "all") {
      sql += " AND r.name = ?";
      params.push(roleFilter);
    }

    if (search && search.trim()) {
      sql += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY u.created_at DESC";

    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getRoles(): Promise<{ id: number; name: string }[]> {
  try {
    return await query("SELECT id, name FROM roles ORDER BY name");
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const roleId = formData.get("roleId") as string;

  if (!fullName || !email || !password || !roleId) {
    return { error: "Missing required fields." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    await execute(
      `INSERT INTO users (id, full_name, email, phone_number, password_hash, role_id, status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'approved', 1)`,
      [userId, fullName, email, phone || null, passwordHash, parseInt(roleId)]
    );

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create user." };
  }
}

// ── STORE REGISTRATION MANAGEMENT ──────────────────────────────────────

export interface PendingStoreRegistration {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  store_name: string | null;
  contact_person: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  customer_id: string | null;
}

/**
 * Fetches all buyer accounts that are in "pending" status,
 * joined with their linked customer (store) record.
 */
export async function getPendingStoreRegistrations(): Promise<PendingStoreRegistration[]> {
  try {
    const [userColumns, customerColumns] = await Promise.all([
      getTableColumns("users"),
      getTableColumns("customers"),
    ]);

    const userColumnSet = new Set(userColumns.map((col) => col.COLUMN_NAME));
    const customerColumnSet = new Set(customerColumns.map((col) => col.COLUMN_NAME));

    const joinClause = userColumnSet.has("linked_customer_id")
      ? "LEFT JOIN customers c ON u.linked_customer_id = c.id"
      : "LEFT JOIN customers c ON c.email = u.email";

    const addressSelect = customerColumnSet.has("address") ? "c.address" : "NULL";
    const citySelect = customerColumnSet.has("city") ? "c.city" : "NULL";
    const regionSelect = customerColumnSet.has("region") ? "c.region" : "NULL";

    const rows = await query(
      `SELECT u.id as user_id, u.full_name, u.email, u.phone_number, u.created_at,
              c.store_name, c.contact_person, ${addressSelect} as address,
              ${citySelect} as city, ${regionSelect} as region, c.id as customer_id
       FROM users u
       ${joinClause}
       WHERE u.role_id = 4 AND u.status = 'pending'
       ORDER BY u.created_at DESC`
    );
    return rows;
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    return [];
  }
}

/**
 * Approves a pending buyer registration.
 * Sets the user's status to "approved" and is_active to 1.
 */
export async function approveStoreRegistration(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await execute(
      `UPDATE users SET status = 'approved', is_active = 1, approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [session.user.id, userId]
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    revalidatePath("/admin/buyer-requests");
    return { success: true };
  } catch (error: any) {
    console.error("approveStoreRegistration error:", error);
    return { error: error.message || "Failed to approve." };
  }
}

/**
 * Rejects a pending buyer registration.
 * Sets the user's status to "rejected" with a reason.
 */
export async function rejectStoreRegistration(userId: string, reason?: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await execute(
      `UPDATE users SET status = 'rejected', is_active = 0, rejection_reason = ? WHERE id = ?`,
      [reason || "Application denied by admin.", userId]
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    revalidatePath("/admin/buyer-requests");
    return { success: true };
  } catch (error: any) {
    console.error("rejectStoreRegistration error:", error);
    return { error: error.message || "Failed to reject." };
  }
}

/**
 * Permanently deletes a pending store registration (customer + user).
 * Only available to admins.
 */
export async function deleteStoreRegistration(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    // Find the user and linked customer (if any)
    const user = await queryOne<{ linked_customer_id: string | null; email: string }>(
      "SELECT linked_customer_id, email FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return { error: "User not found." };
    }

    // Delete customer if linked
    if (user.linked_customer_id) {
      await execute("DELETE FROM customers WHERE id = ?", [user.linked_customer_id]);
    } else {
      // As a fallback, delete any customer with matching email
      await execute("DELETE FROM customers WHERE email = ?", [user.email]);
    }

    // Delete the user record
    await execute("DELETE FROM users WHERE id = ?", [userId]);

    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    revalidatePath("/admin/buyer-requests");
    revalidatePath("/admin/registrations");

    return { success: true };
  } catch (error: any) {
    console.error("deleteStoreRegistration error:", error);
    return { error: error.message || "Failed to delete registration." };
  }
}
