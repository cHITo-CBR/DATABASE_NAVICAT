"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Plus, Inbox } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getBuyerOwnRequests } from "@/app/actions/buyer-actions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  open: "bg-blue-50 text-blue-700",
  contacted: "bg-indigo-50 text-indigo-700",
  converted: "bg-green-50 text-green-700",
  fulfilled: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      if (session?.user) {
        const data = await getBuyerOwnRequests(session.user.id);
        setRequests(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Requests</h1>
          <p className="text-gray-500 text-sm">{requests.length} requests submitted</p>
        </div>
        <Link href="/customers/buyer-requests/new">
          <Button className="bg-[#005914] hover:bg-[#004010] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Inbox className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm font-medium">No requests yet</p>
          <Link href="/customers/buyer-requests/new" className="text-[#005914] text-sm font-bold mt-2 inline-block">Submit your first request →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="shadow-sm border-0 rounded-xl hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{r.buyer_request_items?.length || 0} items requested</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                    <span>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {r.users?.full_name && <><span>·</span><span>Salesman: {r.users.full_name}</span></>}
                  </div>
                  {r.notes && <p className="text-xs text-gray-500 mt-1 truncate italic">{r.notes}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex-shrink-0 ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
