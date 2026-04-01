import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Enforce supervisor role
  if (session.user.role !== "supervisor") {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar basePath="/supervisor" />
      <SidebarInset className="bg-[#F4F7F6]">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
