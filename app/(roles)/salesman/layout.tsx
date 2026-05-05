"use server";

/**
 * SALESMAN ROLE LAYOUT
 * This layout serves as the mobile-friendly shell for the salesman's interface.
 * Key responsibilities:
 * - Session Management: Validates that the agent is authenticated.
 * - Guard Rails: Ensures that only users with "salesman" permissions can access field tools.
 * - Layout Composition: Integrates the sidebar and top navigation tailored for field agents.
 */

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, LayoutGrid, ReceiptText, MapPin, Search, Sparkles, User, Users } from "lucide-react";

export default async function SalesmanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session verification: Required for every page in the /salesman route
  const session = await getSession();
  if (!session || session.user.role !== "salesman") {
    redirect("/login");
  }

  const initials = session.user.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-32">
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#005914]" />
          <span className="text-xl font-extrabold tracking-tight text-[#005914]">
            Field Force
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <Link href="/salesman/dashboard" className="hover:text-[#005914] transition-colors">Dashboard</Link>
          <Link href="/salesman/customers" className="hover:text-[#005914] transition-colors">Clients</Link>
          <Link href="/salesman/visits" className="hover:text-[#005914] transition-colors">Visits</Link>
          <Link href="/salesman/bookings" className="hover:text-[#005914] transition-colors">Orders</Link>
        </div>

        <div className="h-10 w-10 rounded-full bg-emerald-100/50 flex items-center justify-center text-sm font-bold text-[#005914]">
          {initials}
        </div>
      </header>

      <main className="pt-24 px-4 md:px-6 max-w-6xl mx-auto">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl border-t border-slate-100/50">
        <Link href="/salesman/dashboard" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-[#005914] transition-colors">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Home</span>
        </Link>
        <Link href="/salesman/customers" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-[#005914] transition-colors">
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Clients</span>
        </Link>
        <Link href="/salesman/visits" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-[#005914] transition-colors">
          <MapPin className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Visits</span>
        </Link>
        <Link href="/salesman/bookings" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-[#005914] transition-colors">
          <ReceiptText className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Orders</span>
        </Link>
      </nav>
    </div>
  );
}

