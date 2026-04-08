import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col pb-[80px]">
      <main className="flex-1 overflow-x-hidden pt-2">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
