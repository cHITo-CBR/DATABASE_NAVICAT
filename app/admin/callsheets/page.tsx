"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2, Inbox, CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { getAllCallsheets, updateCallsheetStatus, getCallsheetWithItems } from "@/app/actions/callsheets";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminCallsheetsPage() {
  const [callsheets, setCallsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    const data = await getAllCallsheets();
    setCallsheets(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    await updateCallsheetStatus(id, status);
    await load();
    setActionLoading(null);
  }

  async function handleView(id: string) {
    setDetailLoading(true);
    setDetailOpen(true);
    const result = await getCallsheetWithItems(id);
    setDetail(result.success ? result.data : null);
    setDetailLoading(false);
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Callsheet Management</h1>
        <p className="text-gray-500 text-sm">Review and approve/reject salesman callsheets from the field.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: callsheets.length, color: "text-gray-900" },
          { label: "Submitted", value: callsheets.filter(c => c.status === "submitted").length, color: "text-blue-600" },
          { label: "Approved", value: callsheets.filter(c => c.status === "approved").length, color: "text-green-600" },
          { label: "Rejected", value: callsheets.filter(c => c.status === "rejected").length, color: "text-red-600" },
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
          <CardTitle className="text-lg font-semibold text-gray-800">All Callsheets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {callsheets.length === 0 ? (
            <EmptyState message="No callsheets submitted yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callsheets.map((cs) => (
                  <TableRow key={cs.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(cs.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{cs.users?.full_name ?? "N/A"}</TableCell>
                    <TableCell>{cs.customers?.store_name ?? "N/A"}</TableCell>
                    <TableCell><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">R{cs.round_number}</span></TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${statusStyles[cs.status] || "bg-gray-100 text-gray-600"}`}>
                        {cs.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => handleView(cs.id)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                      {cs.status === "submitted" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                            disabled={actionLoading === cs.id}
                            onClick={() => handleStatusChange(cs.id, "approved")}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                            disabled={actionLoading === cs.id}
                            onClick={() => handleStatusChange(cs.id, "rejected")}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Callsheet Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#005914]" /></div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Store:</span> <span className="font-medium">{detail.customers?.store_name}</span></div>
                <div><span className="text-gray-500">Round:</span> <span className="font-medium">{detail.round_number}</span></div>
                <div><span className="text-gray-500">Visit Date:</span> <span className="font-medium">{new Date(detail.visit_date).toLocaleDateString()}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${statusStyles[detail.status]}`}>{detail.status}</span></div>
              </div>
              {detail.remarks && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">"{detail.remarks}"</p>}
              {detail.callsheet_items?.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Packing</TableHead>
                      <TableHead>P3</TableHead>
                      <TableHead>Inv (CS)</TableHead>
                      <TableHead>Inv (Pcs)</TableHead>
                      <TableHead>SO</TableHead>
                      <TableHead>FO</TableHead>
                      <TableHead>Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.callsheet_items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.product_id?.substring(0,8)}...</TableCell>
                        <TableCell>{item.packing}</TableCell>
                        <TableCell>{item.p3}</TableCell>
                        <TableCell>{item.inventory_cs}</TableCell>
                        <TableCell>{item.inventory_pcs}</TableCell>
                        <TableCell>{item.suggested_order}</TableCell>
                        <TableCell className="font-bold text-[#005914]">{item.final_order}</TableCell>
                        <TableCell>{item.actual}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Could not load callsheet details.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
