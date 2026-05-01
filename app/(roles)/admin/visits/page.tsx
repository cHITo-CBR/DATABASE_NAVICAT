
import { Suspense } from "react";
import { getAppointments } from "@/app/actions/appointments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, MapPin, User, Clock } from "lucide-react";
import Link from "next/link";

export default async function AdminVisitsPage() {
  const appointments = await getAppointments();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B]">Visit Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage and track salesman route schedules and appointments.</p>
        </div>
        <Button asChild>
          <Link href="/admin/visits/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.filter((a: any) => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.filter((a: any) => a.status === 'pending').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Master Schedule</CardTitle>
          <CardDescription>All scheduled field operations across all sales representatives.</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <Calendar className="h-12 w-12 text-muted-foreground/20" />
              <h3 className="mt-4 text-lg font-semibold">No appointments scheduled</h3>
              <p className="text-muted-foreground">Start by creating a new visit schedule for your salesmen.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/admin/visits/new">Create First Appointment</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Customer / Store</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt: any) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(appt.scheduled_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{appt.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{appt.salesman_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{appt.appointment_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={appt.status === 'completed' ? 'success' : appt.status === 'pending' ? 'secondary' : 'outline'} className="capitalize">
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
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
