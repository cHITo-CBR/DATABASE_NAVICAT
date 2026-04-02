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
             p.name AS variant_name, CONCAT('SKU-', SUBSTRING(p.id, 1, 8)) AS variant_sku,
             imt.name AS movement_type_name, imt.direction AS movement_type_direction,
             u.full_name AS user_full_name
      FROM inventory_ledger il
      LEFT JOIN products p ON il.product_id = p.id
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
  } catch (error) {
    console.error("Error fetching recent movements:", error);
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
      SELECT id, name, direction FROM inventory_movement_types WHERE is_active = 1 ORDER BY name
    `);
    return rows;
  } catch (error) {
    console.error("Error fetching movement types - table may not exist:", error);
    // Return default movement types if table doesn't exist
    return [
      { id: 1, name: "Stock In", direction: "in" },
      { id: 2, name: "Stock Out", direction: "out" },
      { id: 3, name: "Adjustment In", direction: "in" },
      { id: 4, name: "Adjustment Out", direction: "out" }
    ];
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
    // Since product_variants table might not exist, let's use products table instead
    const rows = await query<VariantDbRow>(`
      SELECT p.id, p.name, CONCAT(p.name, ' - Standard') as variant_name, p.id as sku
      FROM products p
      WHERE p.is_archived = 0
      ORDER BY p.name
    `);
    
    return rows.map((v) => ({
      id: v.id,
      name: v.variant_name || v.name,
      sku: `SKU-${v.id.substring(0, 8)}`, // Generate simple SKU
    }));
  } catch (error) {
    console.error("Error fetching variants:", error);
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
    console.log("Creating stock adjustment:", { variantId, movementTypeId, quantity, notes });
    
    // Check if inventory_ledger table exists
    try {
      await query("SELECT 1 FROM inventory_ledger LIMIT 1");
    } catch (tableError) {
      console.error("inventory_ledger table doesn't exist:", tableError);
      return { 
        error: "Inventory system not properly set up. Please run the database migration script first." 
      };
    }

    // Get current balance for this product (using product id instead of variant_id)
    const lastEntry = await queryOne<BalanceRow>(`
      SELECT balance FROM inventory_ledger
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [variantId]);

    const currentBalance = lastEntry?.balance ?? 0;
    console.log("Current balance:", currentBalance);

    // Get movement type direction
    const movType = await queryOne<DirectionRow>(`
      SELECT direction FROM inventory_movement_types WHERE id = ?
    `, [parseInt(movementTypeId)]);

    if (!movType) {
      return { error: "Invalid movement type selected." };
    }

    const direction = movType.direction;
    const newBalance = direction === "out" ? currentBalance - quantity : currentBalance + quantity;
    console.log("New balance will be:", newBalance);

    const ledgerId = generateUUID();
    await query(`
      INSERT INTO inventory_ledger (id, product_id, movement_type_id, quantity, balance, notes, recorded_by)
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
    console.error("Stock adjustment error:", error);
    return { error: error.message };
  }
}
