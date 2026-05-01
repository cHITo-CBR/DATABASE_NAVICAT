import { query } from "@/lib/db-helpers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminApprovalClient from "./AdminApprovalClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  role_name: string;
}

export default async function AdminApprovalsPage() {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  // Fetch pending users
  let users: UserWithRole[] = [];
  try {
    const rows = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.created_at, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.status = 'pending'
       ORDER BY u.created_at DESC`
    );

    users = rows.map((u: any) => ({
      ...u,
      role_name: u.role_name || "unknown",
    }));
  } catch (error: any) {
    return <div className="p-8 text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage pending user registrations</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Review and approve or reject new user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!users || users.length === 0) ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              No pending approvals at this time.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <AdminApprovalClient key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
