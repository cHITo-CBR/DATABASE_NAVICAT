"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plus, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { getSalesmanBuyerRequests } from "@/app/actions/buyer-requests";
import { getCurrentUser } from "@/app/actions/auth";

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  fulfilled: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function SalesmanRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      if (userId) {
        const result = await getSalesmanBuyerRequests(userId);
        setRequests(result.success ? result.data || [] : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Buyer Requests</h2>
          <p className="text-xs text-gray-400 font-medium">{requests.length} requests submitted</p>
        </div>
        <Link href="/salesman/requests/new">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No buyer requests yet</p>
          <Link href="/salesman/requests/new" className="text-blue-600 text-sm font-bold mt-2 inline-block">Submit your first request →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const status = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Card key={req.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${status.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{req.customers?.store_name || "Unknown"}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400">{req.buyer_request_items?.length || 0} items</span>
                      <span className="text-gray-200">•</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${status.bg} ${status.color}`}>
                      {req.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-200" />
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
