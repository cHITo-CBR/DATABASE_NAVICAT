"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Package, User, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { getOrderDetail } from "@/app/actions/buyer-actions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  preparing: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getOrderDetail(params.id as string).then((d) => { setOrder(d); setLoading(false); });
    }
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  if (!order) return <div className="text-center py-16 text-gray-400">Order not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/customers/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005914] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Detail</h1>
          <p className="text-gray-500 text-sm">Order placed on {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase ${statusColors[order.status] || "bg-gray-100"}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-400 font-medium">Store</p><p className="font-bold text-gray-900">{order.customers?.store_name || "—"}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Package className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-400 font-medium">Total Amount</p><p className="font-bold text-[#005914] text-lg">₱{(order.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-400 font-medium">Date</p><p className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.sales_transaction_items || []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No items</TableCell></TableRow>
              ) : (
                order.sales_transaction_items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_variants?.products?.name || "—"}</TableCell>
                    <TableCell className="text-gray-500">{item.product_variants?.name || "—"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₱{(item.unit_price || item.product_variants?.unit_price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-bold">₱{((item.quantity || 0) * (item.unit_price || item.product_variants?.unit_price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline placeholder */}
      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /> Order Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {["Pending", "Approved", "Preparing", "Delivered"].map((step, i) => {
              const stepKey = step.toLowerCase();
              const isActive = order.status === stepKey || (order.status === "completed" && step === "Delivered");
              const isPast = ["pending", "approved", "preparing", "completed", "delivered"].indexOf(order.status) >= i;
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isPast ? "bg-[#005914] text-white border-[#005914]" : "bg-white text-gray-400 border-gray-200"}`}>{i + 1}</div>
                  <span className={`text-xs font-medium ${isPast ? "text-[#005914]" : "text-gray-400"}`}>{step}</span>
                  {i < 3 && <div className={`flex-1 h-0.5 ${isPast ? "bg-[#005914]" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
