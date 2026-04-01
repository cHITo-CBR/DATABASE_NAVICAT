"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Inbox, MapPin } from "lucide-react";
import { getTeamCustomers } from "@/app/actions/supervisor-actions";

export default function SupervisorCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamCustomers().then((data) => { setCustomers(data); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    (c.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.city || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.users?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accounts Monitoring</h1>
        <p className="text-gray-500 text-sm">{customers.length} customer accounts managed by your team.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search stores, cities, salesmen..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No accounts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City / Region</TableHead>
                  <TableHead>Assigned Salesman</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.store_name}</TableCell>
                    <TableCell className="text-gray-500">{c.contact_person || "—"}</TableCell>
                    <TableCell className="text-gray-500">{[c.city, c.region].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell>{c.users?.full_name || <span className="text-gray-300">Unassigned</span>}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${c.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
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
