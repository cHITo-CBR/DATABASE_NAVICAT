
import { query } from "@/lib/db-helpers";
import { createAppointment } from "@/app/actions/appointments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, Store, Tag } from "lucide-react";
import Link from "next/link";

export default async function NewAppointmentPage() {
  // Fetch data for selects
  const customers = await query("SELECT id, store_name FROM customers WHERE is_active = 1 ORDER BY store_name");
  const salesmen = await query("SELECT id, full_name FROM users WHERE role_id = 3 AND is_active = 1");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/visits">← Back to Schedule</Link>
        </Button>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <CardTitle className="text-2xl">New Visit Appointment</CardTitle>
          <CardDescription>Schedule a field representative to visit a store location.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form action={createAppointment} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_id" className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Target Store
                </Label>
                <select 
                  id="customer_id" 
                  name="customer_id" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.store_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesman_id" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Assign Salesman
                </Label>
                <select 
                  id="salesman_id" 
                  name="salesman_id" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select a representative...</option>
                  {salesmen.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input id="title" name="title" placeholder="e.g., Monthly Stock Check" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment_type" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Visit Type
                </Label>
                <select 
                  id="appointment_type" 
                  name="appointment_type" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="visit">Standard Visit</option>
                  <option value="demo">Product Demo</option>
                  <option value="collection">Payment Collection</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_at" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date & Time
                </Label>
                <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Any specific instructions for the salesman..." rows={4} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="reset">Reset</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Create Schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
