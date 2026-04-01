"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Inbox } from "lucide-react";
import { getTeamBuyerRequests } from "@/app/actions/supervisor-actions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  fulfilled: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function SupervisorBuyerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamBuyerRequests().then((data) => { setRequests(data); setLoading(false); });
  }, []);

  const filtered = requests.filter(r =>
    (r.customers?.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.users?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Buyer Requests Monitoring</h1>
        <p className="text-gray-500 text-sm">{requests.length} buyer requests from your team.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search stores or salesmen..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No buyer requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.users?.full_name || "—"}</TableCell>
                    <TableCell>{r.customers?.store_name || "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-md">{r.buyer_request_items?.length || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                    </TableCell>
                    <TableCell className="text-gray-500 truncate max-w-[150px]">{r.notes || "—"}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
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
