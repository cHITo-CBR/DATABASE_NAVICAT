"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { bg: string, text: string }> = {
  pending: { bg: "bg-[#F1F3F5]", text: "text-gray-500" },
  approved: { bg: "bg-blue-50", text: "text-blue-500" },
  fulfilled: { bg: "bg-orange-50", text: "text-orange-500" },
  confirmed: { bg: "bg-green-50", text: "text-green-500" },
};

export default function MobileBookingsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    /* In a real scenario, you'd filter by buyer_id using session, but our API currently fetches all for demo or you'd pass ?buyer=... */
    /* Since we're keeping it simple for the demo UI: */
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }

  async function confirmOrder(id: string) {
    if (!confirm("Confirm you have received this order?")) return;
    const res = await fetch(`/api/orders/${id}/confirm`, {
      method: "PUT"
    });
    if (res.ok) {
      loadOrders(); // reload
    } else {
      alert("Failed to confirm order");
    }
  }

  return (
    <div className="pb-8 pt-2">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
          My Orders
        </h1>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Manage your scheduled items
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-[28px] border border-gray-100 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-[20px] shrink-0"></div>
                <div className="flex-1 py-1">
                  <div className="w-20 h-4 bg-gray-200 rounded-full mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded-sm mb-1.5"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded-sm"></div>
                </div>
              </div>
              <div className="flex gap-2">
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
          <p className="text-[15px] font-medium text-gray-500">No orders yet</p>
          <Link href="/customers/catalog/products" className="mt-4 text-[#4B5E65] font-bold text-[13px] bg-[#E6EAF0] px-6 py-2.5 rounded-full">Explore Shop</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const statusStyle = statusStyles[o.status] || { bg: "bg-gray-100", text: "text-gray-700" };
            return (
              <div key={o.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex gap-4 mb-5">
                  <div className="w-[72px] h-[72px] bg-[#1A1D20] rounded-[20px] flex items-center justify-center text-white/50 overflow-hidden shrink-0 relative">
                    <Calendar className="w-6 h-6 absolute z-10" />
                    {o.image_url && <img src={o.image_url} alt="img" className="w-full h-full object-cover relative z-20" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide", statusStyle.bg, statusStyle.text)}>
                        {o.status}
                      </span>
                      <span className="text-[#556987] font-bold text-[14px]">
                        ${Number(o.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1 truncate">
                      {o.product_name || `Product ID: ${o.product_id}`}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                      <span className="font-bold">Qty: {o.quantity}</span>
                      <span className="mx-0.5">•</span>
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  {o.status === "fulfilled" && (
                    <button 
                      onClick={() => confirmOrder(o.id.toString())}
                      className="flex-1 py-2.5 bg-[#005914] text-white text-[13px] font-bold rounded-full shadow-lg shadow-[#005914]/20 transition-transform active:scale-95"
                    >
                      Confirm Order
                    </button>
                  )}
                  {o.status === "confirmed" && (
                     <div className="flex-1 py-2.5 bg-[#E2EBE5] text-[#005914] text-[13px] font-bold rounded-full text-center">
                       Order Completed
                     </div>
                  )}
                  {(o.status === "pending" || o.status === "approved") && (
                     <div className="flex-1 py-2.5 bg-[#F1F3F5] text-gray-400 text-[13px] font-bold rounded-full text-center">
                       Awaiting Fulfillment
                     </div>
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
