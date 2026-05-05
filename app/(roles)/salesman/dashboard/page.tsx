"use client";

/**
 * SALESMAN DASHBOARD PAGE
 * This is the primary mobile-first interface for field agents.
 * It focuses on daily operations:
 * - Sales Quota Tracking: Real-time progress towards the monthly target.
 * - Field Activity: Recording and viewing customer visits.
 * - Quick Actions: Easy access to creating new visits and bookings.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MapPin,
  FileCheck,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  Zap,
  Target,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getSalesmanKPIs, getSalesmanRecentActivity, type SalesmanKPIs } from "@/app/actions/salesman-dashboard";
import { getCurrentUser } from "@/app/actions/auth";

export default function SalesmanDashboardPage() {
  const [kpis, setKpis] = useState<SalesmanKPIs | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /**
   * DATA FETCHING
   * Retrieves the current user profile and their specific performance metrics.
   */
  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      setUser(session?.user);

      if (userId) {
        const [kpiData, recentData] = await Promise.all([
          getSalesmanKPIs(userId),
          getSalesmanRecentActivity(userId)
        ]);
        setKpis(kpiData);
        // Combine and sort different activity types (visits, bookings, etc.)
        const combined = [
          ...(recentData?.visits || []),
          ...(recentData?.bookings || [])
        ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecent(combined);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Display a custom animated loader while data is being prepared
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005914] to-emerald-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Helper for dynamic time-of-day greeting
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // configuration for the main statistic cards
  const kpiHighlights = [
    { label: "Today's Visits", value: kpis?.todayVisits ?? 0, icon: MapPin, gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50", ring: "ring-blue-100" },
    { label: "Bookings", value: kpis?.confirmedBookings ?? 0, icon: ShoppingBag, gradient: "from-emerald-500 to-green-400", bg: "bg-green-50", ring: "ring-green-100" },
  ];

  // configuration for rapid field actions
  const quickActions = [
    { label: "New Visit", href: "/salesman/customers", icon: Plus, color: "text-gray-900", bg: "bg-white", border: "border-gray-200" },
    { label: "New Booking", href: "/salesman/bookings/new", icon: ShoppingBag, color: "text-gray-900", bg: "bg-white", border: "border-gray-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* ═══ PERSONALIZED GREETING & CONTEXT ═══ 
          Shows the user name, date, and a visual brand avatar in a minimal white design.
      */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{greeting()}</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{user?.full_name ?? "Field Partner"}</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden">
            <Image src="/seller-hero.png" alt="Seller" width={48} height={48} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* BOOKING PROGRESS BAR
            Shows dynamic status (Achieved, On Track, Below Target) and progress statistics.
        */}
        <div className="relative z-10 mt-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${
                kpis?.quota?.status === "Achieved" ? "bg-emerald-100 text-emerald-700" :
                kpis?.quota?.status === "On Track" ? "bg-blue-100 text-blue-700" :
                kpis?.quota?.status === "Below Target" ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-gray-500"
              } flex items-center justify-center`}>
                <Target className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Monthly Performance — {currentMonthName}
              </p>
            </div>
            {kpis?.quota?.status && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                kpis?.quota?.status === "Achieved" ? "bg-emerald-500 text-white" :
                kpis?.quota?.status === "On Track" ? "bg-blue-500 text-white" :
                kpis?.quota?.status === "Below Target" ? "bg-amber-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {kpis.quota.status}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Amount Quota */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Financial Target</p>
                <div className="text-right">
                   <p className="text-sm font-black text-gray-900 leading-none">
                    ₱{kpis?.quota?.achieved?.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                    <span className="text-[10px] font-bold text-gray-400 ml-1">/ ₱{kpis?.quota?.target?.toLocaleString("en-PH", { minimumFractionDigits: 0 })}</span>
                  </p>
                </div>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    kpis?.quota?.status === "Achieved" ? "bg-emerald-500" :
                    kpis?.quota?.status === "On Track" ? "bg-blue-500" :
                    "bg-amber-500"
                  }`} 
                  style={{ width: `${kpis?.quota?.percentage ?? 0}%` }}
                />
              </div>
            </div>

            {/* Orders Quota (Minor indicator) */}
            {kpis?.quota?.orderTarget ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Order Volume</p>
                  <p className="text-xs font-black text-gray-700">
                    {kpis.quota.orderAchieved} / {kpis.quota.orderTarget} orders
                  </p>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${kpis.quota.orderPercentage}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* FIELD KPI CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {kpiHighlights.map((kpi, i) => (
          <Card key={kpi.label} className={`border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ${kpi.ring} animate-in fade-in slide-in-from-bottom-2`} style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} text-white shadow-lg`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{kpi.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QUICK FIELD ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.bg} border ${action.border} shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md`}>
                <action.icon className="w-6 h-6 text-green-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ACTIVITY FEED
          Shows recent interactions with stores/customers.
      */}
      <Card className="border-0 shadow-lg rounded-2xl ring-1 ring-gray-100">
        <CardHeader className="pb-2 px-5 pt-5">
          <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#005914]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-300 text-sm italic">No recent activity recorded</p>
            </div>
          ) : (
            recent.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  item.type === "booking" ? "bg-emerald-50" : "bg-white"
                }`}>
                  {item.type === "booking" ? (
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <MapPin className="w-4 h-4 text-[#005914]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {item.type === "booking"
                      ? `Order — ${item.customers?.store_name || "Customer"}`
                      : item.customers?.store_name || "Store Visit"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {item.type === "booking" && item.total_amount
                      ? `₱${Number(item.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} • ${item.status}`
                      : new Date(item.visit_date || item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

