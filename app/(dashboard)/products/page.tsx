import { DashboardHeader } from "@/components/dashboard-header";
import { ProductCard } from "@/components/dashboard-cards";
import { getProducts } from "@/app/actions/products";
import { Search, Filter, Plus } from "lucide-react";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader 
        title="Inventory" 
        subtitle="Browse and manage products" 
      />

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-green-100 shadow-sm"
            />
          </div>
          <button className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
            <Filter className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-6 px-6">
        {['All Items', 'Textiles', 'Electronics', 'Supplies', 'Others'].map((cat, i) => (
          <button 
            key={cat} 
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              i === 0 ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            name={product.name}
            category={product.category_name ?? "General"}
            price={Number(product.packaging_price) || 0}
            imageUrl={product.image_url ?? undefined}
            stock={product.total_cases}
            className="hover:scale-[1.02] transition-transform"
          />
        ))}

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-gray-900">Catalogue is empty</h3>
            <p className="text-sm text-gray-500 max-w-[200px] mt-1">Start adding your product inventory here.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-[100px] right-6 h-14 w-14 rounded-full bg-green-600 text-white shadow-xl shadow-green-200 flex items-center justify-center hover:bg-green-700 active:scale-90 transition-all z-40">
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
