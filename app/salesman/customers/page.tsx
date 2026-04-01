"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, MapPin, ChevronRight, Loader2, FileText, Store } from "lucide-react";
import Link from "next/link";
import { getSalesmanCustomers } from "@/app/actions/customers";
import { getCurrentUser } from "@/app/actions/auth";

export default function SalesmanCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      if (userId) {
        const data = await getSalesmanCustomers(userId);
        setCustomers(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = customers.filter(c =>
    c.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005914] to-emerald-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Store Directory</h2>
        <p className="text-xs text-gray-400 font-medium">{customers.length} assigned stores</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search stores..."
          className="pl-11 h-12 bg-white border-0 ring-1 ring-gray-100 rounded-2xl shadow-sm text-sm font-medium focus-visible:ring-[#005914]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Store Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No stores found</p>
          </div>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center flex-shrink-0 ring-1 ring-green-100">
                    <Store className="w-5 h-5 text-[#005914]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{c.store_name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.address || "No address"}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 flex-shrink-0" />
                </div>
                {/* Quick Action Bar */}
                <div className="flex border-t border-gray-50 divide-x divide-gray-50">
                  <Link href={`/salesman/callsheets/new?customer=${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold text-gray-500 hover:text-[#005914] hover:bg-green-50/50 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Callsheet
                  </Link>
                  <Link href={`/salesman/visits?customer=${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                    <MapPin className="w-3.5 h-3.5" /> Visit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
