"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, CalendarDays, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "SHOP",
      icon: Store,
      href: "/customers/catalog/products",
      isActive: pathname.includes("/catalog/products"),
    },
    {
      label: "BOOKINGS",
      icon: CalendarDays,
      href: "/customers/bookings",
      isActive: pathname.includes("/bookings"),
    },
    {
      label: "PROFILE",
      icon: UserRound,
      href: "/customers/profile",
      isActive: pathname.includes("/profile"),
    },
  ];

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-4 pb-safe flex justify-between items-center rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)] relative z-50">
      {navItems.map((item) => {
        const active = item.isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 w-20 transition-transform active:scale-95"
          >
            <div
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300",
                active ? "bg-[#4B5E65] text-white shadow-md shadow-[#4B5E65]/20" : "text-gray-400 bg-transparent hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-wider transition-colors duration-300",
                active ? "text-[#4B5E65]" : "text-gray-400"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
