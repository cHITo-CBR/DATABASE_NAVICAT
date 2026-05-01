"use server";
import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface InventoryKPIs {
  totalSKUs: number;
  lowStockAlerts: number;
}

export interface MovementRow {
  id: string;
  quantity: number;
  balance: number;
  notes: string | null;
  created_at: string;
  product_variants: { name: string; sku: string | null } | null;
  inventory_movement_types: { name: string; direction: string } | null;
  users: { full_name: string } | null;
}

export async function getInventoryKPIs(): Promise<InventoryKPIs> {
  try {
    const skuRow = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM product_variants WHERE is_active = 1"
    );
    const lowRow = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM inventory_ledger WHERE balance < 10"
    );

    return {
      totalSKUs: skuRow?.count ?? 0,
      lowStockAlerts: lowRow?.count ?? 0,
    };
  } catch {
    return { totalSKUs: 0, lowStockAlerts: 0 };
  }
}

export async function getRecentMovements(): Promise<MovementRow[]> {
  try {
    const rows = await query(
      `SELECT il.id, il.quantity, il.balance, il.notes, il.created_at,
              p.name as product_name, p.id as product_id,
              imt.name as movement_type_name, imt.direction as movement_type_direction,
              u.full_name as user_name
       FROM inventory_ledger il
       LEFT JOIN products p ON il.product_id = p.id
       LEFT JOIN inventory_movement_types imt ON il.movement_type_id = imt.id
       LEFT JOIN users u ON il.recorded_by = u.id
       ORDER BY il.created_at DESC
       LIMIT 20`
    );

    return rows.map((row: any) => ({
      id: row.id,
      quantity: row.quantity,
      balance: row.balance,
      notes: row.notes,
      created_at: row.created_at,
      product_variants: row.product_name ? { name: row.product_name, sku: `SKU-${row.product_id?.substring(0, 8)}` } : null,
      inventory_movement_types: row.movement_type_name ? { name: row.movement_type_name, direction: row.movement_type_direction } : null,
      users: row.user_name ? { full_name: row.user_name } : null,
    }));
  } catch (error) {
    console.error("Error fetching recent movements:", error);
    return [];
  }
}

export async function getMovementTypes(): Promise<{ id: number; name: string; direction: string }[]> {
  try {
    return await query("SELECT id, name, direction FROM inventory_movement_types WHERE is_active = 1 ORDER BY name");
  } catch (error) {
    console.error("Error fetching movement types:", error);
    return [
      { id: 1, name: "Stock In", direction: "in" },
      { id: 2, name: "Stock Out", direction: "out" },
      { id: 3, name: "Adjustment In", direction: "in" },
      { id: 4, name: "Adjustment Out", direction: "out" },
    ];
  }
}

export async function getVariantsForAdjustment(): Promise<{ id: string; name: string; sku: string | null }[]> {
  try {
    const rows = await query("SELECT id, name FROM products WHERE is_archived = 0 ORDER BY name");

    return rows.map((v: any) => ({
      id: v.id,
      name: `${v.name} - Standard`,
      sku: `SKU-${v.id.substring(0, 8)}`,
    }));
  } catch (error) {
    console.error("Error fetching variants:", error);
    return [];
  }
}

export async function createStockAdjustment(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const variantId = formData.get("variantId") as string;
  const movementTypeId = formData.get("movementTypeId") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const notes = formData.get("notes") as string;

  if (!variantId || !movementTypeId || !quantity) {
    return { error: "Missing required fields." };
  }

  try {
    // Get current balance
    const lastEntry = await queryOne<{ balance: number }>(
      `SELECT balance FROM inventory_ledger WHERE product_id = ? ORDER BY created_at DESC LIMIT 1`,
      [variantId]
    );
    const currentBalance = lastEntry?.balance ?? 0;

    // Get movement type direction
    const movType = await queryOne<{ direction: string }>(
      "SELECT direction FROM inventory_movement_types WHERE id = ?",
      [parseInt(movementTypeId)]
    );
    if (!movType) return { error: "Invalid movement type selected." };

    const direction = movType.direction;
    const newBalance = direction === "out" ? currentBalance - quantity : currentBalance + quantity;

    await execute(
      `INSERT INTO inventory_ledger (id, product_id, movement_type_id, quantity, balance, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), variantId, parseInt(movementTypeId),
       direction === "out" ? -quantity : quantity, newBalance, notes || null, session.user.id]
    );

    revalidatePath("/admin/inventory");
    revalidatePath("/supervisor/inventory");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return { error: error.message };
  }
}
