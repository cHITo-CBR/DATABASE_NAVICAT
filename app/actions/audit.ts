"use server";

import { query } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2/promise";

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

interface AuditLogRowDB extends RowDataPacket {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  metadata: string | null;
  created_at: string;
  user_name: string | null;
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  try {
    const logs = await query<AuditLogRowDB>(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.ip_address, a.metadata, a.created_at, u.full_name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 50`
    );

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}
