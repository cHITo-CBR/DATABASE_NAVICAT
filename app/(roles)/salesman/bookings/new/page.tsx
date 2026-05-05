"use client";

/**
 * SALESMAN NEW BOOKING (ORDER) PAGE
 * This is the transactional heart of the salesman role.
 * It combines order creation with automated store visit logging.
 * Features:
 * - Dynamic Form: Add/remove multiple products to a single order.
 * - Stock Validation: Warns the user if they order more than the current available inventory.
 * - Automated Logging: Silently records a "Store Visit" when an order is placed.
 * - Pricing: Auto-fills prices based on product variant selection.
 */

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
import { createStoreVisit } from "@/app/actions/store-visits";
import { getCurrentUser } from "@/app/actions/auth";

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerIdParam = searchParams.get("customerId");

  // Lookup state
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [variants, setVariants] = useState<{ id: string; name: string; unit_price: number; sku: string | null; product_name?: string; total_cases?: number; packaging_price?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Transactional local state
  const [customerId, setCustomerId] = useState(customerIdParam || "");
  const [items, setItems] = useState<BookingItemInput[]>([
    { variant_id: "", quantity: 1, unit_price: 0 }
  ]);

  /**
   * DATA INITIALIZATION
   * Loads the current salesman profile, customer list, and active catalog.
   */
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

  // UI interaction: Appends a blank item row
  const addItem = () => {
    setItems([...items, { variant_id: "", quantity: 1, unit_price: 0 }]);
  };

  // UI interaction: Removes a specific item row
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /**
   * ITEM UPDATE HANDLER
   * This function manages the logic when a product or quantity is changed.
   * - SKU Matching: Identifies specific product variants.
   * - Auto-Pricing: Pulls the standard price from the catalog.
   * - Stock Guard: Prevents ordering more than is available in the warehouse.
   */
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
    // INVENTORY CHECK: Warns if quantity exceeds current case balance
    else if (field === "quantity") {
       const variant = variants.find(v => v.id === newItems[index].variant_id);
       if (variant && variant.total_cases !== undefined && value > variant.total_cases) {
          alert(`Warning: The requested quantity (${value} cases) exceeds the available stock (${variant.total_cases} cases) for ${variant.product_name}.`);
          newItems[index].quantity = variant.total_cases;
       }
    }
    
    setItems(newItems);
  };

  // Cumulative total for the bottom summary card
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  /**
   * SUBMISSION WORKFLOW
   * This is a multi-step operation:
   * 1. Automated Visit Logging: Marks that the salesman successfully reached the store.
   * 2. Order Submission: Pushes the booking items to the database.
   * 3. Navigation: Returns user to the dashboard upon success.
   */
  const handleSubmit = async () => {
    if (!customerId) return alert("Please select a store");
    if (items.some(it => !it.variant_id)) return alert("Select products for all items");

    setSubmitting(true);
    
    // STEP 1: Record visit automatically (Background task)
    try {
      await createStoreVisit({
        salesman_id: userId,
        customer_id: customerId,
        notes: "Visit recorded through order booking interface",
      });
    } catch(err) {
      console.error("Failed to record visit automatically:", err);
    }

    // STEP 2: Create the formal sales booking
    const result = await createBooking({
      salesman_id: userId,
      customer_id: customerId,
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
      {/* Navigation Header */}
      <div className="flex items-center gap-2">
        <Link href="/salesman/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold text-gray-900">New Booking (Order)</h2>
      </div>

      {/* CUSTOMER SELECTION AREA */}
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

      {/* LINE ITEMS LIST
          Each card represents a product variant being added to the order.
      */}
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
                        {variants.map(v => {
                          const stockLevel = v.total_cases !== undefined ? ` - ${v.total_cases} cases left` : "";
                          const label = v.name === "Standard" ? v.product_name : `${v.product_name} - ${v.name}`;
                          const packagingLabel = v.packaging_type_name ? ` (${v.packaging_type_name})` : "";
                          return (
                            <option key={v.id} value={v.id}>
                              {label}{packagingLabel} ({v.sku || "No SKU"}){stockLevel}
                            </option>
                          );
                        })}
                     </select>
                     <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                  <div className="flex gap-3 items-end">
                     <div className="w-24">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase">Qty (Cases)</Label>
                        <Input 
                           type="number" 
                           min="1"
                           className="h-9 text-sm rounded-lg border-gray-100 font-medium" 
                           value={item.quantity} 
                           onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                     </div>
                     <div className="flex-1 text-right flex flex-col justify-end pb-1.5 pt-2 border-t border-gray-100/0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Subtotal</p>
                        <p className="text-base font-black text-gray-900">₱{(item.quantity * item.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>

      {/* FINAL TRANSACTION SUMMARY */}
      <Card className="border-0 shadow-sm rounded-2xl bg-[#005914] text-white">
         <CardContent className="p-4 flex justify-between items-center">
            <p className="text-sm font-medium opacity-90 uppercase">Total Order Value</p>
            <p className="text-2xl font-black italic">₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
         </CardContent>
      </Card>

      {/* PRIMARY CTA: SUBMIT ORDER */}
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

/**
 * PAGE ENTRY POINT
 * Wrapped in Suspense to handle useSearchParams hook requirements for static generation.
 */
export default function NewBookingPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-[#005914]" />}>
      <BookingForm />
    </Suspense>
  );
}

