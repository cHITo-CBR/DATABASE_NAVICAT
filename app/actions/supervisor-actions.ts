import { query, queryOne, toBoolean } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

export interface SupervisorKPIs {
  activeSalesmen: number;
  visitsToday: number;
  submittedCallsheets: number;
  pendingCallsheetReviews: number;
  pendingRequests: number;
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
  pendingRequests: number;
  confirmedBookings: number;
  monthlySales: number;
}

// Internal Database Row Interfaces
interface CountRow extends RowDataPacket { count: number }
interface TotalAmountRow extends RowDataPacket { total_amount: number | string }
interface UserRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
  status: string;
  is_active: number;
  phone_number?: string;
  created_at?: string;
}
interface CustomerRow extends RowDataPacket {
  id: string;
  store_name: string;
  assigned_salesman_id: string;
  is_active: number;
  salesman_name?: string;
}
interface VisitRow extends RowDataPacket {
  id: string;
  customer_id: string;
  salesman_id: string;
  visit_date: string;
  store_name?: string;
  salesman_name?: string;
}
interface CallsheetRow extends RowDataPacket {
  id: string;
  salesman_id: string;
  customer_id: string;
  status: string;
  created_at: string;
  store_name?: string;
  salesman_name?: string;
  salesman_email?: string;
  address?: string;
}
interface BuyerRequestRow extends RowDataPacket {
  id: string;
  customer_id: string;
  salesman_id: string;
  status: string;
  created_at: string;
  store_name?: string;
  salesman_name?: string;
}
interface TransactionRow extends RowDataPacket {
  id: string;
  customer_id: string;
  salesman_id: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  store_name?: string;
  salesman_name?: string;
}
interface InventoryLedgerRow extends RowDataPacket {
  id: string;
  product_variant_id: string;
  balance: number;
  variant_name?: string;
  sku?: string;
  product_name?: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════
// SUPERVISOR DASHBOARD
// ══════════════════════════════════════════════════════════════

export async function getSupervisorKPIs(): Promise<SupervisorKPIs> {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  try {
    const [
      activeSalesmen,
      visitsToday,
      submittedCallsheets,
      pendingCallsheetReviews,
      pendingRequests,
      pendingBookings,
      salesData,
      lowStockItems,
    ] = await Promise.all([
      queryOne<CountRow>("SELECT COUNT(*) as count FROM users WHERE role_id = 3 AND is_active = 1"),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM store_visits WHERE visit_date >= ?", [today]),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM callsheets WHERE status = 'submitted'"),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM callsheets WHERE status = 'submitted'"),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM buyer_requests WHERE status = 'pending'"),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM sales_transactions WHERE status = 'pending'"),
      query<TotalAmountRow>("SELECT total_amount FROM sales_transactions WHERE created_at >= ?", [monthStart]),
      queryOne<CountRow>("SELECT COUNT(*) as count FROM inventory_ledger WHERE balance < 10"),
    ]);

    const monthlySalesTotal = (salesData || []).reduce((sum: number, t) => sum + (parseFloat(t.total_amount as string) || 0), 0);

    return {
      activeSalesmen: activeSalesmen?.count ?? 0,
      visitsToday: visitsToday?.count ?? 0,
      submittedCallsheets: submittedCallsheets?.count ?? 0,
      pendingCallsheetReviews: pendingCallsheetReviews?.count ?? 0,
      pendingRequests: pendingRequests?.count ?? 0,
      pendingBookings: pendingBookings?.count ?? 0,
      monthlySalesTotal,
      lowStockItems: lowStockItems?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching supervisor KPIs:", error);
    return {
      activeSalesmen: 0,
      visitsToday: 0,
      submittedCallsheets: 0,
      pendingCallsheetReviews: 0,
      pendingRequests: 0,
      pendingBookings: 0,
      monthlySalesTotal: 0,
      lowStockItems: 0,
    };
  }
}

// ══════════════════════════════════════════════════════════════
// TEAM MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamSalesmen(): Promise<TeamSalesman[]> {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  try {
    const salesmen = await query<UserRow>(
      "SELECT id, full_name, email, status, is_active FROM users WHERE role_id = 3 ORDER BY full_name"
    );

    const results: TeamSalesman[] = await Promise.all(
      salesmen.map(async (s) => {
        const [
          visitsToday,
          totalCallsheets,
          pendingRequests,
          confirmedBookings,
          salesData,
        ] = await Promise.all([
          queryOne<CountRow>("SELECT COUNT(*) as count FROM store_visits WHERE salesman_id = ? AND visit_date >= ?", [s.id, today]),
          queryOne<CountRow>("SELECT COUNT(*) as count FROM callsheets WHERE salesman_id = ?", [s.id]),
          queryOne<CountRow>("SELECT COUNT(*) as count FROM buyer_requests WHERE salesman_id = ? AND status = 'pending'", [s.id]),
          queryOne<CountRow>("SELECT COUNT(*) as count FROM sales_transactions WHERE salesman_id = ? AND status != 'cancelled'", [s.id]),
          query<TotalAmountRow>("SELECT total_amount FROM sales_transactions WHERE salesman_id = ? AND created_at >= ?", [s.id, monthStart]),
        ]);

        return {
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          status: toBoolean(s.is_active) ? "active" : "inactive",
          visitsToday: visitsToday?.count ?? 0,
          totalCallsheets: totalCallsheets?.count ?? 0,
          pendingRequests: pendingRequests?.count ?? 0,
          confirmedBookings: confirmedBookings?.count ?? 0,
          monthlySales: (salesData || []).reduce((sum: number, t) => sum + (parseFloat(t.total_amount as string) || 0), 0),
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
    const [profile, visits, callsheets, requests, bookings] = await Promise.all([
      queryOne<UserRow>("SELECT id, full_name, email, phone_number, status, created_at FROM users WHERE id = ?", [salesmanId]),
      query<VisitRow>(
        `SELECT sv.*, c.store_name 
         FROM store_visits sv 
         LEFT JOIN customers c ON sv.customer_id = c.id 
         WHERE sv.salesman_id = ? 
         ORDER BY sv.visit_date DESC LIMIT 20`,
        [salesmanId]
      ),
      query<CallsheetRow>(
        `SELECT cs.*, c.store_name 
         FROM callsheets cs 
         LEFT JOIN customers c ON cs.customer_id = c.id 
         WHERE cs.salesman_id = ? 
         ORDER BY cs.created_at DESC LIMIT 20`,
        [salesmanId]
      ),
      query<BuyerRequestRow>(
        `SELECT br.*, c.store_name 
         FROM buyer_requests br 
         LEFT JOIN customers c ON br.customer_id = c.id 
         WHERE br.salesman_id = ? 
         ORDER BY br.created_at DESC LIMIT 20`,
        [salesmanId]
      ),
      query<TransactionRow>(
        `SELECT st.*, c.store_name 
         FROM sales_transactions st 
         LEFT JOIN customers c ON st.customer_id = c.id 
         WHERE st.salesman_id = ? 
         ORDER BY st.created_at DESC LIMIT 20`,
        [salesmanId]
      ),
    ]);

    return { 
      profile: profile || null, 
      visits: visits || [], 
      callsheets: callsheets || [], 
      requests: requests || [], 
      bookings: bookings || [] 
    };
  } catch (error) {
    console.error("Error fetching salesman detail:", error);
    return { profile: null, visits: [], callsheets: [], requests: [], bookings: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS MONITORING
// ══════════════════════════════════════════════════════════════

export async function getTeamCustomers() {
  try {
    return await query<CustomerRow>(
      `SELECT c.*, u.full_name as salesman_name 
       FROM customers c 
       LEFT JOIN users u ON c.assigned_salesman_id = u.id 
       WHERE c.is_active = 1 
       ORDER BY c.store_name`
    );
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
    return await query<VisitRow>(
      `SELECT sv.*, c.store_name, u.full_name as salesman_name 
       FROM store_visits sv 
       LEFT JOIN customers c ON sv.customer_id = c.id 
       LEFT JOIN users u ON sv.salesman_id = u.id 
       ORDER BY sv.visit_date DESC LIMIT 100`
    );
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
    const callsheet = await queryOne<CallsheetRow>(
      `SELECT cs.*, c.store_name, c.address, u.full_name as salesman_name, u.email as salesman_email 
       FROM callsheets cs 
       LEFT JOIN customers c ON cs.customer_id = c.id 
       LEFT JOIN users u ON cs.salesman_id = u.id 
       WHERE cs.id = ?`,
      [callsheetId]
    );

    if (!callsheet) return null;

    const items = await query<RowDataPacket>(
      `SELECT ci.*, p.name as product_name, p.total_packaging, p.net_weight 
       FROM callsheet_items ci 
       LEFT JOIN products p ON ci.product_id = p.id 
       WHERE ci.callsheet_id = ?`,
      [callsheetId]
    );

    return { ...callsheet, callsheet_items: items };
  } catch (error) {
    console.error("Error fetching callsheet detail:", error);
    return null;
  }
}

export async function reviewCallsheet(callsheetId: string, status: "approved" | "rejected", supervisorNote?: string) {
  try {
    const sql = "UPDATE callsheets SET status = ?, remarks = ?, updated_at = NOW() WHERE id = ?";
    await query(sql, [status, supervisorNote || null, callsheetId]);
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
    const requests = await query<BuyerRequestRow>(
      `SELECT br.*, c.store_name, u.full_name as salesman_name 
       FROM buyer_requests br 
       LEFT JOIN customers c ON br.customer_id = c.id 
       LEFT JOIN users u ON br.salesman_id = u.id 
       ORDER BY br.created_at DESC LIMIT 100`
    );

    // Fetch items for each request
    const results = await Promise.all(
      requests.map(async (br) => {
        const items = await query<RowDataPacket>(
          `SELECT bri.*, p.name as product_name 
           FROM buyer_request_items bri 
           LEFT JOIN products p ON bri.product_id = p.id 
           WHERE bri.request_id = ?`,
          [br.id]
        );
        return { ...br, buyer_request_items: items };
      })
    );

    return results;
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
    return await query<TransactionRow>(
      `SELECT st.*, c.store_name, u.full_name as salesman_name 
       FROM sales_transactions st 
       LEFT JOIN customers c ON st.customer_id = c.id 
       LEFT JOIN users u ON st.salesman_id = u.id 
       ORDER BY st.created_at DESC LIMIT 100`
    );
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
    const lowStock = await query<InventoryLedgerRow>(
      `SELECT il.*, pv.name as variant_name, pv.sku, p.name as product_name 
       FROM inventory_ledger il 
       JOIN product_variants pv ON il.product_variant_id = pv.id 
       JOIN products p ON pv.product_id = p.id 
       WHERE il.balance < 10 
       ORDER BY il.balance ASC LIMIT 20`
    );

    const recentMovements = await query<InventoryLedgerRow>(
      `SELECT il.*, pv.name as variant_name, pv.sku, p.name as product_name 
       FROM inventory_ledger il 
       JOIN product_variants pv ON il.product_variant_id = pv.id 
       JOIN products p ON pv.product_id = p.id 
       ORDER BY il.created_at DESC LIMIT 20`
    );

    return { lowStock: lowStock || [], recentMovements: recentMovements || [] };
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
    const [visits, callsheets, requests] = await Promise.all([
      query<VisitRow>(
        `SELECT sv.id, sv.visit_date, sv.created_at, c.store_name, u.full_name as salesman_name 
         FROM store_visits sv 
         LEFT JOIN customers c ON sv.customer_id = c.id 
         LEFT JOIN users u ON sv.salesman_id = u.id 
         ORDER BY sv.created_at DESC LIMIT 5`
      ),
      query<CallsheetRow>(
        `SELECT cs.id, cs.status, cs.created_at, c.store_name, u.full_name as salesman_name 
         FROM callsheets cs 
         LEFT JOIN customers c ON cs.customer_id = c.id 
         LEFT JOIN users u ON cs.salesman_id = u.id 
         ORDER BY cs.created_at DESC LIMIT 5`
      ),
      query<BuyerRequestRow>(
        `SELECT br.id, br.status, br.created_at, c.store_name, u.full_name as salesman_name 
         FROM buyer_requests br 
         LEFT JOIN customers c ON br.customer_id = c.id 
         LEFT JOIN users u ON br.salesman_id = u.id 
         ORDER BY br.created_at DESC LIMIT 5`
      ),
    ]);

    return { visits: visits || [], callsheets: callsheets || [], requests: requests || [] };
  } catch (error) {
    console.error("Error fetching recent team activity:", error);
    return { visits: [], callsheets: [], requests: [] };
  }
}
