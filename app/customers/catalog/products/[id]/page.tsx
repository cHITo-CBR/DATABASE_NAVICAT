"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Heart, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { getProductDetail } from "@/app/actions/buyer-actions";
import { getCurrentUser } from "@/app/actions/auth";
import Image from "next/image";

export default function MobileProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(s => setUser(s?.user));
    if (params.id) {
      getProductDetail(params.id as string).then((d) => { setProduct(d); setLoading(false); });
    }
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#4B5E65]" /></div>;
  if (!product) return <div className="text-center py-16 text-gray-400">Product not found</div>;

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url || product.product_images?.[0]?.image_url;
  const price = Number(product.product_variants?.[0]?.unit_price || 0);

  const handleBookNow = async () => {
    setBooking(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: user?.id,
          product_id: product.id,
          customer_name: user?.full_name,
          customer_contact: user?.email, // or phone if available
          quantity,
          price
        })
      });
      if (res.ok) {
        router.push("/customers/bookings");
      } else {
        alert("Failed to book item");
      }
    } catch (e) {
      alert("Error booking item");
    }
    setBooking(false);
  };

  return (
    <div className="pb-24 pt-2 flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/customers/catalog/products" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] bg-[#1A1D20] rounded-[32px] overflow-hidden mb-6 shadow-xl shadow-black/5">
        {primaryImage ? (
          <Image src={primaryImage} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl text-white/10 font-black">{product.name.substring(0,1)}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight flex-1 pr-4">
            {product.name}
          </h1>
          <span className="text-[22px] font-black text-[#556987]">
            ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {product.brands?.name && (
          <p className="text-[14px] text-gray-500 font-medium mb-4">
            {product.brands.name}
          </p>
        )}

        {product.description && (
           <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
             {product.description}
           </p>
        )}

        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-50 flex items-center justify-between mb-8">
          <span className="text-[14px] font-bold text-gray-900 tracking-wide">Quantity</span>
          <div className="flex items-center gap-4 bg-[#F8F9FB] rounded-full p-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-4 text-center font-bold text-[14px] text-[#4B5E65]">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-auto pt-4">
        <button 
          onClick={handleBookNow}
          disabled={booking}
          className="w-full h-14 bg-[#4B5E65] text-white font-bold text-[15px] rounded-full shadow-lg shadow-[#4B5E65]/30 active:scale-[0.98] transition-transform flex items-center justify-center"
        >
          {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : `Book Now • $${(price * quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </button>
      </div>
    </div>
  );
}
