export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Manrope, Inter } from "next/font/google";
import { getBuyerOrders } from "@/app/actions/buyer-orders";
import { getSession } from "@/lib/session";
import {
  LayoutGrid,
  ReceiptText,
  Home,
  User,
  Package,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const statusBadgeStyles: Record<string, string> = {
  completed: "bg-blue-100 text-blue-700",
  processed: "bg-blue-100 text-blue-700",
  pending: "bg-orange-100 text-orange-700",
  processing: "bg-blue-50 text-blue-600",
  approved: "bg-blue-50 text-blue-600",
  shipped: "bg-blue-50 text-blue-600",
  delivered: "bg-blue-50 text-blue-600",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  processed: "Completed",
  approved: "Processing",
  shipped: "Processing",
  delivered: "Processing",
};

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const session = await getSession();
  if (!session || session.user.role !== "buyer") redirect("/login");

  const filter = (searchParams?.status || "all").toLowerCase();
  const orders = await getBuyerOrders(filter);

  const tabs = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div className={`${manrope.variable} ${inter.variable} font-[var(--font-inter)] bg-slate-50 min-h-screen pb-32 text-slate-900`}>
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-xl font-extrabold font-[var(--font-manrope)] tracking-tight text-blue-600">
            Vantage Pro
          </span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200" />
      </header>

      <main className="pt-20 px-6 max-w-md mx-auto">
        <section className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
            E-Commerce Portfolio
          </p>
          <h2 className="text-3xl font-extrabold font-[var(--font-manrope)] text-slate-900 leading-tight">
            Your Orders
          </h2>
          <p className="text-slate-500 text-sm mt-2 max-w-[280px]">
            Track, manage, and review your recent procurement activities.
          </p>
        </section>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === "all" ? "/customers/bookings" : `/customers/bookings?status=${tab.value}`}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-500 shadow-sm"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <Package className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="mt-4 text-lg font-bold text-slate-800">No orders yet</h3>
            <p className="text-sm text-slate-400 mt-2">
              Start shopping to create your first request.
            </p>
            <Link
              href="/customers/catalog/products"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusKey = order.status?.toLowerCase() || "pending";
              const badgeClass = statusBadgeStyles[statusKey] || "bg-slate-100 text-slate-600";
              const statusLabel = statusLabels[statusKey] || statusKey;
              const shortId = order.id.toString().slice(0, 6).toUpperCase();
              const itemLabel = order.primary_item || "Order Items";
              const itemCount = order.item_count || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-white/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                        Order ID: VP-{shortId}
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                      <p className="text-xs text-slate-500">{itemLabel}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-extrabold text-blue-600">
                        ₱{order.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button className="w-full py-3 rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center gap-2">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {(statusKey === "cancelled" || statusKey === "completed" || statusKey === "processed") && (
                      <Link
                        href="/customers/catalog/products"
                        className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center gap-2"
                      >
                        Reorder Items
                        <RefreshCcw className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl md:hidden">
        <Link
          href="/customers"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Home</span>
        </Link>
        <Link
          href="/customers/catalog/products"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Catalog</span>
        </Link>
        <Link
          href="/customers/bookings"
          className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-2xl px-5 py-2 scale-95 transition-transform"
        >
          <ReceiptText className="h-5 w-5 fill-blue-700" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Orders</span>
        </Link>
        <Link
          href="/customers/profile"
          className="flex flex-col items-center justify-center text-slate-400 px-5 py-2"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Account</span>
        </Link>
      </nav>
    </div>
  );
}
