"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, FileText, Clock, ShoppingBag, AlertTriangle, DollarSign, Loader2, Inbox, TrendingUp, ChevronRight, Sparkles, Calendar, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getSupervisorKPIs, getTeamSalesmen, getRecentTeamActivity, type SupervisorKPIs, type TeamSalesman } from "@/app/actions/supervisor-actions";
import { getCurrentUser } from "@/app/actions/auth";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function SupervisorDashboardPage() {
  const [kpis, setKpis] = useState<SupervisorKPIs | null>(null);
  const [salesmen, setSalesmen] = useState<TeamSalesman[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, teamData, activityData, session] = await Promise.all([
          getSupervisorKPIs(),
          getTeamSalesmen(),
          getRecentTeamActivity(),
          getCurrentUser()
        ]);
        setKpis(kpiData);
        setSalesmen(teamData);
        setActivity(activityData);
        setUser(session?.user);
      } catch (err) {
        console.error("Supervisor dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Active Salesmen", value: kpis?.activeSalesmen ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50/50" },
    { label: "Visits Today", value: kpis?.visitsToday ?? 0, icon: MapPin, color: "text-teal-600", bg: "bg-teal-50/50" },
    { label: "Submitted Callsheets", value: kpis?.submittedCallsheets ?? 0, icon: FileText, color: "text-amber-600", bg: "bg-amber-50/50" },
    { label: "Pending Reviews", value: kpis?.pendingCallsheetReviews ?? 0, icon: Clock, color: kpis?.pendingCallsheetReviews ? "text-orange-600" : "text-gray-900", bg: kpis?.pendingCallsheetReviews ? "bg-orange-50/50" : "" },
    { label: "Pending Requests", value: kpis?.pendingRequests ?? 0, icon: ShoppingBag, color: kpis?.pendingRequests ? "text-purple-600" : "text-gray-900", bg: kpis?.pendingRequests ? "bg-purple-50/50" : "" },
    { label: "Pending Bookings", value: kpis?.pendingBookings ?? 0, icon: ShoppingBag, color: kpis?.pendingBookings ? "text-indigo-600" : "text-gray-900", bg: "" },
    { label: "Monthly Sales", value: `₱${(kpis?.monthlySalesTotal ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50/50", isText: true },
    { label: "Low Stock Items", value: kpis?.lowStockItems ?? 0, icon: AlertTriangle, color: kpis?.lowStockItems ? "text-red-600" : "text-gray-900", bg: kpis?.lowStockItems ? "bg-red-50/50" : "" },
  ];

  const topSalesmen = [...salesmen].sort((a, b) => b.monthlySales - a.monthlySales).slice(0, 5);

  const allActivity = [
    ...(activity?.visits || []).map((v: any) => ({ type: "visit", label: `${v.users?.full_name} visited ${v.customers?.store_name}`, date: v.created_at })),
    ...(activity?.callsheets || []).map((c: any) => ({ type: "callsheet", label: `${c.users?.full_name} — callsheet ${c.status}`, date: c.created_at })),
    ...(activity?.requests || []).map((r: any) => ({ type: "request", label: `${r.users?.full_name} — request for ${r.customers?.store_name}`, date: r.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ═══ Management Header ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#005914] p-6 text-white shadow-xl shadow-green-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-green-100 text-xs font-bold uppercase tracking-[0.2em] mb-1">Operations Tower</p>
            <h2 className="text-2xl font-black tracking-tight">{user?.full_name ?? "Operations Lead"}</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-green-100/70 text-xs flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <p className="text-green-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Real-time Operations
              </p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 overflow-hidden">
            <Image src="/supervisor-hero.png" alt="Supervisor" width={56} height={56} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Efficiency Pulse */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-green-100/70 uppercase tracking-wider">Revenue Insight (MTD)</p>
              <Zap className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xl font-black tracking-tight text-white">₱{(kpis?.monthlySalesTotal ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 0 })}</p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-green-400 rounded-full w-[75%] transition-all" />
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-green-100/70 uppercase tracking-wider">Team Efficiency</p>
              <Sparkles className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xl font-black tracking-tight text-white">88.5%</p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-green-400 rounded-full w-[88%] transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`shadow-sm border-0 rounded-xl overflow-hidden ${card.bg}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className={`text-xs font-medium uppercase flex items-center gap-2 ${card.color}`}>
                <card.icon className="w-4 h-4" /> {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${card.color}`}>
                {(card as any).isText ? card.value : (card.value as number).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Salesmen */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#005914]" /> Top Salesmen
            </CardTitle>
            <Link href="/supervisor/team">
              <Button variant="ghost" size="sm" className="text-[#005914]">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {topSalesmen.length === 0 ? (
              <EmptyState message="No salesmen data" />
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSalesmen.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell className="text-right">{s.visitsToday}</TableCell>
                      <TableCell className="text-right font-bold text-[#005914]">₱{s.monthlySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Team Activity */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Team Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {allActivity.length === 0 ? (
              <EmptyState message="No recent activity" />
            ) : (
              <div className="space-y-2">
                {allActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === "visit" ? "bg-teal-50 text-teal-600" :
                        item.type === "callsheet" ? "bg-amber-50 text-amber-600" :
                          "bg-purple-50 text-purple-600"
                      }`}>
                      {item.type === "visit" ? <MapPin className="w-4 h-4" /> :
                        item.type === "callsheet" ? <FileText className="w-4 h-4" /> :
                          <ShoppingBag className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
