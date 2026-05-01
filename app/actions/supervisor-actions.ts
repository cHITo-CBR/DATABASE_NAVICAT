"use server";
import { query, queryOne, execute, getTableColumns } from "@/lib/db-helpers";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

export interface SupervisorKPIs {
  activeSalesmen: number;
  visitsToday: number;
  submittedCallsheets: number;
  pendingCallsheetReviews: number;
  pendingBookings: number;
  monthlySalesTotal: number;
  lowStockItems: number;
}

export interface TeamSalesman {
  id: string;
  full_name: string;
  email: string;
  status: string;
  visitsToday: number;
  totalCallsheets: number;
  confirmedBookings: number;
  monthlySales: number;
}

async function tableExists(tableName: string) {
  const columns = await getTableColumns(tableName);
  return columns.length > 0;
}

// ══════════════════════════════════════════════════════════════
// SUPERVISOR DASHBOARD
// ══════════════════════════════════════════════════════════════

export async function getSupervisorKPIs(): Promise<SupervisorKPIs> {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  try {
    const hasCallsheets = await tableExists("callsheets");
    const submittedPromise = hasCallsheets
      ? queryOne<{ count: number }>("SELECT COUNT(*) as count FROM callsheets WHERE status = 'submitted'")
      : Promise.resolve<{ count: number } | null>({ count: 0 });

    const [activeSalesmenRow, visitsTodayRow, submittedRow, pendingBookingsRow, salesData, lowStockRow] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role_id = 3 AND is_active = 1"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM store_visits WHERE visit_date >= ?", [today]),
      submittedPromise,
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM sales_transactions WHERE status = 'pending'"),
      query("SELECT total_amount FROM sales_transactions WHERE created_at >= ?", [monthStart]),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM inventory_ledger WHERE balance < 10"),
    ]);

    const monthlySalesTotal = (salesData || []).reduce(
      (sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0
    );

    return {
      activeSalesmen: activeSalesmenRow?.count ?? 0,
      visitsToday: visitsTodayRow?.count ?? 0,
      submittedCallsheets: submittedRow?.count ?? 0,
      pendingCallsheetReviews: submittedRow?.count ?? 0,
      pendingBookings: pendingBookingsRow?.count ?? 0,
      monthlySalesTotal,
      lowStockItems: lowStockRow?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching supervisor KPIs:", error);
    return { activeSalesmen: 0, visitsToday: 0, submittedCallsheets: 0, pendingCallsheetReviews: 0, pendingBookings: 0, monthlySalesTotal: 0, lowStockItems: 0 };
  }
}

// ══════════════════════════════════════════════════════════════
// TEAM MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamSalesmen(): Promise<TeamSalesman[]> {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  try {
    const hasCallsheets = await tableExists("callsheets");
    const salesmen = await query(
      "SELECT id, full_name, email, status, is_active FROM users WHERE role_id = 3 ORDER BY full_name"
    );

    const results: TeamSalesman[] = await Promise.all(
      (salesmen || []).map(async (s: any) => {
        const callsheetPromise = hasCallsheets
          ? queryOne<{ count: number }>("SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ?", [s.id])
          : Promise.resolve<{ count: number } | null>({ count: 0 });
        const [visitsTodayRow, totalCallsheetsRow, confirmedBookingsRow, salesData] = await Promise.all([
          queryOne<{ count: number }>("SELECT COUNT(*) as count FROM store_visits WHERE salesman_id = ? AND visit_date >= ?", [s.id, today]),
          callsheetPromise,
          queryOne<{ count: number }>("SELECT COUNT(*) as count FROM sales_transactions WHERE salesman_id = ? AND status != 'cancelled'", [s.id]),
          query("SELECT total_amount FROM sales_transactions WHERE salesman_id = ? AND created_at >= ?", [s.id, monthStart]),
        ]);

        return {
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          status: s.is_active ? "active" : "inactive",
          visitsToday: visitsTodayRow?.count ?? 0,
          totalCallsheets: totalCallsheetsRow?.count ?? 0,
          confirmedBookings: confirmedBookingsRow?.count ?? 0,
          monthlySales: (salesData || []).reduce((sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0),
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching team salesmen:", error);
    return [];
  }
}

export async function getSalesmanDetail(salesmanId: string) {
  try {
    const hasCallsheets = await tableExists("callsheets");
    const callsheetPromise = hasCallsheets
      ? query(
          `SELECT cs.*, c.store_name FROM callsheets cs
           LEFT JOIN customers c ON cs.customer_id = c.id
           WHERE cs.salesman_id = ? ORDER BY cs.created_at DESC LIMIT 20`,
          [salesmanId]
        )
      : Promise.resolve<any[]>([]);

    const [profile, visits, callsheets, bookings] = await Promise.all([
      queryOne(
        "SELECT id, full_name, email, phone_number, status, created_at FROM users WHERE id = ?",
        [salesmanId]
      ),
      query(
        `SELECT sv.*, c.store_name FROM store_visits sv
         LEFT JOIN customers c ON sv.customer_id = c.id
         WHERE sv.salesman_id = ? ORDER BY sv.visit_date DESC LIMIT 20`,
        [salesmanId]
      ),
      callsheetPromise,
      query(
        `SELECT st.*, c.store_name FROM sales_transactions st
         LEFT JOIN customers c ON st.customer_id = c.id
         WHERE st.salesman_id = ? ORDER BY st.created_at DESC LIMIT 20`,
        [salesmanId]
      ),
    ]);

    return {
      profile: profile || null,
      visits: visits.map((v: any) => ({ ...v, customers: v.store_name ? { store_name: v.store_name } : null })),
      callsheets: callsheets.map((cs: any) => ({ ...cs, customers: cs.store_name ? { store_name: cs.store_name } : null })),
      bookings: bookings.map((b: any) => ({ ...b, customers: b.store_name ? { store_name: b.store_name } : null })),
    };
  } catch (error) {
    console.error("Error fetching salesman detail:", error);
    return { profile: null, visits: [], callsheets: [], bookings: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamCustomers() {
  try {
    const rows = await query(
      `SELECT c.*, u.full_name as salesman_name
       FROM customers c
       LEFT JOIN users u ON c.assigned_salesman_id = u.id
       WHERE c.is_active = 1
       ORDER BY c.store_name`
    );
    return rows.map((c: any) => ({
      ...c,
      users: c.salesman_name ? { full_name: c.salesman_name } : null,
    }));
  } catch (error) {
    console.error("Error fetching team customers:", error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// VISITS MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamVisits() {
  try {
    const rows = await query(
      `SELECT sv.*, c.store_name, u.full_name as salesman_name
       FROM store_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       LEFT JOIN users u ON sv.salesman_id = u.id
       ORDER BY sv.visit_date DESC
       LIMIT 100`
    );
    return rows.map((v: any) => ({
      ...v,
      customers: v.store_name ? { store_name: v.store_name } : null,
      users: v.salesman_name ? { full_name: v.salesman_name } : null,
    }));
  } catch (error) {
    console.error("Error fetching team visits:", error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// CALLSHEETS
// ══════════════════════════════════════════════════════════════

export async function getCallsheetDetail(callsheetId: string) {
  try {
    const hasCallsheets = await tableExists("callsheets");
    if (!hasCallsheets) return null;

    const callsheet = await queryOne(
      `SELECT cs.*, c.store_name, c.address, u.full_name as salesman_name, u.email as salesman_email
       FROM callsheets cs
       LEFT JOIN customers c ON cs.customer_id = c.id
       LEFT JOIN users u ON cs.salesman_id = u.id
       WHERE cs.id = ?`,
      [callsheetId]
    );

    if (!callsheet) return null;

    const hasItems = await tableExists("callsheet_items");
    const items = hasItems
      ? await query(
          `SELECT ci.*, p.name as product_name, p.total_packaging, p.net_weight
           FROM callsheet_items ci
           LEFT JOIN products p ON ci.product_id = p.id
           WHERE ci.callsheet_id = ?`,
          [callsheetId]
        )
      : [];

    return {
      ...callsheet,
      store_name: callsheet.store_name || null,
      address: callsheet.address || null,
      salesman_name: callsheet.salesman_name || null,
      salesman_email: callsheet.salesman_email || null,
      customers: callsheet.store_name ? { store_name: callsheet.store_name, address: callsheet.address } : null,
      users: callsheet.salesman_name ? { full_name: callsheet.salesman_name, email: callsheet.salesman_email } : null,
      callsheet_items: items.map((i: any) => ({
        ...i,
        products: i.product_name ? { name: i.product_name, total_packaging: i.total_packaging, net_weight: i.net_weight } : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching callsheet detail:", error);
    return null;
  }
}

export async function reviewCallsheet(callsheetId: string, status: "approved" | "rejected", supervisorNote?: string) {
  try {
    const hasCallsheets = await tableExists("callsheets");
    if (!hasCallsheets) {
      return { error: "Callsheets table not available." };
    }
    await execute(
      "UPDATE callsheets SET status = ?, remarks = ? WHERE id = ?",
      [status, supervisorNote || null, callsheetId]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing callsheet:", error);
    return { error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════
// BUYER REQUESTS MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamBuyerRequests() {
  try {
    const requests = await query(
      `SELECT br.*, c.store_name, u.full_name as salesman_name
       FROM buyer_requests br
       LEFT JOIN customers c ON br.customer_id = c.id
       LEFT JOIN users u ON br.salesman_id = u.id
       ORDER BY br.created_at DESC
       LIMIT 100`
    );

    const requestIds = (requests || []).map((r: any) => r.id);
    let itemsMap = new Map<string, any[]>();

    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const items = await query(
        `SELECT bri.*, p.name as product_name
         FROM buyer_request_items bri
         LEFT JOIN products p ON bri.product_id = p.id
         WHERE bri.request_id IN (${placeholders})`,
        requestIds
      );

      for (const item of items) {
        if (!itemsMap.has(item.request_id)) itemsMap.set(item.request_id, []);
        itemsMap.get(item.request_id)!.push({
          ...item,
          products: item.product_name ? { name: item.product_name } : null,
        });
      }
    }

    return requests.map((r: any) => ({
      ...r,
      customers: r.store_name ? { store_name: r.store_name } : null,
      users: r.salesman_name ? { full_name: r.salesman_name } : null,
      buyer_request_items: itemsMap.get(r.id) || [],
    }));
  } catch (error) {
    console.error("Error fetching team buyer requests:", error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// BOOKINGS / ORDERS MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamBookings() {
  try {
    const rows = await query(
      `SELECT st.*, c.store_name, u.full_name as salesman_name
       FROM sales_transactions st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u ON st.salesman_id = u.id
       ORDER BY st.created_at DESC
       LIMIT 100`
    );
    return rows.map((b: any) => ({
      ...b,
      customers: b.store_name ? { store_name: b.store_name } : null,
      users: b.salesman_name ? { full_name: b.salesman_name } : null,
    }));
  } catch (error) {
    console.error("Error fetching team bookings:", error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
// INVENTORY IMPACT VIEW
// ══════════════════════════════════════════════════════════════

export async function getInventoryImpact() {
  try {
    const lowStock = await query(
      `SELECT il.*, pv.name as variant_name, pv.sku as variant_sku, p.name as product_name
       FROM inventory_ledger il
       LEFT JOIN product_variants pv ON il.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE il.balance < 10
       ORDER BY il.balance ASC
       LIMIT 20`
    );

    const recentMovements = await query(
      `SELECT il.*, pv.name as variant_name, pv.sku as variant_sku, p.name as product_name,
              imt.name as movement_type_name, imt.direction as movement_type_direction
       FROM inventory_ledger il
       LEFT JOIN product_variants pv ON il.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       LEFT JOIN inventory_movement_types imt ON il.movement_type_id = imt.id
       ORDER BY il.created_at DESC
       LIMIT 20`
    );

    const mapVariant = (item: any) => {
      if (!item.product_name && !item.variant_name) return null;
      return {
        name: item.variant_name || "Standard",
        sku: item.variant_sku || null,
        products: item.product_name ? { name: item.product_name } : null,
      };
    };

    return {
      lowStock: lowStock.map((item: any) => ({
        ...item,
        product_variants: mapVariant(item),
      })),
      recentMovements: recentMovements.map((item: any) => ({
        ...item,
        product_variants: mapVariant(item),
        inventory_movement_types: item.movement_type_name
          ? { name: item.movement_type_name, direction: item.movement_type_direction }
          : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching inventory impact:", error);
    return { lowStock: [], recentMovements: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// RECENT ACTIVITY (for dashboard feed)
// ══════════════════════════════════════════════════════════════

export async function getRecentTeamActivity() {
  try {
    const hasCallsheets = await tableExists("callsheets");
    const callsheetPromise = hasCallsheets
      ? query(
          `SELECT cs.id, cs.status, cs.created_at, c.store_name, u.full_name as salesman_name
           FROM callsheets cs
           LEFT JOIN customers c ON cs.customer_id = c.id
           LEFT JOIN users u ON cs.salesman_id = u.id
           ORDER BY cs.created_at DESC LIMIT 5`
        )
      : Promise.resolve<any[]>([]);

    const [visits, callsheets, requests] = await Promise.all([
      query(
        `SELECT sv.id, sv.visit_date, sv.created_at, c.store_name, u.full_name as salesman_name
         FROM store_visits sv
         LEFT JOIN customers c ON sv.customer_id = c.id
         LEFT JOIN users u ON sv.salesman_id = u.id
         ORDER BY sv.created_at DESC LIMIT 5`
      ),
      callsheetPromise,
      query(
        `SELECT br.id, br.status, br.created_at, c.store_name, u.full_name as salesman_name
         FROM buyer_requests br
         LEFT JOIN customers c ON br.customer_id = c.id
         LEFT JOIN users u ON br.salesman_id = u.id
         ORDER BY br.created_at DESC LIMIT 5`
      ),
    ]);

    return {
      visits: visits.map((v: any) => ({
        ...v,
        customers: v.store_name ? { store_name: v.store_name } : null,
        users: v.salesman_name ? { full_name: v.salesman_name } : null,
      })),
      callsheets: callsheets.map((cs: any) => ({
        ...cs,
        customers: cs.store_name ? { store_name: cs.store_name } : null,
        users: cs.salesman_name ? { full_name: cs.salesman_name } : null,
      })),
      requests: requests.map((br: any) => ({
        ...br,
        customers: br.store_name ? { store_name: br.store_name } : null,
        users: br.salesman_name ? { full_name: br.salesman_name } : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching recent team activity:", error);
    return { visits: [], callsheets: [], requests: [] };
  }
}
