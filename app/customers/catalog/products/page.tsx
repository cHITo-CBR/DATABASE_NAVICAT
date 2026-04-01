"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search, Loader2, Filter } from "lucide-react";
import Link from "next/link";
import { getBuyerProducts, getProductFilters } from "@/app/actions/buyer-actions";

export default function BuyerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({ categories: [], brands: [] });
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [brandId, setBrandId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBuyerProducts(), getProductFilters()]).then(([prods, fils]) => {
      setProducts(prods); setFilters(fils); setLoading(false);
    });
  }, []);

  useEffect(() => {
    getBuyerProducts(search || undefined, categoryId, brandId).then(setProducts);
  }, [search, categoryId, brandId]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Catalog</h1>
        <p className="text-gray-500 text-sm">Browse available products and submit orders.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search products..." className="pl-10 bg-white border-gray-200 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700" value={categoryId || ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All Categories</option>
          {filters.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700" value={brandId || ""} onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All Brands</option>
          {filters.brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/customers/catalog/products/${p.id}`}>
              <Card className="shadow-sm border-0 rounded-xl hover:shadow-md transition-all cursor-pointer group h-full">
                <CardContent className="p-4">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {p.product_images?.find((img: any) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url ? (
                      <img src={p.product_images?.find((img: any) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    {p.brands?.name && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{p.brands.name}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {p.product_categories?.name && (
                        <span className="text-[10px] font-bold bg-green-50 text-[#005914] px-2 py-0.5 rounded-full">{p.product_categories.name}</span>
                      )}
                      {p.total_packaging && (
                        <span className="text-[10px] text-gray-400">{p.total_packaging}</span>
                      )}
                    </div>
                    {p.net_weight && <p className="text-[10px] text-gray-400 mt-1">Net Wt: {p.net_weight}</p>}
                    {p.product_variants?.[0]?.unit_price && (
                      <p className="text-sm font-bold text-[#005914] mt-2">₱{Number(p.product_variants[0].unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
