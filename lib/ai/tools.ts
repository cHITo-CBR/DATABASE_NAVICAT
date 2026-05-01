import { query, queryOne } from "@/lib/db-helpers";

// 🔹 Low stock
export async function getLowStock() {
  return await query(
    "SELECT name, total_cases FROM products WHERE total_cases < 10 AND is_archived = 0"
  );
}

// 🔹 Top salesman
export async function getTopSalesman() {
  const data = await query(
    `SELECT st.salesman_id, st.total_amount, u.full_name
     FROM sales_transactions st
     LEFT JOIN users u ON st.salesman_id = u.id
     WHERE st.status = 'completed'`
  );

  if (!data || data.length === 0) return null;

  // Aggregate by salesman
  const aggregated = data.reduce((acc: any, curr: any) => {
    const name = curr.full_name || "Unknown";
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name] += Number(curr.total_amount);
    return acc;
  }, {});

  const topSalesman = Object.entries(aggregated).reduce((a: any, b: any) => a[1] > b[1] ? a : b);
  return { name: topSalesman[0], total: topSalesman[1] };
}

// 🔹 Top Customer
export async function getTopCustomer() {
  const data = await query(
    `SELECT st.customer_id, st.total_amount, c.store_name
     FROM sales_transactions st
     LEFT JOIN customers c ON st.customer_id = c.id
     WHERE st.status = 'completed'`
  );

  if (!data || data.length === 0) return null;

  const aggregated = data.reduce((acc: any, curr: any) => {
    const name = curr.store_name || "Unknown Store";
    acc[name] = (acc[name] || 0) + Number(curr.total_amount);
    return acc;
  }, {});

  const top = Object.entries(aggregated).reduce((a: any, b: any) => a[1] > b[1] ? a : b);
  return { name: top[0], total: top[1] };
}

// 🔹 Sales Summary
export async function getSalesSummary() {
  const row = await queryOne<{ total: number; count: number }>(
    "SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales_transactions WHERE status = 'completed'"
  );

  return { total: row?.total ?? 0, count: row?.count ?? 0 };
}
