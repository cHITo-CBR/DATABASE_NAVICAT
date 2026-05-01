
"use server";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Enforcement for buyer role
  if (session.user.role !== "buyer") {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      {/* Sidebar for buyers might need restricted items, which AppSidebar likely handles via basePath */}
      <AppSidebar basePath="/buyer" />
      <SidebarInset className="bg-[#F8FAFC]">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
