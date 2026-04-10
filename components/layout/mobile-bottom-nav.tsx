"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Bookmark, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Shop",
    href: "/customers/catalog/products",
    icon: Search,
  },
  {
    name: "Bookings",
    href: "/customers/bookings",
    icon: Bookmark,
  },
  {
    name: "Profile",
    href: "/customers/profile",
    icon: User,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 pb-6 pt-3 safe-area-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 relative group",
                isActive ? "text-[#4B5E65]" : "text-gray-400"
              )}
            >
              <div className="relative">
                <tab.icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-300",
                    isActive ? "scale-110 stroke-[2.5]" : "scale-100 stroke-[2] group-hover:scale-105"
                  )}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              >
                {tab.name}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-[#4B5E65] rounded-full shadow-[0_4px_12px_rgba(75,94,101,0.3)] animate-in slide-in-from-bottom-1 duration-300" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
