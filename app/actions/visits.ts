"use server";
import { query, queryOne, getTableColumns } from "@/lib/db-helpers";

export interface StoreVisitRow {
  id: string;
  visit_date: string;
  notes: string | null;
  created_at: string;
  customers: { store_name: string } | null;
  users: { full_name: string } | null;
  store_visit_skus: { id: string }[];
}

export interface VisitReportDetail {
  id: string;
  visit_date: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  customers: { store_name: string } | null;
  users: { full_name: string } | null;
  store_visit_skus: {
    id: string;
    notes: string | null;
    product_variants: { name: string; sku: string | null } | null;
  }[];
}

export async function getStoreVisits(): Promise<StoreVisitRow[]> {
  try {
    const storeVisitColumns = await getTableColumns("store_visits");
    if (storeVisitColumns.length === 0) return [];
    const visits = await query(
      `SELECT sv.id, sv.visit_date, sv.notes, sv.created_at,
              c.store_name as customer_name, u.full_name as salesman_name
       FROM store_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       LEFT JOIN users u ON sv.salesman_id = u.id
       ORDER BY sv.visit_date DESC`
    );

    const visitIds = visits.map((v: any) => v.id);
    let skusMap = new Map<string, { id: string }[]>();

    const skuColumns = await getTableColumns("store_visit_skus");
    if (visitIds.length > 0 && skuColumns.length > 0) {
      const placeholders = visitIds.map(() => '?').join(',');
      const skus = await query(
        `SELECT id, visit_id FROM store_visit_skus WHERE visit_id IN (${placeholders})`,
        visitIds
      );

      for (const sku of skus) {
        if (!skusMap.has(sku.visit_id)) skusMap.set(sku.visit_id, []);
        skusMap.get(sku.visit_id)!.push({ id: sku.id });
      }
    }

    return visits.map((v: any) => ({
      id: v.id,
      visit_date: v.visit_date,
      notes: v.notes,
      created_at: v.created_at,
      customers: v.customer_name ? { store_name: v.customer_name } : null,
      users: v.salesman_name ? { full_name: v.salesman_name } : null,
      store_visit_skus: skusMap.get(v.id) || [],
    }));
  } catch {
    return [];
  }
}

export async function getVisitReport(id: string): Promise<VisitReportDetail | null> {
  try {
    const storeVisitColumns = await getTableColumns("store_visits");
    if (storeVisitColumns.length === 0) return null;
    const hasLatitude = storeVisitColumns.includes("latitude");
    const hasLongitude = storeVisitColumns.includes("longitude");
    const visit = await queryOne(
      `SELECT sv.id, sv.visit_date, sv.notes,
              ${hasLatitude ? "sv.latitude" : "NULL"} as latitude,
              ${hasLongitude ? "sv.longitude" : "NULL"} as longitude,
              c.store_name as customer_name, u.full_name as salesman_name
       FROM store_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       LEFT JOIN users u ON sv.salesman_id = u.id
       WHERE sv.id = ?`,
      [id]
    );

    if (!visit) return null;

    let skus: any[] = [];
    const skuColumns = await getTableColumns("store_visit_skus");
    if (skuColumns.length > 0) {
      skus = await query(
        `SELECT svs.id, svs.notes, pv.name as variant_name, pv.sku as variant_sku
         FROM store_visit_skus svs
         LEFT JOIN product_variants pv ON svs.variant_id = pv.id
         WHERE svs.visit_id = ?`,
        [id]
      );
    }

    return {
      id: visit.id,
      visit_date: visit.visit_date,
      notes: visit.notes,
      latitude: visit.latitude,
      longitude: visit.longitude,
      customers: visit.customer_name ? { store_name: visit.customer_name } : null,
      users: visit.salesman_name ? { full_name: visit.salesman_name } : null,
      store_visit_skus: skus.map((s: any) => ({
        id: s.id,
        notes: s.notes,
        product_variants: s.variant_name ? { name: s.variant_name, sku: s.variant_sku } : null,
      })),
    };
  } catch {
    return null;
  }
}
