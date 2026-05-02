"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox, CheckCircle, XCircle, Truck, ArrowUpRight, DollarSign, PackageOpen, AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateBookingStatus } from "@/app/actions/sales";

type BookingRow = {
  id: string;
  status: string;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  customers?: { store_name?: string | null } | null;
  users?: { full_name?: string | null } | null;
};

interface OrderListProps {
  requests: BookingRow[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
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

export function OrderList({ requests }: OrderListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending" value={summary.pending.toString()} icon={AlertCircle} tone="text-amber-600" />
        <StatCard label="Approved" value={summary.approved.toString()} icon={PackageOpen} tone="text-blue-600" />
        <StatCard label="Completed" value={summary.completed.toString()} icon={CheckCircle} tone="text-green-600" />
        <StatCard label="Total Revenue" value={formatCurrency(summary.revenue)} icon={DollarSign} tone="text-gray-900" />
      </div>

      {requests.length === 0 ? (
        <EmptyState message="No requests found for this category." />
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
    </div>
  );
}
