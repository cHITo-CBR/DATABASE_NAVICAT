"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, FileText, ShoppingBag, Clock, ChevronRight, Loader2, ArrowLeft, Mail, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSalesmanDetail } from "@/app/actions/supervisor-actions";

export default function SalesmanDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"visits" | "callsheets" | "requests" | "bookings">("visits");

  useEffect(() => {
    if (params.id) {
      getSalesmanDetail(params.id as string).then((d) => { setData(d); setLoading(false); });
    }
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  }

  if (!data?.profile) {
    return <div className="text-center py-16 text-gray-400">Salesman not found</div>;
  }

  const { profile, visits, callsheets, requests, bookings } = data;
  const tabs = [
    { key: "visits", label: "Visits", count: visits.length, icon: MapPin },
    { key: "callsheets", label: "Callsheets", count: callsheets.length, icon: FileText },
    { key: "requests", label: "Requests", count: requests.length, icon: ShoppingBag },
    { key: "bookings", label: "Bookings", count: bookings.length, icon: Clock },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link href="/supervisor/team" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005914] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Team
      </Link>

      {/* Profile Header */}
      <Card className="shadow-sm border-0 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#005914] to-emerald-500 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-xl">
              {profile.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <div className="flex items-center gap-4 mt-1 text-green-100 text-sm">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                {profile.phone_number && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone_number}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white flex items-center gap-6 text-sm">
          <div><span className="text-gray-400">Status:</span> <span className="font-bold text-green-600">{profile.status}</span></div>
          <div><span className="text-gray-400">Joined:</span> <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span></div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#005914] text-[#005914]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-0">
          {activeTab === "visits" && (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow><TableHead>Store</TableHead><TableHead>Date</TableHead><TableHead>Notes</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {visits.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-400">No visits recorded</TableCell></TableRow> : visits.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.customers?.store_name || "—"}</TableCell>
                    <TableCell>{new Date(v.visit_date || v.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-gray-500 truncate max-w-[200px]">{v.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {activeTab === "callsheets" && (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow><TableHead>Store</TableHead><TableHead>Round</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {callsheets.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No callsheets</TableCell></TableRow> : callsheets.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.customers?.store_name || "—"}</TableCell>
                    <TableCell>R{c.round_number || 1}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        c.status === "approved" ? "bg-green-50 text-green-700" :
                        c.status === "submitted" ? "bg-blue-50 text-blue-700" :
                        c.status === "rejected" ? "bg-red-50 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{c.status}</span>
                    </TableCell>
                    <TableCell>{new Date(c.visit_date || c.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {activeTab === "requests" && (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow><TableHead>Store</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No requests</TableCell></TableRow> : requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.customers?.store_name || "—"}</TableCell>
                    <TableCell>{r.buyer_request_items?.length || 0} items</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        r.status === "fulfilled" ? "bg-green-50 text-green-700" :
                        r.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{r.status}</span>
                    </TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {activeTab === "bookings" && (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow><TableHead>Store</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No bookings</TableCell></TableRow> : bookings.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.customers?.store_name || "—"}</TableCell>
                    <TableCell className="text-right font-bold">₱{(b.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        b.status === "completed" ? "bg-green-50 text-green-700" :
                        b.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{b.status}</span>
                    </TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
