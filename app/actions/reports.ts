import { query, queryOne } from "@/lib/db-helpers";

export interface SalesTrendPoint {
  date: string;
  total: number;
}

export interface CategorySalesPoint {
  category: string;
  total: number;
}

export async function getSalesTrends(): Promise<SalesTrendPoint[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const data = await query<any>(
      `SELECT total_amount, created_at 
       FROM sales_transactions 
       WHERE created_at >= ? 
       ORDER BY created_at ASC`,
      [dateStr]
    );

    if (!data || data.length === 0) return [];

    // Group by date
    const grouped: Record<string, number> = {};
    data.forEach((t: any) => {
      const date = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[date] = (grouped[date] || 0) + (parseFloat(t.total_amount) || 0);
    });

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    return [];
  }
}

export async function getTopCategories(): Promise<CategorySalesPoint[]> {
  try {
    const data = await query<any>(
      `SELECT pc.name as category_name, SUM(sti.subtotal) as total
       FROM sales_transaction_items sti
       JOIN product_variants pv ON sti.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       GROUP BY pc.name
       ORDER BY total DESC
       LIMIT 5`
    );

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      category: row.category_name ?? "Uncategorized",
      total: parseFloat(row.total) || 0
    }));
  } catch (error) {
    console.error("Error fetching top categories:", error);
    return [];
  }
}
