"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Inbox, MapPin, Clock } from "lucide-react";
import { getTeamVisits } from "@/app/actions/supervisor-actions";

export default function SupervisorVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamVisits().then((data) => { setVisits(data); setLoading(false); });
  }, []);

  const filtered = visits.filter(v =>
    (v.customers?.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.users?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Store Visits Monitoring</h1>
        <p className="text-gray-500 text-sm">{visits.length} field visits recorded.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search stores or salesmen..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No visits found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>GPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.users?.full_name || "—"}</TableCell>
                    <TableCell>{v.customers?.store_name || "—"}</TableCell>
                    <TableCell>{new Date(v.visit_date || v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                    <TableCell className="text-gray-500 truncate max-w-[200px]">{v.notes || "—"}</TableCell>
                    <TableCell>
                      {v.latitude && v.longitude ? (
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full flex items-center gap-1 w-fit"><MapPin className="w-3 h-3" /> Yes</span>
                      ) : <span className="text-gray-300">—</span>}
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
