"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getBuyerOrders } from "@/app/actions/buyer-actions";
import Image from "next/image";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { bg: string, text: string }> = {
  pending: { bg: "bg-[#F1F3F5]", text: "text-gray-500" },
  approved: { bg: "bg-blue-50", text: "text-blue-500" },
  preparing: { bg: "bg-blue-50", text: "text-blue-500" },
  completed: { bg: "bg-blue-50", text: "text-blue-500" },
  delivered: { bg: "bg-blue-50", text: "text-blue-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-500" },
};

export default function MobileBookingsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      if (session?.user) {
        const data = await getBuyerOrders(session.user.id);
        setOrders(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="pb-8 pt-2">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
          My Bookings
        </h1>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Manage your scheduled items
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-3xl border border-gray-100 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                <div className="flex-1 py-1">
                  <div className="w-20 h-4 bg-gray-200 rounded-full mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded-sm mb-1.5"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded-sm"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-[15px] font-medium text-gray-500">No bookings yet</p>
          <Link href="/customers/catalog/products" className="mt-4 text-[#4B5E65] font-bold text-[13px] bg-[#E6EAF0] px-6 py-2.5 rounded-full">Explore Shop</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const statusStyle = statusStyles[o.status] || { bg: "bg-gray-100", text: "text-gray-700" };
            return (
              <div key={o.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex gap-4 mb-5">
                  <div className="w-[72px] h-[72px] bg-[#1A1D20] rounded-[20px] flex items-center justify-center text-white/50 overflow-hidden shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide", statusStyle.bg, statusStyle.text)}>
                        {o.status}
                      </span>
                      <span className="text-[#556987] font-bold text-[14px]">
                        ${(o.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1 truncate">
                      {o.customers?.store_name || "Order #" + o.id}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <span className="mx-0.5">•</span>
                      {new Date(o.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  {(o.status === "pending" || o.status === "cancelled") ? (
                    <>
                      <button className="flex-1 py-2.5 bg-[#4B5E65] text-white text-[13px] font-bold rounded-full transition-opacity active:opacity-80">
                        Complete Payment
                      </button>
                      <button className="flex-none px-5 py-2.5 bg-white text-red-500 text-[13px] font-bold rounded-full border border-red-100 transition-colors active:bg-red-50">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/customers/bookings/${o.id}`} className="flex-1 py-2.5 bg-[#4B5E65] text-white text-[13px] font-bold rounded-full text-center transition-opacity active:opacity-80">
                        View Details
                      </Link>
                      <button className="flex-1 py-2.5 bg-[#E6EAF0] text-[#4B5E65] text-[13px] font-bold rounded-full transition-colors active:bg-[#D9DEE6]">
                        Reschedule
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
