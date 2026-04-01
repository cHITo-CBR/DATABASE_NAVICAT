"use server";

import { query, queryOne, insert, generateUUID, fromBoolean, toBoolean, buildLikeSearch } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";

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

interface UserRowDB extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  status: string;
  is_active: number;
  created_at: string;
  role_name: string;
}

interface Role extends RowDataPacket {
  id: number;
  name: string;
}

export async function getUsers(search?: string, roleFilter?: string): Promise<UserRow[]> {
  try {
    let sql = `
      SELECT u.id, u.full_name, u.email, u.phone_number, u.status, u.is_active, u.created_at, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (roleFilter && roleFilter !== "all") {
      const role = await queryOne<Role>(
        "SELECT id FROM roles WHERE name = ?",
        [roleFilter]
      );
      if (role) {
        conditions.push("u.role_id = ?");
        params.push(role.id);
      }
    }

    if (search && search.trim()) {
      const { condition: nameCondition, value: nameValue } = buildLikeSearch("u.full_name", search);
      const { condition: emailCondition, value: emailValue } = buildLikeSearch("u.email", search);
      conditions.push(`(${nameCondition} OR ${emailCondition})`);
      params.push(nameValue, emailValue);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY u.created_at DESC";

    const users = await query<UserRowDB>(sql, params);
    
    return users.map(user => ({
      ...user,
      is_active: toBoolean(user.is_active)
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getRoles(): Promise<{ id: number; name: string }[]> {
  try {
    return await query<Role>("SELECT id, name FROM roles ORDER BY name");
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

    await insert(
      `INSERT INTO users (id, full_name, email, phone_number, password_hash, role_id, status, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, fullName, email, phone || null, passwordHash, parseInt(roleId), "approved", fromBoolean(true)]
    );

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create user." };
  }
}
