"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Loader2, Inbox } from "lucide-react";
import { getStoreVisits, getVisitReport, type StoreVisitRow, type VisitReportDetail } from "@/app/actions/visits";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function StoreVisitsPage() {
  const [visits, setVisits] = useState<StoreVisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<VisitReportDetail | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    getStoreVisits().then((data) => {
      setVisits(data);
      setLoading(false);
    });
  }, []);

  async function handleViewReport(id: string) {
    setReportLoading(true);
    setReportOpen(true);
    const r = await getVisitReport(id);
    setReport(r);
    setReportLoading(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Store Visits Log</h1>
          <p className="text-gray-500 text-sm">Track field salesman visits, location check-ins, and discussed SKUs.</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Visit History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {visits.length === 0 ? (
            <EmptyState message="No store visits recorded yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Customer / Store</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Discussed SKUs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-500">
                      {new Date(v.visit_date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#005914]" />
                      {v.customers?.store_name ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-500">{v.users?.full_name ?? "N/A"}</TableCell>
                    <TableCell>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold w-fit">
                        {v.store_visit_skus?.length ?? 0} SKUs
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => handleViewReport(v.id)}>
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Visit Report</DialogTitle>
          </DialogHeader>
          {reportLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#005914]" />
            </div>
          ) : report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Store:</span> <span className="font-medium">{report.customers?.store_name}</span></div>
                <div><span className="text-gray-500">Sales Rep:</span> <span className="font-medium">{report.users?.full_name}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(report.visit_date).toLocaleString()}</span></div>
              </div>
              {report.notes && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{report.notes}</p>}
              {report.store_visit_skus.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Discussed SKUs</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Variant</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.store_visit_skus.map((sku) => (
                        <TableRow key={sku.id}>
                          <TableCell className="font-medium">{sku.product_variants?.name ?? "Unknown"}</TableCell>
                          <TableCell className="text-gray-500">{sku.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No SKUs discussed</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Could not load report.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
