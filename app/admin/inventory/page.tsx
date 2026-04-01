"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, ArrowUpRight, ArrowDownRight, Loader2, Inbox, Package, AlertTriangle } from "lucide-react";
import {
  getInventoryKPIs, getRecentMovements, getMovementTypes, getVariantsForAdjustment, createStockAdjustment,
  type InventoryKPIs, type MovementRow,
} from "@/app/actions/inventory";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function InventoryDashboardPage() {
  const [kpis, setKpis] = useState<InventoryKPIs>({ totalSKUs: 0, lowStockAlerts: 0 });
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [movementTypes, setMovementTypes] = useState<{ id: number; name: string; direction: string }[]>([]);
  const [variants, setVariants] = useState<{ id: string; name: string; sku: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function loadData() {
    setLoading(true);
    const [kpiData, movData, mtData, varData] = await Promise.all([
      getInventoryKPIs(),
      getRecentMovements(),
      getMovementTypes(),
      getVariantsForAdjustment(),
    ]);
    setKpis(kpiData);
    setMovements(movData);
    setMovementTypes(mtData);
    setVariants(varData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createStockAdjustment(form);
    setSaving(false);
    if (result.success) { setDialogOpen(false); loadData(); }
    else alert(result.error || "Failed to record adjustment.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  const displayedMovements = showAll ? movements : movements.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Ledger</h1>
          <p className="text-gray-500 text-sm">Monitor stock balances and track movements (receipts, sales, adjustments).</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#005914] hover:bg-[#00420f]">
              <PlusCircle className="w-4 h-4 mr-2" />
              Stock Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Stock Adjustment</DialogTitle>
              <DialogDescription>Add a new inventory movement entry.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variantId">Product Variant (SKU)</Label>
                <Select name="variantId" required>
                  <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} {v.sku ? `(${v.sku})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movementTypeId">Movement Type</Label>
                <Select name="movementTypeId" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((mt) => (
                      <SelectItem key={mt.id} value={String(mt.id)}>{mt.name} ({mt.direction})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" required min="1" placeholder="Enter quantity" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Optional notes" />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Record Adjustment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total SKUs in Stock</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{kpis.totalSKUs.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border-0 rounded-xl ${kpis.lowStockAlerts > 0 ? "bg-red-50/50" : ""}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className={`text-sm font-medium uppercase tracking-wider ${kpis.lowStockAlerts > 0 ? "text-red-600" : "text-gray-500"}`}>Low Stock Alerts</CardTitle>
            <AlertTriangle className={`w-4 h-4 ${kpis.lowStockAlerts > 0 ? "text-red-500" : "text-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${kpis.lowStockAlerts > 0 ? "text-red-700" : "text-gray-900"}`}>{kpis.lowStockAlerts}</div>
            {kpis.lowStockAlerts > 0 && <p className="text-xs text-red-600 mt-1 font-medium">Items below minimum threshold</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Movements</CardTitle>
          {movements.length > 5 && (
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Less" : "View Full Ledger"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <EmptyState message="No inventory movements yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Product Variant (SKU)</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMovements.map((m) => {
                  const isIn = m.quantity > 0;
                  return (
                    <TableRow key={m.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-gray-500 font-medium whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900 block">{m.product_variants?.name ?? "Unknown"}</span>
                        {m.product_variants?.sku && <span className="text-xs text-gray-500">{m.product_variants.sku}</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${
                          isIn ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-blue-50 text-blue-700 ring-blue-700/10"
                        }`}>
                          {isIn ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                          {m.inventory_movement_types?.name ?? "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${isIn ? "text-green-700" : "text-blue-700"}`}>
                        {isIn ? "+" : ""}{m.quantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">{m.balance}</TableCell>
                      <TableCell className="text-right text-gray-500">{m.users?.full_name ?? "System"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
