"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Package, Tag, Box, Scale } from "lucide-react";
import Link from "next/link";
import { getProductDetail } from "@/app/actions/buyer-actions";

export default function BuyerProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getProductDetail(params.id as string).then((d) => { setProduct(d); setLoading(false); });
    }
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  if (!product) return <div className="text-center py-16 text-gray-400">Product not found</div>;

  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url || product.product_images?.[0]?.image_url;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/customers/catalog/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005914] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-gray-100 rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-20 h-20 text-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            {product.brands?.name && <p className="text-sm text-[#005914] font-bold uppercase tracking-wider">{product.brands.name}</p>}
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
            {product.description && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{product.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {product.product_categories?.name && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Tag className="w-4 h-4 text-gray-400" />
                <div><p className="text-[10px] text-gray-400">Category</p><p className="text-sm font-bold text-gray-900">{product.product_categories.name}</p></div>
              </div>
            )}
            {product.total_packaging && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Box className="w-4 h-4 text-gray-400" />
                <div><p className="text-[10px] text-gray-400">Packaging</p><p className="text-sm font-bold text-gray-900">{product.total_packaging}</p></div>
              </div>
            )}
            {product.net_weight && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Scale className="w-4 h-4 text-gray-400" />
                <div><p className="text-[10px] text-gray-400">Net Weight</p><p className="text-sm font-bold text-gray-900">{product.net_weight}</p></div>
              </div>
            )}
          </div>

          {/* Variants */}
          {product.product_variants?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">Available Variants</p>
              <div className="space-y-2">
                {product.product_variants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{v.name}</p>
                      <p className="text-[10px] text-gray-400">SKU: {v.sku || "—"}</p>
                    </div>
                    <p className="text-lg font-bold text-[#005914]">₱{Number(v.unit_price ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/customers/buyer-requests/new" className="flex-1">
              <Button className="w-full bg-[#005914] hover:bg-[#004010] text-white rounded-xl h-12 font-bold">
                Add to Request
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
