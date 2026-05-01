"use server";

import { queryOne, generateUUID, getTableColumns } from "@/lib/db-helpers";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ResultSetHeader } from "mysql2";

export async function submitStoreRegistration(prevState: any, formData: FormData) {
  const connection = await pool.getConnection();
  try {
    const [userColumns, customerColumns] = await Promise.all([
      getTableColumns("users"),
      getTableColumns("customers"),
    ]);

    const userColumnSet = new Set(userColumns.map((col) => col.COLUMN_NAME));
    const customerColumnSet = new Set(customerColumns.map((col) => col.COLUMN_NAME));
    const customerIdColumn = customerColumns.find((col) => col.COLUMN_NAME === "id");
    const customerIdAuto = (customerIdColumn?.EXTRA || "").toLowerCase().includes("auto_increment");

    await connection.beginTransaction();

    const store_name = formData.get("store_name") as string;
    const contact_person = formData.get("contact_person") as string;
    const phone_number = formData.get("phone_number") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const region = formData.get("region") as string;

    if (!store_name || !contact_person || !phone_number || !email || !password || !address || !city || !region) {
      return { error: "All fields are required." };
    }

    // Check if user exists
    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const userId = generateUUID();
    let customerId = generateUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create User (Role 4 = Buyer)
    await connection.execute(
      `INSERT INTO users (id, full_name, email, phone_number, password_hash, role_id, status, is_active)
       VALUES (?, ?, ?, ?, ?, 4, 'pending', 0)`,
      [userId, contact_person, email, phone_number, passwordHash]
    );

    // 2. Create Customer
    const customerColumnsList: string[] = [];
    const customerValues: Array<string | number | null> = [];

    if (!customerIdAuto) {
      customerColumnsList.push("id");
      customerValues.push(customerId);
    }

    customerColumnsList.push("store_name", "contact_person", "email");
    customerValues.push(store_name, contact_person, email);

    const phoneColumn = customerColumnSet.has("phone_number")
      ? "phone_number"
      : (customerColumnSet.has("phone") ? "phone" : null);
    if (phoneColumn) {
      customerColumnsList.push(phoneColumn);
      customerValues.push(phone_number);
    }

    if (customerColumnSet.has("address")) {
      customerColumnsList.push("address");
      customerValues.push(address);
    }
    if (customerColumnSet.has("city")) {
      customerColumnsList.push("city");
      customerValues.push(city);
    }
    if (customerColumnSet.has("region")) {
      customerColumnsList.push("region");
      customerValues.push(region);
    }
    if (customerColumnSet.has("assigned_salesman_id")) {
      customerColumnsList.push("assigned_salesman_id");
      customerValues.push(null);
    }
    if (customerColumnSet.has("is_active")) {
      customerColumnsList.push("is_active");
      customerValues.push(1);
    }

    const placeholders = customerColumnsList.map(() => "?").join(", ");
    const insertSql = `INSERT INTO customers (${customerColumnsList.join(", ")}) VALUES (${placeholders})`;
    const [insertResult] = await connection.execute<ResultSetHeader>(insertSql, customerValues);

    if (customerIdAuto) {
      const insertedId = insertResult.insertId;
      if (!insertedId) {
        throw new Error("Customer ID not generated.");
      }
      customerId = String(insertedId);
    }

    // 3. Link User to Customer
    if (userColumnSet.has("linked_customer_id")) {
      await connection.execute(
        `UPDATE users SET linked_customer_id = ? WHERE id = ?`,
        [customerId, userId]
      );
    }

    await connection.commit();
    revalidatePath("/admin/buyer-requests");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    console.error("Store registration exception:", error);
    return { error: "An unexpected error occurred during registration." };
  } finally {
    connection.release();
  }
}
