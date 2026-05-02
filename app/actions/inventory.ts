"use server";
import { query, queryOne, execute, generateUUID, getTableColumns } from "@/lib/db-helpers";
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

const fallbackMovementTypes = [
  { id: 1, name: "Stock In", direction: "in" },
  { id: 2, name: "Stock Out", direction: "out" },
  { id: 3, name: "Adjustment In", direction: "in" },
  { id: 4, name: "Adjustment Out", direction: "out" },
] as const;

const movementTypeById = (id: number) => fallbackMovementTypes.find((t) => t.id === id);

export async function getInventoryKPIs(): Promise<InventoryKPIs> {
  try {
    const variantColumns = await getTableColumns("product_variants");
    const skuRow = variantColumns.length > 0
      ? await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM product_variants WHERE is_active = 1")
      : await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE is_active = 1");

    const ledgerColumns = await getTableColumns("inventory_ledger");
    const lowRow = ledgerColumns.length > 0
      ? await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM inventory_ledger WHERE balance < 10")
      : { count: 0 };

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
    const ledgerColumns = await getTableColumns("inventory_ledger");
    if (ledgerColumns.length === 0) return [];
    const movementColumns = await getTableColumns("inventory_movement_types");

    const hasVariantId = ledgerColumns.includes("product_variant_id");
    const hasProductId = ledgerColumns.includes("product_id");
    const hasMovementTypeId = ledgerColumns.includes("movement_type_id");
    const hasTransactionType = ledgerColumns.includes("transaction_type");
    const hasRecordedBy = ledgerColumns.includes("recorded_by");
    const hasNotes = ledgerColumns.includes("notes");

    const variantColumns = await getTableColumns("product_variants");
    const productColumns = await getTableColumns("products");

    let productSelect = "NULL as product_name, NULL as product_sku";
    let productJoin = "";
    if (hasVariantId && variantColumns.length > 0) {
      productSelect = "pv.name as product_name, pv.sku as product_sku";
      productJoin = "LEFT JOIN product_variants pv ON il.product_variant_id = pv.id";
    } else if (hasProductId && productColumns.length > 0) {
      productSelect = "p.name as product_name, CONCAT('SKU-', LEFT(p.id, 8)) as product_sku";
      productJoin = "LEFT JOIN products p ON il.product_id = p.id";
    }

    let movementSelect = "NULL as movement_type_name, NULL as movement_type_direction";
    let movementJoin = "";
    if (hasMovementTypeId && movementColumns.length > 0) {
      movementSelect = "imt.name as movement_type_name, imt.direction as movement_type_direction";
      movementJoin = "LEFT JOIN inventory_movement_types imt ON il.movement_type_id = imt.id";
    } else if (hasTransactionType) {
      movementSelect =
        "il.transaction_type as movement_type_name, CASE WHEN LOWER(il.transaction_type) LIKE '%out%' THEN 'out' ELSE 'in' END as movement_type_direction";
    }

    const userSelect = hasRecordedBy ? "u.full_name as user_name" : "NULL as user_name";
    const userJoin = hasRecordedBy ? "LEFT JOIN users u ON il.recorded_by = u.id" : "";

    const rows = await query(
      `SELECT il.id, il.quantity, il.balance, ${hasNotes ? "il.notes" : "NULL"} as notes, il.created_at,
              ${productSelect},
              ${movementSelect},
              ${userSelect}
       FROM inventory_ledger il
       ${productJoin}
       ${movementJoin}
       ${userJoin}
       ORDER BY il.created_at DESC
       LIMIT 20`
    );

    return rows.map((row: any) => ({
      id: row.id,
      quantity: row.quantity,
      balance: row.balance,
      notes: row.notes,
      created_at: row.created_at,
      product_variants: row.product_name ? { name: row.product_name, sku: row.product_sku || null } : null,
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
    const movementColumns = await getTableColumns("inventory_movement_types");
    if (movementColumns.length === 0) return [...fallbackMovementTypes];
    const hasIsActive = movementColumns.includes("is_active");
    return await query(
      `SELECT id, name, direction FROM inventory_movement_types ${hasIsActive ? "WHERE is_active = 1" : ""} ORDER BY name`
    );
  } catch (error) {
    console.error("Error fetching movement types:", error);
    return [...fallbackMovementTypes];
  }
}

export async function getVariantsForAdjustment(): Promise<{ id: string; name: string; sku: string | null }[]> {
  try {
    const ledgerColumns = await getTableColumns("inventory_ledger");
    const useVariants = ledgerColumns.includes("product_variant_id");

    if (useVariants) {
      const variantColumns = await getTableColumns("product_variants");
      const hasSku = variantColumns.includes("sku");
      const hasActive = variantColumns.includes("is_active");
      const rows = await query(
        `SELECT id, name${hasSku ? ", sku" : ""} FROM product_variants ${hasActive ? "WHERE is_active = 1" : ""} ORDER BY name`
      );

      return rows.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: hasSku ? v.sku : `SKU-${v.id.substring(0, 8)}`,
      }));
    }

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
    const ledgerColumns = await getTableColumns("inventory_ledger");
    if (ledgerColumns.length === 0) return { error: "Inventory ledger table is missing." };
    const movementColumns = await getTableColumns("inventory_movement_types");

    const hasVariantId = ledgerColumns.includes("product_variant_id");
    const hasProductId = ledgerColumns.includes("product_id");
    const hasMovementTypeId = ledgerColumns.includes("movement_type_id");
    const hasTransactionType = ledgerColumns.includes("transaction_type");
    const hasNotes = ledgerColumns.includes("notes");
    const hasRecordedBy = ledgerColumns.includes("recorded_by");

    const productColumn = hasVariantId ? "product_variant_id" : hasProductId ? "product_id" : null;
    if (!productColumn) return { error: "Inventory ledger is missing product reference columns." };

    const lastEntry = await queryOne<{ balance: number }>(
      `SELECT balance FROM inventory_ledger WHERE ${productColumn} = ? ORDER BY created_at DESC LIMIT 1`,
      [variantId]
    );
    const currentBalance = lastEntry?.balance ?? 0;

    const movementTypeIdNumber = Number(movementTypeId);
    let direction: "in" | "out" = "in";
    let movementName: string | null = null;

    if (hasMovementTypeId) {
      if (movementColumns.length > 0) {
        const movType = await queryOne<{ direction: "in" | "out"; name: string }>(
          "SELECT direction, name FROM inventory_movement_types WHERE id = ?",
          [movementTypeIdNumber]
        );
        if (!movType) return { error: "Invalid movement type selected." };
        direction = movType.direction;
        movementName = movType.name;
      } else {
        const fallback = movementTypeById(movementTypeIdNumber);
        if (!fallback) return { error: "Invalid movement type selected." };
        direction = fallback.direction;
        movementName = fallback.name;
      }
    } else if (hasTransactionType) {
      const fallback = movementTypeById(movementTypeIdNumber);
      if (!fallback) return { error: "Invalid movement type selected." };
      direction = fallback.direction;
      movementName = fallback.name;
    } else {
      return { error: "Inventory ledger is missing movement type columns." };
    }

    const newBalance = direction === "out" ? currentBalance - quantity : currentBalance + quantity;

    const insertColumns = ["id", productColumn, "quantity", "balance"];
    const insertValues: any[] = [
      generateUUID(),
      variantId,
      direction === "out" ? -quantity : quantity,
      newBalance,
    ];

    if (hasMovementTypeId) {
      insertColumns.push("movement_type_id");
      insertValues.push(movementTypeIdNumber);
    }

    if (hasTransactionType) {
      insertColumns.push("transaction_type");
      insertValues.push(movementName || (direction === "out" ? "stock_out" : "stock_in"));
    }

    if (hasNotes) {
      insertColumns.push("notes");
      insertValues.push(notes || null);
    }

    if (hasRecordedBy) {
      insertColumns.push("recorded_by");
      insertValues.push(session.user.id);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    await execute(
      `INSERT INTO inventory_ledger (${insertColumns.join(", ")}) VALUES (${placeholders})`,
      insertValues
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
