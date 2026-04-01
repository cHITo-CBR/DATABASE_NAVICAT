"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Building2, Phone, MapPin, Loader2, Inbox } from "lucide-react";
import {
  getCustomers, getCustomerStats, createCustomer, getSalesmenForAssignment,
  type CustomerRow, type CustomerStats,
} from "@/app/actions/customers";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalActive: 0, newThisMonth: 0 });
  const [salesmen, setSalesmen] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [custData, statsData, salesmenData] = await Promise.all([
      getCustomers(),
      getCustomerStats(),
      getSalesmenForAssignment(),
    ]);
    setCustomers(custData);
    setStats(statsData);
    setSalesmen(salesmenData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createCustomer(form);
    setSaving(false);
    if (result.success) {
      setDialogOpen(false);
      loadData();
    } else {
      alert(result.error || "Failed to create customer.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005914]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Records</h1>
          <p className="text-gray-500 text-sm">Manage all clients, store locations, and tracking.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#005914] hover:bg-[#00420f]">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Register a new customer or store.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="storeName">Store / Customer Name</Label>
                  <Input id="storeName" name="storeName" required placeholder="e.g. Mega Mart Grocery" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+63 9XX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="email@store.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="City" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="Full address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" placeholder="Region" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedSalesmanId">Assigned Sales Rep</Label>
                  <Select name="assignedSalesmanId">
                    <SelectTrigger><SelectValue placeholder="Select rep" /></SelectTrigger>
                    <SelectContent>
                      {salesmen.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 bg-[#005914] w-24 h-24 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalActive.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#005914]">+{stats.newThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-gray-800">Customer Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <EmptyState message="No customers yet" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Store / Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned Rep (User)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900">{c.store_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {c.phone ? (
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {c.phone}</div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {c.city || c.address ? (
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city || c.address}</div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-gray-900 font-medium">{c.users?.full_name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8">View Records</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
