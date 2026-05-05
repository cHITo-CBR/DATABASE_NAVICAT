"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Package2,
  Settings,
  ShieldAlert,
  ShoppingCart,
  ShoppingBag,
  Sparkles,
  Tags,
  Target,
  Users,
  Archive,
  Scale,
  ChevronDown
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getCurrentUser } from "@/app/actions/auth";
import { getSidebarCounts, SidebarCounts } from "@/app/actions/sidebar";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppSidebarProps {
  basePath?: string;
}

const navItems = [
  { title: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { title: "Account Approvals", path: "/approvals", icon: CheckSquare, adminOnly: true },
  { title: "User Management", path: "/users", icon: ShieldAlert, adminOnly: true },
  { title: "Team Monitoring", path: "/team", icon: Users, supervisorOnly: true },
  { title: "Customers", path: "/customers", icon: Users, countKey: "customers" as const },
];

const catalogItems = [
  { title: "Products", path: "/catalog/products", icon: Package, countKey: "products" as const },
  { title: "Categories", path: "/catalog/categories", icon: Box, adminOnly: true },
  { title: "Brands", path: "/catalog/brands", icon: Tags, adminOnly: true },
  { title: "Units", path: "/catalog/units", icon: Scale, adminOnly: true },
  { title: "Packaging Types", path: "/catalog/packaging", icon: Box, adminOnly: true },
];

const operationsItems = [
  { title: "Inventory", path: "/inventory", icon: ClipboardList, countKey: "inventory" as const },
  { title: "Sales Transactions", path: "/sales", icon: ShoppingCart, countKey: "sales" as const },
  { title: "Quotas", path: "/quotas", icon: Target, adminOnly: true, countKey: "quotas" as const },
  { title: "Store Visits", path: "/visits", icon: MapPin, countKey: "visits" as const },
];

const fieldSalesItems = [
  { title: "Order Management", path: "/orders", icon: ShoppingBag, adminOnly: true, countKey: "orders" as const },
];

const analyticsItems = [
  { title: "Reports", path: "/reports", icon: BarChart3 },
];

const systemItems = [
  { title: "Archives", path: "/archives", icon: Archive, adminOnly: true },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Profile", path: "/profile", icon: Users, supervisorOnly: true },
];

const getSectionFromPath = (path: string): string => {
  if (path.includes("/catalog")) return "Product Catalog";
  if (path.includes("/inventory") || path.includes("/sales") || path.includes("/quotas") || path.includes("/visits")) return "Operations";
  if (path.includes("/bookings")) return "Field Sales";
  if (path.includes("/reports") || path.includes("/archives") || path.includes("/settings") || path.includes("/profile")) return "Analytics & System";
  return "Main";
};

export function AppSidebar({ basePath = "/admin" }: AppSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ full_name?: string; email?: string; role?: string } | null>(null);
  const [counts, setCounts] = React.useState<SidebarCounts | null>(null);
  const [activeSection, setActiveSection] = React.useState<string>("Main");

  React.useEffect(() => {
    setActiveSection(getSectionFromPath(pathname));
  }, [pathname]);

  React.useEffect(() => {
    getCurrentUser().then((session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    getSidebarCounts().then(setCounts);

    const interval = setInterval(() => {
      getSidebarCounts().then(setCounts);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const prefixed = (path: string) => `${basePath}${path}`;

  const sidebarSections = [
    { title: "Main", items: navItems },
    { title: "Product Catalog", items: catalogItems },
    { title: "Operations", items: operationsItems },
    { title: "Field Sales", items: fieldSalesItems },
    {
      title: "Analytics & System",
      items: [...analyticsItems, ...systemItems],
      requiresPermission: true
    },
  ];

  const renderSection = (section: typeof sidebarSections[0]) => {
    if (section.requiresPermission && user?.role !== "admin" && user?.role !== "supervisor") {
      return null;
    }

    const filteredItems = section.items.filter((item) => {
      if (user?.role !== "admin" && (item as any).adminOnly) return false;
      if (user?.role !== "supervisor" && (item as any).supervisorOnly) return false;
      if (user?.role === "salesman" && (item as any).hideFromSalesman) return false;
      if (item.path === "/dashboard" && user?.role !== "admin" && user?.role !== "supervisor" && user?.role !== "salesman") return false;
      return true;
    });

    if (filteredItems.length === 0) return null;

    return (
      <Collapsible key={section.title} defaultOpen className="group/collapsible">
        <SidebarGroup className="mb-0">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between w-full text-left bg-transparent py-2 px-1 cursor-pointer hover:bg-gray-50 rounded-md transition-colors select-none">
              <span className="text-[#005914] font-semibold text-[11px] tracking-wider uppercase opacity-70">
                {section.title}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#005914] opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-180" />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in">
            <div className="mt-1">
              <SidebarMenu>
                {filteredItems.map((item) => {
                  const url = prefixed(item.path);
                  const isActive = pathname === url || pathname.startsWith(url + "/");
                  const countKey = (item as any).countKey as keyof SidebarCounts | undefined;
                  const count = countKey && counts ? counts[countKey] : null;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="font-medium text-gray-700 select-none outline-none data-[active=true]:bg-[#E2EBE5] data-[active=true]:text-[#005914] data-[active=true]:font-bold hover:bg-gray-50 h-9"
                      >
                        <Link href={url} className="flex items-center justify-between w-full">
                          <span className="flex items-center">
                            <item.icon className="w-4 h-4 mr-2" />
                            <span className="text-sm">{item.title}</span>
                          </span>
                          {count !== null && count > 0 && (
                            <Badge variant="secondary" className="ml-auto bg-[#005914]/10 text-[#005914] text-[10px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center rounded-full">
                              {count}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar className="border-r border-gray-200 shadow-sm flex flex-col h-full bg-white">
      <SidebarHeader className="bg-white px-4 py-4 md:py-6 shrink-0 z-10 sticky top-0 border-b border-gray-100">
        <Link href={prefixed("/dashboard")} className="flex items-center gap-2">
          <Image src="/logo.png" alt="Century Pacific Food" width={140} height={32} className="h-8 w-auto object-contain" priority />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-2 custom-scrollbar">
        {sidebarSections.map(renderSection)}
      </SidebarContent>

      <SidebarFooter className="bg-white border-t border-gray-100 p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#005914] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-900 leading-tight truncate">{user?.full_name ?? "Admin User"}</span>
            <span className="text-xs text-gray-500 font-medium truncate">{user?.email ?? "Loading..."}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
