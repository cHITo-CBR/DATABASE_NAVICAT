"use server";

/**
 * AUTHENTICATION ACTIONS
 * This file contains server-side actions for user registration, login, and logout.
 * These functions run on the server and are called directly from client forms.
 */

import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession, getSession, clearSession } from "@/lib/session";
import { notifyRole } from "@/app/actions/notifications";

/**
 * Handles new user registration.
 */
export async function registerUser(prevState: any, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const roleName = formData.get("role") as string;

  if (!fullName || !email || !password || !roleName) {
    return { error: "Missing required fields." };
  }

  try {
    const roleMap: Record<string, number> = {
      admin: 1, supervisor: 2, salesman: 3, buyer: 4
    };
    const roleId = roleMap[roleName] || 4;

    // Check if email already exists
    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return { error: "User already exists with this email." };
    }

    const userId = generateUUID();
    const isBuyer = roleName === "buyer";
    const isAutoApprove = isBuyer || email === "admin@flowstock.com";

    const passwordHash = await bcrypt.hash(password, 10);

    await execute(
      `INSERT INTO users (id, full_name, email, phone_number, password_hash, role_id, status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullName, email, phone || null, passwordHash, roleId,
        isAutoApprove ? "approved" : "pending", isAutoApprove ? 1 : 0]
    );

    // If user is a buyer, also create a record in the customers table and link it
    if (isBuyer) {
      const result = await execute(
        `INSERT INTO customers (store_name, contact_person, email, phone, is_active, status)
         VALUES (?, ?, ?, ?, 1, 'active')`,
        [fullName, fullName, email, phone || null]
      );

      const newCustomerId = (result as any).insertId;

      // Link the user to the customer
      await execute(
        `UPDATE users SET linked_customer_id = ? WHERE id = ?`,
        [newCustomerId, userId]
      );
    }

    await notifyRole(
      "admin",
      "New User Registration",
      `A new user (${fullName}) has registered as a ${roleName} and requires review.`,
      "info"
    );

    return { success: true, autoapproved: isAutoApprove };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Registration failed. Please try again." };
  }
}

/**
 * Handles user login.
 */
export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password required." };
  }

  try {
    // Fetch user and their role from database
    const user = await queryOne(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      return { error: "Invalid credentials." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { error: "Invalid credentials." };
    }

    // CHECK ACCOUNT STATUS
    if (user.status === "pending") {
      return { error: "Waiting for admin approval. Your account is pending." };
    }
    if (user.status === "rejected") {
      return { error: `Account rejected. Reason: ${user.rejection_reason || "Unknown"}` };
    }
    if (!user.is_active) {
      return { error: "Account is inactive." };
    }

    const roleStr = user.role_name ? user.role_name.toLowerCase() : "buyer";

    let linkedCustomerId = user.linked_customer_id;
    if (!linkedCustomerId && roleStr === "buyer") {
      const customer = await queryOne<{ id: string }>(
        "SELECT id FROM customers WHERE email = ?",
        [email]
      );
      linkedCustomerId = customer?.id || null;
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.full_name,
      full_name: user.full_name,
      role: roleStr,
      linked_customer_id: linkedCustomerId,
    });

    return { success: true, role: roleStr };
  } catch (error: any) {
    console.error("Login error: ", error);
    return { error: "Login failed." };
  }
}

/**
 * Logs out the current user by clearing the session cookie.
 */
export async function logoutUser() {
  await clearSession();
  redirect("/login");
}

/**
 * Utility to get the current authenticated user's session data.
 */
export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session || !session.user) return null;
    return { user: session.user };
  } catch (error) {
    return null;
  }
}
