"use server";
import { query, queryOne, execute, generateUUID } from "@/lib/db-helpers";

export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  metadata: any;
  created_at: string;
  user_name?: string | null;
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  try {
    const rows = await query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.ip_address, al.metadata, al.created_at,
              u.full_name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );

    return rows.map((log: any) => ({
      ...log,
      metadata: typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata,
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}
