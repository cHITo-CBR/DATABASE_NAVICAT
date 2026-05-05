"use server";

/**
 * PRODUCT MANAGEMENT ACTIONS
 */

import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { uploadImageFromBase64, deleteFromCloudinary } from "./cloudinary";
import { notifyRole } from "@/app/actions/notifications";

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  total_cases: number;
  items_per_case: number;
  packaging_price: number | null;
  is_active: boolean;
  created_at: string;
  category_id: number | null;
  brand_id: number | null;
  packaging_id: number | null;
  category_name?: string | null;
  brand_name?: string | null;
  packaging_type_name?: string | null;
  total_packaging?: string | null;
  net_weight?: string | null;
  product_categories?: { name: string } | null;
  brands?: { name: string } | null;
  packaging_types?: { name: string; description: string | null } | null;
}

export interface ProductVariantRow {
  id?: string;
  product_id?: string;
  name: string;
  sku: string | null;
  unit_price: number;
  packaging_id?: number | null;
  unit_id?: number | null;
  is_active: boolean;
}

export async function getProducts(search?: string): Promise<ProductRow[]> {
  try {
    let sql = `
      SELECT p.*, pc.name AS category_name, b.name AS brand_name,
             pt.name AS packaging_type_raw_name, pt.description AS packaging_type_desc
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN packaging_types pt ON p.packaging_id = pt.id
      WHERE p.is_archived = 0`;
    const params: any[] = [];

    if (search && search.trim()) {
      sql += " AND p.name LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY p.created_at DESC";

    const products = await query(sql, params);

    return products.map((p: any) => ({
      ...p,
      category_name: p.category_name || null,
      brand_name: p.brand_name || null,
      packaging_type_name: p.packaging_type_raw_name
        ? `${p.packaging_type_raw_name}${p.packaging_type_desc ? ` - ${p.packaging_type_desc}` : ""}`
        : null,
      packaging_price: p.packaging_price ? Number(p.packaging_price) : null,
      // Re-nest for frontend compatibility
      product_categories: p.category_name ? { name: p.category_name } : null,
      brands: p.brand_name ? { name: p.brand_name } : null,
      packaging_types: p.packaging_type_raw_name ? { name: p.packaging_type_raw_name, description: p.packaging_type_desc } : null,
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const brandId = formData.get("brandId") as string;
  const packagingId = formData.get("packagingId") as string;
  const totalCases = formData.get("totalCases") as string;
  const packagingPrice = formData.get("packagingPrice") as string;
  const totalPackaging = formData.get("totalPackaging") as string;
  const netWeight = formData.get("netWeight") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const imageFile = formData.get("imageFile") as string;
  const variantsJSON = formData.get("variants") as string;

  if (!name) return { error: "Product name is required." };

  try {
    const productId = generateUUID();

    let finalImageUrl = imageUrl || null;
    if (imageFile && imageFile.startsWith("data:image")) {
      const uploadResult = await uploadImageFromBase64(imageFile, "products");
      if (uploadResult.success && uploadResult.url) {
        finalImageUrl = uploadResult.url;
      }
    }

    await execute(
      `INSERT INTO products (id, name, description, image_url, packaging_id, total_packaging, net_weight,
       total_cases, packaging_price, category_id, brand_id, is_active, is_archived)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [productId, name, description || null, finalImageUrl,
       packagingId ? parseInt(packagingId) : null, totalPackaging || null, netWeight || null,
       totalCases ? parseInt(totalCases) : 0, packagingPrice ? parseFloat(packagingPrice) : 0.00,
       categoryId ? parseInt(categoryId) : null, brandId ? parseInt(brandId) : null]
    );

    let variants: ProductVariantRow[] = [];
    try {
      if (variantsJSON) variants = JSON.parse(variantsJSON);
    } catch (e) {
      console.error("Failed to parse variants JSON", e);
    }

    if (variants.length > 0) {
      for (const v of variants) {
        await execute(
          `INSERT INTO product_variants (id, product_id, name, sku, unit_price, packaging_id, unit_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [generateUUID(), productId, v.name,
           v.sku || `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
           Number(v.unit_price) || 0, v.packaging_id || null, v.unit_id || null]
        );
      }
    } else {
      await execute(
        `INSERT INTO product_variants (id, product_id, name, sku, unit_price, is_active)
         VALUES (?, ?, 'Standard', ?, 0, 1)`,
        [generateUUID(), productId, `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`]
      );
    }

    revalidatePath("/catalog/products");
    revalidatePath("/admin/catalog/products");
    revalidatePath("/notifications");

    await notifyRole("supervisor", "New Product Added", `The product "${name}" has been added to the catalog.`);
    await notifyRole("salesman", "New Product Added", `The product "${name}" is now available for ordering.`);

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create product." };
  }
}

export async function getArchivedProducts(): Promise<ProductRow[]> {
  try {
    const products = await query(
      `SELECT p.*, pc.name AS category_name, b.name AS brand_name,
              pt.name AS packaging_type_raw_name, pt.description AS packaging_type_desc
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN packaging_types pt ON p.packaging_id = pt.id
       WHERE p.is_archived = 1
       ORDER BY p.created_at DESC`
    );

    return products.map((p: any) => ({
      ...p,
      category_name: p.category_name || null,
      brand_name: p.brand_name || null,
      packaging_type_name: p.packaging_type_raw_name
        ? `${p.packaging_type_raw_name}${p.packaging_type_desc ? ` - ${p.packaging_type_desc}` : ""}`
        : null,
      packaging_price: p.packaging_price ? Number(p.packaging_price) : null,
      product_categories: p.category_name ? { name: p.category_name } : null,
      brands: p.brand_name ? { name: p.brand_name } : null,
      packaging_types: p.packaging_type_raw_name ? { name: p.packaging_type_raw_name, description: p.packaging_type_desc } : null,
    }));
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
}

export async function archiveProduct(id: string) {
  try {
    await execute("UPDATE products SET is_archived = 1 WHERE id = ?", [id]);
    revalidatePath("/catalog/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive product." };
  }
}

export async function restoreProduct(id: string) {
  try {
    await execute("UPDATE products SET is_archived = 0 WHERE id = ?", [id]);
    revalidatePath("/archives");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore product." };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const brandId = formData.get("brandId") as string;
  const packagingId = formData.get("packagingId") as string;
  const totalCases = formData.get("totalCases") as string;
  const packagingPrice = formData.get("packagingPrice") as string;
  const totalPackaging = formData.get("totalPackaging") as string;
  const netWeight = formData.get("netWeight") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const variantsJSON = formData.get("variants") as string;

  if (!name) return { error: "Product name is required." };

  try {
    await execute(
      `UPDATE products SET name = ?, description = ?, image_url = ?, packaging_id = ?,
       total_packaging = ?, net_weight = ?, total_cases = ?, packaging_price = ?,
       category_id = ?, brand_id = ? WHERE id = ?`,
      [name, description || null, imageUrl || null,
       packagingId ? parseInt(packagingId) : null, totalPackaging || null, netWeight || null,
       totalCases ? parseInt(totalCases) : 0, packagingPrice ? parseFloat(packagingPrice) : 0.00,
       categoryId ? parseInt(categoryId) : null, brandId ? parseInt(brandId) : null, id]
    );

    // SYNC VARIANTS
    if (variantsJSON) {
      try {
        const variants: ProductVariantRow[] = JSON.parse(variantsJSON);

        const existingVariants = await query<{ id: string }>(
          "SELECT id FROM product_variants WHERE product_id = ?", [id]
        );
        const existingIds = existingVariants.map((v) => v.id);
        const incomingIds = variants.map((v) => v.id).filter(Boolean) as string[];

        // Delete removed variants
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
        for (const delId of toDelete) {
          await execute("DELETE FROM product_variants WHERE id = ?", [delId]);
        }

        // Add or Update variants
        for (const v of variants) {
          if (v.id) {
            await execute(
              `UPDATE product_variants SET product_id = ?, name = ?, sku = ?, unit_price = ?,
               packaging_id = ?, unit_id = ?, is_active = 1 WHERE id = ?`,
              [id, v.name, v.sku, Number(v.unit_price) || 0, v.packaging_id || null, v.unit_id || null, v.id]
            );
          } else {
            await execute(
              `INSERT INTO product_variants (id, product_id, name, sku, unit_price, packaging_id, unit_id, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
              [generateUUID(), id, v.name, v.sku, Number(v.unit_price) || 0, v.packaging_id || null, v.unit_id || null]
            );
          }
        }
      } catch (e) {
        console.error("Failed to sync variants", e);
      }
    }

    revalidatePath("/catalog/products");
    revalidatePath("/admin/catalog/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update product." };
  }
}

export async function getProductVariantsByProductId(productId: string): Promise<ProductVariantRow[]> {
  try {
    return await query(
      "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY unit_price ASC",
      [productId]
    );
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}

export async function getProductVariants(): Promise<{ id: string; name: string; unit_price: number; sku: string | null; product_name?: string; total_cases?: number; packaging_price?: number; packaging_type_name?: string | null }[]> {
  try {
    // First, try to get products that have explicit variants
    const variantRows = await query(
      `SELECT pv.id, pv.product_id, pv.name, pv.unit_price, pv.sku,
              p.name as product_name, p.total_cases, p.packaging_price,
              COALESCE(vpt.name, pt.name, p.total_packaging) as packaging_type_name
       FROM product_variants pv
       LEFT JOIN products p ON pv.product_id = p.id
       LEFT JOIN packaging_types pt ON p.packaging_id = pt.id
       LEFT JOIN packaging_types vpt ON pv.packaging_id = vpt.id
       WHERE pv.is_active = 1 AND (p.is_archived = 0 OR p.is_archived IS NULL)
       ORDER BY p.name ASC, pv.name ASC`
    );

    const mappedVariants = variantRows.map((v: any) => ({
      id: v.id,
      name: v.name,
      unit_price: Number(v.packaging_price) || Number(v.unit_price) || 0,
      sku: v.sku,
      product_name: v.product_name || v.name,
      total_cases: Number(v.total_cases) || 0,
      packaging_type_name: v.packaging_type_name,
    }));

    // Then, get all active products that DON'T have any active variants
    // These products are referenced directly by product ID in transaction_items
    const productIdsWithVariants = variantRows.map((v: any) => v.product_id).filter(Boolean);

    let noVariantSql = `
      SELECT p.id, p.name, p.packaging_price, p.total_cases, p.net_weight,
             COALESCE(pt.name, p.total_packaging) as packaging_type_name
      FROM products p
      LEFT JOIN packaging_types pt ON p.packaging_id = pt.id
      WHERE p.is_archived = 0 AND p.is_active = 1`;
    const params: any[] = [];

    if (productIdsWithVariants.length > 0) {
      const placeholders = productIdsWithVariants.map(() => "?").join(", ");
      noVariantSql += ` AND p.id NOT IN (${placeholders})`;
      params.push(...productIdsWithVariants);
    }

    noVariantSql += ` ORDER BY p.name ASC`;

    const productRows = await query(noVariantSql, params);

    const mappedProducts = productRows.map((p: any) => ({
      id: p.id,
      name: "Standard",
      unit_price: Number(p.packaging_price) || 0,
      sku: null,
      product_name: p.name,
      total_cases: Number(p.total_cases) || 0,
      packaging_type_name: p.packaging_type_name,
    }));

    // Combine: products with variants first, then standalone products
    return [...mappedVariants, ...mappedProducts];
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}
