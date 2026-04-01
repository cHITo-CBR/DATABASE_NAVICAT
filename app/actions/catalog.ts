"use server";

import { query, insert, update, remove, fromBoolean, toBoolean } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";

// ── Categories ──────────────────────────────────────────────
export interface CategoryRow { 
  id: number; 
  name: string; 
  description: string | null; 
  created_at: string; 
  is_archived: boolean; 
}

interface CategoryRowDB extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: number;
}

export async function getCategories(): Promise<CategoryRow[]> {
  try {
    const categories = await query<CategoryRowDB>(
      "SELECT * FROM product_categories WHERE is_archived = ? ORDER BY name",
      [fromBoolean(false)]
    );
    return categories.map(c => ({ ...c, is_archived: toBoolean(c.is_archived) }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getArchivedCategories(): Promise<CategoryRow[]> {
  try {
    const categories = await query<CategoryRowDB>(
      "SELECT * FROM product_categories WHERE is_archived = ? ORDER BY name",
      [fromBoolean(true)]
    );
    return categories.map(c => ({ ...c, is_archived: toBoolean(c.is_archived) }));
  } catch (error) {
    console.error("Error fetching archived categories:", error);
    return [];
  }
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await insert(
      "INSERT INTO product_categories (name, description, created_at) VALUES (?, ?, NOW())",
      [name, description || null]
    );
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create category." };
  }
}

export async function updateCategory(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await update(
      "UPDATE product_categories SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id]
    );
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update category." };
  }
}

export async function archiveCategory(id: number) {
  try {
    await update(
      "UPDATE product_categories SET is_archived = ? WHERE id = ?",
      [fromBoolean(true), id]
    );
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive category." };
  }
}

export async function restoreCategory(id: number) {
  try {
    await update(
      "UPDATE product_categories SET is_archived = ? WHERE id = ?",
      [fromBoolean(false), id]
    );
    revalidatePath("/admin/catalog/categories");
    revalidatePath("/catalog/categories");
    revalidatePath("/admin/archives");
    revalidatePath("/archives");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore category." };
  }
}

export async function deleteCategory(id: number) {
  try {
    await remove("DELETE FROM product_categories WHERE id = ?", [id]);
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete category." };
  }
}

// ── Brands ──────────────────────────────────────────────────
export interface BrandRow { 
  id: number; 
  name: string; 
  description: string | null; 
  created_at: string; 
  is_archived: boolean; 
}

interface BrandRowDB extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: number;
}

export async function getBrands(): Promise<BrandRow[]> {
  try {
    const brands = await query<BrandRowDB>(
      "SELECT * FROM brands WHERE is_archived = ? ORDER BY name",
      [fromBoolean(false)]
    );
    return brands.map(b => ({ ...b, is_archived: toBoolean(b.is_archived) }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function getArchivedBrands(): Promise<BrandRow[]> {
  try {
    const brands = await query<BrandRowDB>(
      "SELECT * FROM brands WHERE is_archived = ? ORDER BY name",
      [fromBoolean(true)]
    );
    return brands.map(b => ({ ...b, is_archived: toBoolean(b.is_archived) }));
  } catch (error) {
    console.error("Error fetching archived brands:", error);
    return [];
  }
}

export async function createBrand(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await insert(
      "INSERT INTO brands (name, description, created_at) VALUES (?, ?, NOW())",
      [name, description || null]
    );
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create brand." };
  }
}

export async function updateBrand(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await update(
      "UPDATE brands SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id]
    );
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update brand." };
  }
}

export async function archiveBrand(id: number) {
  try {
    await update(
      "UPDATE brands SET is_archived = ? WHERE id = ?",
      [fromBoolean(true), id]
    );
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive brand." };
  }
}

export async function restoreBrand(id: number) {
  try {
    await update(
      "UPDATE brands SET is_archived = ? WHERE id = ?",
      [fromBoolean(false), id]
    );
    revalidatePath("/admin/catalog/brands");
    revalidatePath("/catalog/brands");
    revalidatePath("/admin/archives");
    revalidatePath("/archives");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore brand." };
  }
}

export async function deleteBrand(id: number) {
  try {
    await remove("DELETE FROM brands WHERE id = ?", [id]);
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete brand." };
  }
}

// ── Units ──────────────────────────────────────────────────
export interface UnitRow { 
  id: number; 
  name: string; 
  abbreviation: string | null; 
  created_at: string; 
  is_archived: boolean; 
}

interface UnitRowDB extends RowDataPacket {
  id: number;
  name: string;
  abbreviation: string | null;
  created_at: string;
  is_archived: number;
}

export async function getUnits(): Promise<UnitRow[]> {
  try {
    const units = await query<UnitRowDB>(
      "SELECT * FROM units WHERE is_archived = ? ORDER BY name",
      [fromBoolean(false)]
    );
    return units.map(u => ({ ...u, is_archived: toBoolean(u.is_archived) }));
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
}

export async function getArchivedUnits(): Promise<UnitRow[]> {
  try {
    const units = await query<UnitRowDB>(
      "SELECT * FROM units WHERE is_archived = ? ORDER BY name",
      [fromBoolean(true)]
    );
    return units.map(u => ({ ...u, is_archived: toBoolean(u.is_archived) }));
  } catch (error) {
    console.error("Error fetching archived units:", error);
    return [];
  }
}

export async function createUnit(formData: FormData) {
  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await insert(
      "INSERT INTO units (name, abbreviation, created_at) VALUES (?, ?, NOW())",
      [name, abbreviation || null]
    );
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create unit." };
  }
}

export async function updateUnit(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await update(
      "UPDATE units SET name = ?, abbreviation = ? WHERE id = ?",
      [name, abbreviation || null, id]
    );
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update unit." };
  }
}

export async function archiveUnit(id: number) {
  try {
    await update(
      "UPDATE units SET is_archived = ? WHERE id = ?",
      [fromBoolean(true), id]
    );
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive unit." };
  }
}

export async function restoreUnit(id: number) {
  try {
    await update(
      "UPDATE units SET is_archived = ? WHERE id = ?",
      [fromBoolean(false), id]
    );
    revalidatePath("/admin/catalog/units");
    revalidatePath("/catalog/units");
    revalidatePath("/admin/archives");
    revalidatePath("/archives");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore unit." };
  }
}

export async function deleteUnit(id: number) {
  try {
    await remove("DELETE FROM units WHERE id = ?", [id]);
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete unit." };
  }
}

// ── Packaging Types ────────────────────────────────────────
export interface PackagingRow { 
  id: number; 
  name: string; 
  description: string | null; 
  created_at: string; 
  is_archived: boolean; 
}

interface PackagingRowDB extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: number;
}

export async function getPackagingTypes(): Promise<PackagingRow[]> {
  try {
    const packaging = await query<PackagingRowDB>(
      "SELECT * FROM packaging_types WHERE is_archived = ? ORDER BY name",
      [fromBoolean(false)]
    );
    return packaging.map(p => ({ ...p, is_archived: toBoolean(p.is_archived) }));
  } catch (error) {
    console.error("Error fetching packaging types:", error);
    return [];
  }
}

export async function getArchivedPackagingTypes(): Promise<PackagingRow[]> {
  try {
    const packaging = await query<PackagingRowDB>(
      "SELECT * FROM packaging_types WHERE is_archived = ? ORDER BY name",
      [fromBoolean(true)]
    );
    return packaging.map(p => ({ ...p, is_archived: toBoolean(p.is_archived) }));
  } catch (error) {
    console.error("Error fetching archived packaging types:", error);
    return [];
  }
}

export async function createPackagingType(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await insert(
      "INSERT INTO packaging_types (name, description, created_at) VALUES (?, ?, NOW())",
      [name, description || null]
    );
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create packaging type." };
  }
}

export async function updatePackagingType(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return { error: "Name is required." };
  
  try {
    await update(
      "UPDATE packaging_types SET name = ?, description = ? WHERE id = ?",
      [name, description || null, id]
    );
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update packaging type." };
  }
}

export async function archivePackagingType(id: number) {
  try {
    await update(
      "UPDATE packaging_types SET is_archived = ? WHERE id = ?",
      [fromBoolean(true), id]
    );
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive packaging type." };
  }
}

export async function restorePackagingType(id: number) {
  try {
    await update(
      "UPDATE packaging_types SET is_archived = ? WHERE id = ?",
      [fromBoolean(false), id]
    );
    revalidatePath("/admin/catalog/packaging");
    revalidatePath("/catalog/packaging");
    revalidatePath("/admin/archives");
    revalidatePath("/archives");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to restore packaging type." };
  }
}

export async function deletePackagingType(id: number) {
  try {
    await remove("DELETE FROM packaging_types WHERE id = ?", [id]);
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete packaging type." };
  }
}
