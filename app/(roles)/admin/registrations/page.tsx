import { getPendingStoreRegistrations } from "@/app/actions/users";
import StoreRegistrationRow from "../buyer-requests/StoreRegistrationRow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const registrations = await getPendingStoreRegistrations();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Registrations</h1>
          <p className="text-muted-foreground mt-1">Review and manage store registration applications.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Store Registrations</CardTitle>
          <CardDescription>Applications submitted via the public registration form.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!registrations || registrations.length === 0) ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              No pending store registrations at this time.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration: any) => (
                  <StoreRegistrationRow key={registration.user_id} registration={registration} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
