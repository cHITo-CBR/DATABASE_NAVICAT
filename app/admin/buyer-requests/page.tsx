"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, CheckCircle, XCircle, Package } from "lucide-react";
import { getAllBuyerRequests, updateBuyerRequestStatus } from "@/app/actions/buyer-requests";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700",
  fulfilled: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminBuyerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const data = await getAllBuyerRequests();
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id: string, status: string) {
    setActionLoading(id);
    await updateBuyerRequestStatus(id, status);
    await load();
    setActionLoading(null);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Buyer Requests</h1>
        <p className="text-gray-500 text-sm">Review product requests submitted by salesmen on behalf of customers.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: requests.filter(r => r.status === "pending").length, color: "text-blue-600" },
          { label: "Fulfilled", value: requests.filter(r => r.status === "fulfilled").length, color: "text-green-600" },
          { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">All Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <EmptyState message="No buyer requests submitted yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <>
                    <TableRow key={req.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpanded(expanded === req.id ? null : req.id)}>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{req.users?.full_name ?? "N/A"}</TableCell>
                      <TableCell>{req.customers?.store_name ?? "N/A"}</TableCell>
                      <TableCell>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                          {req.buyer_request_items?.length || 0} items
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${statusStyles[req.status] || "bg-gray-100 text-gray-600"}`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {req.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 text-green-600 hover:bg-green-50 gap-1" disabled={actionLoading === req.id} onClick={() => handleStatusChange(req.id, "fulfilled")}>
                              <CheckCircle className="w-3.5 h-3.5" /> Fulfill
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-red-600 hover:bg-red-50 gap-1" disabled={actionLoading === req.id} onClick={() => handleStatusChange(req.id, "rejected")}>
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded === req.id && req.buyer_request_items?.length > 0 && (
                      <TableRow key={`${req.id}-expanded`} className="bg-gray-50/70">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Requested Products</p>
                            {req.buyer_request_items.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-sm">{item.products?.name || "Unknown Product"}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-bold">Qty: {item.quantity}</span>
                                  {item.notes && <span className="text-gray-400 italic text-xs">"{item.notes}"</span>}
                                </div>
                              </div>
                            ))}
                            {req.notes && <p className="text-xs text-gray-500 italic mt-2">Note: "{req.notes}"</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
