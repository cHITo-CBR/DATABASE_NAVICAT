"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveStoreRegistration, rejectStoreRegistration, deleteStoreRegistration } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check, Loader2, X } from "lucide-react";

export default function StoreRegistrationRow({ registration }: { registration: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    const res = await approveStoreRegistration(registration.user_id);
    setLoading(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    setLoading(true);
    const res = await rejectStoreRegistration(registration.user_id, reason.trim());
    setLoading(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    setRejectMode(false);
    setReason("");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this registration? This will remove the user and store record.")) return;
    setLoading(true);
    const res = await deleteStoreRegistration(registration.user_id);
    setLoading(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  };

  const locationParts = [registration.address, registration.city, registration.region].filter(Boolean);
  const locationText = locationParts.length ? locationParts.join(", ") : "Not provided";

  return (
      <TableCell className="font-medium">
        <div className="text-sm font-semibold text-slate-800">{registration.store_name || "Unnamed Store"}</div>
        <div className="text-xs text-muted-foreground">{registration.contact_person || registration.full_name}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{registration.email}</div>
        <div className="text-xs text-muted-foreground">{registration.phone_number || "No phone"}</div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {locationText}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(registration.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        {rejectMode ? (
          <div className="flex items-center justify-end gap-2">
            <Input
              type="text"
              placeholder="Reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 w-40 text-xs"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRejectMode(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Approve</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setRejectMode(true)}
              disabled={loading}
            >
              <X className="mr-1 h-3 w-3" /> Reject
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="ml-2"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
