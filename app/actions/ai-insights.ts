"use server";

import { query } from "@/lib/db-helpers";
import { RowDataPacket } from "mysql2";

export interface AIInsightRow extends RowDataPacket {
  id: string;
  insight_type: string;
  title: string;
  description: string | null;
  severity: string;
  data: any;
  created_at: string;
}

export async function getAIInsights(): Promise<AIInsightRow[]> {
  try {
    const rows = await query<AIInsightRow>(
      `SELECT * FROM ai_insights ORDER BY created_at DESC`
    );

    if (!rows) return [];

    return rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return [];
  }
}
