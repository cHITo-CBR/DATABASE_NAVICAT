"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Mail, Phone, Shield, Calendar, Users } from "lucide-react";
import { getCurrentUser } from "@/app/actions/auth";

export default function SupervisorProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((session) => { setUser(session?.user || null); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005914]" /></div>;
  if (!user) return <div className="text-center py-16 text-gray-400">Could not load profile</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Your supervisor account details.</p>
      </div>

      <Card className="shadow-sm border-0 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#005914] to-emerald-500 p-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-2xl">
              {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : "SV"}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{user.full_name || "Supervisor"}</h2>
              <p className="text-green-100 text-sm mt-1 flex items-center gap-1.5"><Shield className="w-4 h-4" /> Supervisor</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Phone</p>
                <p className="font-medium text-gray-900">{user.phone_number || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Role</p>
                <p className="font-medium text-gray-900 capitalize">{user.role || "supervisor"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Member Since</p>
                <p className="font-medium text-gray-900">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
