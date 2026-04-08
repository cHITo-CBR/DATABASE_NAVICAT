import { DashboardHeader } from "@/components/dashboard-header";
import { CustomerCard } from "@/components/dashboard-cards";
import { getCustomers } from "@/app/actions/customers";
import { Search, UserPlus } from "lucide-react";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader 
        title="Customers" 
        subtitle="Manage your buyer network" 
      />

      {/* Search and Action Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search buyers..." 
            className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-green-100 transition-all shadow-sm"
          />
        </div>
        <button className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700 transition-colors shrink-0">
          <UserPlus className="h-6 w-6" />
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white border border-gray-50 px-5 py-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-bold text-gray-800">{customers.length} Total</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white border border-gray-50 px-5 py-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-bold text-gray-800">4 New This Week</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white border border-gray-50 px-5 py-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
          <span className="text-sm font-bold text-gray-800">12 Active Calls</span>
        </div>
      </div>

      {/* Customers List */}
      <div className="flex flex-col gap-4">
        {customers.map((customer) => (
          <CustomerCard 
            key={customer.id}
            name={customer.contact_person ?? customer.store_name}
            storeName={customer.store_name}
            email={customer.email ?? "No email"}
            phone={customer.phone ?? undefined}
            joinedDate={customer.created_at}
            className="hover:border-green-100 transition-colors"
          />
        ))}
        
        {customers.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-gray-900">No customers found</h3>
            <p className="text-sm text-gray-500 max-w-[200px] mt-1">Start by adding your first buyer to the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
