"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, FileText, ShoppingBag, ChevronRight, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getTeamSalesmen, type TeamSalesman } from "@/app/actions/supervisor-actions";

export default function SupervisorTeamPage() {
  const [salesmen, setSalesmen] = useState<TeamSalesman[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamSalesmen().then((data) => { setSalesmen(data); setLoading(false); });
  }, []);

  const filtered = salesmen.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Team Monitoring</h1>
          <p className="text-gray-500 text-sm">{salesmen.length} salesmen in your team</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search salesmen..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="shadow-sm border-0 rounded-xl hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#005914] to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {s.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{s.full_name}</h3>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${s.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {s.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.visitsToday}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Visits Today</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.totalCallsheets}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Callsheets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.pendingRequests}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Pending Req</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{s.confirmedBookings}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Bookings</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Monthly Sales</p>
                  <p className="text-sm font-bold text-[#005914]">₱{s.monthlySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                </div>
                <Link href={`/supervisor/team/${s.id}`}>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#005914] hover:underline">
                    View Detail <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No salesmen found</p>
        </div>
      )}
    </div>
  );
}
