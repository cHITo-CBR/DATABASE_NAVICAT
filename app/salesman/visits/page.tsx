"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Navigation, ChevronRight } from "lucide-react";
import { getSalesmanVisits } from "@/app/actions/store-visits";
import { getCurrentUser } from "@/app/actions/auth";

export default function SalesmanVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      const userId = session?.user?.id;
      if (userId) {
        const result = await getSalesmanVisits(userId);
        setVisits(result.success ? result.data || [] : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 animate-pulse" />
          <p className="text-sm text-gray-400 font-medium">Loading visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Store Visits</h2>
        <p className="text-xs text-gray-400 font-medium">{visits.length} visits recorded</p>
      </div>

      {visits.length === 0 ? (
        <div className="py-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No visits recorded yet</p>
          <p className="text-[10px] text-gray-300 mt-1">Visit a store from the Stores tab to start</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <Card key={v.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center flex-shrink-0 ring-1 ring-teal-100">
                  <Navigation className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{v.customers?.store_name || "Unknown Store"}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(v.visit_date || v.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  {v.notes && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate italic">"{v.notes}"</p>
                  )}
                </div>
                {v.latitude && v.longitude && (
                  <div className="flex items-center gap-1 text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-1 rounded-full flex-shrink-0">
                    <MapPin className="w-3 h-3" /> GPS
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
