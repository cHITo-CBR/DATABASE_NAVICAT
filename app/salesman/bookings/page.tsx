"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Plus, ChevronRight, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { supabase } from "@/lib/supabase";

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  approved: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
  completed: { icon: Truck, color: "text-green-600", bg: "bg-green-50" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function SalesmanBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      if (userId) {
        const { data } = await supabase
          .from("sales_transactions")
          .select("*, customers:customer_id (store_name)")
          .eq("salesman_id", userId)
          .order("created_at", { ascending: false });
        setBookings(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">My Bookings</h2>
          <p className="text-xs text-gray-400 font-medium">{bookings.length} orders placed</p>
        </div>
        <Link href="/salesman/bookings/new">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No bookings yet</p>
          <Link href="/salesman/bookings/new" className="text-purple-600 text-sm font-bold mt-2 inline-block">Place your first order →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = statusConfig[b.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Card key={b.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${status.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{b.customers?.store_name || "Unknown"}</h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-black text-gray-900">₱{(b.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${status.bg} ${status.color}`}>
                      {b.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
