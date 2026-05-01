"use client";

/**
 * USER MANAGEMENT PAGE (ADMIN ONLY)
 * This interface controls system access and identity.
 * Key features:
 * - Direct Provisioning: Admins can manually create user accounts.
 * - RBAC (Role-Based Access Control): Assigning users to "admin", "salesman", or "supervisor" roles.
 * - Search & Filter: Quickly find users by identity or permission level.
 * - Membership Lifecycle: View status (pending/approved) of system users.
 */

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Loader2, Inbox } from "lucide-react";
import { getUsers, getRoles, createUser, type UserRow } from "@/app/actions/users";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * DATA RETRIEVAL LOGIC
   * Interacts with the users server action to fetch a filtered list of accounts.
   */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getUsers(search, roleFilter);
    setUsers(data);
    setLoading(false);
  }, [search, roleFilter]);

  // Initial load of roles for the dropdowns
  useEffect(() => {
    getRoles().then(setRoles);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  /**
   * USER CREATION HANDLER
   * Validates and submits new user data to the database.
   */
  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createUser(form);
    setSaving(false);
    if (result.success) {
      setDialogOpen(false); // Close modal on success
      loadUsers(); // Refresh the table
    } else {
      alert(result.error || "Failed to create user.");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER & USER CREATION DIALOG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage system users, assigned roles, and statuses.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#005914] hover:bg-[#00420f]">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with a role.</DialogDescription>
            </DialogHeader>
            {/* User Details Form */}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" required placeholder="e.g. Juan Dela Cruz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+63 9XX XXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select name="roleId" required>
                  <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">System Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <Card className="shadow-sm border-0 rounded-xl">
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              {/* SEARCH BAR */}
              <div className="flex gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-9 h-9 border-gray-200 bg-gray-50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* ROLE FILTER DROPDOWN */}
              <div className="flex items-center gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-800" />
                </div>
              ) : users.length === 0 ? (
                <EmptyState message="No users found" />
              ) : (
                /* USER DIRECTORY TABLE */
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                        <TableCell className="text-gray-500">{user.email}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-700/10 capitalize">
                            {user.role_name ?? "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {/* Visual status indicators (Badge-style) */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${
                            user.status === "approved" ? "bg-green-50 text-green-700 ring-green-600/20" :
                            user.status === "pending" ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" :
                            "bg-red-50 text-red-700 ring-red-600/20"
                          } capitalize`}>
                            {user.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

