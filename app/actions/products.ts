"use server";

import { query, queryOne, insert, update, remove, transaction, generateUUID, fromBoolean, toBoolean, buildLikeSearch } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  category_id: number | null;
  brand_id: number | null;
  category_name?: string | null;
  brand_name?: string | null;
  total_packaging: string | null;
  net_weight: string | null;
}

interface ProductRowDB extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  is_archived: number;
  created_at: string;
  category_id: number | null;
  brand_id: number | null;
  category_name: string | null;
  brand_name: string | null;
  total_packaging: string | null;
  net_weight: string | null;
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

interface ProductVariantRowDB extends RowDataPacket {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  packaging_id: number | null;
  unit_id: number | null;
  is_active: number;
}

interface ProductIdResult extends RowDataPacket {
  id: string;
}

export async function getProducts(search?: string): Promise<ProductRow[]> {
  try {
    let sql = `
      SELECT p.*, 
             pc.name as category_name, 
             b.name as brand_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_archived = ?
    `;
    const params: any[] = [fromBoolean(false)];

    if (search && search.trim()) {
      const { condition, value } = buildLikeSearch("p.name", search);
      sql += ` AND ${condition}`;
      params.push(value);
    }

    sql += " ORDER BY p.created_at DESC";

    const products = await query<ProductRowDB>(sql, params);
    return products.map(p => ({ ...p, is_active: toBoolean(p.is_active) }));
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
  const totalPackaging = formData.get("totalPackaging") as string;
  const netWeight = formData.get("netWeight") as string;
  const variantsJSON = formData.get("variants") as string;

  if (!name) return { error: "Product name is required." };

  try {
    const productId = generateUUID();

    await insert(
      `INSERT INTO products (id, name, description, category_id, brand_id, total_packaging, net_weight, is_active, is_archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        productId,
        name,
        description || null,
        categoryId ? parseInt(categoryId) : null,
        brandId ? parseInt(brandId) : null,
        totalPackaging || null,
        netWeight || null,
        fromBoolean(true),
        fromBoolean(false)
      ]
    );

    // Handle variants
    let variants: ProductVariantRow[] = [];
    try {
      if (variantsJSON) {
        variants = JSON.parse(variantsJSON);
      }
    } catch (e) {
      console.error("Failed to parse variants JSON", e);
    }

    if (variants.length > 0) {
      for (const v of variants) {
        const variantId = generateUUID();
        await insert(
          `INSERT INTO product_variants (id, product_id, name, sku, unit_price, packaging_id, unit_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            variantId,
            productId,
            v.name,
            v.sku || `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
            Number(v.unit_price) || 0,
            v.packaging_id || null,
            v.unit_id || null,
            fromBoolean(true)
          ]
        );
      }
    } else {
      // Automatically create a default variant if none provided
      const variantId = generateUUID();
      await insert(
        `INSERT INTO product_variants (id, product_id, name, sku, unit_price, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          variantId,
          productId,
          "Standard",
          `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          0,
          fromBoolean(true)
        ]
      );
    }

    revalidatePath("/catalog/products");
    revalidatePath("/admin/catalog/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create product." };
  }
}

export async function getArchivedProducts(): Promise<ProductRow[]> {
  try {
    const products = await query<ProductRowDB>(
      `SELECT p.*, 
              pc.name as category_name, 
              b.name as brand_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.is_archived = ?
       ORDER BY p.created_at DESC`,
      [fromBoolean(true)]
    );
    return products.map(p => ({ ...p, is_active: toBoolean(p.is_active) }));
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
}

export async function archiveProduct(id: string) {
  try {
    await update(
      "UPDATE products SET is_archived = ? WHERE id = ?",
      [fromBoolean(true), id]
    );
    revalidatePath("/catalog/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive product." };
  }
}

export async function restoreProduct(id: string) {
  try {
    await update(
      "UPDATE products SET is_archived = ? WHERE id = ?",
      [fromBoolean(false), id]
    );
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
  const totalPackaging = formData.get("totalPackaging") as string;
  const netWeight = formData.get("netWeight") as string;
  const variantsJSON = formData.get("variants") as string;

  if (!name) return { error: "Product name is required." };

  try {
    await update(
      `UPDATE products 
       SET name = ?, description = ?, category_id = ?, brand_id = ?, total_packaging = ?, net_weight = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        categoryId ? parseInt(categoryId) : null,
        brandId ? parseInt(brandId) : null,
        totalPackaging || null,
        netWeight || null,
        id
      ]
    );

    // Handle variants synchronization
    if (variantsJSON) {
      try {
        const variants: ProductVariantRow[] = JSON.parse(variantsJSON);
        
        // 1. Get existing variants for this product
        const existingVariants = await query<ProductIdResult>(
          "SELECT id FROM product_variants WHERE product_id = ?",
          [id]
        );
        
        const existingIds = existingVariants.map(v => v.id);
        const incomingIds = variants.map(v => v.id).filter(Boolean) as string[];
        
        // 2. Delete variants that are no longer in the list
        const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
        for (const variantId of toDelete) {
          await remove("DELETE FROM product_variants WHERE id = ?", [variantId]);
        }
        
        // 3. Update or Insert variants
        for (const v of variants) {
          const variantData = [
            id,
            v.name,
            v.sku,
            Number(v.unit_price) || 0,
            v.packaging_id || null,
            v.unit_id || null,
            fromBoolean(true)
          ];
          
          if (v.id) {
            await update(
              `UPDATE product_variants 
               SET product_id = ?, name = ?, sku = ?, unit_price = ?, packaging_id = ?, unit_id = ?, is_active = ?
               WHERE id = ?`,
              [...variantData, v.id]
            );
          } else {
            const newVariantId = generateUUID();
            await insert(
              `INSERT INTO product_variants (id, product_id, name, sku, unit_price, packaging_id, unit_id, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [newVariantId, ...variantData]
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
    const variants = await query<ProductVariantRowDB>(
      "SELECT * FROM product_variants WHERE product_id = ? AND is_active = ? ORDER BY unit_price ASC",
      [productId, fromBoolean(true)]
    );
    return variants.map(v => ({ ...v, is_active: toBoolean(v.is_active) }));
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}

export async function getProductVariants(): Promise<{ id: string; name: string; unit_price: number; sku: string | null }[]> {
  try {
    return await query<RowDataPacket & { id: string; name: string; unit_price: number; sku: string | null }>(
      "SELECT id, name, unit_price, sku FROM product_variants WHERE is_active = ? ORDER BY name ASC",
      [fromBoolean(true)]
    );
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}
