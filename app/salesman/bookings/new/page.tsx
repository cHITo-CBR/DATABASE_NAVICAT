"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Send, 
  ChevronLeft, 
  Loader2,
  Package,
  ShoppingBag,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { getCustomers, type CustomerRow } from "@/app/actions/customers";
import { getProductVariants } from "@/app/actions/products";
import { createBooking, type BookingItemInput } from "@/app/actions/sales";
import { getCurrentUser } from "@/app/actions/auth";

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerIdParam = searchParams.get("customerId");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [variants, setVariants] = useState<{ id: string; name: string; unit_price: number; sku: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Form State
  const [customerId, setCustomerId] = useState(customerIdParam || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BookingItemInput[]>([
    { variant_id: "", quantity: 1, unit_price: 0 }
  ]);

  useEffect(() => {
    async function load() {
      const [custData, varData, session] = await Promise.all([
        getCustomers(),
        getProductVariants(),
        getCurrentUser()
      ]);
      setCustomers(custData);
      setVariants(varData);
      if (session?.user?.id) setUserId(session.user.id);
      setLoading(false);
    }
    load();
  }, []);

  const addItem = () => {
    setItems([...items, { variant_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BookingItemInput, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill price if variant is selected
    if (field === "variant_id") {
       const variant = variants.find(v => v.id === value);
       if (variant) {
          newItems[index].unit_price = variant.unit_price || 0;
       }
    }
    
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleSubmit = async () => {
    if (!customerId) return alert("Please select a store");
    if (items.some(it => !it.variant_id)) return alert("Select products for all items");

    setSubmitting(true);
    const result = await createBooking({
      salesman_id: userId,
      customer_id: customerId,
      notes,
      items
    });

    if (result.success) {
      router.push("/salesman/dashboard");
    } else {
      alert("Error: " + result.error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <Link href="/salesman/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">New Booking (Order)</h2>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Store</Label>
            <select 
               className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#005914]"
               value={customerId}
               onChange={(e) => setCustomerId(e.target.value)}
            >
               <option value="">Select a store...</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.store_name}</option>
               ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase">Order Items</h3>
            <Button onClick={addItem} variant="ghost" size="sm" className="text-[#005914] text-xs font-bold gap-1 bg-green-50 rounded-lg">
               <Plus className="w-3.5 h-3.5" /> Add Product
            </Button>
         </div>

         {items.map((item, index) => (
            <Card key={index} className="border-0 shadow-sm rounded-2xl overflow-hidden">
               <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                     <select 
                        className="flex-1 h-10 px-3 bg-gray-50 border-0 rounded-lg text-sm"
                        value={item.variant_id}
                        onChange={(e) => updateItem(index, "variant_id", e.target.value)}
                     >
                        <option value="">Select Variant...</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.sku || "No SKU"})</option>
                        ))}
                     </select>
                     <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                  <div className="flex gap-3 items-end">
                     <div className="w-20">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase">Qty</Label>
                        <Input 
                           type="number" 
                           className="h-9 text-sm rounded-lg border-gray-100" 
                           value={item.quantity} 
                           onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                     </div>
                     <div className="flex-1">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase">Unit Price (₱)</Label>
                        <Input 
                           type="number" 
                           className="h-9 text-sm rounded-lg bg-gray-50 border-0" 
                           value={item.unit_price} 
                           onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                     </div>
                     <div className="text-right pb-2">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Subtotal</p>
                        <p className="text-sm font-bold">₱{(item.quantity * item.unit_price).toLocaleString()}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>

      <Card className="border-0 shadow-sm rounded-2xl bg-[#005914] text-white">
         <CardContent className="p-4 flex justify-between items-center">
            <p className="text-sm font-medium opacity-90 uppercase">Total Order Value</p>
            <p className="text-2xl font-black italic">₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
         </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-2xl">
         <CardContent className="p-4 space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Order Feedback</Label>
            <Textarea 
               placeholder="Special delivery instructions or order notes..." 
               className="min-h-[80px] bg-gray-50 border-0 rounded-xl text-sm"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
            />
         </CardContent>
      </Card>

      <Button 
         className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 gap-2 font-bold shadow-lg shadow-orange-900/10"
         onClick={handleSubmit}
         disabled={submitting}
      >
         {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
         Place Booking / Order
      </Button>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-[#005914]" />}>
      <BookingForm />
    </Suspense>
  );
}
