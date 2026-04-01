"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, Info, AlertTriangle, ChevronRight } from "lucide-react";

export default function SalesmanNotificationsPage() {
  const [notifications] = useState<any[]>([]);

  // Placeholder — in production, fetch from a notifications table
  const sampleNotifications = [
    { id: 1, title: "Callsheet Approved", body: "Round 3 for Store ABC has been approved by admin.", type: "success", date: new Date().toISOString() },
    { id: 2, title: "New Product Added", body: "Century Tuna Flakes in Oil 155g is now available.", type: "info", date: new Date().toISOString() },
    { id: 3, title: "Booking Rejected", body: "Order #1024 was cancelled due to insufficient stock.", type: "warning", date: new Date().toISOString() },
  ];

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Notifications</h2>
        <p className="text-xs text-gray-400 font-medium">Stay updated with admin responses</p>
      </div>

      <div className="space-y-3">
        {sampleNotifications.map((n) => {
          const config = typeConfig[n.type] || typeConfig.info;
          const Icon = config.icon;
          return (
            <Card key={n.id} className="border-0 shadow-sm rounded-2xl ring-1 ring-gray-50 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-[0.98]">
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-gray-300 mt-2 font-medium">
                    {new Date(n.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sampleNotifications.length === 0 && (
        <div className="py-16 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
