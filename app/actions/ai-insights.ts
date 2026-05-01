"use server";

// AI Insights — this table may not exist yet in your schema.
// Returns an empty array gracefully if the table is missing.

export interface AIInsightRow {
  id: string;
  insight_type: string;
  title: string;
  description: string | null;
  severity: string;
  data: any;
  created_at: string;
}

import { query } from "@/lib/db-helpers";

export async function getAIInsights(): Promise<AIInsightRow[]> {
  try {
    const rows = await query(
      "SELECT * FROM ai_insights ORDER BY created_at DESC"
    );

    return rows.map((row: any) => ({
      ...row,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    }));
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return [];
  }
}
