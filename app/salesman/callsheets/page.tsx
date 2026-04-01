"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, ChevronRight, Loader2, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import Link from "next/link";
import { getSalesmanCallsheets } from "@/app/actions/callsheets";
import { getCurrentUser } from "@/app/actions/auth";

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: Edit, color: "text-gray-500", bg: "bg-gray-100" },
  submitted: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  approved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function SalesmanCallsheetsPage() {
  const [callsheets, setCallsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      if (userId) {
        const result = await getSalesmanCallsheets(userId);
        setCallsheets(result.success ? result.data || [] : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading callsheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Callsheets</h2>
          <p className="text-xs text-gray-400 font-medium">{callsheets.length} rounds recorded</p>
        </div>
        <Link href="/salesman/callsheets/new">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#005914] to-[#00802b] flex items-center justify-center text-white shadow-lg shadow-green-900/20 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {callsheets.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No callsheets yet</p>
          <Link href="/salesman/callsheets/new" className="text-[#005914] text-sm font-bold mt-2 inline-block">Create your first callsheet →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {callsheets.map((cs, i) => {
            const status = statusConfig[cs.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <Card key={cs.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]" style={{ animationDelay: `${i * 50}ms` }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${status.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{cs.customers?.store_name || "Unknown Store"}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400">R{cs.round_number || 1}</span>
                      <span className="text-gray-200">•</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(cs.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${status.bg} ${status.color}`}>
                      {cs.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-200" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
