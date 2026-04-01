"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Loader2, Inbox } from "lucide-react";
import {
  getSalesTransactions, getSaleDetails, exportSalesCSV,
  type SalesTransactionRow, type SaleDetail,
} from "@/app/actions/sales";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function SalesTransactionsPage() {
  const [transactions, setTransactions] = useState<SalesTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getSalesTransactions().then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  async function handleViewDetails(id: string) {
    setDetailLoading(true);
    setDetailOpen(true);
    const detail = await getSaleDetails(id);
    setSelectedSale(detail);
    setDetailLoading(false);
  }

  async function handleExportCSV() {
    const csv = await exportSalesCSV();
    if (!csv) return alert("No data to export.");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Transactions</h1>
          <p className="text-gray-500 text-sm">View sales records, invoice totals, customer references, and line items.</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Transaction History</CardTitle>
          <Button variant="outline" size="sm" className="h-8" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <EmptyState message="No sales transactions yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-900">{tx.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-gray-500">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                    <TableCell className="font-medium">{tx.customers?.store_name ?? "N/A"}</TableCell>
                    <TableCell className="text-gray-500">{tx.users?.full_name ?? "N/A"}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      ₱{(tx.total_amount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${
                        tx.status === "completed" ? "bg-green-50 text-green-700 ring-green-600/20" :
                        tx.status === "pending" ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" :
                        "bg-gray-100 text-gray-700 ring-gray-300"
                      } capitalize`}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-[#005914]" onClick={() => handleViewDetails(tx.id)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sale Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#005914]" />
            </div>
          ) : selectedSale ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{selectedSale.customers?.store_name ?? "N/A"}</span></div>
                <div><span className="text-gray-500">Sales Rep:</span> <span className="font-medium">{selectedSale.users?.full_name ?? "N/A"}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{selectedSale.status}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold">₱{selectedSale.total_amount?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
              </div>
              {selectedSale.sales_transaction_items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.sales_transaction_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_variants?.name ?? "Unknown"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₱{item.unit_price?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold">₱{item.subtotal?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No line items</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Could not load details.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
