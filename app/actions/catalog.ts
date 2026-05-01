"use server";

/**
 * CATALOG CONFIGURATION ACTIONS
 * Handles Categories, Brands, Units, and Packaging Types CRUD.
 */

import { query, execute } from "@/lib/db-helpers";
import { revalidatePath } from "next/cache";

// ── CATEGORIES MANAGEMENT ──────────────────────────────────────────────
export interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: boolean;
}

export async function getCategories(): Promise<CategoryRow[]> {
  try {
    return await query("SELECT * FROM product_categories WHERE is_archived = 0 ORDER BY name");
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getArchivedCategories(): Promise<CategoryRow[]> {
  try {
    return await query("SELECT * FROM product_categories WHERE is_archived = 1 ORDER BY name");
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
    await execute("INSERT INTO product_categories (name, description) VALUES (?, ?)", [name, description || null]);
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
    await execute("UPDATE product_categories SET name = ?, description = ? WHERE id = ?", [name, description || null, id]);
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update category." };
  }
}

export async function archiveCategory(id: number) {
  try {
    await execute("UPDATE product_categories SET is_archived = 1 WHERE id = ?", [id]);
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive category." };
  }
}

export async function restoreCategory(id: number) {
  try {
    await execute("UPDATE product_categories SET is_archived = 0 WHERE id = ?", [id]);
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
    await execute("DELETE FROM product_categories WHERE id = ?", [id]);
    revalidatePath("/catalog/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete category." };
  }
}

// ── BRANDS MANAGEMENT ──────────────────────────────────────────────────
export interface BrandRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: boolean;
}

export async function getBrands(): Promise<BrandRow[]> {
  try {
    return await query("SELECT * FROM brands WHERE is_archived = 0 ORDER BY name");
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function getArchivedBrands(): Promise<BrandRow[]> {
  try {
    return await query("SELECT * FROM brands WHERE is_archived = 1 ORDER BY name");
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
    await execute("INSERT INTO brands (name, description) VALUES (?, ?)", [name, description || null]);
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
    await execute("UPDATE brands SET name = ?, description = ? WHERE id = ?", [name, description || null, id]);
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update brand." };
  }
}

export async function archiveBrand(id: number) {
  try {
    await execute("UPDATE brands SET is_archived = 1 WHERE id = ?", [id]);
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive brand." };
  }
}

export async function restoreBrand(id: number) {
  try {
    await execute("UPDATE brands SET is_archived = 0 WHERE id = ?", [id]);
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
    await execute("DELETE FROM brands WHERE id = ?", [id]);
    revalidatePath("/catalog/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete brand." };
  }
}

// ── UNITS MANAGEMENT ──────────────────────────────────────────────────
export interface UnitRow {
  id: number;
  name: string;
  abbreviation: string | null;
  created_at: string;
  is_archived: boolean;
}

export async function getUnits(): Promise<UnitRow[]> {
  try {
    return await query("SELECT * FROM units WHERE is_archived = 0 ORDER BY name");
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
}

export async function getArchivedUnits(): Promise<UnitRow[]> {
  try {
    return await query("SELECT * FROM units WHERE is_archived = 1 ORDER BY name");
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
    await execute("INSERT INTO units (name, abbreviation) VALUES (?, ?)", [name, abbreviation || null]);
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
    await execute("UPDATE units SET name = ?, abbreviation = ? WHERE id = ?", [name, abbreviation || null, id]);
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update unit." };
  }
}

export async function archiveUnit(id: number) {
  try {
    await execute("UPDATE units SET is_archived = 1 WHERE id = ?", [id]);
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive unit." };
  }
}

export async function restoreUnit(id: number) {
  try {
    await execute("UPDATE units SET is_archived = 0 WHERE id = ?", [id]);
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
    await execute("DELETE FROM units WHERE id = ?", [id]);
    revalidatePath("/catalog/units");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete unit." };
  }
}

// ── PACKAGING TYPES MANAGEMENT ────────────────────────────────────────
export interface PackagingRow {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  is_archived: boolean;
}

export async function getPackagingTypes(): Promise<PackagingRow[]> {
  try {
    return await query("SELECT * FROM packaging_types WHERE is_archived = 0 ORDER BY name");
  } catch (error) {
    console.error("Error fetching packaging types:", error);
    return [];
  }
}

export async function getArchivedPackagingTypes(): Promise<PackagingRow[]> {
  try {
    return await query("SELECT * FROM packaging_types WHERE is_archived = 1 ORDER BY name");
  } catch (error) {
    console.error("Error fetching archived packaging types:", error);
    return [];
  }
}

export async function createPackagingType(formData: FormData) {
  const packaging = formData.get("packaging") as string;
  const itemsPerCase = formData.get("itemsPerCase") as string;
  if (!packaging) return { error: "Packaging is required." };

  let name = packaging;
  let description = null;
  if (packaging.includes(" - ")) {
    const parts = packaging.split(" - ");
    name = parts[0].trim();
    description = parts[1].trim();
  }

  try {
    await execute(
      "INSERT INTO packaging_types (name, description, items_per_case) VALUES (?, ?, ?)",
      [name, description, itemsPerCase ? parseInt(itemsPerCase) : 1]
    );
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create packaging type." };
  }
}

export async function updatePackagingType(id: number, formData: FormData) {
  const packaging = formData.get("packaging") as string;
  const itemsPerCase = formData.get("itemsPerCase") as string;
  if (!packaging) return { error: "Packaging is required." };

  let name = packaging;
  let description = null;
  if (packaging.includes(" - ")) {
    const parts = packaging.split(" - ");
    name = parts[0].trim();
    description = parts[1].trim();
  }

  try {
    await execute(
      "UPDATE packaging_types SET name = ?, description = ?, items_per_case = ? WHERE id = ?",
      [name, description, itemsPerCase ? parseInt(itemsPerCase) : 1, id]
    );
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update packaging type." };
  }
}

export async function archivePackagingType(id: number) {
  try {
    await execute("UPDATE packaging_types SET is_archived = 1 WHERE id = ?", [id]);
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive packaging type." };
  }
}

export async function restorePackagingType(id: number) {
  try {
    await execute("UPDATE packaging_types SET is_archived = 0 WHERE id = ?", [id]);
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
    await execute("DELETE FROM packaging_types WHERE id = ?", [id]);
    revalidatePath("/catalog/packaging");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete packaging type." };
  }
}
