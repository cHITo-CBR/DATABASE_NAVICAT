"use server";
import supabase from "@/lib/db";
import { generateUUID } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { uploadImageFromBase64, deleteFromCloudinary } from "./cloudinary";

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

export async function getProducts(search?: string): Promise<ProductRow[]> {
  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        product_categories(name),
        brands(name),
        packaging_types(name, description)
      `)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (search && search.trim()) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    return (products || []).map((p: any) => ({
      ...p,
      category_name: p.product_categories?.name || null,
      brand_name: p.brands?.name || null,
      packaging_type_name: p.packaging_types
        ? `${p.packaging_types.name}${p.packaging_types.description ? ` - ${p.packaging_types.description}` : ""}`
        : null,
      packaging_price: p.packaging_price ? Number(p.packaging_price) : null,
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

    // Handle image upload to Cloudinary
    let finalImageUrl = imageUrl || null;
    if (imageFile && imageFile.startsWith("data:image")) {
      const uploadResult = await uploadImageFromBase64(imageFile, "products");
      if (uploadResult.success && uploadResult.url) {
        finalImageUrl = uploadResult.url;
      }
    }

    const { error: insertError } = await supabase.from("products").insert({
      id: productId,
      name,
      description: description || null,
      image_url: finalImageUrl,
      packaging_id: packagingId ? parseInt(packagingId) : null,
      total_packaging: totalPackaging || null,
      net_weight: netWeight || null,
      total_cases: totalCases ? parseInt(totalCases) : 0,
      packaging_price: packagingPrice ? parseFloat(packagingPrice) : 0.00,
      category_id: categoryId ? parseInt(categoryId) : null,
      brand_id: brandId ? parseInt(brandId) : null,
      is_active: true,
      is_archived: false,
    });

    if (insertError) throw insertError;

    // Handle variants
    let variants: ProductVariantRow[] = [];
    try {
      if (variantsJSON) variants = JSON.parse(variantsJSON);
    } catch (e) {
      console.error("Failed to parse variants JSON", e);
    }

    if (variants.length > 0) {
      const variantRows = variants.map((v) => ({
        id: generateUUID(),
        product_id: productId,
        name: v.name,
        sku: v.sku || `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        unit_price: Number(v.unit_price) || 0,
        packaging_id: v.packaging_id || null,
        unit_id: v.unit_id || null,
        is_active: true,
      }));
      await supabase.from("product_variants").insert(variantRows);
    } else {
      await supabase.from("product_variants").insert({
        id: generateUUID(),
        product_id: productId,
        name: "Standard",
        sku: `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        unit_price: 0,
        is_active: true,
      });
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
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        product_categories(name),
        brands(name),
        packaging_types(name, description)
      `)
      .eq("is_archived", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (products || []).map((p: any) => ({
      ...p,
      category_name: p.product_categories?.name || null,
      brand_name: p.brands?.name || null,
      packaging_type_name: p.packaging_types
        ? `${p.packaging_types.name}${p.packaging_types.description ? ` - ${p.packaging_types.description}` : ""}`
        : null,
      packaging_price: p.packaging_price ? Number(p.packaging_price) : null,
    }));
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
}

export async function archiveProduct(id: string) {
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_archived: true })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/catalog/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive product." };
  }
}

export async function restoreProduct(id: string) {
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_archived: false })
      .eq("id", id);
    if (error) throw error;
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
    const { error: updateError } = await supabase
      .from("products")
      .update({
        name,
        description: description || null,
        image_url: imageUrl || null,
        packaging_id: packagingId ? parseInt(packagingId) : null,
        total_packaging: totalPackaging || null,
        net_weight: netWeight || null,
        total_cases: totalCases ? parseInt(totalCases) : 0,
        packaging_price: packagingPrice ? parseFloat(packagingPrice) : 0.00,
        category_id: categoryId ? parseInt(categoryId) : null,
        brand_id: brandId ? parseInt(brandId) : null,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Handle variants synchronization
    if (variantsJSON) {
      try {
        const variants: ProductVariantRow[] = JSON.parse(variantsJSON);

        // Get existing variants
        const { data: existingVariants } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", id);

        const existingIds = (existingVariants || []).map((v: any) => v.id);
        const incomingIds = variants.map((v) => v.id).filter(Boolean) as string[];

        // Delete removed variants
        const toDelete = existingIds.filter((eid: string) => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
          await supabase.from("product_variants").delete().in("id", toDelete);
        }

        // Upsert variants
        for (const v of variants) {
          if (v.id) {
            await supabase
              .from("product_variants")
              .update({
                product_id: id,
                name: v.name,
                sku: v.sku,
                unit_price: Number(v.unit_price) || 0,
                packaging_id: v.packaging_id || null,
                unit_id: v.unit_id || null,
                is_active: true,
              })
              .eq("id", v.id);
          } else {
            await supabase.from("product_variants").insert({
              id: generateUUID(),
              product_id: id,
              name: v.name,
              sku: v.sku,
              unit_price: Number(v.unit_price) || 0,
              packaging_id: v.packaging_id || null,
              unit_id: v.unit_id || null,
              is_active: true,
            });
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
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("unit_price", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}

export async function getProductVariants(): Promise<{ id: string; name: string; unit_price: number; sku: string | null }[]> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id, name, unit_price, sku")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}
