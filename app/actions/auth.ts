"use server";

import { query, queryOne, insert, generateUUID, fromBoolean } from "@/lib/db-helpers";
import bcrypt from "bcryptjs";
import { createSession, clearSession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2/promise";

interface Role extends RowDataPacket {
  id: number;
  name: string;
}

interface User extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  role_id: number;
  status: string;
  is_active: number;
  rejection_reason?: string;
  role_name?: string;
}

export async function registerUser(prevState: any, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const roleName = formData.get("role") as string; // 'salesman', 'buyer', 'supervisor', etc.

  if (!fullName || !email || !password || !roleName) {
    return { error: "Missing required fields." };
  }

  try {
    // Get role id
    const role = await queryOne<Role>(
      "SELECT id FROM roles WHERE name = ?",
      [roleName]
    );

    if (!role) {
      return { error: "Invalid role selected." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    await insert(
      `INSERT INTO users (id, full_name, email, phone_number, password_hash, role_id, status, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, fullName, email, phone, passwordHash, role.id, "pending", fromBoolean(false)]
    );

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Registration failed." };
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password required." };
  }

  try {
    const user = await queryOne<User>(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    if (user.status === "pending") {
      return { error: "Waiting for admin approval. Your account is pending." };
    }
    
    if (user.status === "rejected") {
      return { error: `Account rejected. Reason: ${user.rejection_reason}` };
    }

    if (!user.is_active) {
      return { error: "Account is inactive." };
    }

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role_name,
      full_name: user.full_name
    });

    return { success: true, role: user.role_name };
  } catch (error: any) {
    console.error("Login error: ", error);
    return { error: "Login failed." };
  }
}

export async function logoutUser() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser() {
  return await getSession();
}
