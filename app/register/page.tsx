"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Building, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { submitStoreRegistration } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const res = await submitStoreRegistration(null, formData);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.success) {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 selection:bg-green-100 selection:text-green-900">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">

        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900">FlowStock<span className="text-green-700">.ai</span></span>
            </Link>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Partner with Us</h1>
            <p className="text-gray-500 mt-2 text-sm">Register your store to access direct booking and inventory channels.</p>
          </div>

          {success ? (
            <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registration Complete!</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Registration submitted successfully. Awaiting admin approval. Our team will review your application shortly.
              </p>
              <Link href="/">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-6 font-bold">
                  Return to Home
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="store_name" className="text-xs font-bold uppercase tracking-wider text-gray-500">Store Name</Label>
                  <Input id="store_name" name="store_name" required className="bg-gray-50 border-gray-200 h-11" placeholder="Sari-Sari Central" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Person</Label>
                  <Input id="contact_person" name="contact_person" required className="bg-gray-50 border-gray-200 h-11" placeholder="Maria Clara" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</Label>
                  <Input id="email" name="email" type="email" required className="bg-gray-50 border-gray-200 h-11" placeholder="maria@store.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500">Account Password</Label>
                  <Input id="password" name="password" type="password" required className="bg-gray-50 border-gray-200 h-11" placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone Number</Label>
                <Input id="phone_number" name="phone_number" required className="bg-gray-50 border-gray-200 h-11" placeholder="+63 9XX XXX XXXX" />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
                  <MapPin className="w-4 h-4 text-green-700" /> Location Details
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-gray-500">Street Address</Label>
                  <Input id="address" name="address" required className="bg-gray-50 border-gray-200 h-11" placeholder="123 Mabini St. Brgy. San Jose" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-gray-500">City / Municipality</Label>
                    <Input id="city" name="city" required className="bg-gray-50 border-gray-200 h-11" placeholder="Pasig City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-xs font-bold uppercase tracking-wider text-gray-500">Region</Label>
                    <Input id="region" name="region" required className="bg-gray-50 border-gray-200 h-11" placeholder="NCR" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-6 font-bold shadow-lg shadow-green-900/10 mt-6 transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
              </Button>
            </form>
          )}

        </div>
        <div className="bg-gray-50 py-6 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium pb-2">
            Already have an account? <Link href="/login" className="text-green-700 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
