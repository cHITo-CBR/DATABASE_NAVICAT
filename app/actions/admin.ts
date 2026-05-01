"use server";
import { execute } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await execute(
      `UPDATE users SET status = 'approved', is_active = 1, approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [session.user.id, userId]
    );
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to approve user." };
  }
}

export async function rejectUser(userId: string, reason: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await execute(
      `UPDATE users SET status = 'rejected', is_active = 0, rejection_reason = ?
       WHERE id = ?`,
      [reason, userId]
    );
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reject user." };
  }
}
