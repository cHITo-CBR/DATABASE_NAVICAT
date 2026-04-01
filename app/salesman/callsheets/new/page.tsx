"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ChevronLeft, 
  Loader2,
  Package,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { getCustomers, type CustomerRow } from "@/app/actions/customers";
import { getProducts, type ProductRow } from "@/app/actions/products";
import { createCallsheet, type CallsheetItemInput } from "@/app/actions/callsheets";
import { getCurrentUser } from "@/app/actions/auth";

// --- Components ---

function CallsheetForm() {
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
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<CallsheetItemInput[]>([
    { product_id: "", packing: "", p3: 0, ig: 0, inventory_cs: 0, inventory_pcs: 0, suggested_order: 0, final_order: 0, actual: 0 }
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
    setItems([...items, { product_id: "", packing: "", p3: 0, ig: 0, inventory_cs: 0, inventory_pcs: 0, suggested_order: 0, final_order: 0, actual: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CallsheetItemInput, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill packing if product is selected
    if (field === "product_id") {
       const product = products.find(p => p.id === value);
       if (product) {
          newItems[index].packing = product.total_packaging || "";
       }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (submitToAdmin = false) => {
    if (!customerId) return alert("Please select a store");
    if (items.some(it => !it.product_id)) return alert("All items must have a product selected");

    setSubmitting(true);
    const result = await createCallsheet({
      salesman_id: userId,
      customer_id: customerId,
      visit_date: visitDate,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
      round_number: roundNumber,
      remarks,
      items
    });

    if (result.success) {
      router.push("/salesman/callsheets");
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

  const selectedCustomer = customers.find(c => c.id === customerId);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/salesman/customers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">New Callsheet</h2>
      </div>

      {/* Header Info */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Store</Label>
            <select 
               className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#005914] focus:bg-white transition-all appearance-none"
               value={customerId}
               onChange={(e) => setCustomerId(e.target.value)}
            >
               <option value="">Select a store...</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.store_name}</option>
               ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Visit Date</Label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input 
                      type="date" 
                      className="pl-9 h-11 bg-gray-50 border-0 rounded-xl text-sm"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                   />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Round #</Label>
                <Input 
                   type="number" 
                   min="1" 
                   className="h-11 bg-gray-50 border-0 rounded-xl text-sm"
                   value={roundNumber}
                   onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Period Start</Label>
                <Input 
                   type="date" 
                   className="h-11 bg-gray-50 border-0 rounded-xl text-sm"
                   value={periodStart}
                   onChange={(e) => setPeriodStart(e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Period End</Label>
                <Input 
                   type="date" 
                   className="h-11 bg-gray-50 border-0 rounded-xl text-sm"
                   value={periodEnd}
                   onChange={(e) => setPeriodEnd(e.target.value)}
                />
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <div className="space-y-3">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Product Inventory & Orders</h3>
            <Button onClick={addItem} variant="ghost" size="sm" className="text-[#005914] text-xs font-bold gap-1 bg-green-50 rounded-lg">
               <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
         </div>

         <div className="space-y-4">
            {items.map((item, index) => (
               <Card key={index} className="border-0 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-gray-50/50">
                     <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                           <Package className="w-4 h-4 text-[#005914]" />
                        </div>
                        <Label className="text-xs font-bold text-gray-600">ITEM #{index + 1}</Label>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400 h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                     {/* Product Selector */}
                     <div className="space-y-1.5">
                        <select 
                           className="w-full h-10 px-3 bg-white border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-[#005914] transition-all"
                           value={item.product_id}
                           onChange={(e) => updateItem(index, "product_id", e.target.value)}
                        >
                           <option value="">Select Product...</option>
                           {products.map(p => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                        </select>
                     </div>

                     {/* Packing, P3, IG */}
                     <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-400 font-bold uppercase">Packing</Label>
                           <Input 
                              placeholder="e.g. 24x1" 
                              className="h-9 text-xs rounded-lg border-gray-100" 
                              value={item.packing} 
                              onChange={(e) => updateItem(index, "packing", e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-400 font-bold uppercase">P3</Label>
                           <Input 
                              type="number" 
                              className="h-9 text-xs rounded-lg border-gray-100" 
                              value={item.p3} 
                              onChange={(e) => updateItem(index, "p3", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-400 font-bold uppercase">IG</Label>
                           <Input 
                              type="number" 
                              className="h-9 text-xs rounded-lg border-gray-100" 
                              value={item.ig} 
                              onChange={(e) => updateItem(index, "ig", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                     </div>

                     {/* Inventory Counts */}
                     <div className="grid grid-cols-2 gap-3 bg-blue-50/30 p-3 rounded-xl border border-blue-50">
                        <div className="space-y-1">
                           <Label className="text-[10px] text-blue-600 font-bold uppercase">Inv (Case)</Label>
                           <Input 
                              type="number" 
                              className="h-10 text-sm font-bold rounded-lg border-blue-100" 
                              value={item.inventory_cs} 
                              onChange={(e) => updateItem(index, "inventory_cs", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] text-blue-600 font-bold uppercase">Inv (Pcs)</Label>
                           <Input 
                              type="number" 
                              className="h-10 text-sm font-bold rounded-lg border-blue-100" 
                              value={item.inventory_pcs} 
                              onChange={(e) => updateItem(index, "inventory_pcs", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                     </div>

                     {/* Orders */}
                     <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-500 font-bold uppercase">SO</Label>
                           <Input 
                              type="number" 
                              className="h-9 text-xs rounded-lg border-gray-100" 
                              value={item.suggested_order} 
                              onChange={(e) => updateItem(index, "suggested_order", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-500 font-bold uppercase">FO</Label>
                           <Input 
                              type="number" 
                              className="h-9 text-xs rounded-lg border-gray-100 font-bold text-[#005914]" 
                              value={item.final_order} 
                              onChange={(e) => updateItem(index, "final_order", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] text-gray-500 font-bold uppercase">Actual</Label>
                           <Input 
                              type="number" 
                              className="h-9 text-xs rounded-lg border-gray-100" 
                              value={item.actual} 
                              onChange={(e) => updateItem(index, "actual", parseFloat(e.target.value) || 0)}
                           />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>

      {/* Remarks */}
      <Card className="border-0 shadow-sm rounded-2xl">
         <CardContent className="p-4 space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Visit Remarks / Notes</Label>
            <Textarea 
               placeholder="Enter any additional observations from the store visit..." 
               className="min-h-[100px] bg-gray-50 border-0 rounded-xl text-sm resize-none"
               value={remarks}
               onChange={(e) => setRemarks(e.target.value)}
            />
         </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="grid grid-cols-2 gap-4">
         <Button 
            variant="outline" 
            className="h-14 rounded-2xl border-gray-200 text-gray-600 gap-2 font-bold"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
         >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Draft
         </Button>
         <Button 
            className="h-14 rounded-2xl bg-[#005914] hover:bg-[#004a11] shadow-lg shadow-green-900/10 gap-2 font-bold"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
         >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
            Submit
         </Button>
      </div>
    </div>
  );
}

export default function NewCallsheetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    }>
      <CallsheetForm />
    </Suspense>
  );
}
