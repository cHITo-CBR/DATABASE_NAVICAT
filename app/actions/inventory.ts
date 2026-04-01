"use server";

import { query, queryOne, generateUUID, fromBoolean } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

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

interface CountRow extends RowDataPacket {
  count: number;
}

interface MovementDbRow extends RowDataPacket {
  id: string;
  quantity: number;
  balance: number;
  notes: string | null;
  created_at: string;
  variant_name: string | null;
  variant_sku: string | null;
  movement_type_name: string | null;
  movement_type_direction: string | null;
  user_full_name: string | null;
}

export async function getInventoryKPIs(): Promise<InventoryKPIs> {
  try {
    // Total distinct SKUs that are active
    const skuResult = await queryOne<CountRow>(`
      SELECT COUNT(*) AS count FROM product_variants WHERE is_active = ?
    `, [fromBoolean(true)]);

    // Low stock: count ledger entries with balance below 10
    const lowStockResult = await queryOne<CountRow>(`
      SELECT COUNT(*) AS count FROM inventory_ledger WHERE balance < 10
    `);

    return {
      totalSKUs: skuResult?.count ?? 0,
      lowStockAlerts: lowStockResult?.count ?? 0,
    };
  } catch {
    return { totalSKUs: 0, lowStockAlerts: 0 };
  }
}

export async function getRecentMovements(): Promise<MovementRow[]> {
  try {
    const rows = await query<MovementDbRow>(`
      SELECT il.id, il.quantity, il.balance, il.notes, il.created_at,
             pv.name AS variant_name, pv.sku AS variant_sku,
             imt.name AS movement_type_name, imt.direction AS movement_type_direction,
             u.full_name AS user_full_name
      FROM inventory_ledger il
      LEFT JOIN product_variants pv ON il.variant_id = pv.id
      LEFT JOIN inventory_movement_types imt ON il.movement_type_id = imt.id
      LEFT JOIN users u ON il.recorded_by = u.id
      ORDER BY il.created_at DESC
      LIMIT 20
    `);

    return rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      balance: row.balance,
      notes: row.notes,
      created_at: row.created_at,
      product_variants: row.variant_name ? { name: row.variant_name, sku: row.variant_sku } : null,
      inventory_movement_types: row.movement_type_name ? { name: row.movement_type_name, direction: row.movement_type_direction! } : null,
      users: row.user_full_name ? { full_name: row.user_full_name } : null,
    }));
  } catch {
    return [];
  }
}

interface MovementTypeRow extends RowDataPacket {
  id: number;
  name: string;
  direction: string;
}

export async function getMovementTypes(): Promise<{ id: number; name: string; direction: string }[]> {
  try {
    const rows = await query<MovementTypeRow>(`
      SELECT id, name, direction FROM inventory_movement_types ORDER BY name
    `);
    return rows;
  } catch {
    return [];
  }
}

interface VariantDbRow extends RowDataPacket {
  id: string;
  name: string;
  sku: string | null;
  product_name: string | null;
}

export async function getVariantsForAdjustment(): Promise<{ id: string; name: string; sku: string | null }[]> {
  try {
    const rows = await query<VariantDbRow>(`
      SELECT pv.id, pv.name, pv.sku, p.name AS product_name
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE pv.is_active = ?
      ORDER BY pv.name
    `, [fromBoolean(true)]);
    
    return rows.map((v) => ({
      id: v.id,
      name: v.product_name ? `${v.product_name} - ${v.name}` : v.name,
      sku: v.sku,
    }));
  } catch {
    return [];
  }
}

interface BalanceRow extends RowDataPacket {
  balance: number;
}

interface DirectionRow extends RowDataPacket {
  direction: string;
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
    // Get current balance for this variant
    const lastEntry = await queryOne<BalanceRow>(`
      SELECT balance FROM inventory_ledger
      WHERE variant_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [variantId]);

    const currentBalance = lastEntry?.balance ?? 0;

    // Get movement type direction
    const movType = await queryOne<DirectionRow>(`
      SELECT direction FROM inventory_movement_types WHERE id = ?
    `, [parseInt(movementTypeId)]);

    const direction = movType?.direction ?? "in";
    const newBalance = direction === "out" ? currentBalance - quantity : currentBalance + quantity;

    const ledgerId = generateUUID();
    await query(`
      INSERT INTO inventory_ledger (id, variant_id, movement_type_id, quantity, balance, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      ledgerId,
      variantId,
      parseInt(movementTypeId),
      direction === "out" ? -quantity : quantity,
      newBalance,
      notes || null,
      session.user.id,
    ]);

    revalidatePath("/admin/inventory");
    revalidatePath("/supervisor/inventory");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
