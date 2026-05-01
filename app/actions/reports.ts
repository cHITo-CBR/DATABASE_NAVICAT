"use server";
import { query, getTableColumns } from "@/lib/db-helpers";

export interface SalesTrendPoint { date: string; total: number; }
export interface CategorySalesPoint { category: string; total: number; }

export async function getSalesTrends(): Promise<SalesTrendPoint[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await query(
      `SELECT total_amount, created_at FROM sales_transactions
       WHERE created_at >= ?
       ORDER BY created_at ASC`,
      [thirtyDaysAgo.toISOString()]
    );

    if (!rows || rows.length === 0) return [];

    const grouped: Record<string, number> = {};
    rows.forEach((t: any) => {
      const date = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[date] = (grouped[date] || 0) + (Number(t.total_amount) || 0);
    });

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    return [];
  }
}

export async function getTopCategories(): Promise<CategorySalesPoint[]> {
  try {
    let rows: any[] = [];
    const hasSalesItems = (await getTableColumns("sales_transaction_items")).length > 0;

    if (hasSalesItems) {
      rows = await query(
        `SELECT sti.subtotal, pc.name as category_name
         FROM sales_transaction_items sti
         LEFT JOIN product_variants pv ON sti.variant_id = pv.id
         LEFT JOIN products p ON pv.product_id = p.id
         LEFT JOIN product_categories pc ON p.category_id = pc.id`
      );
    }

    if (!rows || rows.length === 0) {
      const hasTransactionItems = (await getTableColumns("transaction_items")).length > 0;
      if (hasTransactionItems) {
        rows = await query(
          `SELECT ti.total_price as subtotal, pc.name as category_name
           FROM transaction_items ti
           LEFT JOIN products p ON ti.product_id = p.id
           LEFT JOIN product_categories pc ON p.category_id = pc.id`
        );
      }
    }

    if (!rows || rows.length === 0) return [];

    const grouped: Record<string, number> = {};
    rows.forEach((item: any) => {
      const catName = item.category_name ?? "Uncategorized";
      grouped[catName] = (grouped[catName] || 0) + (Number(item.subtotal) || 0);
    });

    return Object.entries(grouped)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  } catch (error) {
    console.error("Error fetching top categories:", error);
    return [];
  }
}
