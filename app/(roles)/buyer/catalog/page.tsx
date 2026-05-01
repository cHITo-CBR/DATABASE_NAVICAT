
"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/app/actions/products";
import { submitBuyerRequest } from "@/app/actions/buyer-requests";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Plus, Minus, Trash2, X, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function BuyerShopeeCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getProducts();
      setProducts(data);
    }
    load();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to request`);
  }

  function updateQuantity(id: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(item => item.id !== id));
  }

  async function handleSubmitRequest() {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
    const res = await submitBuyerRequest(items);
    
    if (res.success) {
      setCart([]);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      toast.error(res.error || "Failed to submit request");
    }
    setIsSubmitting(false);
    setIsCartOpen(false);
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Shopee Style Header */}
      <div className="bg-white sticky top-0 z-40 pb-6 pt-2 border-b mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Store<span className="text-orange-500">Mall</span></h1>
          </div>
          
          <div className="relative w-full md:w-[500px]">
             <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for items and brands..." 
                className="w-full bg-slate-100 border-none h-12 rounded-lg pl-12 focus-visible:ring-orange-500"
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
             <Button className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 h-10 rounded-md">Search</Button>
          </div>

          <div className="relative">
            <Button 
              variant="outline" 
              className="relative p-2 h-12 w-12 border-slate-200"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-6 w-6 text-slate-600" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl animate-in slide-in-from-top duration-300">
           <CheckCircle2 className="h-5 w-5" />
           <span className="font-bold">Request Submitted Successfully!</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
            <div className="relative aspect-square bg-slate-100">
              {product.image_url ? (
                <Image 
                  src={product.image_url} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300">
                   <ShoppingBag className="h-12 w-12" />
                </div>
              )}
              {product.total_cases < 5 && (
                <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg uppercase">
                  Few items left
                </div>
              )}
            </div>
            <CardHeader className="p-3 pb-0">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-1">
                 {product.brand_name || "Official Store"}
               </div>
               <h3 className="text-sm font-medium text-slate-800 line-clamp-2 min-h-[40px] leading-tight group-hover:text-orange-600 transition-colors">
                 {product.name}
               </h3>
            </CardHeader>
            <CardContent className="p-3 pt-2">
               <div className="flex items-baseline gap-1">
                 <span className="text-[10px] font-bold text-orange-500">₱</span>
                 <span className="text-lg font-bold text-orange-500">
                   {(product.packaging_price || 0).toLocaleString()}
                 </span>
               </div>
               <div className="text-[10px] text-slate-400 mt-1">
                  {product.packaging_type_name || "Per Case"}
               </div>
            </CardContent>
            <CardFooter className="p-3 pt-0">
               <Button 
                onClick={() => addToCart(product)}
                className="w-full bg-slate-50 hover:bg-orange-500 hover:text-white text-slate-800 border border-slate-100 hover:border-orange-500 text-xs font-bold h-9 rounded-md transition-all"
               >
                 Add to Request
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Shopee Style Side Cart */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
           <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                    <h2 className="text-xl font-black text-slate-800 uppercase italic">My Request List</h2>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                    <X className="h-6 w-6" />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                       <ShoppingBag className="h-20 w-20 mb-4" />
                       <p className="font-bold text-slate-800">Your request list is empty</p>
                       <p className="text-sm mt-1">Add some products from the catalog</p>
                    </div>
                 ) : (
                    cart.map((item) => (
                       <div key={item.id} className="flex gap-4 group">
                          <div className="relative h-20 w-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                             {item.image_url ? (
                               <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                             ) : (
                               <div className="flex items-center justify-center h-full text-slate-300">
                                  <ShoppingBag className="h-8 w-8" />
                               </div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                             <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">{item.brand_name || "Official"}</p>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center border rounded-md">
                                   <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="px-2 py-1 hover:bg-slate-50 text-slate-500"
                                   ><Minus className="h-3 w-3" /></button>
                                   <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                                   <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="px-2 py-1 hover:bg-slate-50 text-slate-500"
                                   ><Plus className="h-3 w-3" /></button>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                ><Trash2 className="h-4 w-4" /></button>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-slate-50 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Quantity</span>
                      <span className="text-xl font-black text-orange-600">{totalItems} Items</span>
                   </div>
                   <Button 
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase py-7 rounded-xl shadow-lg shadow-orange-200 transition-all text-base"
                   >
                     {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Product Request"}
                   </Button>
                   <p className="text-[10px] text-center text-slate-400 font-medium">
                     * This is a request. Our team will review and approve it shortly.
                   </p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
