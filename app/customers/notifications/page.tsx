"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, Loader2, Inbox } from "lucide-react";
import { getNotifications, markNotificationRead, markAllRead, type NotificationRow } from "@/app/actions/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setNotifications(await getNotifications());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function handleMarkAllRead() {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">System alerts and messages.</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" className="text-gray-600" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="shadow-sm border-0 rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Inbox className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No notifications</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`shadow-sm rounded-xl relative overflow-hidden cursor-pointer transition-all ${
                n.is_read
                  ? "border border-gray-100 bg-gray-50/50"
                  : "border-l-4 border-l-[#005914] bg-white"
              }`}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <CardContent className={`p-4 flex gap-4 ${n.is_read ? "opacity-75" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  n.is_read ? "bg-gray-100" : "bg-green-50"
                }`}>
                  {n.is_read ? (
                    <Check className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Bell className="w-5 h-5 text-[#005914]" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`${n.is_read ? "font-medium" : "font-semibold"} text-gray-900`}>{n.title}</h4>
                  {n.message && <p className="text-gray-600 text-sm mt-1">{n.message}</p>}
                  <span className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(n.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
