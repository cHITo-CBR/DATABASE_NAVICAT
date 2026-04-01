"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingBag, Inbox } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getBuyerOrders } from "@/app/actions/buyer-actions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  preparing: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function BuyerBookingsPage() {
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm">{orders.length} orders in your history</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Inbox className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm font-medium">No orders yet</p>
          <Link href="/customers/catalog/products" className="text-[#005914] text-sm font-bold mt-2 inline-block">Browse products →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/customers/bookings/${o.id}`}>
              <Card className="shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer mb-3">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{o.customers?.store_name || "Order"}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>·</span>
                      <span>{o.sales_transaction_items?.length || 0} items</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">₱{(o.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[o.status] || "bg-gray-100 text-gray-700"}`}>{o.status}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
