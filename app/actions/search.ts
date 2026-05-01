"use server";
import { query } from "@/lib/db-helpers";

export type SearchResult = {
  id: string;
  type: "product" | "customer" | "user" | "transaction";
  title: string;
  subtitle: string;
  url: string;
};

export async function globalSearch(searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) return [];

  const results: SearchResult[] = [];
  const pattern = `%${searchQuery}%`;

  try {
    // Search Products (MySQL default collation is case-insensitive)
    const products = await query(
      "SELECT id, name, sku FROM products WHERE name LIKE ? LIMIT 3",
      [pattern]
    );

    products.forEach((p: any) => {
      results.push({
        id: `prod_${p.id}`,
        type: "product",
        title: p.name,
        subtitle: `SKU: ${p.sku || "N/A"}`,
        url: `/catalog/products`,
      });
    });

    // Search Customers
    const customers = await query(
      "SELECT id, store_name, contact_person FROM customers WHERE store_name LIKE ? LIMIT 3",
      [pattern]
    );

    customers.forEach((c: any) => {
      results.push({
        id: `cust_${c.id}`,
        type: "customer",
        title: c.store_name,
        subtitle: `Contact: ${c.contact_person || "N/A"}`,
        url: `/customers`,
      });
    });

    // Search Users
    const users = await query(
      "SELECT id, full_name, email FROM users WHERE full_name LIKE ? LIMIT 3",
      [pattern]
    );

    users.forEach((u: any) => {
      results.push({
        id: `user_${u.id}`,
        type: "user",
        title: u.full_name,
        subtitle: u.email,
        url: `/users`,
      });
    });

    return results;
  } catch (error) {
    console.error("Error in global search:", error);
    return [];
  }
}
