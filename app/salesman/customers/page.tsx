"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ChevronRight, Store, UserPlus, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { getSalesmanCustomers, getUnassignedCustomers, assignCustomerToSalesman } from "@/app/actions/customers";
import { getCurrentUser } from "@/app/actions/auth";

export default function SalesmanCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadData() {
    const session = await getCurrentUser();
    const uid = session?.user?.id;
    if (uid) {
      setUserId(uid);
      const [assigned, available] = await Promise.all([
        getSalesmanCustomers(uid),
        getUnassignedCustomers(),
      ]);
      setCustomers(assigned);
      setUnassigned(available);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAssign(customerId: string) {
    if (!userId) return;
    setAssigning(customerId);
    const result = await assignCustomerToSalesman(customerId, userId);
    if (result.success) {
      await loadData();
    }
    setAssigning(null);
  }

  const filtered = customers.filter(c =>
    c.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnassigned = unassigned.filter(c =>
    c.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
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

      {/* Unassigned Stores - New Buyer Registrations */}
      {filteredUnassigned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-700">New Stores Available ({filteredUnassigned.length})</h3>
          </div>
          {filteredUnassigned.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-amber-100 overflow-hidden hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-200">
                    <Store className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{c.store_name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.email && (
                        <p className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#005914] hover:bg-[#004a11] text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5"
                    disabled={assigning === c.id}
                    onClick={() => handleAssign(c.id)}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {assigning === c.id ? "Assigning..." : "Assign to Me"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assigned Store Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && filteredUnassigned.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No stores found</p>
          </div>
        ) : filtered.length === 0 && filteredUnassigned.length > 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-400 text-xs font-medium">No assigned stores yet. Assign a store from above!</p>
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
                    Callsheet
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
