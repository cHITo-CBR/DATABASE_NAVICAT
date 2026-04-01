"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, FileText, ChevronRight, Loader2, Inbox, Search, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/app/actions/auth";
import { getBuyerDashboard } from "@/app/actions/buyer-actions";

export default function BuyerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      if (session?.user) {
        setUserName(session.user.full_name || "");
        const dashboard = await getBuyerDashboard(session.user.id);
        setData(dashboard);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  const quickActions = [
    { label: "Browse Products", href: "/customers/catalog/products", icon: Package, color: "from-[#005914] to-emerald-500" },
    { label: "New Request", href: "/customers/buyer-requests/new", icon: FileText, color: "from-blue-500 to-indigo-500" },
    { label: "My Orders", href: "/customers/bookings", icon: ShoppingCart, color: "from-purple-500 to-pink-500" },
    { label: "My Requests", href: "/customers/buyer-requests", icon: ShoppingBag, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ═══ Premium Welcome ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#005914] p-6 text-white shadow-xl shadow-green-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
              <Sparkles className="w-3 h-3 text-green-300" />
              <span className="text-[10px] font-black text-green-100 uppercase tracking-widest">Premium Partner Access</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
              Welcome, {userName.split(' ')[0] || "Partner"}
            </h1>
            <p className="text-green-100/70 text-sm font-medium">Explore the new Season Catalog and manage your inventory requests.</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 overflow-hidden ring-4 ring-white/10">
            <Image src="/buyer-hero.png" alt="Buyer" width={64} height={64} className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Marketplace Pulse */}
        <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-green-100/70 uppercase tracking-widest mb-1 leading-tighter">Purchase Volume</p>
            <p className="text-lg font-black text-white">₱{(data?.totalPurchaseValue || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-green-100/70 uppercase tracking-widest mb-1 leading-tighter">Active Orders</p>
            <p className="text-lg font-black text-white">{data?.recentOrders?.length || 0}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-green-100/70 uppercase tracking-widest mb-1 leading-tighter">Credit Score</p>
            <p className="text-lg font-black text-green-300">Elite</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Requests</CardTitle>
            <Link href="/customers/buyer-requests"><span className="text-xs font-bold text-[#005914]">View All →</span></Link>
          </CardHeader>
          <CardContent className="p-3">
            {(data?.recentRequests || []).length === 0 ? (
              <div className="py-8 text-center text-gray-400"><Inbox className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">No requests yet</p></div>
            ) : (
              <div className="space-y-2">
                {data.recentRequests.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.buyer_request_items?.length || 0} items</p>
                      <p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${r.status === "pending" ? "bg-yellow-50 text-yellow-700" : r.status === "fulfilled" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Orders</CardTitle>
            <Link href="/customers/bookings"><span className="text-xs font-bold text-[#005914]">View All →</span></Link>
          </CardHeader>
          <CardContent className="p-3">
            {(data?.recentOrders || []).length === 0 ? (
              <div className="py-8 text-center text-gray-400"><Inbox className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">No orders yet</p></div>
            ) : (
              <div className="space-y-2">
                {data.recentOrders.slice(0, 3).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900">₱{(o.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-gray-400">{o.customers?.store_name || "—"} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${o.status === "completed" || o.status === "delivered" ? "bg-green-50 text-green-700" : o.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      {(data?.featuredProducts || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
            <Link href="/customers/catalog/products"><span className="text-xs font-bold text-[#005914]">View All →</span></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.featuredProducts.map((p: any) => (
              <Link key={p.id} href={`/customers/catalog/products/${p.id}`}>
                <Card className="shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-3 text-center">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {p.product_images?.[0]?.image_url ? (
                        <img src={p.product_images[0].image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.brands?.name || ""}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
