"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, Package, AlertTriangle, ShieldCheck, DollarSign, Loader2, Inbox, Activity, Target, Layers, ArrowUpRight, Zap, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getDashboardKPIs, getRecentTransactions, getLowStockItems, type DashboardKPIs, type RecentTransaction, type LowStockItem } from "@/app/actions/dashboard";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, txData, stockData] = await Promise.all([
          getDashboardKPIs(),
          getRecentTransactions(),
          getLowStockItems(),
        ]);
        setKpis(kpiData);
        setTransactions(txData);
        setLowStock(stockData);
      } catch (err) {
        console.error("Dashboard load error:", err);
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
    {
      label: "Total Users",
      value: kpis?.totalUsers ?? 0,
      icon: Users,
      color: "text-gray-900",
      bg: "",
    },
    {
      label: "Successful Orders",
      value: kpis?.successfulOrdersCount ?? 0,
      icon: CheckCircle,
      color: kpis?.successfulOrdersCount ? "text-green-600" : "text-gray-900",
      bg: "",
    },
    {
      label: "Total Customers",
      value: kpis?.totalCustomers ?? 0,
      icon: ShoppingCart,
      color: "text-gray-900",
      bg: "",
    },
    {
      label: "Total Products",
      value: kpis?.totalProducts ?? 0,
      icon: Package,
      color: "text-gray-900",
      bg: "",
    },
    {
      label: "Low Stock Items",
      value: kpis?.lowStockItems ?? 0,
      icon: AlertTriangle,
      color: kpis?.lowStockItems ? "text-red-700" : "text-gray-900",
      bg: kpis?.lowStockItems ? "bg-red-50/50" : "",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ═══ Enterprise Header ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-[#005914] p-6 text-white shadow-xl shadow-green-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-green-100 text-xs font-black uppercase tracking-[0.2em] mb-1">Command Center</p>
            <h2 className="text-2xl font-black tracking-tight">Enterprise Overview</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-green-100/70 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Live Hub Status: <span className={`font-black ${
                  kpis?.hubStatus === 'operational' ? 'text-green-400' :
                  kpis?.hubStatus === 'maintenance' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {kpis?.hubStatus?.toUpperCase() ?? 'OFFLINE'}
                </span>
              </p>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <p className="text-green-100/70 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-300" />
                Goal Efficiency: {kpis?.goalEfficiency?.toFixed(1) ?? '0.0'}%
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2">
            <Image src="/logo.png" alt="CPF Logo" width={40} height={40} className="w-full h-full object-contain invert" />
          </div>
        </div>

        {/* Global Pipeline Pulse */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-green-100/70 uppercase tracking-widest leading-none">Total Pipeline Value</p>
              <div className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white/5 ${
                (kpis?.pipelineGrowth ?? 0) > 0 ? 'text-green-400 bg-white/10' : 'text-gray-400 bg-white/5'
              }`}>
                <ArrowUpRight className="w-2.5 h-2.5" />
                {kpis?.pipelineGrowth > 0 ? '+' : ''}{kpis?.pipelineGrowth ?? 0}%
              </div>
            </div>
            <p className="text-xl font-black tracking-tight text-white">
              ₱{(kpis?.totalPipelineValue ?? 0) >= 1000000 
                ? ((kpis?.totalPipelineValue ?? 0) / 1000000).toFixed(1) + 'M'
                : (kpis?.totalPipelineValue ?? 0) >= 1000 
                ? ((kpis?.totalPipelineValue ?? 0) / 1000).toFixed(1) + 'K'
                : (kpis?.totalPipelineValue ?? 0).toLocaleString('en-PH')
              }
            </p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-green-400 rounded-full transition-all" 
                style={{ width: `${Math.min(100, Math.max(10, (kpis?.goalEfficiency ?? 0)))}%` }}
              />
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-green-100/70 uppercase tracking-widest leading-none">Total Earnings</p>
              <DollarSign className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xl font-black tracking-tight text-white">
              ₱{(kpis?.totalEarnings ?? 0) >= 1000000 
                ? ((kpis?.totalEarnings ?? 0) / 1000000).toFixed(1) + 'M'
                : (kpis?.totalEarnings ?? 0) >= 1000 
                ? ((kpis?.totalEarnings ?? 0) / 1000).toFixed(1) + 'K'
                : (kpis?.totalEarnings ?? 0).toLocaleString('en-PH')
              }
            </p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all bg-green-400" 
                style={{ width: `${Math.min(100, Math.max(2, ((kpis?.totalEarnings ?? 0) / 10000000) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`shadow-sm border-0 rounded-xl relative overflow-hidden ${card.bg}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className={`text-xs font-medium uppercase flex items-center gap-2 ${card.value > 0 && card.label === "Low Stock Items" ? "text-red-600" : "text-gray-500"}`}>
                <card.icon className="w-4 h-4" /> {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Sales Transactions</CardTitle>
            <Link href="/admin/sales">
              <Button variant="ghost" size="sm" className="text-[#005914]">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <EmptyState message="No sales transactions yet" />
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.customer_name}</TableCell>
                      <TableCell className="text-right font-bold">₱{tx.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${tx.status === "completed" ? "bg-green-50 text-green-700" :
                          tx.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
            <CardTitle className="text-lg font-semibold text-gray-800">Low Stock Alerts</CardTitle>
            <Link href="/admin/inventory">
              <Button variant="ghost" size="sm" className="text-[#005914]">View Inventory</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {lowStock.length === 0 ? (
              <EmptyState message="No low stock alerts" />
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>SKU Variant</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-gray-900">{item.variant_name}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{item.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
