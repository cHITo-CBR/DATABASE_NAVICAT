"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { getBuyerProducts, getProductFilters, toggleFavorite, getUserFavorites } from "@/app/actions/buyer-actions";
import { getCurrentUser } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function MobileShopProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({ categories: [], brands: [] });
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);

  useEffect(() => {
    getCurrentUser().then(session => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        getUserFavorites(session.user.id).then(setUserFavorites);
      }
    });

    Promise.all([getBuyerProducts(), getProductFilters()]).then(([prods, fils]) => {
      setProducts(prods); 
      setFilters(fils); 
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getBuyerProducts(search || undefined, categoryId, undefined).then(setProducts);
  }, [search, categoryId]);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;

    const res = await toggleFavorite(userId, productId);
    if (res.success) {
      setUserFavorites(prev => 
        res.isFavorite 
          ? [...prev, productId] 
          : prev.filter(id => id !== productId)
      );
    }
  };

  return (
    <div className="pb-8 pt-2">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
          Shop Products
        </h1>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Browse and book your items
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text"
          placeholder="Search for unique pieces..." 
          className="w-full bg-[#F1F3F5] text-sm text-gray-700 rounded-full py-3.5 pl-11 pr-4 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#4B5E65]/20 transition-all"
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2 -mx-6 px-6">
        <button 
          onClick={() => setCategoryId(undefined)}
          className={cn(
            "px-5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors",
            categoryId === undefined 
              ? "bg-[#4B5E65] text-white shadow-md shadow-[#4B5E65]/20" 
              : "bg-white text-gray-600 border border-gray-100"
          )}
        >
          All Items
        </button>
        {filters.categories.map((c: any) => (
          <button 
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={cn(
              "px-5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors",
              categoryId === c.id 
                ? "bg-[#4B5E65] text-white shadow-md shadow-[#4B5E65]/20" 
                : "bg-white text-gray-600 border border-gray-100"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="w-full aspect-[4/5] bg-gray-200 rounded-[28px] mb-3"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded-md mb-1.5"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded-md mb-3"></div>
              <div className="w-full h-10 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-[15px] font-medium text-gray-500">No products found</p>
        </div>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {products.map((p) => {
            const imgUrl = p.product_images?.find((img: any) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url;
            const isFav = userFavorites.includes(p.id);
            const variant = p.product_variants?.[0];
            
            return (
              <div key={p.id} className="flex flex-col group">
                <div className="relative w-full aspect-[4/5] rounded-[28px] overflow-hidden mb-3 bg-[#1A1D20]">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-500 font-bold text-xs shadow-inner">
                        {p.name.substring(0, 1)}
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={(e) => handleToggleFavorite(e, p.id)}
                    className={cn(
                      "absolute top-3 right-3 w-8 h-8 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-90",
                      isFav ? "bg-red-500 text-white" : "bg-white/10 text-white hover:text-white"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
                  </button>

                  {/* Badges for Packaging/Net Weight */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                    {variant?.packaging_type && (
                      <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                        {variant.packaging_type}
                      </span>
                    )}
                    {p.total_packaging && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                        {p.total_packaging} Cases
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-1">
                  <h3 className="font-bold text-[14px] leading-tight text-gray-900 mb-0.5 line-clamp-1">
                    {p.name}
                  </h3>
                  
                  {p.net_weight && (
                    <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-tight">
                      {p.net_weight}
                    </p>
                  )}
                  
                  {variant?.unit_price && (
                    <p className="text-[14px] font-bold text-[#4B5E65] mb-3">
                      ₱{Number(variant.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                
                <Link 
                  href={`/customers/catalog/products/${p.id}`}
                  className="mt-auto w-full py-3 bg-[#EEF0F2] hover:bg-[#E2E5E9] text-[#4B5E65] text-[13px] font-bold rounded-[18px] text-center transition-all active:scale-[0.98]"
                >
                  Book Now
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

