"use client";

import { useEffect, useState } from "react";
import { Loader2, User, Bell, Clock, HelpCircle, LogOut, ChevronRight, Edit2 } from "lucide-react";
import { getCurrentUser, logoutUser } from "@/app/actions/auth";
import { getBuyerProfile, getBuyerOrders } from "@/app/actions/buyer-actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MobileUserProfilePage() {
  const [data, setData] = useState<any>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const session = await getCurrentUser();
      if (session?.user) {
        const profile = await getBuyerProfile(session.user.id);
        const orders = await getBuyerOrders(session.user.id);
        setData(profile);
        setOrdersCount(orders.length);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="pb-8 pt-6 space-y-6">
        <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
          <div className="w-32 h-5 bg-gray-200 rounded-md mb-2"></div>
          <div className="w-48 h-3 bg-gray-200 rounded-md mb-8"></div>
          <div className="flex gap-4 w-full">
            <div className="flex-1 h-20 bg-gray-200 rounded-[20px]"></div>
            <div className="flex-1 h-20 bg-gray-200 rounded-[20px]"></div>
          </div>
        </div>
      </div>
    );
  }

  const user = data?.user || {};

  return (
    <div className="pb-8 pt-6">
      {/* Profile Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center text-center relative mb-8 border border-gray-50">
        <div className="relative mb-4">
          <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#F1F3F5] flex items-center justify-center">
            {user.profile_image_url ? (
               <Image src={user.profile_image_url} alt="Profile" fill className="object-cover" />
            ) : (
               <div className="text-4xl text-gray-300 font-bold">
                 {user.full_name ? user.full_name.substring(0, 1).toUpperCase() : "U"}
               </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#4B5E65] text-white rounded-full flex items-center justify-center shadow-md shadow-[#4B5E65]/30">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
          {user.full_name || "Guest User"}
        </h2>
        <p className="text-[13px] text-gray-500 font-medium mt-1 mb-6">
          {user.email || "guest@example.com"}
        </p>

        <div className="flex gap-4 w-full">
          <div className="flex-1 bg-[#F8F9FB] rounded-[20px] p-4 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
            <span className="text-[20px] font-bold text-[#4B5E65] leading-none mb-1">{ordersCount}</span>
            <span className="text-[10px] items-center text-gray-400 font-bold tracking-wider uppercase">Bookings</span>
          </div>
          <div className="flex-1 bg-[#F8F9FB] rounded-[20px] p-4 flex flex-col items-center justify-center text-center transition-transform active:scale-95">
            <span className="text-[20px] font-bold text-[#4B5E65] leading-none mb-1">{data?.favoritesCount || 0}</span>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Favorites</span>
          </div>
        </div>
      </div>

      {/* Settings & Preferences */}
      <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4 px-2">
        Settings & Preferences
      </h3>

      <div className="space-y-4 mb-8">
        {[
          { icon: User, title: "Account Settings", desc: "Personal info and security" },
          { icon: Bell, title: "Notification Preferences", desc: "Manage alerts and emails" },
          { icon: Clock, title: "Order History", desc: "Track your recent purchases" },
          { icon: HelpCircle, title: "Help Center", desc: "FAQs and support chat" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.015)] border border-gray-50 active:scale-95 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-[#F1F3F5] rounded-full flex items-center justify-center text-[#4B5E65] shrink-0">
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5">{item.title}</h4>
              <p className="text-[13px] text-gray-500 font-medium truncate">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF6B6B] text-white rounded-full font-bold text-[15px] shadow-lg shadow-[#FF6B6B]/25 active:opacity-80 transition-opacity"
      >
        <LogOut className="w-5 h-5 stroke-[2]" />
        Logout
      </button>

      <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 mb-8">
        VERSION 2.4.0 • FLOWSTOCK
      </p>
    </div>
  );
}
