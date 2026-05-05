import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAllBookings } from "@/app/actions/sales";
import { getAllBuyerRequests } from "@/app/actions/buyer-requests";
import { OrderList } from "./order-list";

export const dynamic = "force-dynamic";

export default async function AdminOrderManagementPage() {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const [bookings, buyerRequests] = await Promise.all([
    getAllBookings(),
    getAllBuyerRequests(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="rounded-3xl border border-[#d8e6da] bg-gradient-to-br from-[#f7fbf7] via-white to-[#eef7ef] p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Management</h1>
          <p className="text-gray-500 mt-2 text-sm">Review, process, and manage incoming salesman orders and customer requests.</p>
        </div>
      </div>

      <OrderList requests={bookings} buyerRequests={buyerRequests} />
    </div>
  );
}
