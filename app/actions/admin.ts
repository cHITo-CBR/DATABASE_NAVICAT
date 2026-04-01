"use server";

import { update, fromBoolean } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Utility Server action to approve user
export async function approveUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await update(
      `UPDATE users 
       SET status = ?, is_active = ?, approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      ["approved", fromBoolean(true), session.user.id, userId]
    );

    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to approve user." };
  }
}

// Utility Server action to reject user
export async function rejectUser(userId: string, reason: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await update(
      `UPDATE users 
       SET status = ?, is_active = ?, rejection_reason = ? 
       WHERE id = ?`,
      ["rejected", fromBoolean(false), reason, userId]
    );

    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reject user." };
  }
}
