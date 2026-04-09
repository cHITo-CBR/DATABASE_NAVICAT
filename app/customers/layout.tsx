import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Bell, UserCircle2 } from "lucide-react";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Enforce buyer role
  if (session.user.role !== "buyer") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-100 relative overflow-hidden flex flex-col font-sans selection:bg-gray-200">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#F8F9FB]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Image 
          src="/logo.png" 
          alt="Century Pacific Food" 
          width={120} 
          height={28} 
          className="h-7 w-auto object-contain" 
          priority 
        />
        <div className="flex items-center gap-4">
          <button className="relative text-gray-600 hover:text-gray-900 transition-colors">
            <Bell className="w-6 h-6 stroke-[1.5]" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full border border-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 hide-scrollbar flex flex-col">
        {children}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 md:absolute md:bottom-0 left-0 right-0 w-full md:max-w-md md:mx-auto z-50">
        <MobileBottomNav />
      </div>
    </div>
  );
}
