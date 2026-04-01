"use server";

import { query, buildLikeSearch } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2/promise";

export type SearchResult = {
  id: string;
  type: "product" | "customer" | "user" | "transaction";
  title: string;
  subtitle: string;
  url: string;
};

interface ProductResult extends RowDataPacket {
  id: string;
  name: string;
  sku: string | null;
}

interface CustomerResult extends RowDataPacket {
  id: string;
  store_name: string;
  contact_person: string | null;
}

interface UserResult extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
}

export async function globalSearch(searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) return [];

  const results: SearchResult[] = [];

  try {
    // Search Products
    const { condition: nameCondition, value: nameValue } = buildLikeSearch("name", searchQuery);
    const products = await query<ProductResult>(
      `SELECT id, name, sku FROM products WHERE ${nameCondition} LIMIT 3`,
      [nameValue]
    );

    products.forEach((p) => {
      results.push({
        id: `prod_${p.id}`,
        type: "product",
        title: p.name,
        subtitle: `SKU: ${p.sku || "N/A"}`,
        url: `/catalog/products`,
      });
    });

    // Search Customers
    const { condition: storeCondition, value: storeValue } = buildLikeSearch("store_name", searchQuery);
    const customers = await query<CustomerResult>(
      `SELECT id, store_name, contact_person FROM customers WHERE ${storeCondition} LIMIT 3`,
      [storeValue]
    );

    customers.forEach((c) => {
      results.push({
        id: `cust_${c.id}`,
        type: "customer",
        title: c.store_name,
        subtitle: `Contact: ${c.contact_person || "N/A"}`,
        url: `/customers`,
      });
    });

    // Search Users
    const { condition: userCondition, value: userValue } = buildLikeSearch("full_name", searchQuery);
    const users = await query<UserResult>(
      `SELECT id, full_name, email FROM users WHERE ${userCondition} LIMIT 3`,
      [userValue]
    );

    users.forEach((u) => {
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
