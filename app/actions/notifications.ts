"use server";
import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<NotificationRow[]> {
  try {
    const session = await getSession();
    if (!session) return [];

    const rows = await query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [session.user.id]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session) return 0;

    const row = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [session.user.id]
    );
    return row?.count ?? 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

export async function markNotificationRead(id: string) {
  try {
    await execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to mark notification as read." };
  }
}

export async function markAllRead() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await execute(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
      [session.user.id]
    );
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to mark all as read." };
  }
}

/**
 * Creates a notification for a specific user.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "info"
) {
  try {
    await execute(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [generateUUID(), userId, title, message, type]
    );
  } catch (error) {
    console.error("Error creating notification exception:", error);
  }
}

/**
 * Creates a notification for ALL active users assigned to a specific role.
 */
export async function notifyRole(
  roleName: "admin" | "supervisor" | "salesman",
  title: string,
  message: string,
  type: string = "info"
) {
  try {
    // Fetch all active users with this role
    const users = await query<{ id: string }>(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = ? AND u.is_active = 1`,
      [roleName]
    );

    if (!users || users.length === 0) return;

    // Batch insert notifications
    const values = users.map(u => `('${generateUUID()}', '${u.id}', ?, ?, ?, 0)`).join(", ");
    const params: any[] = [];
    users.forEach(() => {
      params.push(title, message, type);
    });

    // Use individual inserts for safety with parameterized queries
    for (const u of users) {
      await execute(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [generateUUID(), u.id, title, message, type]
      );
    }
  } catch (error) {
    console.error(`Error notifying role ${roleName}:`, error);
  }
}
