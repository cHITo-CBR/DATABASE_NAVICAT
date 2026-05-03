"use server";

import { query, queryOne, getTableColumns } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";

export interface BuyerOrderRow {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  item_count: number;
  primary_item: string | null;
}

type OrderStatusFilter = "all" | "pending" | "completed" | "processing" | "cancelled";

function normalizeStatusFilter(status?: string): OrderStatusFilter {
  const value = (status || "all").toLowerCase();
  if (value === "pending" || value === "completed" || value === "processing" || value === "cancelled") {
    return value;
  }
  return "all";
}

export async function getBuyerOrders(status?: string): Promise<BuyerOrderRow[]> {
  const session = await getSession();
  if (!session || session.user.role !== "buyer") return [];

  const requestColumns = await getTableColumns("buyer_requests");
  if (requestColumns.length === 0) return [];

  const buyerId = session.user.id;
  const customerId = session.user.linked_customer_id || session.user.customer_id || null;

  let filterColumn: "buyer_id" | "customer_id" | null = null;
  let filterValue: string | null = null;

  if (requestColumns.includes("buyer_id")) {
    filterColumn = "buyer_id";
    filterValue = buyerId;
  } else if (requestColumns.includes("customer_id") && customerId) {
    filterColumn = "customer_id";
    filterValue = customerId;
  }

  if (!filterColumn || !filterValue) return [];

  const itemColumns = await getTableColumns("buyer_request_items");
  const hasItems = itemColumns.length > 0;
  const hasProductId = itemColumns.includes("product_id");
  const hasVariantId = itemColumns.includes("variant_id");
  const hasSubtotal = itemColumns.includes("subtotal");
  const hasUnitPrice = itemColumns.includes("unit_price");

  const productsColumns = await getTableColumns("products");
  const variantColumns = await getTableColumns("product_variants");

  const filter = normalizeStatusFilter(status);
  let statusClause = "";
  const statusParams: string[] = [];
  if (filter !== "all" && requestColumns.includes("status")) {
    if (filter === "completed") {
      statusClause = "AND br.status IN ('completed','processed')";
    } else if (filter === "processing") {
      statusClause = "AND br.status IN ('processing','approved','for_approval','shipped','delivered')";
    } else {
      statusClause = "AND br.status = ?";
      statusParams.push(filter);
    }
  }

  if (!hasItems) {
    const rows = await query(
      `SELECT br.id, br.status, br.created_at,
              ${requestColumns.includes("total_amount") ? "br.total_amount" : "0"} as total_amount
       FROM buyer_requests br
       WHERE br.${filterColumn} = ? ${statusClause}
       ORDER BY br.created_at DESC`,
      [filterValue, ...statusParams]
    );

    return rows.map((row: any) => ({
      id: String(row.id),
      status: row.status || "pending",
      created_at: row.created_at,
      total_amount: Number(row.total_amount) || 0,
      item_count: 0,
      primary_item: null,
    }));
  }

  let joinClause = "";
  let nameSelect = "NULL";
  if (hasVariantId && variantColumns.length > 0) {
    joinClause = "LEFT JOIN product_variants pv ON bri.variant_id = pv.id LEFT JOIN products p ON pv.product_id = p.id";
    nameSelect = "COALESCE(pv.name, p.name)";
  } else if (hasProductId && productsColumns.length > 0) {
    joinClause = "LEFT JOIN products p ON bri.product_id = p.id";
    nameSelect = "p.name";
  }

  const totalExpr = requestColumns.includes("total_amount")
    ? "br.total_amount"
    : hasSubtotal
      ? "COALESCE(SUM(bri.subtotal), 0)"
      : hasUnitPrice
        ? "COALESCE(SUM(bri.unit_price * bri.quantity), 0)"
        : "0";

  const rows = await query(
    `SELECT br.id, br.status, br.created_at,
            ${totalExpr} as total_amount,
            COUNT(bri.id) as item_count,
            MIN(${nameSelect}) as primary_item
     FROM buyer_requests br
     LEFT JOIN buyer_request_items bri ON bri.request_id = br.id
     ${joinClause}
     WHERE br.${filterColumn} = ? ${statusClause}
     GROUP BY br.id, br.status, br.created_at
     ORDER BY br.created_at DESC`,
    [filterValue, ...statusParams]
  );

  return rows.map((row: any) => ({
    id: String(row.id),
    status: row.status || "pending",
    created_at: row.created_at,
    total_amount: Number(row.total_amount) || 0,
    item_count: Number(row.item_count) || 0,
    primary_item: row.primary_item || null,
  }));
}
