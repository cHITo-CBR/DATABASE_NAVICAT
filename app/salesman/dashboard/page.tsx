"use client";

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
        // Combine visits and callsheets into a flat array for the feed
        const combined = [
          ...(recentData?.visits || []),
          ...(recentData?.callsheets || [])
        ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecent(combined);
      }
      setLoading(false);
    }
    load();
  }, []);

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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const kpiHighlights = [
    { label: "Today's Visits", value: kpis?.todayVisits ?? 0, icon: MapPin, gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50", ring: "ring-blue-100" },
    { label: "Draft Callsheets", value: kpis?.pendingCallsheets ?? 0, icon: FileCheck, gradient: "from-amber-500 to-orange-400", bg: "bg-amber-50", ring: "ring-amber-100" },
    { label: "Bookings", value: kpis?.confirmedBookings ?? 0, icon: ShoppingBag, gradient: "from-emerald-500 to-green-400", bg: "bg-green-50", ring: "ring-green-100" },
  ];

  const quickActions = [
    { label: "New Visit", href: "/salesman/customers", icon: Plus, gradient: "from-[#005914] to-[#00802b]", shadow: "shadow-green-900/20" },
    { label: "Callsheet", href: "/salesman/callsheets/new", icon: FileCheck, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
    { label: "Request", href: "/salesman/requests/new", icon: AlertCircle, gradient: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/20" },
    { label: "Booking", href: "/salesman/bookings/new", icon: ShoppingBag, gradient: "from-purple-500 to-pink-500", shadow: "shadow-purple-500/20" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ═══ Hero Greeting ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#005914] p-6 text-white shadow-xl shadow-green-900/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-1">{greeting()}</p>
            <h2 className="text-2xl font-extrabold tracking-tight">{user?.full_name ?? "Field Partner"}</h2>
            <p className="text-green-200 text-sm mt-1 flex items-center gap-1.5 opacity-80">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg overflow-hidden">
            <Image src="/seller-hero.png" alt="Seller" width={48} height={48} className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Daily Target */}
        <div className="relative z-10 mt-5 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-green-200" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-green-100 uppercase tracking-wider">Daily Sales Target</p>
              <p className="text-xs font-extrabold text-green-300">60%</p>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full w-[60%] transition-all duration-1000" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* ═══ Quick Actions ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-xl ${action.shadow} transition-all duration-200 active:scale-95 hover:scale-105`}>
                <action.icon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ Recent Activity ═══ */}
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
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <MapPin className="w-4 h-4 text-[#005914]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.customers?.store_name || "Store Visit"}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(item.visit_date || item.created_at).toLocaleDateString()}</p>
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
