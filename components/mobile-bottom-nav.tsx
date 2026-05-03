"use client";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/overview",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/customers-list",
  },
  {
    label: "Products",
    icon: "/products-list",
  },
];

// Correcting hrefs based on user's request, but I'll use unique names to avoid conflicts for now
// unless I'm sure I should overwrite. User said app/customers/page.tsx.
// I'll name them exactly as asked and the user can decide.

const items = [
  { label: "Overview", icon: LayoutDashboard, href: "/overview" },
  { label: "Products", icon: ShoppingBag, href: "/products" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/customers")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[72px] border-t bg-white px-6 pb-2 safe-bottom">
      <div className="mx-auto flex h-full max-w-lg items-center justify-between">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-green-600" : "text-gray-400"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-green-50")} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
