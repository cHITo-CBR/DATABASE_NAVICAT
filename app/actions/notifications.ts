"use server";

import { query, queryOne, update, fromBoolean, toBoolean } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";

export interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationRowDB extends RowDataPacket {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: number;
  created_at: string;
}

interface CountResult extends RowDataPacket {
  count: number;
}

export async function getNotifications(): Promise<NotificationRow[]> {
  try {
    const session = await getSession();
    if (!session) return [];

    const notifications = await query<NotificationRowDB>(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    return notifications.map(n => ({ ...n, is_read: toBoolean(n.is_read) }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session) return 0;

    const result = await queryOne<CountResult>(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = ? AND is_read = ?`,
      [session.user.id, fromBoolean(false)]
    );

    return result?.count ?? 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

export async function markNotificationRead(id: string) {
  try {
    await update(
      "UPDATE notifications SET is_read = ? WHERE id = ?",
      [fromBoolean(true), id]
    );

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
    await update(
      "UPDATE notifications SET is_read = ? WHERE user_id = ? AND is_read = ?",
      [fromBoolean(true), session.user.id, fromBoolean(false)]
    );

    revalidatePath("/notifications");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to mark all as read." };
  }
}
