"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Inbox } from "lucide-react";
import { getTeamBookings } from "@/app/actions/supervisor-actions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  preparing: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function SupervisorBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamBookings().then((data) => { setBookings(data); setLoading(false); });
  }, []);

  const filtered = bookings.filter(b => {
    const matchSearch = (b.customers?.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.users?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bookings / Orders Monitoring</h1>
        <p className="text-gray-500 text-sm">{bookings.length} orders from your team.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "preparing", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${statusFilter === s ? "bg-[#005914] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search stores or salesmen..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.users?.full_name || "—"}</TableCell>
                    <TableCell>{b.customers?.store_name || "—"}</TableCell>
                    <TableCell className="text-right font-bold">₱{(b.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${statusColors[b.status] || "bg-gray-100 text-gray-700"}`}>{b.status}</span>
                    </TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
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
