"use server";
import { query, queryOne, execute } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";

export interface SettingRow {
  id: number;
  key: string;
  value: string | null;
  updated_at: string;
}

export async function getSettings(): Promise<SettingRow[]> {
  try {
    return await query("SELECT * FROM system_settings ORDER BY `key`");
  } catch (error) {
    console.error("Error fetching settings:", error);
    return [];
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const existing = await queryOne("SELECT id FROM system_settings WHERE `key` = ?", [key]);

    if (existing) {
      await execute(
        "UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?",
        [value, key]
      );
    } else {
      await execute(
        "INSERT INTO system_settings (`key`, value) VALUES (?, ?)",
        [key, value]
      );
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update setting." };
  }
}
