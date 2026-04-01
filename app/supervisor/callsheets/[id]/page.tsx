"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { getCallsheetDetail, reviewCallsheet } from "@/app/actions/supervisor-actions";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export default function CallsheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      getCallsheetDetail(params.id as string).then((d) => { setData(d); setLoading(false); });
    }
  }, [params.id]);

  const handleReview = async (status: "approved" | "rejected") => {
    setSaving(true);
    await reviewCallsheet(params.id as string, status, reviewNote || undefined);
    router.push("/supervisor/callsheets");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  if (!data) return <div className="text-center py-16 text-gray-400">Callsheet not found</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link href="/supervisor/callsheets" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005914] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Callsheets
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Callsheet Review</h1>
          <p className="text-gray-500 text-sm">Review the submission details below.</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase ${statusColors[data.status] || "bg-gray-100"}`}>{data.status}</span>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-400 font-medium">Salesman</p><p className="font-bold text-gray-900">{data.users?.full_name || "—"}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-teal-600" /></div>
            <div><p className="text-xs text-gray-400 font-medium">Store</p><p className="font-bold text-gray-900">{data.customers?.store_name || "—"}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Round {data.round_number || 1}</p>
              <p className="font-bold text-gray-900">{data.visit_date ? new Date(data.visit_date).toLocaleDateString() : "—"}</p>
              {data.period_start && data.period_end && <p className="text-[10px] text-gray-400">{new Date(data.period_start).toLocaleDateString()} — {new Date(data.period_end).toLocaleDateString()}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.remarks && (
        <Card className="shadow-sm border-0 rounded-xl bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-yellow-700 font-medium mb-1">Remarks</p>
            <p className="text-sm text-gray-700">{data.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800">Callsheet Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Packing</TableHead>
                <TableHead className="text-right">P3</TableHead>
                <TableHead className="text-right">IG</TableHead>
                <TableHead className="text-right">Inv CS</TableHead>
                <TableHead className="text-right">Inv PCS</TableHead>
                <TableHead className="text-right">SO</TableHead>
                <TableHead className="text-right">FO</TableHead>
                <TableHead className="text-right font-bold">Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.callsheet_items || []).length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">No items in this callsheet</TableCell></TableRow>
              ) : (
                (data.callsheet_items || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.products?.name || "—"}</TableCell>
                    <TableCell>{item.packing || item.products?.total_packaging || "—"}</TableCell>
                    <TableCell className="text-right">{item.p3 ?? 0}</TableCell>
                    <TableCell className="text-right">{item.ig ?? 0}</TableCell>
                    <TableCell className="text-right">{item.inventory_cs ?? 0}</TableCell>
                    <TableCell className="text-right">{item.inventory_pcs ?? 0}</TableCell>
                    <TableCell className="text-right">{item.suggested_order ?? 0}</TableCell>
                    <TableCell className="text-right">{item.final_order ?? 0}</TableCell>
                    <TableCell className="text-right font-bold text-[#005914]">{item.actual ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Actions */}
      {(data.status === "submitted" || data.status === "draft") && (
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">Review Actions</p>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#005914] focus:border-transparent"
              rows={3}
              placeholder="Add a supervisor note (optional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-3 mt-3">
              <Button onClick={() => handleReview("approved")} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-xl">
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button onClick={() => handleReview("rejected")} disabled={saving} variant="destructive" className="gap-2 rounded-xl">
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
