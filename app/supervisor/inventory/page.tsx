"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Inbox, AlertTriangle, TrendingDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getInventoryImpact } from "@/app/actions/supervisor-actions";

export default function SupervisorInventoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventoryImpact().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Impact View</h1>
        <p className="text-gray-500 text-sm">Monitor stock levels and recent movements affecting your team's operations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg font-semibold text-gray-800">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data?.lowStock || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No low stock items</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStock.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.product_variants?.products?.name || "—"}</TableCell>
                      <TableCell className="text-gray-500">{item.product_variants?.name || "—"}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{item.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Movements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data?.recentMovements || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Inbox className="w-10 h-10 mb-2" /><p className="text-sm font-medium">No recent movements</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentMovements.map((m: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.product_variants?.products?.name || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                          m.inventory_movement_types?.direction === "in" ? "bg-green-50 text-green-700" :
                          m.inventory_movement_types?.direction === "out" ? "bg-red-50 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {m.inventory_movement_types?.direction === "in" ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {m.inventory_movement_types?.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                      <TableCell className="text-right font-bold">{m.balance}</TableCell>
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
