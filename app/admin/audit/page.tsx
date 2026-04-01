"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Inbox } from "lucide-react";
import { getAuditLogs, type AuditLogRow } from "@/app/actions/audit";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function getActionColor(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("approve") || lower.includes("create")) return "bg-green-50 text-green-700";
  if (lower.includes("delete") || lower.includes("reject")) return "bg-red-50 text-red-700";
  if (lower.includes("update") || lower.includes("edit")) return "bg-yellow-50 text-yellow-700";
  return "bg-blue-50 text-blue-700";
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500 text-sm">Security, activity, and compliance trail.</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 bg-white rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState message="No audit logs yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User / Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Affected</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.users?.full_name ?? "System"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 font-mono text-xs">
                      {log.entity_type ? `${log.entity_type}${log.entity_id ? ` (ID: ${log.entity_id.slice(0, 8)})` : ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">{log.ip_address || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
