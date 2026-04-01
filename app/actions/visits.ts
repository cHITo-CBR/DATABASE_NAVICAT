"use server";

import { query, queryOne } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2";

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

interface VisitDbRow extends RowDataPacket {
  id: string;
  visit_date: string;
  notes: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  customer_store_name: string | null;
  salesman_full_name: string | null;
}

interface VisitSkuDbRow extends RowDataPacket {
  id: string;
  visit_id: string;
  notes: string | null;
  variant_name: string | null;
  variant_sku: string | null;
}

export async function getStoreVisits(): Promise<StoreVisitRow[]> {
  try {
    const visits = await query<VisitDbRow>(`
      SELECT sv.id, sv.visit_date, sv.notes, sv.created_at,
             c.store_name AS customer_store_name,
             u.full_name AS salesman_full_name
      FROM store_visits sv
      LEFT JOIN customers c ON sv.customer_id = c.id
      LEFT JOIN users u ON sv.salesman_id = u.id
      ORDER BY sv.visit_date DESC
    `);

    const visitIds = visits.map(v => v.id);
    let skusMap: Map<string, { id: string }[]> = new Map();

    if (visitIds.length > 0) {
      const placeholders = visitIds.map(() => '?').join(',');
      const skus = await query<{ id: string; visit_id: string } & RowDataPacket>(`
        SELECT id, visit_id FROM store_visit_skus WHERE visit_id IN (${placeholders})
      `, visitIds);

      for (const sku of skus) {
        if (!skusMap.has(sku.visit_id)) skusMap.set(sku.visit_id, []);
        skusMap.get(sku.visit_id)!.push({ id: sku.id });
      }
    }

    return visits.map(v => ({
      id: v.id,
      visit_date: v.visit_date,
      notes: v.notes,
      created_at: v.created_at,
      customers: v.customer_store_name ? { store_name: v.customer_store_name } : null,
      users: v.salesman_full_name ? { full_name: v.salesman_full_name } : null,
      store_visit_skus: skusMap.get(v.id) || [],
    }));
  } catch {
    return [];
  }
}

export async function getVisitReport(id: string): Promise<VisitReportDetail | null> {
  try {
    const visit = await queryOne<VisitDbRow>(`
      SELECT sv.id, sv.visit_date, sv.notes, sv.latitude, sv.longitude,
             c.store_name AS customer_store_name,
             u.full_name AS salesman_full_name
      FROM store_visits sv
      LEFT JOIN customers c ON sv.customer_id = c.id
      LEFT JOIN users u ON sv.salesman_id = u.id
      WHERE sv.id = ?
    `, [id]);

    if (!visit) return null;

    const skus = await query<VisitSkuDbRow>(`
      SELECT svs.id, svs.visit_id, svs.notes, pv.name AS variant_name, pv.sku AS variant_sku
      FROM store_visit_skus svs
      LEFT JOIN product_variants pv ON svs.variant_id = pv.id
      WHERE svs.visit_id = ?
    `, [id]);

    return {
      id: visit.id,
      visit_date: visit.visit_date,
      notes: visit.notes,
      latitude: visit.latitude,
      longitude: visit.longitude,
      customers: visit.customer_store_name ? { store_name: visit.customer_store_name } : null,
      users: visit.salesman_full_name ? { full_name: visit.salesman_full_name } : null,
      store_visit_skus: skus.map(s => ({
        id: s.id,
        notes: s.notes,
        product_variants: s.variant_name ? { name: s.variant_name, sku: s.variant_sku } : null,
      })),
    };
  } catch {
    return null;
  }
}
