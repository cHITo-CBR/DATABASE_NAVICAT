"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  CheckSquare,
  ClipboardList,
  FileText,
  Home,
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
  Users,
  Bell,
  Archive
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Scale } from "lucide-react";
import { getCurrentUser } from "@/app/actions/auth";

interface AppSidebarProps {
  basePath?: string; // e.g. "/admin", "/supervisor"
}

// Navigation items defined with relative paths (no leading prefix)
const navItems = [
  { title: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { title: "Account Approvals", path: "/approvals", icon: CheckSquare, adminOnly: true },
  { title: "User Management", path: "/users", icon: ShieldAlert, adminOnly: true },
  { title: "Team Monitoring", path: "/team", icon: Users, supervisorOnly: true },
  { title: "Customers", path: "/customers", icon: Users },
];

const catalogItems = [
  { title: "Products", path: "/catalog/products", icon: Package },
  { title: "Categories", path: "/catalog/categories", icon: Box },
  { title: "Brands", path: "/catalog/brands", icon: Tags },
  { title: "Units", path: "/catalog/units", icon: Scale },
  { title: "Packaging Types", path: "/catalog/packaging", icon: Box },
];

const operationsItems = [
  { title: "Inventory", path: "/inventory", icon: ClipboardList },
  { title: "Sales Transactions", path: "/sales", icon: ShoppingCart },
  { title: "Store Visits", path: "/visits", icon: MapPin },
];

const fieldSalesItems = [
  { title: "Callsheets", path: "/callsheets", icon: FileText },
  { title: "Buyer Requests", path: "/buyer-requests", icon: Package2 },
  { title: "Bookings", path: "/bookings", icon: ShoppingBag },
];

const analyticsItems = [
  { title: "Reports", path: "/reports", icon: BarChart3 },
  { title: "AI Insights", path: "/reports/ai-insights", icon: Sparkles, adminOnly: true },
];

const systemItems = [
  { title: "Notifications", path: "/notifications", icon: Bell },
  { title: "Audit Logs", path: "/audit", icon: FileText, adminOnly: true },
  { title: "Archives", path: "/archives", icon: Archive, adminOnly: true },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Profile", path: "/profile", icon: Users, supervisorOnly: true },
];

export function AppSidebar({ basePath = "/admin" }: AppSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ full_name?: string; email?: string; role?: string } | null>(null);

  React.useEffect(() => {
    getCurrentUser().then((session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });
  }, []);

  // Helper to prefix all paths with the basePath
  const prefixed = (path: string) => `${basePath}${path}`;

  const renderMenuItems = (items: typeof navItems) =>
    items.map((item) => {
      const url = prefixed(item.path);
      const isActive = pathname === url || pathname.startsWith(url + "/");
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className="font-medium text-gray-700 data-[active=true]:bg-[#E2EBE5] data-[active=true]:text-[#005914] data-[active=true]:font-bold hover:bg-gray-50"
          >
            <Link href={url}>
              <item.icon className="w-5 h-5 mr-1" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar variant="inset" className="border-r border-gray-200">
      <SidebarHeader className="bg-white px-4 py-4 md:py-6">
        <Link href={prefixed("/dashboard")} className="flex items-center gap-2">
          <Image src="/logo.png" alt="Century Pacific Food" width={140} height={32} className="h-8 w-auto object-contain" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#005914] font-semibold text-xs tracking-wider uppercase mb-1">
            Main
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems
              .filter((item) => {
                if (user?.role !== "admin" && (item as any).adminOnly) return false;
                if (user?.role !== "supervisor" && (item as any).supervisorOnly) return false;
                if (item.path === "/dashboard" && user?.role !== "admin" && user?.role !== "supervisor" && user?.role !== "salesman") return false;
                return true;
              })
              .map((item) => {
                const url = prefixed(item.path);
                const isActive = pathname === url || pathname.startsWith(url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="font-medium text-gray-700 data-[active=true]:bg-[#E2EBE5] data-[active=true]:text-[#005914] data-[active=true]:font-bold hover:bg-gray-50"
                    >
                      <Link href={url}>
                        <item.icon className="w-5 h-5 mr-1" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#005914] font-semibold text-xs tracking-wider uppercase mb-1">
            Product Catalog
          </SidebarGroupLabel>
          <SidebarMenu>{renderMenuItems(catalogItems)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#005914] font-semibold text-xs tracking-wider uppercase mb-1">
            Operations
          </SidebarGroupLabel>
          <SidebarMenu>{renderMenuItems(operationsItems)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#005914] font-semibold text-xs tracking-wider uppercase mb-1">
            Field Sales
          </SidebarGroupLabel>
          <SidebarMenu>{renderMenuItems(fieldSalesItems)}</SidebarMenu>
        </SidebarGroup>

        {(user?.role === "admin" || user?.role === "supervisor") && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#005914] font-semibold text-xs tracking-wider uppercase mb-1">
              Analytics & System
            </SidebarGroupLabel>
            <SidebarMenu>
              {[...analyticsItems, ...systemItems]
                .filter((item) => {
                  if (user?.role !== "admin" && (item as any).adminOnly) return false;
                  if (user?.role !== "supervisor" && (item as any).supervisorOnly) return false;
                  return true;
                })
                .map((item) => {
                  const url = prefixed(item.path);
                  const isActive = pathname === url || pathname.startsWith(url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="font-medium text-gray-700 data-[active=true]:bg-[#E2EBE5] data-[active=true]:text-[#005914] data-[active=true]:font-bold hover:bg-gray-50"
                      >
                        <Link href={url}>
                          <item.icon className="w-5 h-5 mr-1" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#005914] flex items-center justify-center text-white font-bold text-xs">
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "AD"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-tight">{user?.full_name ?? "Admin User"}</span>
            <span className="text-xs text-gray-500 font-medium">{user?.email ?? "Loading..."}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
