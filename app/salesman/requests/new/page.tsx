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
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { getCustomers, type CustomerRow } from "@/app/actions/customers";
import { getProducts, type ProductRow } from "@/app/actions/products";
import { createBuyerRequest, type BuyerRequestItemInput } from "@/app/actions/buyer-requests";
import { getCurrentUser } from "@/app/actions/auth";

function BuyerRequestForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerIdParam = searchParams.get("customerId");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Form State
  const [customerId, setCustomerId] = useState(customerIdParam || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BuyerRequestItemInput[]>([
    { product_id: "", quantity: 1, notes: "" }
  ]);

  useEffect(() => {
    async function load() {
      const [custData, prodData, session] = await Promise.all([
        getCustomers(),
        getProducts(),
        getCurrentUser()
      ]);
      setCustomers(custData);
      setProducts(prodData);
      if (session?.user?.id) setUserId(session.user.id);
      setLoading(false);
    }
    load();
  }, []);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, notes: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BuyerRequestItemInput, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!customerId) return alert("Please select a store");
    if (items.some(it => !it.product_id)) return alert("Select products for all items");

    setSubmitting(true);
    const result = await createBuyerRequest({
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/salesman/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">New Buyer Request</h2>
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
            <h3 className="text-sm font-bold text-gray-700 uppercase">Requested Items</h3>
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
                        value={item.product_id}
                        onChange={(e) => updateItem(index, "product_id", e.target.value)}
                     >
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                     </select>
                     <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                  <div className="flex gap-3">
                     <div className="w-24">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase">Qty</Label>
                        <Input 
                           type="number" 
                           className="h-9 text-sm rounded-lg border-gray-100" 
                           value={item.quantity} 
                           onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                     </div>
                     <div className="flex-1">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase">Item Note</Label>
                        <Input 
                           placeholder="Special requirements..." 
                           className="h-9 text-xs rounded-lg border-gray-100" 
                           value={item.notes} 
                           onChange={(e) => updateItem(index, "notes", e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
         <CardContent className="p-4 space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">General Notes</Label>
            <Textarea 
               placeholder="Additional context for this request..." 
               className="min-h-[80px] bg-gray-50 border-0 rounded-xl text-sm"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
            />
         </CardContent>
      </Card>

      <Button 
         className="w-full h-14 rounded-2xl bg-[#005914] hover:bg-[#004a11] gap-2 font-bold shadow-lg"
         onClick={handleSubmit}
         disabled={submitting}
      >
         {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
         Submit Request
      </Button>
    </div>
  );
}

export default function NewBuyerRequestPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-[#005914]" />}>
      <BuyerRequestForm />
    </Suspense>
  );
}
