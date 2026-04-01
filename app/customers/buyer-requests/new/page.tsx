"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Plus, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getBuyerProducts, getCustomersForBuyer, createBuyerRequestFromBuyer } from "@/app/actions/buyer-actions";

interface RequestItem {
  product_id: string;
  product_name: string;
  quantity: number;
  notes: string;
}

export default function NewBuyerRequestPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RequestItem[]>([{ product_id: "", product_name: "", quantity: 1, notes: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [session, prods, custs] = await Promise.all([
        getCurrentUser(),
        getBuyerProducts(),
        getCustomersForBuyer(),
      ]);
      if (session?.user) setUserId(session.user.id);
      setProducts(prods);
      setCustomers(custs);
      setLoading(false);
    }
    load();
  }, []);

  const addItem = () => setItems([...items, { product_id: "", product_name: "", quantity: 1, notes: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    if (field === "product_id") {
      const p = products.find(p => p.id === value);
      updated[i].product_name = p?.name || "";
    }
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!customerId || items.every(i => !i.product_id)) return;
    setSaving(true);
    const result = await createBuyerRequestFromBuyer({
      userId,
      customer_id: customerId,
      notes: notes || undefined,
      items: items.filter(i => i.product_id).map(i => ({ product_id: i.product_id, quantity: i.quantity, notes: i.notes || undefined })),
    });
    if (result.success) router.push("/customers/buyer-requests");
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/customers/buyer-requests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#005914] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Request</h1>
        <p className="text-gray-500 text-sm">Select products and submit your interest.</p>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Customer / Account</label>
            <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select account...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.store_name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
            <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm resize-none" rows={2} placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Products</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1 rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 space-y-2">
                <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm" value={item.product_id} onChange={(e) => updateItem(i, "product_id", e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="w-24 bg-white rounded-lg" placeholder="Qty" />
                  <Input value={item.notes} onChange={(e) => updateItem(i, "notes", e.target.value)} className="flex-1 bg-white rounded-lg" placeholder="Remarks (optional)" />
                </div>
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={saving || !customerId} className="w-full bg-[#005914] hover:bg-[#004010] text-white rounded-xl h-12 font-bold">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
      </Button>
    </div>
  );
}
