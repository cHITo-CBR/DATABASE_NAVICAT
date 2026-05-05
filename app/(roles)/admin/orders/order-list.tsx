"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Inbox, CheckCircle, XCircle, Truck, ArrowUpRight,
  DollarSign, PackageOpen, AlertCircle, ShoppingBag, Users, Package
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateBookingStatus } from "@/app/actions/sales";
import { approveBuyerRequest } from "@/app/actions/buyer-requests";

type BookingRow = {
  id: string;
  status: string;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  customers?: { store_name?: string | null } | null;
  users?: { full_name?: string | null } | null;
};

type BuyerRequestRow = {
  id: number;
  status: string;
  store_name: string;
  contact_person: string;
  created_at: string;
  total_amount?: number;
  items: { id: number; product_name: string; quantity: number; unit_price?: number }[];
};

interface OrderListProps {
  requests: BookingRow[];
  buyerRequests?: BuyerRequestRow[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  processed: "bg-green-50 text-green-700 border border-green-200",
};

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <Card className="border-0 shadow-sm rounded-2xl bg-white/90 ring-1 ring-[#e5eee7]">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em]">{label}</p>
          <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-xl opacity-80 ${tone.replace("text-", "bg-").replace("900", "gray-100")}`}>
          <Icon className={`w-5 h-5 ${tone}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderList({ requests, buyerRequests = [] }: OrderListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"salesman" | "customer">("salesman");

  const summary = {
    pending: requests.filter((booking) => booking.status === "pending").length,
    approved: requests.filter((booking) => booking.status === "approved").length,
    completed: requests.filter((booking) => booking.status === "completed").length,
    revenue: requests.reduce((sum, booking) => {
      if (booking.status !== "completed") return sum;
      return sum + Number(booking.total_amount || 0);
    }, 0),
  };

  async function handleStatusChange(id: string, status: string) {
    setLoadingId(id);
    await updateBookingStatus(id, status);
    router.refresh();
    setLoadingId(null);
  }

  async function handleApproveRequest(id: number) {
    setLoadingId(String(id));
    await approveBuyerRequest(String(id));
    router.refresh();
    setLoadingId(null);
  }

  const tabs = [
    {
      key: "salesman" as const,
      label: "Salesman Orders",
      icon: ShoppingBag,
      count: requests.length,
    },
    {
      key: "customer" as const,
      label: "Customer Requests",
      icon: Users,
      count: buyerRequests.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending" value={summary.pending.toString()} icon={AlertCircle} tone="text-amber-600" />
        <StatCard label="Approved" value={summary.approved.toString()} icon={PackageOpen} tone="text-blue-600" />
        <StatCard label="Completed" value={summary.completed.toString()} icon={CheckCircle} tone="text-green-600" />
        <StatCard label="Total Revenue" value={formatCurrency(summary.revenue)} icon={DollarSign} tone="text-gray-900" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-[#f0f5f1] p-1 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-[#005914] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-[#005914]/10 text-[#005914]"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Salesman Orders Tab */}
      {activeTab === "salesman" && (
        <>
          {requests.length === 0 ? (
            <EmptyState message="No salesman orders found." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#e6efe8] bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-[#f7faf7]">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Salesman</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-[#f8fbf8] transition-colors">
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(booking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{booking.users?.full_name ?? "N/A"}</TableCell>
                      <TableCell className="font-medium text-gray-900">{booking.customers?.store_name ?? "N/A"}</TableCell>
                      <TableCell className="text-right font-bold text-[#005914]">{formatCurrency(booking.total_amount || 0)}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusStyles[booking.status] || "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-700 hover:bg-green-50 gap-1"
                              disabled={loadingId === booking.id}
                              onClick={() => handleStatusChange(booking.id, "approved")}
                            >
                              {loadingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-700 hover:bg-red-50 gap-1"
                              disabled={loadingId === booking.id}
                              onClick={() => handleStatusChange(booking.id, "cancelled")}
                            >
                              {loadingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-700 hover:bg-blue-50 gap-1"
                            disabled={loadingId === booking.id}
                            onClick={() => handleStatusChange(booking.id, "completed")}
                          >
                            {loadingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                            Complete
                          </Button>
                        )}
                        {booking.status !== "pending" && booking.status !== "approved" && (
                          <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Closed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Customer Requests Tab */}
      {activeTab === "customer" && (
        <>
          {buyerRequests.length === 0 ? (
            <EmptyState message="No customer requests yet." />
          ) : (
            <div className="space-y-4">
              {buyerRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-[#e6efe8] bg-white shadow-sm overflow-hidden"
                >
                  {/* Request Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#f7faf7]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#005914]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#005914]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{req.store_name}</p>
                        <p className="text-xs text-gray-500">
                          {req.contact_person} • {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusStyles[req.status] || "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Request Items */}
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {req.items.map((item) => {
                          const price = item.unit_price ?? 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-400" />
                                  {item.product_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                              <TableCell className="text-right text-gray-500">{formatCurrency(price)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(price * item.quantity)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Request Footer with Actions */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="text-sm">
                      <span className="text-gray-500">Total: </span>
                      <span className="font-bold text-[#005914] text-lg">
                        {formatCurrency(
                          req.items.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0)
                        )}
                      </span>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-9 bg-[#005914] hover:bg-green-800 gap-1.5 rounded-xl text-xs font-bold"
                          disabled={loadingId === String(req.id)}
                          onClick={() => handleApproveRequest(req.id)}
                        >
                          {loadingId === String(req.id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Approve & Convert to Order
                        </Button>
                      </div>
                    )}
                    {req.status === "processed" && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Converted to Sales Order
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
