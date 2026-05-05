import Link from "next/link";
import { redirect } from "next/navigation";
import { Manrope, Inter } from "next/font/google";
import {
  BellRing,
  ChevronRight,
  Crown,
  Home,
  LayoutGrid,
  LifeBuoy,
  ReceiptText,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { getBuyerHomeData } from "@/app/actions/buyer-dashboard";

export const dynamic = "force-dynamic";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function CustomerHomePage() {
  const data = await getBuyerHomeData();
  if (!data) redirect("/login");

  const initials = data.userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className={`${manrope.variable} ${inter.variable} font-[var(--font-inter)] bg-slate-50 min-h-screen text-slate-900`}>
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#0061FF]" />
          <span className="text-xl font-extrabold font-[var(--font-manrope)] tracking-tight text-[#0061FF]">
            Vantage Pro
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <Link href="/customers" className="text-blue-600">Home</Link>
          <Link href="/customers/catalog/products" className="hover:text-blue-600 transition-colors">Catalog</Link>
          <Link href="/customers/bookings" className="hover:text-blue-600 transition-colors">Orders</Link>
          <Link href="/customers/profile" className="hover:text-blue-600 transition-colors">Account</Link>
        </div>

        <div className="h-10 w-10 rounded-full bg-[#0061FF]/10 flex items-center justify-center text-sm font-bold text-[#0061FF]">
          {initials || "B"}
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-6xl mx-auto">
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
            Welcome back,
          </p>
          <h1 className="text-3xl font-extrabold font-[var(--font-manrope)] text-slate-900 tracking-tight">
            {data.userName}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Truck className="h-4 w-4 text-[#0061FF]" />
            <span>{data.storeName || "Store not linked"}</span>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="col-span-2 bg-gradient-to-br from-[#0061FF] to-blue-500 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/30 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-1">
                Rewards Balance
              </p>
              <h2 className="text-4xl font-extrabold font-[var(--font-manrope)]">
                {data.pointsBalance.toLocaleString()} <span className="text-lg opacity-80">pts</span>
              </h2>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full w-fit">
                <Crown className="h-3.5 w-3.5" />
                <span>{data.membershipStatus} Member</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-15">
              <Sparkles className="h-24 w-24" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <BellRing className="h-5 w-5 text-[#0061FF]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Pending
            </p>
            <h3 className="text-2xl font-extrabold font-[var(--font-manrope)]">
              {data.pendingOrders.toString().padStart(2, "0")}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Truck className="h-5 w-5 text-[#0061FF]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Active
            </p>
            <h3 className="text-2xl font-extrabold font-[var(--font-manrope)]">
              {data.activeOrders.toString().padStart(2, "0")}
            </h3>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <section className="md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-[var(--font-manrope)]">
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link
                href="/customers/catalog/products"
                className="flex flex-col items-center gap-2"
              >
                <span className="w-full aspect-square rounded-3xl bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <LayoutGrid className="h-6 w-6 text-[#0061FF]" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Catalog
                </span>
              </Link>
              <Link href="/customers/bookings" className="flex flex-col items-center gap-2">
                <span className="w-full aspect-square rounded-3xl bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <ReceiptText className="h-6 w-6 text-[#0061FF]" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Track
                </span>
              </Link>
              <Link href="/customers/notifications" className="flex flex-col items-center gap-2">
                <span className="w-full aspect-square rounded-3xl bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <LifeBuoy className="h-6 w-6 text-[#0061FF]" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Support
                </span>
              </Link>
            </div>
          </section>

          <section className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-[var(--font-manrope)]">
                Recent Activity
              </h3>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#0061FF] cursor-pointer">
                See all
              </span>
            </div>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm border border-slate-100">
                  No recent activity yet.
                </div>
              ) : (
                data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 hover:border-blue-100 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      {activity.type === "points" ? (
                        <Crown className="h-5 w-5 text-[#0061FF]" />
                      ) : activity.type === "order" ? (
                        <Truck className="h-5 w-5 text-[#0061FF]" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-[#0061FF]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-400">
                        {activity.description || "System update"} ·{" "}
                        {new Date(activity.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl border-t border-slate-100/50">
        <Link
          href="/customers"
          className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-2xl px-5 py-2 scale-95"
        >
          <Home className="h-5 w-5 fill-blue-700" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-1">Home</span>
        </Link>
        <Link
          href="/customers/catalog/products"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-blue-500 transition-colors"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-1">Catalog</span>
        </Link>
        <Link
          href="/customers/bookings"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-blue-500 transition-colors"
        >
          <ReceiptText className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-1">Orders</span>
        </Link>
        <Link
          href="/customers/profile"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2 hover:text-blue-500 transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-1">Account</span>
        </Link>
      </nav>
    </div>
  );
}
