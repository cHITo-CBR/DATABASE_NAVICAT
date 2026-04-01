"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Search, Filter, ChevronRight, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAllCallsheets } from "@/app/actions/callsheets";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function SupervisorCallsheetsPage() {
  const [callsheets, setCallsheets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCallsheets().then((data) => { setCallsheets(data); setLoading(false); });
  }, []);

  const filtered = callsheets.filter(c => {
    const matchSearch = (c.customers?.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.users?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Callsheets Review</h1>
        <p className="text-gray-500 text-sm">Review and approve callsheet submissions from your team.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["all", "submitted", "approved", "rejected"].map((s) => {
          const count = s === "all" ? callsheets.length : callsheets.filter(c => c.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={`p-4 rounded-xl border-2 transition-all text-left ${statusFilter === s ? "border-[#005914] bg-green-50/30" : "border-transparent bg-white shadow-sm"}`}>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 font-medium capitalize">{s === "all" ? "Total" : s}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search by store or salesman..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">No callsheets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{c.users?.full_name || "—"}</TableCell>
                    <TableCell>{c.customers?.store_name || "—"}</TableCell>
                    <TableCell>R{c.round_number || 1}</TableCell>
                    <TableCell>{c.visit_date ? new Date(c.visit_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${statusColors[c.status] || "bg-gray-100 text-gray-700"}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/supervisor/callsheets/${c.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#005914] font-bold">
                          Review <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
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
