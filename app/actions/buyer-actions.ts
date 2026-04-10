"use server";
import { query, queryOne, generateUUID, fromBoolean, toBoolean } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";

// ══════════════════════════════════════════════════════════════
// BUYER DASHBOARD
// ══════════════════════════════════════════════════════════════

interface RequestDbRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface RequestItemDbRow extends RowDataPacket {
  id: string;
  request_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  product_name: string | null;
}

interface OrderDbRow extends RowDataPacket {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_store_name: string | null;
}

interface ProductDbRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  category_id: number | null;
  brand_id: number | null;
  total_packaging: string | null;
  net_weight: string | null;
  is_active: number;
  is_archived: number;
  created_at: string;
  category_name: string | null;
  brand_name: string | null;
}

export async function getBuyerDashboard(userId: string) {
  try {
    // Recent requests
    const requests = await query<RequestDbRow>(`
      SELECT * FROM buyer_requests WHERE salesman_id = ? ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    const requestIds = requests.map(r => r.id);
    let requestItemsMap: Map<string, any[]> = new Map();
    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const items = await query<RequestItemDbRow>(`
        SELECT bri.*, p.name AS product_name
        FROM buyer_request_items bri
        LEFT JOIN products p ON bri.product_id = p.id
        WHERE bri.request_id IN (${placeholders})
      `, requestIds);
      for (const item of items) {
        if (!requestItemsMap.has(item.request_id)) requestItemsMap.set(item.request_id, []);
        requestItemsMap.get(item.request_id)!.push({ ...item, products: item.product_name ? { name: item.product_name } : null });
      }
    }

    // Recent orders
    const orders = await query<OrderDbRow>(`
      SELECT st.id, st.status, st.total_amount, st.created_at, c.store_name AS customer_store_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      WHERE st.salesman_id = ?
      ORDER BY st.created_at DESC LIMIT 5
    `, [userId]);

    // Featured products
    const products = await query<ProductDbRow>(`
      SELECT p.*, pc.name AS category_name, b.name AS brand_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = ? AND p.is_archived = ?
      ORDER BY p.created_at DESC LIMIT 6
    `, [fromBoolean(true), fromBoolean(false)]);

    return {
      recentRequests: requests.map(r => ({ ...r, buyer_request_items: requestItemsMap.get(r.id) || [] })),
      recentOrders: orders.map(o => ({ ...o, customers: o.customer_store_name ? { store_name: o.customer_store_name } : null })),
      featuredProducts: products.map(p => ({
        ...p,
        is_active: toBoolean(p.is_active),
        is_archived: toBoolean(p.is_archived),
        product_categories: p.category_name ? { name: p.category_name } : null,
        brands: p.brand_name ? { name: p.brand_name } : null,
        product_images: [], // Fixed: Default to empty array, removed non-existent table query
      })),
    };
  } catch (error) {
    console.error("getBuyerDashboard error:", error);
    return { recentRequests: [], recentOrders: [], featuredProducts: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// PRODUCT BROWSING
// ══════════════════════════════════════════════════════════════

interface VariantDbRow extends RowDataPacket {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  packaging_type_name: string | null;
  unit_name: string | null;
}

export async function getBuyerProducts(search?: string, categoryId?: number, brandId?: number) {
  try {
    let sql = `
      SELECT p.*, pc.name AS category_name, b.name AS brand_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = ? AND p.is_archived = ?
    `;
    const params: any[] = [fromBoolean(true), fromBoolean(false)];

    if (search) {
      sql += ` AND LOWER(p.name) LIKE ?`;
      params.push(`%${search.toLowerCase()}%`);
    }
    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    }
    if (brandId) {
      sql += ` AND p.brand_id = ?`;
      params.push(brandId);
    }
    sql += ` ORDER BY p.name`;

    const products = await query<ProductDbRow>(sql, params);

    const productIds = products.map(p => p.id);
    let variantsMap: Map<string, any[]> = new Map();

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      
      // Fixed: Removed missing product_images table query from Promise.all to prevent fatal SQL crashes
      const variants = await query<VariantDbRow>(
        `SELECT pv.id, pv.product_id, pv.name, pv.sku, pv.unit_price, pt.name AS packaging_type_name, u.name AS unit_name
         FROM product_variants pv
         LEFT JOIN packaging_types pt ON pv.packaging_id = pt.id
         LEFT JOIN units u ON pv.unit_id = u.id
         WHERE pv.product_id IN (${placeholders})`, 
        productIds
      );

      for (const v of variants) {
        if (!variantsMap.has(v.product_id)) variantsMap.set(v.product_id, []);
        variantsMap.get(v.product_id)!.push({ 
          id: v.id, 
          name: v.name, 
          sku: v.sku, 
          unit_price: v.unit_price,
          packaging_type: v.packaging_type_name,
          unit: v.unit_name
        });
      }
    }

    return products.map(p => ({
      ...p,
      is_active: toBoolean(p.is_active),
      is_archived: toBoolean(p.is_archived),
      product_categories: p.category_name ? { name: p.category_name } : null,
      brands: p.brand_name ? { name: p.brand_name } : null,
      product_images: [], 
      product_variants: variantsMap.get(p.id) || [],
    }));
  } catch (error) {
    console.error("getBuyerProducts error:", error);
    return [];
  }
}

interface ProductDetailDbRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  category_name: string | null;
  brand_name: string | null;
}

interface VariantDetailDbRow extends RowDataPacket {
  id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  packaging_type_name: string | null;
  unit_name: string | null;
}

export async function getProductDetail(productId: string) {
  try {
    const product = await queryOne<ProductDetailDbRow>(`
      SELECT p.*, pc.name AS category_name, b.name AS brand_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `, [productId]);

    if (!product) return null;

    const variants = await query<VariantDetailDbRow>(`
      SELECT pv.id, pv.name, pv.sku, pv.unit_price, pt.name AS packaging_type_name, u.name AS unit_name
      FROM product_variants pv
      LEFT JOIN packaging_types pt ON pv.packaging_type_id = pt.id
      LEFT JOIN units u ON pv.unit_id = u.id
      WHERE pv.product_id = ?
    `, [productId]);

    return {
      ...product,
      product_categories: product.category_name ? { name: product.category_name } : null,
      brands: product.brand_name ? { name: product.brand_name } : null,
      product_images: [], // Fixed
      product_variants: variants.map(v => ({
        id: v.id, name: v.name, sku: v.sku, unit_price: v.unit_price,
        packaging_types: v.packaging_type_name ? { name: v.packaging_type_name } : null,
        units: v.unit_name ? { name: v.unit_name } : null,
      })),
    };
  } catch (error) {
    console.error("getProductDetail error:", error);
    return null;
  }
}

interface FilterRow extends RowDataPacket {
  id: number;
  name: string;
}

export async function getProductFilters() {
  try {
    const [categories, brands] = await Promise.all([
      query<FilterRow>(`SELECT id, name FROM product_categories WHERE is_archived = ? ORDER BY name`, [fromBoolean(false)]),
      query<FilterRow>(`SELECT id, name FROM brands WHERE is_archived = ? ORDER BY name`, [fromBoolean(false)]),
    ]);
    return { categories, brands };
  } catch (error) {
    console.error("getProductFilters error:", error);
    return { categories: [], brands: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER REQUESTS (buyer's own)
// ══════════════════════════════════════════════════════════════

interface OwnRequestDbRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  notes: string | null;
  status: string;
  created_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

export async function getBuyerOwnRequests(userId: string) {
  try {
    const requests = await query<OwnRequestDbRow>(`
      SELECT br.*, c.store_name AS customer_store_name, u.full_name AS salesman_full_name
      FROM buyer_requests br
      LEFT JOIN customers c ON br.customer_id = c.id
      LEFT JOIN users u ON br.salesman_id = u.id
      WHERE br.salesman_id = ?
      ORDER BY br.created_at DESC
    `, [userId]);

    const requestIds = requests.map(r => r.id);
    let itemsMap: Map<string, any[]> = new Map();
    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const items = await query<RequestItemDbRow>(`
        SELECT bri.*, p.name AS product_name
        FROM buyer_request_items bri
        LEFT JOIN products p ON bri.product_id = p.id
        WHERE bri.request_id IN (${placeholders})
      `, requestIds);
      for (const item of items) {
        if (!itemsMap.has(item.request_id)) itemsMap.set(item.request_id, []);
        itemsMap.get(item.request_id)!.push({ ...item, products: item.product_name ? { name: item.product_name } : null });
      }
    }

    return requests.map(r => ({
      ...r,
      customers: r.customer_store_name ? { store_name: r.customer_store_name } : null,
      users: r.salesman_full_name ? { full_name: r.salesman_full_name } : null,
      buyer_request_items: itemsMap.get(r.id) || [],
    }));
  } catch (error) {
    console.error("getBuyerOwnRequests error:", error);
    return [];
  }
}

export async function createBuyerRequestFromBuyer(input: { customer_id: string; notes?: string; items: { product_id: string; quantity: number; notes?: string }[]; userId: string }) {
  try {
    const requestId = generateUUID();
    await query(`
      INSERT INTO buyer_requests (id, salesman_id, customer_id, notes, status)
      VALUES (?, ?, ?, ?, ?)
    `, [requestId, input.userId, input.customer_id, input.notes || null, "pending"]);

    if (input.items.length > 0) {
      for (const item of input.items) {
        const itemId = generateUUID();
        await query(`
          INSERT INTO buyer_request_items (id, request_id, product_id, quantity, notes)
          VALUES (?, ?, ?, ?, ?)
        `, [itemId, requestId, item.product_id, item.quantity, item.notes || null]);
      }
    }

    revalidatePath("/customers/buyer-requests");
    return { success: true, data: { id: requestId } };
  } catch (error: any) {
    console.error("createBuyerRequestFromBuyer error:", error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER ORDERS
// ══════════════════════════════════════════════════════════════

interface BuyerOrderDbRow extends RowDataPacket {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer_store_name: string | null;
}

interface OrderItemDbRow extends RowDataPacket {
  id: string;
  transaction_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_name: string | null;
  variant_sku: string | null;
  product_name: string | null;
}

export async function getBuyerOrders(userId: string) {
  try {
    const orders = await query<BuyerOrderDbRow>(`
      SELECT st.id, st.status, st.total_amount, st.notes, st.created_at, c.store_name AS customer_store_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      WHERE st.salesman_id = ?
      ORDER BY st.created_at DESC
    `, [userId]);

    const orderIds = orders.map(o => o.id);
    let itemsMap: Map<string, any[]> = new Map();
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = await query<OrderItemDbRow>(`
        SELECT sti.*, pv.name AS variant_name, pv.sku AS variant_sku, p.name AS product_name
        FROM sales_transaction_items sti
        LEFT JOIN product_variants pv ON sti.variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        WHERE sti.transaction_id IN (${placeholders})
      `, orderIds);
      for (const item of items) {
        if (!itemsMap.has(item.transaction_id)) itemsMap.set(item.transaction_id, []);
        itemsMap.get(item.transaction_id)!.push({
          ...item,
          product_variants: item.variant_name ? { name: item.variant_name, sku: item.variant_sku, products: item.product_name ? { name: item.product_name } : null } : null,
        });
      }
    }

    return orders.map(o => ({
      ...o,
      customers: o.customer_store_name ? { store_name: o.customer_store_name } : null,
      sales_transaction_items: itemsMap.get(o.id) || [],
    }));
  } catch (error) {
    console.error("getBuyerOrders error:", error);
    return [];
  }
}

interface OrderDetailDbRow extends RowDataPacket {
  id: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

interface OrderDetailItemDbRow extends RowDataPacket {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_name: string | null;
  variant_sku: string | null;
  variant_unit_price: number | null;
  product_name: string | null;
}

export async function getOrderDetail(orderId: string) {
  try {
    const order = await queryOne<OrderDetailDbRow>(`
      SELECT st.*, c.store_name AS customer_store_name, u.full_name AS salesman_full_name
      FROM sales_transactions st
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u ON st.salesman_id = u.id
      WHERE st.id = ?
    `, [orderId]);

    if (!order) return null;

    const items = await query<OrderDetailItemDbRow>(`
      SELECT sti.id, sti.quantity, sti.unit_price, sti.subtotal,
             pv.name AS variant_name, pv.sku AS variant_sku, pv.unit_price AS variant_unit_price,
             p.name AS product_name
      FROM sales_transaction_items sti
      LEFT JOIN product_variants pv ON sti.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE sti.transaction_id = ?
    `, [orderId]);

    return {
      ...order,
      customers: order.customer_store_name ? { store_name: order.customer_store_name } : null,
      users: order.salesman_full_name ? { full_name: order.salesman_full_name } : null,
      sales_transaction_items: items.map(i => ({
        id: i.id, quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal,
        product_variants: i.variant_name ? { name: i.variant_name, sku: i.variant_sku, unit_price: i.variant_unit_price, products: i.product_name ? { name: i.product_name } : null } : null,
      })),
    };
  } catch (error) {
    console.error("getOrderDetail error:", error);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

interface NotificationDbRow extends RowDataPacket {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export async function getBuyerNotifications(userId: string) {
  try {
    const notifications = await query<NotificationDbRow>(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `, [userId]);
    return notifications.map(n => ({ ...n, is_read: toBoolean(n.is_read) }));
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER PROFILE
// ══════════════════════════════════════════════════════════════

interface UserDbRow extends RowDataPacket {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  is_active: number;
  is_approved: number;
}

interface CustomerDbRow extends RowDataPacket {
  id: string;
  store_name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
}

export async function getBuyerProfile(userId: string) {
  try {
    const user = await queryOne<UserDbRow>(`SELECT * FROM users WHERE id = ?`, [userId]);
    const customer = await queryOne<CustomerDbRow>(`SELECT * FROM customers WHERE assigned_salesman_id = ?`, [userId]);
    const favoritesCount = await getFavoriteCounts(userId);
    return {
      user: user ? { ...user, is_active: toBoolean(user.is_active), is_approved: toBoolean(user.is_approved) } : null,
      customer,
      favoritesCount
    };
  } catch {
    return { user: null, customer: null };
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

interface CustomerOptionDbRow extends RowDataPacket {
  id: string;
  store_name: string;
}

export async function getCustomersForBuyer() {
  try {
    const customers = await query<CustomerOptionDbRow>(`
      SELECT id, store_name FROM customers WHERE is_active = ? ORDER BY store_name
    `, [fromBoolean(true)]);
    return customers;
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER FAVORITES
// ══════════════════════════════════════════════════════════════

export async function toggleFavorite(userId: string, productId: string) {
  try {
    const existing = await queryOne(`SELECT * FROM product_favorites WHERE user_id = ? AND product_id = ?`, [userId, productId]);
    if (existing) {
      await query(`DELETE FROM product_favorites WHERE user_id = ? AND product_id = ?`, [userId, productId]);
      return { success: true, isFavorite: false };
    } else {
      await query(`INSERT INTO product_favorites (user_id, product_id) VALUES (?, ?)`, [userId, productId]);
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error("toggleFavorite error:", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}

export async function getFavoriteCounts(userId: string) {
  try {
    const row = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM product_favorites WHERE user_id = ?`, [userId]);
    return row?.total || 0;
  } catch {
    return 0;
  }
}

export async function getUserFavorites(userId: string) {
  try {
    const rows = await query<RowDataPacket & { product_id: string }>(`SELECT product_id FROM product_favorites WHERE user_id = ?`, [userId]);
    return rows.map(r => r.product_id);
  } catch {
    return [];
  }
}
