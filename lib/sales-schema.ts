"use server";

import { getTableColumns } from "@/lib/db-helpers";

export type SalesItemTable = "sales_transaction_items" | "transaction_items";

export interface SalesItemConfig {
  table: SalesItemTable;
  variantColumn: "variant_id" | "product_id";
  subtotalColumn: "subtotal" | "total_price";
  requiresId: boolean;
}

export async function getSalesItemConfig(): Promise<SalesItemConfig | null> {
  const salesItemsColumns = await getTableColumns("sales_transaction_items");
  if (salesItemsColumns.length > 0) {
    return {
      table: "sales_transaction_items",
      variantColumn: "variant_id",
      subtotalColumn: salesItemsColumns.includes("subtotal") ? "subtotal" : "total_price",
      requiresId: true,
    };
  }

  const legacyColumns = await getTableColumns("transaction_items");
  if (legacyColumns.length > 0) {
    return {
      table: "transaction_items",
      variantColumn: legacyColumns.includes("variant_id") ? "variant_id" : "product_id",
      subtotalColumn: legacyColumns.includes("subtotal") ? "subtotal" : "total_price",
      requiresId: false,
    };
  }

  return null;
}

export async function getSalesItemJoinConfig(variantColumn: "variant_id" | "product_id") {
  const variantColumns = await getTableColumns("product_variants");
  if (variantColumn === "variant_id" && variantColumns.length > 0) {
    return {
      join: "LEFT JOIN product_variants pv ON sti.variant_id = pv.id",
      nameSelect: "pv.name",
      skuSelect: "pv.sku",
    };
  }

  const productColumns = await getTableColumns("products");
  if (productColumns.length > 0) {
    return {
      join: `LEFT JOIN products p ON sti.${variantColumn} = p.id`,
      nameSelect: "p.name",
      skuSelect: "p.id",
    };
  }

  return {
    join: "",
    nameSelect: "NULL",
    skuSelect: "NULL",
  };
}
